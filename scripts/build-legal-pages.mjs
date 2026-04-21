import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LEGAL_DIR = path.join(ROOT, "legal");
const SOURCE_DIR = path.join(LEGAL_DIR, "source");

const COMPANY_FACTS = [
  ["Продавец и оператор", "ООО «ВОСТОК ИМПОРТ ПРОМ»"],
  ["Коммерческое обозначение", "Global Basket"],
  ["ИНН / КПП / ОГРН", "9728009189 / 773601001 / 1207700272031"],
  ["Официальный телефон", "+7 (495) 740-09-51"],
  ["Email", "hello@globalbasket.ru / info@vostokip.ru"],
];

const LEGAL_DOCS = [
  {
    slug: "public-offer",
    source: "public-offer.md",
    pdf: "/legal/globalbasket_public_offer.pdf",
    title: "Публичная оферта",
    description:
      "Условия дистанционной продажи товаров через Global Basket, порядок оформления запроса, согласования условий, оплаты, доставки и возврата.",
  },
  {
    slug: "privacy-policy",
    source: "privacy-policy.md",
    pdf: "/legal/globalbasket_privacy_policy.pdf",
    title: "Политика обработки персональных данных",
    description:
      "Порядок обработки и защиты персональных данных пользователей сайта, работы cookies, localStorage и sessionStorage, а также правила коммуникации с оператором.",
  },
  {
    slug: "personal-data-consent",
    source: "personal-data-consent.md",
    pdf: "/legal/globalbasket_personal_data_consent.pdf",
    title: "Согласие на обработку персональных данных",
    description:
      "Отдельное согласие для форм, запросов и обращений на сайте Global Basket с описанием целей, состава данных, сроков хранения и порядка отзыва.",
  },
];

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const escapeAttribute = (value = "") => escapeHtml(value).replaceAll('"', "&quot;");

const linkifyText = (value = "") =>
  escapeHtml(value).replace(
    /(https:\/\/[^\s<]+)/g,
    (match) => `<a href="${escapeAttribute(match)}">${escapeHtml(match)}</a>`,
  );

const renderChromeStart = (title = "") => `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Rubik:wght@500;600;700;800&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="/styles/global.css" />
  </head>
  <body data-page="legal">
    <div data-site-header></div>
    <main>
`;

const renderChromeEnd = () => `
    </main>
    <div data-site-footer></div>
    <script src="/scripts/data.js"></script>
    <script src="/scripts/main.js"></script>
  </body>
</html>
`;

const parseDocument = (markdown = "") => {
  const lines = String(markdown).replace(/\r/g, "").split("\n");
  const sections = [];
  const intro = [];
  let title = "";
  let subtitle = "";
  let edition = "";
  let current = null;
  let buffer = [];

  const flushParagraph = () => {
    const paragraph = buffer.join(" ").trim();
    buffer = [];
    if (!paragraph) return;
    if (current) {
      current.paragraphs.push(paragraph);
      return;
    }
    intro.push(paragraph);
  };

  const flushSection = () => {
    flushParagraph();
    if (!current) return;
    sections.push(current);
    current = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      continue;
    }

    if (line.startsWith("# ")) {
      title = line.slice(2).trim();
      continue;
    }

    if (line.startsWith("## ")) {
      subtitle = line.slice(3).trim();
      continue;
    }

    if (/^Редакция от /i.test(line)) {
      edition = line;
      continue;
    }

    if (line.startsWith("### ")) {
      flushSection();
      current = {
        title: line.slice(4).trim(),
        paragraphs: [],
      };
      continue;
    }

    buffer.push(line);
  }

  flushSection();

  return { title, subtitle, edition, intro, sections };
};

const renderFactList = (items = []) => `
  <dl class="legal-fact-list">
    ${items
      .map(
        ([label, value]) => `
          <div class="legal-fact-list__row">
            <dt>${escapeHtml(label)}</dt>
            <dd>${escapeHtml(value)}</dd>
          </div>
        `,
      )
      .join("")}
  </dl>
`;

