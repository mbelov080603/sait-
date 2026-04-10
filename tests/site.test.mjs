import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import assert from "node:assert/strict";

const cwd = process.cwd();

const build = spawnSync(process.execPath, ["./scripts/build.mjs"], {
  cwd,
  stdio: "inherit",
});

if (build.status !== 0) {
  throw new Error("Build failed before tests");
}

const read = (relativePath) => fs.readFileSync(path.join(cwd, relativePath), "utf8");

test("home page is HTML-first and brand-hub focused", () => {
  const home = read("index.html");
  assert.match(home, /<h1>Global Basket — брендовый хаб/i);
  assert.match(home, /Официальные retail-каналы бренда/i);
  assert.match(home, /Telegram-бот для поддержки и претензий/i);
  assert.doesNotMatch(home, /scripts\/main\.js/);
  assert.doesNotMatch(home, /scripts\/data\.js/);
});

test("b2b page exposes the required corporate fields", () => {
  const page = read("b2b/index.html");
  for (const field of [
    'name="company_name"',
    'name="contact_name"',
    'name="phone"',
    'name="email"',
    'name="city"',
    'name="business_type"',
    'name="product_interest"',
    'name="estimated_volume"',
    'name="frequency"',
    'name="comment"',
  ]) {
    assert.ok(page.includes(field), `Missing ${field}`);
  }
  assert.ok(page.includes("/api/b2b-request"));
});

test("contacts page is no longer an op-price calculator", () => {
  const page = read("contacts/index.html");
  assert.ok(page.includes("Контакты Global Basket"));
  assert.ok(page.includes("/api/contact-request"));
  assert.ok(page.includes("Открыть B2B-страницу"));
  assert.doesNotMatch(page, /Расстояние от Москвы/i);
  assert.doesNotMatch(page, /Базовая цена/i);
});

test("seo infrastructure is generated", () => {
  const product = read("catalog/macadamia/index.html");
  const sitemap = read("sitemap.xml");
  const robots = read("robots.txt");

  assert.ok(product.includes('rel="canonical"'));
  assert.ok(product.includes("FAQPage"));
  assert.ok(product.includes('"@type":"Product"'));
  assert.ok(sitemap.includes("/b2b/"));
  assert.ok(sitemap.includes("/where-to-buy/"));
  assert.ok(robots.includes("Disallow: /api/"));
});
