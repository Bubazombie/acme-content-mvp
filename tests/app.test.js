import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSite } from "../src/build.js";
import { createApp } from "../src/app.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const fixtureContentDir = join(__dirname, "fixtures", "content");
const fixtureDistDir = join(__dirname, "fixtures", "dist");

let app;

beforeAll(async () => {
  await buildSite(fixtureContentDir, fixtureDistDir);
  app = createApp(fixtureDistDir);
});

describe("content pages", () => {
  it("returns 200 for a valid content URL", async () => {
    const res = await request(app).get("/sample-page");
    expect(res.status).toBe(200);
  });

  it("returns the HTML generated from the markdown file", async () => {
    const res = await request(app).get("/sample-page");
    expect(res.text).toContain("<h1>Sample Page</h1>");
    expect(res.text).toContain("This is fixture content for automated tests.");
  });

  it("returns 404 for a URL with no matching content folder", async () => {
    const res = await request(app).get("/this-page-does-not-exist");
    expect(res.status).toBe(404);
  });
});

describe("path traversal protection", () => {
  it("does not serve files outside the dist directory via a relative path escape", async () => {
    const res = await request(app).get("/../escape-target");
    expect(res.status).toBe(404);
  });
});

describe("nested routing", () => {
  it("returns 200 and the right content for a URL two levels deep", async () => {
    const res = await request(app).get("/blog/updates/first-post");
    expect(res.status).toBe(200);
    expect(res.text).toContain("<h1>First Post</h1>");
  });

  it("returns 404 for the root URL, since no content folder maps to it", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(404);
  });

  it("returns 404 for an intermediate folder that has no index.md of its own", async () => {
    const res = await request(app).get("/blog/updates");
    expect(res.status).toBe(404);
  });

  it("serves the same page whether the URL ends in a slash or not", async () => {
    const withoutSlash = await request(app).get("/sample-page");
    const withSlash = await request(app).get("/sample-page/");
    expect(withoutSlash.status).toBe(200);
    expect(withSlash.status).toBe(200);
    expect(withSlash.text).toBe(withoutSlash.text);
  });

  it("never returns an automatic redirect for a valid content URL", async () => {
    const res = await request(app).get("/sample-page");
    expect(res.status).not.toBe(301);
    expect(res.headers.location).toBeUndefined();
  });
});

describe("buildSite (unit)", () => {
  it("returns one route per content folder, including nested ones", async () => {
    const routes = await buildSite(fixtureContentDir, fixtureDistDir);
    expect(routes).toContain("/sample-page");
    expect(routes).toContain("/blog/updates/first-post");
  });

  it("writes an index.html file at the correct nested path in dist", async () => {
    await buildSite(fixtureContentDir, fixtureDistDir);
    const nestedFile = join(fixtureDistDir, "blog", "updates", "first-post", "index.html");
    expect(existsSync(nestedFile)).toBe(true);
  });
});
