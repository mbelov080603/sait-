const store = window.GlobalBasketData;
const product = store.product;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const escapeQuery = (value = "") => value.trim().toLowerCase();
const queryTokens = (value = "") => escapeQuery(value).split(/\s+/).filter(Boolean);
const escapeAttribute = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const iconPaths = {
  search:
    '<path d="M10.5 4a6.5 6.5 0 1 0 4 11.6l4.2 4.2 1.4-1.4-4.2-4.2A6.5 6.5 0 0 0 10.5 4Zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z"></path>',
  heart:
    '<path d="M12 21.35 10.55 20C5.4 15.24 2 12.09 2 8.25 2 5.1 4.42 2.75 7.5 2.75c1.74 0 3.41.81 4.5 2.08 1.09-1.27 2.76-2.08 4.5-2.08 3.08 0 5.5 2.35 5.5 5.5 0 3.84-3.4 6.99-8.55 11.76L12 21.35Z"></path>',
  user:
    '<path d="M12 12a4.75 4.75 0 1 0 0-9.5A4.75 4.75 0 0 0 12 12Zm0 2.25c-4.14 0-7.5 2.63-7.5 5.88 0 .76.62 1.37 1.38 1.37h12.24c.76 0 1.38-.61 1.38-1.37 0-3.25-3.36-5.88-7.5-5.88Z"></path>',
  bag:
    '<path d="M7 7.5V6.25a5 5 0 0 1 10 0V7.5h1.75c.74 0 1.36.56 1.43 1.29l1.1 11.5a1.5 1.5 0 0 1-1.49 1.71H5.21a1.5 1.5 0 0 1-1.49-1.71l1.1-11.5A1.44 1.44 0 0 1 6.25 7.5H7Zm2 0h6V6.25a3 3 0 0 0-6 0V7.5Z"></path>',
  package:
    '<path d="M3.5 7.2 12 2l8.5 5.2v9.6L12 22l-8.5-5.2V7.2Zm8.5-2.86L6.18 7.9 12 11.4l5.82-3.5L12 4.34Zm-6.5 5.1v6.12l5.5 3.36v-6.12L5.5 9.44Zm7.5 9.48 5.5-3.36V9.44l-5.5 3.36v6.12Z"></path>',
  globe:
    '<path d="M12 2.5A9.5 9.5 0 1 0 21.5 12 9.51 9.51 0 0 0 12 2.5Zm6.92 8h-3.34a15.1 15.1 0 0 0-1.32-4.44A7.04 7.04 0 0 1 18.92 10.5ZM12 4.58c.7 0 1.88 1.94 2.47 5.92H9.53C10.12 6.52 11.3 4.58 12 4.58ZM6.74 6.06A15.1 15.1 0 0 0 5.42 10.5H2.08A7.04 7.04 0 0 1 6.74 6.06ZM2.58 12.5h2.64a16.44 16.44 0 0 0 1.1 4.64A7.04 7.04 0 0 1 2.58 12.5Zm9.42 6.92c-.7 0-1.88-1.94-2.47-5.92h4.94c-.59 3.98-1.77 5.92-2.47 5.92Zm2.86-1.28a16.44 16.44 0 0 0 1.1-4.64h2.64a7.04 7.04 0 0 1-3.74 4.64Z"></path>',
  scale:
    '<path d="M12 3 4 7v2h16V7l-8-4Zm0 2.2L15.58 7H8.42L12 5.2ZM6.5 10.5l-3.5 6a2.5 2.5 0 0 0 2.16 3.75h2.68A2.5 2.5 0 0 0 10 16.5l-3.5-6Zm11 0-3.5 6a2.5 2.5 0 0 0 2.16 3.75h2.68A2.5 2.5 0 0 0 21 16.5l-3.5-6ZM11 10h2v9h-2z"></path>',
  dot:
    '<path d="M12 4.5A7.5 7.5 0 1 0 19.5 12 7.5 7.5 0 0 0 12 4.5Zm0 3.5a4 4 0 1 1-4 4 4 4 0 0 1 4-4Z"></path>',
  arrow:
    '<path d="M5 12h11.17l-3.58 3.59L14 17l6-6-6-6-1.41 1.41L16.17 10H5v2Z"></path>',
};

const externalAttrs = (href) =>
  href && /^https?:\/\//.test(href) ? ' target="_blank" rel="noreferrer"' : "";

const isCurrentNav = (item, currentPath) =>
  (item.match || [item.href]).some((prefix) => currentPath.startsWith(prefix));

const renderIcon = (name) => `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    ${iconPaths[name] || iconPaths.dot}
  </svg>
`;

const renderBadge = (label, tone = "active") =>
  `<span class="meta-badge meta-badge--${tone}">${label}</span>`;

const renderHeader = () => {
  const mount = $("[data-site-header]");
  if (!mount) return;

  const currentPath = window.location.pathname;
  const currentQuery = new URLSearchParams(window.location.search).get("q") || "";
  const links = store.primaryNav
    .map(
      (item) =>
        `<a class="${isCurrentNav(item, currentPath) ? "is-current" : ""}" href="${item.href}">${item.label}</a>`,
    )
    .join("");

  const iconLinks = store.headerIcons
    .map(
      (item) => `
        <a class="icon-button" href="${item.href}" aria-label="${item.label}" title="${item.label}">
          ${renderIcon(item.icon)}
        </a>
      `,
    )
    .join("");

  const noticeItems = store.noticeBar.items
    .map((item) =>
      item.href
        ? `<a href="${item.href}">${item.label}</a>`
        : `<span>${item.label}</span>`,
    )
    .join("");

  mount.innerHTML = `
    <div class="page-noise" aria-hidden="true"></div>
    <header class="site-header">
      <div class="top-notice-bar">
        <div class="shell top-notice-bar__inner">
          <div class="top-notice-bar__items">${noticeItems}</div>
          <div class="top-notice-bar__meta">
            <span>${store.contact.hours}</span>
            <a href="${store.contact.phoneHref}">${store.contact.phone}</a>
          </div>
        </div>
      </div>
      <div class="shell header-main">
        <a class="brand-mark" href="/" aria-label="На главную Global Basket">
          <img src="/assets/logo.jpg" alt="Логотип Global Basket" />
          <div>
            <strong>Global Basket</strong>
            <span>Премиальные орехи</span>
          </div>
        </a>

        <nav class="main-nav main-nav--desktop" aria-label="Основная навигация">${links}</nav>

        <div class="header-actions">
          <div class="header-search" data-header-search>
            <button
              class="icon-button header-search__toggle"
              type="button"
              data-search-toggle
              aria-expanded="false"
              aria-controls="desktop-search-form"
              aria-label="Открыть поиск"
            >
              ${renderIcon("search")}
            </button>
            <form
              class="search-form search-form--desktop-popover"
              id="desktop-search-form"
              data-search-form
              data-search-desktop
              action="/catalog/"
              method="get"
              role="search"
              aria-label="Поиск по каталогу"
              aria-hidden="true"
            >
              <input type="hidden" name="scope" value="catalog" />
              <button class="search-form__submit" type="submit" aria-label="Найти">
                ${renderIcon("search")}
              </button>
              <input
                type="search"
                name="q"
                value="${currentQuery}"
                placeholder="Поиск по каталогу"
                aria-label="Поиск по каталогу"
              />
            </form>
          </div>
          ${iconLinks}
          <a class="button button--small button--header" href="${store.contact.telegramHref}"${externalAttrs(store.contact.telegramHref)}>Написать в Telegram</a>
        </div>

        <button
          class="mobile-menu-toggle"
          type="button"
          data-mobile-nav-toggle
          aria-controls="mobile-nav"
          aria-expanded="false"
        >
          Меню
        </button>
      </div>

      <div class="mobile-nav" id="mobile-nav" data-mobile-nav>
        <div class="shell mobile-nav__inner">
          <form class="search-form search-form--mobile" data-search-form action="/catalog/" method="get">
            <input type="hidden" name="scope" value="catalog" />
            <button class="search-form__submit" type="submit" aria-label="Найти">
              ${renderIcon("search")}
            </button>
            <input type="search" name="q" value="${currentQuery}" placeholder="Поиск по каталогу" aria-label="Поиск по каталогу" />
          </form>
          <div class="mobile-nav__links">${links}</div>
          <div class="mobile-nav__meta">
            <a href="${store.contact.phoneHref}">${store.contact.phone}</a>
            <a href="${store.contact.emailHref}">${store.contact.email}</a>
          </div>
          <div class="mobile-nav__icons">${iconLinks}</div>
          <a class="button" href="${store.contact.telegramHref}"${externalAttrs(store.contact.telegramHref)}>Написать в Telegram</a>
        </div>
      </div>
    </header>
  `;
};

const renderFooter = () => {
  const mount = $("[data-site-footer]");
  if (!mount) return;

  mount.innerHTML = `
    <footer class="site-footer">
      <div class="shell site-footer__inner">
        <div class="footer-brand">
          <strong>Global Basket</strong>
          <p>Магазин премиальных орехов с тёплой натуральной подачей и понятной витриной продукта.</p>
          <span>${store.contact.phone}</span>
          <span>${store.contact.email}</span>
          <span>${store.contact.hours}</span>
        </div>
        <div class="footer-columns">
          ${store.footer.columns
            .map(
              (column) => `
                <div class="footer-column">
                  <strong>${column.title}</strong>
                  ${column.links
                    .map(
                      (link) =>
                        `<a href="${link.href}"${externalAttrs(link.href)}>${link.label}</a>`,
                    )
                    .join("")}
                </div>
              `,
            )
            .join("")}
        </div>
      </div>
    </footer>
  `;
};

