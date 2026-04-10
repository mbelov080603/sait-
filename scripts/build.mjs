import fs from "node:fs";
import path from "node:path";

import { categoryById, postBySlug, productById, siteData } from "../content/site-data.mjs";

const cwd = process.cwd();
const indexablePages = [];

const ensureDir = (filePath) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
};

const writeText = (relativePath, content) => {
  const filePath = path.join(cwd, relativePath);
  ensureDir(filePath);
  fs.writeFileSync(filePath, content, "utf8");
};

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const renderText = (text = "") => escapeHtml(text);
const pageUrl = (pathname) => new URL(pathname, siteData.site.siteUrl).toString();

const linkAttrs = (href, extra = {}) => {
  const attrs = [`href="${escapeHtml(href)}"`];

  if (/^https?:\/\//.test(href)) {
    attrs.push('target="_blank"', 'rel="noreferrer"');
  }

  Object.entries(extra).forEach(([key, value]) => {
    if (value === null || value === undefined || value === false) return;
    if (value === true) {
      attrs.push(key);
      return;
    }
    attrs.push(`${key}="${escapeHtml(value)}"`);
  });

  return attrs.join(" ");
};

const trackAttrs = (eventName, params = {}) => {
  const attrs = { "data-track-event": eventName };
  Object.entries(params).forEach(([key, value]) => {
    if (!value) return;
    attrs[`data-track-${key}`] = value;
  });
  return attrs;
};

const renderAction = ({
  href,
  label,
  variant = "button",
  className = "",
  eventName,
  eventParams,
  ariaLabel,
}) => {
  const track = eventName ? trackAttrs(eventName, eventParams) : {};
  const classes = className || (variant === "link" ? "text-link" : "button");
  return `<a class="${classes}" ${linkAttrs(href, { ...track, "aria-label": ariaLabel || null })}>${escapeHtml(label)}</a>`;
};

const renderMetaImage = (imagePath) => new URL(imagePath || siteData.site.defaultOgImage, siteData.site.siteUrl).toString();

const renderSchema = (nodes = []) =>
  nodes.length
    ? `<script type="application/ld+json">${JSON.stringify(nodes.length === 1 ? nodes[0] : nodes)}</script>`
    : "";

const renderBreadcrumbs = (items = []) => {
  const schemaItems = items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.label,
    item: pageUrl(item.href || "/"),
  }));

  return {
    html: `
      <nav class="breadcrumb" aria-label="Хлебные крошки">
        <ol>
          ${items
            .map((item, index) => {
              const last = index === items.length - 1;
              return `<li>${last ? `<span aria-current="page">${escapeHtml(item.label)}</span>` : `<a ${linkAttrs(item.href)}>${escapeHtml(item.label)}</a>`}</li>`;
            })
            .join("")}
        </ol>
      </nav>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: schemaItems,
    },
  };
};

const renderFaq = (faq = [], title = "Частые вопросы") => {
  if (!faq.length) return { html: "", schema: null };

  return {
    html: `
      <section class="section">
        <div class="shell">
          <div class="section-heading">
            <p class="eyebrow">FAQ</p>
            <h2>${escapeHtml(title)}</h2>
          </div>
          <div class="faq-list">
            ${faq
              .map(
                (item) => `
                  <details class="faq-item">
                    <summary>${escapeHtml(item.question)}</summary>
                    <div class="faq-item__content">
                      <p>${escapeHtml(item.answer)}</p>
                    </div>
                  </details>
                `,
              )
              .join("")}
          </div>
        </div>
      </section>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  };
};

const organizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteData.site.name,
  url: siteData.site.siteUrl,
  description: siteData.company.description,
  email: siteData.contact.email,
  telephone: siteData.contact.phone,
  logo: new URL("/assets/logo.jpg", siteData.site.siteUrl).toString(),
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: siteData.contact.phone,
      email: siteData.contact.email,
      contactType: "customer support",
      availableLanguage: ["ru"],
    },
  ],
  sameAs: [
    ...siteData.channels.marketplaces.map((channel) => channel.href),
    siteData.contact.telegramBotHref,
    siteData.contact.telegramChannelHref,
  ],
});

const websiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteData.site.name,
  url: siteData.site.siteUrl,
  inLanguage: siteData.site.language,
});

const collectionSchema = (name, items, pathname) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name,
  url: pageUrl(pathname),
  hasPart: items.map((item) => ({
    "@type": "WebPage",
    name: item.name || item.title,
    url: pageUrl(item.href),
  })),
});

const itemListSchema = (items) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name || item.title,
    url: pageUrl(item.href),
  })),
});

const productSchema = (product) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.name,
  description: product.description,
  category: categoryById[product.categoryId].name,
  image: [
    renderMetaImage(product.heroImage.src),
    renderMetaImage(product.packshot.src),
    renderMetaImage(product.lifestyleImage.src),
  ],
  brand: {
    "@type": "Brand",
    name: siteData.site.name,
  },
  sku: product.id,
});

const articleSchema = (post, pathname) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: post.title,
  description: post.description,
  image: renderMetaImage(post.image.src),
  datePublished: post.date,
  dateModified: siteData.generatedAt,
  author: {
    "@type": "Organization",
    name: siteData.site.name,
  },
  publisher: {
    "@type": "Organization",
    name: siteData.site.name,
    logo: {
      "@type": "ImageObject",
      url: renderMetaImage("/assets/logo.jpg"),
    },
  },
  mainEntityOfPage: pageUrl(pathname),
});

const renderTopbar = () => `
  <div class="site-topbar">
    <div class="shell site-topbar__inner">
      <span>${escapeHtml(siteData.site.officialLabel)}</span>
      <div class="site-topbar__links">
        <a ${linkAttrs(siteData.contact.phoneHref, trackAttrs("phone_click", { location: "topbar" }))}>${escapeHtml(siteData.contact.phone)}</a>
        <a ${linkAttrs(siteData.contact.telegramBotHref, trackAttrs("telegram_click", { location: "topbar" }))}>${escapeHtml(siteData.contact.telegramBotLabel)}</a>
      </div>
    </div>
  </div>
`;

const renderHeader = (pathname) => `
  <header class="site-header">
    ${renderTopbar()}
    <div class="shell site-header__inner">
      <a class="brand" ${linkAttrs("/")}>
        <img src="/assets/logo.jpg" width="360" height="360" alt="Логотип Global Basket" />
        <div>
          <strong>${escapeHtml(siteData.site.name)}</strong>
          <span>${escapeHtml(siteData.site.tagline)}</span>
        </div>
      </a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu" data-menu-toggle>Меню</button>
      <nav class="main-nav" aria-label="Основная навигация">
        ${siteData.navigation.primary
          .map((item) => {
            const isCurrent =
              item.href === pathname || (item.href !== "/" && pathname.startsWith(item.href));
            return `<a ${linkAttrs(item.href, { "aria-current": isCurrent ? "page" : null })}>${escapeHtml(item.label)}</a>`;
          })
          .join("")}
      </nav>
      <div class="header-cta">
        ${renderAction({
          href: "/where-to-buy/",
          label: "Где купить",
          className: "button button--small",
        })}
        ${renderAction({
          href: "/b2b/",
          label: "Опт / B2B",
          className: "button button--small button--ghost",
          eventName: "wholesale_cta_click",
          eventParams: { location: "header" },
        })}
        <a class="header-link" ${linkAttrs(siteData.contact.telegramBotHref, trackAttrs("telegram_click", { location: "header" }))}>Telegram</a>
      </div>
    </div>
    <div class="mobile-menu" id="mobile-menu" hidden data-mobile-menu>
      <div class="shell mobile-menu__inner">
        <nav class="mobile-nav" aria-label="Мобильная навигация">
          ${siteData.navigation.primary
            .map((item) => `<a ${linkAttrs(item.href)}>${escapeHtml(item.label)}</a>`)
            .join("")}
        </nav>
        <div class="mobile-menu__actions">
          ${renderAction({
            href: "/where-to-buy/",
            label: "Где купить",
            className: "button",
          })}
          ${renderAction({
            href: "/b2b/",
            label: "Опт / B2B",
            className: "button button--ghost",
            eventName: "wholesale_cta_click",
            eventParams: { location: "mobile_menu" },
          })}
          ${renderAction({
            href: siteData.contact.telegramBotHref,
            label: "Написать в Telegram",
            className: "text-link",
            eventName: "telegram_click",
            eventParams: { location: "mobile_menu" },
          })}
        </div>
      </div>
    </div>
  </header>
`;

