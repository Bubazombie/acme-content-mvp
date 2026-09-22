# Acme Co. Static Content MVP

A small full-stack JavaScript app that turns a folder of Markdown files into a website, built so Acme Co.'s marketing team can publish new pages without any code changes.

## Live demo

https://acme-content-mvp.onrender.com/about-page

Other pages: `/jobs`, `/valves`, and the nested route `/blog/june/company-update`. Any URL that doesn't match a content folder (including `/`) returns a 404 page that links to every available page.

The app is hosted on Render's free tier. The instance sleeps after 15 minutes without traffic, so the first request after that can take 30 to 50 seconds while it wakes up.

## How it works

Every folder under `content/` that contains an `index.md` becomes a page, and its path becomes the URL, at any depth: `content/blog/june/company-update/index.md` is served at `/blog/june/company-update`.

`npm run build` walks the whole `content/` folder, converts each `index.md` to HTML with `marked`, and renders it through a React component (`src/Page.jsx`) using `renderToStaticMarkup`. Each result is written to `dist/` as an `index.html` file, mirroring the folder structure. The build also writes a `404.html` page that links to every page, and copies static assets from `public/`.

The Express server (`src/app.js`, started by `server.js`) does no rendering at request time. For each request it looks for the matching `index.html` in `dist/` and returns it with a 200, or returns the 404 page.

Adding a folder to `content/` and rebuilding is enough to publish a new page. On Render this happens automatically on every push to `main`.

## Design decisions

**A React component instead of string replacement in `template.html`.** The brief describes each page as a template combined with a Markdown file, and it also requires React on the front end. Implementing the template as a React component satisfies both: `Page.jsx` plays the role of `template.html`, and the HTML generated from the Markdown takes the place of `{{content}}`. React's `renderToStaticMarkup` is designed for this use case: generating static HTML with no client-side JavaScript, since these pages have no interactivity.

**Generating pages at build time instead of on every request.** Content only changes when someone edits `content/`, so pages are generated once and served as plain files. This keeps requests fast and the server simple. The tradeoff is that content changes need a rebuild, which the deploy pipeline already runs on every push.

**Explicit routing instead of `express.static` defaults.** By default, Express redirects `/about-page` to `/about-page/`. The brief expects valid URLs to return 200 directly, so directory redirects are disabled and a small handler maps each path to its generated file. That handler also rejects any path that would resolve outside `dist/`.

**A parameterized build and app, for testability.** `buildSite(contentDir, distDir)` and `createApp(distDir)` take their folders as arguments, so the tests run against their own fixture content instead of the real `content/` folder, as the brief requires.

## Getting started

Requires Node 24.21.0 (see `.node-version`). Run these commands from the project root:

```bash
git clone https://github.com/Bubazombie/acme-content-mvp.git
cd acme-content-mvp
npm install
npm run build
npm start
```

Then open http://localhost:3000/about-page.

Run `npm run build` again whenever `content/`, `public/` or `styles/input.css` change.

## Adding a page

1. Create a folder under `content/`, for example `content/news/launch/`.
2. Add an `index.md` file to it with the page content in Markdown.
3. Run `npm run build`, or push to `main` to redeploy. The page is now available at `/news/launch`.

## Running tests

```bash
npm test
```

The tests use their own fixture content in `tests/fixtures/` and never read the real `content/` folder, so they keep passing as the site's content changes. They cover the three required cases (a valid URL returns 200, its body contains the HTML rendered from its Markdown, and an unmatched URL returns 404), plus multi-level nested routes, an intermediate folder with no page of its own, the root URL, trailing-slash consistency, a regression check against automatic redirects, path traversal protection, the content of the 404 page, and unit tests for the build step.

## Project structure

```
content/         Site content. One folder per page, each with an index.md.
public/          Static assets copied as-is into dist/ (favicon).
src/
  build.js       Generates dist/ from content/.
  Page.jsx       React layout used for every page.
  app.js         Express app that serves the generated files.
server.js        Starts the app on process.env.PORT (3000 by default).
styles/          Tailwind CSS source.
tests/           Vitest and Supertest tests, with their own fixture content.
```

## Possible next steps

- Run the tests on every push with GitHub Actions.
- Use each page's first heading as its `<title>`, instead of one shared title.
- An index page for the blog, so posts can be discovered without knowing their URL.
- Validate content at build time, for example failing with a clear message when an `index.md` is empty.
- A watch mode that rebuilds automatically while editing content locally.