const renderFactCard = (item) => `
  <article class="fact-card">
    <span class="fact-card__icon">${renderIcon(item.icon || "dot")}</span>
    <div>
      <strong>${item.title}</strong>
      <p>${item.text}</p>
    </div>
  </article>
`;

const renderBenefitCard = (item) => `
  <article class="benefit-card">
    <span class="benefit-card__mark">${item.code}</span>
    <div class="benefit-card__body">
      <strong>${item.title}</strong>
      <p>${item.text}</p>
    </div>
  </article>
`;

const renderMarketplaceCard = (item) => `
  <article class="marketplace-card">
    <div class="marketplace-card__head">
      <span class="marketplace-card__brand">${item.name}</span>
      ${renderBadge("Где купить", "service")}
    </div>
    <ul class="marketplace-card__list">
      ${item.bullets.map((bullet) => `<li>${bullet}</li>`).join("")}
    </ul>
    <a class="button button--ghost button--small" href="${item.href}"${externalAttrs(item.href)}>${item.cta}</a>
  </article>
`;

const renderTrustCard = (item) => `
  <article class="trust-card">
    <strong>${item.title}</strong>
    <p>${item.text}</p>
    ${item.href ? `<a class="text-link" href="${item.href}">Смотреть раздел</a>` : ""}
  </article>
`;

const renderCategoryCard = (item) => `
  <article class="category-card ${item.status === "coming" ? "category-card--coming" : ""}">
    ${renderBadge(item.statusLabel, item.status)}
    <h3>${item.href ? `<a href="${item.href}">${item.name}</a>` : item.name}</h3>
    <p>${item.description}</p>
    ${
      item.href
        ? `<a class="text-link text-link--inline" href="${item.href}">Смотреть раздел</a>`
        : `<span class="card-note">Скоро откроем.</span>`
    }
  </article>
`;

const renderAdvantageCard = (item) => `
  <article class="advantage-card">
    <strong>${item.title}</strong>
    <p>${item.text}</p>
  </article>
`;

const renderSectionCard = (item) => `
  <article class="section-card ${item.status === "coming" ? "section-card--muted" : ""}">
    ${renderBadge(item.badge || item.statusLabel, item.tone || item.status || "service")}
    <h3>${item.href ? `<a href="${item.href}">${item.title || item.name}</a>` : item.title || item.name}</h3>
    <p>${item.description}</p>
    ${
      item.href
        ? `<a class="text-link" href="${item.href}">Смотреть раздел</a>`
        : `<span class="card-note">Скоро откроем.</span>`
    }
  </article>
`;

const renderJournalCard = (post, featured = false) => `
  <article class="journal-card ${featured ? "journal-card--featured" : ""}">
    ${post.image ? `<a class="journal-card__media" href="${post.href}"><img src="${post.image}" alt="${post.title}" loading="lazy" decoding="async" /></a>` : ""}
    <div class="journal-card__body">
      ${renderBadge("Материал", "editorial")}
      <h3><a href="${post.href}">${post.title}</a></h3>
      <p>${featured ? post.lead : post.excerpt}</p>
      <a class="text-link text-link--inline" href="${post.href}">Читать</a>
    </div>
  </article>
`;

const renderDeliveryStep = (item) => `
  <article class="step-card">
    <strong>${item.title}</strong>
    <p>${item.text}</p>
  </article>
`;

const formatCatalogCount = (count) => {
  if (count % 10 === 1 && count % 100 !== 11) return `${count} позиция`;
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
    return `${count} позиции`;
  }
  return `${count} позиций`;
};

const renderEnterpriseProductCard = (featured = false) => `
  <article class="product-card ${featured ? "product-card--featured" : ""}">
    <div class="product-card__top">
      ${renderBadge(product.badge, product.badgeTone)}
    </div>
    <div class="product-card__content">
      <a class="product-card__media" href="${product.href}">
        <img src="${product.images.packshot}" alt="${product.fullName}" loading="lazy" decoding="async" />
      </a>
      <div class="product-card__body">
        <h3><a href="${product.href}">${product.shortName}</a></h3>
        <p class="product-card__subtitle">${product.subtitle}</p>
        <p class="product-card__lead">${product.lead}</p>
        <div class="product-card__actions">
          <a class="button button--small" href="${product.href}">Подробнее</a>
          <a class="text-link text-link--inline" href="/contacts/?source=catalog-card">Уточнить условия</a>
        </div>
      </div>
    </div>
  </article>
`;

const renderLeadRequestForm = (config, context = {}) => {
  const hiddenFields = {
    source: context.source || "home-hero",
    page: context.page || document.body.dataset.page || "home",
    product_id: context.productId || product.id,
    product_name: context.productName || product.fullName,
    product_category: context.productCategory || product.category,
    lead_channel_origin: "site",
    marketplace_interest: context.marketplaceInterest || "",
    crm_status_seed: "new",
    crm_pipeline_seed: "site_request",
    integration_targets: "bitrix24,1c",
    payload_version: "v1",
    session_id: "",
    landing_url: "",
    page_title: "",
    referrer: "",
    submitted_at: "",
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
    utm_content: "",
    utm_term: "",
  };

  return `
    <article class="request-panel request-panel--lead">
      <div class="section-head section-head--compact">
        <p class="eyebrow">${config.eyebrow}</p>
        <h2>${config.title}</h2>
        <p>${config.text}</p>
      </div>
      <form class="request-form request-form--lead" data-request-form data-request-adapter="crm-ready" novalidate>
        ${Object.entries(hiddenFields)
          .map(
            ([name, value]) =>
              `<input type="hidden" name="${name}" value="${escapeAttribute(value)}" />`,
          )
          .join("")}
        <div class="request-form__grid">
          <label>
            <span>Ваше имя</span>
            <input type="text" name="name" autocomplete="name" placeholder="Как к вам обращаться" required />
          </label>
          <label>
            <span>Телефон</span>
            <input type="tel" name="phone" autocomplete="tel" inputmode="tel" placeholder="+7 (___) ___-__-__" required />
          </label>
        </div>
        <div class="request-form__grid">
          <label>
            <span>Что вас интересует</span>
            <select name="topic" required>
              ${config.topics
                .map((item) => `<option value="${item.value}">${item.label}</option>`)
                .join("")}
            </select>
          </label>
          <label>
            <span>Как удобнее связаться</span>
            <select name="contact_preferred">
              ${config.preferredContacts
                .map((item) => `<option value="${item.value}">${item.label}</option>`)
                .join("")}
            </select>
          </label>
        </div>
        <label>
          <span>Комментарий</span>
          <textarea name="message" placeholder="Например: хочу узнать цену, формат поставки или условия покупки."></textarea>
        </label>
        <label class="request-form__consent">
          <input type="checkbox" name="consent" required />
          <span>${config.consent}</span>
        </label>
        <div class="request-form__actions">
          <button class="button" type="submit">${config.submitLabel}</button>
          <a class="text-link text-link--inline" href="${config.secondaryCta.href}"${externalAttrs(config.secondaryCta.href)}>${config.secondaryCta.label}</a>
        </div>
        <p class="request-form__note">${config.note}</p>
        <p class="request-form__status" data-request-status aria-live="polite"></p>
      </form>
    </article>
  `;
};

const CONTACT_BASE_PRICE_PER_KG = 700;

const formatRub = (value = 0) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));

