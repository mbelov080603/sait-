import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

import { normalizeLeadRequestInput, validateLeadRequest } from "../scripts/lead-form-shared.mjs";

const require = createRequire(import.meta.url);
const { mapLeadRequestToBitrix } = require("../api/_lib/bitrix.js");

const buildValidRawLead = () => ({
  requestType: "wholesale_purchase",
  businessType: "Магазин / розница",
  productInterest: ["consultation_catalog"],
  estimatedVolume: "20–100 кг",
  city: "Москва",
  companyName: "ООО Тест",
  contactName: "Иван",
  preferredContactMethod: "Телефон",
  phone: "+7 (900) 000-00-00",
  consent: true,
  context: {
    sourceParam: "wholesale",
    pageType: "b2b",
    pageSlug: "b2b",
    formVariant: "full",
    pageUrl: "https://example.com/b2b/",
    pageTitle: "Опт / B2B",
    referrer: "",
    locale: "ru",
    timezone: "Europe/Moscow",
  },
  attribution: {
    utmSource: "google",
    utmMedium: "cpc",
    utmCampaign: "brand",
  },
});

test("lead request normalizer and validator accept a minimal valid B2B payload", () => {
  const payload = normalizeLeadRequestInput(buildValidRawLead());
  const validation = validateLeadRequest(payload);

  assert.equal(payload.companyName, "ООО Тест");
  assert.equal(payload.phone, "+79000000000");
  assert.equal(validation.valid, true);
  assert.deepEqual(validation.fieldErrors, {});
});

test("lead request validator rejects missing core business fields", () => {
  const payload = normalizeLeadRequestInput({
    ...buildValidRawLead(),
    companyName: "",
    contactName: "",
    city: "",
    productInterest: [],
    phone: "",
    email: "",
    consent: false,
  });
  const validation = validateLeadRequest(payload);

  assert.equal(validation.valid, false);
  assert.ok(validation.fieldErrors.company_name);
  assert.ok(validation.fieldErrors.contact_name);
  assert.ok(validation.fieldErrors.city);
  assert.ok(validation.fieldErrors.product_interest);
  assert.ok(validation.fieldErrors.consent);
  assert.ok(validation.errors.length > 0);
});

test("bitrix lead mapping builds readable title, comments and custom field map", () => {
  const payload = {
    ...normalizeLeadRequestInput(buildValidRawLead()),
    requestId: "GB-B2B-TEST",
  };

  const mapped = mapLeadRequestToBitrix(payload, {
    mode: "lead",
    webhookUrl: "",
    timeoutMs: 15000,
    entityTypeId: null,
    assignedById: null,
    categoryId: null,
    stageId: "",
    leadSource: "WEB",
    titlePrefix: "[Site][B2B]",
    fieldMaps: {
      lead: {
        UF_CRM_GB_SOURCE: "context.sourceParam",
        UF_CRM_GB_PRODUCTS: "crm.productInterestText",
      },
      item: {},
    },
  });

  assert.equal(mapped.method, "crm.lead.add");
  assert.match(mapped.body.fields.TITLE, /\[Site\]\[B2B\]/);
  assert.equal(mapped.body.fields.UF_CRM_GB_SOURCE, "wholesale");
  assert.equal(mapped.body.fields.UF_CRM_GB_PRODUCTS, "Нужна консультация по ассортименту");
  assert.match(mapped.body.fields.COMMENTS, /Request ID: GB-B2B-TEST/);
});

test("bitrix item mapping uses entity type id and mapped custom fields", () => {
  const payload = {
    ...normalizeLeadRequestInput(buildValidRawLead()),
    requestId: "GB-B2B-ITEM",
  };

  const mapped = mapLeadRequestToBitrix(payload, {
    mode: "item",
    webhookUrl: "",
    timeoutMs: 15000,
    entityTypeId: 181,
    assignedById: 7,
    categoryId: 3,
    stageId: "DT181_3:NEW",
    leadSource: "WEB",
    titlePrefix: "[Site][B2B]",
    fieldMaps: {
      lead: {},
      item: {
        ufCrmGbCompany: "companyName",
        ufCrmGbCity: "city",
      },
    },
  });

  assert.equal(mapped.method, "crm.item.add");
  assert.equal(mapped.body.entityTypeId, 181);
  assert.equal(mapped.body.fields.title.includes("[Site][B2B]"), true);
  assert.equal(mapped.body.fields.ufCrmGbCompany, "ООО Тест");
  assert.equal(mapped.body.fields.ufCrmGbCity, "Москва");
});
