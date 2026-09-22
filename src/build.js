import { readdirSync, mkdirSync, readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { marked } from "marked";
import * as esbuild from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

function findContentFolders(dir, base = "") {
  const entries = readdirSync(dir, { withFileTypes: true });
  let folders = [];
  if (entries.some((e) => e.isFile() && e.name === "index.md")) {
    folders.push(base || "/");
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      folders = folders.concat(
        findContentFolders(join(dir, entry.name), `${base}/${entry.name}`)
      );
    }
  }
  return folders;
}

function copyPublicAssets(publicDir, distDir) {
  if (!existsSync(publicDir)) return;
  const entries = readdirSync(publicDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(publicDir, entry.name);
    const destPath = join(distDir, entry.name);
    if (entry.isDirectory()) {
      mkdirSync(destPath, { recursive: true });
      copyPublicAssets(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderNotFoundContent(routes) {
  const links = routes
    .map((route) => '<li><a href="' + encodeURI(route) + '">' + escapeHtml(route) + "</a></li>")
    .join("");
  return (
    "<h1>Page not found</h1>" +
    "<p>The page you requested does not exist. These are the pages currently available:</p>" +
    "<ul>" + links + "</ul>"
  );
}

export async function buildSite(contentDir, distDir) {
  const cacheDir = join(distDir, "..", ".build-cache");
  await esbuild.build({
    entryPoints: [join(__dirname, "Page.jsx")],
    outfile: join(cacheDir, "Page.mjs"),
    bundle: true,
    format: "esm",
    platform: "node",
    packages: "external",
  });
  const { default: Page } = await import(
    pathToFileURL(join(cacheDir, "Page.mjs")).href + `?t=${Date.now()}`
  );

  mkdirSync(distDir, { recursive: true });
  copyPublicAssets(join(contentDir, "..", "public"), distDir);
  const routes = findContentFolders(contentDir);

  const renderPage = (contentHtml) =>
    "<!doctype html>" +
    renderToStaticMarkup(React.createElement(Page, { contentHtml }));

  for (const route of routes) {
    const markdown = readFileSync(join(contentDir, route, "index.md"), "utf-8");
    const outDir = join(distDir, route);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "index.html"), renderPage(marked.parse(markdown)));
  }

  writeFileSync(join(distDir, "404.html"), renderPage(renderNotFoundContent(routes)));
  return routes;
}

const isMain = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMain) {
  const routes = await buildSite(
    join(__dirname, "..", "content"),
    join(__dirname, "..", "dist")
  );
  routes.forEach((r) => console.log(`Built ${r}`));
  console.log(`Done. ${routes.length} pages built.`);
}