const normalizePositiveNumber = (value) => {
  const parsed = Number.parseFloat(String(value ?? "").replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
};

const getDiscountRate = (quantityKg) => {
  if (quantityKg >= 1000) return 0.2;
  if (quantityKg >= 500) return 0.15;
  if (quantityKg >= 100) return 0.1;
  return 0;
};

const getDistanceBlocks = (distanceKm) => Math.floor(normalizePositiveNumber(distanceKm) / 1000);

const calculateContactQuote = ({
  quantityKg,
  distanceKm,
  basePricePerKg = CONTACT_BASE_PRICE_PER_KG,
}) => {
  const normalizedQuantity = normalizePositiveNumber(quantityKg);
  const normalizedDistance = normalizePositiveNumber(distanceKm);
  const discountRate = getDiscountRate(normalizedQuantity);
  const distanceBlocks1000 = getDistanceBlocks(normalizedDistance);
  const distanceMarkupRate = distanceBlocks1000 * 0.05;
  const subtotalBase = normalizedQuantity * basePricePerKg;
  const subtotalAfterDiscount = subtotalBase * (1 - discountRate);
  const totalEstimate = subtotalAfterDiscount * (1 + distanceMarkupRate);
  const estimatedPricePerKg = normalizedQuantity ? totalEstimate / normalizedQuantity : 0;

  return {
    quantityKg: normalizedQuantity,
    distanceKm: normalizedDistance,
    basePricePerKg,
    discountRate,
    distanceBlocks1000,
    distanceMarkupRate,
    subtotalBase,
    subtotalAfterDiscount,
    totalEstimate,
    estimatedPricePerKg,
  };
};

const renderContactQuoteForm = (config, context = {}) => {
  const hiddenFields = {
    source: context.source || "contacts",
    page: context.page || document.body.dataset.page || "contacts",
    product_id: context.productId || product.id,
    product_name: context.productName || product.fullName,
    product_category: context.productCategory || product.category,
    lead_channel_origin: "site",
    marketplace_interest: context.marketplaceInterest || "",
    crm_status_seed: "new",
    crm_pipeline_seed: "site_request",
    integration_targets: "bitrix24,1c",
    payload_version: "v1",
    session_id: "",
    landing_url: "",
    page_title: "",
    referrer: "",
    submitted_at: "",
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
    utm_content: "",
    utm_term: "",
    base_price_per_kg: String(CONTACT_BASE_PRICE_PER_KG),
    discount_rate: "0",
    discount_tier: "0%",
    distance_blocks_1000: "0",
    distance_markup_rate: "0",
    subtotal_base: "0",
    subtotal_after_discount: "0",
    total_estimate: "0",
    estimated_price_per_kg: "0",
    currency: "RUB",
    is_estimate: "true",
  };

  const initialQuote = calculateContactQuote({ quantityKg: 1, distanceKm: 0 });

  return `
    <article class="request-panel request-panel--contact-form">
      <div class="section-head section-head--compact">
        <p class="eyebrow">${config.eyebrow}</p>
        <h2>${config.title}</h2>
        <p>${config.text}</p>
      </div>
      <form class="request-form request-form--quote" data-request-form data-quote-form data-request-adapter="crm-ready" novalidate>
        ${Object.entries(hiddenFields)
          .map(
            ([name, value]) =>
              `<input type="hidden" name="${name}" value="${escapeAttribute(value)}" />`,
          )
          .join("")}
        <div class="request-form__grid">
          <label>
            <span>Контактное лицо</span>
            <input type="text" name="name" autocomplete="name" placeholder="Как к вам обращаться" required />
          </label>
          <label>
            <span>Телефон</span>
            <input type="tel" name="phone" autocomplete="tel" inputmode="tel" placeholder="+7 (___) ___-__-__" required />
          </label>
        </div>
        <div class="request-form__grid">
          <label>
            <span>Email</span>
            <input type="email" name="email" autocomplete="email" placeholder="name@example.com" />
          </label>
          <label>
            <span>Как удобнее связаться</span>
            <select name="contact_preferred">
              ${config.preferredContacts
                .map((item) => `<option value="${item.value}">${item.label}</option>`)
                .join("")}
            </select>
          </label>
        </div>
        <div class="request-form__grid">
          <label>
            <span>Юридическое лицо / ИП</span>
            <input type="text" name="company_name" autocomplete="organization" placeholder="Название компании или ИП" required />
          </label>
          <label>
            <span>ИНН</span>
            <input type="text" name="company_inn" inputmode="numeric" placeholder="Если есть" />
          </label>
        </div>
        <div class="request-form__grid">
          <label>
            <span>Что вас интересует</span>
            <select name="topic" required>
              ${config.topics
                .map((item) => `<option value="${item.value}">${item.label}</option>`)
                .join("")}
            </select>
          </label>
          <label>
            <span>Формат закупки</span>
            <select name="purchase_format">
              ${config.purchaseFormats
                .map((item) => `<option value="${item.value}">${item.label}</option>`)
                .join("")}
            </select>
          </label>
        </div>
        <div class="request-form__grid">
          <label>
            <span>Сколько килограммов нужно</span>
            <input type="number" name="quantity_kg" min="1" step="1" value="1" inputmode="numeric" required data-quote-quantity />
          </label>
          <label>
            <span>Расстояние от Москвы, км</span>
            <input type="number" name="distance_km" min="0" step="1" value="0" inputmode="numeric" required data-quote-distance />
          </label>
        </div>
        <label>
          <span>Адрес доставки</span>
          <input type="text" name="delivery_address" autocomplete="street-address" placeholder="Город, улица, склад или точка доставки" required />
        </label>
        <label>
          <span>Комментарий</span>
          <textarea name="message" placeholder="Например: нужен ежемесячный объём, тестовая партия или особые условия доставки."></textarea>
        </label>
        <article class="quote-summary" data-quote-summary aria-live="polite">
          <div class="quote-summary__head">
            <strong>Предварительный расчёт</strong>
            <p>${config.pricingHint}</p>
          </div>
          <dl class="quote-summary__list">
            <div class="quote-summary__row">
              <dt>Базовая цена</dt>
              <dd data-quote-base>${formatRub(CONTACT_BASE_PRICE_PER_KG)} / кг</dd>
            </div>
            <div class="quote-summary__row">
              <dt>Объём</dt>
              <dd data-quote-weight>${initialQuote.quantityKg} кг</dd>
            </div>
            <div class="quote-summary__row">
              <dt>Скидка</dt>
              <dd data-quote-discount>0%</dd>
            </div>
            <div class="quote-summary__row">
              <dt>Надбавка за расстояние</dt>
              <dd data-quote-distance-markup>+0%</dd>
            </div>
            <div class="quote-summary__row">
              <dt>Цена за кг после расчёта</dt>
              <dd data-quote-price-per-kg>${formatRub(initialQuote.estimatedPricePerKg)} / кг</dd>
            </div>
            <div class="quote-summary__row quote-summary__row--total">
              <dt>Предварительная сумма</dt>
              <dd data-quote-total>${formatRub(initialQuote.totalEstimate)}</dd>
            </div>
          </dl>
        </article>
        <label class="request-form__consent">
          <input type="checkbox" name="consent" required />
          <span>${config.consent}</span>
        </label>
        <div class="request-form__actions">
          <button class="button" type="submit">${config.submitLabel}</button>
          <a class="text-link text-link--inline" href="${config.quickContactHref}"${externalAttrs(config.quickContactHref)}>${config.quickContactLabel}</a>
        </div>
        <p class="request-form__note">${config.note}</p>
        <p class="request-form__status" data-request-status aria-live="polite"></p>
      </form>
    </article>
  `;
};

const renderHome = () => {
  const hero = $("#home-hero");
  if (hero) {
    hero.innerHTML = `
      <article class="hero-stage hero-stage--lead">
        <div class="hero-stage__copy">
          <p class="eyebrow">${store.home.hero.eyebrow}</p>
          <h1>${store.home.hero.title}</h1>
          <div class="hero-stage__body">
            ${store.home.hero.paragraphs.map((item) => `<p>${item}</p>`).join("")}
          </div>
          <ul class="hero-stage__meta hero-stage__meta--brand">
            ${store.home.hero.chips.map((item) => `<li>${item}</li>`).join("")}
          </ul>
          <div class="hero-stage__actions">
            <a class="text-link text-link--inline" href="${store.home.hero.secondaryCta.href}"${externalAttrs(store.home.hero.secondaryCta.href)}>${store.home.hero.secondaryCta.label}</a>
          </div>
        </div>
        <div class="hero-stage__media">
          <article class="media-stage media-stage--lifestyle">
            <img src="${product.images.lifestyle}" alt="Очищенная макадамия Global Basket в домашней подаче" loading="lazy" decoding="async" />
          </article>
        </div>
      </article>
    `;
  }

  const categories = $("#home-categories");
  if (categories) {
    categories.innerHTML = store.categories.map(renderCategoryCard).join("");
  }

  const featured = $("#home-featured");
  if (featured) {
    featured.innerHTML = `
      <article class="feature-split">
        <div class="feature-split__copy">
          <p class="eyebrow">${store.home.featured.title}</p>
          <h2>${store.home.featured.heading}</h2>
          <p>${store.home.featured.text}</p>
          <ul class="feature-points">
            ${store.home.featured.points.map((item) => `<li>${item}</li>`).join("")}
          </ul>
          <div class="hero-stage__actions">
            <a class="button" href="${store.home.featured.primaryCta.href}"${externalAttrs(store.home.featured.primaryCta.href)}>${store.home.featured.primaryCta.label}</a>
            <a class="button button--ghost" href="${store.home.featured.secondaryCta.href}"${externalAttrs(store.home.featured.secondaryCta.href)}>${store.home.featured.secondaryCta.label}</a>
          </div>
          <div class="market-links">
            <span>Где ещё посмотреть:</span>
            ${store.marketplaces
              .map((item) => `<a href="${item.href}"${externalAttrs(item.href)}>${item.name}</a>`)
              .join("")}
          </div>
        </div>
        <div class="hero-stage__media">
          ${renderLeadRequestForm(store.home.leadForm, {
            source: "home-featured",
            page: "home",
          })}
        </div>
      </article>
    `;
  }

  const advantages = $("#home-advantages");
  if (advantages) {
    advantages.innerHTML = store.home.advantages.map(renderAdvantageCard).join("");
  }

  const [featuredPost, ...otherPosts] = store.journal.posts;
  const journalFeatured = $("#home-journal-featured");
  if (journalFeatured && featuredPost) {
    journalFeatured.innerHTML = renderJournalCard(featuredPost, true);
  }

  const journalList = $("#home-journal-list");
  if (journalList) {
    journalList.innerHTML = otherPosts.map((item) => renderJournalCard(item)).join("");
  }
};

const buildCatalogItems = () => {
  const upcoming = store.categories.filter((item) => item.status === "coming");
  return [
    {
      type: "product",
      title: product.shortName,
      keywords: `${product.shortName} ${product.fullName} ${product.subtitle} ${product.origin} ${product.weight} ${product.packaging} ${product.category} ${product.lead} ${product.availability} очищенная макадамия орехи`,
      html: renderEnterpriseProductCard(true),
      status: "active",
    },
    ...upcoming.map((item) => ({
      type: "section",
      title: item.name,
      keywords: `${item.name} ${item.description} ${item.statusLabel}`,
      html: renderSectionCard(item),
      status: "coming",
    })),
  ];
};

const matchesCatalogSearch = (entry, query, scope = "catalog") => {
  const tokens = queryTokens(query);
  if (!tokens.length) return true;

  if (scope === "nuts" && entry.type !== "product") return false;
  if (scope === "sections" && entry.type !== "section") return false;

  const haystack = escapeQuery(entry.keywords || "");
  return tokens.every((token) => haystack.includes(token));
};

const renderCatalog = () => {
  const sidebar = $("#catalog-sidebar");
  if (sidebar) {
    sidebar.innerHTML = `
      <article class="sidebar-card">
        <strong>Категории</strong>
        ${store.categories
          .map((item) =>
            item.href
              ? `<a href="${item.href}"><span>${item.name}</span><span>${item.statusLabel}</span></a>`
              : `<div class="sidebar-card__static"><span>${item.name}</span><span>${item.statusLabel}</span></div>`,
          )
          .join("")}
      </article>
      <article class="sidebar-card">
        <strong>Покупателям</strong>
        <a href="/contacts/?source=catalog-sidebar"><span>Связаться</span></a>
        <a href="/delivery/"><span>Доставка и оплата</span></a>
        <a href="/about/"><span>О бренде</span></a>
      </article>
    `;
  }

  const controls = $("#catalog-toolbar");
  if (controls) {
    controls.innerHTML = `
      <div class="catalog-toolbar__filters">
        ${store.catalogPage.filters
          .map(
            (item, index) => `
              <button class="filter-pill ${index === 0 ? "is-active" : ""}" type="button" data-filter="${item.value}">
                ${item.label}
              </button>
            `,
          )
          .join("")}
      </div>
      <div class="catalog-toolbar__meta">
        <span class="catalog-toolbar__count" data-count></span>
        <label class="catalog-toolbar__sort">
          <span>Сортировка</span>
          <select data-sort>
            ${store.catalogPage.sorts
              .map((item) => `<option value="${item.value}">${item.label}</option>`)
              .join("")}
          </select>
        </label>
      </div>
    `;
  }

  const grid = $("#catalog-grid");
  if (grid) {
    const params = new URLSearchParams(window.location.search);
    const query = escapeQuery(params.get("q") || "");
    const scope = params.get("scope") || "catalog";
    const items = buildCatalogItems().filter((entry) => {
      if (!query) return true;
      return matchesCatalogSearch(entry, query, scope);
    });

    grid.innerHTML = items.length
      ? items.map((item) => item.html).join("")
      : `
          <article class="empty-state">
            <strong>По вашему запросу пока ничего не найдено.</strong>
            <p>Попробуйте поискать «макадамия», «орехи» или вернитесь ко всему каталогу.</p>
            <a class="button button--small" href="/catalog/">В каталог</a>
          </article>
        `;
  }

  const support = $("#catalog-support");
  if (support) {
    support.innerHTML = store.catalogPage.support.map(renderSectionCard).join("");
  }
};

const renderProductPage = () => {
  const gallery = $("#product-gallery");
  if (gallery) {
    gallery.innerHTML = `
      <div class="product-gallery__main">
        <img src="${product.images.main}" alt="${product.fullName}" />
      </div>
      <div class="product-gallery__thumbs">
        ${product.gallery
          .map(
            (item) => `
              <figure>
                <img src="${item.src}" alt="${item.alt}" loading="lazy" decoding="async" />
              </figure>
            `,
          )
          .join("")}
      </div>
    `;
  }

  const summary = $("#product-summary");
  if (summary) {
    summary.innerHTML = `
      ${renderBadge(product.badge, product.badgeTone)}
      <h1>${product.shortName}</h1>
      <p class="product-summary__subtitle">${product.subtitle}</p>
      <p class="product-page__lead">${product.lead}</p>
      <ul class="hero-product__pills hero-product__pills--summary">
        ${product.pills.map((item) => `<li>${item}</li>`).join("")}
      </ul>
      <dl class="summary-facts">
        ${product.factCards
          .map(
            (item) => `
              <div>
                <dt>${item.title}</dt>
                <dd>${item.text}</dd>
              </div>
            `,
          )
          .join("")}
      </dl>
      <div class="purchase-panel">
        <div>
          <span class="purchase-panel__label">Стоимость</span>
          <strong>${product.price}</strong>
          <p>${product.priceNote}</p>
        </div>
        <div class="purchase-panel__actions">
          <a class="button" href="/contacts/?source=pdp">Уточнить условия</a>
          <a class="text-link text-link--inline" href="/catalog/">Вернуться в каталог</a>
        </div>
      </div>
      <div class="market-links market-links--summary">
        <span>Где купить:</span>
        ${store.marketplaces
          .map((item) => `<a href="${item.href}"${externalAttrs(item.href)}>${item.name}</a>`)
          .join("")}
      </div>
    `;
  }

  const benefits = $("#product-benefits");
  if (benefits) {
    benefits.innerHTML = product.benefitCards.map(renderBenefitCard).join("");
  }

  const marketplaces = $("#product-marketplaces");
  if (marketplaces) {
    marketplaces.innerHTML = store.marketplaces.map(renderMarketplaceCard).join("");
  }

  const faq = $("#product-faq");
  if (faq) {
    faq.innerHTML = product.faq
      .map(
        (item, index) => `
          <article class="faq-item ${index === 0 ? "is-open" : ""}">
            <button type="button" aria-expanded="${index === 0 ? "true" : "false"}">
              <span>${item.question}</span>
              <span>${index === 0 ? "−" : "+"}</span>
            </button>
            <p>${item.answer}</p>
          </article>
        `,
      )
      .join("");
  }
};

const renderContactsPage = () => {
  const params = new URLSearchParams(window.location.search);
  const requestedSource = params.get("source") || "contacts-page";
  const intro = $("#contacts-intro");
  if (intro) {
    intro.innerHTML = `
      <div class="hero-copy">
        <p class="eyebrow">Контакты</p>
        <h1>Связаться с Global Basket</h1>
        <p>${store.contactsPage.intro}</p>
      </div>
      <div class="contacts-info-grid">
        ${store.contactsPage.leftCards
          .map(
            (item) => `
              <article class="fact-card fact-card--vertical">
                <div>
                  <strong>${item.title}</strong>
                  <p>${item.text}</p>
                </div>
              </article>
            `,
          )
          .join("")}
      </div>
      <article class="contact-direct">
        <strong>Прямой контакт</strong>
        <p><a href="${store.contact.phoneHref}">${store.contact.phone}</a></p>
        <p><a href="${store.contact.emailHref}">${store.contact.email}</a></p>
        <p><a href="${store.contact.telegramHref}"${externalAttrs(store.contact.telegramHref)}>${store.contact.telegram}</a></p>
        <p><a href="${store.contact.channelHref}"${externalAttrs(store.contact.channelHref)}>${store.contact.channel}</a></p>
        <p>${store.contact.hours}</p>
      </article>
      <article class="contact-marketplaces">
        <strong>Где купить</strong>
        <div class="contact-marketplaces__links">
          ${store.marketplaces
            .map(
              (item) =>
                `<a href="${item.href}"${externalAttrs(item.href)}>${item.name}</a>`,
            )
            .join("")}
        </div>
      </article>
    `;
  }

  const panel = $("#contact-panel");
  if (panel) {
    panel.innerHTML = `
      <div class="contact-panel__stack">
        ${renderContactQuoteForm(store.contactsPage.quoteForm, {
          source: requestedSource,
          page: "contacts",
        })}
        <article class="request-panel request-panel--compact request-panel--secondary">
          <div class="section-head section-head--compact">
            <p class="eyebrow">Telegram-бот</p>
            <h2>${store.contactsPage.telegramPanel.title}</h2>
            <p>${store.contactsPage.telegramPanel.text}</p>
          </div>
          <div class="hero-product__actions">
            <a class="button button--small" href="${store.contact.telegramHref}"${externalAttrs(store.contact.telegramHref)}>${store.contactsPage.telegramPanel.primary}</a>
            <a class="button button--ghost button--small" href="${store.contact.telegramComplaintHref}"${externalAttrs(store.contact.telegramComplaintHref)}>${store.contactsPage.telegramPanel.secondary}</a>
          </div>
          <p class="request-form__note">Основной канал связи: <a href="${store.contact.telegramHref}"${externalAttrs(store.contact.telegramHref)}>${store.contact.telegram}</a>. Новости бренда: <a href="${store.contact.channelHref}"${externalAttrs(store.contact.channelHref)}>${store.contact.channel}</a>. Резервный контакт: <a href="${store.contact.phoneHref}">${store.contact.phone}</a> / <a href="${store.contact.emailHref}">${store.contact.email}</a></p>
        </article>
      </div>
    `;
  }
};

const renderAboutFactSlide = (item, index) => `
  <article class="about-fact-slide" data-about-slide aria-label="${index + 1} из ${store.aboutPage.facts.cards.length}">
    <span class="about-fact-slide__index">${String(index + 1).padStart(2, "0")}</span>
    <strong>${item.title}</strong>
    <p>${item.text}</p>
  </article>
`;

const renderAboutValueCard = (item) => `
  <article class="about-brand-card about-brand-card--value" data-reveal>
    <strong>${item.title}</strong>
    <p>${item.text}</p>
  </article>
`;

const renderAboutMissionCard = (item) => `
  <article class="about-brand-card about-brand-card--mission" data-reveal>
    <strong>${item.title}</strong>
    <p>${item.text}</p>
  </article>
`;

const renderAboutListItems = (items) =>
  items.map((item) => `<li>${item}</li>`).join("");

const setAboutLayoutOffsets = () => {
  const header = $(".site-header");
  const subnav = $("[data-about-subnav]");
  const headerHeight = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
  const subnavHeight = subnav ? Math.ceil(subnav.getBoundingClientRect().height) : 0;
  const stickyTop = Math.max(8, headerHeight - 44);
  document.documentElement.style.setProperty("--about-header-offset", `${stickyTop}px`);
  document.documentElement.style.setProperty(
    "--about-anchor-offset",
    `${stickyTop + subnavHeight + 12}px`,
  );
  return { headerHeight, subnavHeight, stickyTop };
};

const scrollToAboutSection = (target, behavior = "smooth") => {
  if (!target) return;

  const { subnavHeight, stickyTop } = setAboutLayoutOffsets();
  const top =
    target.getBoundingClientRect().top +
    window.scrollY -
    stickyTop -
    subnavHeight -
    12;

  window.scrollTo({
    top: Math.max(0, top),
    behavior,
  });
};

const initAboutScrollSpy = () => {
  const nav = $("[data-about-subnav]");
  if (!nav) return;

  const links = $$("a[href^='#']", nav);
  const sections = links
    .map((link) => $(link.getAttribute("href")))
    .filter(Boolean);

  if (!links.length || !sections.length) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const setActive = (id, keepVisible = true) => {
    links.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${id}`;
      link.classList.toggle("is-active", isActive);
      link.setAttribute("aria-current", isActive ? "true" : "false");
      if (isActive && keepVisible) {
        link.scrollIntoView({
          block: "nearest",
          inline: "center",
          behavior: "smooth",
        });
      }
    });
  };

  let observer;
  const bindObserver = () => {
    const { subnavHeight, stickyTop } = setAboutLayoutOffsets();
    if (observer) observer.disconnect();
    observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id, false);
      },
      {
        rootMargin: `-${stickyTop + subnavHeight + 12}px 0px -55% 0px`,
        threshold: [0.18, 0.35, 0.6],
      },
    );
    sections.forEach((section) => observer.observe(section));
  };

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = $(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      const targetId = link.getAttribute("href").replace("#", "");
      setActive(targetId, false);
      window.history.replaceState(null, "", `#${targetId}`);
      scrollToAboutSection(target, prefersReducedMotion ? "auto" : "smooth");
    });
  });

  const syncHash = () => {
    if (!window.location.hash) return;
    const target = $(window.location.hash);
    if (!target) return;
    setActive(target.id, false);
    requestAnimationFrame(() => scrollToAboutSection(target, "auto"));
  };

  let resizeFrame = 0;
  window.addEventListener(
    "resize",
    () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(bindObserver);
    },
    { passive: true },
  );

  window.addEventListener("hashchange", syncHash);
  window.addEventListener("load", syncHash, { once: true });
  window.setTimeout(syncHash, 220);
  setActive(sections[0].id, false);
  bindObserver();
  syncHash();
};

