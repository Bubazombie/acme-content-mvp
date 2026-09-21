import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
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
