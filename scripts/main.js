const store = window.GlobalBasketData;
const products =
  Array.isArray(store.products) && store.products.length
    ? store.products
    : [store.product].filter(Boolean);
const categories = Array.isArray(store.categories) ? store.categories : [];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const escapeQuery = (value = "") => value.trim().toLowerCase();
const queryTokens = (value = "") => escapeQuery(value).split(/\s+/).filter(Boolean);
const trimHeadingPeriod = (value = "") => String(value).trim().replace(/\.$/, "");
const escapeAttribute = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const isProductActive = (item) =>
  Boolean(item) &&
  (item.status === "active" || item.availability === "В наличии" || item.badgeTone === "active");

const isCategoryActive = (item) =>
  Boolean(item) && (item.status === "active" || item.statusLabel === "В наличии");

const featuredProduct = products.find(isProductActive) || products[0] || store.product;
const activeProducts = products.filter(isProductActive);
const activeCategories = categories.filter(isCategoryActive);

const productIndex = new Map();
products.forEach((item) => {
  if (!item) return;
  [item.id, item.slug, item.href].filter(Boolean).forEach((key) => {
    productIndex.set(String(key), item);
  });
});

const normalizeProductKey = (value = "") => String(value).trim().replace(/^\/+|\/+$/g, "");
const normalizeLookupValue = (value = "") => String(value).trim().replace(/^\/+|\/+$/g, "");

const findProduct = (value = "") => {
  const normalized = normalizeProductKey(value);
  if (!normalized) return null;
  return (
    productIndex.get(normalized) ||
    productIndex.get(`/${normalized}/`) ||
    productIndex.get(`/sait-/catalog/${normalized}/`) ||
    null
  );
};

const resolveProductFromLocation = () => {
  const bodyProduct = document.body.dataset.product;
  if (bodyProduct) {
    const bodyMatch = findProduct(bodyProduct);
    if (bodyMatch) return bodyMatch;
  }

  if (document.body.dataset.page === "product") {
    const segments = window.location.pathname.split("/").filter(Boolean);
    const slug = segments[segments[0] === "catalog" ? 1 : segments.length - 1];
    const pathMatch = findProduct(slug);
    if (pathMatch) return pathMatch;
  }

  return featuredProduct;
};

const product = resolveProductFromLocation();
const categoryIndex = new Map();
categories.forEach((item) => {
  if (!item) return;
  [item.id, item.slug, item.href].filter(Boolean).forEach((key) => {
    categoryIndex.set(String(key), item);
  });
});

const findCategory = (value = "") => {
  const normalized = normalizeLookupValue(value);
  if (!normalized) return null;
  return (
    categoryIndex.get(normalized) ||
    categoryIndex.get(`/${normalized}/`) ||
    categoryIndex.get(`/sait-/categories/${normalized}/`) ||
    null
  );
};

const resolveCategoryFromLocation = () => {
  const bodyCategory = document.body.dataset.category;
  if (bodyCategory) {
    const bodyMatch = findCategory(bodyCategory);
    if (bodyMatch) return bodyMatch;
  }

  if (document.body.dataset.page === "category") {
    const segments = window.location.pathname.split("/").filter(Boolean);
    const slug = segments[segments[0] === "categories" ? 1 : segments.length - 1];
    const pathMatch = findCategory(slug);
    if (pathMatch) return pathMatch;
  }

  return categories[0] || null;
};

const currentCategory = resolveCategoryFromLocation();

const STORAGE_KEYS = {
  accountProfile: "gb-account-profile",
  cartItems: "gb-cart-items",
  favoriteItems: "gb-favorite-items",
  lastAccountPayload: "gb-last-account-payload",
};

const DEFAULT_ACCOUNT_NAME = "Покупатель Global Basket";

const readJsonStorage = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const writeJsonStorage = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors to keep the UI usable in private mode
  }
};

const removeStorageItem = (key) => {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore storage errors to keep the UI usable in private mode
  }
};

const createLocalId = (prefix = "gb") =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const toIsoNow = () => new Date().toISOString();

const cleanStoredList = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

const getCartItems = () => cleanStoredList(readJsonStorage(STORAGE_KEYS.cartItems, []));
const getFavoriteItems = () => cleanStoredList(readJsonStorage(STORAGE_KEYS.favoriteItems, []));
const getAccountProfile = () => readJsonStorage(STORAGE_KEYS.accountProfile, null);

const setCartItems = (items) => {
  writeJsonStorage(STORAGE_KEYS.cartItems, cleanStoredList(items));
};

const setFavoriteItems = (items) => {
  writeJsonStorage(STORAGE_KEYS.favoriteItems, cleanStoredList(items));
};

const setAccountProfile = (profile) => {
  if (!profile) {
    removeStorageItem(STORAGE_KEYS.accountProfile);
    return;
  }
  writeJsonStorage(STORAGE_KEYS.accountProfile, profile);
};

const getStoredVariantLabel = (variant = null) =>
  typeof variant === "string" ? variant : variant?.label || variant?.value || "";

const buildStoredProductSnapshot = (productItem, variant = null, quantity = 1, source = "site") => {
  const variantLabel = getStoredVariantLabel(variant);
  return {
    entryId: `${productItem.id || productItem.slug}::${variantLabel || "default"}`,
    productId: productItem.id || productItem.slug || "",
    slug: productItem.slug || "",
    href: productItem.href || "",
    shortName: productItem.shortName || productItem.h1 || productItem.fullName || "",
    fullName: productItem.fullName || productItem.shortName || "",
    subtitle: buildVariantSubtitle(productItem, variant) || productItem.subtitle || "",
    categoryName: productItem.category || "",
    categoryId: productItem.categorySlug || "",
    image:
      productItem.images?.packshot ||
      productItem.images?.main ||
      productItem.images?.detail ||
      "",
    price: productItem.price || "",
    variantLabel,
    quantity,
    source,
    savedAt: toIsoNow(),
  };
};

const resolveStoredProduct = (entry) => {
  if (!entry) return null;
  return (
    findProduct(entry.productId || "") ||
    findProduct(entry.slug || "") ||
    findProduct(entry.href || "") ||
    null
  );
};

const buildInterestOptions = () =>
  activeCategories.map((item) => ({
    id: item.id,
    label: item.title || item.name,
  }));

const derivePreferenceSummary = (profile = getAccountProfile()) => {
  const cartItems = getCartItems();
  const favoriteItems = getFavoriteItems();
  const categoryMap = new Map();
  const explicitInterests = Array.isArray(profile?.interestIds) ? profile.interestIds : [];

  [...cartItems, ...favoriteItems].forEach((entry) => {
    if (!entry?.categoryId) return;
    const label = entry.categoryName || findCategory(entry.categoryId)?.title || entry.categoryId;
    categoryMap.set(entry.categoryId, label);
  });

  explicitInterests.forEach((id) => {
    if (categoryMap.has(id)) return;
    const category = findCategory(id);
    categoryMap.set(id, category?.title || category?.name || id);
  });

  return {
    cartCount: cartItems.reduce((sum, entry) => sum + Math.max(1, Number(entry.quantity) || 1), 0),
    cartLineCount: cartItems.length,
    favoriteCount: favoriteItems.length,
    categoryIds: Array.from(categoryMap.keys()),
    categoryNames: Array.from(categoryMap.values()),
    preferredContact: profile?.preferredContact || "",
  };
};

const syncAccountProfileWithStorage = () => {
  const profile = getAccountProfile();
  if (!profile) return null;

  const preferenceSummary = derivePreferenceSummary(profile);
  const nextProfile = {
    ...profile,
    cartSnapshot: getCartItems(),
    favoriteSnapshot: getFavoriteItems(),
    preferenceCategoryIds: preferenceSummary.categoryIds,
    preferenceCategoryNames: preferenceSummary.categoryNames,
    updatedAt: toIsoNow(),
  };

  setAccountProfile(nextProfile);
  return nextProfile;
};

const getHeaderState = () => {
  const profile = getAccountProfile();
  return {
    favorites: getFavoriteItems().length,
    cart: getCartItems().reduce((sum, entry) => sum + Math.max(1, Number(entry.quantity) || 1), 0),
    accountRegistered: Boolean(profile),
  };
};

const isFavoriteSaved = (productItem) =>
  getFavoriteItems().some((entry) => entry.productId === (productItem.id || productItem.slug));

const getCartQuantityForProduct = (productItem, variant = null) => {
  const variantLabel = getStoredVariantLabel(variant);
  return getCartItems()
    .filter(
      (entry) =>
        entry.productId === (productItem.id || productItem.slug) &&
        (entry.variantLabel || "") === variantLabel,
    )
    .reduce((sum, entry) => sum + Math.max(1, Number(entry.quantity) || 1), 0);
};

const toggleFavoriteProduct = (productItem, variant = null, source = "site") => {
  const current = getFavoriteItems();
  const productId = productItem.id || productItem.slug;
  const exists = current.some((entry) => entry.productId === productId);

  const next = exists
    ? current.filter((entry) => entry.productId !== productId)
    : [...current, buildStoredProductSnapshot(productItem, variant, 1, source)];

  setFavoriteItems(next);
  syncAccountProfileWithStorage();
  return !exists;
};

const addProductToCart = (productItem, variant = null, source = "site", quantity = 1) => {
  const current = getCartItems();
  const next = [...current];
  const snapshot = buildStoredProductSnapshot(productItem, variant, quantity, source);
  const index = next.findIndex((entry) => entry.entryId === snapshot.entryId);

  if (index >= 0) {
    const existing = next[index];
    next[index] = {
      ...existing,
      quantity: Math.max(1, Number(existing.quantity) || 1) + Math.max(1, Number(quantity) || 1),
      savedAt: toIsoNow(),
    };
  } else {
    next.push(snapshot);
  }

  setCartItems(next);
  syncAccountProfileWithStorage();
};

const updateCartItemQuantity = (entryId, nextQuantity) => {
  const normalizedQuantity = Math.max(0, Number(nextQuantity) || 0);
  const current = getCartItems();
  const next =
    normalizedQuantity > 0
      ? current.map((entry) =>
          entry.entryId === entryId
            ? { ...entry, quantity: normalizedQuantity, savedAt: toIsoNow() }
            : entry,
        )
      : current.filter((entry) => entry.entryId !== entryId);

  setCartItems(next);
  syncAccountProfileWithStorage();
};

const removeCartItem = (entryId) => {
  setCartItems(getCartItems().filter((entry) => entry.entryId !== entryId));
  syncAccountProfileWithStorage();
};

const removeFavoriteItem = (productId) => {
  setFavoriteItems(getFavoriteItems().filter((entry) => entry.productId !== productId));
  syncAccountProfileWithStorage();
};

const buildContactHref = (productItem, source = "catalog-card", variant = null) => {
  const params = new URLSearchParams();
  params.set("source", source);
  if (productItem?.slug || productItem?.id) {
    params.set("product", productItem.slug || productItem.id);
  }
  const variantLabel =
    typeof variant === "string"
      ? variant
      : variant?.label || variant?.value || "";
  if (variantLabel) {
    params.set("variant", variantLabel);
  }
  return `/sait-/contacts/?${params.toString()}`;
};

const buildCategoryContactHref = (categoryItem, source = "category-page") => {
  const params = new URLSearchParams();
  params.set("source", source);
  if (categoryItem?.id) params.set("category", categoryItem.id);
  return `/sait-/contacts/?${params.toString()}`;
};

const normalizeVariantText = (value = "") => String(value).trim().toLowerCase();

const resolveProductVariant = (productItem, preferredVariant = "") => {
  const variants = Array.isArray(productItem?.variants) ? productItem.variants : [];
  if (!variants.length) return null;

  const queryValue = normalizeVariantText(preferredVariant);
  if (queryValue) {
    const matchedVariant = variants.find((item) =>
      [item.label, item.value, item.ctaParam]
        .filter(Boolean)
        .some((candidate) => normalizeVariantText(candidate) === queryValue),
    );
    if (matchedVariant) return matchedVariant;
  }

  return variants.find((item) => item.isDefault) || variants[0] || null;
};

