import puppeteer from 'puppeteer';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotsDir = join(__dirname, 'temporary screenshots');

if (!existsSync(screenshotsDir)) mkdirSync(screenshotsDir, { recursive: true });

const url   = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] ? `-${process.argv[3]}` : '';

// Auto-increment N
const existing = readdirSync(screenshotsDir).filter(f => f.startsWith('screenshot-') && f.endsWith('.png'));
const nums = existing.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] ?? '0', 10));
const N = nums.length ? Math.max(...nums) + 1 : 1;
const filename = `screenshot-${N}${label}.png`;
const outPath  = join(screenshotsDir, filename);

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
const page    = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

// Scroll through the page to trigger intersection observers
const totalHeight = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y <= totalHeight; y += 400) {
  await page.evaluate(yPos => window.scrollTo(0, yPos), y);
  await new Promise(r => setTimeout(r, 150));
}
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise(r => setTimeout(r, 1200));

await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log(`Saved: temporary screenshots/${filename}`);
