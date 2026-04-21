import fs from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE_URL = "https://globalbasket.ru";
const DEFAULT_SHARE_IMAGE = "/assets/social/globalbasket-share-card-20260421.jpg";
const DEFAULT_SHARE_IMAGE_WIDTH = 1200;
const DEFAULT_SHARE_IMAGE_HEIGHT = 630;
const DEFAULT_SHARE_IMAGE_ALT = "Логотип Global Basket на фирменной карточке";
const SEO_START = "<!-- prerender-seo:start -->";
const SEO_END = "<!-- prerender-seo:end -->";
const HEADER_START = "<!-- prerender-header:start -->";
const HEADER_END = "<!-- prerender-header:end -->";
const FOOTER_START = "<!-- prerender-footer:start -->";
const FOOTER_END = "<!-- prerender-footer:end -->";

const dataSource = await fs.readFile(path.join(ROOT, "scripts/data.js"), "utf8");
const mainSource = await fs.readFile(path.join(ROOT, "scripts/main.js"), "utf8");

const loadStore = () => {
  const sandbox = { window: {} };
  vm.runInNewContext(dataSource, sandbox, { filename: "data.js" });
  return sandbox.window.GlobalBasketData;
};

const store = loadStore();
const products =
  Array.isArray(store.products) && store.products.length
    ? store.products
    : [store.product].filter(Boolean);
const categories = Array.isArray(store.categories) ? store.categories : [];
const featuredProduct = products.find((item) => item?.status === "active") || products[0] || store.product;
const journalPosts = Array.isArray(store.journal?.posts) ? store.journal.posts : [];

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const escapeAttribute = (value = "") =>
  escapeHtml(value).replaceAll('"', "&quot;");

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const absoluteUrl = (value = "/") => new URL(value, SITE_URL).toString();

const serializeJsonLd = (value) =>
  JSON.stringify(value).replace(/</g, "\\u003c").replace(/<\/script>/gi, "<\\/script>");

const buildDocumentTitle = (value = "") => {
  const normalized = String(value || "").trim();
  if (!normalized) return "Global Basket";
  return /global basket/i.test(normalized) ? normalized : `Global Basket | ${normalized}`;
};

const normalizePhone = (href = "", fallback = "") => {
  const cleaned = String(href || fallback).replace(/^tel:/, "").trim();
  return cleaned || String(fallback || "").trim();
};

const buildOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Global Basket",
  url: SITE_URL,
  logo: absoluteUrl("/assets/logo.jpg"),
  email: store.contact.email,
  telephone: normalizePhone(store.contact.phoneHref, store.contact.phone),
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "sales",
      telephone: normalizePhone(store.contact.phoneHref, store.contact.phone),
      email: store.contact.email,
      availableLanguage: ["ru"],
      url: absoluteUrl("/contacts/"),
    },
  ],
  sameAs: [store.contact.channelHref, store.contact.telegramHref].filter(Boolean),
});

const buildBreadcrumbSchema = (items = []) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
});

const buildProductSchema = (product) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.h1 || product.fullName || product.shortName,
  description:
    product.fullDescription ||
    product.shortDescription ||
    product.seoDescription ||
    product.catalogDescription,
  image: [product.images?.main, ...(product.gallery || []).map((item) => item.src)]
    .filter(Boolean)
    .map((item) => absoluteUrl(item)),
  brand: {
    "@type": "Brand",
    name: "Global Basket",
  },
  category: product.category,
  additionalProperty: (product.specs || []).map((item) => ({
    "@type": "PropertyValue",
    name: item.label,
    value: item.value,
  })),
});

const trimSlashes = (value = "") => String(value).trim().replace(/^\/+|\/+$/g, "");

