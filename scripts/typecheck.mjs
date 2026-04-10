import { spawnSync } from "node:child_process";

const files = [
  "./scripts/build.mjs",
  "./scripts/app.js",
  "./scripts/lead-form-shared.mjs",
  "./scripts/lint.mjs",
  "./api/contact-request.js",
  "./api/b2b-request.js",
  "./api/_lib/http.js",
  "./api/_lib/forms.js",
  "./api/_lib/bitrix.js",
  "./api/_lib/form-service.js",
  "./api/_lib/telegram.js",
  "./api/_lib/telegram-notify.js",
  "./api/telegram-webhook.js",
  "./content/site-data.mjs",
];

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

console.log(`Typecheck complete for ${files.length} files`);