const initAboutFactsCarousel = () => {
  const root = $("[data-about-carousel]");
  if (!root) return;

  const track = $("[data-about-track]", root);
  const slides = $$("[data-about-slide]", root);
  const prevButton = $("[data-about-prev]", root);
  const nextButton = $("[data-about-next]", root);
  const dotsRoot = $("[data-about-dots]", root) || $(".about-carousel__dots", root);

  if (!track || slides.length < 2) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const maxScrollLeft = () => Math.max(0, track.scrollWidth - track.clientWidth);
  let snapPoints = [];
  let dots = [];

  const getSnapPoints = () => {
    const maxLeft = maxScrollLeft();
    return slides
      .map((slide) => Math.min(slide.offsetLeft, maxLeft))
      .sort((left, right) => left - right)
      .filter((left, index, positions) => index === 0 || Math.abs(left - positions[index - 1]) > 2);
  };

  const getIndex = () => {
    if (!snapPoints.length) return 0;

    const currentLeft = track.scrollLeft;
    let activeIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    snapPoints.forEach((left, index) => {
      const distance = Math.abs(left - currentLeft);
      if (distance < bestDistance) {
        bestDistance = distance;
        activeIndex = index;
      }
    });

    return activeIndex;
  };

  const buildDots = () => {
    if (!dotsRoot) return;

    dotsRoot.innerHTML = snapPoints
      .map(
        (_, index) => `
          <button
            type="button"
            class="about-carousel__dot"
            data-about-dot
            aria-label="Перейти к группе фактов ${index + 1}"
            aria-current="false"
          ></button>
        `,
      )
      .join("");

    dots = $$("[data-about-dot]", dotsRoot);
    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => scrollToIndex(index));
    });
  };

  const updateControls = () => {
    const index = getIndex();
    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === index;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-current", isActive ? "true" : "false");
    });
    if (prevButton) prevButton.disabled = index <= 0;
    if (nextButton) nextButton.disabled = index >= snapPoints.length - 1;
  };

  const scrollToIndex = (index) => {
    const boundedIndex = Math.max(0, Math.min(snapPoints.length - 1, index));
    track.scrollTo({
      left: snapPoints[boundedIndex] ?? 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  const syncLayout = () => {
    snapPoints = getSnapPoints();
    buildDots();
    updateControls();
  };

  prevButton?.addEventListener("click", () => scrollToIndex(getIndex() - 1));
  nextButton?.addEventListener("click", () => scrollToIndex(getIndex() + 1));

  let frame = 0;
  track.addEventListener(
    "scroll",
    () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateControls);
    },
    { passive: true },
  );

  let resizeFrame = 0;
  window.addEventListener(
    "resize",
    () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(syncLayout);
    },
    { passive: true },
  );

  syncLayout();
};

