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

test("home page is HTML-first, product-first and uses the simplified primary nav", () => {
  const home = read("index.html");
  assert.match(home, /<h1>Очищенная макадамия Global Basket/i);
  assert.match(home, /Оптовые запросы/i);
  assert.match(
    home,
    /<nav class="main-nav" aria-label="Основная навигация">\s*<a href="\/catalog\/">Каталог<\/a><a href="\/about\/">О бренде<\/a><a href="\/delivery\/">Доставка и оплата<\/a><a href="\/journal\/">Журнал<\/a><a href="\/contacts\/">Контакты<\/a>\s*<\/nav>/i,
  );
  assert.match(home, /href="\/b2b\/\?source=wholesale"/i);
  assert.doesNotMatch(home, /брендовый хаб/i);
  assert.doesNotMatch(home, /scripts\/main\.js/);
  assert.doesNotMatch(home, /scripts\/data\.js/);
});

test("b2b page exposes the required B2B lead fields and no fake calculator", () => {
  const page = read("b2b/index.html");
  for (const field of [
    'name="request_type"',
    'name="company_name"',
    'name="contact_name"',
    'name="phone"',
    'name="email"',
    'name="telegram_username"',
    'name="city"',
    'name="business_type"',
    'name="product_interest"',
    'name="estimated_volume"',
    'name="purchase_frequency"',
    'name="need_commercial_offer"',
    'name="comment"',
  ]) {
    assert.ok(page.includes(field), `Missing ${field}`);
  }
  assert.ok(page.includes("/api/b2b-request"));
  assert.ok(page.includes("<legend>Что вам нужно</legend>"));
  assert.ok(page.includes("<legend>О компании и контакте</legend>"));
  assert.ok(page.includes("Что поможет быстрее подготовить условия"));
  assert.doesNotMatch(page, /Базовая цена/i);
  assert.doesNotMatch(page, /Расстояние от Москвы/i);
});

test("contacts page embeds the compact B2B form instead of the fake calculator flow", () => {
  const page = read("contacts/index.html");
  assert.ok(page.includes("Оптовый или корпоративный запрос"));
  assert.ok(page.includes("/api/b2b-request"));
  assert.ok(page.includes("/b2b/?source=wholesale"));
  assert.ok(page.includes('data-intent-route="wholesale"'));
  assert.ok(page.includes('id="contact-b2b-form"'));
  assert.ok(page.includes('data-form-variant="compact"'));
  assert.ok(page.includes('name="request_type"'));
  assert.doesNotMatch(page, /Расстояние от Москвы/i);
  assert.doesNotMatch(page, /предварительная сумма/i);
  assert.doesNotMatch(page, /Базовая цена/i);
});

test("catalog page does not show a bogus zero-count state", () => {
  const page = read("catalog/index.html");
  assert.ok(page.includes("1 товар в продаже"));
  assert.ok(page.includes("Подробнее о товаре"));
  assert.doesNotMatch(page, /Показано:\s*0/i);
});

test("lead form client logic uses the shared B2B normalizer and analytics flow", () => {
  const app = read("scripts/app.js");
  assert.ok(app.includes("normalizeLeadRequestInput"));
  assert.ok(app.includes("validateLeadRequest"));
  assert.ok(app.includes("lead_form_submit"));
  assert.ok(app.includes("lead_form_success"));
  assert.ok(app.includes("lead_form_error"));
  assert.ok(app.includes("lead_form_request_type_select"));
  assert.ok(app.includes("lead_form_need_quote_toggle"));
});

test("seo infrastructure is generated without fake publication dates", () => {
  const product = read("catalog/macadamia/index.html");
  const article = read("journal/macadamia-start/index.html");
  const sitemap = read("sitemap.xml");
  const robots = read("robots.txt");

  assert.ok(product.includes('rel="canonical"'));
  assert.ok(product.includes("FAQPage"));
  assert.ok(product.includes('"@type":"Product"'));
  assert.doesNotMatch(article, /Дата публикации:/i);
  assert.ok(sitemap.includes("/b2b/"));
  assert.ok(sitemap.includes("/where-to-buy/"));
  assert.ok(robots.includes("Disallow: /api/"));
});
