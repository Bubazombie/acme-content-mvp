# Acme Co. — Static Content MVP

A small full-stack JavaScript app that turns a folder of Markdown files into a set of static HTML pages, built for Acme Co.'s marketing team so they can publish new pages without any code changes.

## Live demo

https://acme-content-mvp.onrender.com

Try it at `/about-page`, `/jobs`, `/valves`, or a nested route like `/blog/june/company-update`.

This is hosted on Render's free tier, so the instance sleeps after 15 minutes of inactivity. The first request after that can take 30–50 seconds to wake it up.

## How it works

Every page under `/content` is a folder containing an `index.md` file. The folder path becomes the page's URL, at any depth: `content/blog/june/company-update` is served at `/blog/june/company-update`.

At build time, the app walks the entire `content` folder, converts each `index.md` to HTML, and renders it into a page template. That template is a React component (`src/Page.jsx`), rendered to static markup with `renderToStaticMarkup`, so React genuinely produces every page rather than acting as a stand-in over plain string replacement. The result is written to `dist/` as a plain `index.html` file per route, mirroring the folder structure of `content/`.

The server (`src/app.js`, `server.js`) does no rendering at request time. It only looks up whether a matching file exists in `dist/` for the requested path, and returns it or a 404.

Because the site is generated from whatever is in `content/` at build time, adding a new folder there and running `npm run build` again is enough to publish a new page. No code changes are needed.

## Getting started

Requires the Node version listed in `.node-version` (24.21.0). All commands below are run from the project root.

```bash
git clone https://github.com/Bubazombie/acme-content-mvp.git
cd acme-content-mvp
npm install
npm run build
npm start
```

The app will be running at `http://localhost:3000`. Visit `http://localhost:3000/about-page` to see a page.

`npm run build` regenerates `dist/` from whatever is currently in `content/`, and also compiles the Tailwind CSS. Run it again any time `content/` or `styles/input.css` changes.

## Running tests

```bash
npm test
```

Tests run against their own fixture content in `tests/fixtures/`, separate from the real `content/` folder, so they keep passing regardless of what pages currently exist on the site. Coverage includes the three cases required by the brief (valid URL returns 200, response body contains the rendered Markdown, unmatched URL returns 404), plus additional cases for multi-level nested routes, an intermediate folder with no page of its own, trailing-slash consistency, a regression check against unwanted redirects, and a check that the server can't be made to serve files from outside `dist/` via a crafted path.

## Project structure

```
content/           Real site content. One folder per page, each with an index.md.
src/
  build.js         Walks content/, converts Markdown to HTML, renders each page, writes dist/.
  Page.jsx         The React component used as the page template.
  app.js           Express app. Serves whatever build.js already generated in dist/.
server.js          Starts the Express app on process.env.PORT (or 3000 locally).
styles/            Tailwind source (input.css).
tests/             Vitest + Supertest, with their own fixture content under tests/fixtures/.
```

## Deployment

Hosted on Render, connected directly to this GitHub repository. Every push to `main` triggers an automatic rebuild and redeploy.

## Possible next steps

A few honest ideas for where this could go next, roughly in order of value:

- Run `npm test` automatically on every push via GitHub Actions, instead of only locally.
- A simple listing page for the blog, since right now a visitor needs to already know a post's exact URL to reach it.
- Basic validation of `content/` at build time (e.g. warn if an `index.md` is missing required front matter, once front matter is introduced), so a marketing team member gets a clear error instead of a silently broken page.
- A `content` watch mode for local development, so the site rebuilds automatically while editing Markdown, instead of needing to rerun `npm run build` by hand.