const initRevealAnimations = () => {
  const nodes = $$("[data-reveal]");
  if (!nodes.length) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    nodes.forEach((node) => node.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.14,
      rootMargin: "0px 0px -10% 0px",
    },
  );

  nodes.forEach((node) => observer.observe(node));
};

const initAboutPage = () => {
  initAboutScrollSpy();
  initAboutFactsCarousel();
  initRevealAnimations();
};

const renderAboutPage = () => {
  const about = store.aboutPage;
  const hero = $("#about-hero");
  if (!hero) return;

  hero.innerHTML = `
    <div class="shell about-brand-hero__layout">
      <div class="about-brand-hero__copy">
        <div class="breadcrumb">
          <a href="/">Главная</a>
          <span>/</span>
          <span>О бренде</span>
        </div>
        <p class="eyebrow">${about.hero.eyebrow}</p>
        <h1>${about.hero.title}</h1>
        <p class="about-brand-hero__lead">${about.hero.text}</p>
        <ul class="about-brand-hero__chips">
          ${about.hero.chips.map((item) => `<li>${item}</li>`).join("")}
        </ul>
        <div class="hero-stage__actions">
          <a class="button" href="${about.hero.primaryCta.href}">${about.hero.primaryCta.label}</a>
          <a class="button button--ghost" href="${about.hero.secondaryCta.href}">${about.hero.secondaryCta.label}</a>
        </div>
      </div>
      <article class="about-brand-hero__visual" data-reveal>
        <img
          src="${about.hero.image.src}"
          alt="${about.hero.image.alt}"
          decoding="async"
          fetchpriority="high"
        />
      </article>
    </div>
  `;

  const subnav = $("[data-about-subnav]");
  if (subnav) {
    subnav.innerHTML = about.nav
      .map(
        (item) => `
          <a href="#${item.id}" aria-current="false">
            ${item.label}
          </a>
        `,
      )
      .join("");
  }

  const who = $("#about-who");
  if (who) {
    who.innerHTML = `
      <div class="about-split">
        <div class="about-section-copy" data-reveal>
          <p class="eyebrow">Кто мы</p>
          <h2>${about.who.title}</h2>
          ${about.who.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")}
        </div>
        <article class="about-image-card" data-reveal>
          <img src="${about.who.image.src}" alt="${about.who.image.alt}" loading="lazy" decoding="async" />
        </article>
      </div>
    `;
  }

  const mission = $("#about-mission");
  if (mission) {
    mission.innerHTML = `
      <div class="section-head about-section-head" data-reveal>
        <p class="eyebrow">Платформа бренда</p>
        <h2>${about.mission.title}</h2>
        <p>${about.mission.text}</p>
      </div>
      <div class="about-mission-grid">
        ${about.mission.cards.map(renderAboutMissionCard).join("")}
      </div>
    `;
  }

  const facts = $("#about-facts");
  if (facts) {
    facts.innerHTML = `
      <div class="section-head about-section-head" data-reveal>
        <p class="eyebrow">Факты о бренде</p>
        <h2>${about.facts.title}</h2>
        <p>${about.facts.text}</p>
      </div>
      <section class="about-carousel" data-about-carousel aria-roledescription="carousel" aria-label="${about.facts.title}">
        <div class="about-carousel__controls" data-reveal>
          <button class="about-carousel__arrow about-carousel__arrow--prev" type="button" data-about-prev aria-label="Предыдущий факт">
            <span aria-hidden="true">←</span>
          </button>
          <button class="about-carousel__arrow" type="button" data-about-next aria-label="Следующий факт">
            <span aria-hidden="true">→</span>
          </button>
        </div>
        <div class="about-carousel__viewport">
          <div class="about-carousel__track" data-about-track>
            ${about.facts.cards.map(renderAboutFactSlide).join("")}
          </div>
        </div>
        <div class="about-carousel__dots" data-about-dots data-reveal></div>
      </section>
    `;
  }

  const values = $("#about-values");
  if (values) {
    values.innerHTML = `
      <div class="section-head about-section-head" data-reveal>
        <p class="eyebrow">Ценности бренда</p>
        <h2>${about.values.title}</h2>
      </div>
      <div class="about-values-grid">
        ${about.values.cards.map(renderAboutValueCard).join("")}
      </div>
    `;
  }

  const why = $("#about-why");
  if (why) {
    why.innerHTML = `
      <div class="section-head about-section-head" data-reveal>
        <p class="eyebrow">Почему нас выбирают</p>
        <h2>${about.whyChoose.title}</h2>
      </div>
      <div class="about-why-grid">
        <div class="about-why-copy">
          <article class="about-list-card" data-reveal>
            <strong>${about.whyChoose.rationalTitle}</strong>
            <ul class="about-bullet-list">
              ${renderAboutListItems(about.whyChoose.rational)}
            </ul>
          </article>
          <article class="about-list-card" data-reveal>
            <strong>${about.whyChoose.emotionalTitle}</strong>
            <ul class="about-bullet-list">
              ${renderAboutListItems(about.whyChoose.emotional)}
            </ul>
          </article>
        </div>
        <article class="about-image-card about-image-card--portrait" data-reveal>
          <img src="${about.whyChoose.image.src}" alt="${about.whyChoose.image.alt}" loading="lazy" decoding="async" />
        </article>
      </div>
    `;
  }

  const selection = $("#about-selection");
  if (selection) {
    selection.innerHTML = `
      <div class="about-section-top">
        <div class="section-head about-section-head" data-reveal>
          <p class="eyebrow">Отбор продуктов</p>
          <h2>${about.selection.title}</h2>
          <p>${about.selection.text}</p>
        </div>
        <article class="about-image-card about-image-card--compact" data-reveal>
          <img src="${about.selection.image.src}" alt="${about.selection.image.alt}" loading="lazy" decoding="async" />
        </article>
      </div>
      <div class="about-steps-grid">
        ${about.selection.steps
          .map(
            (item, index) => `
              <article class="about-step-card" data-reveal>
                <span class="about-step-card__index">${String(index + 1).padStart(2, "0")}</span>
                <strong>${item.title}</strong>
                <p>${item.text}</p>
              </article>
            `,
          )
          .join("")}
      </div>
    `;
  }

  const differences = $("#about-differences");
  if (differences) {
    differences.innerHTML = `
      <div class="about-section-top">
        <div class="section-head about-section-head" data-reveal>
          <p class="eyebrow">Отличия</p>
          <h2>${about.differences.title}</h2>
        </div>
        <article class="about-image-card about-image-card--compact" data-reveal>
          <img src="${about.differences.image.src}" alt="${about.differences.image.alt}" loading="lazy" decoding="async" />
        </article>
      </div>
      <div class="about-comparison" data-reveal>
        <div class="about-comparison__header">
          <strong>${about.differences.leftLabel}</strong>
          <strong>${about.differences.rightLabel}</strong>
        </div>
        ${about.differences.rows
          .map(
            (row) => `
              <div class="about-comparison__row">
                <p>${row.left}</p>
                <p>${row.right}</p>
              </div>
            `,
          )
          .join("")}
      </div>
      <article class="about-comparison__summary" data-reveal>
        <p>${about.differences.summary}</p>
      </article>
    `;
  }

  const character = $("#about-character");
  if (character) {
    character.innerHTML = `
      <div class="section-head about-section-head" data-reveal>
        <p class="eyebrow">Характер бренда</p>
        <h2>${about.character.title}</h2>
      </div>
      <div class="about-character" data-reveal>
        <div class="about-character__tags">
          ${about.character.tags.map((item) => `<span class="about-character__tag">${item}</span>`).join("")}
        </div>
        <p>${about.character.text}</p>
      </div>
    `;
  }

  const legend = $("#about-legend");
  if (legend) {
    legend.innerHTML = `
      <article class="about-legend" data-reveal>
        <p class="eyebrow">Легенда бренда</p>
        <h2>${about.legend.title}</h2>
        <p>${about.legend.text}</p>
      </article>
    `;
  }

  const cta = $("#about-cta");
  if (cta) {
    cta.innerHTML = `
      <article class="about-final-cta" data-reveal>
        <div class="section-head section-head--compact">
          <p class="eyebrow">Global Basket</p>
          <h2>${about.cta.title}</h2>
          <p>${about.cta.text}</p>
        </div>
        <div class="hero-stage__actions about-final-cta__actions">
          <a class="button" href="${about.cta.primary.href}">${about.cta.primary.label}</a>
          <a class="button button--ghost" href="${about.cta.secondary.href}">${about.cta.secondary.label}</a>
        </div>
      </article>
    `;
  }

  initAboutPage();
};

