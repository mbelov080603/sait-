import {
  leadRequestTypes,
  leadCommentDrivenRequestTypes,
  leadFrequencyDrivenRequestTypes,
  leadQuoteDrivenRequestTypes,
  normalizeLeadRequestInput,
  validateLeadRequest,
} from "./lead-form-shared.mjs";

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
      title: "Вы на сайте бренда Global Basket",
      text: "Здесь можно посмотреть товар подробнее, выбрать канал покупки и быстро перейти в поддержку.",
      href: "/where-to-buy/",
      label: "Где купить",
    },
    wholesale: {
      title: "Нужен объём для бизнеса?",
      text: "Для поставок, офиса, HoReCa и корпоративных заказов используйте отдельную B2B-страницу.",
      href: "/b2b/?source=wholesale",
      label: "Перейти в B2B",
    },
  },
  contacts: {
    pdp: {
      title: "Вопрос по товару",
      text: "Можно написать о продукте, покупке или упаковке. Тема обращения уже выбрана.",
      href: "#contact-form",
      label: "Открыть форму",
    },
    wholesale: {
      title: "Для опта лучше оставить заявку",
      text: "Если речь о поставке или корпоративном заказе, начните с B2B-страницы или оставьте короткий запрос здесь.",
      href: "/b2b/?source=wholesale",
      label: "Перейти в B2B",
    },
    support: {
      title: "Поддержка и претензии",
      text: "Выберите удобный канал: Telegram, телефон, email или короткую форму.",
      href: "#contact-form",
      label: "Открыть форму",
    },
    returns: {
      title: "Здесь можно оставить претензию или сервисный вопрос",
      text: "Если проблема связана с заказом или товаром, выберите удобный канал и оставьте обращение.",
      href: "https://t.me/global_basket_bot?start=complaint",
      label: "Оставить претензию",
    },
  },
  b2b: {
    wholesale: {
      title: "Оставьте заявку для бизнеса",
      text: "Укажите компанию, контакт и задачу. Остальное команда уточнит после обращения.",
      href: "#b2b-form",
      label: "Заполнить форму",
    },
  },
};

