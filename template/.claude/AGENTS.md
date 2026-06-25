# Working in a Muten app — guide for AI agents

This project uses **Muten**, an AI-first frontend framework. The UI is written in **`.muten` files**
(a small declarative DSL) — **not** React, JSX, Vue, Svelte or hand-written HTML/JS. No model is
trained on Muten yet, so **follow this guide instead of guessing**. Foreign code enters ONLY through explicit
escapes — `use` for JS functions, `Custom` for a vanilla-JS widget — never as the page UI itself; never add a JS bootstrap.

> Full language reference (every primitive, prop, token, pattern): the **`muten` skill** at
> [`skills/muten/SKILL.md`](skills/muten/SKILL.md).

## Golden rules
- UI → `.muten` files. App-global state → `.store` files. Both compile via the `@muten/core` Vite plugin.
- **No `main.js`.** `src/app.muten` IS the entry (loaded by `index.html`). Never add a JS entry/bootstrap.
- Primitives are **PascalCase** (`Stack`, `Text`, `Button`); control flow is lowercase (`when`, `each`).
- **`style(...)`** = layout/typography tokens (Muten builds STRUCTURE). **`class("...")`** = your look
  (your CSS / Tailwind). Muten ships no skin — appearance is yours.
- A state reference is a **bare name** (no sigil); interpolate in any string with `{expr}`: `Text "Hi, {user.name}"`.

## File map
```
src/
  app.muten                    ROOT — routes { "/url" -> page }  (+ optional shell { … slot … })
  pages/<route>/<route>.muten  a page; the folder name IS the route
  parts/<name>.muten           reusable component (composition, inlined at build)
  components/<Name>.js          escape hatch (host JS) used via the `Custom` primitive
theme.muten                    design tokens: space, font, weight, breakpoints
src/styles.css                 your look (.scss if you picked SCSS)
```

## A page looks like this
```
screen home

Page style(padding.lg, gap.md) {
  Title "Hello"
  Text "Body copy with reactive state: {user.name}"
  Button "Save" -> save
}
```

## Cheat-sheet
- **Layout:** `Stack` (vertical), `Page` (`<main>`), `Header`/`Nav`/`Sidebar`/`Footer` (landmarks). Horizontal = `style(row)`.
- **Content:** `Text`, `Title "x" h2`, `Span`, `Image "{src}" alt("…")` (alt required), `Link "x" -> "/route"`, `Button "x" -> action(arg)`.
- **Data:** `DataTable @list columns(a, b)`, `Form bind(draft) submit(create)`, `SearchField bind(q)`.
- **Control:** `when <expr> { … }`, `each <list> as item { … }`.
- **Interactivity:** reactive class `class(active when isOpen)` (quote hyphenated names: `class("is-open" when x)`); events on any element `on(keydown: act, mouseenter: act)`; **`on(enter: action)`** on an input = Enter-to-submit (no Custom); a `"/404"` route catches unmatched paths.
- **State:** `state { q = "" : text  users = query listUsers : list<User> }` — query states expose `.loading/.error/.data`.
- **Backend:** `sources { x: { url, method?, headers?, body?, at? } }` feeds a `query`. Shared base+auth go in `api { base, headers }` (app.muten, named clients via `{ api: "shop" }`) — relative source urls join to `base`. GET sources pre-render at build (SSG).
- **Writes:** a source-backed list gets `create`/`update`/`delete` in an action (`orders.create(draft)` → POST/PUT/DELETE the resource, optimistic + updates the list). The action is async with reactive `name.pending`/`name.error` for UX. Local-only mutations stay `push`/`set`/`reset`/`remove`.
- **Refetch:** re-run a query with N params (search / paginate / filter): `products.refetch(q: term, page: n)` in an action → builds `?q=&page=` and reloads the list.
- **Escape hatch:** non-RESTful API? `post`/`put`/`delete` a `"client:/path"` (interpolated) with optional `body` in an action: `post "shop:/orders" body item`. Uses the client's base+headers; `mutates` is optional for pure commands.
- **JS escape (`use`):** call named JS functions behind a typed, synchronous border — `use fmt from "./lib.ts"` → `Text "{fmt(x)}"`. Also callable as a **statement in an action/effect** for a side effect (`persist(x)`, `scrollBottom()`). A visual widget Muten can't express → vanilla-JS `Custom`. Full details: SKILL §14.
- **Actions:** `action add(item: User) mutates users { users.push(item) }` — typed params in `(…)`; ops: `push/set/reset/remove/toggle/patch` + a `use` fn call for side effects; branch with `if/else`.
- **Tokens:** `gap.md padding.lg cols.3 text.lg row center between` — responsive prefix: `md:cols.2`.

## Dependencies & limits
- **CSS / Tailwind / SCSS: YES** — it's a Vite app; install them and use `class("…")` + your CSS.
- **React / Vue / Svelte: NO — at all.** Muten ships ZERO framework runtime; pages are `.muten` (vanilla DOM).
  A widget Muten can't express enters as a vanilla `Custom` component (SKILL §13); JS logic via `use` (§14) —
  for the foreign piece, never the whole UI.
- Routing uses **quoted string paths** (`routes { "/path" -> page }`, `Link -> "/x"`, History API; deploy serves `index.html` for any path); params (`"/product/:id"` → `param id`). SEO: `meta { title "…" description "…" }` per page → `<head>` tags (og auto-derived). Shell has no local state → use a
  `.store`. Flip a bool with `x.toggle()`. `style()` is layout tokens only; visuals go in `class()`.
- **Known limits (plan around these):** the **runnable** build is `vite build` / `npm run dev`, NOT `muten build` (which is structure-only SSG: it drops `styles.css`, non-layout token CSS, and `use` functions). No `match`/`switch` (use N `when status == "x"` blocks). `Form` renders ALL entity fields (types text/email/number/bool/enum; **no** password/date/textarea/conditional fields; an enum can't be `required`). `DataTable` cells are raw (format with `each`). No standalone `Select`. `sort by` takes a literal field, not a variable. `Custom` inputs need `@` and are a snapshot. `query x live` needs the server to send a row `id`.
- The full reference (stores, routing, theme, every primitive, the limits in §3) is in [`skills/muten/SKILL.md`](skills/muten/SKILL.md).

## Commands
`npm run dev` (dev server + HMR) · `npm run build` (production) · `npm run lint` (validate `.muten`).
