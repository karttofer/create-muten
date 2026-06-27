# Reference — CLI

The `muten` binary ships with the app (it's a dependency of `@muten/core`). Run it via `npx muten …` or an
npm script.

```sh
muten build [dir] [--url=https://site.com]
muten check [dir] [--json]          # alias: muten lint
muten map   [dir] [--json]
```

`[dir]` defaults to the current directory.

## `muten build`

Compiles the app to **static HTML** per route (SSG) in `./dist/`, plus the SEO machinery:

```
dist/<route>/index.html   # pre-rendered, crawlable HTML (zero-JS where possible)
dist/sitemap.xml          # one <url> per route
dist/robots.txt           # allow + Sitemap directive
dist/app.map.json         # the app graph
```

- **`--url=https://site.com`** — your deploy origin, used for **absolute** sitemap / canonical / `og:url`
  URLs. Without it they're emitted relative (with a note).
- GET `sources` are fetched at build and baked into the HTML; non-GET run client-side.
- Per page, the `<head>` gets canonical + `og:url`/`og:type` + a JSON-LD `WebPage` block.

> `muten build` ships **styled** (theme + `src/styles.css` inlined), **SSR'd** (store/`query` data pre-rendered)
> zero-JS HTML. For a **stateful** app — `use` functions, or store state that survives full-page navigations —
> build the SPA with **`vite build`** instead. See [Deployment](../deployment.md).

## `muten check` (alias `muten lint`)

The **deterministic oracle**: parses + validates every page (unknown state/action/part, bad token, illegal
mutation, unknown ref, type mismatch) — **no compile, no browser**, in milliseconds.

```sh
muten check                 # human-readable diagnostics; exit 1 if any error
muten check --json          # structured diagnostics: { code, loc, message, suggestion, fix } per problem
```

`--json` is the AI-first feedback loop: an agent asks "is this valid, and what did I mean?" and gets exact
locations + "did you mean…?" suggestions + auto-fixes. (The VS Code extension surfaces the same diagnostics
inline as you type, with one-click quick-fixes.)

## `muten map`

Emits **`app.map.json`** — a compact index of routes + their models, state, and sources — the root an agent
reads first to understand the whole app.

```sh
muten map                   # writes app.map.json
muten map --json            # prints it to stdout
```

## See also
- [Deployment](../deployment.md) — `vite build` vs `muten build`.
- [SEO](../seo.md) — what `muten build --url=` emits.
- [Getting started](../getting-started.md) — the dev loop.