const contactHeroStates = {
  pdp: {
    title: "Вопрос по товару",
    text: "Если хотите уточнить продукт, покупку или упаковку, напишите здесь или выберите прямой канал связи.",
  },
  wholesale: {
    title: "Контакты для опта и бизнеса",
    text: "Если нужен оптовый или корпоративный запрос, лучше сразу оставить B2B-заявку или коротко описать задачу в форме.",
  },
  support: {
    title: "Поддержка Global Basket",
    text: "Здесь можно быстро написать по покупке, сервисному вопросу или претензии.",
  },
  returns: {
    title: "Претензии и сервисные вопросы",
    text: "Если вопрос связан с заказом или товаром, выберите удобный канал и оставьте обращение.",
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

const applyContactIntentState = () => {
  if (body.dataset.page !== "contacts") return;

  const source = resolveSource();
  const heroState = contactHeroStates[source];
  const title = $("[data-intent-hero-title]");
  const text = $("[data-intent-hero-text]");

  if (heroState && title && text) {
    title.textContent = heroState.title;
    text.textContent = heroState.text;
  }

  $$("[data-intent-route]").forEach((card) => {
    const active = card.dataset.intentRoute === source;
    card.classList.toggle("is-active", active);
    if (active) {
      card.setAttribute("data-active-intent", "true");
    } else {
      card.removeAttribute("data-active-intent");
    }
  });
};

const inferContactTopic = (source) => {
  if (source === "pdp") return "Вопрос по товару";
  if (source === "wholesale") return "Оптовый запрос";
  if (source === "support") return "Поддержка";
  if (source === "returns") return "Претензия";
  if (source === "catalog") return "Где купить";
  return "";
};

const inferContactIntent = (source) => {
  if (source === "wholesale") return "wholesale";
  if (source === "returns") return "complaint";
  if (source === "support") return "support";
  if (source === "pdp") return "product_question";
  return "support";
};

const leadFormViews = new WeakSet();
const leadFormStarts = new WeakSet();
const leadRequestTypeLabels = Object.fromEntries(
  leadRequestTypes.map((item) => [item.value, item.label]),
);

const createStatusLinks = (source = "") => `
  <span class="form-status__links">
    <a href="https://t.me/global_basket_bot?start=${source || "site_wholesale"}" data-track-event="lead_form_fallback_click_telegram" data-track-location="status">Telegram</a>
    <a href="tel:+79773384640" data-track-event="lead_form_fallback_click_phone" data-track-location="status">Телефон</a>
    <a href="mailto:hello@globalbasket.ru" data-track-event="lead_form_fallback_click_email" data-track-location="status">Email</a>
  </span>
`;

const getFieldNodes = (form, name) => {
  const elements = form.elements.namedItem(name);
  if (!elements) return [];
  if (typeof elements.length === "number" && !elements.tagName) {
    return Array.from(elements);
  }
  return [elements];
};

const getFieldGroup = (form, name) => form.querySelector(`[data-field-group="${name}"]`);

const clearLeadValidationErrors = (form) => {
  $$("[aria-invalid='true']", form).forEach((field) => {
    field.removeAttribute("aria-invalid");
    field.removeAttribute("aria-describedby");
  });
  $$(".is-invalid", form).forEach((node) => node.classList.remove("is-invalid"));
  $$(".field-error", form).forEach((node) => node.remove());
  $$("[data-error-summary]", form).forEach((node) => node.remove());
};

const appendFieldError = (target, name, message) => {
  if (!target || !message) return;
  const errorId = `error-${name}`;
  let errorNode = target.querySelector(`.field-error#${CSS.escape(errorId)}`);

  if (!errorNode) {
    errorNode = document.createElement("span");
    errorNode.className = "field-error";
    errorNode.id = errorId;
    target.append(errorNode);
  }

  errorNode.textContent = message;
};

const markLeadFieldError = (form, name, message) => {
  const group = getFieldGroup(form, name);
  const nodes = getFieldNodes(form, name);

  if (group) {
    group.classList.add("is-invalid");
    appendFieldError(group, name, message);
    nodes.forEach((node) => {
      node.setAttribute("aria-invalid", "true");
      node.setAttribute("aria-describedby", `error-${name}`);
    });
    return;
  }

  nodes.forEach((node) => {
    node.setAttribute("aria-invalid", "true");
    node.setAttribute("aria-describedby", `error-${name}`);
    const container = node.closest("label") || node.parentElement;
    if (container) {
      container.classList.add("is-invalid");
      appendFieldError(container, name, message);
    }
  });
};

const renderLeadErrorSummary = (form, messages) => {
  const summary = document.createElement("div");
  summary.className = "form-summary";
  summary.setAttribute("data-error-summary", "");
  summary.setAttribute("tabindex", "-1");
  summary.setAttribute("role", "alert");
  summary.innerHTML = `
    <strong>Проверьте форму</strong>
    <ul>${messages.map((message) => `<li>${message}</li>`).join("")}</ul>
  `;
  form.prepend(summary);
  summary.focus();
};

const setLeadStatus = (form, html, tone = "", role = "status") => {
  const status = $("[data-form-status]", form);
  if (!status) return;
  status.className = "form-status";
  if (tone) status.classList.add(`is-${tone}`);
  status.setAttribute("role", role);
  status.innerHTML = html;
};

const setFieldRequired = (form, name, required) => {
  getFieldNodes(form, name).forEach((field, index) => {
    if (!field) return;
    if (field.type === "radio" || field.type === "checkbox") {
      if (required && index === 0) {
        field.setAttribute("required", "true");
      } else {
        field.removeAttribute("required");
      }
      field.setAttribute("aria-required", required ? "true" : "false");
      return;
    }

    if (required) {
      field.setAttribute("required", "true");
      field.setAttribute("aria-required", "true");
    } else {
      field.removeAttribute("required");
      field.removeAttribute("aria-required");
    }
  });
};

const setRegionHidden = (region, hidden) => {
  if (!region) return;
  region.hidden = hidden;
  $$("input, select, textarea", region).forEach((field) => {
    field.disabled = hidden;
  });
};

const getCheckedValue = (form, name) => {
  const checked = form.querySelector(`input[name="${name}"]:checked`);
  return checked?.value || "";
};

const buildLeadFormPayload = (form) => {
  const data = new FormData(form);
  const firstTouch = readFirstTouch();
  const currentUtm = pickUtmPayload();

  return normalizeLeadRequestInput({
    requestType: getCheckedValue(form, "request_type") || form.dataset.defaultIntent || "",
    businessType: (data.get("business_type") || "").toString(),
    productInterest: data.getAll("product_interest").map((value) => value.toString()),
    estimatedVolume: (data.get("estimated_volume") || "").toString(),
    exactVolumeKg: (data.get("exact_volume_kg") || "").toString(),
    purchaseFrequency: (data.get("purchase_frequency") || "").toString(),
    city: (data.get("city") || "").toString(),
    deliveryFormat: (data.get("delivery_format") || "").toString(),
    targetDate: (data.get("target_date") || "").toString(),
    packagingNeeds: (data.get("packaging_needs") || "").toString(),
    needCommercialOffer: data.get("need_commercial_offer") === "on",
    fullAddress: (data.get("full_address") || "").toString(),
    comment: (data.get("comment") || "").toString(),
    companyName: (data.get("company_name") || "").toString(),
    contactName: (data.get("contact_name") || "").toString(),
    preferredContactMethod: getCheckedValue(form, "preferred_contact_method") || "Телефон",
    phone: (data.get("phone") || "").toString(),
    email: (data.get("email") || "").toString(),
    telegramUsername: (data.get("telegram_username") || "").toString(),
    inn: (data.get("inn") || "").toString(),
    consent: data.get("consent") === "on",
    honeypot: (data.get("company_website") || "").toString(),
    context: {
      sourceParam: resolveSource() || form.dataset.sourceParam || "",
      pageType: form.dataset.pageType || body.dataset.page || "",
      pageSlug: form.dataset.pageSlug || body.dataset.pageSlug || "",
      formVariant: form.dataset.formVariant || "",
      pageUrl: window.location.href,
      pageTitle: document.title,
      referrer: document.referrer || "",
      productId: form.dataset.productId || "",
      productSlug: form.dataset.productSlug || "",
      productName: form.dataset.productName || "",
      categoryContext: form.dataset.categoryContext || "",
      submittedAt: new Date().toISOString(),
      locale: document.documentElement.lang || navigator.language || "ru",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    },
    attribution: {
      utmSource: currentUtm.utm_source || "",
      utmMedium: currentUtm.utm_medium || "",
      utmCampaign: currentUtm.utm_campaign || "",
      utmContent: currentUtm.utm_content || "",
      utmTerm: currentUtm.utm_term || "",
      firstUtmSource: firstTouch.utm_source || "",
      firstUtmMedium: firstTouch.utm_medium || "",
      firstUtmCampaign: firstTouch.utm_campaign || "",
    },
  });
};

const validateLeadForm = (form, payload) => {
  clearLeadValidationErrors(form);
  const result = validateLeadRequest(payload);

  Object.entries(result.fieldErrors).forEach(([name, message]) => {
    markLeadFieldError(form, name, message);
  });

  if (!result.valid) {
    renderLeadErrorSummary(form, result.errors);
    const firstInvalid =
      form.querySelector("[aria-invalid='true']") ||
      form.querySelector(".is-invalid input, .is-invalid textarea, .is-invalid select, .is-invalid button");
    firstInvalid?.focus();
  }

  return result;
};

const buildLeadSuccessMarkup = (payload, result) => `
  <strong>Спасибо, заявку получили.</strong>
  <span>${result.message || "Менеджер Global Basket свяжется с вами, чтобы уточнить объём, формат поставки и дальнейшие условия."}</span>
  <div class="form-status__details">
    <span>Тип запроса: ${leadRequestTypeLabels[payload.requestType] || payload.requestType}</span>
    <span>Компания: ${payload.companyName}</span>
    <span>Город: ${payload.city}</span>
    ${result.requestId ? `<span>Номер заявки: ${result.requestId}</span>` : ""}
  </div>
  ${createStatusLinks("site_wholesale")}
`;

const applyServerErrors = (form, data = {}) => {
  clearLeadValidationErrors(form);
  const errors = data.errors || [];
  const fieldErrors = data.fieldErrors || {};

  Object.entries(fieldErrors).forEach(([name, message]) => {
    markLeadFieldError(form, name, message);
  });

  if (errors.length) {
    renderLeadErrorSummary(form, errors);
  }
};

const submitLeadForm = async (form, payload) => {
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
    const error = new Error(data.message || "Не удалось отправить заявку.");
    error.payload = data;
    error.status = response.status;
    throw error;
  }

  return data;
};

const syncLeadFormState = (form) => {
  const requestType = getCheckedValue(form, "request_type") || form.dataset.defaultIntent || "";
  const preferredContactMethod = getCheckedValue(form, "preferred_contact_method") || "Телефон";
  const quoteToggle = form.elements.namedItem("need_commercial_offer");
  const quoteToggleGroup = getFieldGroup(form, "need_commercial_offer");

  if (leadQuoteDrivenRequestTypes.has(requestType) && quoteToggle) {
    quoteToggle.checked = true;
  }

  const needsQuoteDetails = Boolean(quoteToggle?.checked);
  $$("[data-quote-details]", form).forEach((region) => setRegionHidden(region, !needsQuoteDetails));

  const telegramField = form.querySelector('[data-conditional-field="telegram"]');
  const showTelegram = preferredContactMethod === "Telegram";
  if (telegramField) {
    telegramField.hidden = !showTelegram;
    $$("input", telegramField).forEach((field) => {
      field.disabled = !showTelegram;
    });
  }

  const contactHelper = $("[data-contact-helper]", form);
  if (contactHelper) {
    contactHelper.textContent =
      preferredContactMethod === "Telegram"
        ? "Укажите Telegram username. Телефон или email можно оставить как резервный канал."
        : preferredContactMethod === "Email"
          ? "Укажите email, на который удобно получить условия или коммерческое предложение."
          : "Укажите телефон, чтобы менеджер мог быстро связаться и уточнить детали.";
  }

  setFieldRequired(form, "company_name", true);
  setFieldRequired(form, "contact_name", true);
  setFieldRequired(form, "business_type", true);
  setFieldRequired(form, "estimated_volume", true);
  setFieldRequired(form, "city", true);
  setFieldRequired(form, "consent", true);

  setFieldRequired(form, "phone", preferredContactMethod === "Телефон");
  setFieldRequired(form, "email", preferredContactMethod === "Email" || leadQuoteDrivenRequestTypes.has(requestType));
  setFieldRequired(form, "telegram_username", preferredContactMethod === "Telegram");
  setFieldRequired(form, "purchase_frequency", leadFrequencyDrivenRequestTypes.has(requestType));
  setFieldRequired(form, "comment", leadCommentDrivenRequestTypes.has(requestType));

  if (quoteToggleGroup) {
    quoteToggleGroup.classList.toggle("is-active", needsQuoteDetails);
  }
};

const bindLeadFormTracking = (form) => {
  if (!leadFormViews.has(form)) {
    analytics.track("lead_form_view", {
      page_type: form.dataset.pageType || body.dataset.page || "",
      form_variant: form.dataset.formVariant || "",
      source_param: resolveSource() || form.dataset.sourceParam || "",
      product_id: form.dataset.productId || "",
    });
    leadFormViews.add(form);
  }

  const trackStart = () => {
    if (leadFormStarts.has(form)) return;
    leadFormStarts.add(form);
    analytics.track("lead_form_start", {
      page_type: form.dataset.pageType || body.dataset.page || "",
      form_variant: form.dataset.formVariant || "",
      source_param: resolveSource() || form.dataset.sourceParam || "",
      product_id: form.dataset.productId || "",
    });
  };

  form.addEventListener("input", trackStart, { passive: true });
  form.addEventListener("change", trackStart, { passive: true });
  form.addEventListener("change", (event) => {
    const field = event.target;
    if (!(field instanceof HTMLElement)) return;

    if (field.matches('input[name="request_type"]')) {
      analytics.track("lead_form_request_type_select", {
        value: field.value,
        form_variant: form.dataset.formVariant || "",
      });
    }

    if (field.matches('select[name="business_type"]')) {
      analytics.track("lead_form_business_type_select", {
        value: field.value,
        form_variant: form.dataset.formVariant || "",
      });
    }

    if (field.matches('input[name="need_commercial_offer"]')) {
      analytics.track("lead_form_need_quote_toggle", {
        value: field.checked ? "on" : "off",
        form_variant: form.dataset.formVariant || "",
      });
    }
  });
};

const bindLeadForms = () => {
  $$("[data-form-role='b2b']").forEach((form) => {
    syncLeadFormState(form);
    bindLeadFormTracking(form);

    form.addEventListener("change", () => {
      syncLeadFormState(form);
      clearLeadValidationErrors(form);
      setLeadStatus(form, "");
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = buildLeadFormPayload(form);
      const validation = validateLeadForm(form, payload);
      if (!validation.valid) return;

      const submitButton = $("button[type='submit']", form);
      submitButton?.setAttribute("disabled", "true");
      setLeadStatus(form, "Отправляем заявку…", "loading");

      const trackBase = {
        page_type: payload.context.pageType,
        form_variant: payload.context.formVariant,
        request_type: payload.requestType,
        business_type: payload.businessType,
        product_id: payload.context.productId,
        source_param: payload.context.sourceParam,
      };

      analytics.track("lead_form_submit", trackBase);

      try {
        const result = await submitLeadForm(form, payload);
        setLeadStatus(form, buildLeadSuccessMarkup(payload, result), "success");
        analytics.track("lead_form_success", {
          ...trackBase,
          request_id: result.requestId || "",
          crm_id: result.crmId || "",
          delivery_mode: result.deliveryMode || "",
        });
        form.reset();
        syncLeadFormState(form);
        clearLeadValidationErrors(form);
        $("[data-form-status]", form)?.focus?.();
      } catch (error) {
        const serverPayload = error.payload || {};
        if (serverPayload.fieldErrors || serverPayload.errors) {
          applyServerErrors(form, serverPayload);
        }

        setLeadStatus(
          form,
          `
            <strong>Не удалось отправить заявку.</strong>
            <span>${serverPayload.message || error.message || "Попробуйте ещё раз или свяжитесь с нами напрямую."}</span>
            ${serverPayload.correlationId ? `<span>Номер ошибки: ${serverPayload.correlationId}</span>` : ""}
            ${createStatusLinks("site_wholesale")}
          `,
          "error",
          "alert",
        );
        analytics.track("lead_form_error", {
          ...trackBase,
          error_code: serverPayload.error || "submit_failed",
        });
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
  const focusable = () =>
    $$("a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])", menu).filter(
      (node) => !node.hasAttribute("hidden"),
    );

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
      return;
    }

    if (event.key === "Tab" && !menu.hidden) {
      const nodes = focusable();
      if (!nodes.length) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
};

const trackArticleOpen = () => {
  if (body.dataset.page !== "article") return;
  analytics.track("journal_article_open", { slug: body.dataset.pageSlug || "", location: "article_page" });
};

rememberFirstTouch();
applyIntentBanner();
applyContactIntentState();
bindLeadForms();
bindTrackedLinks();
bindCatalogSearch();
bindMenu();
trackArticleOpen();

window.GlobalBasketAnalytics = analytics;
