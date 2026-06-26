# Building & deploying

Muten has **two build modes**. Pick by what the app is.

| | `vite build` | `muten build` |
|---|---|---|
| Output | a single-page app (one `index.html` + JS) | static HTML per route (SSG) |
| Navigation | client-side router (no reload) | each route is its own page (full load) |
| Ships | the tiny signals runtime + your app | zero JS where possible |
| Styles, `use` fns, stores | **bundled** ✓ | **omitted** (structure-only) |
| SEO | `<head>` updated on navigation | full: pre-rendered HTML + sitemap/robots/canonical/JSON-LD |
| Best for | apps (dashboards, SaaS, anything stateful/styled) | content/marketing/catalog where crawlability matters |

**Most real apps use `vite build`** — it bundles everything (your CSS, `use` functions, stores). `muten build`
is the zero-JS SSG path for crawlable static content; it intentionally omits the project stylesheet and does
not bundle `use` functions (they'd throw). See [SEO](seo.md) for what `muten build` emits.

## The SPA fallback

A single-page app (`vite build`) routes on the client, so the host must **serve `index.html` for any path** —
otherwise a deep link (`/products`) 404s before the router runs. Every static host has a way to do this:

```json
// vercel.json  (scaffolded with --vercel)
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

(Netlify: a `_redirects` with `/* /index.html 200`; Nginx: `try_files $uri /index.html`.)

## Deploying the SSG output

`muten build` writes plain static files — deploy `dist/` to any static host. Pass your origin so the sitemap
and canonical URLs are absolute:

```sh
muten build --url=https://your-site.com
```

The output is just HTML/CSS/JS — ideal for a plain-static host (e.g. Vercel's HTML hosting), no framework
runtime to configure.

## Desktop & mobile — Tauri

Scaffold with `--tauri` (or add Tauri later) to wrap the **same** `vite build` output as a native app. Tauri
points its `frontendDist` at `dist/` and its `devUrl` at the Vite dev server; the `.muten` frontend runs in the
OS webview with no bundled browser. The SPA build is the right mode for a webview (load `index.html` once,
route in memory). A backend command (Rust `invoke`) is reached from Muten via a [`use`](escapes.md) function or
a `Custom`.

## Package manager / runtime

The app is a normal Vite project, so any package manager works (`--pm npm|pnpm|yarn|bun`). Running the Vite
build under **Bun** is faster to start than Node; the bundler and plugins are unchanged.

## See also
- [SEO](seo.md) — the SSG metadata.
- [Routing](routing.md) — why the SPA fallback is needed.
- [Getting started](getting-started.md) — the dev/build scripts.