const humanizePathSegment = (value = "") =>
  decodeURIComponent(String(value || ""))
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const normalizeInternalPath = (value = "/") => {
  const [pathname = "/"] = String(value || "").split(/[?#]/);
  if (!pathname || pathname === "/") return "/";
  const trimmed = trimSlashes(pathname);
  return trimmed ? `/${trimmed}/` : "/";
};

const getPathSegments = (value = "/") => {
  const normalized = trimSlashes(normalizeInternalPath(value));
  return normalized ? normalized.split("/") : [];
};

const productIndex = new Map();
products.forEach((item) => {
  if (!item) return;
  [item.id, item.slug, item.href].filter(Boolean).forEach((key) => {
    productIndex.set(String(key), item);
  });
});

const categoryIndex = new Map();
categories.forEach((item) => {
  if (!item) return;
  [item.id, item.slug, item.href].filter(Boolean).forEach((key) => {
    categoryIndex.set(String(key), item);
  });
});

const journalPostIndex = new Map();
journalPosts.forEach((item) => {
  if (!item?.slug) return;
  journalPostIndex.set(item.slug, item);
});

const legalDocumentRoutes = new Map([
  [
    "public-offer",
    {
      name: "Публичная оферта",
      path: "/legal/public-offer/",
    },
  ],
  [
    "privacy-policy",
    {
      name: "Политика обработки персональных данных",
      path: "/legal/privacy-policy/",
    },
  ],
  [
    "personal-data-consent",
    {
      name: "Согласие на обработку персональных данных",
      path: "/legal/personal-data-consent/",
    },
  ],
]);

const normalizeLookupValue = (value = "") => trimSlashes(value);

const findProduct = (value = "") => {
  const normalized = normalizeLookupValue(value);
  if (!normalized) return null;
  return (
    productIndex.get(normalized) ||
    productIndex.get(`/${normalized}/`) ||
    productIndex.get(`/catalog/${normalized}/`) ||
    null
  );
};

const findCategory = (value = "") => {
  const normalized = normalizeLookupValue(value);
  if (!normalized) return null;
  return (
    categoryIndex.get(normalized) ||
    categoryIndex.get(`/${normalized}/`) ||
    categoryIndex.get(`/categories/${normalized}/`) ||
    null
  );
};

const breadcrumbRouteBySegment = new Map();

const registerBreadcrumbRoute = (path, label) => {
  const normalizedPath = normalizeInternalPath(path);
  const [segment] = getPathSegments(normalizedPath);
  if (!segment || !label || breadcrumbRouteBySegment.has(segment)) return;
  breadcrumbRouteBySegment.set(segment, {
    name: label,
    path: normalizedPath,
  });
};

(store.primaryNav || []).forEach((item) => registerBreadcrumbRoute(item?.href, item?.label));
Object.entries(store.utilityPages || {}).forEach(([slug, page]) => {
  registerBreadcrumbRoute(`/${slug}/`, page?.title || humanizePathSegment(slug));
});
registerBreadcrumbRoute("/catalog/", "Каталог");
registerBreadcrumbRoute("/journal/", "Журнал");
registerBreadcrumbRoute("/legal/", "Юридические документы");

const buildRouteBreadcrumbItems = (routePath = "/") => {
  const location = new URL(routePath, SITE_URL);
  const normalizedPath = normalizeInternalPath(location.pathname);
  const segments = getPathSegments(normalizedPath);
  const items = [{ name: "Главная", path: "/" }];

  if (!segments.length) return items;

  const [section, slug] = segments;

  if (section === "catalog") {
    const catalogRoute = breadcrumbRouteBySegment.get("catalog") || { name: "Каталог", path: "/catalog/" };
    items.push(catalogRoute);

    if (slug) {
      const productItem = findProduct(slug) || findProduct(normalizedPath);
      items.push({
        name: productItem?.shortName || humanizePathSegment(slug),
        path: routePath,
      });
      return items;
    }

    const categoryId = location.searchParams.get("category") || "";
    const categoryItem = findCategory(categoryId);
    if (categoryItem) {
      items.push({
        name: categoryItem.title || categoryItem.name || humanizePathSegment(categoryId),
        path: `/catalog/?category=${categoryItem.id}`,
      });
    }

    return items;
  }

  if (section === "categories") {
    const catalogRoute = breadcrumbRouteBySegment.get("catalog") || { name: "Каталог", path: "/catalog/" };
    const categoryItem = findCategory(slug);
    const categoryId = categoryItem?.id || slug || "";
    items.push(catalogRoute);
    if (categoryId) {
      items.push({
        name: categoryItem?.title || categoryItem?.name || humanizePathSegment(categoryId),
        path: `/catalog/?category=${categoryId}`,
      });
    }
    return items;
  }

  if (section === "journal") {
    const journalRoute = breadcrumbRouteBySegment.get("journal") || { name: "Журнал", path: "/journal/" };
    items.push(journalRoute);
    if (slug) {
      const post = journalPostIndex.get(slug);
      items.push({
        name: post?.title || humanizePathSegment(slug),
        path: routePath,
      });
    }
    return items;
  }

  if (section === "legal") {
    const legalRoute =
      breadcrumbRouteBySegment.get("legal") || { name: "Юридические документы", path: "/legal/" };
    items.push(legalRoute);

    if (slug) {
      const documentRoute = legalDocumentRoutes.get(slug);
      items.push({
        name: documentRoute?.name || humanizePathSegment(slug),
        path: routePath,
      });
    }

    return items;
  }

  const staticRoute = breadcrumbRouteBySegment.get(section);
  if (staticRoute) {
    items.push({
      name: staticRoute.name,
      path: routePath,
    });
    return items;
  }

  let accumulatedPath = "";
  segments.forEach((segment) => {
    accumulatedPath += `/${segment}`;
    items.push({
      name: humanizePathSegment(segment),
      path: `${accumulatedPath}/`,
    });
  });

  return items;
};

const buildRouteBreadcrumbSchema = (routePath = "/") =>
  buildBreadcrumbSchema(buildRouteBreadcrumbItems(routePath));

const buildFaqSchema = (items = []) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
});