const renderFooter = () => `
  <footer class="site-footer">
    <div class="shell site-footer__grid">
      <section class="footer-brand">
        <p class="eyebrow">Global Basket</p>
        <h2>${escapeHtml(siteData.site.tagline)}</h2>
        <p>${escapeHtml(siteData.company.description)}</p>
        <ul class="footer-contact-list">
          <li><a ${linkAttrs(siteData.contact.phoneHref, trackAttrs("phone_click", { location: "footer" }))}>${escapeHtml(siteData.contact.phone)}</a></li>
          <li><a ${linkAttrs(siteData.contact.emailHref, trackAttrs("email_click", { location: "footer" }))}>${escapeHtml(siteData.contact.email)}</a></li>
          <li><a ${linkAttrs(siteData.contact.telegramBotHref, trackAttrs("telegram_click", { location: "footer" }))}>${escapeHtml(siteData.contact.telegramBotLabel)}</a></li>
          <li>${escapeHtml(siteData.contact.hours)}</li>
        </ul>
      </section>
      ${siteData.navigation.footer
        .map(
          (column) => `
            <section class="footer-column">
              <h3>${escapeHtml(column.title)}</h3>
              <ul>
                ${column.links
                  .map((item) => `<li><a ${linkAttrs(item.href)}>${escapeHtml(item.label)}</a></li>`)
                  .join("")}
              </ul>
            </section>
          `,
        )
        .join("")}
    </div>
    <div class="shell site-footer__bottom">
      <p>${escapeHtml(siteData.company.requisitesNote)}</p>
    </div>
  </footer>
`;

const renderHead = ({
  pathname,
  title,
  description,
  ogImage,
  ogType = "website",
  noindex = false,
  schemaNodes = [],
}) => {
  const canonical = pageUrl(pathname);
  return `
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)} | ${escapeHtml(siteData.site.titleSuffix)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <meta property="og:locale" content="${escapeHtml(siteData.site.locale)}" />
    <meta property="og:site_name" content="${escapeHtml(siteData.site.name)}" />
    <meta property="og:type" content="${escapeHtml(ogType)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${escapeHtml(renderMetaImage(ogImage))}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(renderMetaImage(ogImage))}" />
    ${noindex ? '<meta name="robots" content="noindex,follow" />' : '<meta name="robots" content="index,follow" />'}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Rubik:wght@500;600;700;800&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="/styles/global.css" />
    ${renderSchema(schemaNodes)}
  `;
};

const renderLayout = ({
  pathname,
  title,
  description,
  ogImage,
  ogType,
  noindex = false,
  dataPage,
  dataSlug = "",
  mainClass = "",
  schemaNodes = [],
  content,
}) => `<!DOCTYPE html>
<html lang="${siteData.site.language}">
  <head>
    ${renderHead({ pathname, title, description, ogImage, ogType, noindex, schemaNodes })}
  </head>
  <body data-page="${escapeHtml(dataPage)}" data-page-slug="${escapeHtml(dataSlug)}">
    <a class="skip-link" href="#main-content">Перейти к содержимому</a>
    ${renderHeader(pathname)}
    <main id="main-content" class="${mainClass}">
      ${content}
    </main>
    ${renderFooter()}
    <script type="module" src="/scripts/app.js"></script>
  </body>
</html>
`;

const renderMarketplaceCard = (channel, location = "grid") => `
  <article class="channel-card">
    <div class="channel-card__head">
      <p class="eyebrow">${escapeHtml(channel.badge || "Канал")}</p>
      <h3>${escapeHtml(channel.name)}</h3>
    </div>
    <p>${escapeHtml(channel.summary)}</p>
    ${channel.bullets ? `<ul>${channel.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
    ${renderAction({
      href: channel.href,
      label: channel.cta,
      className: "button button--small",
      eventName: channel.name.includes("Telegram")
        ? "telegram_click"
        : channel.name === "Телефон"
          ? "phone_click"
          : channel.name === "Email"
            ? "email_click"
            : "marketplace_click",
      eventParams: { channel: channel.id || channel.name, location },
    })}
  </article>
`;

const renderStoryCards = (items) => `
  <div class="card-grid">
    ${items
      .map(
        (item) => `
          <article class="info-card">
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.text)}</p>
            ${item.href ? `<p>${renderAction({ href: item.href, label: item.cta || "Подробнее", className: "text-link", eventName: item.href === "/b2b/" ? "wholesale_cta_click" : null, eventParams: { location: "card" } })}</p>` : ""}
          </article>
        `,
      )
      .join("")}
  </div>
`;

const renderCategoryCard = (category) => {
  const href = category.status === "coming-soon" ? null : `/categories/${category.slug}/`;
  return `
    <article class="category-card" data-catalog-item data-search="${escapeHtml(
      `${category.name} ${category.shortDescription || ""} ${category.description || ""}`,
    )}">
      <p class="eyebrow">${escapeHtml(category.status === "coming-soon" ? "Скоро" : "Категория")}</p>
      <h3>${escapeHtml(category.name)}</h3>
      <p>${escapeHtml(category.shortDescription || category.description)}</p>
      ${
        href
          ? renderAction({ href, label: "Открыть категорию", className: "text-link" })
          : '<p class="card-note">Раздел подготовлен как задел для расширения ассортимента.</p>'
      }
    </article>
  `;
};

const renderProductCard = (product, location = "catalog") => `
  <article class="product-card" data-catalog-item data-search="${escapeHtml(
    `${product.name} ${product.description} ${product.origin} ${product.packaging} ${product.composition}`,
  )}">
    <a class="product-card__media" ${linkAttrs(`/catalog/${product.slug}/`)}>
      <img src="${escapeHtml(product.packshot.src)}" width="${product.packshot.width}" height="${product.packshot.height}" alt="${escapeHtml(product.packshot.alt)}" loading="lazy" decoding="async" />
    </a>
    <div class="product-card__body">
      <p class="eyebrow">Флагман</p>
      <h3><a ${linkAttrs(`/catalog/${product.slug}/`)}>${escapeHtml(product.shortName)}</a></h3>
      <p>${escapeHtml(product.excerpt)}</p>
      <ul class="meta-list">
        <li>${escapeHtml(product.origin)}</li>
        <li>${escapeHtml(product.weight)}</li>
        <li>${escapeHtml(product.packaging)}</li>
      </ul>
      <div class="button-row">
        ${renderAction({ href: `/catalog/${product.slug}/`, label: "Открыть товар", className: "button button--small" })}
        ${renderAction({
          href: "/where-to-buy/",
          label: "Где купить",
          className: "button button--small button--ghost",
          eventName: "marketplace_click",
          eventParams: { channel: "where_to_buy", location },
        })}
      </div>
    </div>
  </article>
`;

const renderHiddenFields = (defaults = {}) =>
  [
    ["form_type", defaults.formType || ""],
    ["intent", defaults.intent || ""],
    ["source", defaults.source || ""],
    ["page_type", defaults.pageType || ""],
    ["page_slug", defaults.pageSlug || ""],
    ["product_id", defaults.productId || ""],
    ["product_name", defaults.productName || ""],
    ["category_id", defaults.categoryId || ""],
    ["page_url", ""],
    ["referrer", ""],
    ["session_id", ""],
    ["submitted_at", ""],
    ["utm_source", ""],
    ["utm_medium", ""],
    ["utm_campaign", ""],
    ["utm_content", ""],
    ["utm_term", ""],
    ["first_utm_source", ""],
    ["first_utm_medium", ""],
    ["first_utm_campaign", ""],
    ["company_website", ""],
  ]
    .map(
      ([name, value]) =>
        `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}" />`,
    )
    .join("");

