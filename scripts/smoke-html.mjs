import { createServer } from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".png": "image/png",
};

const resolveFilePath = (pathname) => {
  const normalized = decodeURIComponent(pathname || "/");
  const candidate = normalized.endsWith("/")
    ? path.join(ROOT, normalized, "index.html")
    : path.extname(normalized)
      ? path.join(ROOT, normalized)
      : path.join(ROOT, normalized, "index.html");
  const safePath = path.normalize(candidate);
  if (!safePath.startsWith(ROOT)) return null;
  return safePath;
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const filePath = resolveFilePath(url.pathname);

  if (!filePath) {
    res.statusCode = 400;
    res.end("Bad request");
    return;
  }

  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.statusCode = 200;
    res.setHeader("content-type", MIME_TYPES[ext] || "application/octet-stream");
    res.end(data);
  } catch {
    res.statusCode = 404;
    res.end("Not found");
  }
});

const checks = [
  {
    path: "/",
    includes: [
      "<h1>Global Basket — честный выбор натуральных продуктов со всего мира</h1>",
      'name="product_id" value=""',
      '"@type":"Organization"',
    ],
  },
  {
    path: "/about/",
    includes: [
      "<h1>Global Basket — вкусы мира в честном, полезном и доступном формате</h1>",
      "Кто мы",
      '"@type":"BreadcrumbList"',
    ],
  },
  {
    path: "/delivery/",
    includes: [
      "<h1>Доставка и оплата</h1>",
      "1. Отправьте запрос",
      '"@type":"BreadcrumbList"',
    ],
  },
  {
    path: "/contacts/",
    includes: [
      "<h1>Связаться с Global Basket</h1>",
      'name="product_id" value=""',
      'href="/privacy/"',
      '"@type":"Organization"',
    ],
  },
  {
    path: "/journal/",
    includes: [
      "<h1>Журнал Global Basket</h1>",
      "Как аккуратная упаковка усиливает впечатление от продукта",
      '"@type":"BreadcrumbList"',
    ],
  },
  {
    path: "/journal/packaging/",
    includes: [
      "<h1>Как аккуратная упаковка усиливает впечатление от продукта</h1>",
      "Упаковка как первая точка доверия",
      '"@type":"BreadcrumbList"',
    ],
  },
  {
    path: "/journal/macadamia-start/",
    includes: [
      "<h1>Почему макадамия хорошо подходит для спокойной премиальной витрины</h1>",
      "Почему макадамия работает на витрине",
      '"@type":"BreadcrumbList"',
    ],
  },
  {
    path: "/catalog/",
    includes: [
      "<h1>Каталог</h1>",
      "Очищенная макадамия",
      "Курага монетка",
      "Подарочный набор орехов",
      "Премиальные орехи",
      "Сухофрукты",
    ],
  },
  {
    path: "/categories/premium-nuts/",
    includes: [
      "Переходим в каталог",
      'http-equiv="refresh"',
      "/catalog/?category=premium-nuts",
      '"@type":"BreadcrumbList"',
    ],
  },
  {
    path: "/categories/dried-fruits/",
    includes: [
      "Переходим в каталог",
      'http-equiv="refresh"',
      "/catalog/?category=dried-fruits",
      '"@type":"BreadcrumbList"',
    ],
  },
  {
    path: "/categories/nut-mixes/",
    includes: [
      "Переходим в каталог",
      'http-equiv="refresh"',
      "/catalog/?category=nut-mixes",
      '"@type":"BreadcrumbList"',
    ],
  },
  {
    path: "/categories/gift-sets/",
    includes: [
      "Переходим в каталог",
      'http-equiv="refresh"',
      "/catalog/?category=gift-sets",
      '"@type":"BreadcrumbList"',
    ],
  },
  {
    path: "/catalog/macadamia/",
    includes: [
      "<h1>Очищенная макадамия 250 г</h1>",
      "Ключевые данные о товаре",
      "Состав",
      '"@type":"Product"',
      '"@type":"BreadcrumbList"',
    ],
  },
  {
    path: "/catalog/oreh-makadamiya-v-skorlupe-s-klyuchom-1-kg/",
    includes: [
      "<h1>Орех макадамия в скорлупе с ключом 1 кг</h1>",
      "Ключевые данные о товаре",
      '"@type":"Product"',
      '"@type":"BreadcrumbList"',
    ],
  },
  {
    path: "/catalog/pekan-ochishchennyy-syroy-500-g/",
    includes: [
      "<h1>Пекан очищенный сырой 500 г</h1>",
      "Ключевые данные о товаре",
      '"@type":"Product"',
    ],
  },
  {
    path: "/catalog/gretskiy-oreh-ochishchennyy-polovinki-1-kg/",
    includes: [
      "<h1>Грецкий орех очищенный половинки 1 кг</h1>",
      "Ключевые данные о товаре",
      '"@type":"Product"',
    ],
  },
  {
    path: "/catalog/keshyu-syroy-sushenyy-1-kg/",
    includes: [
      "<h1>Кешью сырой сушеный 1 кг</h1>",
      "Ключевые данные о товаре",
      '"@type":"Product"',
    ],
  },
  {
    path: "/privacy/",
    includes: [
      "<h1>Политика обработки персональных данных</h1>",
      '"@type":"BreadcrumbList"',
    ],
  },
];

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

const address = server.address();
const baseUrl =
  typeof address === "object" && address ? `http://127.0.0.1:${address.port}` : "http://127.0.0.1:3000";

try {
  for (const check of checks) {
    const response = await fetch(new URL(check.path, baseUrl));
    if (!response.ok) {
      throw new Error(`${check.path}: expected 200, received ${response.status}`);
    }

    const html = await response.text();
    for (const expected of check.includes) {
      if (!html.includes(expected)) {
        throw new Error(`${check.path}: missing ${expected}`);
      }
    }

    for (const unexpected of check.excludes || []) {
      if (html.includes(unexpected)) {
        throw new Error(`${check.path}: contains forbidden placeholder ${unexpected}`);
      }
    }
  }

  console.log(`Smoke HTML checks passed: ${checks.length} routes`);
} finally {
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}
