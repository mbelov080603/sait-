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
    includes: ["<h1>", 'rel="canonical"', "application/ld+json", "Где купить", "Опт / B2B"],
  },
  {
    file: "b2b/index.html",
    includes: ["/api/b2b-request", 'name="company_name"', 'name="product_interest"', "FAQ"],
  },
  {
    file: "contacts/index.html",
    includes: ["/api/contact-request", "Контакты Global Basket", "Открыть B2B-страницу"],
    excludes: ["Расстояние от Москвы", "Юридическое лицо / ИП", "Базовая цена"],
  },
  {
    file: "catalog/macadamia/index.html",
    includes: ["Официальные каналы покупки", "FAQPage", "Купить у официальных партнёров"],
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