const renderDeliveryPage = () => {
  const steps = $("#delivery-steps");
  if (steps) {
    steps.innerHTML = store.deliveryPage.steps.map(renderDeliveryStep).join("");
  }

  const cards = $("#delivery-cards");
  if (cards) {
    cards.innerHTML = store.deliveryPage.cards.map(renderFactCard).join("");
  }

  const returns = $("#delivery-returns");
  if (returns) {
    returns.innerHTML = `
      <article class="request-panel request-panel--compact">
        <div class="section-head section-head--compact">
          <p class="eyebrow">Возвраты</p>
          <h2>${store.deliveryPage.returns.title}</h2>
          <p>${store.deliveryPage.returns.text}</p>
        </div>
        <a class="button button--small" href="${store.deliveryPage.returns.cta.href}">${store.deliveryPage.returns.cta.label}</a>
      </article>
    `;
  }
};

const renderCategoryPage = () => {
  const intro = $("#category-intro-cards");
  if (intro) {
    intro.innerHTML = `
      ${store.categories
        .map((item) =>
          item.href ? renderSectionCard(item) : renderSectionCard(item),
        )
        .join("")}
    `;
  }

  const shelf = $("#category-shelf");
  if (shelf) {
    shelf.innerHTML = renderEnterpriseProductCard();
  }
};

const renderJournalPage = () => {
  const [featuredPost, ...otherPosts] = store.journal.posts;
  const featured = $("#journal-featured");
  if (featured && featuredPost) {
    featured.innerHTML = renderJournalCard(featuredPost, true);
  }

  const list = $("#journal-list");
  if (!list) return;
  list.innerHTML = otherPosts.map((post) => renderJournalCard(post)).join("");
};

const renderArticlePage = () => {
  const slug = document.body.dataset.article;
  if (!slug) return;
  const post = store.journal.posts.find((item) => item.slug === slug);
  if (!post) return;

  const hero = $("#article-hero");
  if (hero) {
    hero.innerHTML = `
      <div class="breadcrumb">
        <a href="/">Главная</a>
        <span>/</span>
        <a href="/journal/">Журнал</a>
        <span>/</span>
        <span>${post.title}</span>
      </div>
      <div class="hero-copy">
        <p class="eyebrow">Материал</p>
        <h1>${post.title}</h1>
        <p>${post.lead}</p>
      </div>
    `;
  }

  const sections = $("#article-sections");
  if (sections) {
    sections.innerHTML = `
      <div class="article-layout">
        <article class="article-prose">
          ${post.sections
            .map(
              (section) => `
                <section class="panel">
                  <h2>${section.title}</h2>
                  <p>${section.text}</p>
                </section>
              `,
            )
            .join("")}
        </article>
        <aside class="article-aside">
          <article class="request-panel request-panel--compact">
            <div class="section-head section-head--compact">
              <p class="eyebrow">Товар</p>
              <h2>${product.shortName}</h2>
              <p>${product.lead}</p>
            </div>
            <div class="aside-actions">
              <a class="button button--small" href="${product.href}">Подробнее</a>
              <a class="text-link text-link--inline" href="/contacts/?source=journal">Уточнить условия</a>
            </div>
          </article>
        </aside>
      </div>
    `;
  }
};

