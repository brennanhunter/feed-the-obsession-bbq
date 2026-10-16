// Prints a print/<name>.html sheet to public/<name>.pdf with headless Chrome via
// Playwright (page size comes from the sheet's own @page rule).
//   node print/build.mjs menu                 -> public/menu.pdf
//   node print/build.mjs order-card ~/x.pdf   -> public/order-card.pdf + a copy
// Needs Google Chrome; Playwright is loaded from the npx cache if not installed.
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

const name = process.argv[2] || "menu";
const copyTo = process.argv[3];
const here = dirname(fileURLToPath(import.meta.url)); // works from any cwd
const src = resolve(here, `${name}.html`);
const out = resolve(here, "..", "public", `${name}.pdf`);
if (!existsSync(src)) throw new Error(`No such sheet: ${src}`);

const { chromium } = loadPlaywright();
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({ executablePath: existsSync(chrome) ? chrome : undefined });
const page = await browser.newPage();
await page.goto("file://" + src, { waitUntil: "networkidle" });
// Match the viewport to the sheet so Chrome doesn't scale the layout to fit.
const size = await page.evaluate(() => ({ width: document.body.offsetWidth, height: document.body.offsetHeight }));
await page.setViewportSize(size);
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: out, printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 }, preferCSSPageSize: true });
await browser.close();
console.log("wrote", out);
if (copyTo) { copyFileSync(out, copyTo); console.log("copied to", copyTo); }
