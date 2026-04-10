import fs from "node:fs";
import path from "node:path";

import { categoryById, postBySlug, productById, siteData } from "../content/site-data.mjs";
import {
  buildLeadProductOptions,
  leadBusinessTypes,
  leadDeliveryFormatOptions,
  leadEstimatedVolumeOptions,
  leadPackagingNeedsOptions,
  leadPreferredContactMethods,
  leadPurchaseFrequencyOptions,
  leadRequestTypes,
} from "./lead-form-shared.mjs";

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

const articleSchema = (post, pathname) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: renderMetaImage(post.image.src),
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
  };

  if (post.date) {
    schema.datePublished = post.date;
    schema.dateModified = post.date;
  }

  return schema;
};

const renderTopbar = () => `
  <div class="site-topbar">
    <div class="shell site-topbar__inner">
      <div class="site-topbar__items">
        ${siteData.site.noticeBar
          .map((item) =>
            item.href ? `<a ${linkAttrs(item.href)}>${escapeHtml(item.label)}</a>` : `<span>${escapeHtml(item.label)}</span>`,
          )
          .join("")}
      </div>
      <div class="site-topbar__links">
        <span>${escapeHtml(siteData.contact.hours)}</span>
        <a ${linkAttrs(siteData.contact.phoneHref, trackAttrs("phone_click", { location: "topbar" }))}>${escapeHtml(siteData.contact.phone)}</a>
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
          href: siteData.contact.telegramBotHref,
          label: "Написать в Telegram",
          className: "button button--small",
          eventName: "telegram_click",
          eventParams: { location: "header" },
        })}
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
            href: siteData.contact.telegramBotHref,
            label: "Написать в Telegram",
            className: "button",
            eventName: "telegram_click",
            eventParams: { location: "mobile_menu" },
          })}
          ${renderAction({
            href: "/b2b/?source=wholesale",
            label: "Оптовый запрос",
            className: "text-link",
            eventName: "wholesale_cta_click",
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
      <p>
        <a ${linkAttrs("/legal/privacy/")}>Политика конфиденциальности</a>
        <span> · </span>
        <a ${linkAttrs("/legal/consent/")}>Согласие на обработку данных</a>
        <span> · </span>
        <a ${linkAttrs("/legal/terms/")}>Условия заказа</a>
      </p>
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
            ${
              item.href
                ? `<p>${renderAction({
                    href: item.href,
                    label: item.cta || `Подробнее о ${item.title.toLowerCase()}`,
                    className: "text-link",
                    eventName: item.href?.startsWith("/b2b/") ? "wholesale_cta_click" : null,
                    eventParams: { location: "card" },
                  })}</p>`
                : ""
            }
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
          : '<p class="card-note">Скоро в ассортименте.</p>'
      }
    </article>
  `;
};

const renderProductCard = (product, location = "catalog") => `
  <article class="product-card" data-catalog-item data-search="${escapeHtml(
    `${product.name} ${product.description} ${product.origin} ${product.packaging} ${product.composition}`,
  )}">
    <a class="product-card__media" ${linkAttrs(`/catalog/${product.slug}/`, { "aria-label": `Страница товара: ${product.name}` })}>
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
        ${renderAction({
          href: `/catalog/${product.slug}/`,
          label: "Подробнее о товаре",
          className: "button button--small",
          ariaLabel: `Подробнее о товаре: ${product.name}`,
        })}
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

const renderChoiceCards = ({ name, options, type = "radio", checkedValue = "", checkedValues = [] }) => `
  <div class="choice-grid${type === "checkbox" ? " choice-grid--checkbox" : ""}" data-field-group="${escapeHtml(name)}">
    ${options
      .map((item) => {
        const checked =
          type === "checkbox" ? checkedValues.includes(item.value) : checkedValue === item.value;
        return `
          <label class="choice-card${checked ? " is-checked" : ""}">
            <input type="${type}" name="${escapeHtml(name)}"${type === "checkbox" ? "" : ""} value="${escapeHtml(item.value)}"${checked ? " checked" : ""} />
            <span class="choice-card__label">${escapeHtml(item.label)}</span>
            ${item.description ? `<span class="choice-card__description">${escapeHtml(item.description)}</span>` : ""}
          </label>
        `;
      })
      .join("")}
  </div>
