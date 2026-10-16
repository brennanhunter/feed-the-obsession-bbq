// Prints print/menu.html to public/menu.pdf (letter, no margins) with headless
// Chrome via Playwright. Run from the repo root: node print/build-menu.mjs
// Needs Google Chrome installed; Playwright is loaded from the npx cache if it
// isn't a local dependency.
import { createRequire } from "node:module";
import { existsSync, readdirSync, copyFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
function loadPlaywright() {
  try { return require("playwright"); } catch {}
  const cache = resolve(process.env.HOME, ".npm/_npx");
  for (const d of readdirSync(cache)) {
    const p = resolve(cache, d, "node_modules/playwright");
    if (existsSync(p)) return require(p);
  }
  throw new Error("Playwright not found — run: npx -y playwright --version");
}

const { chromium } = loadPlaywright();
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const here = dirname(fileURLToPath(import.meta.url)); // works from any cwd
const src = resolve(here, "menu.html");
const out = resolve(here, "..", "public", "menu.pdf");

const browser = await chromium.launch({ executablePath: existsSync(chrome) ? chrome : undefined });
const page = await browser.newPage({ viewport: { width: 816, height: 1056 } });
await page.goto("file://" + src, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: out, format: "Letter", printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 }, preferCSSPageSize: true });
await browser.close();
console.log("wrote", out);
const extra = process.argv[2];
if (extra) { copyFileSync(out, extra); console.log("copied to", extra); }