const renderDocumentPage = (doc, parsed) => `
${renderChromeStart(`Global Basket | ${doc.title}`)}
      <section class="page-hero">
        <div class="shell">
          <div class="breadcrumb" role="navigation" aria-label="Breadcrumbs">
            <a href="/">Главная</a>
            <span>/</span>
            <a href="/legal/">Юридические документы</a>
            <span>/</span>
            <span>${escapeHtml(doc.title)}</span>
          </div>
          <div class="hero-copy legal-hero">
            <h1>${escapeHtml(parsed.title || doc.title)}</h1>
            ${parsed.subtitle ? `<p class="legal-hero__subtitle">${escapeHtml(parsed.subtitle)}</p>` : ""}
            ${parsed.edition ? `<p class="legal-hero__meta">${escapeHtml(parsed.edition)}</p>` : ""}
            <div class="hero-stage__actions legal-actions">
              <a class="button" href="${doc.pdf}" target="_blank" rel="noopener noreferrer">Открыть PDF</a>
              <a class="button button--ghost" href="${doc.pdf}" download>Скачать PDF</a>
              <a class="text-link text-link--inline" href="/legal/">К списку документов</a>
            </div>
          </div>
        </div>
      </section>

      <section class="page-section page-section--compact">
        <div class="shell legal-doc-grid">
          <article class="request-panel legal-summary-card">
            <div class="section-head section-head--compact">
              <h2>Основные реквизиты</h2>
              <p>Документ размещен в HTML-версии для чтения на сайте и в PDF-версии для открытия в новой вкладке или скачивания.</p>
            </div>
            ${renderFactList(COMPANY_FACTS)}
          </article>
          <section class="policy-sheet legal-policy-sheet" aria-label="Текст документа">
            ${
              parsed.intro.length
                ? `
                  <article class="request-panel policy-sheet__section">
                    <div class="policy-sheet__body">
                      ${parsed.intro.map((paragraph) => `<p>${linkifyText(paragraph)}</p>`).join("")}
                    </div>
                  </article>
                `
                : ""
            }
            ${parsed.sections
              .map(
                (section) => `
                  <article class="request-panel policy-sheet__section">
                    <div class="section-head section-head--compact">
                      <h2>${escapeHtml(section.title)}</h2>
                    </div>
                    <div class="policy-sheet__body">
                      ${section.paragraphs.map((paragraph) => `<p>${linkifyText(paragraph)}</p>`).join("")}
                    </div>
                  </article>
                `,
              )
              .join("")}
          </section>
        </div>
      </section>
${renderChromeEnd()}`;

const renderLegalIndex = () => `
${renderChromeStart("Global Basket | Юридические документы")}
      <section class="page-hero">
        <div class="shell">
          <div class="breadcrumb" role="navigation" aria-label="Breadcrumbs">
            <a href="/">Главная</a>
            <span>/</span>
            <span>Юридические документы</span>
          </div>
          <div class="hero-copy legal-hero">
            <h1>Юридические документы</h1>
            <p>Здесь собраны публичная оферта, политика обработки персональных данных и согласие на обработку персональных данных. Каждый документ доступен как PDF и как страница для чтения на сайте.</p>
          </div>
        </div>
      </section>

      <section class="page-section page-section--compact">
        <div class="shell legal-doc-grid">
          <article class="request-panel legal-summary-card">
            <div class="section-head section-head--compact">
              <h2>Реквизиты продавца и оператора</h2>
              <p>ООО «ВОСТОК ИМПОРТ ПРОМ» использует коммерческое обозначение Global Basket и размещает документы в открытом доступе для пользователей сайта.</p>
            </div>
            ${renderFactList(COMPANY_FACTS)}
          </article>
          <div class="legal-card-grid">
            ${LEGAL_DOCS.map(
              (doc) => `
                <article class="request-panel legal-card">
                  <div class="section-head section-head--compact">
                    <h2>${escapeHtml(doc.title)}</h2>
                    <p>${escapeHtml(doc.description)}</p>
                  </div>
                  <div class="legal-card__actions">
                    <a class="button button--small" href="${doc.pdf}" target="_blank" rel="noopener noreferrer">Открыть PDF</a>
                    <a class="button button--ghost button--small" href="${doc.pdf}" download>Скачать PDF</a>
                    <a class="text-link text-link--inline" href="/legal/${doc.slug}/">Читать на сайте</a>
                  </div>
                </article>
              `,
            ).join("")}
          </div>
        </div>
      </section>
${renderChromeEnd()}`;

await fs.mkdir(LEGAL_DIR, { recursive: true });
await fs.writeFile(path.join(LEGAL_DIR, "index.html"), renderLegalIndex(), "utf8");

for (const doc of LEGAL_DOCS) {
  const markdown = await fs.readFile(path.join(SOURCE_DIR, doc.source), "utf8");
  const parsed = parseDocument(markdown);
  const dir = path.join(LEGAL_DIR, doc.slug);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "index.html"), renderDocumentPage(doc, parsed), "utf8");
}

console.log(`Legal HTML pages generated in ${LEGAL_DIR}`);