const createClassList = () => {
  const set = new Set();
  return {
    add: (...names) => names.forEach((name) => set.add(name)),
    remove: (...names) => names.forEach((name) => set.delete(name)),
    contains: (name) => set.has(name),
    toggle: (name, force) => {
      if (force === true) {
        set.add(name);
        return true;
      }
      if (force === false) {
        set.delete(name);
        return false;
      }
      if (set.has(name)) {
        set.delete(name);
        return false;
      }
      set.add(name);
      return true;
    },
  };
};

class FakeElement {
  constructor(tagName = "div") {
    this.tagName = String(tagName).toLowerCase();
    this.innerHTML = "";
    this.textContent = "";
    this.value = "";
    this.dataset = {};
    this.attributes = new Map();
    this.classList = createClassList();
    this.style = {
      setProperty() {},
    };
  }

  querySelector() {
    return null;
  }

  querySelectorAll() {
    return [];
  }

  addEventListener() {}

  removeEventListener() {}

  append(node) {
    if (node?.tagName === "meta") {
      return node;
    }
    return node;
  }

  appendChild(node) {
    return this.append(node);
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) || null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  focus() {}

  scrollIntoView() {}

  reportValidity() {
    return true;
  }
}

class FakeHead extends FakeElement {
  constructor() {
    super("head");
    this.metaTags = new Map();
  }

  querySelector(selector) {
    const metaMatch = selector.match(/^meta\[name="(.+)"\]$/);
    if (metaMatch) {
      return this.metaTags.get(metaMatch[1]) || null;
    }
    return null;
  }

  append(node) {
    if (node?.tagName === "meta") {
      const name = node.getAttribute("name");
      if (name) {
        this.metaTags.set(name, node);
      }
    }
    return node;
  }
}

class FakeDocument {
  constructor({ bodyDataset = {}, mountKeys = [] }) {
    this.title = "";
    this.body = new FakeElement("body");
    this.body.dataset = { ...bodyDataset };
    this.documentElement = {
      style: {
        setProperty() {},
      },
    };
    this.head = new FakeHead();
    this.mounts = new Map();

    mountKeys.forEach((key) => {
      this.mounts.set(key, new FakeElement("div"));
    });
  }

  createElement(tagName) {
    return new FakeElement(tagName);
  }

  addEventListener() {}

  querySelector(selector) {
    if (selector === "[data-site-header]") return this.mounts.get("data-site-header") || null;
    if (selector === "[data-site-footer]") return this.mounts.get("data-site-footer") || null;
    if (selector.startsWith("#")) {
      return this.mounts.get(selector.slice(1)) || null;
    }
    return null;
  }

  querySelectorAll() {
    return [];
  }
}

const bundleSource = `
${dataSource}
${mainSource}
this.__GB_EXPORTS__ = {
  renderHeader,
  renderFooter,
  renderHome,
  renderCatalog,
  renderStaticPage,
  renderProductPage,
  renderContactsPage,
  renderAboutPage,
  renderDeliveryPage,
  renderCategoryPage,
  renderJournalPage,
  renderArticlePage,
  renderUtilityPage,
  store,
};
`;

