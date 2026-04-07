const store = window.GlobalBasketData;
const product = store.product;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const escapeQuery = (value = "") => value.trim().toLowerCase();

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

  const scopeOptions = store.searchScopes
    .map((item) => `<option value="${item.value}">${item.label}</option>`)
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

        <form class="search-form" data-search-form action="/catalog/" method="get">
          <label class="search-scope">
            <span class="sr-only">Раздел поиска</span>
            <select name="scope" aria-label="Раздел поиска">
              ${scopeOptions}
            </select>
          </label>
          <span class="search-form__icon" aria-hidden="true">${renderIcon("search")}</span>
          <input type="search" name="q" placeholder="Поиск по каталогу" aria-label="Поиск по каталогу" />
        </form>

        <div class="header-actions">
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
            <label class="search-scope">
              <span class="sr-only">Раздел поиска</span>
              <select name="scope" aria-label="Раздел поиска">
                ${scopeOptions}
              </select>
            </label>
            <span class="search-form__icon" aria-hidden="true">${renderIcon("search")}</span>
            <input type="search" name="q" placeholder="Поиск по каталогу" aria-label="Поиск по каталогу" />
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

const renderHome = () => {
  const hero = $("#home-hero");
  if (hero) {
    hero.innerHTML = `
      <article class="hero-stage">
        <div class="hero-stage__copy">
          ${renderBadge(product.badge, product.badgeTone)}
          <h1>${store.home.hero.title}</h1>
          <p>${store.home.hero.text}</p>
          <ul class="hero-stage__meta">
            ${store.home.hero.meta.map((item) => `<li>${item}</li>`).join("")}
          </ul>
          <div class="hero-stage__actions">
            <a class="button" href="${store.home.hero.primaryCta.href}"${externalAttrs(store.home.hero.primaryCta.href)}>${store.home.hero.primaryCta.label}</a>
            <a class="text-link text-link--inline" href="${store.home.hero.secondaryCta.href}"${externalAttrs(store.home.hero.secondaryCta.href)}>${store.home.hero.secondaryCta.label}</a>
          </div>
        </div>
        <div class="hero-stage__media">
          <article class="media-stage media-stage--hero">
            <img src="${product.images.hero}" alt="${product.fullName}" />
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
        <article class="media-stage media-stage--lifestyle">
          <img src="${product.images.lifestyle}" alt="Очищенная макадамия Global Basket в домашней подаче" loading="lazy" decoding="async" />
        </article>
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
      keywords: `${product.shortName} ${product.subtitle} ${product.origin}`,
      html: renderEnterpriseProductCard(true),
      status: "active",
    },
    ...upcoming.map((item) => ({
      type: "section",
      title: item.name,
      keywords: `${item.name} ${item.description}`,
      html: renderSectionCard(item),
      status: "coming",
    })),
  ];
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
      if (scope === "nuts") return entry.type === "product" && escapeQuery(entry.keywords).includes(query);
      if (scope === "sections") return entry.type === "section" && escapeQuery(entry.keywords).includes(query);
      return escapeQuery(entry.keywords).includes(query);
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
      <article class="request-panel">
        <div class="section-head section-head--compact">
          <p class="eyebrow">Telegram-бот</p>
          <h2>${store.contactsPage.telegramPanel.title}</h2>
          <p>${store.contactsPage.telegramPanel.text}</p>
        </div>
        <div class="hero-product__actions">
          <a class="button" href="${store.contact.telegramHref}"${externalAttrs(store.contact.telegramHref)}>${store.contactsPage.telegramPanel.primary}</a>
          <a class="button button--ghost" href="${store.contact.telegramComplaintHref}"${externalAttrs(store.contact.telegramComplaintHref)}>${store.contactsPage.telegramPanel.secondary}</a>
        </div>
        <p class="request-form__note">Основной канал связи: <a href="${store.contact.telegramHref}"${externalAttrs(store.contact.telegramHref)}>${store.contact.telegram}</a>. Резервный контакт: <a href="${store.contact.phoneHref}">${store.contact.phone}</a> / <a href="${store.contact.emailHref}">${store.contact.email}</a></p>
      </article>
    `;
  }
};

const renderAboutPage = () => {
  const mount = $("#about-pillars");
  if (!mount) return;
  mount.innerHTML = store.aboutPage.pillars
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
    .join("");

  const title = $("#about-story-title");
  if (title) title.textContent = store.aboutPage.storyTitle;

  const text = $("#about-story-text");
  if (text) text.textContent = store.aboutPage.storyText;

  const list = $("#about-story-list");
  if (list) {
    list.innerHTML = store.aboutPage.checklist.map((item) => `<li>${item}</li>`).join("");
  }
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
      if (scope === "nuts") return entry.type === "product" && escapeQuery(entry.keywords).includes(query);
      if (scope === "sections") return entry.type === "section" && escapeQuery(entry.keywords).includes(query);
      return escapeQuery(entry.keywords).includes(query);
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
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const query = escapeQuery(data.get("q") || "");
      const scope = data.get("scope") || "catalog";
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (scope) params.set("scope", scope);
      window.location.href = params.toString() ? `/catalog/?${params.toString()}` : "/catalog/";
    });
  });
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

const bindRequestForms = () => {
  $$("[data-request-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const subject = encodeURIComponent(
        `Global Basket: ${data.get("topic") || "request"} (${data.get("source") || "site"})`,
      );
      const body = encodeURIComponent(
        [
          `Имя: ${data.get("name") || ""}`,
          `Контакт: ${data.get("contact") || ""}`,
          `Тема: ${data.get("topic") || ""}`,
          `Источник: ${data.get("source") || ""}`,
          "",
          `${data.get("message") || ""}`,
        ].join("\n"),
      );
      window.location.href = `${store.contact.emailHref}?subject=${subject}&body=${body}`;
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
  bindSearchForms();
  bindFaq();
  bindRequestForms();
  applyCatalogToolbarState();
});
