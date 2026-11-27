#!/usr/bin/env node
/**
 * Render a deck to screenshots and flag browser/runtime/layout issues.
 *
 * Usage:
 *   node scripts/preview-qa.mjs <deck.html | deck-directory> [output-directory]
 *
 * Requires the optional Playwright dev tool and Chromium:
 *   npm install --no-save playwright
 *   npx playwright install chromium
 */

import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, basename, dirname, resolve, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const input = process.argv[2];
if (!input) {
  console.error('Usage: node scripts/preview-qa.mjs <deck.html | deck-directory> [output-directory]');
  process.exit(2);
}

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('Playwright is required for visual QA. Install it with:');
  console.error('  npm install --no-save playwright');
  console.error('  npx playwright install chromium');
  process.exit(2);
}

const inputPath = resolve(input);
const htmlPath = existsSync(inputPath) && statSync(inputPath).isDirectory()
  ? resolve(inputPath, 'index.html')
  : inputPath;
if (!existsSync(htmlPath) || extname(htmlPath).toLowerCase() !== '.html') {
  console.error(`Presentation HTML not found: ${htmlPath}`);
  process.exit(2);
}

const deckDir = dirname(htmlPath);
const htmlName = basename(htmlPath);
const outputDir = resolve(
  process.argv[3] || resolve(process.cwd(), '.frontend-slides-qa', basename(deckDir)),
);
mkdirSync(outputDir, { recursive: true });