const renderMounts = ({ path: routePath, bodyDataset, mountKeys, renderMethod }) => {
  const document = new FakeDocument({ bodyDataset, mountKeys: ["data-site-header", "data-site-footer", ...mountKeys] });
  const location = new URL(routePath, SITE_URL);
  const windowObject = {
    location,
    history: {
      replaceState() {},
    },
    matchMedia() {
      return {
        matches: true,
        addEventListener() {},
        removeEventListener() {},
      };
    },
    addEventListener() {},
    removeEventListener() {},
    requestAnimationFrame() {
      return 0;
    },
    cancelAnimationFrame() {},
    setTimeout() {
      return 0;
    },
    clearTimeout() {},
    scrollTo() {},
    scrollY: 0,
    sessionStorage: {
      getItem() {
        return null;
      },
      setItem() {},
      removeItem() {},
    },
  };

  const sandbox = {
    window: windowObject,
    document,
    console,
    URL,
    URLSearchParams,
    Intl,
    HTMLElement: FakeElement,
    HTMLInputElement: FakeElement,
    FormData,
    fetch: async () => {
      throw new Error("fetch is not available during prerender");
    },
    IntersectionObserver: class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
    requestAnimationFrame: windowObject.requestAnimationFrame,
    cancelAnimationFrame: windowObject.cancelAnimationFrame,
    setTimeout: windowObject.setTimeout,
    clearTimeout: windowObject.clearTimeout,
  };

  sandbox.globalThis = sandbox;
  sandbox.self = windowObject;
  windowObject.window = windowObject;
  windowObject.document = document;

  vm.runInNewContext(bundleSource, sandbox, { filename: "prerender-bundle.js" });
  const api = sandbox.__GB_EXPORTS__;

  api.renderHeader();
  api.renderFooter();
  api[renderMethod]();

  return {
    document,
    store: api.store,
  };
};

const injectWrappedBlock = (html, start, end, replacement, placeholderPattern) => {
  const block = `${start}\n${replacement}\n${end}`;
  const markerPattern = new RegExp(`${escapeRegex(start)}[\\s\\S]*?${escapeRegex(end)}`, "m");
  if (markerPattern.test(html)) {
    return html.replace(markerPattern, block);
  }
  return html.replace(placeholderPattern, block);
};

const replaceElementContents = (html, id, content, mode = "html") => {
  const openPattern = new RegExp(`<([a-z0-9-]+)([^>]*\\bid="${escapeRegex(id)}"[^>]*)>`, "i");
  const openMatch = openPattern.exec(html);
  if (!openMatch) {
    throw new Error(`Unable to find #${id}`);
  }

  const tagName = openMatch[1];
  const openTagStart = openMatch.index;
  const openTagEnd = openTagStart + openMatch[0].length;
  const value = mode === "text" ? escapeHtml(content) : content;

  const closePattern = new RegExp(`</?${escapeRegex(tagName)}\\b[^>]*>`, "gi");
  closePattern.lastIndex = openTagEnd;
  let depth = 1;
  let closeTagStart = -1;
  let closeTagEnd = -1;

  for (let match = closePattern.exec(html); match; match = closePattern.exec(html)) {
    const token = match[0];
    const isClosing = token.startsWith("</");
    const isSelfClosing = token.endsWith("/>");
    if (isClosing) {
      depth -= 1;
      if (depth === 0) {
        closeTagStart = match.index;
        closeTagEnd = match.index + token.length;
        break;
      }
    } else if (!isSelfClosing) {
      depth += 1;
    }
  }

  if (closeTagStart === -1 || closeTagEnd === -1) {
    throw new Error(`Unable to find closing tag for #${id}`);
  }

  return `${html.slice(0, openTagEnd)}${value}${html.slice(closeTagStart, closeTagEnd)}${html.slice(closeTagEnd)}`;
};

