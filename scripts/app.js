const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const params = new URLSearchParams(window.location.search);
const body = document.body;

const storageKeys = {
  session: "gb-session-id",
  firstTouch: "gb-first-touch",
};

const intentMessages = {
  product: {
    pdp: {
      title: "Вы на официальном сайте бренда Global Basket",
      text: "Здесь собран расширенный контекст о продукте, официальные каналы покупки и быстрый путь к поддержке.",
      href: "/where-to-buy/",
      label: "Официальные каналы покупки",
    },
    wholesale: {
      title: "Для корпоративных объёмов используйте отдельный B2B-маршрут",
      text: "Если вам нужен объём для бизнеса, переходите на B2B-страницу: так запрос попадёт в правильную воронку.",
      href: "/b2b/?source=wholesale",
      label: "Открыть B2B-страницу",
    },
  },
  contacts: {
    wholesale: {
      title: "Корпоративный сценарий вынесен отдельно",
      text: "Контактная страница остаётся роутером по сценариям, а полноценная B2B-заявка живёт на отдельной странице.",
      href: "/b2b/?source=wholesale",
      label: "Перейти в B2B",
    },
    returns: {
      title: "Для претензий и сервисных вопросов используйте выделенный маршрут",
      text: "На этой странице вы можете выбрать Telegram, телефон, email или короткую форму без смешивания с B2B-потоком.",
      href: "https://t.me/global_basket_bot?start=complaint",
      label: "Оставить претензию",
    },
  },
  b2b: {
    wholesale: {
      title: "B2B-маршрут активирован",
      text: "Форма уже настроена под корпоративный запрос и сохранит продуктовый, page и attribution-контекст.",
      href: "#b2b-form",
      label: "Заполнить форму",
    },
  },
};

const analytics = {
  track(eventName, params = {}) {
    const payload = {
      event: eventName,
      page_type: body.dataset.page || "",
      page_slug: body.dataset.pageSlug || "",
      source: new URLSearchParams(window.location.search).get("source") || "",
      ...params,
    };

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);

    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, params);
    }

    const metrikaId = window.GB_METRIKA_ID;
    if (typeof window.ym === "function" && metrikaId) {
      window.ym(metrikaId, "reachGoal", eventName, params);
    }

    window.dispatchEvent(new CustomEvent("gb:track", { detail: payload }));
  },
};

