# CLAUDE.md

Guidance for AI coding agents working in this repository.

## Project

Static content MVP for Acme Co. Every folder under `content/` that contains an `index.md` becomes a page at the matching URL, at any depth. Pages are generated at build time; the server only serves the generated files.

Stack: Node.js 24 (see `.node-version`), ES modules, Express 5, React 19 (`renderToStaticMarkup`, no client-side JavaScript), marked, esbuild (JSX compilation only), Tailwind CSS v4 with `@tailwindcss/typography`, Vitest and Supertest.

## Commands

Run from the repository root.

- `npm install`
- `npm run build`: generates `dist/` from `content/` and compiles Tailwind into `dist/styles.css`.
- `npm start`: serves `dist/` on `PORT` (default 3000). Requires a prior build.
- `npm test`: runs the full test suite. It builds its own fixtures and does not need `npm run build`.

## Architecture

- `src/build.js`: walks `content/`, converts Markdown to HTML, renders each page through `src/Page.jsx`, writes `dist/<route>/index.html` plus a `dist/404.html` that links to every page, and copies `public/` into `dist/`.
- `src/Page.jsx`: the single page layout. Every page, including the 404 page, renders through it.
- `src/app.js`: Express app. Serves static assets and maps each request path to `dist/<path>/index.html`, or to the 404 page.
- `server.js`: starts the app. Kept separate so tests can use the app without opening a port.

## Invariants (do not break)

- Keep `express.static(..., { index: false, redirect: false })`. Express's default trailing-slash redirect breaks the requirement that valid URLs return 200.
- Keep the check in `src/app.js` that the resolved file path stays inside `dist/`. It prevents path traversal.
- Never hardcode content paths or page names in code. Adding a folder to `content/` must publish a page with no code changes.
- Tests must never read from `content/`. They use `tests/fixtures/content/`, because real content changes over time.
- `buildSite(contentDir, distDir)` and `createApp(distDir)` take their directories as parameters. Keep it that way so tests can point them at fixtures.

## Code principles

- One responsibility per module: generating pages lives in `build.js`, serving them lives in `app.js`. Never read Markdown or render React at request time.
- Do not duplicate page markup. Layout changes go in `src/Page.jsx` only.
- Prefer small, pure functions and the Node standard library. Do not add a dependency without asking first.
- All code, comments, documentation and commit messages are in English.

## Testing

- Every behavior change comes with a test in `tests/`.
- Every bug fix comes with a regression test that fails without the fix.
- Before considering a task done, run `npm test` and `npm run build` and confirm both succeed.

## Commits

- Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`), one logical change per commit.
- Run `npm test` before every commit.
- Do not add co-author trailers or tool attribution lines to commit messages or pull requests.
- Never push. The developer pushes after review, and every push to `main` redeploys to Render.

## Dependencies

npm blocks dependency install scripts by default. If a new dependency needs one, stop and ask; never approve it without vetting the package. Approved packages are listed under `allowScripts` in `package.json`.
