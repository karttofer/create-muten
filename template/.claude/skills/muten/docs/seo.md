# SEO

Muten is strong on SEO **by construction**: `muten build` pre-renders every route to real, crawlable HTML
(no JS required to see the content), and on top of that the build emits the standard SEO machinery — sitemap,
robots, canonical, Open Graph, structured data — **derived from your routes and `meta {}`**. You write the
title and description; the rest is automatic.

## Per-page `<head>` — the `meta {}` block

A page declares its metadata; the compiler turns it into `<head>` tags:

```muten
screen product
param id

meta {
  title       "Acme Widget — Store"
  description "A durable widget for everyday use."
  lang        "en"        # optional → <html lang="en"> (the default is en)
}

Page { Title "Widget {id}" }
```

Emitted:

```html
<title>Acme Widget — Store</title>
<meta name="description" content="A durable widget for everyday use.">
<meta property="og:title" content="Acme Widget — Store">         <!-- auto-derived from title -->
<meta property="og:description" content="A durable widget for everyday use."> <!-- auto-derived -->
```

- Any `meta { key "value" }` becomes a `<meta name|property=…>`; keys starting with `og:` use `property`.
- `og:title` / `og:description` are **auto-derived** from `title` / `description` if you don't set them.
- Meta is applied on client-side navigation (SPA) **and** baked into the static HTML at build (SSG).

## Pre-rendered, crawlable HTML (SSG)

`muten build` writes `dist/<route>/index.html` for every route as **real HTML with the content already in it**
— a crawler (or a user with JS off) sees the full page. Data-backed pages whose `sources` are `GET` are
**fetched at build** and baked in, so lists render with real rows, not just placeholders.

## SEO by nature — what the build emits for free

After building the routes, `muten build` also emits, with **no per-page work**:

- **`dist/sitemap.xml`** — one `<url>` per built route. Add a page (a route in `app.muten`) and it's in the sitemap.
- **`dist/robots.txt`** — allows crawling and points to the sitemap.
- per page, injected into `<head>`:
  - **`<link rel="canonical">`** and **`og:url`** — the page's canonical address.
  - **`og:type` `website`**.
  - a **JSON-LD `WebPage`** block (`name` / `description` / `url`) from the page's `meta {}`.

```html
<!-- every built page's <head>, automatically: -->
<link rel="canonical" href="https://your-site.com/products">
<meta property="og:url" content="https://your-site.com/products">
<meta property="og:type" content="website">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage","name":"Products","description":"…","url":"https://your-site.com/products"}</script>
```

### Absolute URLs — `--url=`

Sitemaps and canonical links should be absolute, which needs your deploy origin. Pass it at build:

```sh
muten build --url=https://your-site.com
```

Without `--url=`, the sitemap and canonical are emitted **relative** (and the build prints a note). Pass the
origin in CI / your deploy command and every SEO URL becomes absolute. The origin is a deploy detail, so it's
a build flag — not something in the app source.

## Which build?

SEO lives in the **static** build path:

| Command | Output | SEO |
|---|---|---|
| `muten build` | static HTML per route (SSG, zero-JS where possible) | full: pre-rendered HTML + sitemap/robots/canonical/JSON-LD |
| `vite build` | a single-page app bundle (SPA) | the SPA updates `<head>` on navigation, but crawlers prefer the SSG output |

Use `muten build` for content/marketing/catalog sites where crawlability matters; see
[Deployment](deployment.md) for the trade-off and the SPA fallback.

## What you write vs what's free

| You write | The build emits |
|---|---|
| `meta { title … description … }` per page | `<title>`, `<meta>`, `og:*`, canonical, `og:url`, JSON-LD |
| routes in `app.muten` | `sitemap.xml`, `robots.txt` |
| `--url=` at build (optional) | absolute URLs everywhere |
| *(nothing)* | real pre-rendered HTML, one `<h1>`-able outline, crawlable `<a>` links |

You never hand-author a sitemap, a canonical tag, or a schema block. Adding a page is enough.

## See also
- [Pages & routing](routing.md) — where routes (and thus the sitemap) come from.
- [Deployment](deployment.md) — SSG vs SPA, hosting, the SPA fallback.