const replaceTitle = (html, title) =>
  html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(buildDocumentTitle(title))}</title>`);

const upsertMetaName = (html, name, content) => {
  const pattern = new RegExp(`<meta\\s+name=["']${escapeRegex(name)}["'][^>]*>`, "i");
  if (!content) return html.replace(pattern, "");
  const tag = `<meta name="${name}" content="${escapeAttribute(content)}" />`;
  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`);
};

const applySeo = (html, { path: routePath, title, description, keywords = "", image = "", ogType = "website", schemas = [] }) => {
  let next = replaceTitle(html, title);
  next = upsertMetaName(next, "description", description);
  next = upsertMetaName(next, "keywords", keywords);
  const socialImage = DEFAULT_SHARE_IMAGE;

  const markerPattern = new RegExp(`${escapeRegex(SEO_START)}[\\s\\S]*?${escapeRegex(SEO_END)}\\n?`, "m");
  next = next.replace(markerPattern, "");

  const seoBlock = [
    SEO_START,
    `    <link rel="canonical" href="${absoluteUrl(routePath)}" />`,
    `    <meta property="og:type" content="${escapeAttribute(ogType)}" />`,
    `    <meta property="og:title" content="${escapeAttribute(buildDocumentTitle(title))}" />`,
    `    <meta property="og:description" content="${escapeAttribute(description)}" />`,
    `    <meta property="og:url" content="${absoluteUrl(routePath)}" />`,
    `    <meta property="og:image" content="${absoluteUrl(socialImage)}" />`,
    `    <meta property="og:image:width" content="${DEFAULT_SHARE_IMAGE_WIDTH}" />`,
    `    <meta property="og:image:height" content="${DEFAULT_SHARE_IMAGE_HEIGHT}" />`,
    `    <meta property="og:image:alt" content="${escapeAttribute(DEFAULT_SHARE_IMAGE_ALT)}" />`,
    `    <meta property="og:image:type" content="image/jpeg" />`,
    `    <meta name="twitter:card" content="summary_large_image" />`,
    `    <meta name="twitter:title" content="${escapeAttribute(buildDocumentTitle(title))}" />`,
    `    <meta name="twitter:description" content="${escapeAttribute(description)}" />`,
    `    <meta name="twitter:image" content="${absoluteUrl(socialImage)}" />`,
    `    <meta name="twitter:image:alt" content="${escapeAttribute(DEFAULT_SHARE_IMAGE_ALT)}" />`,
    ...schemas.map(
      (schema) =>
        `    <script type="application/ld+json">${serializeJsonLd(schema)}</script>`,
    ),
    SEO_END,
  ]
    .filter(Boolean)
    .join("\n");

  return next.replace(/<\/head>/i, `${seoBlock}\n  </head>`);
};

const applyCommonFrame = (html, rendered) => {
  let next = injectWrappedBlock(
    html,
    HEADER_START,
    HEADER_END,
    `<div data-site-header>${rendered.document.mounts.get("data-site-header")?.innerHTML || ""}</div>`,
    /<div data-site-header><\/div>/,
  );
  next = injectWrappedBlock(
    next,
    FOOTER_START,
    FOOTER_END,
    `<div data-site-footer>${rendered.document.mounts.get("data-site-footer")?.innerHTML || ""}</div>`,
    /<div data-site-footer><\/div>/,
  );
  return next.replace(
    /<div class="breadcrumb">/g,
    '<div class="breadcrumb" role="navigation" aria-label="Breadcrumbs">',
  );
};

const renderBreadcrumbHtml = (routePath = "/") => {
  const items = buildRouteBreadcrumbItems(routePath);
  return `
<div class="breadcrumb" role="navigation" aria-label="Breadcrumbs">
  ${items
    .map((item, index) => {
      const isCurrent = index === items.length - 1;
      const content = !isCurrent ? `<a href="${escapeAttribute(item.path)}">${item.name}</a>` : `<span>${item.name}</span>`;
      return `${index ? "\n  <span>/</span>\n  " : ""}${content}`;
    })
    .join("")}
</div>`.trim();
};

const replaceFirstBreadcrumb = (html, routePath = "/") =>
  html.replace(
    /<div class="breadcrumb"(?:[^>]*)>[\s\S]*?<\/div>/i,
    renderBreadcrumbHtml(routePath),
  );

const replaceBodyAttributes = (html, attributes) =>
  html.replace(/<body\b[^>]*>/i, `<body ${attributes}>`);

const replaceMainContent = (html, content) =>
  html.replace(/<main>[\s\S]*?<\/main>/i, `<main>\n${content}\n    </main>`);

const injectBeforeClosingHead = (html, content) =>
  html.replace(/<\/head>/i, `${content}\n  </head>`);

const removeSectionByAnchor = (html, anchor) => {
  const anchorIndex = html.indexOf(anchor);
  if (anchorIndex === -1) return html;

  const sectionStart = html.lastIndexOf("<section", anchorIndex);
  const sectionEnd = html.indexOf("</section>", anchorIndex);
  if (sectionStart === -1 || sectionEnd === -1) return html;

  return `${html.slice(0, sectionStart)}${html.slice(sectionEnd + "</section>".length)}`;
};

const stripProductPageExtras = (html) =>
  [ 'id="product-benefits-eyebrow"', 'id="marketplaces-pdp"', 'id="product-faq"' ].reduce(
    (result, anchor) => removeSectionByAnchor(result, anchor),
    html,
  ).replace(/\n{3,}/g, "\n\n");

const loadTemplateHtml = async (file) => {
  try {
    return await fs.readFile(path.join(ROOT, file), "utf8");
  } catch {}

  try {
    return execFileSync("git", ["show", `HEAD:${file}`], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return "";
  }
};

const writeRenderedPage = async ({
  file,
  rendered,
  htmlMounts = [],
  textMounts = [],
  seo,
  transformHtml,
}) => {
  const fullPath = path.join(ROOT, file);
  let html = await loadTemplateHtml(file);
  html = applyCommonFrame(html, rendered);
  html = applySeo(html, seo);
  html = replaceFirstBreadcrumb(html, seo?.path || "/");

  htmlMounts.forEach((id) => {
    const mount = rendered.document.mounts.get(id);
    html = replaceElementContents(html, id, mount?.innerHTML || "");
  });

  textMounts.forEach((id) => {
    const mount = rendered.document.mounts.get(id);
    html = replaceElementContents(html, id, mount?.textContent || "", "text");
  });

  if (transformHtml) {
    html = transformHtml(html);
  }

  await fs.writeFile(fullPath, html);
};

await writeRenderedPage({
  file: "index.html",
  rendered: renderMounts({
    path: "/",
    bodyDataset: { page: "home", nav: "home" },
    mountKeys: [
      "home-hero",
      "home-featured",
      "home-categories",
      "home-advantages",
      "home-journal-featured",
      "home-journal-list",
    ],
    renderMethod: "renderHome",
  }),
  htmlMounts: [
    "home-hero",
    "home-featured",
    "home-categories",
    "home-advantages",
    "home-journal-featured",
    "home-journal-list",
  ],
  seo: {
    path: "/",
    title: "Главная",
    description:
      "Global Basket — каталог натуральных продуктов со всего мира с inquiry-first сценарием: описание товара, журнал и запрос условий без checkout-обещаний.",
    image: featuredProduct?.images?.main || "/assets/logo.jpg",
    schemas: [buildOrganizationSchema()],
  },
});

await writeRenderedPage({
  file: "about/index.html",
  rendered: renderMounts({
    path: "/about/",
    bodyDataset: { page: "about", nav: "about" },
    mountKeys: [
      "about-hero",
      "about-who",
      "about-mission",
      "about-facts",
      "about-values",
      "about-why",
      "about-selection",
      "about-differences",
      "about-character",
      "about-legend",
      "about-cta",
    ],
    renderMethod: "renderAboutPage",
  }),
  htmlMounts: [
    "about-hero",
    "about-who",
    "about-mission",
    "about-facts",
    "about-values",
    "about-why",
    "about-selection",
    "about-differences",
    "about-character",
    "about-legend",
    "about-cta",
  ],
  seo: {
    path: "/about/",
    title: "О бренде",
    description:
      "О бренде Global Basket: кто мы, как отбираем продукты, какие ценности держим и почему каталог работает как честный сценарий выбора и запроса условий.",
    image: store.aboutPage.hero.image.src,
    schemas: [
      buildOrganizationSchema(),
      buildRouteBreadcrumbSchema("/about/"),
    ],
  },
});

await writeRenderedPage({
  file: "delivery/index.html",
  rendered: renderMounts({
    path: "/delivery/",
    bodyDataset: { page: "delivery", nav: "delivery" },
    mountKeys: ["delivery-story-grid", "delivery-steps", "delivery-cards", "delivery-returns"],
    renderMethod: "renderDeliveryPage",
  }),
  htmlMounts: ["delivery-story-grid", "delivery-steps", "delivery-cards", "delivery-returns"],
  seo: {
    path: "/delivery/",
    title: "Доставка и оплата",
    description:
      "Доставка и оплата Global Basket: как работает inquiry-first сценарий, когда уточняется стоимость, объём, поставка и следующий шаг без checkout-логики.",
    image: featuredProduct?.images?.main || "/assets/logo.jpg",
    schemas: [
      buildOrganizationSchema(),
      buildRouteBreadcrumbSchema("/delivery/"),
    ],
  },
});

await writeRenderedPage({
  file: "contacts/index.html",
  rendered: renderMounts({
    path: "/contacts/",
    bodyDataset: { page: "contacts", nav: "contacts" },
    mountKeys: ["contacts-intro", "contact-panel"],
    renderMethod: "renderContactsPage",
  }),
  htmlMounts: ["contacts-intro", "contact-panel"],
  seo: {
    path: "/contacts/",
    title: "Контакты",
    description:
      "Контакты Global Basket: форма запроса по поставке, продукту и доставке, плюс резервные каналы связи через Telegram, телефон и email.",
    image: "/assets/logo.jpg",
    schemas: [
      buildOrganizationSchema(),
      buildRouteBreadcrumbSchema("/contacts/"),
    ],
  },
});

for (const [slug, utilityPage] of Object.entries(store.utilityPages || {})) {
  await writeRenderedPage({
    file: `${slug}/index.html`,
    rendered: renderMounts({
      path: `/${slug}/`,
      bodyDataset: { page: "utility", utility: slug, nav: "utility" },
      mountKeys: ["utility-page"],
      renderMethod: "renderUtilityPage",
    }),
    htmlMounts: ["utility-page"],
    seo: {
      path: `/${slug}/`,
      title: utilityPage.title,
      description: utilityPage.text,
      image: "/assets/logo.jpg",
      schemas: [
        buildOrganizationSchema(),
        buildRouteBreadcrumbSchema(`/${slug}/`),
      ],
    },
  });
}

const legalPages = [
  {
    file: "legal/index.html",
    routePath: "/legal/",
    title: "Юридические документы",
    description:
      "Юридические документы Global Basket: публичная оферта, политика обработки персональных данных и согласие на обработку персональных данных в HTML и PDF.",
  },
  {
    file: "legal/public-offer/index.html",
    routePath: "/legal/public-offer/",
    title: "Публичная оферта",
    description:
      "Публичная оферта Global Basket о продаже товаров дистанционным способом: оформление заказа, согласование существенных условий, доставка, возврат и реквизиты продавца.",
  },
  {
    file: "legal/privacy-policy/index.html",
    routePath: "/legal/privacy-policy/",
    title: "Политика обработки персональных данных",
    description:
      "Политика обработки персональных данных и конфиденциальности сайта Global Basket: состав данных, цели обработки, cookies, localStorage и права пользователей.",
  },
  {
    file: "legal/personal-data-consent/index.html",
    routePath: "/legal/personal-data-consent/",
    title: "Согласие на обработку персональных данных",
    description:
      "Согласие на обработку персональных данных для форм и обращений на сайте Global Basket: цели обработки, состав данных, срок действия и порядок отзыва согласия.",
  },
];

for (const page of legalPages) {
  await writeRenderedPage({
    file: page.file,
    rendered: renderMounts({
      path: page.routePath,
      bodyDataset: { page: "legal", legal: trimSlashes(page.routePath) || "index", nav: "utility" },
      mountKeys: [],
      renderMethod: "renderStaticPage",
    }),
    seo: {
      path: page.routePath,
      title: page.title,
      description: page.description,
      image: "/assets/logo.jpg",
      schemas: [
        buildOrganizationSchema(),
        buildRouteBreadcrumbSchema(page.routePath),
      ],
    },
  });
}

await writeRenderedPage({
  file: "journal/index.html",
  rendered: renderMounts({
    path: "/journal/",
    bodyDataset: { page: "journal", nav: "journal" },
    mountKeys: ["journal-featured", "journal-list"],
    renderMethod: "renderJournalPage",
  }),
  htmlMounts: ["journal-featured", "journal-list"],
  seo: {
    path: "/journal/",
    title: "Журнал",
    description:
      "Журнал Global Basket — материалы о продукте, подаче и развитии каталога, доступные уже в исходном HTML без зависимости от client-side рендера.",
    image: store.journal.posts[0]?.image || featuredProduct?.images?.main || "/assets/logo.jpg",
    schemas: [
      buildOrganizationSchema(),
      buildRouteBreadcrumbSchema("/journal/"),
    ],
  },
});

await writeRenderedPage({
  file: "catalog/index.html",
  rendered: renderMounts({
    path: "/catalog/",
    bodyDataset: { page: "catalog", nav: "catalog" },
    mountKeys: ["catalog-sidebar", "catalog-toolbar", "catalog-grid", "catalog-support"],
    renderMethod: "renderCatalog",
  }),
  htmlMounts: ["catalog-sidebar", "catalog-toolbar", "catalog-grid", "catalog-support"],
  seo: {
    path: "/catalog/",
    title: "Каталог",
    description:
      "Каталог Global Basket: товарные карточки с прямым переходом к подробному описанию и понятным запросом условий без промежуточных страниц категорий.",
    image: featuredProduct?.images?.main || "/assets/logo.jpg",
    schemas: [
      buildOrganizationSchema(),
      buildRouteBreadcrumbSchema("/catalog/"),
    ],
  },
});

for (const category of categories) {
  const targetPath = `/catalog/?category=${category.id}`;
  await writeRenderedPage({
    file: `categories/${category.id}/index.html`,
    rendered: renderMounts({
      path: `/categories/${category.id}/`,
      bodyDataset: { page: "catalog-redirect", category: category.id, nav: "catalog" },
      mountKeys: [],
      renderMethod: "renderStaticPage",
    }),
    seo: {
      path: targetPath,
      title: category.title || category.name,
      description: category.intro || category.description || "",
      image: category.image || featuredProduct?.images?.main || "/assets/logo.jpg",
      schemas: [
        buildOrganizationSchema(),
        buildRouteBreadcrumbSchema(targetPath),
      ],
    },
    transformHtml: (html) => {
      const redirectBlock = `
      <section class="page-hero">
        <div class="shell">
          <div class="hero-copy">
            <h1>Переходим в каталог</h1>
            <p>Промежуточные страницы категорий убраны. Открываем каталог сразу на товарах категории «${escapeHtml(category.title || category.name)}».</p>
            <div class="hero-stage__actions">
              <a class="button button--small" href="${targetPath}">Открыть товары</a>
            </div>
          </div>
        </div>
      </section>`;
      const headRedirect = [
        `    <meta http-equiv="refresh" content="0; url=${escapeAttribute(targetPath)}" />`,
        "    <script>",
        `      window.location.replace(${JSON.stringify(targetPath)});`,
        "    </script>",
      ].join("\n");

      let next = html
        .replace(/\s*<meta\s+http-equiv=["']refresh["'][^>]*>\n?/gi, "")
        .replace(/\s*<script>\s*window\.location\.replace\([\s\S]*?<\/script>\n?/gi, "");
      next = replaceBodyAttributes(
        next,
        `data-page="catalog-redirect" data-category="${escapeAttribute(category.id)}" data-nav="catalog"`,
      );
      next = injectBeforeClosingHead(next, headRedirect);
      next = replaceMainContent(next, redirectBlock);
      return next;
    },
  });
}

for (const post of store.journal.posts) {
  await writeRenderedPage({
    file: `journal/${post.slug}/index.html`,
    rendered: renderMounts({
      path: `/journal/${post.slug}/`,
      bodyDataset: { page: "article", article: post.slug, nav: "journal" },
      mountKeys: ["article-hero", "article-sections"],
      renderMethod: "renderArticlePage",
    }),
    htmlMounts: ["article-hero", "article-sections"],
    seo: {
      path: `/journal/${post.slug}/`,
      title: post.title,
      description: post.lead || post.excerpt || "",
      image: post.image || featuredProduct?.images?.main || "/assets/logo.jpg",
      ogType: "article",
      schemas: [
        buildOrganizationSchema(),
        buildRouteBreadcrumbSchema(`/journal/${post.slug}/`),
      ],
    },
  });
}

for (const product of products) {
  await writeRenderedPage({
    file: product.href.replace(/^\//, "") + "index.html",
    rendered: renderMounts({
      path: product.href,
      bodyDataset: { page: "product", product: product.id, nav: "catalog" },
      mountKeys: [
        "product-gallery",
        "product-summary",
        "product-details",
      ],
      renderMethod: "renderProductPage",
    }),
    htmlMounts: [
      "product-gallery",
      "product-summary",
      "product-details",
    ],
    seo: {
      path: product.href,
      title: product.seoTitle || product.h1 || product.shortName,
      description:
        product.seoDescription ||
        product.annotation ||
        product.shortDescription ||
        product.catalogDescription,
      keywords: product.seoKeywords || "",
      image: product.images?.main || product.gallery?.[0]?.src || "/assets/logo.jpg",
      schemas: [
        buildOrganizationSchema(),
        buildRouteBreadcrumbSchema(product.href),
        buildProductSchema(product),
      ],
    },
    transformHtml: stripProductPageExtras,
  });
}