const renderContactForm = () => `
  <form class="request-form" data-lead-form action="/api/contact-request" method="post" novalidate>
    ${renderHiddenFields({ formType: "contact", intent: "support", pageType: "contacts", pageSlug: "contacts" })}
    <div class="form-grid">
      <label>
        <span>Как к вам обращаться</span>
        <input type="text" name="contact_name" autocomplete="name" required />
      </label>
      <label>
        <span>Телефон</span>
        <input type="tel" name="phone" autocomplete="tel" inputmode="tel" required />
      </label>
      <label>
        <span>Email</span>
        <input type="email" name="email" autocomplete="email" required />
      </label>
      <label>
        <span>Предпочтительный канал</span>
        <select name="preferred_contact">
          ${siteData.contacts.formConfig.preferredContacts
            .map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`)
            .join("")}
        </select>
      </label>
    </div>
    <label>
      <span>Тема обращения</span>
      <select name="topic" required>
        ${siteData.contacts.formConfig.topics
          .map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`)
          .join("")}
      </select>
    </label>
    <label>
      <span>Комментарий</span>
      <textarea name="comment" rows="5" placeholder="Опишите вопрос, поддержку, претензию или запрос документов."></textarea>
    </label>
    <label class="consent">
      <input type="checkbox" name="consent" required />
      <span>Согласен(а) на обработку контактных данных для ответа по моему запросу.</span>
    </label>
    <div class="button-row">
      <button class="button" type="submit">Отправить сообщение</button>
      ${renderAction({
        href: siteData.contact.telegramBotHref,
        label: "Написать в Telegram",
        className: "text-link",
        eventName: "telegram_click",
        eventParams: { location: "contact_form" },
      })}
    </div>
    <div class="form-status" aria-live="polite" data-form-status></div>
  </form>
`;

const renderB2BForm = (product = productById.macadamia) => `
  <form class="request-form request-form--b2b" data-lead-form action="/api/b2b-request" method="post" novalidate>
    ${renderHiddenFields({
      formType: "b2b",
      intent: "wholesale",
      pageType: "b2b",
      pageSlug: "b2b",
      productId: product.id,
      productName: product.name,
      categoryId: product.categoryId,
      source: "wholesale",
    })}
    <div class="form-grid form-grid--three">
      <label>
        <span>Компания</span>
        <input type="text" name="company_name" autocomplete="organization" required />
      </label>
      <label>
        <span>Контактное лицо</span>
        <input type="text" name="contact_name" autocomplete="name" required />
      </label>
      <label>
        <span>Телефон</span>
        <input type="tel" name="phone" autocomplete="tel" inputmode="tel" required />
      </label>
      <label>
        <span>Email</span>
        <input type="email" name="email" autocomplete="email" required />
      </label>
      <label>
        <span>Город</span>
        <input type="text" name="city" autocomplete="address-level2" required />
      </label>
      <label>
        <span>Тип бизнеса</span>
        <select name="business_type" required>
          <option value="">Выберите тип бизнеса</option>
          ${siteData.b2b.formConfig.businessTypes
            .map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`)
            .join("")}
        </select>
      </label>
      <label>
        <span>Интерес к продукту</span>
        <select name="product_interest" required>
          ${siteData.b2b.formConfig.productOptions
            .map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`)
            .join("")}
        </select>
      </label>
      <label>
        <span>Оценка объёма</span>
        <input type="text" name="estimated_volume" placeholder="Например: тестовая партия, регулярные поставки, корпоративный набор" />
      </label>
      <label>
        <span>Частота</span>
        <select name="frequency">
          ${siteData.b2b.formConfig.frequencies
            .map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`)
            .join("")}
        </select>
      </label>
    </div>
    <label>
      <span>Комментарий</span>
      <textarea name="comment" rows="5" placeholder="Опишите сценарий: магазин, HoReCa, офис, подарки, дистрибуция, документы или упаковочные требования."></textarea>
    </label>
    <label>
      <span>Предпочтительный канал связи</span>
      <select name="preferred_contact">
        ${siteData.b2b.formConfig.preferredContacts
          .map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`)
          .join("")}
      </select>
    </label>
    <label class="consent">
      <input type="checkbox" name="consent" required />
      <span>Согласен(а) на обработку персональных данных и деловой информации для ответа по B2B-запросу.</span>
    </label>
    <div class="button-row">
      <button class="button" type="submit">${escapeHtml(siteData.b2b.formConfig.submitLabel)}</button>
      ${renderAction({
        href: siteData.contact.telegramWholesaleHref,
        label: "Быстрый вопрос в Telegram",
        className: "text-link",
        eventName: "telegram_click",
        eventParams: { location: "b2b_form" },
      })}
    </div>
    <p class="form-note">Если live-интеграция с Bitrix ещё не подключена, форма всё равно работает в безопасном mock-режиме и даёт корректный success-state.</p>
    <div class="form-status" aria-live="polite" data-form-status></div>
  </form>
`;

const homePage = () => {
  const product = productById.macadamia;
  const journalCards = siteData.journal.posts
    .map(
      (post) => `
        <article class="journal-card">
          <a class="journal-card__media" ${linkAttrs(`/journal/${post.slug}/`, trackAttrs("journal_article_open", { slug: post.slug, location: "home_card" }))}>
            <img src="${escapeHtml(post.image.src)}" width="${post.image.width}" height="${post.image.height}" alt="${escapeHtml(post.image.alt)}" loading="lazy" decoding="async" />
          </a>
          <div class="journal-card__body">
            <p class="eyebrow">Журнал</p>
            <h3><a ${linkAttrs(`/journal/${post.slug}/`, trackAttrs("journal_article_open", { slug: post.slug, location: "home_title" }))}>${escapeHtml(post.title)}</a></h3>
            <p>${escapeHtml(post.description)}</p>
          </div>
        </article>
      `,
    )
    .join("");

  const schemaNodes = [organizationSchema(), websiteSchema()];

  return renderLayout({
    pathname: "/",
    title: siteData.home.metaTitle,
    description: siteData.home.metaDescription,
    ogImage: "/assets/about/hero-macadamia.jpg",
    dataPage: "home",
    schemaNodes,
    content: `
      <section class="hero hero--home">
        <div class="shell hero__grid hero__grid--home">
          <div class="hero__copy">
            <p class="eyebrow">${escapeHtml(siteData.home.hero.eyebrow)}</p>
            <h1>${escapeHtml(siteData.home.hero.title)}</h1>
            <p class="hero__lead">${escapeHtml(siteData.home.hero.text)}</p>
            <div class="button-row">
              ${renderAction({
                href: siteData.home.hero.primaryCta.href,
                label: siteData.home.hero.primaryCta.label,
                className: "button",
                eventName: "marketplace_click",
                eventParams: { channel: "where_to_buy", location: "home_hero" },
              })}
              ${renderAction({
                href: siteData.home.hero.secondaryCta.href,
                label: siteData.home.hero.secondaryCta.label,
                className: "button button--ghost",
                eventName: "wholesale_cta_click",
                eventParams: { location: "home_hero" },
              })}
              ${renderAction({
                href: siteData.home.hero.tertiaryCta.href,
                label: siteData.home.hero.tertiaryCta.label,
                className: "text-link",
                eventName: "telegram_click",
                eventParams: { location: "home_hero" },
              })}
            </div>
            <ul class="hero-pills">
              ${siteData.home.hero.highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
          </div>
          <div class="hero__visual hero__visual--home">
            <img src="/assets/about/hero-macadamia.jpg" width="1400" height="787" alt="Официальный брендовый слой Global Basket" fetchpriority="high" />
          </div>
        </div>
      </section>
      <section class="trust-strip">
        <div class="shell trust-strip__grid">
          ${siteData.home.trustStrip.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}
        </div>
      </section>
      <section class="section">
        <div class="shell feature-grid">
          <div class="feature-copy">
            <p class="eyebrow">${escapeHtml(siteData.home.flagship.title)}</p>
            <h2>${escapeHtml(siteData.home.flagship.heading)}</h2>
            <p>${escapeHtml(siteData.home.flagship.text)}</p>
            <div class="stats-grid">
              ${siteData.home.flagship.stats
                .map(
                  (item) => `
                    <article class="stat-card">
                      <strong>${escapeHtml(item.value)}</strong>
                      <span>${escapeHtml(item.label)}</span>
                    </article>
                  `,
                )
                .join("")}
            </div>
            <div class="button-row">
              ${renderAction({ href: siteData.home.flagship.primaryCta.href, label: siteData.home.flagship.primaryCta.label, className: "button button--small" })}
              ${renderAction({
                href: siteData.home.flagship.secondaryCta.href,
                label: siteData.home.flagship.secondaryCta.label,
                className: "button button--small button--ghost",
                eventName: "marketplace_click",
                eventParams: { channel: "where_to_buy", location: "home_flagship" },
              })}
            </div>
          </div>
          <article class="feature-media">
            <img src="${escapeHtml(product.heroImage.src)}" width="${product.heroImage.width}" height="${product.heroImage.height}" alt="${escapeHtml(product.heroImage.alt)}" />
          </article>
        </div>
      </section>
      <section class="section section--muted">
        <div class="shell">
          <div class="section-heading">
            <p class="eyebrow">Сценарии</p>
            <h2>Сайт разводит четыре ключевых задачи, чтобы retail, B2B и поддержка не мешали друг другу.</h2>
          </div>
          ${renderStoryCards(siteData.home.scenarios)}
        </div>
      </section>
      <section class="section">
        <div class="shell">
          <div class="section-heading">
            <p class="eyebrow">Где купить</p>
            <h2>Официальные retail-каналы бренда</h2>
            <p>Сайт Global Basket помогает понять продукт, а покупка в розницу происходит там, где вам удобно завершить заказ.</p>
          </div>
          <div class="channel-grid">
            ${siteData.channels.marketplaces.map((item) => renderMarketplaceCard(item, "home_channels")).join("")}
          </div>
        </div>
      </section>
      <section class="section">
        <div class="shell">
          <div class="section-heading">
            <p class="eyebrow">Почему доверять</p>
            <h2>Сайт бренда даёт больше смысла и доверия, чем одна карточка на маркетплейсе.</h2>
          </div>
          ${renderStoryCards(siteData.home.whyBrand)}
        </div>
      </section>
      <section class="section section--muted">
        <div class="shell split-teasers">
          <article class="teaser-panel">
            <p class="eyebrow">О бренде</p>
            <h2>${escapeHtml(siteData.home.aboutTeaser.title)}</h2>
            <p>${escapeHtml(siteData.home.aboutTeaser.text)}</p>
            ${renderAction({ href: siteData.home.aboutTeaser.href, label: "Открыть страницу бренда", className: "text-link" })}
          </article>
          <article class="teaser-panel">
            <p class="eyebrow">Журнал</p>
            <h2>${escapeHtml(siteData.home.journalTeaser.title)}</h2>
            <p>${escapeHtml(siteData.home.journalTeaser.text)}</p>
            ${renderAction({ href: siteData.home.journalTeaser.href, label: "Открыть журнал", className: "text-link" })}
          </article>
        </div>
      </section>
      <section class="section">
        <div class="shell">
          <div class="section-heading">
            <p class="eyebrow">Материалы</p>
            <h2>SEO и доверительный слой бренда</h2>
          </div>
          <div class="journal-grid">${journalCards}</div>
        </div>
      </section>
      <section class="section section--cta">
        <div class="shell final-cta">
          <div>
            <p class="eyebrow">Следующий шаг</p>
            <h2>${escapeHtml(siteData.home.finalCta.title)}</h2>
            <p>${escapeHtml(siteData.home.finalCta.text)}</p>
          </div>
          <div class="button-stack">
            ${renderAction({
              href: siteData.home.finalCta.primary.href,
              label: siteData.home.finalCta.primary.label,
              className: "button",
              eventName: "marketplace_click",
              eventParams: { channel: "where_to_buy", location: "home_final" },
            })}
            ${renderAction({
              href: siteData.home.finalCta.secondary.href,
              label: siteData.home.finalCta.secondary.label,
              className: "button button--ghost",
              eventName: "wholesale_cta_click",
              eventParams: { location: "home_final" },
            })}
            ${renderAction({
              href: siteData.home.finalCta.tertiary.href,
              label: siteData.home.finalCta.tertiary.label,
              className: "text-link",
              eventName: "telegram_click",
              eventParams: { location: "home_final" },
            })}
          </div>
        </div>
      </section>
    `,
  });
};

const catalogPage = () => {
  const breadcrumb = renderBreadcrumbs([
    { label: "Главная", href: "/" },
    { label: "Каталог", href: "/catalog/" },
  ]);
  const product = productById.macadamia;
  const faq = renderFaq(siteData.catalog.faq, "FAQ по каталогу");
  const items = [product, ...siteData.categories.filter((item) => item.status !== "coming-soon").map((item) => ({ ...item, href: `/categories/${item.slug}/` }))];

  return renderLayout({
    pathname: "/catalog/",
    title: siteData.catalog.metaTitle,
    description: siteData.catalog.metaDescription,
    ogImage: product.heroImage.src,
    dataPage: "catalog",
    schemaNodes: [organizationSchema(), breadcrumb.schema, collectionSchema("Каталог Global Basket", items, "/catalog/"), itemListSchema(items)],
    content: `
      <section class="hero hero--inner">
        <div class="shell">
          ${breadcrumb.html}
          <div class="section-heading">
            <p class="eyebrow">Каталог</p>
            <h1>Каталог премиальных орехов Global Basket</h1>
            <p>${escapeHtml(siteData.catalog.intro)}</p>
          </div>
          <div class="search-shell">
            <form class="catalog-search" role="search" data-catalog-search>
              <label class="sr-only" for="catalog-search">Поиск по каталогу</label>
              <input id="catalog-search" type="search" name="q" placeholder="Поиск по каталогу" />
              <button class="button button--small" type="submit">Найти</button>
            </form>
            <p class="catalog-search__meta" data-catalog-count>Показано: 0</p>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="shell">
          <div class="story-grid">
            ${siteData.catalog.sections
              .map(
                (item) => `
                  <article class="info-card">
                    <h2>${escapeHtml(item.title)}</h2>
                    <p>${escapeHtml(item.text)}</p>
                  </article>
                `,
              )
              .join("")}
          </div>
        </div>
      </section>
      <section class="section section--muted">
        <div class="shell">
          <div class="section-heading">
            <p class="eyebrow">Ассортимент</p>
            <h2>Текущий продукт и следующие направления бренда</h2>
          </div>
          <div class="catalog-grid" data-catalog-grid>
            ${renderProductCard(product, "catalog_grid")}
            ${siteData.categories.map((item) => renderCategoryCard(item)).join("")}
          </div>
        </div>
      </section>
      <section class="section">
        <div class="shell">
          <div class="section-heading">
            <p class="eyebrow">Следующие шаги</p>
            <h2>Куда идти из каталога дальше</h2>
          </div>
          ${renderStoryCards(siteData.catalog.supportCards)}
        </div>
      </section>
      ${faq.html}
    `,
  });
};

const categoryPage = (category) => {
  const product = productById[category.featuredProductId];
  const breadcrumb = renderBreadcrumbs([
    { label: "Главная", href: "/" },
    { label: "Каталог", href: "/catalog/" },
    { label: category.name, href: `/categories/${category.slug}/` },
  ]);
  const faq = renderFaq(category.faq, `FAQ по категории «${category.name}»`);
  const listItems = [{ name: product.name, href: `/catalog/${product.slug}/` }];

  return renderLayout({
    pathname: `/categories/${category.slug}/`,
    title: `${category.name} — каталог и где купить`,
    description: category.description,
    ogImage: product.heroImage.src,
    dataPage: "category",
    dataSlug: category.slug,
    schemaNodes: [organizationSchema(), breadcrumb.schema, collectionSchema(category.name, listItems, `/categories/${category.slug}/`), itemListSchema(listItems), faq.schema].filter(Boolean),
    content: `
      <section class="hero hero--inner">
        <div class="shell">
          ${breadcrumb.html}
          <div class="section-heading">
            <p class="eyebrow">Категория</p>
            <h1>${escapeHtml(category.name)}</h1>
            <p>${escapeHtml(category.intro)}</p>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="shell split-content">
          <div>
            <h2>Кому подходит категория</h2>
            <ul class="bullet-list">
              ${category.audience.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
          </div>
          <div>
            <h2>Почему это важно для бренда</h2>
            <ul class="bullet-list">
              ${category.benefits.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
          </div>
        </div>
      </section>
      <section class="section section--muted">
        <div class="shell feature-grid">
          <div class="feature-copy">
            <p class="eyebrow">Флагман категории</p>
            <h2>${escapeHtml(product.shortName)}</h2>
            <p>${escapeHtml(product.excerpt)}</p>
            <div class="button-row">
              ${renderAction({ href: `/catalog/${product.slug}/`, label: "Открыть товар", className: "button button--small" })}
              ${renderAction({
                href: "/b2b/",
                label: "Для корпоративных объёмов",
                className: "button button--small button--ghost",
                eventName: "wholesale_cta_click",
                eventParams: { location: "category_feature" },
              })}
            </div>
          </div>
          <article class="feature-media">
            <img src="${escapeHtml(product.packshot.src)}" width="${product.packshot.width}" height="${product.packshot.height}" alt="${escapeHtml(product.packshot.alt)}" loading="lazy" decoding="async" />
          </article>
        </div>
      </section>
      ${faq.html}
    `,
  });
};

const productPage = (product) => {
  const category = categoryById[product.categoryId];
  const breadcrumb = renderBreadcrumbs([
    { label: "Главная", href: "/" },
    { label: "Каталог", href: "/catalog/" },
    { label: category.name, href: `/categories/${category.slug}/` },
    { label: product.shortName, href: `/catalog/${product.slug}/` },
  ]);
  const relatedPosts = product.relatedArticleSlugs.map((slug) => postBySlug[slug]);
  const faq = renderFaq(product.faq, "FAQ по продукту");

  return renderLayout({
    pathname: `/catalog/${product.slug}/`,
    title: `${product.name} — официальный продуктовый слой бренда`,
    description: product.excerpt,
    ogImage: product.heroImage.src,
    dataPage: "product",
    dataSlug: product.slug,
    schemaNodes: [organizationSchema(), breadcrumb.schema, productSchema(product), faq.schema].filter(Boolean),
    content: `
      <section class="hero hero--product">
        <div class="shell">
          ${breadcrumb.html}
          <aside class="intent-banner" hidden data-intent-banner></aside>
          <div class="product-hero">
            <div class="product-hero__media">
              <img src="${escapeHtml(product.heroImage.src)}" width="${product.heroImage.width}" height="${product.heroImage.height}" alt="${escapeHtml(product.heroImage.alt)}" fetchpriority="high" />
            </div>
            <div class="product-hero__copy">
              <p class="eyebrow">Флагман бренда</p>
              <h1>${escapeHtml(product.name)}</h1>
              <p class="hero__lead">${escapeHtml(product.lead)}</p>
              <ul class="hero-pills">
                ${product.badges.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
              </ul>
              <div class="button-row">
                ${renderAction({
                  href: "/where-to-buy/",
                  label: "Купить у официальных партнёров",
                  className: "button",
                  eventName: "marketplace_click",
                  eventParams: { channel: "where_to_buy", location: "product_hero" },
                })}
                ${renderAction({
                  href: "/b2b/?source=wholesale",
                  label: "Для корпоративных объёмов",
                  className: "button button--ghost",
                  eventName: "wholesale_cta_click",
                  eventParams: { location: "product_hero" },
                })}
                ${renderAction({
                  href: siteData.contact.telegramPdpHref,
                  label: "Вопрос в Telegram",
                  className: "text-link",
                  eventName: "telegram_click",
                  eventParams: { location: "product_hero" },
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="shell split-content">
          <div>
            <h2>Что важно знать о продукте</h2>
            <dl class="spec-list">
              ${product.facts
                .map(
                  (item) => `
                    <div>
                      <dt>${escapeHtml(item.label)}</dt>
                      <dd>${escapeHtml(item.value)}</dd>
                    </div>
                  `,
                )
                .join("")}
            </dl>
          </div>
          <div>
            <h2>Сценарии использования</h2>
            <ul class="bullet-list">
              ${product.useCases.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
          </div>
        </div>
      </section>
      <section class="section section--muted">
        <div class="shell feature-grid">
          <article class="feature-media">
            <img src="${escapeHtml(product.lifestyleImage.src)}" width="${product.lifestyleImage.width}" height="${product.lifestyleImage.height}" alt="${escapeHtml(product.lifestyleImage.alt)}" loading="lazy" decoding="async" />
          </article>
          <div class="feature-copy">
            <p class="eyebrow">Почему это больше, чем карточка на маркетплейсе</p>
            <h2>Официальный сайт помогает понять товар до покупки</h2>
            <ul class="bullet-list">
              ${product.reasons.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
            <p class="callout">${escapeHtml(product.storage)}</p>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="shell">
          <div class="section-heading">
            <p class="eyebrow">Где купить</p>
            <h2>Официальные каналы покупки и поддержки</h2>
          </div>
          <div class="channel-grid">
            ${siteData.channels.marketplaces.map((item) => renderMarketplaceCard(item, "product_channels")).join("")}
          </div>
        </div>
      </section>
      <section class="section section--muted">
        <div class="shell split-teasers">
          <article class="teaser-panel">
            <p class="eyebrow">B2B</p>
            <h2>Нужен объём для бизнеса?</h2>
            <p>Для магазина, офиса, HoReCa, подарков или дистрибуции используйте отдельную B2B-страницу — это другой сценарий, и он не прячется внутри общих контактов.</p>
            ${renderAction({
              href: "/b2b/?source=wholesale",
              label: "Оставить B2B-заявку",
              className: "button button--small",
              eventName: "wholesale_cta_click",
              eventParams: { location: "product_b2b_block" },
            })}
          </article>
          <article class="teaser-panel">
            <p class="eyebrow">Поддержка</p>
            <h2>Вопрос, жалоба или сопровождение?</h2>
            <p>Telegram, телефон и email остаются рядом с продуктом, чтобы покупателю не приходилось искать поддержку после покупки по сайту вслепую.</p>
            <div class="button-row">
              ${renderAction({
                href: "/contacts/?source=pdp",
                label: "Открыть контакты",
                className: "button button--small button--ghost",
              })}
              ${renderAction({
                href: siteData.contact.telegramComplaintHref,
                label: "Оставить претензию",
                className: "text-link",
                eventName: "complaint_click",
                eventParams: { location: "product_support" },
              })}
            </div>
          </article>
        </div>
      </section>
      ${faq.html}
      <section class="section">
        <div class="shell">
          <div class="section-heading">
            <p class="eyebrow">Связанные материалы</p>
            <h2>Ещё немного контекста о бренде и продукте</h2>
          </div>
          <div class="journal-grid">
            ${relatedPosts
              .map(
                (post) => `
                  <article class="journal-card">
                    <a class="journal-card__media" ${linkAttrs(`/journal/${post.slug}/`, trackAttrs("journal_article_open", { slug: post.slug, location: "product_related" }))}>
                      <img src="${escapeHtml(post.image.src)}" width="${post.image.width}" height="${post.image.height}" alt="${escapeHtml(post.image.alt)}" loading="lazy" decoding="async" />
                    </a>
                    <div class="journal-card__body">
                      <h3><a ${linkAttrs(`/journal/${post.slug}/`, trackAttrs("journal_article_open", { slug: post.slug, location: "product_related_title" }))}>${escapeHtml(post.title)}</a></h3>
                      <p>${escapeHtml(post.description)}</p>
                    </div>
                  </article>
                `,
              )
              .join("")}
          </div>
        </div>
      </section>
    `,
  });
};

const aboutPage = () => {
  const breadcrumb = renderBreadcrumbs([
    { label: "Главная", href: "/" },
    { label: "О бренде", href: "/about/" },
  ]);
  const faq = renderFaq(siteData.about.faq, "FAQ о бренде");

  return renderLayout({
    pathname: "/about/",
    title: siteData.about.metaTitle,
    description: siteData.about.metaDescription,
    ogImage: "/assets/about/hero-macadamia.jpg",
    dataPage: "about",
    schemaNodes: [organizationSchema(), breadcrumb.schema, faq.schema].filter(Boolean),
    content: `
      <section class="hero hero--inner">
        <div class="shell feature-grid feature-grid--hero">
          <div class="feature-copy">
            ${breadcrumb.html}
            <p class="eyebrow">О бренде</p>
            <h1>${escapeHtml(siteData.about.heroTitle)}</h1>
            <p class="hero__lead">${escapeHtml(siteData.about.heroText)}</p>
            <div class="button-row">
              ${renderAction({
                href: "/where-to-buy/",
                label: "Где купить",
                className: "button",
                eventName: "marketplace_click",
                eventParams: { channel: "where_to_buy", location: "about_hero" },
              })}
              ${renderAction({
                href: "/b2b/",
                label: "Опт / B2B",
                className: "button button--ghost",
                eventName: "wholesale_cta_click",
                eventParams: { location: "about_hero" },
              })}
            </div>
          </div>
          <article class="feature-media feature-media--landscape">
            <img src="/assets/about/hero-macadamia.jpg" width="1400" height="787" alt="Брендовый визуал Global Basket" fetchpriority="high" />
          </article>
        </div>
      </section>
      <section class="section">
        <div class="shell story-grid">
          ${siteData.about.sections
            .map(
              (section) => `
                <article class="info-card info-card--wide">
                  <h2>${escapeHtml(section.title)}</h2>
                  ${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
      <section class="section section--muted">
        <div class="shell split-content">
          <div>
            <p class="eyebrow">Стандарты</p>
            <h2>На чём строится официальный слой бренда</h2>
            <ul class="bullet-list">
              ${siteData.about.standards.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
          </div>
          <div>
            <p class="eyebrow">Trust</p>
            <h2>Документы и legal-слой уже предусмотрены</h2>
            <p>${escapeHtml(siteData.company.requisitesNote)}</p>
            ${renderAction({ href: "/documents/", label: "Открыть документы и trust-материалы", className: "text-link" })}
          </div>
        </div>
      </section>
      ${faq.html}
    `,
  });
};

const whereToBuyPage = () => {
  const breadcrumb = renderBreadcrumbs([
    { label: "Главная", href: "/" },
    { label: "Где купить", href: "/where-to-buy/" },
  ]);
  const faq = renderFaq(siteData.whereToBuy.faq, "FAQ по официальным каналам покупки");

  return renderLayout({
    pathname: "/where-to-buy/",
    title: siteData.whereToBuy.metaTitle,
    description: siteData.whereToBuy.metaDescription,
    ogImage: "/assets/brand-poster.jpg",
    dataPage: "where-to-buy",
    schemaNodes: [
      organizationSchema(),
      breadcrumb.schema,
      collectionSchema("Официальные каналы покупки Global Basket", siteData.channels.marketplaces.map((item) => ({ ...item, href: item.href })), "/where-to-buy/"),
      itemListSchema(siteData.channels.marketplaces.map((item) => ({ ...item, href: item.href }))),
      faq.schema,
    ].filter(Boolean),
    content: `
      <section class="hero hero--inner">
        <div class="shell">
          ${breadcrumb.html}
          <div class="section-heading">
            <p class="eyebrow">Где купить</p>
            <h1>Официальные каналы покупки Global Basket</h1>
            <p>${escapeHtml(siteData.whereToBuy.hero)}</p>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="shell">
          <div class="section-heading">
            <p class="eyebrow">Retail</p>
            <h2>Выберите удобный канал покупки</h2>
          </div>
          <div class="channel-grid">
            ${siteData.channels.marketplaces.map((item) => renderMarketplaceCard(item, "where_to_buy")).join("")}
          </div>
        </div>
      </section>
      <section class="section section--muted">
        <div class="shell">
          <div class="section-heading">
            <p class="eyebrow">Как выбрать канал</p>
            <h2>Когда идти на маркетплейс, а когда — в поддержку или B2B</h2>
          </div>
          ${renderStoryCards(siteData.whereToBuy.chooser)}
        </div>
      </section>
      <section class="section">
        <div class="shell">
          <div class="section-heading">
            <p class="eyebrow">Сервисные каналы</p>
            <h2>Если нужен вопрос, поддержка или прямой контакт</h2>
          </div>
          <div class="channel-grid">
            ${siteData.channels.direct.map((item) => renderMarketplaceCard(item, "where_to_buy_direct")).join("")}
          </div>
        </div>
      </section>
      ${faq.html}
    `,
  });
};

const b2bPage = () => {
  const breadcrumb = renderBreadcrumbs([
    { label: "Главная", href: "/" },
    { label: "Опт / B2B", href: "/b2b/" },
  ]);
  const faq = renderFaq(siteData.b2b.faq, "FAQ для корпоративных клиентов");

  return renderLayout({
    pathname: "/b2b/",
    title: siteData.b2b.metaTitle,
    description: siteData.b2b.metaDescription,
    ogImage: "/assets/about/selection-hands.jpg",
    dataPage: "b2b",
    schemaNodes: [organizationSchema(), breadcrumb.schema, faq.schema].filter(Boolean),
    content: `
      <section class="hero hero--inner">
        <div class="shell feature-grid feature-grid--hero">
          <div class="feature-copy">
            ${breadcrumb.html}
            <aside class="intent-banner" hidden data-intent-banner></aside>
            <p class="eyebrow">Опт / B2B</p>
            <h1>${escapeHtml(siteData.b2b.heroTitle)}</h1>
            <p class="hero__lead">${escapeHtml(siteData.b2b.heroText)}</p>
            <div class="button-row">
              ${renderAction({
                href: "#b2b-form",
                label: "Оставить B2B-заявку",
                className: "button",
                eventName: "wholesale_cta_click",
                eventParams: { location: "b2b_hero" },
              })}
              ${renderAction({
                href: siteData.contact.telegramWholesaleHref,
                label: "Быстрый вопрос в Telegram",
                className: "button button--ghost",
                eventName: "telegram_click",
                eventParams: { location: "b2b_hero" },
              })}
            </div>
          </div>
          <article class="feature-media feature-media--landscape">
            <img src="/assets/about/selection-hands.jpg" width="1200" height="800" alt="B2B-сценарий Global Basket" fetchpriority="high" />
          </article>
        </div>
      </section>
      <section class="section">
        <div class="shell">
          <div class="section-heading">
            <p class="eyebrow">Кому подходит</p>
            <h2>Типы клиентов, для которых собран B2B-маршрут</h2>
          </div>
          ${renderStoryCards(siteData.b2b.segments)}
        </div>
      </section>
      <section class="section section--muted">
        <div class="shell">
          <div class="section-heading">
            <p class="eyebrow">Преимущества</p>
            <h2>Почему B2B вынесен в отдельную страницу</h2>
          </div>
          ${renderStoryCards(siteData.b2b.benefits)}
        </div>
      </section>
      <section class="section">
        <div class="shell">
          <div class="section-heading">
            <p class="eyebrow">Как это работает</p>
            <h2>Путь от заявки до следующего шага</h2>
          </div>
          <div class="process-grid">
            ${siteData.b2b.process
              .map(
                (item) => `
                  <article class="process-card">
                    <strong>${escapeHtml(item.step)}</strong>
                    <p>${escapeHtml(item.text)}</p>
                  </article>
                `,
              )
              .join("")}
          </div>
        </div>
      </section>
      <section class="section section--muted" id="b2b-form">
        <div class="shell feature-grid">
          <div class="feature-copy">
            <p class="eyebrow">B2B-форма</p>
            <h2>Оставьте корпоративную заявку</h2>
            <p>Форма собирает только важные для старта данные: компания, контакт, город, тип бизнеса, интерес к продукту и сценарий работы. Дальше менеджер уже уточняет детали в нормальном диалоге.</p>
          </div>
          <div>
            ${renderB2BForm()}
          </div>
        </div>
      </section>
      ${faq.html}
    `,
  });
};

const deliveryPage = () => {
  const breadcrumb = renderBreadcrumbs([
    { label: "Главная", href: "/" },
    { label: "Доставка и оплата", href: "/delivery/" },
  ]);
  const faq = renderFaq(siteData.delivery.faq, "FAQ по доставке и оплате");

  return renderLayout({
    pathname: "/delivery/",
    title: siteData.delivery.metaTitle,
    description: siteData.delivery.metaDescription,
    ogImage: "/assets/about/jar-storage.jpg",
    dataPage: "delivery",
    schemaNodes: [organizationSchema(), breadcrumb.schema, faq.schema].filter(Boolean),
    content: `
      <section class="hero hero--inner">
        <div class="shell">
          ${breadcrumb.html}
          <div class="section-heading">
            <p class="eyebrow">Доставка и оплата</p>
            <h1>Как Global Basket разводит retail, B2B и поддержку</h1>
            <p>${escapeHtml(siteData.delivery.hero)}</p>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="shell story-grid">
          <article class="info-card info-card--wide">
            <h2>Для розницы</h2>
            ${siteData.delivery.retail.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}
          </article>
          <article class="info-card info-card--wide">
            <h2>Для B2B</h2>
            ${siteData.delivery.b2b.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}
          </article>
          <article class="info-card info-card--wide">
            <h2>Поддержка, возвраты и претензии</h2>
            ${siteData.delivery.complaints.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}
          </article>
        </div>
      </section>
      ${faq.html}
    `,
  });
};

const contactsPage = () => {
  const breadcrumb = renderBreadcrumbs([
    { label: "Главная", href: "/" },
    { label: "Контакты", href: "/contacts/" },
  ]);
  const faq = renderFaq(siteData.contacts.faq, "FAQ по контактам");

  return renderLayout({
    pathname: "/contacts/",
    title: siteData.contacts.metaTitle,
    description: siteData.contacts.metaDescription,
    ogImage: "/assets/about/warm-kitchen.jpg",
    dataPage: "contacts",
    schemaNodes: [
      organizationSchema(),
      breadcrumb.schema,
      {
        "@context": "https://schema.org",
        "@type": "ContactPage",
        name: "Контакты Global Basket",
        url: pageUrl("/contacts/"),
      },
      faq.schema,
    ].filter(Boolean),
    content: `
      <section class="hero hero--inner">
        <div class="shell">
          ${breadcrumb.html}
          <aside class="intent-banner" hidden data-intent-banner></aside>
          <div class="section-heading">
            <p class="eyebrow">Контакты</p>
            <h1>Контакты Global Basket</h1>
            <p>${escapeHtml(siteData.contacts.hero)}</p>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="shell">
          ${renderStoryCards(siteData.contacts.routes)}
        </div>
      </section>
      <section class="section section--muted">
        <div class="shell feature-grid">
          <div class="feature-copy">
            <p class="eyebrow">Прямые каналы</p>
            <h2>Телефон, email и Telegram видны сразу</h2>
            <div class="contact-grid">
              ${siteData.contacts.directCards
                .map(
                  (item) => `
                    <article class="contact-card">
                      <strong>${escapeHtml(item.label)}</strong>
                      ${
                        item.href
                          ? `<a ${linkAttrs(
                              item.href,
                              item.label === "Телефон"
                                ? trackAttrs("phone_click", { location: "contacts_cards" })
                                : item.label === "Email"
                                  ? trackAttrs("email_click", { location: "contacts_cards" })
                                  : trackAttrs("telegram_click", { location: "contacts_cards" }),
                            )}>${escapeHtml(item.value)}</a>`
                          : `<span>${escapeHtml(item.value)}</span>`
                      }
                    </article>
                  `,
                )
                .join("")}
            </div>
          </div>
          <div>
            <p class="eyebrow">Короткая форма</p>
            <h2>Напишите по товару, поддержке или документам</h2>
            ${renderContactForm()}
          </div>
        </div>
      </section>
      ${faq.html}
    `,
  });
};

const journalIndexPage = () => {
  const breadcrumb = renderBreadcrumbs([
    { label: "Главная", href: "/" },
    { label: "Журнал", href: "/journal/" },
  ]);

  return renderLayout({
    pathname: "/journal/",
    title: siteData.journal.metaTitle,
    description: siteData.journal.metaDescription,
    ogImage: "/assets/about/hero-macadamia.jpg",
    dataPage: "journal",
    schemaNodes: [
      organizationSchema(),
      breadcrumb.schema,
      {
        "@context": "https://schema.org",
        "@type": "Blog",
        name: "Журнал Global Basket",
        url: pageUrl("/journal/"),
      },
    ],
    content: `
      <section class="hero hero--inner">
        <div class="shell">
          ${breadcrumb.html}
          <div class="section-heading">
            <p class="eyebrow">Журнал</p>
            <h1>Журнал Global Basket</h1>
            <p>${escapeHtml(siteData.journal.intro)}</p>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="shell">
          <div class="journal-grid">
            ${siteData.journal.posts
              .map(
                (post) => `
                  <article class="journal-card journal-card--large">
                    <a class="journal-card__media" ${linkAttrs(`/journal/${post.slug}/`, trackAttrs("journal_article_open", { slug: post.slug, location: "journal_index" }))}>
                      <img src="${escapeHtml(post.image.src)}" width="${post.image.width}" height="${post.image.height}" alt="${escapeHtml(post.image.alt)}" loading="lazy" decoding="async" />
                    </a>
                    <div class="journal-card__body">
                      <p class="eyebrow">${escapeHtml(post.readingTime)}</p>
                      <h2><a ${linkAttrs(`/journal/${post.slug}/`, trackAttrs("journal_article_open", { slug: post.slug, location: "journal_index_title" }))}>${escapeHtml(post.title)}</a></h2>
                      <p>${escapeHtml(post.description)}</p>
                    </div>
                  </article>
                `,
              )
              .join("")}
          </div>
        </div>
      </section>
    `,
  });
};

const articlePage = (post) => {
  const relatedProduct = productById[post.relatedProductId];
  const relatedPosts = post.relatedPostSlugs.map((slug) => postBySlug[slug]);
  const breadcrumb = renderBreadcrumbs([
    { label: "Главная", href: "/" },
    { label: "Журнал", href: "/journal/" },
    { label: post.title, href: `/journal/${post.slug}/` },
  ]);
  const faq = renderFaq(post.faq, `FAQ к материалу «${post.title}»`);

  return renderLayout({
    pathname: `/journal/${post.slug}/`,
    title: post.title,
    description: post.description,
    ogImage: post.image.src,
    ogType: "article",
    dataPage: "article",
    dataSlug: post.slug,
    schemaNodes: [organizationSchema(), breadcrumb.schema, articleSchema(post, `/journal/${post.slug}/`), faq.schema].filter(Boolean),
    content: `
      <article class="article-shell">
        <section class="hero hero--article">
          <div class="shell">
            ${breadcrumb.html}
            <div class="article-hero">
              <div class="article-hero__copy">
                <p class="eyebrow">${escapeHtml(post.readingTime)}</p>
                <h1>${escapeHtml(post.title)}</h1>
                <p class="hero__lead">${escapeHtml(post.lead)}</p>
                <p class="article-meta">Дата публикации: <time datetime="${escapeHtml(post.date)}">${escapeHtml(post.date)}</time></p>
              </div>
              <div class="article-hero__media">
                <img src="${escapeHtml(post.image.src)}" width="${post.image.width}" height="${post.image.height}" alt="${escapeHtml(post.image.alt)}" fetchpriority="high" />
              </div>
            </div>
          </div>
        </section>
        <section class="section">
          <div class="shell article-layout">
            <div class="article-prose">
              ${post.sections
                .map(
                  (section) => `
                    <section class="article-section">
                      <h2>${escapeHtml(section.title)}</h2>
                      ${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
                    </section>
                  `,
                )
                .join("")}
            </div>
            <aside class="article-sidebar">
              <article class="aside-card">
                <p class="eyebrow">Товар</p>
                <h2>${escapeHtml(relatedProduct.shortName)}</h2>
                <p>${escapeHtml(relatedProduct.excerpt)}</p>
                ${renderAction({ href: `/catalog/${relatedProduct.slug}/`, label: "Открыть товар", className: "button button--small" })}
              </article>
              <article class="aside-card">
                <p class="eyebrow">Где купить</p>
                <p>Если вы уже изучили материал и готовы перейти к покупке, используйте официальные каналы бренда.</p>
                ${renderAction({
                  href: "/where-to-buy/",
                  label: "Официальные каналы покупки",
                  className: "button button--small button--ghost",
                  eventName: "marketplace_click",
                  eventParams: { channel: "where_to_buy", location: "article_sidebar" },
                })}
              </article>
            </aside>
          </div>
        </section>
        ${faq.html}
        <section class="section">
          <div class="shell">
            <div class="section-heading">
              <p class="eyebrow">Ещё материалы</p>
              <h2>Что посмотреть дальше</h2>
            </div>
            <div class="journal-grid">
              ${relatedPosts
                .map(
                  (related) => `
                    <article class="journal-card">
                      <a class="journal-card__media" ${linkAttrs(`/journal/${related.slug}/`, trackAttrs("journal_article_open", { slug: related.slug, location: "article_related" }))}>
                        <img src="${escapeHtml(related.image.src)}" width="${related.image.width}" height="${related.image.height}" alt="${escapeHtml(related.image.alt)}" loading="lazy" decoding="async" />
                      </a>
                      <div class="journal-card__body">
                        <h3><a ${linkAttrs(`/journal/${related.slug}/`, trackAttrs("journal_article_open", { slug: related.slug, location: "article_related_title" }))}>${escapeHtml(related.title)}</a></h3>
                        <p>${escapeHtml(related.description)}</p>
                      </div>
                    </article>
                  `,
                )
                .join("")}
            </div>
          </div>
        </section>
      </article>
    `,
  });
};

const legalPage = (pathname, entry, slug) => {
  const breadcrumb = renderBreadcrumbs([
    { label: "Главная", href: "/" },
    { label: "Правовая информация", href: "/documents/" },
    { label: entry.title, href: pathname },
  ]);

  return renderLayout({
    pathname,
    title: entry.metaTitle,
    description: entry.metaDescription,
    ogImage: "/assets/logo.jpg",
    dataPage: "legal",
    dataSlug: slug,
    schemaNodes: [organizationSchema(), breadcrumb.schema],
    content: `
      <section class="hero hero--inner">
        <div class="shell">
          ${breadcrumb.html}
          <div class="section-heading">
            <p class="eyebrow">Legal</p>
            <h1>${escapeHtml(entry.title)}</h1>
            <p>${escapeHtml(entry.intro)}</p>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="shell legal-layout">
          ${entry.sections
            .map(
              (section) => `
                <article class="legal-card">
                  <h2>${escapeHtml(section.title)}</h2>
                  ${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
    `,
  });
};

const documentsPage = () => {
  const breadcrumb = renderBreadcrumbs([
    { label: "Главная", href: "/" },
    { label: "Документы и trust", href: "/documents/" },
  ]);

  return renderLayout({
    pathname: "/documents/",
    title: siteData.documents.metaTitle,
    description: siteData.documents.metaDescription,
    ogImage: "/assets/about/jar-storage.jpg",
    dataPage: "documents",
    schemaNodes: [organizationSchema(), breadcrumb.schema],
    content: `
      <section class="hero hero--inner">
        <div class="shell">
          ${breadcrumb.html}
          <div class="section-heading">
            <p class="eyebrow">Trust</p>
            <h1>Документы, реквизиты и trust-материалы</h1>
            <p>${escapeHtml(siteData.documents.hero)}</p>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="shell">
          ${renderStoryCards(
            siteData.company.trustDocuments.map((item) => ({
              title: item.title,
              text: item.description,
            })),
          )}
        </div>
      </section>
      <section class="section section--muted">
        <div class="shell split-teasers">
          <article class="teaser-panel">
            <p class="eyebrow">Legal</p>
            <h2>Политика и согласие</h2>
            <p>Основной legal-скелет уже вынесен в отдельные страницы и готов для дальнейшего юридического заполнения.</p>
            <div class="button-row">
              ${renderAction({ href: "/legal/privacy/", label: "Политика конфиденциальности", className: "text-link" })}
              ${renderAction({ href: "/legal/consent/", label: "Согласие на обработку данных", className: "text-link" })}
            </div>
          </article>
          <article class="teaser-panel">
            <p class="eyebrow">B2B</p>
            <h2>Материалы для корпоративных клиентов</h2>
            <p>По мере развития бренда сюда удобно добавлять коммерческие материалы, спецификации, перечни документов и сертификаты.</p>
            ${renderAction({ href: "/b2b/", label: "Открыть B2B-страницу", className: "text-link" })}
          </article>
        </div>
      </section>
    `,
  });
};

const utilityPage = (pathname, slug, entry) => {
  const breadcrumb = renderBreadcrumbs([
    { label: "Главная", href: "/" },
    { label: entry.title, href: pathname },
  ]);

  return renderLayout({
    pathname,
    title: entry.metaTitle,
    description: entry.metaDescription,
    ogImage: "/assets/logo.jpg",
    noindex: true,
    dataPage: "utility",
    dataSlug: slug,
    schemaNodes: [breadcrumb.schema],
    content: `
      <section class="hero hero--inner">
        <div class="shell">
          ${breadcrumb.html}
          <div class="section-heading">
            <p class="eyebrow">Сервисная страница</p>
            <h1>${escapeHtml(entry.title)}</h1>
            <p>${escapeHtml(entry.text)}</p>
          </div>
          <div class="button-row">
            ${renderAction({ href: "/catalog/", label: "Перейти в каталог", className: "button button--small" })}
            ${renderAction({ href: "/where-to-buy/", label: "Где купить", className: "button button--small button--ghost" })}
          </div>
        </div>
      </section>
    `,
  });
};

const pages = [
  { pathname: "/", content: homePage(), indexable: true },
  { pathname: "/catalog/", content: catalogPage(), indexable: true },
  { pathname: "/categories/premium-nuts/", content: categoryPage(categoryById["premium-nuts"]), indexable: true },
  { pathname: "/catalog/macadamia/", content: productPage(productById.macadamia), indexable: true },
  { pathname: "/about/", content: aboutPage(), indexable: true },
  { pathname: "/where-to-buy/", content: whereToBuyPage(), indexable: true },
  { pathname: "/b2b/", content: b2bPage(), indexable: true },
  { pathname: "/delivery/", content: deliveryPage(), indexable: true },
  { pathname: "/contacts/", content: contactsPage(), indexable: true },
  { pathname: "/journal/", content: journalIndexPage(), indexable: true },
  { pathname: "/documents/", content: documentsPage(), indexable: true },
  { pathname: "/legal/privacy/", content: legalPage("/legal/privacy/", siteData.legal.privacy, "privacy"), indexable: true },
  { pathname: "/legal/consent/", content: legalPage("/legal/consent/", siteData.legal.consent, "consent"), indexable: true },
  { pathname: "/legal/terms/", content: legalPage("/legal/terms/", siteData.legal.terms, "terms"), indexable: true },
  { pathname: "/favorites/", content: utilityPage("/favorites/", "favorites", siteData.utilityPages.favorites), indexable: false },
  { pathname: "/account/", content: utilityPage("/account/", "account", siteData.utilityPages.account), indexable: false },
  { pathname: "/cart/", content: utilityPage("/cart/", "cart", siteData.utilityPages.cart), indexable: false },
  ...siteData.journal.posts.map((post) => ({
    pathname: `/journal/${post.slug}/`,
    content: articlePage(post),
    indexable: true,
  })),
];

const toFilePath = (pathname) => {
  if (pathname === "/") return "index.html";
  return path.join(pathname.slice(1), "index.html");
};

pages.forEach((page) => {
  writeText(toFilePath(page.pathname), page.content);
  if (page.indexable) indexablePages.push(page.pathname);
});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexablePages
  .map((pathname) => `  <url><loc>${escapeHtml(pageUrl(pathname))}</loc></url>`)
  .join("\n")}\n</urlset>\n`;

const robots = `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${pageUrl("/sitemap.xml")}\n`;

writeText("sitemap.xml", sitemap);
writeText("robots.txt", robots);

console.log(`Generated ${pages.length} HTML pages, sitemap.xml and robots.txt`);
