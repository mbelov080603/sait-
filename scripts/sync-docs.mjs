import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(ROOT, "output", "github-pages");
const docsDir = path.join(ROOT, "docs");

const managedEntries = [
  ".nojekyll",
  "404.html",
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

if (!existsSync(outputDir)) {
  throw new Error(`Missing GitHub Pages artifact: ${outputDir}`);
}

mkdirSync(docsDir, { recursive: true });

managedEntries.forEach((entry) => {
  rmSync(path.join(docsDir, entry), { recursive: true, force: true });
});

for (const entry of readdirSync(outputDir)) {
  const sourcePath = path.join(outputDir, entry);
  const targetPath = path.join(docsDir, entry);
  cpSync(sourcePath, targetPath, { recursive: true });
}

console.log(`Docs directory synced from ${outputDir}`);
