import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const cwd = process.cwd();

const build = spawnSync(process.execPath, ["./scripts/build.mjs"], {
  cwd,
  stdio: "inherit",
});

if (build.status !== 0) {
  process.exit(build.status || 1);
}

const requiredPages = [
  "index.html",
  "catalog/index.html",
  "categories/premium-nuts/index.html",
  "catalog/macadamia/index.html",
  "about/index.html",
  "where-to-buy/index.html",
  "b2b/index.html",
  "contacts/index.html",
  "delivery/index.html",
  "journal/index.html",
  "documents/index.html",
  "legal/privacy/index.html",
  "legal/consent/index.html",
  "legal/terms/index.html",
  "sitemap.xml",
  "robots.txt",
];

for (const relativePath of requiredPages) {
  const filePath = path.join(cwd, relativePath);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required output: ${relativePath}`);
  }
}

const htmlChecks = [
  {
    file: "index.html",
    includes: [
      "<h1>Очищенная макадамия Global Basket",
      'rel="canonical"',
      "application/ld+json",
      "Оптовые запросы",
      "/delivery/",
      "Подробнее о товаре",
    ],
    excludes: ["брендовый хаб", "воронк", "SEO и доверительный слой"],
  },
  {
    file: "b2b/index.html",
    includes: [
      "/api/b2b-request",
      'name="request_type"',
      'name="company_name"',
      'name="product_interest"',
      'name="preferred_contact_method"',
      "Оптовый или корпоративный заказ",
      "Что поможет быстрее подготовить условия",
      "Как проходит работа после заявки",
    ],
    excludes: ["CRM", "mock-режим", "Базовая цена", "Расстояние от Москвы"],
  },
  {
    file: "contacts/index.html",
    includes: [
      "/api/b2b-request",
      "Оптовый или корпоративный запрос",
      'id="contact-b2b-form"',
      "/b2b/?source=wholesale",
      'data-intent-route="wholesale"',
      'data-form-role="b2b"',
    ],
    excludes: ["Расстояние от Москвы", "Юридическое лицо / ИП", "Базовая цена", "роутером по сценариям"],
  },
  {
    file: "catalog/macadamia/index.html",
    includes: [
      "Где купить и как связаться",
      "FAQPage",
      'id="product-b2b-form"',
      "Вы оставляете заявку по товару",
      "/api/b2b-request",
    ],
    excludes: ["продуктовый слой"],
  },
  {
    file: "catalog/index.html",
    includes: ["1 товар в продаже", "Каталог премиальных орехов Global Basket", "Подробнее о товаре"],
    excludes: ["Показано: 0"],
  },
  {
    file: "journal/macadamia-start/index.html",
    includes: ["Как выбрать макадамию"],
    excludes: ["Дата публикации:"],
  },
];

for (const check of htmlChecks) {
  const content = fs.readFileSync(path.join(cwd, check.file), "utf8");
  for (const fragment of check.includes || []) {
    if (!content.includes(fragment)) {
      throw new Error(`Expected "${fragment}" in ${check.file}`);
    }
  }
  for (const fragment of check.excludes || []) {
    if (content.includes(fragment)) {
      throw new Error(`Unexpected "${fragment}" in ${check.file}`);
    }
  }
}

console.log("Lint checks passed");