`;

const renderSelectOptions = (options, includePlaceholder = true) => `
  ${includePlaceholder ? '<option value="">Выберите вариант</option>' : ""}
  ${options
    .map((item) => {
      const value = typeof item === "string" ? item : item.value;
      const label = typeof item === "string" ? item : item.label;
      return `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;
    })
    .join("")}
`;

const renderLeadFallbackLinks = (location) => `
  <div class="form-fallback-links">
    ${renderAction({
      href: siteData.contact.telegramWholesaleHref,
      label: "Telegram",
      className: "text-link",
      eventName: "lead_form_fallback_click_telegram",
      eventParams: { location },
    })}
    ${renderAction({
      href: siteData.contact.phoneHref,
      label: "Телефон",
      className: "text-link",
      eventName: "lead_form_fallback_click_phone",
      eventParams: { location },
    })}
    ${renderAction({
      href: siteData.contact.emailHref,
      label: "Email",
      className: "text-link",
      eventName: "lead_form_fallback_click_email",
      eventParams: { location },
    })}
  </div>
`;

const renderLeadRequestForm = ({
  variant = "full",
  pageType = "b2b",
  pageSlug = "b2b",
  sourceParam = "wholesale",
  defaultIntent = "wholesale_purchase",
  product = null,
  productContextLabel = "",
  title = "",
  text = "",
  submitLabel = "Отправить заявку",
  id = "lead-request-form",
  showExpandedFields = false,
}) => {
  const productOptions = buildLeadProductOptions(
    product ? [product] : Object.values(productById),
    { includeConsultation: true },
  );
  const currentProductValue = product ? `product:${product.id}` : "";
  const location = `${pageType}_${variant}_form`;

  return `
    <form
      class="request-form request-form--lead request-form--${escapeHtml(variant)}"
      id="${escapeHtml(id)}"
      data-lead-form
      data-form-role="b2b"
      data-form-variant="${escapeHtml(variant)}"
      data-page-type="${escapeHtml(pageType)}"
      data-page-slug="${escapeHtml(pageSlug)}"
      data-default-intent="${escapeHtml(defaultIntent)}"
      data-source-param="${escapeHtml(sourceParam)}"
      data-product-id="${escapeHtml(product?.id || "")}"
      data-product-slug="${escapeHtml(product?.slug || "")}"
      data-product-name="${escapeHtml(product?.name || "")}"
      data-category-context="${escapeHtml(product?.categoryId || "")}"
      action="/api/b2b-request"
      method="post"
      novalidate
    >
      <div class="request-form__intro">
        <p class="eyebrow">Для бизнеса</p>
        <h3>${escapeHtml(title || "Оптовый или корпоративный заказ")}</h3>
        <p>${escapeHtml(
          text ||
            "Оставьте заявку, и менеджер свяжется с вами, чтобы уточнить объём, формат поставки и условия.",
        )}</p>
      </div>

      ${
        product
          ? `<div class="form-context-note">
              <strong>Вы оставляете заявку по товару:</strong>
              <span>${escapeHtml(productContextLabel || product.name)}</span>
            </div>`
          : ""
      }

      <fieldset class="form-fieldset">
        <legend>Что вам нужно</legend>
        ${renderChoiceCards({
          name: "request_type",
          options: leadRequestTypes,
          checkedValue: defaultIntent,
        })}
      </fieldset>

      <fieldset class="form-fieldset">
        <legend>О компании и контакте</legend>
        <div class="form-grid ${variant === "full" ? "form-grid--three" : ""}">
          <label>
            <span>Компания / бренд / ИП</span>
            <input type="text" name="company_name" autocomplete="organization" />
          </label>
          <label>
            <span>Контактное лицо</span>
            <input type="text" name="contact_name" autocomplete="name" />
          </label>
          <label>
            <span>Тип бизнеса</span>
            <select name="business_type">
              ${renderSelectOptions(leadBusinessTypes)}
            </select>
          </label>
          <label>
            <span>ИНН <small>опционально</small></span>
            <input type="text" name="inn" inputmode="numeric" autocomplete="off" placeholder="Если хотите ускорить подготовку документов" />
          </label>
        </div>

        <div class="form-block">
          <span class="form-label">Как удобнее связаться</span>
          ${renderChoiceCards({
            name: "preferred_contact_method",
            options: leadPreferredContactMethods.map((item) => ({ value: item, label: item })),
            checkedValue: "Телефон",
          })}
          <p class="form-helper" data-contact-helper>
            Выберите основной канал. Остальные контакты можно оставить как резервные.
          </p>
        </div>

        <div class="form-grid ${variant === "full" ? "form-grid--three" : ""}">
          <label>
            <span>Телефон</span>
            <input type="tel" name="phone" autocomplete="tel" inputmode="tel" placeholder="+7 (___) ___-__-__" />
          </label>
          <label>
            <span>Email</span>
            <input type="email" name="email" autocomplete="email" placeholder="name@company.ru" />
          </label>
          <label data-conditional-field="telegram">
            <span>Telegram username</span>
            <input type="text" name="telegram_username" autocomplete="off" placeholder="@username" />
            <small class="form-helper">Если основной канал — Telegram, укажите username в формате @username.</small>
          </label>
        </div>
      </fieldset>

      <fieldset class="form-fieldset">
        <legend>Что нужно</legend>
        <div class="form-block">
          <span class="form-label">Интерес к продукту</span>
          ${renderChoiceCards({
            name: "product_interest",
            type: "checkbox",
            options: productOptions,
            checkedValues: currentProductValue ? [currentProductValue] : [],
          })}
        </div>
        <div class="form-grid ${variant === "full" ? "form-grid--three" : ""}">
          <label>
            <span>Оценка объёма</span>
            <select name="estimated_volume">
              ${renderSelectOptions(leadEstimatedVolumeOptions)}
            </select>
          </label>
          <label>
            <span>Город / регион поставки</span>
            <input type="text" name="city" autocomplete="address-level2" placeholder="Например, Москва" />
          </label>
          <label>
            <span>Частота закупки</span>
            <select name="purchase_frequency">
              ${renderSelectOptions(leadPurchaseFrequencyOptions)}
            </select>
          </label>
        </div>
      </fieldset>

      ${
        variant === "compact"
          ? `<details class="form-disclosure"${showExpandedFields ? " open" : ""}>
              <summary>Дополнительные детали</summary>
              <div class="form-disclosure__content">
                <label class="consent consent--toggle" data-field-group="need_commercial_offer">
                  <input type="checkbox" name="need_commercial_offer" />
                  <span>Добавить детали для коммерческого предложения</span>
                </label>
                <div class="form-grid" data-quote-details hidden>
                  <label>
                    <span>Точный объём, кг</span>
                    <input type="number" name="exact_volume_kg" min="1" step="1" inputmode="numeric" />
                  </label>
                  <label>
                    <span>Формат поставки</span>
                    <select name="delivery_format">
                      ${renderSelectOptions(leadDeliveryFormatOptions)}
                    </select>
                  </label>
                  <label>
                    <span>Когда нужен заказ</span>
                    <input type="date" name="target_date" />
                  </label>
                  <label>
                    <span>Фасовка / формат</span>
                    <select name="packaging_needs">
                      ${renderSelectOptions(leadPackagingNeedsOptions)}
                    </select>
                  </label>
                </div>
                <label data-quote-details hidden>
                  <span>Полный адрес <small>опционально</small></span>
                  <textarea name="full_address" rows="3" placeholder="Если хотите ускорить подготовку условий, можно указать адрес поставки."></textarea>
                </label>
                <label>
                  <span>Комментарий</span>
                  <textarea name="comment" rows="4" maxlength="1500" placeholder="Коротко опишите задачу, требования по фасовке, документам или формату поставки."></textarea>
                </label>
              </div>
            </details>`
          : `
            <fieldset class="form-fieldset form-fieldset--muted">
              <legend>Что поможет быстрее подготовить условия</legend>
              <p class="form-helper">
                Эти детали помогут быстрее подготовить условия. Точную стоимость и формат поставки менеджер подтвердит после заявки.
              </p>
              <label class="consent consent--toggle" data-field-group="need_commercial_offer">
                <input type="checkbox" name="need_commercial_offer" />
                <span>Добавить детали для коммерческого предложения</span>
              </label>
              <div class="form-grid form-grid--three" data-quote-details hidden>
                <label>
                  <span>Точный объём, кг</span>
                  <input type="number" name="exact_volume_kg" min="1" step="1" inputmode="numeric" />
                </label>
                <label>
                  <span>Формат поставки</span>
                  <select name="delivery_format">
                    ${renderSelectOptions(leadDeliveryFormatOptions)}
                  </select>
                </label>
                <label>
                  <span>Когда нужен заказ</span>
                  <input type="date" name="target_date" />
                </label>
                <label>
                  <span>Фасовка / формат</span>
                  <select name="packaging_needs">
                    ${renderSelectOptions(leadPackagingNeedsOptions)}
                  </select>
                </label>
                <label class="form-grid__span-2">
                  <span>Полный адрес <small>опционально</small></span>
                  <textarea name="full_address" rows="3" placeholder="Если хотите ускорить подготовку условий, можно указать адрес поставки."></textarea>
                </label>
              </div>
              <label>
                <span>Комментарий</span>
                <textarea name="comment" rows="5" maxlength="1500" placeholder="Опишите задачу, желаемый формат сотрудничества, фасовку или документы, которые нужно подготовить."></textarea>
              </label>
            </fieldset>
          `
      }

      <fieldset class="form-fieldset form-fieldset--compact">
        <legend>Подтверждение</legend>
        <label class="consent" data-field-group="consent">
          <input type="checkbox" name="consent" />
          <span>Согласен(а) на обработку данных для ответа по заявке и подготовки условий.</span>
        </label>
      </fieldset>

      <label class="form-honeypot" aria-hidden="true">
        <span>Если вы не бот, оставьте это поле пустым</span>
        <input type="text" name="company_website" tabindex="-1" autocomplete="off" />
      </label>

      <div class="button-row button-row--lead">
        <button class="button" type="submit">${escapeHtml(submitLabel)}</button>
        ${renderLeadFallbackLinks(location)}
      </div>
      <p class="form-note">
        Telegram, телефон и email остаются резервными каналами. Основной сценарий для бизнеса — заявка через эту форму.
      </p>
      <div class="form-status" tabindex="-1" role="status" aria-live="polite" data-form-status></div>
    </form>
  `;
};

const homePage = () => {
  const product = productById.macadamia;
  const [featuredPost, ...otherPosts] = siteData.journal.posts;
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
            <img src="/assets/about/hero-macadamia.jpg" width="1400" height="787" alt="Очищенная макадамия Global Basket" fetchpriority="high" />
          </div>
        </div>
      </section>
      <section class="section section--muted">
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
      <section class="section">
        <div class="shell">
          <div class="section-heading">
            <p class="eyebrow">Каталог</p>
            <h2>Текущий ассортимент и ближайшие разделы</h2>
          </div>
          <div class="catalog-grid">
            ${renderProductCard(product, "home_catalog")}
            ${siteData.categories.map((item) => renderCategoryCard(item)).join("")}
          </div>
        </div>
      </section>
      <section class="section">
        <div class="shell">
          <div class="section-heading">
            <p class="eyebrow">Почему покупать</p>
            <h2>Происхождение, упаковка, официальный канал покупки и прямой контакт с брендом.</h2>
          </div>
          ${renderStoryCards(siteData.home.advantages)}
        </div>
      </section>
      <section class="section section--compact">
        <div class="shell">
          <div class="section-heading">
            <p class="eyebrow">Журнал</p>
            <h2>Короткие материалы о продукте, упаковке и покупке.</h2>
          </div>
          <div class="journal-grid">
            <article class="journal-card journal-card--large">
              <a class="journal-card__media" ${linkAttrs(`/journal/${featuredPost.slug}/`, {
                ...trackAttrs("journal_article_open", { slug: featuredPost.slug, location: "home_journal_featured" }),
                "aria-label": `Открыть материал: ${featuredPost.title}`,
              })}>
                <img src="${escapeHtml(featuredPost.image.src)}" width="${featuredPost.image.width}" height="${featuredPost.image.height}" alt="${escapeHtml(featuredPost.image.alt)}" loading="lazy" decoding="async" />
              </a>
              <div class="journal-card__body">
                <p class="eyebrow">${escapeHtml(featuredPost.readingTime)}</p>
                <h3><a ${linkAttrs(`/journal/${featuredPost.slug}/`, trackAttrs("journal_article_open", { slug: featuredPost.slug, location: "home_journal_featured_title" }))}>${escapeHtml(featuredPost.title)}</a></h3>
                <p>${escapeHtml(featuredPost.description)}</p>
              </div>
            </article>
            ${otherPosts
              .map(
                (post) => `
                  <article class="journal-card">
                    <a class="journal-card__media" ${linkAttrs(`/journal/${post.slug}/`, {
                      ...trackAttrs("journal_article_open", { slug: post.slug, location: "home_journal" }),
                      "aria-label": `Открыть материал: ${post.title}`,
                    })}>
                      <img src="${escapeHtml(post.image.src)}" width="${post.image.width}" height="${post.image.height}" alt="${escapeHtml(post.image.alt)}" loading="lazy" decoding="async" />
                    </a>
                    <div class="journal-card__body">
                      <h3><a ${linkAttrs(`/journal/${post.slug}/`, trackAttrs("journal_article_open", { slug: post.slug, location: "home_journal_title" }))}>${escapeHtml(post.title)}</a></h3>
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

const catalogPage = () => {
  const breadcrumb = renderBreadcrumbs([
    { label: "Главная", href: "/" },
    { label: "Каталог", href: "/catalog/" },
  ]);
  const product = productById.macadamia;
  const items = [
    { ...product, href: `/catalog/${product.slug}/` },
    ...siteData.categories
      .filter((item) => item.status !== "coming-soon")
      .map((item) => ({ ...item, href: `/categories/${item.slug}/` })),
  ];

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
            <h1>Каталог</h1>
            <p>${escapeHtml(siteData.catalog.intro)}</p>
          </div>
          <p class="catalog-summary">1 товар в продаже и ${siteData.categories.length - 1} направления в ближайшем ассортименте.</p>
        </div>
      </section>
      <section class="section">
        <div class="shell catalog-layout">
          <aside class="catalog-sidebar">
            <article class="info-card">
              <h2>Разделы каталога</h2>
              <ul class="bullet-list">
                ${siteData.categories.map((item) => `<li>${escapeHtml(item.name)}</li>`).join("")}
              </ul>
            </article>
            <article class="info-card">
              <h2>Для опта и вопросов</h2>
              <p>Если нужен объём для бизнеса или вопрос по товару, используйте B2B-страницу или контакты.</p>
              <div class="button-stack">
                ${renderAction({
                  href: "/b2b/?source=wholesale",
                  label: "Оптовый запрос",
                  className: "button button--small",
                  eventName: "wholesale_cta_click",
                  eventParams: { location: "catalog_sidebar" },
                })}
                ${renderAction({ href: "/contacts/?source=catalog", label: "Контакты", className: "text-link" })}
              </div>
            </article>
          </aside>
          <div class="catalog-main">
            <div class="section-heading section-heading--compact">
              <p class="eyebrow">Товар и разделы</p>
              <h2>Очищенная макадамия и ближайшие направления каталога.</h2>
            </div>
            <div class="catalog-toolbar">
              <p class="catalog-summary">Сейчас в продаже одна позиция. Остальные разделы готовятся к запуску.</p>
            </div>
            <div class="catalog-grid" data-catalog-grid>
              ${renderProductCard(product, "catalog_grid")}
              ${siteData.categories.map((item) => renderCategoryCard(item)).join("")}
            </div>
          </div>
        </div>
      </section>
      <section class="section section--compact">
        <div class="shell">
          <div class="section-heading">
            <p class="eyebrow">Покупателям</p>
            <h2>Полезные ссылки</h2>
          </div>
          ${renderStoryCards(siteData.catalog.supportCards)}
        </div>
      </section>
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
  const listItems = [{ name: product.name, href: `/catalog/${product.slug}/` }];

  return renderLayout({
    pathname: `/categories/${category.slug}/`,
    title: `${category.name} — каталог и где купить`,
    description: category.description,
    ogImage: product.heroImage.src,
    dataPage: "category",
    dataSlug: category.slug,
    schemaNodes: [
      organizationSchema(),
      breadcrumb.schema,
      collectionSchema(category.name, listItems, `/categories/${category.slug}/`),
      itemListSchema(listItems),
    ].filter(Boolean),
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
      <section class="section section--compact">
        <div class="shell">
          <div class="catalog-grid">
            ${siteData.categories.map((item) => renderCategoryCard(item)).join("")}
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
              ${renderAction({
                href: `/catalog/${product.slug}/`,
                label: "Подробнее о товаре",
                className: "button button--small",
                ariaLabel: `Подробнее о товаре: ${product.name}`,
              })}
              ${renderAction({
                  href: "/b2b/?source=wholesale",
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
      <section class="section">
        <div class="shell">
          ${renderStoryCards([
            { title: "Где купить", text: "Официальные карточки бренда на маркетплейсах и прямые сервисные контакты.", href: "/where-to-buy/", cta: "Где купить" },
            { title: "Контакты", text: "Если нужен вопрос по товару или покупке, все каналы связи собраны на одной странице.", href: "/contacts/?source=pdp", cta: "Контакты" },
            { title: "Для бизнеса", text: "Для поставки, офиса, магазина и корпоративных заказов используйте отдельную B2B-страницу.", href: "/b2b/?source=wholesale", cta: "Оптовый запрос" },
          ])}
        </div>
      </section>
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
  const faq = renderFaq(product.faq, "FAQ по продукту");

  return renderLayout({
    pathname: `/catalog/${product.slug}/`,
    title: `${product.name} — характеристики и где купить`,
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
            <h2>Как использовать</h2>
            <ul class="bullet-list">
              ${product.useCases.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
          </div>
        </div>
      </section>
      <section class="section section--muted">
        <div class="shell feature-grid">
          <div class="feature-copy">
            <p class="eyebrow">Для бизнеса</p>
            <h2>Заявка по этому товару для магазина, HoReCa или корпоративной закупки</h2>
            <p>
              Если вас интересует поставка именно по этой позиции, оставьте короткую заявку. Менеджер свяжется с вами,
              чтобы уточнить объём, формат поставки и следующий шаг.
            </p>
            <div class="story-grid story-grid--compact">
              ${renderStoryCards([
                {
                  title: "Что будет дальше",
                  text: "Получим заявку, уточним задачу и подтвердим условия общения с менеджером.",
                },
                {
                  title: "Что важно указать",
                  text: "Компанию, город поставки, ориентир по объёму и удобный канал связи.",
                },
              ])}
            </div>
          </div>
          <div>
            ${renderLeadRequestForm({
              variant: "compact",
              pageType: "product",
              pageSlug: product.slug,
              sourceParam: "pdp",
              defaultIntent: "wholesale_purchase",
              product,
              productContextLabel: product.shortName,
              title: "Оптовый или корпоративный запрос",
              text: "Форма подходит для магазинов, HoReCa, офисов, подарочных наборов и других B2B-сценариев.",
              submitLabel: "Получить условия",
              id: "product-b2b-form",
            })}
          </div>
        </div>
      </section>
      <section class="section">
        <div class="shell">
          <div class="section-heading">
            <p class="eyebrow">Где купить</p>
            <h2>Где купить и как связаться</h2>
          </div>
          <div class="channel-grid">
            ${siteData.channels.marketplaces.map((item) => renderMarketplaceCard(item, "product_channels")).join("")}
          </div>
          <div class="story-grid">
            ${renderStoryCards([
              { title: "Вопрос по товару", text: "Если нужно уточнить упаковку, состав или покупку, напишите напрямую бренду.", href: "/contacts/?source=pdp", cta: "Контакты" },
              { title: "Для бизнеса", text: "Для магазина, офиса, HoReCa и корпоративных заказов оставьте отдельную B2B-заявку.", href: "/b2b/?source=wholesale", cta: "Оптовый запрос" },
              { title: "Поддержка", text: "Для претензий и сервисных вопросов доступны Telegram, телефон и email.", href: "https://t.me/global_basket_bot?start=complaint", cta: "Оставить претензию" },
            ])}
          </div>
        </div>
      </section>
      ${faq.html}
    `,
  });
};

const aboutPage = () => {
  const breadcrumb = renderBreadcrumbs([
    { label: "Главная", href: "/" },
    { label: "О бренде", href: "/about/" },
  ]);
  const faq = renderFaq(siteData.about.faq, "FAQ о бренде");
  const [whoSection, channelsSection, confirmedSection] = siteData.about.sections;

  return renderLayout({
    pathname: "/about/",
    title: siteData.about.metaTitle,
    description: siteData.about.metaDescription,
    ogImage: "/assets/about/hero-macadamia.jpg",
    dataPage: "about",
    schemaNodes: [organizationSchema(), breadcrumb.schema].filter(Boolean),
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
                href: "/b2b/?source=wholesale",
                label: "Опт / B2B",
                className: "button button--ghost",
                eventName: "wholesale_cta_click",
                eventParams: { location: "about_hero" },
              })}
            </div>
          </div>
          <article class="feature-media feature-media--landscape">
            <img src="/assets/about/hero-macadamia.jpg" width="1400" height="787" alt="Макадамия Global Basket" fetchpriority="high" />
          </article>
        </div>
      </section>
      <section class="section section--compact">
        <div class="shell">
          <nav class="subnav" aria-label="Разделы страницы">
            <a href="#about-who">Кто такой Global Basket</a>
            <a href="#about-channels">Покупка и связь</a>
            <a href="#about-facts">Что подтверждено</a>
            <a href="#about-contacts">Контакты</a>
          </nav>
        </div>
      </section>
      <section class="section" id="about-who">
        <div class="shell story-grid">
          <article class="info-card info-card--wide">
            <h2>${escapeHtml(whoSection.title)}</h2>
            ${whoSection.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
          </article>
        </div>
      </section>
      <section class="section section--muted" id="about-channels">
        <div class="shell story-grid">
          <article class="info-card info-card--wide">
            <h2>${escapeHtml(channelsSection.title)}</h2>
            ${channelsSection.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
          </article>
        </div>
      </section>
      <section class="section" id="about-facts">
        <div class="shell story-grid">
          <article class="info-card info-card--wide">
            <h2>${escapeHtml(confirmedSection.title)}</h2>
            ${confirmedSection.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
          </article>
        </div>
      </section>
      <section class="section section--muted" id="about-contacts">
        <div class="shell split-content">
          <div>
            <p class="eyebrow">Что уже известно</p>
            <h2>Ключевые факты о бренде и продукте</h2>
            <ul class="bullet-list">
              ${siteData.about.standards.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
          </div>
          <div>
            <p class="eyebrow">Контакты</p>
            <h2>Где купить и куда написать</h2>
            <p>${escapeHtml(siteData.company.requisitesNote)}</p>
            <div class="button-stack">
              ${renderAction({
                href: "/where-to-buy/",
                label: "Где купить",
                className: "button button--small",
                eventName: "marketplace_click",
                eventParams: { channel: "where_to_buy", location: "about_contacts" },
              })}
              ${renderAction({ href: "/contacts/", label: "Контакты", className: "button button--small button--ghost" })}
              ${renderAction({ href: "/documents/", label: "Документы", className: "text-link" })}
            </div>
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
            <p class="eyebrow">Покупка</p>
            <h2>Где купить в розницу</h2>
          </div>
          <div class="channel-grid">
            ${siteData.channels.marketplaces.map((item) => renderMarketplaceCard(item, "where_to_buy")).join("")}
          </div>
        </div>
      </section>
      <section class="section section--muted">
        <div class="shell">
          <div class="section-heading">
            <p class="eyebrow">Подсказка</p>
            <h2>Когда покупать, а когда лучше написать бренду</h2>
          </div>
          ${renderStoryCards(siteData.whereToBuy.chooser)}
          <div class="section-actions">
            ${renderAction({
              href: "/contacts/?source=support",
              label: "Контакты",
              className: "button button--small button--ghost",
            })}
            ${renderAction({
              href: siteData.contact.telegramBotHref,
              label: "Написать в Telegram",
              className: "text-link",
              eventName: "telegram_click",
              eventParams: { location: "where_to_buy_help" },
            })}
          </div>
        </div>
      </section>
    `,
  });
};

const b2bPage = () => {
  const breadcrumb = renderBreadcrumbs([
    { label: "Главная", href: "/" },
    { label: "Опт / B2B", href: "/b2b/" },
  ]);

  return renderLayout({
    pathname: "/b2b/",
    title: siteData.b2b.metaTitle,
    description: siteData.b2b.metaDescription,
    ogImage: "/assets/about/selection-hands.jpg",
    dataPage: "b2b",
    schemaNodes: [organizationSchema(), breadcrumb.schema].filter(Boolean),
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
            <img src="/assets/about/selection-hands.jpg" width="1200" height="800" alt="Отбор продукта Global Basket" fetchpriority="high" />
          </article>
        </div>
      </section>
      <section class="section">
        <div class="shell">
          <div class="section-heading">
            <p class="eyebrow">Кому подходит</p>
            <h2>Кому подходит сотрудничество</h2>
          </div>
          ${renderStoryCards(siteData.b2b.segments)}
        </div>
      </section>
      <section class="section section--muted">
        <div class="shell">
          <div class="section-heading">
            <p class="eyebrow">Преимущества</p>
            <h2>Что можно обсудить заранее</h2>
          </div>
          ${renderStoryCards(siteData.b2b.benefits)}
        </div>
      </section>
      <section class="section">
        <div class="shell">
          <div class="section-heading">
            <p class="eyebrow">Как это работает</p>
            <h2>Как проходит работа после заявки</h2>
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
            <p class="eyebrow">Для бизнеса</p>
            <h2>Оптовый или корпоративный заказ</h2>
            <p>
              Оставьте заявку, и менеджер свяжется с вами, чтобы уточнить объём, формат поставки и условия.
              Форма подходит для магазинов, HoReCa, офисов, корпоративных закупок и партнёрских запросов.
            </p>
            <div class="lead-trust">
              <p class="lead-trust__eyebrow">Что будет дальше</p>
              <ol class="lead-steps">
                <li>Получим заявку и проверим вводные.</li>
                <li>Уточним объём, формат поставки и задачу.</li>
                <li>Подтвердим условия и следующий шаг.</li>
              </ol>
            </div>
            <div class="lead-support-note">
              <strong>Данные для коммерческого предложения</strong>
              <p>
                Если хотите ускорить подготовку условий, добавьте в форме объём, желаемый срок и комментарий.
                Но точную стоимость и детали поставки подтверждает менеджер после заявки.
              </p>
            </div>
          </div>
          <div>
            ${renderLeadRequestForm({
              variant: "full",
              pageType: "b2b",
              pageSlug: "b2b",
              sourceParam: "wholesale",
              defaultIntent: "wholesale_purchase",
              title: "Оставьте заявку для бизнеса",
              text: "Соберём главное для первого разговора: компанию, формат запроса, интерес к продукту и удобный канал связи.",
              submitLabel: "Отправить B2B-заявку",
              id: "b2b-form-main",
            })}
          </div>
        </div>
      </section>
    `,
  });
};

const deliveryPage = () => {
  const breadcrumb = renderBreadcrumbs([
    { label: "Главная", href: "/" },
    { label: "Доставка и оплата", href: "/delivery/" },
  ]);

  return renderLayout({
    pathname: "/delivery/",
    title: siteData.delivery.metaTitle,
    description: siteData.delivery.metaDescription,
    ogImage: "/assets/about/jar-storage.jpg",
    dataPage: "delivery",
    schemaNodes: [organizationSchema(), breadcrumb.schema].filter(Boolean),
    content: `
      <section class="hero hero--inner">
        <div class="shell feature-grid feature-grid--hero">
          <div class="feature-copy">
            ${breadcrumb.html}
            <p class="eyebrow">Доставка и оплата</p>
            <h1>Доставка и оплата</h1>
            <p class="hero__lead">${escapeHtml(siteData.delivery.hero)}</p>
          </div>
          <article class="aside-card">
            <p class="eyebrow">Следующий шаг</p>
            <h2>Сначала запрос, затем уточнение условий.</h2>
            <p>Если нужен вопрос по доставке, оплате или возврату, удобнее сразу написать бренду.</p>
            <div class="button-stack">
              ${renderAction({ href: "/contacts/?source=support", label: "Контакты", className: "button button--small" })}
              ${renderAction({
                href: "https://t.me/global_basket_bot?start=complaint",
                label: "Оставить претензию",
                className: "text-link",
                eventName: "complaint_click",
                eventParams: { location: "delivery_hero" },
              })}
            </div>
          </article>
        </div>
      </section>
      <section class="section">
        <div class="shell">
          <div class="section-heading">
            <p class="eyebrow">Как это работает</p>
            <h2>Куда обращаться по покупке, опту и вопросам доставки</h2>
          </div>
          <div class="story-grid">
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
        </div>
      </section>
      <section class="section section--compact" id="returns">
        <div class="shell">
          ${renderStoryCards([
            { title: "Возвраты и претензии", text: "Если возник вопрос после покупки, напишите в Telegram, на email или позвоните.", href: "/contacts/?source=returns", cta: "Открыть контакты" },
            { title: "Нужны документы", text: "Если по доставке или закупке нужны документы, их можно запросить через контакты бренда.", href: "/documents/", cta: "Документы" },
          ])}
        </div>
      </section>
    `,
  });
};

const contactsPage = () => {
  const breadcrumb = renderBreadcrumbs([
    { label: "Главная", href: "/" },
    { label: "Контакты", href: "/contacts/" },
  ]);

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
    ].filter(Boolean),
    content: `
      <section class="hero hero--inner">
        <div class="shell">
          ${breadcrumb.html}
          <aside class="intent-banner" hidden data-intent-banner></aside>
          <div class="contacts-layout">
            <div>
              <div class="section-heading">
                <p class="eyebrow">Контакты</p>
                <h1 data-intent-hero-title>Контакты Global Basket</h1>
                <p data-intent-hero-text>${escapeHtml(siteData.contacts.hero)}</p>
              </div>
              <div class="card-grid">
                ${siteData.contacts.routes
                  .map((item, index) => {
                    const source =
                      index === 0 ? "pdp" : index === 1 ? "wholesale" : index === 2 ? "support" : "returns";
                    return `
                      <article class="info-card" data-intent-route="${source}">
                        <h2>${escapeHtml(item.title)}</h2>
                        <p>${escapeHtml(item.text)}</p>
                        <p>${renderAction({
                          href: item.href,
                          label: item.cta,
                          className: "text-link",
                          eventName: source === "wholesale" ? "wholesale_cta_click" : null,
                          eventParams: { location: "contacts_routes" },
                        })}</p>
                      </article>
                    `;
                  })
                  .join("")}
              </div>
            </div>
            <div class="panel-stack">
              <article class="aside-card">
                <p class="eyebrow">Прямые каналы</p>
                <h2>Телефон, email и Telegram под рукой</h2>
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
              </article>
              <article class="aside-card">
                <p class="eyebrow">Для бизнеса</p>
                <h2>Оптовый или корпоративный запрос</h2>
                <p>
                  Если вам нужна поставка, коммерческое предложение или обсуждение сотрудничества, оставьте короткую заявку.
                  Telegram, телефон и email останутся запасными каналами связи.
                </p>
                <div class="lead-trust lead-trust--compact">
                  <p class="lead-trust__eyebrow">Что будет дальше</p>
                  <ol class="lead-steps">
                    <li>Получим заявку.</li>
                    <li>Уточним детали.</li>
                    <li>Подтвердим следующий шаг.</li>
                  </ol>
                </div>
                ${renderLeadRequestForm({
                  variant: "compact",
                  pageType: "contacts",
                  pageSlug: "contacts",
                  sourceParam: "contacts",
                  defaultIntent: "commercial_offer",
                  title: "Оставьте заявку для менеджера",
                  text: "Форма подходит для магазинов, HoReCa, офисов, корпоративных закупок и других бизнес-клиентов.",
                  submitLabel: "Связаться со мной",
                  id: "contact-b2b-form",
                  showExpandedFields: true,
                })}
              </article>
            </div>
          </div>
        </div>
      </section>
    `,
  });
};

const journalIndexPage = () => {
  const breadcrumb = renderBreadcrumbs([
    { label: "Главная", href: "/" },
    { label: "Журнал", href: "/journal/" },
  ]);
  const [featuredPost, ...otherPosts] = siteData.journal.posts;

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
        <div class="shell feature-grid feature-grid--hero">
          <div class="feature-copy">
            ${breadcrumb.html}
            <p class="eyebrow">Журнал</p>
            <h1>Журнал Global Basket</h1>
            <p class="hero__lead">${escapeHtml(siteData.journal.intro)}</p>
          </div>
          <article class="journal-card journal-card--large">
            <a class="journal-card__media" ${linkAttrs(`/journal/${featuredPost.slug}/`, {
              ...trackAttrs("journal_article_open", { slug: featuredPost.slug, location: "journal_featured" }),
              "aria-label": `Открыть материал: ${featuredPost.title}`,
            })}>
              <img src="${escapeHtml(featuredPost.image.src)}" width="${featuredPost.image.width}" height="${featuredPost.image.height}" alt="${escapeHtml(featuredPost.image.alt)}" fetchpriority="high" />
            </a>
            <div class="journal-card__body">
              <p class="eyebrow">${escapeHtml(featuredPost.readingTime)}</p>
              <h2><a ${linkAttrs(`/journal/${featuredPost.slug}/`, trackAttrs("journal_article_open", { slug: featuredPost.slug, location: "journal_featured_title" }))}>${escapeHtml(featuredPost.title)}</a></h2>
              <p>${escapeHtml(featuredPost.description)}</p>
            </div>
          </article>
        </div>
      </section>
      <section class="section">
        <div class="shell">
          <div class="journal-grid">
            ${otherPosts
              .map(
                (post) => `
                  <article class="journal-card">
                    <a class="journal-card__media" ${linkAttrs(`/journal/${post.slug}/`, {
                      ...trackAttrs("journal_article_open", { slug: post.slug, location: "journal_index" }),
                      "aria-label": `Открыть материал: ${post.title}`,
                    })}>
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
              ${post.date ? `<p class="article-meta">Дата публикации: <time datetime="${escapeHtml(post.date)}">${escapeHtml(post.date)}</time></p>` : ""}
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
                ${renderAction({
                  href: `/catalog/${relatedProduct.slug}/`,
                  label: "Подробнее о товаре",
                  className: "button button--small",
                  ariaLabel: `Подробнее о товаре: ${relatedProduct.name}`,
                })}
              </article>
              <article class="aside-card">
                <p class="eyebrow">Где купить</p>
                <p>Если вы уже изучили материал и готовы к покупке, переходите к официальным карточкам бренда.</p>
                ${renderAction({
                  href: "/where-to-buy/",
                  label: "Где купить",
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
                      <a class="journal-card__media" ${linkAttrs(`/journal/${related.slug}/`, {
                        ...trackAttrs("journal_article_open", { slug: related.slug, location: "article_related" }),
                        "aria-label": `Открыть материал: ${related.title}`,
                      })}>
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
            <p class="eyebrow">Правовая информация</p>
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
    { label: "Документы", href: "/documents/" },
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
            <p class="eyebrow">Документы</p>
            <h1>Документы и реквизиты</h1>
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
      <section class="section section--compact">
        <div class="shell">
          <div class="button-row">
            ${renderAction({ href: "/contacts/?source=support", label: "Запросить документы", className: "button button--small" })}
            ${renderAction({ href: "/legal/privacy/", label: "Политика конфиденциальности", className: "text-link" })}
          </div>
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
