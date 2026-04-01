const store = window.GlobalBasketData;
const productMap = Object.fromEntries(store.products.map((product) => [product.id, product]));

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const escapeQuery = (value = "") => value.trim().toLowerCase();

const headerIcon = (type) => {
  if (type === "heart") {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 20.5l-1.2-1.1C6 15 3 12.2 3 8.8 3 6.1 5.1 4 7.8 4c1.5 0 3 .7 4 1.9C12.9 4.7 14.4 4 15.9 4 18.6 4 20.7 6.1 20.7 8.8c0 3.4-3 6.2-7.8 10.6L12 20.5z"/>
      </svg>
    `;
  }

  if (type === "user") {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-3.3 0-6 1.9-6 4.3V20h12v-1.7C18 15.9 15.3 14 12 14z"/>
      </svg>
    `;
  }

  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7V5.8A2.8 2.8 0 0 1 9.8 3h4.4A2.8 2.8 0 0 1 17 5.8V7h2a1 1 0 0 1 1 1v9.5A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5V8a1 1 0 0 1 1-1zm2 0h6V5.8c0-.4-.4-.8-.8-.8H9.8c-.4 0-.8.4-.8.8z"/>
    </svg>
  `;
};

const renderHeader = () => {
  const mount = $("[data-site-header]");
  if (!mount) return;

  const currentPath = window.location.pathname;
  const utilityLinks = store.utilityLinks
    .map((item) => `<a href="${item.href}">${item.label}</a>`)
    .join("");
  const headerLinks = store.headerLinks
    .map(
      (item) => `
        <a class="${currentPath === item.href ? "is-current" : ""}" href="${item.href}">${item.label}</a>
      `,
    )
    .join("");
  const categories = store.categories
    .map(
      (item) => `
        <a class="mega-card" href="${item.href}">
          <strong>${item.name}</strong>
          <span class="mega-card__status">${item.status}</span>
          <p>${item.description}</p>
        </a>
      `,
    )
    .join("");

  mount.innerHTML = `
    <div class="page-noise" aria-hidden="true"></div>
    <div class="utility-bar">
      <div class="shell utility-bar__inner">
        <div class="utility-links">${utilityLinks}</div>
        <div class="utility-meta">
          <span>${store.contact.email}</span>
          <span>${store.contact.phone}</span>
        </div>
      </div>
    </div>
    <header class="site-header">
      <div class="shell site-header__inner">
        <button class="catalog-toggle" type="button" data-catalog-toggle>
          <span class="catalog-toggle__icon" aria-hidden="true"></span>
          <span>Каталог</span>
        </button>

        <a class="brand-mark" href="/">
          <img src="/assets/logo.jpg" alt="Логотип Global Basket" />
          <div>
            <strong>Global Basket</strong>
            <span>Интернет-магазин премиальных орехов</span>
          </div>
        </a>

        <form class="search-form" data-search-form action="/catalog/" method="get">
          <span class="search-form__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M10.5 4a6.5 6.5 0 1 0 4 11.6l4.2 4.2 1.4-1.4-4.2-4.2A6.5 6.5 0 0 0 10.5 4zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9z"/>
            </svg>
          </span>
          <input
            type="search"
            name="q"
            placeholder="Поиск по каталогу"
            aria-label="Поиск по каталогу"
          />
        </form>

        <div class="header-actions">
          <a class="header-action" href="/catalog/" aria-label="Избранное">
            ${headerIcon("heart")}
          </a>
          <a class="header-action" href="/contacts/" aria-label="Аккаунт">
            ${headerIcon("user")}
          </a>
          <a class="header-action" href="/catalog/macadamia/" aria-label="Корзина">
            ${headerIcon("bag")}
          </a>
        </div>

        <button class="mobile-menu-toggle" type="button" data-mobile-nav-toggle>
          Меню
        </button>
      </div>

      <div class="shell header-subnav">
        <nav class="main-nav" aria-label="Быстрые разделы">
          ${headerLinks}
        </nav>
        <div class="subnav-meta">
          <span>${store.contact.hours}</span>
          <a href="/catalog/macadamia/">SKU запуска</a>
        </div>
      </div>

      <div class="mega-panel" data-mega-panel>
        <div class="shell mega-panel__inner">
          <div class="mega-panel__intro">
            <p class="eyebrow">Структура каталога</p>
            <h3>Магазинная архитектура с категориями, полками и сервисными маршрутами.</h3>
            <p>
              Стартуем с макадамии, но сразу показываем, как каталог будет расти
              без ощущения пустой витрины.
            </p>
          </div>
          <div class="mega-grid">${categories}</div>
        </div>
      </div>

      <div class="mobile-nav" data-mobile-nav>
        <div class="shell mobile-nav__inner">
          ${headerLinks}
          <a href="/catalog/">Каталог</a>
        </div>
      </div>
    </header>
  `;
};

const renderFooter = () => {
  const mount = $("[data-site-footer]");
  if (!mount) return;

  const columns = store.footer.columns
    .map(
      (column) => `
        <div class="footer-column">
          <strong>${column.title}</strong>
          ${column.links.map((link) => `<a href="${link.href}">${link.label}</a>`).join("")}
        </div>
      `,
    )
    .join("");

  mount.innerHTML = `
    <footer class="site-footer">
      <div class="shell site-footer__inner">
        <div class="footer-brand">
          <strong>Global Basket</strong>
          <p>
            Многостраничный food-магазин с акцентом на премиальную подачу,
            категорийную структуру и отдельные товарные маршруты.
          </p>
          <span>${store.contact.phone}</span>
          <span>${store.contact.email}</span>
        </div>
        <div class="footer-columns">${columns}</div>
      </div>
    </footer>
  `;
};

const renderProductCard = (item, options = {}) => {
  const product = productMap[item.productId];
  const image = options.imageKey
    ? product[options.imageKey]
    : item.imageKey
      ? product[item.imageKey]
      : product.image;

  return `
    <article class="product-tile">
      <a class="product-tile__media" href="${product.href}">
        <img src="${image}" alt="${product.shortName}" />
        <span class="product-tile__badge">${item.label || product.badge}</span>
      </a>
      <div class="product-tile__body">
        <div class="product-tile__meta">
          <span>${product.category}</span>
          <span>${product.availability}</span>
        </div>
        <h3><a href="${product.href}">${product.shortName}</a></h3>
        <p>${product.excerpt}</p>
        <ul class="product-tile__stats">
          <li><strong>${product.weight}</strong><span>вес</span></li>
          <li><strong>${product.origin}</strong><span>страна</span></li>
          <li><strong>По запросу</strong><span>цена</span></li>
        </ul>
        <div class="product-tile__actions">
          <a class="button button--small" href="${product.href}">Подробнее</a>
          <a class="button button--ghost button--small" href="/delivery/">Опт и сервис</a>
        </div>
      </div>
    </article>
  `;
};

const renderTeaserCard = (item) => `
  <article class="teaser-card">
    <span class="teaser-card__status">${item.status || "Раздел"}</span>
    <h3><a href="${item.href}">${item.title}</a></h3>
    <p>${item.description}</p>
    <a class="text-link" href="${item.href}">Открыть раздел</a>
  </article>
`;

const renderCollectionCard = (item) => `
  <article class="collection-card">
    <span class="collection-card__eyebrow">Коллекция</span>
    <h3><a href="${item.href}">${item.title}</a></h3>
    <p>${item.description}</p>
    <a class="text-link" href="${item.href}">Смотреть</a>
  </article>
`;

const renderShelf = (selector, shelf) => {
  const mount = $(selector);
  if (!mount || !shelf) return;

  const items = shelf.items
    .map((item) => {
      if (item.type === "product") return renderProductCard(item);
      if (item.type === "collection") return renderCollectionCard(item);
      return renderTeaserCard(item);
    })
    .join("");

  mount.innerHTML = `
    <div class="section-head">
      <p class="eyebrow">${shelf.eyebrow}</p>
      <h2>${shelf.title}</h2>
      <p>${shelf.description}</p>
    </div>
    <div class="shelf-grid">${items}</div>
  `;
};

const renderCategoryCards = (selector) => {
  const mount = $(selector);
  if (!mount) return;

  mount.innerHTML = store.categories
    .map(
      (category) => `
        <a class="category-card" href="${category.href}">
          <span class="category-card__status">${category.status}</span>
          <strong>${category.name}</strong>
          <p>${category.description}</p>
        </a>
      `,
    )
    .join("");
};

const renderJournalList = (selector, linkLabel = "Читать раздел") => {
  const mount = $(selector);
  if (!mount) return;

  mount.innerHTML = store.journal.posts
    .map(
      (post) => `
        <article class="article-card">
          <span class="article-card__eyebrow">Материал</span>
          <h3><a href="${post.href}">${post.title}</a></h3>
          <p>${post.excerpt}</p>
          <a class="text-link" href="${post.href}">${linkLabel}</a>
        </article>
      `,
    )
    .join("");
};

const renderHome = () => {
  const intro = $("#home-service-note");
  if (intro) {
    intro.innerHTML = `
      <section class="support-strip">
        <div class="support-strip__intro">
          <p class="eyebrow">${store.home.intro.title}</p>
          <p class="support-strip__lead">${store.home.intro.text}</p>
        </div>
        <a class="text-link support-strip__link" href="/catalog/">Открыть каталог</a>
      </section>
    `;
  }

  const banners = $("#home-banners");
  if (banners) {
    const [primaryBanner, ...sideBanners] = store.home.banners;
    banners.innerHTML = `
      <div class="home-stage">
        <article class="hero-banner hero-banner--primary">
          <div class="hero-banner__copy">
            <p class="eyebrow">Global Basket</p>
            <h1>${primaryBanner.title}</h1>
            <p>${primaryBanner.text}</p>
            <a class="button button--small" href="${primaryBanner.href}">${primaryBanner.cta}</a>
          </div>
          <div class="hero-banner__media">
            <img src="${primaryBanner.image}" alt="${primaryBanner.title}" />
          </div>
        </article>
        <div class="home-side-stack">
          ${sideBanners
            .map(
              (banner) => `
                <article class="home-side-card">
                  <div class="home-side-card__copy">
                    <p class="eyebrow">Global Basket</p>
                    <h3>${banner.title}</h3>
                    <p>${banner.text}</p>
                    <a class="button button--small" href="${banner.href}">${banner.cta}</a>
                  </div>
                  <div class="home-side-card__media">
                    <img src="${banner.image}" alt="${banner.title}" />
                  </div>
                </article>
              `,
            )
            .join("")}
        </div>
      </div>
    `;
  }

  renderCategoryCards("#home-categories");
  renderShelf("#home-featured-shelf", store.shelves.featured);
  renderShelf("#home-new-shelf", store.shelves.novelty);
  renderJournalList("#home-journal-cards");
};

const renderCatalog = () => {
  const filters = $("#catalog-filters");
  if (filters) {
    filters.innerHTML = `
      <div class="sidebar-card">
        <strong>Категории</strong>
        ${store.categories
          .map((category) => `<a href="${category.href}">${category.name} <span>${category.status}</span></a>`)
          .join("")}
      </div>
      <div class="sidebar-card">
        <strong>Сортировка</strong>
        <a href="/catalog/">Хиты каталога</a>
        <a href="/catalog/">Новинки витрины</a>
        <a href="/delivery/">Для опта и retail</a>
      </div>
      <div class="sidebar-card">
        <strong>Формат подачи</strong>
        <a href="/catalog/macadamia/">Вакуумная упаковка</a>
        <a href="/about/">Премиальная айдентика</a>
        <a href="/journal/">Editorial-подача</a>
      </div>
    `;
  }

  const query = escapeQuery(new URLSearchParams(window.location.search).get("q") || "");
  const candidates = [
    {
      title: "Очищенная макадамия",
      keywords: "макадамия macadamia premium орех",
      html: renderProductCard({ type: "product", productId: "macadamia", label: "Активная SKU" }),
    },
    {
      title: "Для retail",
      keywords: "retail витрина магазин",
      html: renderCollectionCard({
        title: "Для retail",
        description: "Макадамия как якорная позиция для маркетплейс-витрины и offline-полки.",
        href: "/catalog/macadamia/",
      }),
    },
    {
      title: "Грецкий орех",
      keywords: "грецкий орех скоро",
      html: renderTeaserCard({
        title: "Грецкий орех",
        description: "Следующий очевидный кандидат для расширения ореховой категории.",
        href: "/catalog/",
        status: "Скоро",
      }),
    },
    {
      title: "Сухофрукты",
      keywords: "сухофрукты финики манго скоро",
      html: renderTeaserCard({
        title: "Сухофрукты",
        description: "Потенциальный смежный раздел для роста среднего чека и подарочных подборок.",
        href: "/catalog/",
        status: "Скоро",
      }),
    },
    {
      title: "Наборы",
      keywords: "наборы gifting подарки roadmap",
      html: renderTeaserCard({
        title: "Наборы",
        description: "Подарочные решения и editorial-сеты под праздники и корпоративный сегмент.",
        href: "/catalog/",
        status: "Roadmap",
      }),
    },
  ];

  const filtered = query
    ? candidates.filter((item) => escapeQuery(`${item.title} ${item.keywords}`).includes(query))
    : candidates;

  const grid = $("#catalog-grid");
  if (grid) {
    grid.innerHTML = filtered.length
      ? filtered.map((item) => item.html).join("")
      : `
          <article class="empty-state">
            <strong>По запросу “${query}” пока нет карточек.</strong>
            <p>Попробуйте “макадамия”, “орехи”, “retail” или вернитесь к полному каталогу.</p>
            <a class="button button--small" href="/catalog/">Сбросить поиск</a>
          </article>
        `;
  }

  const collections = $("#catalog-collections");
  if (collections) {
    collections.innerHTML = `
      <div class="section-head">
        <p class="eyebrow">Большой каталог даже при одной SKU</p>
        <h2>Вместо пустоты показываем направления роста и сценарии покупки.</h2>
      </div>
      <div class="article-grid">
        <article class="panel">
          <img src="/assets/basket.png" alt="Категорийный баннер Global Basket" />
          <strong>Премиальная подача категории</strong>
          <p>Категорийная страница живет не только сеткой товаров, но и баннерами, подсекциями и story-блоками.</p>
        </article>
        <article class="panel">
          <img src="/assets/benefits-card.png" alt="Карточка пользы макадамии" />
          <strong>Editorial-слой</strong>
          <p>Польза, упаковка, происхождение и lifestyle делают каталог объемным без выдуманного ассортимента.</p>
        </article>
        <article class="panel">
          <img src="/assets/nuts-pile.png" alt="Фактура макадамии" />
          <strong>Фактура продукта</strong>
          <p>Крупные продуктовые фактуры работают как полноценные merchandising-блоки между полками.</p>
        </article>
      </div>
    `;
  }
};

const renderProductPage = () => {
  const product = productMap.macadamia;

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
      <span class="product-page__badge">${product.badge}</span>
      <h1>${product.shortName}</h1>
      <p class="product-page__lead">${product.excerpt}</p>
      <div class="spec-grid">
        ${product.specs
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
          <strong>${product.price}</strong>
        </div>
        <div class="purchase-panel__actions">
          <a class="button" href="/contacts/">Добавить в запрос</a>
          <a class="button button--ghost" href="/delivery/">Оптовые условия</a>
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

  renderShelf("#product-related", store.shelves.related);
};

const renderCategoryPage = () => {
  const cards = $("#category-intro-cards");
  if (cards) {
    cards.innerHTML = store.categoryPage.introCards
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

  renderShelf("#category-shelf", store.shelves.featured);
  renderShelf("#category-related", store.shelves.related);
};

const renderJournalPage = () => {
  renderJournalList("#journal-list", "Открыть материал");
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
            <span>0${index + 1}</span>
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
};

const bindMegaMenu = () => {
  const toggle = $("[data-catalog-toggle]");
  const panel = $("[data-mega-panel]");
  if (!toggle || !panel) return;

  toggle.addEventListener("click", () => {
    panel.classList.toggle("is-open");
  });

  document.addEventListener("click", (event) => {
    if (!panel.contains(event.target) && !toggle.contains(event.target)) {
      panel.classList.remove("is-open");
    }
  });
};

const bindMobileNav = () => {
  const toggle = $("[data-mobile-nav-toggle]");
  const nav = $("[data-mobile-nav]");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    nav.classList.toggle("is-open");
  });
};

const bindSearchForm = () => {
  const form = $("[data-search-form]");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    const query = escapeQuery(new FormData(form).get("q") || "");
    event.preventDefault();
    window.location.href = query ? `/catalog/?q=${encodeURIComponent(query)}` : "/catalog/";
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
        if (innerButton) {
          innerButton.setAttribute("aria-expanded", "false");
          $("span:last-child", innerButton).textContent = "+";
        }
      });

      if (!isOpen) {
        item.classList.add("is-open");
        button.setAttribute("aria-expanded", "true");
        $("span:last-child", button).textContent = "−";
      }
    });
  });
};

const bindDemoForms = () => {
  $$("form[data-demo-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const note = $("[data-form-note]", form) || form.nextElementSibling;
      if (note) {
        note.textContent =
          "Интерфейс формы готов. На следующем этапе можно подключить CRM, email или мессенджер без смены структуры сайта.";
      }
      form.reset();
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
    case "journal":
      renderJournalPage();
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
    default:
      break;
  }

  bindMegaMenu();
  bindMobileNav();
  bindSearchForm();
  bindFaq();
  bindDemoForms();
});