const renderUtilityPage = () => {
  const slug = document.body.dataset.utility;
  const page = store.utilityPages[slug];
  if (!page) return;

  const hero = $("#utility-page");
  if (hero) {
    hero.innerHTML = `
      <div class="breadcrumb">
        <a href="/">Главная</a>
        <span>/</span>
        <span>${page.title}</span>
      </div>
      <article class="request-panel utility-page">
        <div class="section-head section-head--compact">
          <p class="eyebrow">Раздел</p>
          <h1>${page.title}</h1>
          <p>${page.text}</p>
        </div>
        <div class="hero-product__actions">
          <a class="button" href="${page.primary.href}">${page.primary.label}</a>
          <a class="button button--ghost" href="${page.secondary.href}">${page.secondary.label}</a>
        </div>
      </article>
    `;
  }
};

const bindMobileNav = () => {
  const toggle = $("[data-mobile-nav-toggle]");
  const nav = $("[data-mobile-nav]");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
};

const applyCatalogToolbarState = () => {
  const grid = $("#catalog-grid");
  const toolbar = $("#catalog-toolbar");
  if (!grid || !toolbar) return;

  const params = new URLSearchParams(window.location.search);
  let filter = params.get("filter") || "all";
  let sort = params.get("sort") || "featured";

  const rerender = () => {
    const params = new URLSearchParams(window.location.search);
    const query = escapeQuery(params.get("q") || "");
    const scope = params.get("scope") || "catalog";
    let items = buildCatalogItems().filter((entry) => {
      if (!query) return true;
      return matchesCatalogSearch(entry, query, scope);
    });
    if (filter === "active") items = items.filter((item) => item.status === "active");
    if (filter === "sections") items = items.filter((item) => item.type === "section");

    if (sort === "available") {
      items = items.sort((a, b) => (a.status === "active" ? -1 : 1) - (b.status === "active" ? -1 : 1));
    }
    if (sort === "coming") {
      items = items.sort((a, b) => (a.status === "coming" ? -1 : 1) - (b.status === "coming" ? -1 : 1));
    }

    grid.innerHTML = items.length
      ? items.map((item) => item.html).join("")
      : `
          <article class="empty-state">
            <strong>В этом фильтре пока нет карточек.</strong>
            <p>Попробуйте другой фильтр или вернитесь ко всему каталогу.</p>
            <a class="button button--small" href="/catalog/">В каталог</a>
          </article>
        `;

    $$("[data-filter]", toolbar).forEach((button) => {
      button.classList.toggle("is-active", button.dataset.filter === filter);
    });

    const count = $("[data-count]", toolbar);
    if (count) count.textContent = `Показано: ${formatCatalogCount(items.length)}`;

    const sortSelect = $("[data-sort]", toolbar);
    if (sortSelect) sortSelect.value = sort;
  };

  $$("[data-filter]", toolbar).forEach((button) => {
    button.addEventListener("click", () => {
      filter = button.dataset.filter;
      rerender();
    });
  });

  const sortSelect = $("[data-sort]", toolbar);
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      sort = sortSelect.value;
      rerender();
    });
  }

  rerender();
};

const bindSearchForms = () => {
  $$("[data-search-form]").forEach((form) => {
    const input = $("input[name='q']", form);
    const params = new URLSearchParams(window.location.search);
    if (input && !input.value) input.value = params.get("q") || "";

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const query = escapeQuery(data.get("q") || "");
      const scope = data.get("scope") || "catalog";
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (scope && scope !== "catalog") params.set("scope", scope);
      window.location.href = params.toString() ? `/catalog/?${params.toString()}` : "/catalog/";
    });
  });
};

const bindHeaderSearch = () => {
  const root = $("[data-header-search]");
  if (!root) return;

  const toggle = $("[data-search-toggle]", root);
  const form = $("[data-search-desktop]", root);
  const input = $("input[name='q']", form);
  if (!toggle || !form || !input) return;

  const prefersDesktop = () => window.matchMedia("(min-width: 1181px)").matches;

  const open = (focusInput = true) => {
    if (!prefersDesktop()) return;
    root.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    form.setAttribute("aria-hidden", "false");
    if (focusInput) {
      requestAnimationFrame(() => input.focus());
    }
  };

  const close = () => {
    root.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    form.setAttribute("aria-hidden", "true");
  };

  toggle.addEventListener("click", () => {
    if (root.classList.contains("is-open")) {
      close();
      return;
    }
    open();
  });

  document.addEventListener("click", (event) => {
    if (!root.classList.contains("is-open")) return;
    if (root.contains(event.target)) return;
    close();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!root.classList.contains("is-open")) return;
    close();
    toggle.focus();
  });

  window.addEventListener(
    "resize",
    () => {
      if (!prefersDesktop()) close();
    },
    { passive: true },
  );

  if (input.value.trim()) {
    open(false);
  } else {
    close();
  }
};

const bindFaq = () => {
  $$(".faq-item").forEach((item) => {
    const button = $("button", item);
    if (!button) return;
    button.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
      $$(".faq-item").forEach((entry) => {
        entry.classList.remove("is-open");
        const toggle = $("button", entry);
        if (!toggle) return;
        toggle.setAttribute("aria-expanded", "false");
        $("span:last-child", toggle).textContent = "+";
      });
      if (!isOpen) {
        item.classList.add("is-open");
        button.setAttribute("aria-expanded", "true");
        $("span:last-child", button).textContent = "−";
      }
    });
  });
};

