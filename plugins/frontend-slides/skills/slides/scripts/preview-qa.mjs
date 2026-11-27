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

  const slideFiles = [];
  for (let index = 0; index < deckInfo.slideCount; index += 1) {
    await setActiveSlide(index);
    const filename = `slide-${String(index + 1).padStart(3, '0')}.png`;
    const path = resolve(outputDir, filename);
    await page.screenshot({ path, animations: 'disabled' });
    slideFiles.push(filename);

    const warnings = await page.evaluate(() => {
      const slide = document.querySelector('.slide.active, .slide.visible');
      if (!slide) return [];
      const slideRect = slide.getBoundingClientRect();
      return [...slide.querySelectorAll('h1,h2,h3,p,li,blockquote,td,th')]
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
    });
    warnings.forEach((warning) => overflowWarnings.push(`Slide ${index + 1}: ${JSON.stringify(warning)}`));
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

  const report = {
    input: htmlPath,
    stage: deckInfo.stage,
    slideCount: deckInfo.slideCount,
    screenshots: slideFiles,
    pageErrors,
    consoleErrors,
    localAssetFailures: localFailures,
    layoutWarnings: overflowWarnings,
    reviewStatus: pageErrors.length || consoleErrors.length || localFailures.length
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
  console.log(`Runtime errors: ${pageErrors.length}; local asset failures: ${localFailures.length}; layout warnings: ${overflowWarnings.length}.`);
  if (pageErrors.length) pageErrors.forEach((error) => console.error(`Page error: ${error}`));
  if (consoleErrors.length) consoleErrors.forEach((error) => console.warn(`Console error: ${error}`));
  if (localFailures.length) localFailures.forEach((error) => console.error(error));
  if (overflowWarnings.length) overflowWarnings.forEach((warning) => console.warn(warning));
  if (pageErrors.length || consoleErrors.length || localFailures.length) process.exitCode = 1;
} catch (error) {
  console.error(`Preview QA failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (server) await new Promise((resolveClose) => server.close(resolveClose));
}