const buildVariantSubtitle = (productItem, variant) => {
  if (!variant) return productItem.subtitle;

  const base = String(productItem.baseSubtitle || productItem.subtitle || "").trim();
  const defaultLabel = String(productItem.defaultVariantLabel || "").trim();
  const label = String(variant.label || "").trim();

  if (!base) return label;
  if (!label) return base;
  if (defaultLabel && base.includes(defaultLabel)) return base.replace(defaultLabel, label);
  if (base.includes(label)) return base;
  return `${base} / ${label}`;
};

const updatePillsForVariant = (productItem, variant) => {
  const pills = Array.isArray(productItem.pills) ? [...productItem.pills] : [];
  if (!variant || !pills.length) return pills;

  const defaultLabel = String(productItem.defaultVariantLabel || "").trim();
  const label = String(variant.label || "").trim();
  if (!label) return pills;

  return pills.map((item, index) => {
    if (defaultLabel && item === defaultLabel) return label;
    if (!defaultLabel && index === 0 && productItem.variantType) return label;
    return item;
  });
};

const updateFactCardsForVariant = (productItem, variant) => {
  const cards = Array.isArray(productItem.factCards) ? productItem.factCards : [];
  if (!variant || !cards.length) return cards;

  return cards.map((item, index) =>
    index === 0 &&
    item.title &&
    productItem.variantType &&
    normalizeVariantText(item.title) === normalizeVariantText(productItem.variantType)
      ? { ...item, text: variant.label }
      : item,
  );
};

const renderVariantPicker = (productItem, selectedVariant) => {
  const variants = Array.isArray(productItem?.variants) ? productItem.variants : [];
  if (variants.length < 2) return "";

  return `
    <div class="variant-picker" data-variant-picker>
      <div class="variant-picker__head">
        <span class="variant-picker__label">${productItem.variantUiText || productItem.variantType || "Доступные фасовки"}</span>
        <span class="variant-picker__current">${selectedVariant?.label || productItem.defaultVariantLabel || ""}</span>
      </div>
      <div class="variant-picker__chips" role="listbox" aria-label="${productItem.variantUiText || productItem.variantType || "Варианты"}">
        ${variants
          .map(
            (variant) => `
              <button
                type="button"
                class="variant-chip ${selectedVariant?.label === variant.label ? "is-active" : ""} ${variant.status === "request" ? "is-request" : ""}"
                data-variant-choice
                data-variant-label="${escapeAttribute(variant.label)}"
                aria-pressed="${selectedVariant?.label === variant.label ? "true" : "false"}"
              >
                <span>${variant.label}</span>
                ${variant.status === "request" ? '<small>под запрос</small>' : ""}
              </button>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
};

const createRequestActionCards = (productItem, selectedVariant) => {
  const descriptor = buildVariantSubtitle(productItem, selectedVariant);
  return [
    {
      name: "Уточнить наличие",
      badge: "Следующий шаг",
      tone: "service",
      bullets: [
        descriptor,
        "Подскажем по текущему наличию и подтверждённой фасовке.",
        "Менеджер уточнит объём, формат поставки и следующий шаг по запросу.",
      ],
      cta: "Уточнить наличие",
      href: buildContactHref(productItem, "pdp-availability", selectedVariant),
    },
    {
      name: "Оставить запрос",
      badge: "Запрос",
      tone: "service",
      bullets: [
        `Добавьте ${productItem.shortName.toLowerCase()} в заявку с нужной фасовкой.`,
        "Подтвердим условия по выбранному варианту и формату поставки.",
        "Telegram остаётся резервным каналом, основная логика остаётся в форме запроса.",
      ],
      cta: "Оставить запрос",
      href: buildContactHref(productItem, "pdp-request", selectedVariant),
    },
    {
      name: "Telegram",
      badge: "Резервный канал",
      tone: "editorial",
      bullets: [
        "Если вопрос срочный, можно написать напрямую в Telegram-бот Global Basket.",
        "Этот сценарий остаётся запасным и не заменяет запрос через форму.",
      ],
      cta: "Написать в Telegram",
      href: store.contact.telegramHref,
    },
  ];
};

const productCtaCards = (productItem, selectedVariant = null) => {
  if (productItem.actionMode === "marketplace-default") {
    const defaultVariant = resolveProductVariant(productItem);
    if (selectedVariant?.label && defaultVariant?.label !== selectedVariant.label) {
      return createRequestActionCards(productItem, selectedVariant);
    }
    return store.marketplaces;
  }

  return createRequestActionCards(productItem, selectedVariant || resolveProductVariant(productItem));
};

const productQuickLinks = (productItem, selectedVariant = null) =>
  productCtaCards(productItem, selectedVariant).map((item) => ({
    label: item.name,
    href: item.href,
  }));

const ensureMetaTag = (name) => {
  let tag = document.head.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.append(tag);
  }
  return tag;
};

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

const renderHeaderIconLink = (item) => {
  const state = getHeaderState();
  const counterType =
    item.icon === "heart" ? "favorites" : item.icon === "bag" ? "cart" : item.icon === "user" ? "account" : "";
  const count = counterType === "favorites" ? state.favorites : counterType === "cart" ? state.cart : 0;
  const showAccountDot = counterType === "account" && state.accountRegistered;

  return `
    <a
      class="icon-button icon-button--stateful ${count > 0 || showAccountDot ? "has-indicator" : ""}"
      href="${item.href}"
      aria-label="${item.label}"
      title="${item.label}"
      data-header-counter="${counterType}"
    >
      ${renderIcon(item.icon)}
      <span class="icon-button__badge" ${count > 0 ? "" : "hidden"}>${count}</span>
      <span class="icon-button__dot" ${showAccountDot && !count ? "" : "hidden"}></span>
    </a>
  `;
};

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

  const iconLinks = store.headerIcons.map(renderHeaderIconLink).join("");

  mount.innerHTML = `
    <div class="page-noise" aria-hidden="true"></div>
    <header class="site-header">
      <div class="shell header-main">
        <a class="brand-mark" href="/sait-/" aria-label="На главную Global Basket">
          <img src="/sait-/assets/logo.jpg" alt="Логотип Global Basket" />
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
              action="/sait-/catalog/"
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
          <form class="search-form search-form--mobile" data-search-form action="/sait-/catalog/" method="get">
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
        </div>
      </div>
    </header>
  `;
};