const getLeadSessionId = () => {
  const key = "gb-lead-session-id";
  let value = window.sessionStorage.getItem(key);
  if (!value) {
    value = `gb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    window.sessionStorage.setItem(key, value);
  }
  return value;
};

const setFormFieldValue = (form, name, value) => {
  const field = form.elements.namedItem(name);
  if (!field) return;
  field.value = value;
};

const hydrateLeadMeta = (form) => {
  const params = new URLSearchParams(window.location.search);
  const now = new Date().toISOString();
  const meta = {
    session_id: getLeadSessionId(),
    landing_url: window.location.href,
    page_title: document.title,
    referrer: document.referrer || "",
    submitted_at: now,
    utm_source: params.get("utm_source") || "",
    utm_medium: params.get("utm_medium") || "",
    utm_campaign: params.get("utm_campaign") || "",
    utm_content: params.get("utm_content") || "",
    utm_term: params.get("utm_term") || "",
  };

  Object.entries(meta).forEach(([name, value]) => setFormFieldValue(form, name, value));
};

const buildLeadPayload = (form) => {
  hydrateLeadMeta(form);

  const data = new FormData(form);
  const hasQuantity = data.has("quantity_kg");
  const hasDistance = data.has("distance_km");
  const quantityKg = hasQuantity ? normalizePositiveNumber(data.get("quantity_kg")) : null;
  const distanceKm = hasDistance ? normalizePositiveNumber(data.get("distance_km")) : null;
  return {
    lead: {
      name: (data.get("name") || "").toString().trim(),
      phone: (data.get("phone") || "").toString().trim(),
      email: (data.get("email") || "").toString().trim(),
      telegramUsername: (data.get("telegram_username") || "").toString().trim(),
      preferredContact: (data.get("contact_preferred") || "").toString().trim(),
      topic: (data.get("topic") || "").toString().trim(),
      message: (data.get("message") || "").toString().trim(),
      consent: data.get("consent") === "on",
    },
    company: {
      name: (data.get("company_name") || "").toString().trim(),
      inn: (data.get("company_inn") || "").toString().trim(),
      purchaseFormat: (data.get("purchase_format") || "").toString().trim(),
    },
    context: {
      source: (data.get("source") || "").toString().trim(),
      page: (data.get("page") || "").toString().trim(),
      landingUrl: (data.get("landing_url") || "").toString().trim(),
      pageTitle: (data.get("page_title") || "").toString().trim(),
      referrer: (data.get("referrer") || "").toString().trim(),
      submittedAt: (data.get("submitted_at") || "").toString().trim(),
      sessionId: (data.get("session_id") || "").toString().trim(),
    },
    product: {
      id: (data.get("product_id") || "").toString().trim(),
      name: (data.get("product_name") || "").toString().trim(),
      category: (data.get("product_category") || "").toString().trim(),
      marketplaceInterest: (data.get("marketplace_interest") || "").toString().trim(),
    },
    order: {
      quantityKg,
      topic: (data.get("topic") || "").toString().trim(),
    },
    delivery: {
      address: (data.get("delivery_address") || "").toString().trim(),
      distanceKm,
      distanceBlocks1000: data.has("distance_blocks_1000")
        ? normalizePositiveNumber(data.get("distance_blocks_1000"))
        : null,
    },
    pricing: {
      basePricePerKg: normalizePositiveNumber(data.get("base_price_per_kg")),
      discountRate: normalizePositiveNumber(data.get("discount_rate")),
      discountTier: (data.get("discount_tier") || "").toString().trim(),
      distanceMarkupRate: normalizePositiveNumber(data.get("distance_markup_rate")),
      subtotalBase: normalizePositiveNumber(data.get("subtotal_base")),
      subtotalAfterDiscount: normalizePositiveNumber(data.get("subtotal_after_discount")),
      totalEstimate: normalizePositiveNumber(data.get("total_estimate")),
      estimatedPricePerKg: normalizePositiveNumber(data.get("estimated_price_per_kg")),
      currency: (data.get("currency") || "RUB").toString().trim(),
      isEstimate: (data.get("is_estimate") || "true").toString().trim() === "true",
    },
    utm: {
      source: (data.get("utm_source") || "").toString().trim(),
      medium: (data.get("utm_medium") || "").toString().trim(),
      campaign: (data.get("utm_campaign") || "").toString().trim(),
      content: (data.get("utm_content") || "").toString().trim(),
      term: (data.get("utm_term") || "").toString().trim(),
    },
    integration: {
      channelOrigin: (data.get("lead_channel_origin") || "").toString().trim(),
      targets: (data.get("integration_targets") || "")
        .toString()
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      crmStatusSeed: (data.get("crm_status_seed") || "").toString().trim(),
      crmPipelineSeed: (data.get("crm_pipeline_seed") || "").toString().trim(),
      payloadVersion: (data.get("payload_version") || "").toString().trim(),
    },
  };
};

const buildLeadMailto = (payload) => {
  const subject = encodeURIComponent(
    `Global Basket: ${payload.lead.topic || "site_request"} (${payload.context.source || "site"})`,
  );

  const lines = [
    "Новая заявка с сайта Global Basket",
    "",
    `Имя: ${payload.lead.name}`,
    `Телефон: ${payload.lead.phone}`,
    payload.lead.email ? `Email: ${payload.lead.email}` : "",
    payload.lead.telegramUsername ? `Telegram: ${payload.lead.telegramUsername}` : "",
    payload.lead.preferredContact ? `Удобный канал связи: ${payload.lead.preferredContact}` : "",
    payload.company?.name ? `Юрлицо / ИП: ${payload.company.name}` : "",
    payload.company?.inn ? `ИНН: ${payload.company.inn}` : "",
    payload.company?.purchaseFormat ? `Формат закупки: ${payload.company.purchaseFormat}` : "",
    `Тема: ${payload.lead.topic}`,
    payload.order?.quantityKg ? `Количество: ${payload.order.quantityKg} кг` : "",
    payload.delivery?.address ? `Адрес доставки: ${payload.delivery.address}` : "",
    Number.isFinite(payload.delivery?.distanceKm) ? `Расстояние от Москвы: ${payload.delivery.distanceKm} км` : "",
    payload.pricing?.basePricePerKg ? `Базовая цена: ${formatRub(payload.pricing.basePricePerKg)} / кг` : "",
    payload.pricing?.discountTier ? `Скидка: ${payload.pricing.discountTier}` : "",
    payload.pricing?.distanceMarkupRate
      ? `Надбавка за расстояние: +${Math.round(payload.pricing.distanceMarkupRate * 100)}%`
      : "",
    payload.pricing?.estimatedPricePerKg
      ? `Цена за кг после расчёта: ${formatRub(payload.pricing.estimatedPricePerKg)} / кг`
      : "",
    payload.pricing?.totalEstimate ? `Предварительная сумма: ${formatRub(payload.pricing.totalEstimate)}` : "",
    `Источник: ${payload.context.source}`,
    `Страница: ${payload.context.page}`,
    `URL: ${payload.context.landingUrl}`,
    `Продукт: ${payload.product.name}`,
    `Категория: ${payload.product.category}`,
    `Session ID: ${payload.context.sessionId}`,
    payload.utm.source ? `UTM Source: ${payload.utm.source}` : "",
    payload.utm.medium ? `UTM Medium: ${payload.utm.medium}` : "",
    payload.utm.campaign ? `UTM Campaign: ${payload.utm.campaign}` : "",
    payload.utm.content ? `UTM Content: ${payload.utm.content}` : "",
    payload.utm.term ? `UTM Term: ${payload.utm.term}` : "",
    "",
    "Комментарий:",
    payload.lead.message || "—",
  ].filter(Boolean);

  const body = encodeURIComponent(lines.join("\n"));

  return `${store.contact.emailHref}?subject=${subject}&body=${body}`;
};

const setRequestStatus = (form, message, tone = "") => {
  const status = form.querySelector("[data-request-status]");
  if (!status) return;

  status.textContent = message;
  status.classList.remove("is-success", "is-error", "is-loading");
  if (tone) status.classList.add(`is-${tone}`);
};

const updateQuoteSummary = (form) => {
  const quantityField = form.elements.namedItem("quantity_kg");
  const distanceField = form.elements.namedItem("distance_km");
  const quote = calculateContactQuote({
    quantityKg: quantityField?.value,
    distanceKm: distanceField?.value,
  });

  setFormFieldValue(form, "base_price_per_kg", String(quote.basePricePerKg));
  setFormFieldValue(form, "discount_rate", String(quote.discountRate));
  setFormFieldValue(form, "discount_tier", `${Math.round(quote.discountRate * 100)}%`);
  setFormFieldValue(form, "distance_blocks_1000", String(quote.distanceBlocks1000));
  setFormFieldValue(form, "distance_markup_rate", String(quote.distanceMarkupRate));
  setFormFieldValue(form, "subtotal_base", String(Math.round(quote.subtotalBase)));
  setFormFieldValue(form, "subtotal_after_discount", String(Math.round(quote.subtotalAfterDiscount)));
  setFormFieldValue(form, "total_estimate", String(Math.round(quote.totalEstimate)));
  setFormFieldValue(form, "estimated_price_per_kg", String(Math.round(quote.estimatedPricePerKg)));

  const bindings = {
    "[data-quote-base]": `${formatRub(quote.basePricePerKg)} / кг`,
    "[data-quote-weight]": `${quote.quantityKg || 0} кг`,
    "[data-quote-discount]": `${Math.round(quote.discountRate * 100)}%`,
    "[data-quote-distance-markup]": `+${Math.round(quote.distanceMarkupRate * 100)}%`,
    "[data-quote-price-per-kg]": `${formatRub(quote.estimatedPricePerKg || 0)} / кг`,
    "[data-quote-total]": formatRub(quote.totalEstimate || 0),
  };

  Object.entries(bindings).forEach(([selector, value]) => {
    const node = $(selector, form);
    if (node) node.textContent = value;
  });
};

const setFormSubmittingState = (form, isSubmitting) => {
  const submitButton = form.querySelector('button[type="submit"]');
  if (!submitButton) return;

  if (!submitButton.dataset.idleLabel) {
    submitButton.dataset.idleLabel = submitButton.textContent.trim();
  }

  submitButton.disabled = isSubmitting;
  submitButton.setAttribute("aria-busy", isSubmitting ? "true" : "false");
  submitButton.textContent = isSubmitting ? "Отправляем..." : submitButton.dataset.idleLabel;
};

const bindQuoteCalculators = () => {
  $$("[data-quote-form]").forEach((form) => {
    const refresh = () => updateQuoteSummary(form);
    form.addEventListener("input", refresh);
    form.addEventListener("change", refresh);
    refresh();
  });
};

const submitLeadPayload = async (payload) => {
  const response = await fetch("/api/contact-request", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    const message = data.message || "Не удалось отправить запрос. Попробуйте ещё раз или напишите нам в Telegram.";
    throw new Error(message);
  }

  return data;
};

const bindRequestForms = () => {
  $$("[data-request-form]").forEach((form) => {
    hydrateLeadMeta(form);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (form.dataset.submitting === "true") return;
      if (!form.reportValidity()) return;

      const payload = buildLeadPayload(form);
      form.dataset.submitting = "true";
      setFormSubmittingState(form, true);
      setRequestStatus(form, "Отправляем заявку команде Global Basket…", "loading");

      try {
        window.sessionStorage.setItem("gb-last-lead-payload", JSON.stringify(payload));
        const result = await submitLeadPayload(payload);
        setRequestStatus(
          form,
          `Заявка отправлена. Номер обращения: ${result.requestId}. Мы получили её в Telegram и свяжемся с вами в рабочее время.`,
          "success",
        );
      } catch (error) {
        const fallbackMailto = buildLeadMailto(payload);
        setRequestStatus(
          form,
          `${error.message} Если нужно срочно, напишите нам в Telegram или используйте резервный email-сценарий.`,
          "error",
        );
        form.dataset.mailtoFallback = fallbackMailto;
      } finally {
        form.dataset.submitting = "false";
        setFormSubmittingState(form, false);
      }
    });
  });
};

document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderFooter();

  switch (document.body.dataset.page) {
    case "home":
      renderHome();
      break;
    case "catalog":
      renderCatalog();
      break;
    case "product":
      renderProductPage();
      break;
    case "contacts":
      renderContactsPage();
      break;
    case "about":
      renderAboutPage();
      break;
    case "delivery":
      renderDeliveryPage();
      break;
    case "category":
      renderCategoryPage();
      break;
    case "journal":
      renderJournalPage();
      break;
    case "article":
      renderArticlePage();
      break;
    case "utility":
      renderUtilityPage();
      break;
    default:
      break;
  }

  bindMobileNav();
  bindHeaderSearch();
  bindSearchForms();
  bindFaq();
  bindQuoteCalculators();
  bindRequestForms();
  applyCatalogToolbarState();
});