const getSessionId = () => {
  let value = window.sessionStorage.getItem(storageKeys.session);
  if (!value) {
    value = `gb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    window.sessionStorage.setItem(storageKeys.session, value);
  }
  return value;
};

const pickUtmPayload = () => ({
  utm_source: params.get("utm_source") || "",
  utm_medium: params.get("utm_medium") || "",
  utm_campaign: params.get("utm_campaign") || "",
  utm_content: params.get("utm_content") || "",
  utm_term: params.get("utm_term") || "",
});

const rememberFirstTouch = () => {
  const current = pickUtmPayload();
  const hasAny = Object.values(current).some(Boolean);
  if (!hasAny) return;

  const existing = window.localStorage.getItem(storageKeys.firstTouch);
  if (!existing) {
    window.localStorage.setItem(storageKeys.firstTouch, JSON.stringify(current));
  }
};

const readFirstTouch = () => {
  try {
    return JSON.parse(window.localStorage.getItem(storageKeys.firstTouch) || "{}");
  } catch {
    return {};
  }
};

const setFieldValue = (form, name, value) => {
  const field = form.elements.namedItem(name);
  if (!field) return;
  field.value = value;
};

const resolveSource = () => params.get("source") || "";

const applyIntentBanner = () => {
  const source = resolveSource();
  if (!source) return;

  const pageMessages = intentMessages[body.dataset.page] || {};
  const config = pageMessages[source];
  const mount = $("[data-intent-banner]");
  if (!mount || !config) return;

  mount.hidden = false;
  mount.innerHTML = `
    <strong>${config.title}</strong>
    <span>${config.text}</span>
    <a href="${config.href}">${config.label}</a>
  `;
  body.dataset.intent = source;
};

const inferContactTopic = (source) => {
  if (source === "pdp") return "Вопрос по товару";
  if (source === "returns") return "Претензия";
  if (source === "catalog") return "Где купить";
  return "";
};

const inferContactIntent = (source) => {
  if (source === "returns") return "complaint";
  if (source === "wholesale") return "wholesale";
  if (source === "pdp") return "product_question";
  return "support";
};

const hydrateForms = () => {
  const source = resolveSource();
  const currentUtm = pickUtmPayload();
  const firstTouch = readFirstTouch();
  const sessionId = getSessionId();
  const timestamp = new Date().toISOString();

  $$("[data-lead-form]").forEach((form) => {
    setFieldValue(form, "source", source || form.elements.namedItem("source")?.value || "");
    setFieldValue(form, "page_url", window.location.href);
    setFieldValue(form, "referrer", document.referrer || "");
    setFieldValue(form, "session_id", sessionId);
    setFieldValue(form, "submitted_at", timestamp);

    Object.entries(currentUtm).forEach(([name, value]) => setFieldValue(form, name, value));
    setFieldValue(form, "first_utm_source", firstTouch.utm_source || "");
    setFieldValue(form, "first_utm_medium", firstTouch.utm_medium || "");
    setFieldValue(form, "first_utm_campaign", firstTouch.utm_campaign || "");

    const formType = form.elements.namedItem("form_type")?.value;

    if (formType === "contact") {
      const topicField = form.elements.namedItem("topic");
      const hiddenIntent = form.elements.namedItem("intent");
      const inferredTopic = inferContactTopic(source);

      if (topicField && inferredTopic && Array.from(topicField.options).some((option) => option.value === inferredTopic)) {
        topicField.value = inferredTopic;
      }

      if (hiddenIntent) {
        hiddenIntent.value = inferContactIntent(source);
      }
    }

    if (formType === "b2b" && source === "wholesale") {
      setFieldValue(form, "intent", "wholesale");
    }
  });
};

const markFieldError = (field, message) => {
  field.setAttribute("aria-invalid", "true");
  field.dataset.error = message;
};

const clearFieldErrors = (form) => {
  $$("[aria-invalid='true']", form).forEach((field) => field.removeAttribute("aria-invalid"));
  $$("[data-error-summary]", form).forEach((node) => node.remove());
};

const renderErrorSummary = (form, messages) => {
  const summary = document.createElement("div");
  summary.className = "form-summary";
  summary.setAttribute("data-error-summary", "");
  summary.setAttribute("tabindex", "-1");
  summary.innerHTML = `
    <strong>Проверьте форму</strong>
    <ul>${messages.map((message) => `<li>${message}</li>`).join("")}</ul>
  `;

  form.prepend(summary);
  summary.focus();
};

const validateForm = (form) => {
  clearFieldErrors(form);
  const invalidFields = [];

  $$("input, select, textarea", form).forEach((field) => {
    if (field.type === "hidden" || field.disabled) return;

    if (!field.checkValidity()) {
      invalidFields.push(field.validationMessage);
      markFieldError(field, field.validationMessage);
    }
  });

  if (!invalidFields.length) return true;

  renderErrorSummary(form, invalidFields);
  const firstInvalid = $("[aria-invalid='true']", form);
  firstInvalid?.focus();
  return false;
};

const normalizePhone = (value = "") => value.trim();

const buildPayload = (form) => {
  const data = new FormData(form);
  const formType = (data.get("form_type") || "").toString();
  const baseContext = {
    source: (data.get("source") || "").toString(),
    pageType: (data.get("page_type") || "").toString(),
    pageSlug: (data.get("page_slug") || "").toString(),
    pageUrl: (data.get("page_url") || "").toString(),
    referrer: (data.get("referrer") || "").toString(),
    productId: (data.get("product_id") || "").toString(),
    productName: (data.get("product_name") || "").toString(),
    categoryId: (data.get("category_id") || "").toString(),
    sessionId: (data.get("session_id") || "").toString(),
    timestamp: (data.get("submitted_at") || "").toString(),
  };

  const attribution = {
    utmSource: (data.get("utm_source") || "").toString(),
    utmMedium: (data.get("utm_medium") || "").toString(),
    utmCampaign: (data.get("utm_campaign") || "").toString(),
    utmContent: (data.get("utm_content") || "").toString(),
    utmTerm: (data.get("utm_term") || "").toString(),
    firstUtmSource: (data.get("first_utm_source") || "").toString(),
    firstUtmMedium: (data.get("first_utm_medium") || "").toString(),
    firstUtmCampaign: (data.get("first_utm_campaign") || "").toString(),
  };

  if (formType === "b2b") {
    return {
      formType: "b2b",
      intent: (data.get("intent") || "wholesale").toString(),
      contact: {
        companyName: (data.get("company_name") || "").toString().trim(),
        contactName: (data.get("contact_name") || "").toString().trim(),
        phone: normalizePhone((data.get("phone") || "").toString()),
        email: (data.get("email") || "").toString().trim(),
        city: (data.get("city") || "").toString().trim(),
        businessType: (data.get("business_type") || "").toString().trim(),
        preferredContact: (data.get("preferred_contact") || "").toString().trim(),
      },
      request: {
        productInterest: (data.get("product_interest") || "").toString().trim(),
        estimatedVolume: (data.get("estimated_volume") || "").toString().trim(),
        frequency: (data.get("frequency") || "").toString().trim(),
        comment: (data.get("comment") || "").toString().trim(),
      },
      consent: {
        accepted: data.get("consent") === "on",
        acceptedAt: baseContext.timestamp,
      },
      context: baseContext,
      attribution,
      honeypot: (data.get("company_website") || "").toString(),
    };
  }

  return {
    formType: "contact",
    intent: (data.get("intent") || "support").toString(),
    contact: {
      contactName: (data.get("contact_name") || "").toString().trim(),
      phone: normalizePhone((data.get("phone") || "").toString()),
      email: (data.get("email") || "").toString().trim(),
      preferredContact: (data.get("preferred_contact") || "").toString().trim(),
    },
    request: {
      topic: (data.get("topic") || "").toString().trim(),
      comment: (data.get("comment") || "").toString().trim(),
    },
    consent: {
      accepted: data.get("consent") === "on",
      acceptedAt: baseContext.timestamp,
    },
    context: baseContext,
    attribution,
    honeypot: (data.get("company_website") || "").toString(),
  };
};

const setStatus = (form, message, tone = "") => {
  const status = $("[data-form-status]", form);
  if (!status) return;
  status.className = "form-status";
  if (tone) status.classList.add(`is-${tone}`);
  status.innerHTML = message;
};

const submitForm = async (form, payload) => {
  const response = await fetch(form.action, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    throw new Error(data.message || "Не удалось отправить форму.");
  }

  return data;
};

const bindForms = () => {
  $$("[data-lead-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!validateForm(form)) return;

      const payload = buildPayload(form);
      const submitButton = $("button[type='submit']", form);
      submitButton?.setAttribute("disabled", "true");

      const trackBase = {
        form_type: payload.formType,
        intent: payload.intent,
        source: payload.context.source,
        product_id: payload.context.productId,
      };

      analytics.track(
        payload.formType === "b2b" ? "b2b_form_submit" : "contact_form_submit",
        trackBase,
      );

      setStatus(form, "Отправляем заявку…", "loading");

      try {
        const result = await submitForm(form, payload);
        const successMessage = `
          <strong>Готово.</strong>
          <span>${result.message || "Заявка отправлена."}${result.requestId ? ` Номер обращения: ${result.requestId}.` : ""}</span>
        `;

        setStatus(form, successMessage, "success");
        analytics.track(
          payload.formType === "b2b" ? "b2b_form_success" : "contact_form_success",
          {
            ...trackBase,
            request_id: result.requestId || "",
            delivery_mode: result.deliveryMode || "",
          },
        );
        form.reset();
        hydrateForms();
      } catch (error) {
        setStatus(
          form,
          `
            <strong>Не удалось отправить форму.</strong>
            <span>${error.message}</span>
            <span class="form-status__links">
              <a href="${body.dataset.page === "b2b" ? "https://t.me/global_basket_bot?start=site_b2b_form_error" : "https://t.me/global_basket_bot?start=site_support"}">Telegram</a>
              <a href="mailto:hello@globalbasket.ru">Email</a>
            </span>
          `,
          "error",
        );
        analytics.track(
          payload.formType === "b2b" ? "b2b_form_error" : "contact_form_error",
          trackBase,
        );
      } finally {
        submitButton?.removeAttribute("disabled");
      }
    });
  });
};

const bindTrackedLinks = () => {
  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-track-event]");
    if (!target) return;

    const eventName = target.dataset.trackEvent;
    const params = Object.fromEntries(
      Object.entries(target.dataset)
        .filter(([key]) => key.startsWith("track") && key !== "trackEvent")
        .map(([key, value]) => [key.replace(/^track/, "").replace(/^[A-Z]/, (letter) => letter.toLowerCase()), value]),
    );

    analytics.track(eventName, params);
  });
};

const bindCatalogSearch = () => {
  if (body.dataset.page !== "catalog") return;

  const form = $("[data-catalog-search]");
  const input = $("input[name='q']", form);
  const items = $$("[data-catalog-item]");
  const count = $("[data-catalog-count]");

  if (!form || !input || !items.length || !count) return;

  input.value = params.get("q") || "";

  const applyFilter = () => {
    const query = input.value.trim().toLowerCase();
    let visibleCount = 0;

    items.forEach((item) => {
      const haystack = (item.dataset.search || "").toLowerCase();
      const visible = !query || haystack.includes(query);
      item.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    count.textContent = `Показано: ${visibleCount}`;
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const next = new URLSearchParams(window.location.search);
    if (input.value.trim()) {
      next.set("q", input.value.trim());
    } else {
      next.delete("q");
    }

    const nextQuery = next.toString();
    const nextUrl = nextQuery ? `/catalog/?${nextQuery}` : "/catalog/";
    window.history.replaceState({}, "", nextUrl);
    applyFilter();
  });

  applyFilter();
};

const bindMenu = () => {
  const toggle = $("[data-menu-toggle]");
  const menu = $("[data-mobile-menu]");
  if (!toggle || !menu) return;

  let previousFocus = null;

  const close = () => {
    menu.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    previousFocus?.focus?.();
  };

  const open = () => {
    previousFocus = document.activeElement;
    menu.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    $("a, button", menu)?.focus();
  };

  toggle.addEventListener("click", () => {
    if (menu.hidden) {
      open();
      return;
    }
    close();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !menu.hidden) {
      close();
    }
  });
};

const trackArticleOpen = () => {
  if (body.dataset.page !== "article") return;
  analytics.track("journal_article_open", { slug: body.dataset.pageSlug || "", location: "article_page" });
};

rememberFirstTouch();
applyIntentBanner();
hydrateForms();
bindForms();
bindTrackedLinks();
bindCatalogSearch();
bindMenu();
trackArticleOpen();

window.GlobalBasketAnalytics = analytics;
