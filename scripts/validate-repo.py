#!/usr/bin/env python3
"""Validate Frontend Slides docs, template metadata, and plugin packaging."""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path
from typing import NoReturn

ROOT = Path(__file__).resolve().parents[1]
PRESET_COUNT = 24
SELECTION_INDEX = ROOT / "bold-template-pack" / "selection-index.json"
SCREENSHOT_DIR = ROOT / "assets" / "theme-screenshots"

REQUIRED_PRESET_DOCS = (ROOT / "README.md", ROOT / "SKILL.md")


def fail(message: str) -> NoReturn:
    raise ValueError(message)


def validate_presets() -> None:
    preset_file = ROOT / "STYLE_PRESETS.md"
    text = preset_file.read_text(encoding="utf-8")
    numbers = [int(value) for value in re.findall(r"^###\s+(\d+)\.", text, re.MULTILINE)]
    expected = list(range(1, PRESET_COUNT + 1))
    if numbers != expected:
        fail(f"Expected numbered presets 1–{PRESET_COUNT}; found {numbers}.")

    for doc in REQUIRED_PRESET_DOCS:
        contents = doc.read_text(encoding="utf-8")
        if f"{PRESET_COUNT} curated visual presets" not in contents:
            fail(f"{doc.relative_to(ROOT)} must state there are {PRESET_COUNT} curated visual presets.")


def validate_screenshot_assets() -> tuple[int, int]:
    png_signature = bytes((137, 80, 78, 71, 13, 10, 26, 10))
    screenshots = sorted(SCREENSHOT_DIR.glob("*.png"))
    if not screenshots:
        fail("No theme screenshots found in assets/theme-screenshots/.")

    for path in screenshots:
        if path.read_bytes()[:8] != png_signature:
            fail(f"Invalid PNG screenshot: {path.relative_to(ROOT)}")

    for name in ("README.md", "LICENSE"):
        if not (SCREENSHOT_DIR / name).is_file():
            fail(f"Missing screenshot attribution file: assets/theme-screenshots/{name}")

    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    referenced = set(re.findall(r'assets/theme-screenshots/([^"\s]+\.png)', readme))
    missing = sorted(name for name in referenced if not (SCREENSHOT_DIR / name).is_file())
    if missing:
        fail(f"README references missing theme screenshots: {missing}")
    if not referenced:
        fail("README does not display any local theme screenshots.")
    return len(screenshots), len(referenced)


def validate_template_index() -> int:
    try:
        index = json.loads(SELECTION_INDEX.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        fail(f"Cannot read template selection index: {error}")

    templates = index.get("templates")
    if not isinstance(templates, list):
        fail("selection-index.json must contain a templates array.")
    if index.get("template_count") != len(templates):
        fail(
            "selection-index.json template_count does not match its templates array "
            f"({index.get('template_count')} vs {len(templates)})."
        )

    slugs: set[str] = set()
    for entry in templates:
        for field in ("slug", "name", "preview_md", "design_md"):
            if not isinstance(entry.get(field), str) or not entry[field]:
                fail(f"Template entry is missing a valid {field!r}: {entry!r}")
        slug = entry["slug"]
        if slug in slugs:
            fail(f"Duplicate template slug: {slug}")
        slugs.add(slug)

        for field in ("preview_md", "design_md"):
            relative_path = Path(entry[field])
            if relative_path.is_absolute() or ".." in relative_path.parts:
                fail(f"Unsafe {field} path for {slug}: {entry[field]}")
            if not (ROOT / relative_path).is_file():
                fail(f"Missing {field} for {slug}: {entry[field]}")

    template_dirs = {
        path.name
        for path in (ROOT / "bold-template-pack" / "templates").iterdir()
        if path.is_dir()
    }
    if template_dirs != slugs:
        missing = sorted(slugs - template_dirs)
        unindexed = sorted(template_dirs - slugs)
        fail(f"Template folders and index disagree (missing folders: {missing}; unindexed folders: {unindexed}).")

    return len(templates)


def validate_plugin_package() -> None:
    script = ROOT / "scripts" / "sync-plugin-package.py"
    result = subprocess.run(
        [sys.executable, str(script), "--check"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        details = (result.stdout + result.stderr).strip()
        fail(details or "Plugin package parity check failed.")
    if result.stdout:
        print(result.stdout.strip())


def main() -> int:
    try:
        validate_presets()
        screenshot_count, displayed_count = validate_screenshot_assets()
        template_count = validate_template_index()
        validate_plugin_package()
    except (OSError, ValueError) as error:
        print(f"Repository validation failed: {error}", file=sys.stderr)
        return 1

    print(
        f"Repository validation passed: {PRESET_COUNT} presets, "
        f"{template_count} indexed templates, {screenshot_count} valid screenshot assets "
        f"({displayed_count} displayed in README), "
        "valid index JSON, and complete skill package."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
