# Pages & routing

`src/app.muten` is the **root** — the single file an agent (or a person) reads first. It maps URLs to pages
and, optionally, wraps them in a persistent shell. Routing is client-side (History API, no reload), and every
route also pre-renders to static HTML at build.

## Routes

```muten
# src/app.muten
routes {
  "/"        -> home          # src/pages/home/home.muten
  "/about"   -> about
  "/404"     -> notfound      # catches any unmatched path
}
```

- Paths are **quoted strings**. The **first route is the default**.
- The page name (`home`) must match the folder under `src/pages/` (`src/pages/home/home.muten`).
- A route named `"/404"` is the catch-all for unmatched paths; without one, the first route is shown.
- Navigate with `Link "Label" -> "/path"` — client-side, no reload. Focus moves to the page's `<main>` on
  navigation (see [Accessibility](accessibility.md)).

## Route params

A `:segment` captures a URL value. The page declares it with `param <name>` and uses it as a **read-only
string** in interpolation, `when`, or expressions (it can't be mutated):

```muten
# app.muten
routes { "/product/:id" -> product }
```
```muten
# src/pages/product/product.muten
screen product
param id
Page { Title "Product {id}" }
```

Navigating `/product/1` → `/product/2` re-mounts the page with the new `id` (re-fetch the new item).

## Guards

A guard reads a **store boolean**; if it's false on navigation, the user is redirected. When the boolean flips
(login/logout), the active route re-renders automatically:

```muten
routes {
  "/cart"  -> cart  guard auth.loggedIn else "/login"     # members only
  "/login" -> login guard not auth.loggedIn else "/"       # guests only
}
```

(`auth.loggedIn` is a member of an `auth.store` — see [Stores](stores.md).)

## The shell (persistent chrome)

Wrap every route in a `shell { … slot … }` for a navbar/footer that persists across navigation. `slot` is
where the active page mounts. The **shell has no local state** — use a [store](stores.md) for things like a
mobile menu:

```muten
shell {
  Header class("flex flex-row justify-between items-center nav") {
    Link "Home" -> "/"
    Button "☰" -> ui.toggleMenu
  }
  when ui.menuOpen { Stack class("mobile-menu") { Link "About" -> "/about" } }
  slot
  Footer { Span "© 2026" }
}
routes { "/" -> home  "/about" -> about }
```

The shell also emits a keyboard **skip-link** to the content automatically (see [Accessibility](accessibility.md)).

## `<head>` metadata

A page declares `meta { title "…" description "…" lang "…" }` → `<title>` + `<meta>` tags, applied on
navigation and baked into the static HTML. See [SEO](seo.md) for the full SEO story (sitemap, canonical,
JSON-LD — all automatic).

## The app graph — `app.map.json`

`muten map` (or any build) emits `app.map.json`: a compact index of routes + their models, state, and sources.
It's the root an agent reads to understand the whole app without grepping a component tree.

## See also
- [SEO](seo.md) — meta, sitemap, canonical from your routes.
- [Stores](stores.md) — the global booleans guards read.
- [Deployment](deployment.md) — SPA fallback (serve `index.html` for any path).
