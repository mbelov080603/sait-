const store = window.GlobalBasketData;
const product = store.product;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const escapeQuery = (value = "") => value.trim().toLowerCase();

const badgeToneMap = {
  active: "active",
  coming: "coming",
  editorial: "editorial",
  service: "service",
};

const renderBadge = (label, tone = "editorial") =>
  `<span class="meta-badge meta-badge--${badgeToneMap[tone] || "editorial"}">${label}</span>`;

const isCurrentNav = (item, currentPath) =>
  (item.match || [item.href]).some((prefix) => currentPath.startsWith(prefix));

const renderHeader = () => {
  const mount = $("[data-site-header]");
  if (!mount) return;

  const currentPath = window.location.pathname;
  const links = store.headerLinks
    .map(
      (item) =>
        `<a class="${isCurrentNav(item, currentPath) ? "is-current" : ""}" href="${item.href}">${item.label}</a>`,
    )
    .join("");

  mount.innerHTML = `
    <div class="page-noise" aria-hidden="true"></div>
    <div class="utility-bar">
      <div class="shell utility-bar__inner">
        <div class="utility-bar__text">
          ${store.serviceStrip.items.map((item) => `<span>${item}</span>`).join("")}
        </div>
        <div class="utility-meta">
          <a href="${store.contact.phoneHref}">${store.contact.phone}</a>
        </div>
      </div>
    </div>
    <header class="site-header">
      <div class="shell site-header__inner">
        <a class="brand-mark" href="/" aria-label="На главную Global Basket">
          <img src="/assets/logo.jpg" alt="Логотип Global Basket" />
          <div>
            <strong>Global Basket</strong>
            <span>Премиальные орехи</span>
          </div>
        </a>

        <nav class="main-nav" aria-label="Основная навигация">
          ${links}
        </nav>

        <form class="search-form" data-search-form action="/catalog/" method="get">
          <span class="search-form__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M10.5 4a6.5 6.5 0 1 0 4 11.6l4.2 4.2 1.4-1.4-4.2-4.2A6.5 6.5 0 0 0 10.5 4zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9z"></path>
            </svg>
          </span>
          <input type="search" name="q" placeholder="Поиск по каталогу" aria-label="Поиск по каталогу" />
        </form>

        <a class="button button--small header-contact" href="${store.serviceStrip.cta.href}">
          ${store.serviceStrip.cta.label}
        </a>

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
            <span class="search-form__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M10.5 4a6.5 6.5 0 1 0 4 11.6l4.2 4.2 1.4-1.4-4.2-4.2A6.5 6.5 0 0 0 10.5 4zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9z"></path>
              </svg>
            </span>
            <input type="search" name="q" placeholder="Поиск по каталогу" aria-label="Поиск по каталогу" />
          </form>
          <div class="mobile-nav__links">${links}</div>
          <div class="mobile-nav__actions">
            <a class="button button--small" href="/contacts/">Связаться</a>
            <a class="button button--ghost button--small" href="${store.contact.phoneHref}">
              ${store.contact.phone}
            </a>
          </div>
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
          <p>
            Магазин премиальных орехов с тёплой натуральной подачей и понятной структурой от главной страницы до карточки товара.
          </p>
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
                    .map((link) => `<a href="${link.href}">${link.label}</a>`)
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

const renderCategoryCard = (category) => {
  if (category.href) {
    return `
      <a class="category-card" href="${category.href}">
        ${renderBadge(category.statusLabel, category.status)}
        <div class="category-card__body">
          <strong>${category.name}</strong>
          <p>${category.description}</p>
        </div>
        <span class="text-link">Смотреть раздел</span>
      </a>
    `;
  }

  return `
    <article class="category-card category-card--muted">
      ${renderBadge(category.statusLabel, category.status)}
      <div class="category-card__body">
        <strong>${category.name}</strong>
        <p>${category.description}</p>
      </div>
      <span class="card-note">Раздел появится позже.</span>
    </article>
  `;
};

const renderSectionCard = (item) => {
  const tone = item.tone || item.status || "editorial";
  const badge = item.badge || item.statusLabel;

  if (item.href) {
    return `
      <article class="section-card">
        ${renderBadge(badge, tone)}
        <h3><a href="${item.href}">${item.title}</a></h3>
        <p>${item.description}</p>
        <a class="text-link" href="${item.href}">Смотреть раздел</a>
      </article>
    `;
  }

  return `
    <article class="section-card section-card--muted">
      ${renderBadge(badge, tone)}
      <h3>${item.title}</h3>
      <p>${item.description}</p>
      <span class="card-note">Скоро добавим этот раздел.</span>
    </article>
  `;
};

const renderArticleCard = (post) => `
  <article class="article-card">
    ${renderBadge("Материал", "editorial")}
    <h3><a href="${post.href}">${post.title}</a></h3>
    <p>${post.excerpt}</p>
    <a class="text-link" href="${post.href}">Читать</a>
  </article>
`;

const renderProductCard = () => `
  <article class="product-tile">
    <a class="product-tile__media" href="${product.href}">
      <img src="${product.image}" alt="${product.shortName}" />
      ${renderBadge("В наличии", "active")}
    </a>
    <div class="product-tile__body">
      <div class="product-tile__meta">
        <span>${product.category}</span>
        <span>${product.availability}</span>
      </div>
      <h3><a href="${product.href}">${product.shortName}</a></h3>
      <p>${product.excerpt}</p>
      <ul class="product-tile__stats">
        <li><strong>${product.weight}</strong><span>Фасовка</span></li>
        <li><strong>${product.origin}</strong><span>Происхождение</span></li>
        <li><strong>${product.priceShort}</strong><span>${product.priceNote}</span></li>
      </ul>
      <p class="product-tile__note">${product.price}</p>
      <div class="product-tile__actions">
        <a class="button button--small" href="${product.href}">Подробнее</a>
        <a class="button button--ghost button--small" href="/contacts/">Уточнить условия</a>
      </div>
    </div>
  </article>
`;

const renderHome = () => {
  const hero = $("#home-hero");
  if (hero) {
    hero.innerHTML = `
      <article class="home-hero">
        <div class="home-hero__copy">
          <div class="home-hero__brand">
            <img src="/assets/logo.jpg" alt="Логотип Global Basket" />
            <div>
              <strong>${store.home.hero.eyebrow}</strong>
              <span>Премиальные орехи</span>
            </div>
          </div>
          ${renderBadge("В наличии", "active")}
          <h1>${store.home.hero.title}</h1>
          <p class="home-hero__lead">${store.home.hero.text}</p>
          <div class="home-hero__actions">
            <a class="button" href="${store.home.hero.primaryCta.href}">${store.home.hero.primaryCta.label}</a>
            <a class="button button--ghost" href="${store.home.hero.secondaryCta.href}">
              ${store.home.hero.secondaryCta.label}
            </a>
          </div>
          <dl class="fact-list">
            ${store.home.hero.facts
              .map(
                (item) => `
                  <div>
                    <dt>${item.label}</dt>
                    <dd>${item.value}</dd>
                  </div>
                `,
              )
              .join("")}
          </dl>
        </div>
        <div class="home-hero__media">
          <img src="${product.heroImage}" alt="${product.shortName}" />
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
      <div class="section-head section-head--store">
        <div>
          <p class="eyebrow">${store.home.featured.eyebrow}</p>
          <h2>${store.home.featured.title}</h2>
          <p>${store.home.featured.text}</p>
        </div>
        <a class="text-link section-head__link" href="/catalog/">В каталог</a>
      </div>
      <article class="panel featured-product">
        <div class="featured-product__media">
          <img src="${product.image}" alt="${product.shortName}" />
        </div>
        <div class="featured-product__body">
          ${renderBadge("В наличии", "active")}
          <h3>${product.shortName}</h3>
          <p>${product.description}</p>
          <dl class="featured-product__facts">
            ${product.facts
              .map(
                (item) => `
                  <div>
                    <dt>${item.label}</dt>
                    <dd>${item.value}</dd>
                  </div>
                `,
              )
              .join("")}
          </dl>
          <p class="featured-product__note">${store.home.featured.note}</p>
          <div class="featured-product__actions">
            <a class="button button--small" href="${product.href}">Подробнее</a>
            <a class="button button--ghost button--small" href="/contacts/">Уточнить условия</a>
          </div>
        </div>
      </article>
    `;
  }

  const benefits = $("#home-benefits");
  if (benefits) {
    benefits.innerHTML = `
      <div class="section-head section-head--store">
        <div>
          <p class="eyebrow">Почему это работает</p>
          <h2>Подача бренда и коммерческая ясность работают вместе, а не конкурируют друг с другом.</h2>
          <p>На главной остаются только те блоки, которые помогают понять товар и перейти к нужному действию.</p>
        </div>
        <a class="text-link section-head__link" href="/about/">Смотреть раздел</a>
      </div>
      <div class="brand-story">
        <article class="panel panel--image">
          <img src="${product.benefitsCard}" alt="Карточка с преимуществами макадамии" />
        </article>
        <div class="info-grid">
          ${store.home.advantages
            .map(
              (item) => `
                <article class="info-card">
                  <strong>${item.title}</strong>
                  <p>${item.text}</p>
                </article>
              `,
            )
            .join("")}
        </div>
      </div>
    `;
  }

  const future = $("#home-future");
  if (future) {
    future.innerHTML = store.home.future.map(renderSectionCard).join("");
  }

  const journal = $("#home-journal-cards");
  if (journal) {
    journal.innerHTML = store.journal.posts.map(renderArticleCard).join("");
  }
};

const renderSidebarGroup = (group) => `
  <article class="sidebar-card">
    <strong>${group.title}</strong>
    ${group.items
      .map((item) =>
        item.href
          ? `<a href="${item.href}"><span>${item.label}</span></a>`
          : `<div class="sidebar-card__static"><span>${item.label}</span><span>${item.note}</span></div>`,
      )
      .join("")}
  </article>
`;

const renderCatalog = () => {
  const filters = $("#catalog-filters");
  if (filters) {
    filters.innerHTML = store.catalogPage.sidebarGroups.map(renderSidebarGroup).join("");
  }

  const query = escapeQuery(new URLSearchParams(window.location.search).get("q") || "");
  const catalogItems = [
    {
      title: product.shortName,
      keywords: `${product.shortName} ${product.category} ${product.origin} ${product.weight}`,
      html: renderProductCard(),
    },
    ...store.home.future.map((item) => ({
      title: item.title,
      keywords: `${item.title} скоро`,
      html: renderSectionCard(item),
    })),
  ];

  const filtered = query
    ? catalogItems.filter((item) => escapeQuery(`${item.title} ${item.keywords}`).includes(query))
    : catalogItems;

  const grid = $("#catalog-grid");
  if (grid) {
    grid.innerHTML = filtered.length
      ? filtered.map((item) => item.html).join("")
      : `
          <article class="empty-state">
            <strong>По вашему запросу пока ничего не найдено.</strong>
            <p>Попробуйте поискать «макадамия», «орехи» или вернитесь ко всему каталогу.</p>
            <a class="button button--small" href="/catalog/">В каталог</a>
          </article>
        `;
  }

  const collections = $("#catalog-collections");
  if (collections) {
    collections.innerHTML = `
      <div class="section-head section-head--store">
        <div>
          <p class="eyebrow">Покупателям</p>
          <h2>В каталоге собраны товары, а условия заказа и история бренда вынесены в отдельные разделы.</h2>
        </div>
      </div>
      <div class="article-grid">
        ${store.catalogPage.support.map(renderSectionCard).join("")}
      </div>
    `;
  }
};

const renderProductPage = () => {
  const gallery = $("#product-gallery");
  if (gallery) {
    gallery.innerHTML = `
      <div class="product-gallery__main">
        <img src="${product.image}" alt="${product.shortName}" />
      </div>
      <div class="product-gallery__thumbs">
        ${product.gallery
          .slice(1, 5)
          .map(
            (item) => `
              <figure>
                <img src="${item.src}" alt="${item.alt}" />
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
      ${renderBadge("В наличии", "active")}
      <h1>${product.shortName}</h1>
      <p class="product-page__lead">${product.excerpt}</p>
      <div class="spec-grid">
        ${product.facts
          .map(
            (item) => `
              <div class="spec-card">
                <strong>${item.label}</strong>
                <span>${item.value}</span>
              </div>
            `,
          )
          .join("")}
      </div>
      <div class="purchase-panel">
        <div>
          <span class="purchase-panel__label">Стоимость</span>
          <strong>${product.priceShort}</strong>
          <p>${product.priceNote}</p>
        </div>
        <div class="purchase-panel__actions">
          <a class="button" href="/contacts/">Уточнить условия</a>
          <a class="button button--ghost" href="/catalog/">В каталог</a>
        </div>
      </div>
      <ul class="checklist">
        ${product.benefits.map((item) => `<li>${item}</li>`).join("")}
      </ul>
    `;
  }

  const nutrients = $("#product-nutrients");
  if (nutrients) {
    nutrients.innerHTML = product.nutrients
      .map(
        (item) => `
          <article class="nutrient-card">
            <span>${item.code}</span>
            <strong>${item.name}</strong>
            <p>${item.text}</p>
          </article>
        `,
      )
      .join("");
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

  const related = $("#product-related");
  if (related) {
    related.innerHTML = `
      <div class="section-head section-head--store">
        <div>
          <p class="eyebrow">Полезные разделы</p>
          <h2>Если нужно узнать больше о бренде или об условиях заказа, начните с этих страниц.</h2>
        </div>
      </div>
      <div class="article-grid">
        ${store.catalogPage.support.map(renderSectionCard).join("")}
      </div>
    `;
  }
};

const renderCategoryPage = () => {
  const intro = $("#category-intro-cards");
  if (intro) {
    intro.innerHTML = store.categoryPage.introCards
      .map(
        (item) => `
          <article class="info-card">
            <strong>${item.title}</strong>
            <p>${item.text}</p>
          </article>
        `,
      )
      .join("");
  }

  const shelf = $("#category-shelf");
  if (shelf) {
    shelf.innerHTML = `
      <div class="section-head section-head--store">
        <div>
          <p class="eyebrow">Текущий ассортимент</p>
          <h2>В категории уже доступен основной товар и честно обозначены следующие направления.</h2>
        </div>
        <a class="text-link section-head__link" href="/catalog/">В каталог</a>
      </div>
      <div class="shelf-grid shelf-grid--catalog">
        ${renderProductCard()}
        ${store.home.future.slice(0, 2).map(renderSectionCard).join("")}
      </div>
    `;
  }

  const related = $("#category-related");
  if (related) {
    related.innerHTML = `
      <div class="section-head section-head--store">
        <div>
          <p class="eyebrow">Дальше по сайту</p>
          <h2>Смежные разделы помогают быстро перейти к условиям заказа и к истории бренда.</h2>
        </div>
      </div>
      <div class="article-grid">
        ${store.categoryPage.support.map(renderSectionCard).join("")}
      </div>
    `;
  }
};

const renderAboutPage = () => {
  const mount = $("#about-pillars");
  if (!mount) return;

  mount.innerHTML = store.aboutPage.pillars
    .map(
      (item) => `
        <article class="info-card">
          <strong>${item.title}</strong>
          <p>${item.text}</p>
        </article>
      `,
    )
    .join("");
};

const renderDeliveryPage = () => {
  const cards = $("#delivery-cards");
  if (cards) {
    cards.innerHTML = store.deliveryPage.cards
      .map(
        (item) => `
          <article class="info-card">
            <strong>${item.title}</strong>
            <p>${item.text}</p>
          </article>
        `,
      )
      .join("");
  }

  const steps = $("#delivery-steps");
  if (steps) {
    steps.innerHTML = store.deliveryPage.steps
      .map(
        (item, index) => `
          <article class="step-card">
            <span>${index + 1}</span>
            <p>${item}</p>
          </article>
        `,
      )
      .join("");
  }
};

const renderContactsPage = () => {
  const cards = $("#contacts-cards");
  if (cards) {
    cards.innerHTML = store.contactsPage.cards
      .map(
        (item) => `
          <article class="info-card">
            <strong>${item.title}</strong>
            <p>${item.text}</p>
          </article>
        `,
      )
      .join("");
  }

  const panel = $("#contact-panel");
  if (!panel) return;

  panel.innerHTML = `
    <article class="panel contact-panel">
      <div class="section-head section-head--compact">
        <p class="eyebrow">Связаться</p>
        <h2>Выберите удобный способ связи, и мы ответим в рабочее время.</h2>
      </div>
      <div class="contact-panel__list">
        ${store.contactsPage.panel
          .map(
            (item) => `
              <div>
                <strong>${item.title}</strong>
                ${
                  item.href
                    ? `<a href="${item.href}">${item.value}</a>`
                    : `<span>${item.value}</span>`
                }
              </div>
            `,
          )
          .join("")}
      </div>
      <div class="contact-panel__actions">
        <a class="button" href="${store.contact.phoneHref}">Позвонить</a>
        <a class="button button--ghost" href="${store.contact.emailHref}">Написать</a>
      </div>
    </article>
  `;
};

const renderJournalPage = () => {
  const mount = $("#journal-list");
  if (!mount) return;

  mount.innerHTML = store.journal.posts.map(renderArticleCard).join("");
};

const renderArticlePage = () => {
  const slug = document.body.dataset.article;
  if (!slug) return;

  const post = store.journal.posts.find((entry) => entry.slug === slug);
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
        <article class="panel article-prose">
          ${post.sections
            .map(
              (section) => `
                <section>
                  <h2>${section.title}</h2>
                  <p>${section.text}</p>
                </section>
              `,
            )
            .join("")}
        </article>
        <aside class="article-aside">
          <article class="panel">
            ${renderBadge("Покупателям", "service")}
            <h3>Что делать дальше</h3>
            <p>Если хотите узнать больше о товаре или об условиях заказа, начните с карточки макадамии или страницы контактов.</p>
            <div class="aside-actions">
              <a class="button button--small" href="${product.href}">Подробнее</a>
              <a class="button button--ghost button--small" href="/contacts/">Связаться</a>
            </div>
          </article>
          <article class="panel">
            ${renderBadge("Журнал", "editorial")}
            <h3>Другие материалы</h3>
            <div class="article-mini-list">
              ${store.journal.posts
                .filter((entry) => entry.slug !== slug)
                .map((entry) => `<a href="${entry.href}">${entry.title}</a>`)
                .join("")}
            </div>
          </article>
        </aside>
      </div>
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

  $$("a", nav).forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
};

const bindSearchForms = () => {
  $$("[data-search-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      const query = escapeQuery(new FormData(form).get("q") || "");
      event.preventDefault();
      window.location.href = query ? `/catalog/?q=${encodeURIComponent(query)}` : "/catalog/";
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
        const innerButton = $("button", entry);
        if (!innerButton) return;
        innerButton.setAttribute("aria-expanded", "false");
        $("span:last-child", innerButton).textContent = "+";
      });

      if (!isOpen) {
        item.classList.add("is-open");
        button.setAttribute("aria-expanded", "true");
        $("span:last-child", button).textContent = "−";
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
    case "category":
      renderCategoryPage();
      break;
    case "about":
      renderAboutPage();
      break;
    case "delivery":
      renderDeliveryPage();
      break;
    case "contacts":
      renderContactsPage();
      break;
    case "journal":
      renderJournalPage();
      break;
    case "article":
      renderArticlePage();
      break;
    default:
      break;
  }

  bindMobileNav();
  bindSearchForms();
  bindFaq();
});
