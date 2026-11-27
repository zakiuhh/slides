#!/usr/bin/env python3
"""Copy the canonical skill assets into the Claude Code plugin package.

Run from any working directory:
    python scripts/sync-plugin-package.py
    python scripts/sync-plugin-package.py --check
"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_SKILL = ROOT
PLUGIN_SKILL = ROOT / "plugins" / "frontend-slides" / "skills" / "slides"
FILES = (
    "SKILL.md",
    "STYLE_PRESETS.md",
    "animation-patterns.md",
    "html-template.md",
    "viewport-base.css",
)
RUNTIME_SCRIPTS = (
    "extract-pptx.py",
    "deploy.sh",
    "export-pdf.sh",
    "preview-qa.mjs",
)
DIRECTORIES = ("bold-template-pack",)


def directory_files(path: Path) -> dict[str, bytes]:
    if not path.is_dir():
        return {}
    return {
        item.relative_to(path).as_posix(): item.read_bytes()
        for item in sorted(path.rglob("*"))
        if item.is_file()
    }


def check_package() -> list[str]:
    problems: list[str] = []
    for name in FILES:
        source = SOURCE_SKILL / name
        target = PLUGIN_SKILL / name
        if not source.is_file():
            problems.append(f"Missing source file: {source.relative_to(ROOT)}")
        elif not target.is_file():
            problems.append(f"Missing plugin file: {target.relative_to(ROOT)}")
        elif source.read_bytes() != target.read_bytes():
            problems.append(f"Out of sync: {target.relative_to(ROOT)}")

    source_scripts = SOURCE_SKILL / "scripts"
    target_scripts = PLUGIN_SKILL / "scripts"
    for name in RUNTIME_SCRIPTS:
        source = source_scripts / name
        target = target_scripts / name
        if not source.is_file():
            problems.append(f"Missing source script: {source.relative_to(ROOT)}")
        elif not target.is_file():
            problems.append(f"Missing plugin script: {target.relative_to(ROOT)}")
        elif source.read_bytes() != target.read_bytes():
            problems.append(f"Out of sync: {target.relative_to(ROOT)}")
    if target_scripts.is_dir():
        actual_scripts = {path.name for path in target_scripts.iterdir() if path.is_file()}
        extra_scripts = sorted(actual_scripts - set(RUNTIME_SCRIPTS))
        if extra_scripts:
            problems.append(f"Unexpected files in plugin scripts/: {', '.join(extra_scripts)}")

    for name in DIRECTORIES:
        source = SOURCE_SKILL / name
        target = PLUGIN_SKILL / name
        if not source.is_dir():
            problems.append(f"Missing source directory: {source.relative_to(ROOT)}")
            continue
        source_files = directory_files(source)
        target_files = directory_files(target)
        if source_files != target_files:
            missing = sorted(source_files.keys() - target_files.keys())
            extra = sorted(target_files.keys() - source_files.keys())
            changed = sorted(
                key for key in source_files.keys() & target_files.keys()
                if source_files[key] != target_files[key]
            )
            details = []
            if missing:
                details.append(f"missing {len(missing)} file(s)")
            if extra:
                details.append(f"extra {len(extra)} file(s)")
            if changed:
                details.append(f"changed {len(changed)} file(s)")
            problems.append(f"Out of sync: {target.relative_to(ROOT)} ({', '.join(details)})")
    return problems


def sync_package() -> None:
    PLUGIN_SKILL.mkdir(parents=True, exist_ok=True)
    for name in FILES:
        source = SOURCE_SKILL / name
        if not source.is_file():
            raise FileNotFoundError(f"Required source file not found: {source}")
        shutil.copy2(source, PLUGIN_SKILL / name)

    for name in DIRECTORIES:
        source = SOURCE_SKILL / name
        target = PLUGIN_SKILL / name
        if not source.is_dir():
            raise FileNotFoundError(f"Required source directory not found: {source}")
        if target.exists():
            shutil.rmtree(target)
        shutil.copytree(source, target)

    target_scripts = PLUGIN_SKILL / "scripts"
    if target_scripts.exists():
        shutil.rmtree(target_scripts)
    target_scripts.mkdir(parents=True)
    for name in RUNTIME_SCRIPTS:
        source = SOURCE_SKILL / "scripts" / name
        if not source.is_file():
            raise FileNotFoundError(f"Required source script not found: {source}")
        shutil.copy2(source, target_scripts / name)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="check package parity without changing files",
    )
    args = parser.parse_args()

    try:
        if args.check:
            problems = check_package()
            if problems:
                print("Plugin package is out of sync:", file=sys.stderr)
                for problem in problems:
                    print(f"- {problem}", file=sys.stderr)
                print("Run: python scripts/sync-plugin-package.py", file=sys.stderr)
                return 1
            print("Plugin package matches the canonical skill files.")
            return 0

        sync_package()
        problems = check_package()
        if problems:
            for problem in problems:
                print(f"- {problem}", file=sys.stderr)
            return 1
        print(f"Synced skill assets into {PLUGIN_SKILL.relative_to(ROOT)}.")
        return 0
    except OSError as error:
        print(f"Plugin package sync failed: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