const mimeTypes = {
  '.css': 'text/css',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const localFailures = [];
const pageErrors = [];
const consoleErrors = [];
const overflowWarnings = [];
const accessibilityFindings = [];
let browser;
let server;

try {
  server = createServer((request, response) => {
    let requestPath;
    try {
      requestPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    } catch {
      response.writeHead(400).end('Bad request');
      return;
    }

    const relativePath = requestPath === '/' ? htmlName : requestPath.replace(/^\/+/, '');
    const filePath = resolve(deckDir, relativePath);
    if (filePath !== deckDir && !filePath.startsWith(`${deckDir}${sep}`)) {
      response.writeHead(403).end('Forbidden');
      return;
    }

    try {
      const body = readFileSync(filePath);
      response.writeHead(200, {
        'Content-Type': mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
      });
      response.end(body);
    } catch {
      response.writeHead(404).end('Not found');
    }
  });

  const port = await new Promise((resolvePort, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolvePort(server.address().port));
  });
  const baseUrl = `http://127.0.0.1:${port}/`;
  const encodedHtml = encodeURIComponent(htmlName);

  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    reducedMotion: 'reduce',
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('response', (response) => {
    if (response.url().startsWith(baseUrl) && response.status() >= 400) {
      localFailures.push(`${response.status()} ${response.url()}`);
    }
  });
  page.on('requestfailed', (request) => {
    if (request.url().startsWith(baseUrl)) {
      localFailures.push(`Request failed: ${request.url()} (${request.failure()?.errorText || 'unknown error'})`);
    }
  });

  await page.goto(`${baseUrl}${encodedHtml}`, { waitUntil: 'domcontentloaded' });
  await Promise.race([
    page.evaluate(() => document.fonts.ready),
    new Promise((resolveFonts) => setTimeout(resolveFonts, 10000)),
  ]);

  const deckInfo = await page.evaluate(() => {
    const stage = document.querySelector('.deck-stage');
    const slides = [...document.querySelectorAll('.slide')];
    return {
      stage: stage ? { width: stage.offsetWidth, height: stage.offsetHeight } : null,
      slideCount: slides.length,
      slideSizes: slides.map((slide) => ({ width: slide.offsetWidth, height: slide.offsetHeight })),
    };
  });
  if (!deckInfo.stage) throw new Error('No .deck-stage element found.');
  if (!deckInfo.slideCount) throw new Error('No .slide elements found.');
  if (deckInfo.stage.width !== 1920 || deckInfo.stage.height !== 1080) {
    overflowWarnings.push(`Stage is ${deckInfo.stage.width}×${deckInfo.stage.height}, expected 1920×1080.`);
  }
  deckInfo.slideSizes.forEach((size, index) => {
    if (size.width !== 1920 || size.height !== 1080) {
      overflowWarnings.push(`Slide ${index + 1} is ${size.width}×${size.height}, expected 1920×1080.`);
    }
  });

  const setActiveSlide = async (index) => {
    await page.evaluate((activeIndex) => {
      const slides = [...document.querySelectorAll('.slide')];
      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === activeIndex;
        slide.classList.toggle('active', active);
        slide.classList.toggle('visible', active);
        slide.style.visibility = active ? 'visible' : 'hidden';
        slide.style.opacity = active ? '1' : '0';
        if (active) {
          slide.querySelectorAll('.reveal').forEach((element) => {
            element.style.opacity = '1';
            element.style.visibility = 'visible';
            element.style.transform = 'none';
          });
        }
      });
    }, index);
    await page.waitForTimeout(80);
  };

  const documentFindings = await page.evaluate(() => {
    const findings = [];
    if (!document.documentElement.getAttribute('lang')) {
      findings.push({ severity: 'error', check: 'document-language', message: 'Set a language on the <html> element.' });
    }
    if (!document.title.trim()) {
      findings.push({ severity: 'error', check: 'document-title', message: 'Add a descriptive page title.' });
    }

    document.querySelectorAll('img').forEach((image) => {
      if (!image.hasAttribute('alt')) {
        findings.push({ severity: 'error', check: 'image-alt', message: `Image is missing alt text: ${image.getAttribute('src') || '(no source)'}` });
      }
    });

    const controls = document.querySelectorAll('button,a[href],input:not([type="hidden"]),select,textarea,[role="button"],[tabindex]:not([tabindex="-1"])');
    controls.forEach((control) => {
      if (control.closest('[aria-hidden="true"]')) return;
      const labelledBy = (control.getAttribute('aria-labelledby') || '')
        .split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent || '')
        .join(' ')
        .trim();
      const imageAlt = [...control.querySelectorAll('img[alt]')].map((image) => image.alt).join(' ').trim();
      const name = control.getAttribute('aria-label')
        || labelledBy
        || control.getAttribute('title')
        || control.innerText?.trim()
        || control.value?.trim()
        || imageAlt
        || [...(control.labels || [])].map((label) => label.textContent.trim()).join(' ');
      if (!name?.trim()) {
        findings.push({ severity: 'error', check: 'control-name', message: `Interactive control has no accessible name: <${control.tagName.toLowerCase()}>` });
      }
    });

    document.querySelectorAll('svg:not([aria-hidden="true"])').forEach((svg) => {
      if (!svg.getAttribute('aria-label') && !svg.getAttribute('aria-labelledby') && !svg.querySelector('title')) {
        findings.push({ severity: 'warning', check: 'svg-name', message: 'SVG may need an accessible name or aria-hidden="true" if decorative.' });
      }
    });
    return findings;
  });
  accessibilityFindings.push(...documentFindings);

  const startingSlide = await page.evaluate(() => (
    [...document.querySelectorAll('.slide')].findIndex((slide) => slide.classList.contains('active') || slide.classList.contains('visible'))
  ));
  if (deckInfo.slideCount > 1 && startingSlide >= 0) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(420);
    const nextSlide = await page.evaluate(() => (
      [...document.querySelectorAll('.slide')].findIndex((slide) => slide.classList.contains('active') || slide.classList.contains('visible'))
    ));
    if (nextSlide !== Math.min(startingSlide + 1, deckInfo.slideCount - 1)) {
      accessibilityFindings.push({ severity: 'error', check: 'keyboard-navigation', message: 'ArrowRight did not advance the presentation by one slide.' });
      await setActiveSlide(startingSlide);
    } else {
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(420);
      const returnedSlide = await page.evaluate(() => (
        [...document.querySelectorAll('.slide')].findIndex((slide) => slide.classList.contains('active') || slide.classList.contains('visible'))
      ));
      if (returnedSlide !== startingSlide) {
        accessibilityFindings.push({ severity: 'error', check: 'keyboard-navigation', message: 'ArrowLeft did not return to the previous slide.' });
        await setActiveSlide(startingSlide);
      }
    }
  }

  const reducedMotionCheck = await page.evaluate(() => {
    const parseDurations = (value) => value.split(',').map((part) => {
      const duration = part.trim();
      return duration.endsWith('ms') ? Number.parseFloat(duration) : Number.parseFloat(duration) * 1000;
    });
    const longMotion = [...document.querySelectorAll('.slide, .slide *')].flatMap((element) => {
      const style = getComputedStyle(element);
      const durations = [...parseDurations(style.transitionDuration), ...parseDurations(style.animationDuration)];
      return durations.some((duration) => duration > 50)
        ? [{ element: element.tagName.toLowerCase(), className: String(element.className?.baseVal || element.className || '').slice(0, 80) }]
        : [];
    }).slice(0, 10);
    return {
      preferenceApplied: matchMedia('(prefers-reduced-motion: reduce)').matches,
      longMotion,
    };
  });
  if (!reducedMotionCheck.preferenceApplied) {
    accessibilityFindings.push({ severity: 'error', check: 'reduced-motion', message: 'Browser did not apply prefers-reduced-motion during the QA run.' });
  }
  if (reducedMotionCheck.longMotion.length) {
    accessibilityFindings.push({ severity: 'error', check: 'reduced-motion', message: `Motion durations exceed 50ms under reduced-motion: ${JSON.stringify(reducedMotionCheck.longMotion)}` });
  }

  const slideFiles = [];
  for (let index = 0; index < deckInfo.slideCount; index += 1) {
    await setActiveSlide(index);
    const filename = `slide-${String(index + 1).padStart(3, '0')}.png`;
    const path = resolve(outputDir, filename);
    await page.screenshot({ path, animations: 'disabled' });
    slideFiles.push(filename);

    const slideChecks = await page.evaluate(() => {
      const slide = document.querySelector('.slide.active, .slide.visible');
      if (!slide) return { layout: [], accessibility: [] };
      const slideRect = slide.getBoundingClientRect();
      const textElements = [...slide.querySelectorAll('h1,h2,h3,h4,p,li,blockquote,td,th,figcaption,button,a[href],label,dt,dd,span')]
        .filter((element) => (element.textContent || '').trim());
      const layout = textElements
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          const overflow = element.scrollWidth > element.clientWidth + 2
            || element.scrollHeight > element.clientHeight + 2;
          const outside = rect.left < slideRect.left - 2
            || rect.top < slideRect.top - 2
            || rect.right > slideRect.right + 2
            || rect.bottom > slideRect.bottom + 2;
          return overflow || outside;
        })
        .map((element) => ({
          text: (element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 100),
          overflow: element.scrollWidth > element.clientWidth + 2
            || element.scrollHeight > element.clientHeight + 2,
          outside: (() => {
            const rect = element.getBoundingClientRect();
            return rect.left < slideRect.left - 2 || rect.top < slideRect.top - 2
              || rect.right > slideRect.right + 2 || rect.bottom > slideRect.bottom + 2;
          })(),
        }));

      const parseColor = (value) => {
        const match = value.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i);
        if (!match) return null;
        const channels = match.slice(1, 4).map(Number);
        const alpha = match[4] ? Number.parseFloat(match[4]) / (match[4].endsWith('%') ? 100 : 1) : 1;
        if (channels.some((channel) => !Number.isFinite(channel)) || alpha < 0.999) return null;
        return channels;
      };
      const luminance = (channels) => {
        const linear = channels.map((channel) => {
          const value = channel / 255;
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
      };
      const accessibility = [];
      const seen = new Set();
      for (const element of textElements) {
        const text = (element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 90);
        const style = getComputedStyle(element);
        const fontSize = Number.parseFloat(style.fontSize);
        if (fontSize > 0 && fontSize < 18) {
          const key = `small:${text}:${Math.round(fontSize)}`;
          if (!seen.has(key)) {
            seen.add(key);
            accessibility.push({
              severity: 'warning', check: 'small-text',
              message: `Slide text is ${fontSize.toFixed(1)}px, below the 18px review guide: “${text}”`,
            });
          }
        }

        let background = null;
        let uncertainBackground = false;
        for (let node = element; node && node !== slide.parentElement; node = node.parentElement) {
          const nodeStyle = getComputedStyle(node);
          if (nodeStyle.backgroundImage !== 'none' || Number.parseFloat(nodeStyle.opacity) < 0.999) {
            uncertainBackground = true;
            break;
          }
          const rawBackground = nodeStyle.backgroundColor;
          if (rawBackground && rawBackground !== 'transparent' && rawBackground !== 'rgba(0, 0, 0, 0)') {
            const color = parseColor(rawBackground);
            if (color) background = color;
            else uncertainBackground = true;
            break;
          }
          if (node === slide) break;
        }
        const foreground = parseColor(style.color);
        if (!uncertainBackground && foreground && background) {
          const foregroundLuminance = luminance(foreground);
          const backgroundLuminance = luminance(background);
          const ratio = (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
            / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
          const isLarge = fontSize >= 24 || (fontSize >= 18.66 && Number.parseInt(style.fontWeight, 10) >= 700);
          const minimum = isLarge ? 3 : 4.5;
          if (ratio < minimum) {
            const key = `contrast:${text}:${ratio.toFixed(2)}`;
            if (!seen.has(key)) {
              seen.add(key);
              accessibility.push({
                severity: 'warning', check: 'text-contrast',
                message: `Text contrast is approximately ${ratio.toFixed(2)}:1 (review target ${minimum}:1): “${text}”`,
              });
            }
          }
        }
        if (accessibility.length >= 30) break;
      }
      return { layout, accessibility };
    });
    slideChecks.layout.forEach((warning) => overflowWarnings.push(`Slide ${index + 1}: ${JSON.stringify(warning)}`));
    slideChecks.accessibility.forEach((finding) => {
      accessibilityFindings.push({ ...finding, message: `Slide ${index + 1}: ${finding.message}` });
    });
  }

  const sampleSlides = [...new Set([0, Math.floor((deckInfo.slideCount - 1) / 2), deckInfo.slideCount - 1])];
  for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    for (const index of sampleSlides) {
      await setActiveSlide(index);
      const filename = `viewport-${viewport.width}x${viewport.height}-slide-${String(index + 1).padStart(3, '0')}.png`;
      await page.screenshot({ path: resolve(outputDir, filename), animations: 'disabled' });
      slideFiles.push(filename);
    }
  }

  const accessibilityErrors = accessibilityFindings.filter((finding) => finding.severity === 'error');
  const report = {
    input: htmlPath,
    stage: deckInfo.stage,
    slideCount: deckInfo.slideCount,
    screenshots: slideFiles,
    pageErrors,
    consoleErrors,
    localAssetFailures: localFailures,
    layoutWarnings: overflowWarnings,
    accessibilityFindings,
    reviewStatus: pageErrors.length || consoleErrors.length || localFailures.length || accessibilityErrors.length
          ? 'needs-fix'
          : 'review-screenshots',
  };
  writeFileSync(resolve(outputDir, 'qa-report.json'), `${JSON.stringify(report, null, 2)}\n`);

  const cards = slideFiles.map((filename) => (
    `<figure><a href="${filename}"><img src="${filename}" alt="${filename}" loading="lazy"></a><figcaption>${filename}</figcaption></figure>`
  )).join('\n');
  const gallery = `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Slide preview QA</title><style>
body{font:16px/1.4 system-ui,sans-serif;margin:24px;background:#f4f1eb;color:#222}h1{font-size:1.5rem}p{max-width:70ch}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}figure{margin:0;background:white;padding:8px;border:1px solid #ccc}img{display:block;width:100%;height:auto}figcaption{font:12px ui-monospace,monospace;overflow-wrap:anywhere;padding-top:6px}
</style><h1>Slide preview QA</h1><p>${deckInfo.slideCount} slides. Inspect this contact sheet for clipped content, overlap, weak hierarchy, and visual consistency. Machine checks are in <code>qa-report.json</code>.</p><main>${cards}</main></html>`;
  writeFileSync(resolve(outputDir, 'index.html'), gallery);

  console.log(`Captured ${deckInfo.slideCount} slides to ${relative(process.cwd(), outputDir) || outputDir}.`);
  console.log(`Open ${pathToFileURL(resolve(outputDir, 'index.html')).href} to review the contact sheet.`);
  const accessibilityWarnings = accessibilityFindings.filter((finding) => finding.severity === 'warning');
  console.log(`Runtime errors: ${pageErrors.length}; local asset failures: ${localFailures.length}; layout warnings: ${overflowWarnings.length}; accessibility findings: ${accessibilityFindings.length} (${accessibilityErrors.length} errors, ${accessibilityWarnings.length} warnings).`);
  if (pageErrors.length) pageErrors.forEach((error) => console.error(`Page error: ${error}`));
  if (consoleErrors.length) console.warn(`Console errors: ${consoleErrors.length}`);
  if (localFailures.length) localFailures.forEach((error) => console.error(error));
  if (overflowWarnings.length) overflowWarnings.forEach((warning) => console.warn(warning));
  accessibilityFindings.forEach((finding) => {
    const log = finding.severity === 'error' ? console.error : console.warn;
    log(`Accessibility ${finding.severity}: ${finding.message}`);
  });
  if (pageErrors.length || consoleErrors.length || localFailures.length || accessibilityErrors.length) process.exitCode = 1;
} catch (error) {
  console.error(`Preview QA failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (server) await new Promise((resolveClose) => server.close(resolveClose));
}
