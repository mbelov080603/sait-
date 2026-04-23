import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const repoName = "sait-";
const basePath = `/${repoName}`;
const publicUrl = `https://mbelov080603.github.io/${repoName}`;
const outputDir = path.join(repoRoot, "output", "github-pages");
const scriptVersion = new Date().toISOString().replace(/\D/g, "").slice(0, 14);

const publishEntries = [
  ".nojekyll",
  "about",
  "account",
  "assets",
  "cart",
  "catalog",
  "categories",
  "contacts",
  "delivery",
  "favorites",
  "index.html",
  "journal",
  "legal",
  "privacy",
  "scripts",
  "styles",
];

const textExtensions = new Set([".html", ".js", ".css", ".json", ".txt", ".xml"]);
const internalPrefixes = [
  "assets",
  "styles",
  "scripts",
  "catalog",
  "categories",
  "about",
  "contacts",
  "delivery",
  "journal",
  "legal",
  "privacy",
  "favorites",
  "account",
  "cart",
];

const replaceRootHomeLinks = (text) =>
  text
    .replaceAll('href="/"', `href="${basePath}/"`)
    .replaceAll("href='/'", `href='${basePath}/'`)
    .replaceAll('action="/"', `action="${basePath}/"`)
    .replaceAll("action='/'", `action='${basePath}/'`);

const replaceInternalPrefixes = (text) => {
  let result = text;

  for (const quote of ['"', "'", "`"]) {
    for (const prefix of internalPrefixes) {
      result = result.replaceAll(
        `${quote}/${prefix}/`,
        `${quote}${basePath}/${prefix}/`,
      );
    }
  }

  return result;
};

const replaceMetaRefreshUrls = (text) => {
  let result = text;

  for (const prefix of internalPrefixes) {
    result = result.replaceAll(`url=/${prefix}/`, `url=${basePath}/${prefix}/`);
  }

  return result;
};

const transformText = (text) => {
  let result = String(text);

  result = result.replaceAll("https://globalbasket.ru", publicUrl);
  result = replaceInternalPrefixes(result);
  result = replaceMetaRefreshUrls(result);
  result = replaceRootHomeLinks(result);
  result = result.replaceAll("url(/", `url(${basePath}/`);
  result = result
    .replaceAll(`${basePath}/styles/global.css"`, `${basePath}/styles/global.css?v=${scriptVersion}"`)
    .replaceAll(`${basePath}/styles/global.css'`, `${basePath}/styles/global.css?v=${scriptVersion}'`)
    .replaceAll(`${basePath}/scripts/data.js"`, `${basePath}/scripts/data.js?v=${scriptVersion}"`)
    .replaceAll(`${basePath}/scripts/main.js"`, `${basePath}/scripts/main.js?v=${scriptVersion}"`)
    .replaceAll('/styles/global.css"', `/styles/global.css?v=${scriptVersion}"`)
    .replaceAll("/styles/global.css'", `/styles/global.css?v=${scriptVersion}'`)
    .replaceAll(`${basePath}/scripts/data.js'`, `${basePath}/scripts/data.js?v=${scriptVersion}'`)
    .replaceAll(`${basePath}/scripts/main.js'`, `${basePath}/scripts/main.js?v=${scriptVersion}'`)
    .replaceAll('/scripts/data.js"', `/scripts/data.js?v=${scriptVersion}"`)
    .replaceAll('/scripts/main.js"', `/scripts/main.js?v=${scriptVersion}"`)
    .replaceAll("/scripts/data.js'", `/scripts/data.js?v=${scriptVersion}'`)
    .replaceAll("/scripts/main.js'", `/scripts/main.js?v=${scriptVersion}'`);

  return result;
};

const copyEntry = (entry) => {
  const sourcePath = path.join(repoRoot, entry);
  const targetPath = path.join(outputDir, entry);

  if (!existsSync(sourcePath)) return;
  cpSync(sourcePath, targetPath, { recursive: true });
};

const walkAndTransform = (dirPath) => {
  for (const entry of readdirSync(dirPath)) {
    const fullPath = path.join(dirPath, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      walkAndTransform(fullPath);
      continue;
    }

    if (!textExtensions.has(path.extname(fullPath))) continue;

    const transformed = transformText(readFileSync(fullPath, "utf8"));
    writeFileSync(fullPath, transformed);
  }
};

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

for (const entry of publishEntries) {
  copyEntry(entry);
}

rmSync(path.join(outputDir, "legal", "source"), { recursive: true, force: true });

walkAndTransform(outputDir);

const indexPath = path.join(outputDir, "index.html");
if (existsSync(indexPath)) {
  cpSync(indexPath, path.join(outputDir, "404.html"));
}

console.log(`GitHub Pages artifact ready: ${outputDir}`);
console.log(`Expected public URL: ${publicUrl}/`);