const updateHeaderState = () => {
  const state = getHeaderState();

  $$("[data-header-counter]").forEach((link) => {
    const type = link.dataset.headerCounter || "";
    const badge = $(".icon-button__badge", link);
    const dot = $(".icon-button__dot", link);
    const count = type === "favorites" ? state.favorites : type === "cart" ? state.cart : 0;
    const showAccountDot = type === "account" && state.accountRegistered;

    link.classList.toggle("has-indicator", count > 0 || showAccountDot);

    if (badge) {
      badge.hidden = count <= 0;
      badge.textContent = count > 99 ? "99+" : String(count);
    }

    if (dot) {
      dot.hidden = !(showAccountDot && count <= 0);
    }
  });
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
      ${renderBadge(item.badge || "Где купить", item.tone || "service")}
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
    ${
      item.image
        ? `<a class="category-card__media" href="${item.href || "#"}"><img src="${item.image}" alt="${item.name}" loading="lazy" decoding="async" /></a>`
        : ""
    }
    <h3>${item.href ? `<a href="${item.href}">${item.name}</a>` : item.name}</h3>
    <p>${item.description}</p>
    ${
      item.href
        ? `<a class="text-link text-link--inline category-card__cta" href="${item.href}">Смотреть раздел</a>`
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
  <article class="section-card ${item.status === "coming" ? "section-card--muted" : ""} ${item.className || ""}">
    ${
      item.image
        ? `<a class="section-card__media" href="${item.href || "#"}"><img src="${item.image}" alt="${item.title || item.name}" loading="lazy" decoding="async" /></a>`
        : ""
    }
    ${renderBadge(item.badge || item.statusLabel, item.tone || item.status || "service")}
    <h3>${item.href ? `<a href="${item.href}">${item.title || item.name}</a>` : item.title || item.name}</h3>
    <p>${item.description}</p>
    ${
      item.href
        ? `<a class="text-link section-card__cta" href="${item.href}">Смотреть раздел</a>`
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
      <a class="text-link text-link--inline journal-card__cta" href="${post.href}">Читать</a>
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

const renderEnterpriseProductCard = (productItem = product) => {
  const defaultVariant = resolveProductVariant(productItem);
  const variantLabel = getStoredVariantLabel(defaultVariant);
  return `
    <article class="product-card">
      <div class="product-card__top">
        ${renderBadge(productItem.badge, productItem.badgeTone)}
      </div>
      <div class="product-card__content">
        <a class="product-card__media product-card__media--${productItem.imageKind || "illustration"}" href="${productItem.href}">
          <img src="${productItem.images.packshot}" alt="${productItem.fullName}" loading="lazy" decoding="async" />
        </a>
        <div class="product-card__body">
          <h3><a href="${productItem.href}">${productItem.shortName}</a></h3>
          <p class="product-card__subtitle">${productItem.subtitle}</p>
          <p class="product-card__lead">${productItem.catalogDescription || productItem.lead}</p>
          <div class="product-card__actions">
            <a class="button button--small" href="${productItem.href}">Подробнее</a>
            <button
              class="button button--ghost button--small"
              type="button"
              data-cart-add
              data-product-id="${escapeAttribute(productItem.id || productItem.slug || "")}"
              data-product-variant="${escapeAttribute(variantLabel)}"
              data-action-source="catalog-card"
            >
              В корзину
            </button>
          </div>
          <div class="product-card__utility">
            <button
              class="text-link text-link--inline"
              type="button"
              data-favorite-toggle
              data-product-id="${escapeAttribute(productItem.id || productItem.slug || "")}"
              data-product-variant="${escapeAttribute(variantLabel)}"
              data-action-source="catalog-card"
              aria-pressed="false"
            >
              В избранное
            </button>
            <a class="text-link text-link--inline" href="${buildContactHref(productItem, "catalog-card")}">Уточнить условия</a>
          </div>
        </div>
      </div>
    </article>
  `;
};

const renderProductSpecs = (items = []) => `
  <dl class="spec-list">
    ${items
      .map(
        (item) => `
          <div class="spec-list__row">
            <dt>${item.label}</dt>
            <dd>${item.value}</dd>
          </div>
        `,
      )
      .join("")}
  </dl>
`;

const buildDocumentTitle = (value = "") => {
  const normalized = String(value || "").trim();
  if (!normalized) return "Global Basket";
  return /global basket/i.test(normalized) ? normalized : `Global Basket | ${normalized}`;
};

const resolveFormProductContext = (context = {}) => {
  const hasExplicitProduct =
    Object.prototype.hasOwnProperty.call(context, "productId") ||
    Object.prototype.hasOwnProperty.call(context, "productName") ||
    Object.prototype.hasOwnProperty.call(context, "productCategory") ||
    Object.prototype.hasOwnProperty.call(context, "productVariant");

  if (hasExplicitProduct) {
    return {
      productId: context.productId || "",
      productName: context.productName || "",
      productCategory: context.productCategory || "",
      productVariant: context.productVariant || "",
    };
  }

  if (context.page === "product" || document.body.dataset.page === "product") {
    return {
      productId: product?.id || "",
      productName: product?.fullName || "",
      productCategory: product?.category || "",
      productVariant: "",
    };
  }

  return {
    productId: "",
    productName: "",
    productCategory: context.productCategory || "",
    productVariant: "",
  };
};

const resolveInitialFormMeta = (context = {}) => ({
  sessionId: context.sessionId || "",
  landingUrl: context.landingUrl || window.location.href || "",
  pageTitle: context.pageTitle || document.title || "",
  referrer: context.referrer || "",
});

const renderLeadRequestForm = (config, context = {}) => {
  const productContext = resolveFormProductContext(context);
  const initialMeta = resolveInitialFormMeta(context);
  const hiddenFields = {
    source: context.source || "home-hero",
    page: context.page || document.body.dataset.page || "home",
    product_id: productContext.productId,
    product_name: productContext.productName,
    product_category: productContext.productCategory,
    product_variant: productContext.productVariant,
    lead_channel_origin: "site",
    marketplace_interest: context.marketplaceInterest || "",
    crm_status_seed: "new",
    crm_pipeline_seed: "site_request",
    integration_targets: "bitrix24,1c",
    payload_version: "v1",
    session_id: initialMeta.sessionId,
    landing_url: initialMeta.landingUrl,
    page_title: initialMeta.pageTitle,
    referrer: initialMeta.referrer,
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
        ${config.eyebrow ? `<p class="eyebrow">${config.eyebrow}</p>` : ""}
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
        <div class="request-form__grid request-form__grid--lead-primary">
          <label>
            <span>Ваше имя</span>
            <input type="text" name="name" autocomplete="name" placeholder="Как к вам обращаться" required />
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
        <div class="request-form__grid request-form__grid--lead-secondary">
          <div class="request-form__contact-slot" data-contact-slot data-active-contact="phone">
            <label class="request-form__contact-panel is-active" data-contact-field="phone">
              <span>Телефон</span>
              <input type="tel" name="phone" autocomplete="tel" inputmode="tel" placeholder="+7 (___) ___-__-__" required />
            </label>
            <label class="request-form__contact-panel" data-contact-field="email" aria-hidden="true">
              <span>Email</span>
              <input type="email" name="email" autocomplete="email" placeholder="name@example.com" disabled />
            </label>
            <label class="request-form__contact-panel" data-contact-field="telegram" aria-hidden="true">
              <span>Telegram</span>
              <input type="text" name="telegram_username" autocomplete="off" placeholder="@username" disabled />
            </label>
          </div>
          <label>
            <span>Что вас интересует</span>
            <select name="topic" required>
              ${config.topics
                .map((item) => `<option value="${item.value}">${item.label}</option>`)
                .join("")}
            </select>
          </label>
        </div>
        <p class="request-form__hint" data-contact-helper>
          Укажите основной канал связи. Остальное можно уточнить одним сообщением.
        </p>
        <label class="request-form__field request-form__field--full">
          <span>Комментарий</span>
          <textarea name="message" placeholder="Например: хочу узнать цену, формат поставки или условия покупки."></textarea>
        </label>
        <label class="request-form__consent">
          <input type="checkbox" name="consent" required />
          <span>${config.consent}</span>
        </label>
        <div class="request-form__actions">
          <button class="button" type="submit">${config.submitLabel}</button>
          <a class="text-link text-link--inline request-form__action-link" href="${config.secondaryCta.href}"${externalAttrs(config.secondaryCta.href)}>${config.secondaryCta.label}</a>
        </div>
        <p class="request-form__note">${config.note}</p>
        <p class="request-form__status" data-request-status aria-live="polite"></p>
      </form>
    </article>
  `;
};

const CONTACT_BASE_PRICE_PER_KG = 700;
const DISTANCE_LOOKUP_DEBOUNCE_MS = 550;
const distanceLookupCache = new Map();

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

const parseOptionalPositiveNumber = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number.parseFloat(raw.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
};

const requestDistanceFromMoscow = async (address) => {
  const query = String(address || "").trim();
  if (!query) return null;

  const cacheKey = query.toLowerCase();
  if (distanceLookupCache.has(cacheKey)) {
    return distanceLookupCache.get(cacheKey);
  }

  const request = fetch(`/api/distance-from-moscow?address=${encodeURIComponent(query)}`, {
    headers: {
      accept: "application/json",
    },
  }).then(async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      throw new Error(
        data.message || "Не удалось определить расстояние автоматически. Менеджер уточнит его вручную.",
      );
    }

    return data;
  });

  distanceLookupCache.set(cacheKey, request);

  try {
    return await request;
  } catch (error) {
    distanceLookupCache.delete(cacheKey);
    throw error;
  }
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
  const productContext = resolveFormProductContext(context);
  const initialMeta = resolveInitialFormMeta(context);
  const hiddenFields = {
    source: context.source || "contacts",
    page: context.page || document.body.dataset.page || "contacts",
    product_id: productContext.productId,
    product_name: productContext.productName,
    product_category: productContext.productCategory,
    product_variant: productContext.productVariant,
    lead_channel_origin: "site",
    marketplace_interest: context.marketplaceInterest || "",
    crm_status_seed: "new",
    crm_pipeline_seed: "site_request",
    integration_targets: "bitrix24,1c",
    payload_version: "v1",
    session_id: initialMeta.sessionId,
    landing_url: initialMeta.landingUrl,
    page_title: initialMeta.pageTitle,
    referrer: initialMeta.referrer,
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
        <div class="request-form__intro">
          <p class="request-form__intro-copy">Для магазинов, оптовых клиентов, корпоративных закупок и запросов по поставке.</p>
          <ol class="request-form__steps">
            <li>Получим заявку и увидим параметры запроса.</li>
            <li>Уточним объём, формат поставки и детали доставки.</li>
            <li>Подтвердим условия и следующий шаг.</li>
          </ol>
        </div>
        <div class="request-form__frame">
          <div class="request-form__main">
            <fieldset class="request-form__section">
              <legend>Контактные данные</legend>
              <div class="request-form__grid request-form__grid--contact">
                <label>
                  <span>Контактное лицо</span>
                  <input type="text" name="name" autocomplete="name" placeholder="Как к вам обращаться" required />
                </label>
                <div class="request-form__contact-slot" data-contact-slot data-active-contact="phone">
                  <label class="request-form__contact-panel is-active" data-contact-field="phone">
                    <span>Телефон</span>
                    <input type="tel" name="phone" autocomplete="tel" inputmode="tel" placeholder="+7 (___) ___-__-__" required />
                  </label>
                  <label class="request-form__contact-panel" data-contact-field="email" aria-hidden="true">
                    <span>Email</span>
                    <input type="email" name="email" autocomplete="email" placeholder="name@example.com" disabled />
                  </label>
                  <label class="request-form__contact-panel" data-contact-field="telegram" aria-hidden="true">
                    <span>Telegram</span>
                    <input type="text" name="telegram_username" autocomplete="off" placeholder="@username" disabled />
                  </label>
                </div>
              </div>
              <div class="request-form__grid">
                <label>
                  <span>Как удобнее связаться</span>
                  <select name="contact_preferred">
                    ${config.preferredContacts
                      .map((item) => `<option value="${item.value}">${item.label}</option>`)
                      .join("")}
                  </select>
                </label>
              </div>
              <p class="request-form__hint" data-contact-helper>
                Выберите основной канал связи. Поле для контакта переключится автоматически.
              </p>
            </fieldset>
            <fieldset class="request-form__section">
              <legend>Данные компании</legend>
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
            </fieldset>
            <fieldset class="request-form__section">
              <legend>Параметры запроса</legend>
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
                <article class="request-form__distance-card" data-distance-card data-distance-state="idle" aria-live="polite">
                  <span class="request-form__distance-label">Расстояние от Москвы</span>
                  <strong data-distance-value>Определим автоматически</strong>
                  <p data-distance-helper>Введите адрес доставки, и система посчитает расстояние по нему автоматически.</p>
                </article>
              </div>
            </fieldset>
            <fieldset class="request-form__section">
              <legend>Доставка</legend>
              <label>
                <span>Адрес доставки</span>
                <input type="text" name="delivery_address" autocomplete="street-address" placeholder="Город, улица, склад или точка доставки" required data-distance-source />
              </label>
            </fieldset>
            <input type="hidden" name="distance_km" value="" data-quote-distance />
            <fieldset class="request-form__section">
              <legend>Комментарий</legend>
              <label>
                <span>Что важно учесть</span>
                <textarea name="message" placeholder="Например: нужен ежемесячный объём, тестовая партия или особые условия доставки."></textarea>
              </label>
            </fieldset>
          </div>
          <aside class="request-form__aside">
            <section class="request-form__section request-form__section--summary">
              <div class="quote-summary" data-quote-summary aria-live="polite">
                <div class="quote-summary__head">
                  <strong>Предварительный расчёт</strong>
                  <p>Сводка по объёму и доставке обновляется автоматически по мере заполнения формы.</p>
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
                <details class="quote-summary__details">
                  <summary>Как считается стоимость</summary>
                  <p>${config.pricingHint}</p>
                </details>
              </div>
            </section>
          </aside>
        </div>
        <fieldset class="request-form__section request-form__section--actions">
          <legend>Согласие и отправка</legend>
          <label class="request-form__consent">
            <input type="checkbox" name="consent" required />
            <span>${config.consent}</span>
          </label>
          <div class="request-form__actions">
            <button class="button" type="submit">${config.submitLabel}</button>
            <a class="text-link text-link--inline request-form__action-link" href="${config.quickContactHref}"${externalAttrs(config.quickContactHref)}>${config.quickContactLabel}</a>
          </div>
          <p class="request-form__note">${config.note}</p>
          <p class="request-form__status" data-request-status aria-live="polite"></p>
        </fieldset>
      </form>
    </article>
  `;
};

const renderHome = () => {
  const hero = $("#home-hero");
  if (hero) {
    hero.innerHTML = `
      <article class="hero-stage hero-stage--lead hero-stage--home">
        <div class="hero-stage__copy">
          ${store.home.hero.eyebrow ? `<p class="eyebrow">${store.home.hero.eyebrow}</p>` : ""}
          <h1>${trimHeadingPeriod(store.home.hero.title)}</h1>
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
            <img
              src="${store.home.hero.image?.src || product.images.lifestyle}"
              alt="${store.home.hero.image?.alt || "Очищенная макадамия Global Basket в домашней подаче"}"
              loading="eager"
              decoding="async"
              fetchpriority="high"
            />
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
      <article class="feature-split feature-split--home">
        <div class="feature-split__copy">
          ${store.home.featured.title ? `<p class="eyebrow">${store.home.featured.title}</p>` : ""}
          <h2>${trimHeadingPeriod(store.home.featured.heading)}</h2>
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
            pageTitle: buildDocumentTitle("Главная"),
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
  return [
    ...activeProducts.map((item) => ({
      type: "product",
      title: item.shortName,
      keywords: [
        item.shortName,
        item.fullName,
        item.h1,
        item.subtitle,
        item.origin,
        item.weight,
        item.packaging,
        item.category,
        item.catalogDescription,
        item.annotation,
        item.shortDescription,
        item.fullDescription,
        item.composition,
        item.seoKeywords,
      ]
        .filter(Boolean)
        .join(" "),
      html: renderEnterpriseProductCard(item),
      status: "active",
    })),
    ...activeCategories.map((item, index) => ({
      type: "section",
      title: item.name,
      keywords: `${item.name} ${item.description} ${item.intro || ""} ${item.statusLabel}`,
      html: renderSectionCard({
        ...item,
        className: index === 0 ? "section-card--catalog-start" : "",
      }),
      status: "active",
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
        <a href="/sait-/contacts/?source=catalog-sidebar"><span>Связаться</span></a>
        <a href="/sait-/delivery/"><span>Доставка и оплата</span></a>
        <a href="/sait-/about/"><span>О бренде</span></a>
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
              <p>Попробуйте поискать «макадамия», «пекан», «грецкий орех» или вернитесь ко всему каталогу.</p>
              <a class="button button--small" href="/sait-/catalog/">В каталог</a>
            </article>
        `;
  }

  const support = $("#catalog-support");
  if (support) {
    support.innerHTML = store.catalogPage.support.map(renderSectionCard).join("");
  }
};

const renderProductPage = () => {
  const productItem = product;
  if (!productItem) return;

  const params = new URLSearchParams(window.location.search);
  let selectedVariant = resolveProductVariant(productItem, params.get("variant") || "");

  document.title = buildDocumentTitle(productItem.seoTitle || productItem.h1 || productItem.shortName);
  ensureMetaTag("description").setAttribute(
    "content",
    productItem.seoDescription || productItem.annotation || productItem.catalogDescription || "",
  );
  ensureMetaTag("keywords").setAttribute("content", productItem.seoKeywords || "");

  const breadcrumbCurrent = $("#product-breadcrumb-current");
  if (breadcrumbCurrent) {
    breadcrumbCurrent.textContent = productItem.shortName;
  }

  const gallery = $("#product-gallery");
  if (gallery) {
    gallery.innerHTML = `
      <div class="product-gallery__main product-gallery__main--${productItem.imageKind || "illustration"}">
        <img
          src="${productItem.images.main}"
          alt="${productItem.gallery?.[0]?.alt || productItem.fullName}"
          data-gallery-main
        />
      </div>
      <div class="product-gallery__thumbs">
        ${productItem.gallery
          .map(
            (item, index) => `
              <button
                class="product-gallery__thumb product-gallery__thumb--${productItem.imageKind || "illustration"} ${index === 0 ? "is-active" : ""}"
                type="button"
                data-gallery-thumb
                data-src="${escapeAttribute(item.src)}"
                data-alt="${escapeAttribute(item.alt)}"
                aria-pressed="${index === 0 ? "true" : "false"}"
              >
                <img src="${item.src}" alt="${item.alt}" loading="lazy" decoding="async" />
              </button>
            `,
          )
          .join("")}
      </div>
    `;

    const mainImage = $("[data-gallery-main]", gallery);
    const thumbs = $$("[data-gallery-thumb]", gallery);
    thumbs.forEach((thumb) => {
      thumb.addEventListener("click", () => {
        if (!mainImage) return;
        mainImage.setAttribute("src", thumb.dataset.src || productItem.images.main);
        mainImage.setAttribute("alt", thumb.dataset.alt || productItem.fullName);
        thumbs.forEach((item) => {
          const isActive = item === thumb;
          item.classList.toggle("is-active", isActive);
          item.setAttribute("aria-pressed", String(isActive));
        });
      });
    });
  }

  const summary = $("#product-summary");
  const actionsEyebrow = $("#product-actions-eyebrow");
  const actionsTitle = $("#product-actions-title");
  const marketplaces = $("#product-marketplaces");

  const updateActionSection = (variant) => {
    const useMarketplaceMode =
      productItem.actionMode === "marketplace-default" &&
      (!variant || variant.label === resolveProductVariant(productItem)?.label);

    if (actionsEyebrow) {
      actionsEyebrow.textContent = useMarketplaceMode
        ? productItem.actionsSectionEyebrow || "Где купить"
        : "Следующий шаг";
    }

    if (actionsTitle) {
      actionsTitle.textContent = useMarketplaceMode
        ? trimHeadingPeriod(productItem.actionsSectionTitle || "Маркетплейсы дают дополнительный канал доверия и покупки")
        : "Уточните наличие, фасовку и следующий шаг по выбранному варианту";
    }

    if (marketplaces) {
      marketplaces.innerHTML = productCtaCards(productItem, variant).map(renderMarketplaceCard).join("");
    }
  };

  const renderSummary = (variant) => {
    const subtitle = buildVariantSubtitle(productItem, variant);
    const pills = updatePillsForVariant(productItem, variant);
    const factCards = updateFactCardsForVariant(productItem, variant);
    const variantNote =
      variant && variant.status === "request"
        ? `Фасовка ${variant.label} доступна по запросу. Менеджер подтвердит наличие и формат поставки.`
        : productItem.priceNote;

    return `
      ${renderBadge(productItem.badge, productItem.badgeTone)}
      <h1>${productItem.h1 || productItem.shortName}</h1>
      <p class="product-summary__subtitle">${subtitle}</p>
      <p class="product-page__lead">${productItem.annotation || productItem.lead}</p>
      ${renderVariantPicker(productItem, variant)}
      <ul class="hero-product__pills hero-product__pills--summary">
        ${pills.map((item) => `<li>${item}</li>`).join("")}
      </ul>
      <dl class="summary-facts">
        ${factCards
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
          <strong>${productItem.price}</strong>
          <p>${variantNote}</p>
        </div>
        <div class="purchase-panel__actions">
          <a class="button" href="${buildContactHref(productItem, "pdp", variant)}">Уточнить условия</a>
          <button
            class="button button--ghost"
            type="button"
            data-cart-add
            data-product-id="${escapeAttribute(productItem.id || productItem.slug || "")}"
            data-product-variant="${escapeAttribute(getStoredVariantLabel(variant))}"
            data-action-source="product-page"
          >
            В корзину
          </button>
          <button
            class="text-link text-link--inline"
            type="button"
            data-favorite-toggle
            data-product-id="${escapeAttribute(productItem.id || productItem.slug || "")}"
            data-product-variant="${escapeAttribute(getStoredVariantLabel(variant))}"
            data-action-source="product-page"
            aria-pressed="false"
          >
            В избранное
          </button>
          <a class="text-link text-link--inline" href="/sait-/catalog/">Вернуться в каталог</a>
        </div>
      </div>
      <div class="market-links market-links--summary">
        <span>${productItem.actionMode === "marketplace-default" && (!variant || variant.label === resolveProductVariant(productItem)?.label) ? productItem.quickLinksLabel || "Где купить" : "Следующий шаг"}:</span>
        ${productQuickLinks(productItem, variant)
          .map((item) => `<a href="${item.href}"${externalAttrs(item.href)}>${item.label}</a>`)
          .join("")}
      </div>
    `;
  };

  const bindVariantChoices = () => {
    $$("[data-variant-choice]", summary).forEach((button) => {
      button.addEventListener("click", () => {
        const nextVariant = resolveProductVariant(productItem, button.dataset.variantLabel);
        if (!nextVariant) return;
        selectedVariant = nextVariant;
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set("variant", nextVariant.label);
        window.history.replaceState(null, "", nextUrl);
        if (summary) {
          summary.innerHTML = renderSummary(selectedVariant);
          bindVariantChoices();
          bindStoredProductActions(summary);
        }
        updateActionSection(selectedVariant);
      });
    });
  };

  if (summary) {
    summary.innerHTML = renderSummary(selectedVariant);
    bindVariantChoices();
  }

  const details = $("#product-details");
  if (details) {
    details.innerHTML = `
      <article class="panel product-detail-card">
        <div class="section-head section-head--compact">
          <p class="eyebrow">${productItem.detailsEyebrow || "О продукте"}</p>
          <h2>${productItem.detailsTitle || "Описание и характеристики"}</h2>
          <p>${productItem.shortDescription}</p>
        </div>
        <div class="product-section-copy">
          <p>${productItem.fullDescription}</p>
        </div>
      </article>
      <article class="panel product-spec-card">
        <div class="section-head section-head--compact">
          <p class="eyebrow">Характеристики</p>
          <h2>Ключевые данные по позиции</h2>
        </div>
        ${renderProductSpecs(productItem.specs || [])}
      </article>
    `;
  }

  const benefitsEyebrow = $("#product-benefits-eyebrow");
  if (benefitsEyebrow) {
    benefitsEyebrow.textContent = productItem.benefitSectionEyebrow || "Польза продукта";
  }

  const benefitsTitle = $("#product-benefits-title");
  if (benefitsTitle) {
    benefitsTitle.textContent = trimHeadingPeriod(
      productItem.benefitSectionTitle ||
        "Ключевые свойства товара собраны так, чтобы позиция читалась спокойно и убедительно",
    );
  }

  const benefits = $("#product-benefits");
  if (benefits) {
    benefits.innerHTML = productItem.benefitCards.map(renderBenefitCard).join("");
  }

  updateActionSection(selectedVariant);

  const faq = $("#product-faq");
  if (faq) {
    faq.innerHTML = productItem.faq
      .map(
        (item, index) => `
          <article class="faq-item ${index === 0 ? "is-open" : ""}">
            <button type="button" aria-expanded="${index === 0 ? "true" : "false"}">
              <span class="faq-item__label">${item.question}</span>
              <span class="faq-item__icon" data-faq-icon aria-hidden="true">${index === 0 ? "−" : "+"}</span>
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
  const requestedProduct = findProduct(params.get("product") || "");
  const requestedCategory = findCategory(params.get("category") || "");
  const requestedVariant = requestedProduct
    ? resolveProductVariant(requestedProduct, params.get("variant") || "")
    : null;
  const [retailCard, wholesaleCard, marketplacesCard, telegramCard] = store.contactsPage.leftCards;
  const intro = $("#contacts-intro");
  if (intro) {
    const contactDisclosures = [
      {
        title: retailCard.title,
        meta: "Подскажем по товару, наличию и каналу покупки",
        body: `
          <p>${retailCard.text}</p>
          <div class="contact-disclosure__links">
            <a class="text-link text-link--inline" href="/sait-/catalog/">Перейти в каталог</a>
            <a class="text-link text-link--inline" href="${store.contact.telegramHref}"${externalAttrs(store.contact.telegramHref)}>Написать в Telegram</a>
          </div>
        `,
      },
      {
        title: wholesaleCard.title,
        meta: "Поставка для магазина, офиса или постоянных закупок",
        body: `
          <p>${wholesaleCard.text}</p>
          <p>Форма запроса помогает сразу передать объём, формат поставки и адрес доставки без лишней переписки.</p>
        `,
      },
      {
        title: "Контакты",
        meta: "Телефон, email, Telegram и часы работы",
        body: `
          <p>Телефон, email и Telegram остаются резервными каналами связи, если удобнее уточнить детали напрямую.</p>
          <div class="contact-direct__list">
            <p><a href="${store.contact.phoneHref}">${store.contact.phone}</a></p>
            <p><a href="${store.contact.emailHref}">${store.contact.email}</a></p>
            <p><a href="${store.contact.telegramHref}"${externalAttrs(store.contact.telegramHref)}>${store.contact.telegram}</a></p>
            <p>${store.contact.hours}</p>
          </div>
        `,
      },
      {
        title: "Где купить",
        meta: "Ozon, Wildberries и Яндекс.Маркет",
        body: `
          <p>${marketplacesCard.text}</p>
          <div class="contact-marketplaces__links">
            ${store.marketplaces
              .map(
                (item) =>
                  `<a href="${item.href}"${externalAttrs(item.href)}>${item.name}</a>`,
              )
              .join("")}
          </div>
        `,
      },
    ];

    intro.innerHTML = `
      <div class="hero-copy contacts-copy">
        <p class="eyebrow">Контакты</p>
        <h1>Связаться с Global Basket</h1>
        <p>${store.contactsPage.intro}</p>
      </div>
      <div class="contacts-disclosures contacts-disclosures--lead">
        ${contactDisclosures
          .map(
            (item) => `
              <details class="contact-disclosure contact-disclosure--lead">
                <summary>
                  <span class="contact-disclosure__title">${item.title}</span>
                  <span class="contact-disclosure__meta">${item.meta}</span>
                  <span class="contact-disclosure__chevron" aria-hidden="true"></span>
                </summary>
                <div class="contact-disclosure__body">
                  ${item.body}
                </div>
              </details>
            `,
          )
          .join("")}
      </div>
      <div class="contacts-disclosures contacts-disclosures--secondary">
        <details class="contact-disclosure">
          <summary>
            <span class="contact-disclosure__title">Telegram и быстрые сообщения</span>
            <span class="contact-disclosure__meta">Бот, жалобы и канал бренда</span>
          </summary>
          <div class="contact-disclosure__body">
            <p>${telegramCard.text}</p>
            <div class="contact-disclosure__links">
              <a class="text-link text-link--inline" href="${store.contact.telegramHref}"${externalAttrs(store.contact.telegramHref)}>Открыть бота</a>
              <a class="text-link text-link--inline" href="${store.contact.telegramComplaintHref}"${externalAttrs(store.contact.telegramComplaintHref)}>Оставить жалобу</a>
              <a class="text-link text-link--inline" href="${store.contact.channelHref}"${externalAttrs(store.contact.channelHref)}>${store.contact.channel}</a>
            </div>
          </div>
        </details>
        <details class="contact-disclosure">
          <summary>
            <span class="contact-disclosure__title">Подсказки по запросу</span>
            <span class="contact-disclosure__meta">Когда использовать форму и что указать</span>
          </summary>
          <div class="contact-disclosure__body">
            <p>${retailCard.text}</p>
            <p>${wholesaleCard.text}</p>
          </div>
        </details>
      </div>
    `;
  }

  const panel = $("#contact-panel");
  if (panel) {
    panel.innerHTML = `
      <div class="contact-panel__stack">
        ${renderContactQuoteForm(store.contactsPage.quoteForm, {
          source: requestedSource,
          page: "contacts",
          pageTitle: buildDocumentTitle("Контакты"),
          productId: requestedProduct?.id || "",
          productName: requestedProduct?.fullName || "",
          productCategory: requestedProduct?.category || requestedCategory?.title || requestedCategory?.name || "",
          productVariant: requestedVariant?.label || "",
        })}
        <details class="request-panel request-panel--compact request-panel--secondary contact-fallback-panel">
          <summary class="contact-fallback-panel__summary">
            <div>
              <p class="eyebrow">Telegram и резервные каналы</p>
              <strong>${store.contactsPage.telegramPanel.title}</strong>
            </div>
            <span class="contact-fallback-panel__toggle" aria-hidden="true"></span>
          </summary>
          <div class="contact-fallback-panel__body">
            <p>${store.contactsPage.telegramPanel.text}</p>
            <div class="contact-fallback-panel__actions">
              <a class="button button--ghost button--small" href="${store.contact.telegramHref}"${externalAttrs(store.contact.telegramHref)}>${store.contactsPage.telegramPanel.primary}</a>
              <a class="text-link text-link--inline" href="${store.contact.telegramComplaintHref}"${externalAttrs(store.contact.telegramComplaintHref)}>${store.contactsPage.telegramPanel.secondary}</a>
            </div>
            <p class="request-form__note">Бот: <a href="${store.contact.telegramHref}"${externalAttrs(store.contact.telegramHref)}>${store.contact.telegram}</a>. Канал: <a href="${store.contact.channelHref}"${externalAttrs(store.contact.channelHref)}>${store.contact.channel}</a>. Резервный контакт: <a href="${store.contact.phoneHref}">${store.contact.phone}</a> / <a href="${store.contact.emailHref}">${store.contact.email}</a>.</p>
          </div>
        </details>
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
          <a href="/sait-/">Главная</a>
          <span>/</span>
          <span>О бренде</span>
        </div>
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
      <section class="about-carousel" data-about-carousel aria-roledescription="carousel" aria-label="${about.facts.title}">
        <div class="about-carousel__top">
          <div class="section-head about-section-head" data-reveal>
            <h2>${about.facts.title}</h2>
            <p>${about.facts.text}</p>
          </div>
          <div class="about-carousel__controls" data-reveal>
            <button class="about-carousel__arrow about-carousel__arrow--prev" type="button" data-about-prev aria-label="Предыдущий факт">
              <span class="about-carousel__arrow-icon" aria-hidden="true">${renderIcon("arrow")}</span>
            </button>
            <button class="about-carousel__arrow" type="button" data-about-next aria-label="Следующий факт">
              <span class="about-carousel__arrow-icon" aria-hidden="true">${renderIcon("arrow")}</span>
            </button>
          </div>
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
  const category = currentCategory;
  if (!category) return;

  document.title = buildDocumentTitle(category.title || category.name);
  ensureMetaTag("description").setAttribute(
    "content",
    category.intro || category.description || "",
  );

  const breadcrumbCurrent = $("#category-breadcrumb-current");
  if (breadcrumbCurrent) {
    breadcrumbCurrent.textContent = category.title || category.name;
  }

  const title = $("#category-title");
  if (title) {
    title.textContent = category.title || category.name;
  }

  const description = $("#category-description");
  if (description) {
    description.textContent = category.intro || category.description || "";
  }

  const intro = $("#category-intro-cards");
  if (intro) {
    intro.innerHTML = `
      ${categories
        .filter((item) => item.id !== category.id)
        .map((item) =>
          item.href ? renderSectionCard(item) : renderSectionCard(item),
        )
        .join("")}
    `;
  }

  const shelf = $("#category-shelf");
  if (shelf) {
    shelf.innerHTML = `
      <article class="category-spotlight">
        <div class="category-spotlight__media">
          <img src="${category.image}" alt="${category.title || category.name}" loading="lazy" decoding="async" />
        </div>
        <div class="category-spotlight__body">
          <p class="eyebrow">Раздел каталога</p>
          <h2>${category.title || category.name}</h2>
          <p>${category.intro || category.description || ""}</p>
          <div class="market-links">
            <span>В разделе:</span>
            <span>${formatCatalogCount(category.productCount || 0)}</span>
          </div>
          <div class="hero-stage__actions">
            <a class="button" href="${buildCategoryContactHref(category, "category-page")}">Уточнить условия</a>
            <a class="text-link text-link--inline" href="${store.contact.telegramHref}"${externalAttrs(store.contact.telegramHref)}>Написать в Telegram</a>
          </div>
        </div>
      </article>
    `;
  }

  const related = $("#category-related");
  if (related) {
    const relatedProducts = activeProducts.filter((item) => item.categorySlug === category.id);
    related.innerHTML = `
      <div class="section-head">
        <p class="eyebrow">В наличии</p>
        <h2>Товары раздела «${category.title || category.name}»</h2>
      </div>
      <div class="catalog-grid">
        ${relatedProducts.map((item) => renderEnterpriseProductCard(item)).join("")}
      </div>
    `;
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

const renderArticleCards = (cards = [], tone = "default") => {
  if (!cards.length) return "";

  return `
    <div class="fact-grid fact-grid--stacked article-fact-grid ${tone === "summary" ? "article-fact-grid--summary" : ""}">
      ${cards
        .map(
          (card) => `
            <article class="fact-card fact-card--vertical article-fact-card ${tone ? `article-fact-card--${tone}` : ""}">
              <div>
                <strong>${card.title}</strong>
                <p>${card.text}</p>
              </div>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
};

const renderArticleBlock = (section) => {
  if (!section) return "";

  const paragraphs = (section.paragraphs || [])
    .map((paragraph) => `<p>${paragraph}</p>`)
    .join("");
  const legacyText = section.text ? `<p>${section.text}</p>` : "";
  const intro = section.intro ? `<p class="article-block__intro">${section.intro}</p>` : "";
  const cards = renderArticleCards(section.cards, section.tone);

  return `
    <section class="panel article-block ${section.tone ? `article-block--${section.tone}` : ""}">
      ${section.title ? `<h2>${section.title}</h2>` : ""}
      ${intro}
      ${paragraphs || legacyText}
      ${cards}
    </section>
  `;
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
        <a href="/sait-/">Главная</a>
        <span>/</span>
        <a href="/sait-/journal/">Журнал</a>
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
    const introParagraphs = (post.introParagraphs || []).length
      ? `
        <section class="panel article-lead-copy">
          ${(post.introParagraphs || []).map((paragraph) => `<p>${paragraph}</p>`).join("")}
        </section>
      `
      : "";

    const contentBlocks = (post.blocks || post.sections || []).map(renderArticleBlock).join("");
    const conclusion = post.conclusion
      ? `
        <section class="panel article-conclusion">
          <p>${post.conclusion}</p>
        </section>
      `
      : "";

    const productBridge = post.productBridge
      ? `<p class="article-product-bridge">${post.productBridge}</p>`
      : "";

    const productPanel = `
      <article class="request-panel request-panel--compact article-product-panel">
        <div class="section-head section-head--compact">
          <p class="eyebrow">Товар</p>
          <h2>${product.shortName}</h2>
          <p>${product.lead}</p>
        </div>
        <div class="aside-actions">
          <a class="button button--small" href="${product.href}">Подробнее</a>
          <a class="text-link text-link--inline" href="/sait-/contacts/?source=journal">Уточнить условия</a>
        </div>
      </article>
    `;

    if (post.ctaPosition === "after-content") {
      sections.innerHTML = `
        <div class="article-layout article-layout--single">
          <article class="article-prose article-prose--editorial">
            ${introParagraphs}
            ${contentBlocks}
            ${conclusion}
            ${productBridge}
            ${productPanel}
          </article>
        </div>
      `;
      return;
    }

    sections.innerHTML = `
      <div class="article-layout">
        <article class="article-prose">
          ${introParagraphs}
          ${contentBlocks}
          ${conclusion}
        </article>
        <aside class="article-aside">
          ${productBridge}
          ${productPanel}
        </aside>
      </div>
    `;
  }
};

const formatDateShort = (value = "") => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatPreferredContactLabel = (value = "") => {
  const key = resolvePreferredContactKey(value);
  if (key === "email") return "Email";
  if (key === "telegram") return "Telegram";
  return "Телефон";
};

const getPreferredContactFieldValue = (profile = null) => {
  const key = resolvePreferredContactKey(profile?.preferredContact || "");
  if (key === "email") return "Email";
  if (key === "telegram") return "Telegram";
  return "Телефон";
};

const getProfileContactValue = (profile = null) => {
  const key = resolvePreferredContactKey(profile?.preferredContact || "");
  if (key === "email") return profile?.email || "";
  if (key === "telegram") return profile?.telegramUsername || "";
  return profile?.phone || "";
};

const renderSavedSelectionCard = (entry, mode = "cart") => {
  const productItem = resolveStoredProduct(entry);
  const href = productItem?.href || entry.href || "/sait-/catalog/";
  const variantLabel = entry.variantLabel ? `Фасовка: ${entry.variantLabel}` : "";
  const subtitle = entry.subtitle || productItem?.subtitle || "";
  const category = entry.categoryName || productItem?.category || "";
  const defaultVariant = productItem ? resolveProductVariant(productItem, entry.variantLabel || "") : null;

  return `
    <article class="saved-item-card">
      <a class="saved-item-card__media" href="${href}">
        <img src="${entry.image || productItem?.images?.packshot || "/sait-/assets/logo.jpg"}" alt="${entry.fullName || entry.shortName}" loading="lazy" decoding="async" />
      </a>
      <div class="saved-item-card__body">
        <div class="saved-item-card__meta">
          ${category ? renderBadge(category, "service") : ""}
          ${variantLabel ? `<span class="saved-item-card__variant">${variantLabel}</span>` : ""}
        </div>
        <h2><a href="${href}">${entry.shortName || entry.fullName}</a></h2>
        ${subtitle ? `<p>${subtitle}</p>` : ""}
        <div class="saved-item-card__actions">
          <a class="button button--small" href="${href}">Открыть товар</a>
          ${
            mode === "cart"
              ? `
                <div class="quantity-stepper" aria-label="Количество">
                  <button type="button" data-cart-quantity-action="decrease" data-entry-id="${escapeAttribute(entry.entryId)}" aria-label="Уменьшить количество">−</button>
                  <span>${Math.max(1, Number(entry.quantity) || 1)}</span>
                  <button type="button" data-cart-quantity-action="increase" data-entry-id="${escapeAttribute(entry.entryId)}" aria-label="Увеличить количество">+</button>
                </div>
                <button
                  class="text-link text-link--inline"
                  type="button"
                  data-favorite-toggle
                  data-product-id="${escapeAttribute(entry.productId || "")}"
                  data-product-variant="${escapeAttribute(entry.variantLabel || "")}"
                  data-action-source="cart-page"
                  aria-pressed="${isFavoriteSaved(productItem || entry) ? "true" : "false"}"
                >
                  В избранное
                </button>
                <button class="text-link text-link--inline" type="button" data-cart-remove data-entry-id="${escapeAttribute(entry.entryId)}">Удалить</button>
              `
              : `
                <button
                  class="button button--ghost button--small"
                  type="button"
                  data-cart-add
                  data-product-id="${escapeAttribute(entry.productId || "")}"
                  data-product-variant="${escapeAttribute(entry.variantLabel || getStoredVariantLabel(defaultVariant))}"
                  data-action-source="favorites-page"
                >
                  В корзину
                </button>
                <button class="text-link text-link--inline" type="button" data-favorite-remove data-product-id="${escapeAttribute(entry.productId || "")}">Убрать</button>
              `
          }
        </div>
      </div>
    </article>
  `;
};

const renderAccountSummaryPanel = (profile = null) => {
  const summary = derivePreferenceSummary(profile);
  const contactValue = getProfileContactValue(profile);
  const contactLabel = profile ? formatPreferredContactLabel(profile.preferredContact) : "Контакт";
  const categoryText = summary.categoryNames.length ? summary.categoryNames.join(", ") : "Предпочтения появятся после выбора товаров.";
  const items = [
    {
      label: contactLabel,
      value: contactValue || "Телефон, email или Telegram",
    },
    {
      label: "Корзина",
      value: `${summary.cartLineCount || 0} поз. / ${summary.cartCount || 0} шт.`,
    },
    {
      label: "Избранное",
      value: `${summary.favoriteCount || 0} поз.`,
    },
    {
      label: "Интересующие разделы",
      value: categoryText,
      wide: true,
    },
    {
      label: "Последнее обновление",
      value: formatDateShort(profile?.updatedAt || profile?.registeredAt || ""),
    },
  ];

  return `
    <article class="request-panel account-summary-card">
      <div class="section-head section-head--compact">
        <p class="eyebrow">Профиль</p>
        <h2>${profile ? store.utilityPages.account.registeredTitle : "Что сохранится после регистрации"}</h2>
        <p>${profile ? store.utilityPages.account.registeredText : "После сохранения профиля в этом браузере останутся контакт, корзина, избранное и выбранные разделы каталога."}</p>
      </div>
      <dl class="account-summary-card__list">
        ${items
          .map(
            (item) => `
              <div class="account-summary-card__item ${item.wide ? "account-summary-card__item--wide" : ""}">
                <dt>${item.label}</dt>
                <dd>${item.value}</dd>
              </div>
            `,
          )
          .join("")}
      </dl>
      <div class="account-summary-card__actions">
        <a class="button button--ghost button--small" href="/sait-/cart/">Открыть корзину</a>
        <a class="button button--ghost button--small" href="/sait-/favorites/">Открыть избранное</a>
      </div>
    </article>
  `;
};

const renderAccountRegistrationPanel = (profile = null) => {
  const contactKey = resolvePreferredContactKey(profile?.preferredContact || "phone");
  const contactValue = getProfileContactValue(profile);
  const selectedInterests = new Set(Array.isArray(profile?.interestIds) ? profile.interestIds : []);
  const interestOptions = buildInterestOptions();

  return `
    <article class="request-panel account-register-panel" id="account-register">
      <div class="section-head section-head--compact">
        <p class="eyebrow">Регистрация</p>
        <h2>${store.utilityPages.account.formTitle}</h2>
        <p>${store.utilityPages.account.formText}</p>
      </div>
      <form class="request-form request-form--account" data-account-registration-form novalidate>
        <fieldset class="request-form__section">
          <legend>Контакт для аккаунта</legend>
          <div class="request-form__grid">
            <label>
              <span>Какой контакт сохранить</span>
              <select name="contact_preferred">
                <option value="Телефон" ${contactKey === "phone" ? "selected" : ""}>Телефон</option>
                <option value="Telegram" ${contactKey === "telegram" ? "selected" : ""}>Telegram</option>
                <option value="Email" ${contactKey === "email" ? "selected" : ""}>Email</option>
              </select>
            </label>
            <div class="request-form__contact-slot" data-contact-slot data-active-contact="${contactKey}">
              <label class="request-form__contact-panel ${contactKey === "phone" ? "is-active" : ""}" data-contact-field="phone" aria-hidden="${contactKey === "phone" ? "false" : "true"}">
                <span>Телефон</span>
                <input type="tel" name="phone" autocomplete="tel" inputmode="tel" placeholder="+7 (___) ___-__-__" value="${contactKey === "phone" ? escapeAttribute(contactValue) : ""}" ${contactKey === "phone" ? "" : "disabled"} required />
              </label>
              <label class="request-form__contact-panel ${contactKey === "email" ? "is-active" : ""}" data-contact-field="email" aria-hidden="${contactKey === "email" ? "false" : "true"}">
                <span>Email</span>
                <input type="email" name="email" autocomplete="email" placeholder="name@example.com" value="${contactKey === "email" ? escapeAttribute(contactValue) : ""}" ${contactKey === "email" ? "" : "disabled"} required />
              </label>
              <label class="request-form__contact-panel ${contactKey === "telegram" ? "is-active" : ""}" data-contact-field="telegram" aria-hidden="${contactKey === "telegram" ? "false" : "true"}">
                <span>Telegram</span>
                <input type="text" name="telegram_username" autocomplete="off" placeholder="@username" value="${contactKey === "telegram" ? escapeAttribute(contactValue) : ""}" ${contactKey === "telegram" ? "" : "disabled"} required />
              </label>
            </div>
          </div>
          <p class="request-form__hint" data-contact-helper>
            ${contactKey === "email" ? "Сохраним email для входа и связи по заказу." : contactKey === "telegram" ? "Сохраним Telegram для быстрого контакта и регистрации." : "Сохраним телефон для входа и связи по заказу."}
          </p>
        </fieldset>
        <fieldset class="request-form__section">
          <legend>Предпочтения</legend>
          <div class="account-interest-grid">
            ${interestOptions
              .map(
                (item) => `
                  <label class="choice-chip ${selectedInterests.has(item.id) ? "is-selected" : ""}">
                    <input type="checkbox" name="interest_categories" value="${escapeAttribute(item.id)}" ${selectedInterests.has(item.id) ? "checked" : ""} />
                    <span>${item.label}</span>
                  </label>
                `,
              )
              .join("")}
          </div>
          <p class="request-form__hint">Разделы ниже помогут сохранить интересы пользователя, даже если корзина пока пустая.</p>
        </fieldset>
        <fieldset class="request-form__section request-form__section--actions">
          <legend>Согласие и сохранение</legend>
          <label class="request-form__consent">
            <input type="checkbox" name="consent" ${profile ? "checked" : ""} required />
            <span>${store.utilityPages.account.consent}</span>
          </label>
          <div class="request-form__actions">
            <button class="button" type="submit">${store.utilityPages.account.submitLabel}</button>
            <a class="text-link text-link--inline request-form__action-link" href="/sait-/catalog/">Сначала выбрать товары</a>
          </div>
          <p class="request-form__note">Профиль сохранится в этом браузере и подтянет корзину, избранное и выбранные интересы.</p>
          <p class="request-form__status" data-request-status aria-live="polite"></p>
        </fieldset>
      </form>
    </article>
  `;
};

const renderAccountPage = () => {
  const hero = $("#utility-page");
  const page = store.utilityPages.account;
  const profile = getAccountProfile();

  if (!hero || !page) return;

  hero.innerHTML = `
    <div class="breadcrumb">
      <a href="/sait-/">Главная</a>
      <span>/</span>
      <span>${page.title}</span>
    </div>
    <div class="utility-stack utility-stack--account">
      <div class="utility-grid utility-grid--account-top">
        <article class="request-panel utility-page utility-page--account account-hero-card">
          <div class="section-head section-head--compact">
            <p class="eyebrow">Раздел</p>
            <h1>${page.title}</h1>
            <p>${page.text}</p>
          </div>
          <ul class="account-hero-card__highlights">
            ${(page.highlights || [])
              .map((item) => `<li>${item}</li>`)
              .join("")}
          </ul>
          <div class="hero-product__actions account-hero-card__actions">
            <a class="button" href="${page.primary.href}">${page.primary.label}</a>
            <a class="button button--ghost" href="${page.secondary.href}">${page.secondary.label}</a>
          </div>
        </article>
        ${renderAccountSummaryPanel(profile)}
      </div>
      <div class="utility-grid utility-grid--account-main">
        ${renderAccountRegistrationPanel(profile)}
      </div>
    </div>
  `;
};

const renderFavoritesPage = () => {
  const hero = $("#utility-page");
  const page = store.utilityPages.favorites;
  const items = getFavoriteItems();
  const profile = getAccountProfile();

  if (!hero || !page) return;

  hero.innerHTML = `
    <div class="breadcrumb">
      <a href="/sait-/">Главная</a>
      <span>/</span>
      <span>${page.title}</span>
    </div>
    <div class="utility-stack">
      <div class="utility-grid utility-grid--utility-top">
        <article class="request-panel utility-page">
          <div class="section-head section-head--compact">
            <p class="eyebrow">Раздел</p>
            <h1>${page.title}</h1>
            <p>${page.text}</p>
          </div>
          <div class="hero-product__actions">
            <a class="button" href="${page.primary.href}">${page.primary.label}</a>
            <a class="button button--ghost" href="${profile ? "/sait-/account/" : "/sait-/account/#account-register"}">${profile ? "Открыть аккаунт" : "Сохранить аккаунт"}</a>
          </div>
        </article>
        <article class="request-panel utility-summary-card">
          <div class="section-head section-head--compact">
            <p class="eyebrow">Сводка</p>
            <h2>Сохранённые позиции</h2>
            <p>${items.length ? "Выбранные товары уже лежат в личной подборке и могут быть добавлены в корзину." : "Подборка пока пустая. Сохраняйте понравившиеся позиции из каталога и со страницы товара."}</p>
          </div>
          <dl class="account-summary-card__list">
            <div><dt>Позиций</dt><dd>${items.length}</dd></div>
            <div><dt>Аккаунт</dt><dd>${profile ? "Сохранён" : "Пока не сохранён"}</dd></div>
          </dl>
        </article>
      </div>
      <div class="saved-item-list">
        ${
          items.length
            ? items.map((entry) => renderSavedSelectionCard(entry, "favorites")).join("")
            : `
              <article class="empty-state">
                <strong>В избранном пока ничего нет.</strong>
                <p>Откройте каталог или карточку товара и добавьте позиции в личную подборку.</p>
                <a class="button button--small" href="/sait-/catalog/">Перейти в каталог</a>
              </article>
            `
        }
      </div>
    </div>
  `;
};

const renderCartPage = () => {
  const hero = $("#utility-page");
  const page = store.utilityPages.cart;
  const items = getCartItems();
  const profile = getAccountProfile();
  const totalUnits = items.reduce((sum, entry) => sum + Math.max(1, Number(entry.quantity) || 1), 0);

  if (!hero || !page) return;

  hero.innerHTML = `
    <div class="breadcrumb">
      <a href="/sait-/">Главная</a>
      <span>/</span>
      <span>${page.title}</span>
    </div>
    <div class="utility-stack">
      <div class="utility-grid utility-grid--utility-top">
        <article class="request-panel utility-page">
          <div class="section-head section-head--compact">
            <p class="eyebrow">Раздел</p>
            <h1>${page.title}</h1>
            <p>${page.text}</p>
          </div>
          <div class="hero-product__actions">
            <a class="button" href="${page.primary.href}">${page.primary.label}</a>
            <a class="button button--ghost" href="/sait-/contacts/?source=cart">Добавить в запрос</a>
          </div>
        </article>
        <article class="request-panel utility-summary-card">
          <div class="section-head section-head--compact">
            <p class="eyebrow">Сводка</p>
            <h2>Текущее наполнение корзины</h2>
            <p>${items.length ? "Корзина хранится локально и будет прикреплена к аккаунту при регистрации." : "Корзина пока пустая. Добавьте товары из каталога или со страницы продукта."}</p>
          </div>
          <dl class="account-summary-card__list">
            <div><dt>Строк</dt><dd>${items.length}</dd></div>
            <div><dt>Единиц</dt><dd>${totalUnits}</dd></div>
            <div><dt>Аккаунт</dt><dd>${profile ? "Сохранён" : "Пока не сохранён"}</dd></div>
          </dl>
        </article>
      </div>
      <div class="saved-item-list">
        ${
          items.length
            ? items.map((entry) => renderSavedSelectionCard(entry, "cart")).join("")
            : `
              <article class="empty-state">
                <strong>Корзина пока пустая.</strong>
                <p>Добавьте товары из каталога. После регистрации эта подборка сохранится в аккаунте на устройстве.</p>
                <a class="button button--small" href="/sait-/catalog/">Перейти в каталог</a>
              </article>
            `
        }
      </div>
    </div>
  `;
};

const renderUtilityPage = () => {
  const slug = document.body.dataset.utility;
  const page = store.utilityPages[slug];
  if (!page) return;

  if (slug === "account") {
    renderAccountPage();
    return;
  }

  if (slug === "favorites") {
    renderFavoritesPage();
    return;
  }

  if (slug === "cart") {
    renderCartPage();
    return;
  }

  const hero = $("#utility-page");
  if (hero) {
    hero.innerHTML = `
      <div class="breadcrumb">
        <a href="/sait-/">Главная</a>
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

  const close = () => {
    nav.classList.remove("is-open");
    document.body.classList.remove("has-mobile-nav");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.contains("is-open");
    if (isOpen) {
      close();
      return;
    }

    nav.classList.add("is-open");
    document.body.classList.add("has-mobile-nav");
    toggle.setAttribute("aria-expanded", "true");
  });

  $$("a", nav).forEach((link) => {
    link.addEventListener("click", close);
  });

  window.addEventListener("resize", () => {
    if (window.matchMedia("(min-width: 1181px)").matches) {
      close();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      close();
    }
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
    if (filter === "active") items = items.filter((item) => item.type === "product");
    if (filter === "sections") items = items.filter((item) => item.type === "section");

    if (sort === "available") {
      items = items.sort((a, b) => (a.status === "active" ? -1 : 1) - (b.status === "active" ? -1 : 1));
    }
    if (sort === "sections") {
      items = items.sort((a, b) => (a.type === "section" ? -1 : 1) - (b.type === "section" ? -1 : 1));
    }

    grid.innerHTML = items.length
      ? items.map((item) => item.html).join("")
      : `
          <article class="empty-state">
            <strong>В этом фильтре пока нет карточек.</strong>
            <p>Попробуйте другой фильтр или вернитесь ко всему каталогу.</p>
            <a class="button button--small" href="/sait-/catalog/">В каталог</a>
          </article>
        `;
    bindStoredProductActions(grid);

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
      window.location.href = params.toString() ? `/sait-/catalog/?${params.toString()}` : "/sait-/catalog/";
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

const bindCompactHeader = () => {
  const header = $(".site-header");
  const searchRoot = $("[data-header-search]");
  if (!header) return;

  const allowCompactMode = document.body.dataset.page !== "about";
  const prefersDesktop = () => window.matchMedia("(min-width: 1181px)").matches;

  const closeSearch = () => {
    if (!searchRoot) return;
    searchRoot.classList.remove("is-open");
    const toggle = $("[data-search-toggle]", searchRoot);
    const form = $("[data-search-desktop]", searchRoot);
    toggle?.setAttribute("aria-expanded", "false");
    form?.setAttribute("aria-hidden", "true");
  };

  const sync = () => {
    const isCondensed = allowCompactMode && prefersDesktop() && window.scrollY > 18;
    header.classList.toggle("is-condensed", isCondensed);
    document.body.classList.toggle("has-condensed-header", isCondensed);

    if (isCondensed) {
      closeSearch();
    } else {
      searchRoot?.classList.remove("is-open");
    }
  };

  let frame = 0;
  const requestSync = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(sync);
  };

  window.addEventListener("scroll", requestSync, { passive: true });
  window.addEventListener("resize", requestSync, { passive: true });
  sync();
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
        const icon = $("[data-faq-icon]", toggle);
        if (icon) icon.textContent = "+";
      });
      if (!isOpen) {
        item.classList.add("is-open");
        button.setAttribute("aria-expanded", "true");
        const icon = $("[data-faq-icon]", button);
        if (icon) icon.textContent = "−";
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

const buildBitrixComment = (payload) => {
  const summary = derivePreferenceSummary(payload.account || getAccountProfile());
  const lines = [
    payload.lead?.message ? `Комментарий: ${payload.lead.message}` : "",
    payload.product?.name ? `Товар: ${payload.product.name}` : "",
    payload.product?.category ? `Категория: ${payload.product.category}` : "",
    payload.product?.variant ? `Вариант: ${payload.product.variant}` : "",
    payload.order?.quantityKg ? `Количество: ${payload.order.quantityKg} кг` : "",
    payload.delivery?.address ? `Адрес доставки: ${payload.delivery.address}` : "",
    payload.account?.cartItems?.length
      ? `Корзина: ${payload.account.cartItems
          .map((item) => `${item.shortName} x ${Math.max(1, Number(item.quantity) || 1)}`)
          .join(", ")}`
      : "",
    payload.account?.favoriteItems?.length
      ? `Избранное: ${payload.account.favoriteItems.map((item) => item.shortName).join(", ")}`
      : "",
    summary.categoryNames?.length ? `Предпочтения: ${summary.categoryNames.join(", ")}` : "",
    payload.context?.landingUrl ? `URL: ${payload.context.landingUrl}` : "",
    payload.context?.sessionId ? `Session ID: ${payload.context.sessionId}` : "",
  ].filter(Boolean);

  return lines.join("\n");
};

const buildBitrixLeadEnvelope = (payload) => {
  const topic = payload.lead?.topic || payload.integration?.crmPipelineSeed || "site_request";
  const leadTitle =
    topic === "account_registration"
      ? "Регистрация аккаунта Global Basket"
      : `Заявка Global Basket: ${payload.lead?.topic || "Новый запрос"}`;

  return {
    entityType: "lead",
    title: leadTitle,
    sourceCode: payload.context?.source || "site",
    pipelineSeed: payload.integration?.crmPipelineSeed || "site_request",
    statusSeed: payload.integration?.crmStatusSeed || "new",
    contact: {
      name: payload.lead?.name || DEFAULT_ACCOUNT_NAME,
      phone: payload.lead?.phone || "",
      email: payload.lead?.email || "",
      telegram: payload.lead?.telegramUsername || "",
      preferredChannel: payload.lead?.preferredContact || "",
    },
    product: payload.product || {},
    account: payload.account || {},
    fields: {
      TITLE: leadTitle,
      NAME: payload.lead?.name || DEFAULT_ACCOUNT_NAME,
      PHONE: payload.lead?.phone ? [{ VALUE: payload.lead.phone, VALUE_TYPE: "WORK" }] : [],
      EMAIL: payload.lead?.email ? [{ VALUE: payload.lead.email, VALUE_TYPE: "WORK" }] : [],
      COMMENTS: buildBitrixComment(payload),
      SOURCE_DESCRIPTION: payload.context?.landingUrl || "",
    },
  };
};

const buildLeadPayload = (form) => {
  hydrateLeadMeta(form);

  const data = new FormData(form);
  const hasQuantity = data.has("quantity_kg");
  const hasDistance = data.has("distance_km");
  const quantityKg = hasQuantity ? normalizePositiveNumber(data.get("quantity_kg")) : null;
  const distanceKm = hasDistance ? parseOptionalPositiveNumber(data.get("distance_km")) : null;
  const payload = {
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
      variant: (data.get("product_variant") || "").toString().trim(),
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

  payload.integration.bitrixLead = buildBitrixLeadEnvelope(payload);
  return payload;
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
    payload.product?.variant ? `Вариант: ${payload.product.variant}` : "",
    `Session ID: ${payload.context.sessionId}`,
    payload.utm.source ? `UTM Source: ${payload.utm.source}` : "",
    payload.utm.medium ? `UTM Medium: ${payload.utm.medium}` : "",
    payload.utm.campaign ? `UTM Campaign: ${payload.utm.campaign}` : "",
    payload.utm.content ? `UTM Content: ${payload.utm.content}` : "",
    payload.utm.term ? `UTM Term: ${payload.utm.term}` : "",
    payload.account?.profileId ? `Профиль: ${payload.account.profileId}` : "",
    payload.account?.cartItems?.length
      ? `Корзина: ${payload.account.cartItems
          .map((item) => `${item.shortName} x ${Math.max(1, Number(item.quantity) || 1)}`)
          .join(", ")}`
      : "",
    payload.account?.favoriteItems?.length
      ? `Избранное: ${payload.account.favoriteItems.map((item) => item.shortName).join(", ")}`
      : "",
    payload.account?.interestLabels?.length
      ? `Предпочтения: ${payload.account.interestLabels.join(", ")}`
      : "",
    "",
    "Комментарий:",
    payload.lead.message || "—",
  ].filter(Boolean);

  const body = encodeURIComponent(lines.join("\n"));

  return `${store.contact.emailHref}?subject=${subject}&body=${body}`;
};

const buildRuntimeMeta = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    landingUrl: window.location.href,
    pageTitle: document.title,
    referrer: document.referrer || "",
    submittedAt: new Date().toISOString(),
    sessionId: getLeadSessionId(),
    utm: {
      source: params.get("utm_source") || "",
      medium: params.get("utm_medium") || "",
      campaign: params.get("utm_campaign") || "",
      content: params.get("utm_content") || "",
      term: params.get("utm_term") || "",
    },
  };
};

const isGithubPagesRuntime = () =>
  /github\.io$/i.test(window.location.hostname) || window.location.pathname.startsWith("/sait-/");

const buildAccountRegistrationPayload = (form) => {
  const data = new FormData(form);
  const existingProfile = getAccountProfile();
  const preferredContactRaw = (data.get("contact_preferred") || "").toString().trim();
  const preferredContact = resolvePreferredContactKey(preferredContactRaw);
  const interestIds = data.getAll("interest_categories").map((item) => String(item).trim()).filter(Boolean);
  const runtime = buildRuntimeMeta();
  const cartItems = getCartItems();
  const favoriteItems = getFavoriteItems();
  const profile = {
    id: existingProfile?.id || createLocalId("gbacct"),
    registeredAt: existingProfile?.registeredAt || runtime.submittedAt,
    updatedAt: runtime.submittedAt,
    preferredContact,
    phone: (data.get("phone") || existingProfile?.phone || "").toString().trim(),
    email: (data.get("email") || existingProfile?.email || "").toString().trim(),
    telegramUsername: (data.get("telegram_username") || existingProfile?.telegramUsername || "")
      .toString()
      .trim(),
    interestIds,
    cartSnapshot: cartItems,
    favoriteSnapshot: favoriteItems,
  };

  const preferenceSummary = derivePreferenceSummary(profile);
  profile.preferenceCategoryIds = preferenceSummary.categoryIds;
  profile.preferenceCategoryNames = preferenceSummary.categoryNames;

  const payload = {
    lead: {
      name: existingProfile?.name || DEFAULT_ACCOUNT_NAME,
      phone: profile.phone,
      email: profile.email,
      telegramUsername: profile.telegramUsername,
      preferredContact,
      topic: "Регистрация аккаунта",
      message:
        "Пользователь сохранил аккаунт на сайте. Корзина, избранное и предпочтения добавлены в CRM snapshot.",
      consent: data.get("consent") === "on",
    },
    company: {
      name: "",
      inn: "",
      purchaseFormat: "",
    },
    context: {
      source: "account-registration",
      page: "account",
      landingUrl: runtime.landingUrl,
      pageTitle: runtime.pageTitle,
      referrer: runtime.referrer,
      submittedAt: runtime.submittedAt,
      sessionId: runtime.sessionId,
    },
    product: {
      id: "",
      name: "",
      category: preferenceSummary.categoryNames[0] || "",
      variant: "",
      marketplaceInterest: "",
    },
    order: {
      quantityKg: null,
      topic: "Регистрация аккаунта",
    },
    delivery: {
      address: "",
      distanceKm: null,
      distanceBlocks1000: null,
    },
    pricing: {
      basePricePerKg: 0,
      discountRate: 0,
      discountTier: "",
      distanceMarkupRate: 0,
      subtotalBase: 0,
      subtotalAfterDiscount: 0,
      totalEstimate: 0,
      estimatedPricePerKg: 0,
      currency: "RUB",
      isEstimate: false,
    },
    utm: runtime.utm,
    account: {
      profileId: profile.id,
      registeredAt: profile.registeredAt,
      updatedAt: profile.updatedAt,
      preferredContact,
      interestIds,
      interestLabels: preferenceSummary.categoryNames,
      cartItems,
      favoriteItems,
      cartCount: preferenceSummary.cartCount,
      favoriteCount: preferenceSummary.favoriteCount,
      storageMode: isGithubPagesRuntime() ? "browser-local" : "server-sync",
    },
    integration: {
      channelOrigin: "site",
      targets: ["bitrix24", "telegram"],
      crmStatusSeed: "new",
      crmPipelineSeed: "account_registration",
      payloadVersion: "v2",
    },
  };

  payload.integration.bitrixLead = buildBitrixLeadEnvelope(payload);

  return { profile, payload };
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

const setDistanceLookupState = (form, state, options = {}) => {
  const card = form.querySelector("[data-distance-card]");
  const valueNode = form.querySelector("[data-distance-value]");
  const helperNode = form.querySelector("[data-distance-helper]");
  const distanceField = form.elements.namedItem("distance_km");

  if (card) {
    card.dataset.distanceState = state;
  }

  if (state === "idle") {
    if (distanceField) distanceField.value = "";
    if (valueNode) valueNode.textContent = "Определим автоматически";
    if (helperNode) {
      helperNode.textContent = "Введите адрес доставки, и система посчитает расстояние по нему автоматически.";
    }
    updateQuoteSummary(form);
    return;
  }

  if (state === "loading") {
    if (distanceField) distanceField.value = "";
    if (valueNode) valueNode.textContent = "Определяем...";
    if (helperNode) {
      helperNode.textContent = "Проверяем расстояние от Москвы по указанному адресу.";
    }
    updateQuoteSummary(form);
    return;
  }

  if (state === "success") {
    const distanceKm = normalizePositiveNumber(options.distanceKm);
    if (distanceField) distanceField.value = String(distanceKm);
    if (valueNode) valueNode.textContent = `${distanceKm} км`;
    if (helperNode) {
      helperNode.textContent = "Расстояние рассчитано автоматически по введённому адресу доставки.";
    }
    updateQuoteSummary(form);
    return;
  }

  if (distanceField) distanceField.value = "";
  if (valueNode) valueNode.textContent = "Уточним вручную";
  if (helperNode) {
    helperNode.textContent =
      options.message || "Не удалось определить расстояние автоматически. Менеджер уточнит его после заявки.";
  }
  updateQuoteSummary(form);
};

const resolveAutoDistance = async (form, { force = false } = {}) => {
  const addressField = form.elements.namedItem("delivery_address");
  if (!(addressField instanceof HTMLInputElement)) return;

  const address = addressField.value.trim();
  if (!address || (!force && address.length < 3)) {
    form.dataset.distanceResolvedFor = "";
    setDistanceLookupState(form, "idle");
    return;
  }

  const normalizedAddress = address.toLowerCase();
  if (!force && form.dataset.distanceResolvedFor === normalizedAddress) {
    return;
  }

  const requestId = String(Number(form.dataset.distanceRequestId || "0") + 1);
  form.dataset.distanceRequestId = requestId;
  setDistanceLookupState(form, "loading");

  try {
    const result = await requestDistanceFromMoscow(address);
    if (form.dataset.distanceRequestId !== requestId) return;
    form.dataset.distanceResolvedFor = normalizedAddress;
    setDistanceLookupState(form, "success", {
      distanceKm: result.distanceKm,
      displayName: result.displayName,
    });
  } catch (error) {
    if (form.dataset.distanceRequestId !== requestId) return;
    form.dataset.distanceResolvedFor = "";
    setDistanceLookupState(form, "error", {
      message: error.message,
    });
  }
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

const resolvePreferredContactKey = (value = "") => {
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "email") return "email";
  if (normalized === "telegram") return "telegram";
  return "phone";
};

const syncPreferredContactField = (form) => {
  const preferredField = form.elements.namedItem("contact_preferred");
  if (!preferredField) return;

  const preferredKey = resolvePreferredContactKey(preferredField.value);
  const helper = form.querySelector("[data-contact-helper]");
  const slot = form.querySelector("[data-contact-slot]");

  $$("[data-contact-field]", form).forEach((field) => {
    const key = field.dataset.contactField;
    if (!key) return;
    if (!field) return;
    const active = key === preferredKey;
    field.classList.toggle("is-active", active);
    field.setAttribute("aria-hidden", active ? "false" : "true");
    field.querySelectorAll("input").forEach((input) => {
      input.disabled = !active;
      input.required = active;
      input.setAttribute("aria-required", active ? "true" : "false");
      if (!active) {
        input.setAttribute("tabindex", "-1");
      } else {
        input.removeAttribute("tabindex");
      }
    });
  });

  if (slot) {
    slot.dataset.activeContact = preferredKey;
  }

  if (helper) {
    helper.textContent =
      preferredKey === "email"
        ? "Укажите email, на который удобно получить ответ от менеджера."
        : preferredKey === "telegram"
          ? "Укажите Telegram username в формате @username, чтобы менеджер мог написать вам напрямую."
          : "Укажите телефон, чтобы менеджер мог быстро связаться и уточнить детали.";
  }
};

const bindQuoteCalculators = () => {
  $$("[data-quote-form]").forEach((form) => {
    const refresh = () => updateQuoteSummary(form);
    const addressField = form.elements.namedItem("delivery_address");
    let distanceTimer = null;

    const queueDistanceLookup = (force = false) => {
      if (distanceTimer) {
        window.clearTimeout(distanceTimer);
        distanceTimer = null;
      }

      if (force) {
        void resolveAutoDistance(form, { force: true });
        return;
      }

      distanceTimer = window.setTimeout(() => {
        void resolveAutoDistance(form);
      }, DISTANCE_LOOKUP_DEBOUNCE_MS);
    };

    form.addEventListener("input", refresh);
    form.addEventListener("change", refresh);
    refresh();

    if (addressField instanceof HTMLInputElement) {
      addressField.addEventListener("input", () => {
        form.dataset.distanceResolvedFor = "";
        setDistanceLookupState(form, addressField.value.trim() ? "loading" : "idle");
        queueDistanceLookup(false);
      });
      addressField.addEventListener("change", () => {
        queueDistanceLookup(true);
      });
      addressField.addEventListener("blur", () => {
        queueDistanceLookup(true);
      });
      void resolveAutoDistance(form, { force: Boolean(addressField.value.trim()) });
    } else {
      setDistanceLookupState(form, "idle");
    }
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
    syncPreferredContactField(form);

    const preferredField = form.elements.namedItem("contact_preferred");
    preferredField?.addEventListener("change", () => {
      syncPreferredContactField(form);
    });

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

const syncChoiceChips = (root = document) => {
  $$("input[type='checkbox']", root).forEach((input) => {
    const chip = input.closest(".choice-chip");
    if (!chip) return;
    chip.classList.toggle("is-selected", input.checked);
  });
};

const updateStoredActionState = (root = document) => {
  $$("[data-favorite-toggle]", root).forEach((button) => {
    const productItem = findProduct(button.dataset.productId || "");
    if (!productItem) return;
    const active = isFavoriteSaved(productItem);
    button.setAttribute("aria-pressed", active ? "true" : "false");
    button.textContent = active ? "В избранном" : "В избранное";
  });

  $$("[data-cart-add]", root).forEach((button) => {
    const productItem = findProduct(button.dataset.productId || "");
    if (!productItem) return;
    const quantity = getCartQuantityForProduct(productItem, button.dataset.productVariant || "");
    button.textContent = quantity > 0 ? `В корзине ×${quantity}` : "В корзину";
  });
};

const refreshStatefulUi = ({ accountMessage = "", accountTone = "" } = {}) => {
  updateHeaderState();

  if (
    document.body.dataset.page === "utility" &&
    ["account", "cart", "favorites"].includes(document.body.dataset.utility || "")
  ) {
    renderUtilityPage();
  }

  bindStoredProductActions();
  bindAccountRegistrationForms();
  syncChoiceChips();
  updateStoredActionState();

  if (accountMessage && document.body.dataset.utility === "account") {
    const form = $("[data-account-registration-form]");
    if (form) setRequestStatus(form, accountMessage, accountTone);
  }
};

const bindStoredProductActions = (root = document) => {
  $$("[data-cart-add]", root).forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      const productItem = findProduct(button.dataset.productId || "");
      if (!productItem) return;
      const variant = resolveProductVariant(productItem, button.dataset.productVariant || "");
      addProductToCart(productItem, variant, button.dataset.actionSource || "site");
      refreshStatefulUi();
    });
  });

  $$("[data-favorite-toggle]", root).forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      const productItem = findProduct(button.dataset.productId || "");
      if (!productItem) return;
      const variant = resolveProductVariant(productItem, button.dataset.productVariant || "");
      toggleFavoriteProduct(productItem, variant, button.dataset.actionSource || "site");
      refreshStatefulUi();
    });
  });

  $$("[data-cart-quantity-action]", root).forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      const entryId = button.dataset.entryId || "";
      const entry = getCartItems().find((item) => item.entryId === entryId);
      if (!entry) return;
      const delta = button.dataset.cartQuantityAction === "decrease" ? -1 : 1;
      updateCartItemQuantity(entryId, Math.max(0, Math.max(1, Number(entry.quantity) || 1) + delta));
      refreshStatefulUi();
    });
  });

  $$("[data-cart-remove]", root).forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      removeCartItem(button.dataset.entryId || "");
      refreshStatefulUi();
    });
  });

  $$("[data-favorite-remove]", root).forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      removeFavoriteItem(button.dataset.productId || "");
      refreshStatefulUi();
    });
  });

  updateStoredActionState(root);
};

const bindAccountRegistrationForms = (root = document) => {
  $$("[data-account-registration-form]", root).forEach((form) => {
    if (form.dataset.bound === "true") return;
    form.dataset.bound = "true";
    syncPreferredContactField(form);
    syncChoiceChips(form);

    const preferredField = form.elements.namedItem("contact_preferred");
    preferredField?.addEventListener("change", () => {
      syncPreferredContactField(form);
    });

    $$("input[name='interest_categories']", form).forEach((input) => {
      input.addEventListener("change", () => syncChoiceChips(form));
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (form.dataset.submitting === "true") return;
      if (!form.reportValidity()) return;

      const { profile, payload } = buildAccountRegistrationPayload(form);
      form.dataset.submitting = "true";
      setFormSubmittingState(form, true);
      setRequestStatus(form, "Сохраняем аккаунт…", "loading");

      setAccountProfile(profile);
      writeJsonStorage(STORAGE_KEYS.lastAccountPayload, payload);

      try {
        if (isGithubPagesRuntime()) {
          refreshStatefulUi({
            accountMessage:
              "Аккаунт сохранён в браузере. Корзина, избранное и предпочтения теперь привязаны к этому профилю, а CRM-ready payload собран для Bitrix24.",
            accountTone: "success",
          });
          return;
        }

        const result = await submitLeadPayload(payload);
        const syncedProfile = {
          ...profile,
          crmRequestId: result.requestId,
          syncedAt: toIsoNow(),
        };
        setAccountProfile(syncedProfile);
        refreshStatefulUi({
          accountMessage:
            result?.bitrix?.ok === true
              ? `Аккаунт сохранён. CRM-снимок отправлен в Telegram и подготовлен для Bitrix24, номер обращения: ${result.requestId}.`
              : `Аккаунт сохранён. CRM-снимок отправлен, номер обращения: ${result.requestId}.`,
          accountTone: "success",
        });
      } catch (error) {
        refreshStatefulUi({
          accountMessage:
            "Аккаунт сохранён локально, но серверный маршрут сейчас недоступен. Профиль, корзина и предпочтения всё равно сохранены в этом браузере, а CRM-ready payload подготовлен.",
          accountTone: "error",
        });
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
  bindCompactHeader();
  bindSearchForms();
  bindFaq();
  bindQuoteCalculators();
  bindRequestForms();
  bindStoredProductActions();
  bindAccountRegistrationForms();
  syncChoiceChips();
  updateHeaderState();
  applyCatalogToolbarState();
});
