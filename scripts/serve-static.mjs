import { createServer } from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT || 3000);

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".webp": "image/webp",
};

const resolveFilePath = (pathname) => {
  const normalized = decodeURIComponent(pathname || "/");
  const candidate = normalized.endsWith("/")
    ? path.join(ROOT, normalized, "index.html")
    : path.extname(normalized)
      ? path.join(ROOT, normalized)
      : path.join(ROOT, normalized, "index.html");
  const safePath = path.normalize(candidate);
  if (!safePath.startsWith(ROOT)) return null;
  return safePath;
};

createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const filePath = resolveFilePath(url.pathname);

  if (!filePath) {
    res.statusCode = 400;
    res.end("Bad request");
    return;
  }

  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.statusCode = 200;
    res.setHeader("content-type", MIME_TYPES[ext] || "application/octet-stream");
    res.end(data);
  } catch {
    res.statusCode = 404;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end("Not found");
  }
}).listen(PORT, () => {
  console.log(`Static server listening on http://127.0.0.1:${PORT}`);
});
