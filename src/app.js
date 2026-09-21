import express from "express";
import { existsSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export function createApp(distDir) {
  distDir = resolve(distDir);
  const app = express();
  app.use(express.static(distDir, { index: false, redirect: false }));
  app.use((req, res) => {
    const pagePath = join(distDir, decodeURIComponent(req.path), "index.html");
    const isInsideDistDir = pagePath === distDir || pagePath.startsWith(distDir + sep);

    if (isInsideDistDir && existsSync(pagePath)) {
      res.status(200).sendFile(pagePath);
    } else {
      res.status(404).send("Not found");
    }
  });
  return app;
}

export default createApp(join(__dirname, "..", "dist"));
