---
name: muten
description: Read and write Muten — the AI-first frontend DSL this app is built in (.muten and .store files), NOT React/Vue/HTML. Use whenever creating or editing any .muten or .store file, app.muten routes, theme.muten, parts, components, stores, or deciding what can be installed. No model is trained on Muten, so consult this before writing any Muten code or adding a dependency. Assume the human will NOT read the code — you do everything.
---

# Muten — complete language reference

Muten compiles `.muten` files to vanilla JS + fine-grained signals (no virtual DOM). The `@muten/core`
Vite plugin does the compiling. You write a small declarative DSL for the UI — **not** React/JSX/Vue/Svelte/HTML;
foreign code comes in only through explicit escapes (`use` for JS functions, **islands** for Svelte/React widgets — §14).
A page with no reactivity compiles to plain zero-runtime HTML; a reactive one ships ~1KB of signals.

## Mental model & golden rules
- **UI** → `.muten` files (pages, parts, the app root, the theme). **App-global state** → `.store` files.
- **`src/app.muten` is the entry.** `index.html` loads it; the plugin boots it. **Never create `main.js`** or a `<script>` bootstrap.
- Primitives are **PascalCase** (`Stack`, `Text`); keywords/control flow are **lowercase** (`when`, `each`, `state`).
- `style(...)` = layout/typography **tokens** (Muten builds STRUCTURE). `class("...")` = **look** (your CSS / Tailwind); toggle reactively with `class(active when isOpen)`. Muten ships no skin.
- `@name` = a state reference. `{expr}` = interpolation inside a Text/label/path string: `Text "Hi, {user.name}"`. (NOT inside `class("…")` — for a dynamic class use `class(name when cond)`.)
- Each page has **one root node**. Reactivity is automatic: reading a state in interpolation / `when` / `each` re-renders just that spot.

## 1. What you CAN install / use
This is a normal **Vite** project, so the whole Vite/npm ecosystem for **styling, build, and data** works:
- **Tailwind CSS — YES.** Install it (`tailwindcss`, `postcss`, `autoprefixer`), add the config + the
  `@tailwind` directives to `src/styles.css`, and use utilities via `class("flex gap-4 rounded")`.
  `class()` emits raw class names, so any CSS framework (Tailwind, UnoCSS, Bootstrap CSS, your own CSS) works.
- **Sass/SCSS** — supported out of the box if you scaffolded with SCSS (or add `sass`); use `src/styles.scss`.
- **Any Vite plugin / PostCSS plugin** — add it to `vite.config.mjs` alongside `muten()`.
- **Data / utility npm packages** — usable inside `.store` logic, inside `Custom` host components, and via
  **`use` logic imports** (date libs, fetch wrappers, zod, etc.).
- **JS logic via `use … from "./lib.ts"` — YES.** Import named functions and call them in any expression
  (`use fmt from "./lib.ts"` → `Text "{fmt(x)}"`). The `.ts` is a facade over any npm. See §14.
- **Svelte / React components via ISLANDS — YES.** A genuinely-interactive widget or a framework UI lib
  Muten can't express → mount a real `.svelte`/`.jsx` with `use X from "svelte:…"`. See §14.
- **Host UI via the `Custom` primitive** — write vanilla JS in `src/components/<Name>.js` (charts,
  maps, a third-party widget) and mount it with `Custom`. See §Custom.

## 2. What you CANNOT do
- **Don't build the page UI out of React / Vue / Svelte.** Pages are `.muten` → vanilla DOM, no framework
  runtime; you don't compose the app from MUI/Chakra/shadcn. BUT a *specific* interactive widget or framework
  lib CAN enter as an **island** (`use X from "react:…"`, §14) or a vanilla-JS `Custom` — for the foreign piece,
  not the whole UI. Default to `.muten`; reach for an island only when Muten genuinely can't express it.
- **No JSX / hooks / `className` inside `.muten`.** Those live in the island's own `.svelte`/`.jsx` file, never in a page.
- **No arbitrary inline CSS via `style()`** — `style()` only takes the layout/typography tokens below.
  Visual styling (colors, borders, shadows) goes through `class("…")` + your CSS.

## 3. Limitations (current)
- **Routing uses real paths** (`/path`, History API). Route params ARE supported: `/product/:id` → declare `param id`
  in the page (see §10). `muten build` pre-renders pages to real HTML (SSG) so content is crawlable —
  static pages ship zero JS; reactive pages get their content (lists, `each`, interpolation from mock data)
  baked into the HTML, then the runtime boots for interactivity. No special syntax needed.
- **Shell has no local state** — put shell/cross-page state in a `.store` (see the mobile-menu pattern).
- **No `toggle` op** — flip a bool with `set(not x)`.
- **Forms**: `Form` (auto-generated from an entity) and `SearchField` (single text input) are the
  built-ins; richer custom inputs need a `Custom` component for now.
- **Pages are single-root** (one top node per page).

## 4. Files
```
src/app.muten                    routes (+ optional shell) — the ROOT; read it first
src/pages/<route>/<route>.muten  one page; the folder name IS the route
src/parts/<name>.muten           reusable component (inlined at build time)
src/components/<Name>.js          host-JS escape hatch, mounted via Custom
src/<domain>.store               app-global state slice (domain = file name)
theme.muten                      token scale (space/font/weight/leading/breakpoints)
src/styles.css                   reset + look (or styles.scss)
index.html / vite.config.mjs     wired to @muten/core; don't hand-edit the boot
```

## 5. Declarations
```
screen <name>                    # page identity (first line of a page)

entity User {                    # data shape + validation (implicit `id uuid`)
  name  text  required           # constraints: required | min:N | max:N
  email email required
  role  admin | member           # `a | b | c` = enum
}

state {                          # page-LOCAL reactive state
  q     = ""              : text
  users = query listUsers : list<User>   # query → async; exposes @users.loading/.error/.data
}

const TAX = 0.21                 # compile-time immutable scalar (inlined, never reactive)

action add mutates users <- item {   # mutation; `mutates` lists what it may change (enforced)
  users.push(item)               # ops: push | set | reset | remove
  users.push({ name: item.name, role: "admin" })   # inline object literal — build a record inline
  if item.vip { rating.set(5) } else { rating.set(1) }   # if/else = the only branching in actions
}

mock    { listUsers: [ { name: "Ana", role: "admin" } ] }        # mock data (quote text/enum values, like everywhere)
sources { listUsers: { url: "https://api…", at: "results" } }    # real data source for a query
```

A `sources` entry is a complete HTTP request — a bare URL, or `{ url, method?, headers?, body?, at? }`:
```
sources {
  products: "https://api.shop.com/products"                              # GET, response is the array
  orders:   { url: "https://api…/orders", headers: { Authorization: "Bearer KEY" }, at: "data" }
  search:   { url: "https://api…/graphql", method: "POST", body: { query: "…" }, at: "data" }
}
```
- `at` reads the array out of `json[at]` — dotted for nested envelopes (`"data.posts"`). Else the response IS the array. `body` is JSON-encoded (sets `content-type`).
- At build (`muten build`), **GET** sources are fetched and baked into the HTML (SSG); non-GET run only client-side (no build side-effects).
- **Headers ship to the client** like any browser fetch — use public keys or a per-user token, never a server secret.

**Don't repeat the backend — `api { }` in `src/app.muten`** sets the base URL + default headers for ALL sources:
```
# src/app.muten
api { base: "https://api.shop.com/v1"  headers: { Authorization: "Bearer KEY" } }
```
```
# any page — only what differs
sources {
  products: { url: "/products", at: "data" }     # → https://api.shop.com/v1/products, with the Authorization header
  orders:   { url: "/orders",   at: "data" }
}
```
A **relative** source url is joined to `base`; an **absolute** one (`https://…`) ignores it (other host). Source headers override the api defaults. Define the backend once.

**Multiple backends** — name the clients, pick one per source with `{ api: "name" }`:
```
# src/app.muten
api {
  shop: { base: "https://api.shop.com/v1", headers: { Authorization: "Bearer KEY" } }
  cms:  { base: "https://cms.io/api" }
}
```
```
sources {
  products: { api: "shop", url: "/products", at: "data" }
  posts:    { api: "cms",  url: "/posts",    at: "data.posts" }
}
```
No `api` field → the client named `default`. The flat `api { base, headers }` form is just a single default client.

**Writing to the backend (POST/PUT/DELETE)** — a source-backed list gets `create`/`update`/`delete` in an action, fired by an event; each hits the resource endpoint (reusing the source's `api` base + headers) and updates the list reactively:
```
state { orders = query orders : list<Order> }
sources { orders: { api: "shop", url: "/orders", at: "data" } }

action buy  mutates orders <- item { orders.create(item) }   # POST   /orders       → append the result
action edit mutates orders <- item { orders.update(item) }   # PUT    /orders/{id}  → replace by id
action drop mutates orders <- item { orders.delete(item) }   # DELETE /orders/{id}  → remove by id

Button "Buy" -> buy(product)
```
The write action is **async** and exposes reactive **`buy.pending`** (true while in flight) and **`buy.error`** — use them for UX:
```
when buy.pending { Text "Saving…" }
when buy.error { Text "Could not save: {buy.error}" }
```
`create`/`update`/`delete` are **optimistic** — the list changes instantly, reconciles with the server response, and **reverts** if the request fails (with `.error` set). REST convention: create = POST to the collection, update/delete target `/{item.id}`. Local-only mutations stay `push`/`set`/`reset`/`remove`; `create/update/delete` talk to the server.

**Re-running a query — `refetch` (search / pagination / filters)** — call it in an action with **N named params**; they become the query string (`?q=…&page=…`, url-encoded) and the list reloads. Works for any web-app, not just lists:
```
state { q = "" : text  page = 1 : number  products = query products : list<Product> }
sources { products: { url: "/products", at: "data" } }

action search mutates products <- term { products.refetch(q: term, page: 1) }
action next   mutates products         { page.set(page + 1)  products.refetch(q: q, page: page) }

SearchField bind q
Button "Search" -> search(q)
Button "Next"   -> next
```
Pass as many params as you need (`q`, `page`, `sort`, `category`, …). The query's `.loading`/`.error` reflect the refetch.

**Escape hatch — explicit request** (when the API isn't RESTful): `post`/`put`/`delete` a `"client:/path"` (interpolated) with an optional `body`, in an action:
```
action buy    <- item { post "shop:/orders" body item }        # any method, any path
action cancel <- o    { delete "shop:/orders/{o.id}/cancel" }   # custom path, interpolated
action ping           { post "shop:/health" }                   # no body, no `mutates` needed
```
It uses the named client's base + headers; the action is async with `.pending`/`.error`. Prefer `create`/`update`/`delete` when the API is RESTful (those also update the list); reach for `post`/`put`/`delete` only when the convention doesn't fit.

## 6. Primitives
A bare string is the node's main prop. `{ }` = children. Lay out with `style()`, skin with `class()`.

| Primitive | Use | Example |
|---|---|---|
| `Stack` | vertical stack (flex column) | `Stack style(gap.md) { … }` |
| `Page` | page root `<main>` (one per route) | `Page style(padding.lg) { … }` |
| `Header`/`Nav`/`Sidebar`/`Footer` | landmarks | `Header style(row, between, center) { … }` |
| `Text` | paragraph, interpolates | `Text "Hi, {user.name}"` |
| `Title` | heading; level keyword | `Title "Dashboard" h2` |
| `Span` | inline text | `Span "{cart.total}"` |
| `Image` | `<img>`, **alt required** | `Image "{p.image}" alt "{p.title}"` |
| `Link` | client-side nav | `Link "Catalog" -> /catalog` |
| `Button` | runs an action | `Button "Save" -> save(draft)` |
| `SearchField` | text input bound to state | `SearchField bind @q "Search…"` |
| `Form` | auto-form from an entity draft | `Form bind @draft submit create "Save"` |
| `DataTable` | reactive table over a list/query | `DataTable @users columns(name, email)` |
| `RowAction` | a button inside each table row | `RowAction "Delete" -> remove(row.id)` |
| `slot` | outlet inside `shell` | `slot` |
| `Custom` | host-JS escape hatch | `Custom Chart inputs(data: @sales) on(pick: select)` |

Horizontal layout = a region with `style(row)` (there is no `Row` primitive). Clickable card =
`Button { … }` or `Link "" -> /x { … }` with children instead of a label.

Modifiers (after a primitive): `style(tokens)` · `class("css")` · `bind @state` · `submit action` ·
`where(clauses)` · `columns(a, b)` · `alt "…"` · `inputs(k: v)` · `on(event: action)`.
`class()` also toggles reactively (`class(active when isOpen)`); `on(event: action)` works on **any** element
(keydown, mouseenter, change, blur, …) and calls the action — use `Button -> action(arg)` when you need an arg.

## 7. Theme — how it works
`theme.muten` supplies the **scale** (values); the engine owns only the **vocabulary** (token names).
```
theme {
  space       { xs "4px"  sm "8px"  md "16px"  lg "24px"  xl "32px" }
  font        { sm "13px"  md "15px"  lg "20px"  xl "28px" }
  weight      { medium "500"  bold "700" }
  leading     { tight "1.2"  normal "1.5" }
  breakpoints { sm "640px"  md "768px"  lg "1024px" }
}
```
A token like `gap.md` resolves to `gap: 16px` via `space.md`; `text.lg` → `font.lg`; `md:cols.2` uses
`breakpoints.md`. **No CSS/reset goes in `theme.muten`** — the reset and the look live in `src/styles.css`.

### Style tokens (`style(...)`)
```
row column wrap grid grow center between
gap.sm|md|lg   padding.md|lg   padding.x.md   padding.y.md   margin.md
cols.2|3|auto  rows.2
text.sm|md|lg|xl   weight.medium|bold   leading.normal   italic   bold
align.left|center|right   justify.center|between   items.center|start
width.full   height.full
```
Responsive: prefix any token with a breakpoint → `md:cols.2`, `lg:cols.4` (`sm/md/lg/xl`).

## 8. State, actions & reactivity
- `state` cells are signals; reading them in interpolation / `when` / `each` auto-updates that spot.
- `query` state is async → render with `when @x.loading { … }`, then use `@x.data`.
- Mutate **only** through `action`s, and only the state in `mutates` (the linter enforces it):
  - `list.push(x)` (append; auto-fills uuid fields) · `s.set(v)` · `s.reset()` · `list.remove(x => x.id == id)`
  - **Inline object literal** (build a record without leaving Muten): `posts.push({ title: draft.title, body: draft.body })`, `draft.set({ name: c.name })`. Keys must be real fields of the entity.
  - **Edit / move / toggle an item in place**: `list.patch(x => x.id == c.id, { done: not x.done })` — position-preserving, list ONLY the changed fields. This is the right tool for toggle/update/move (NOT remove+push, which reorders the item to the end).
  - There is no `toggle`: `flag.set(not flag)`.
- Control flow in the tree: `when <expr> { … }` (mount/unmount), `each <list> as item { … }` (item is a scope var). Filter a list with `where`: `each posts as p where p.published { … }` renders only matching items.
- Expressions: `== != < > <= >=`, `and or not`, `contains` (case-insensitive substring / list membership),
  `+ - * /`, ternary `c ? a : b`, parentheses, refs (`user.name`, `cart.total`, `$item.x`).
- **List aggregates** (method + lambda, like `remove`) — for a cart total / KPI count / "N active", NO JS needed:
  - `lines.sum(l => l.price * l.qty)` · `todos.count(t => not t.done)` · `reviews.avg(r => r.score)` · `min/max(x => …)`.
  - `.length` is the count-all; `count(x => cond)` is the filtered count. Works in interpolation, `when`, and store `get`.
- **Sort a list** (same method+lambda shape; returns a sorted COPY): `each contacts.sort(c => c.name) as c { … }` (ascending) ·
  `each scores.sortDesc(s => s.points) as s { … }` (descending). Use in `each` or a store `get`.

## 9. Stores — app-global state
A `.store` file = state shared across pages, **no prop drilling**. The file name is the domain.
```
# src/ui.store   → referenced everywhere as ui.<member>
state  { menuOpen = false : bool }
get    isOpen = menuOpen                 # derived/memoized value (read as ui.isOpen)
action toggleMenu mutates menuOpen <- x { menuOpen.set(not menuOpen) }
effect { /* runs whenever the store state it reads changes */ }
```
Use it from any page/shell by name: `when ui.menuOpen { … }`, `Button "☰" -> ui.toggleMenu`. The Vite
plugin auto-detects every `.store` file. `get` = memoized; `effect` = reactive side-effect (Angular-style).
**A page action can CALL a store action** (composition) — `action add <- d { cart.add(d)  draft.reset() }` does
store work AND local work in one handler (e.g. add to the store, then clear the form). Wire it with `Form submit add`.

## 10. Routing — how it works
`src/app.muten` maps URLs to pages. It uses **real paths** (`/about`, History API — client-side nav, no
reload); the **first route is the default**. The folder under `src/pages/` must match the page name.
*(Deploy: the host must serve `index.html` for any path — standard SPA fallback.)*
```
routes {
  /         -> home               # src/pages/home/home.muten
  /about    -> about              # static page → compiles to zero-runtime HTML
  /cart     -> cart guard auth.loggedIn else /login    # guard: a store boolean; redirect if false
  /login    -> login guard not auth.loggedIn else /     # guest-only page
}
```
Guards read a **store boolean**; when it flips (login/logout) the active route re-renders automatically.
A route named `/404` catches any unmatched path (otherwise the first route is shown).
Navigate with `Link "x" -> /path` (client-side, no reload).

**Route params:** a `:seg` in the route captures a URL value. The page declares it with `param <name>`,
then uses it as a read-only string in interpolation / `when` / expressions (it can't be mutated):
```
# app.muten
routes { /product/:id -> product }
# src/pages/product/product.muten
screen product
param id
Page { Title "Product {id}" }
```
Navigating `/product/1` → `/product/2` re-mounts the page with the new `id` (re-fetch the new item).

**`<head>` meta (SEO):** a page declares `meta { title "…" description "…" }` → `<title>` + `<meta>` tags
(`og:title`/`og:description` auto-derived). Applied on navigation and baked into the SSG HTML at build.

### Shell (persistent chrome)
Wrap routes in a `shell { … slot … }` for a nav/footer around every page. `slot` is where the active
page mounts. The shell has **no local state** → use a store for things like a mobile menu:
```
shell {
  Header style(row, between, center) class("nav") {
    Link "Home" -> /
    Button "☰" -> ui.toggleMenu class("burger")
  }
  when ui.menuOpen { Stack class("mobile-menu") { Link "About" -> /about } }
  slot
  Footer { Span "© 2026" }
}
routes { / -> home }
```

## 11. Entities, forms & validation
`entity` defines a shape + constraints. `Form bind @draft submit create` auto-renders one input per
field and validates on submit (per-field `.field-error`), blocking the action if invalid.
```
entity Task { title text required  notes text  done bool }
state  { draft = {} : Task  tasks = [] : list<Task> }
action create mutates tasks, draft <- t { tasks.push(draft)  draft.reset() }
# in the page:  Form bind @draft submit create "Add task"
```

## 12. Parts — reusable composition
`part` = a reusable fragment, **inlined at build** (not a runtime component). Pass OBJECTS (`$x.field`)
and ACTION callbacks (`-> $onPick(...)`).
```
# src/parts/feature.muten
part Feature(item: Feature, onPick: action) {
  Stack style(column, gap.sm) class("card") {
    Title "{$item.title}" h3
    Text  "{$item.body}"
    Button "Choose" -> $onPick($item.id)
  }
}
# use it:  Feature(item: f, onPick: select)
```

## 13. Custom — the host-JS escape hatch
For anything Muten can't express (a chart, a 3rd-party widget), write vanilla JS in
`src/components/<Name>.js` and mount it with `Custom`. It receives `inputs` (values/state) and wires
DOM events to your actions via `on`. This is the ONLY way to use non-Muten UI code.
```
Custom Chart inputs(data: @sales) on(pointSelect: select)
# → src/components/Chart.js exports a mount(el, { inputs, on }) that builds vanilla DOM.
```

## 14. `use` — JS logic functions & framework islands
Two escapes that pull in real JS/npm behind a typed border. Both reuse `use … from`; the prefix decides which.

**Logic functions** — `use` named exports from a `.ts`/`.js` file and call them in any expression:
```
use fmt, slug from "./lib/format.ts"        # named exports ONLY (the .ts is a facade over any npm)
Text "{fmt(order.total)}"                    # called like any expression
Link "{slug(post.title)}" -> /blog/{post.id}
```
Import zod/date-fns/nanoid/whatever *inside* `format.ts` and expose tidy named functions; Muten sees only the
names, so the oracle still checks your calls. Keep the border **synchronous** (no async functions).

**Islands** — mount a real **Svelte or React** component for an interactive widget or framework UI lib Muten
can't express (a date-picker, rich editor, a React charting component):
```
use Counter from "svelte:./Counter.svelte"   # `svelte:` / `react:` prefix = an ISLAND (not a logic fn)
use Likes   from "react:./Likes.jsx"
Page {
  Counter(start: @total, onChange: setTotal)               # props ↓ (@state) + events ↑ (a muten action)
  Likes(start: @total, onLike: setTotal) client:visible    # lazy: hydrate when scrolled into view
}
```
- `prop: @state` sends a value **down** (snapshot; a React island re-renders when the signal changes). `onX: action`
  sends a callback that fires a **muten action** — that's how the island writes **back** to muten state.
- `client:visible` / `client:idle` = **lazy** hydration (load the island's JS only when visible / idle). No
  directive = on load. Every island is code-split, so it never bloats the main bundle.
- **Install the framework's Vite plugin** (`@sveltejs/vite-plugin-svelte` or `@vitejs/plugin-react`) next to
  `muten()` in `vite.config.mjs`. The component file is normal Svelte/React — it owns its own tooling; Muten
  only validates the node + its args. This is how a **React/Svelte component lib** comes in: wrap it in an island.

## 15. Gotchas
- It's NOT React: PascalCase primitives + `{ }` children; no JSX/hooks/`className` (those live in island files, §14).
- No `main.js`/`<script>` — `app.muten` is the entry.
- `style()` (layout tokens) ≠ `class()` (look). No colors/borders in `style()`.
- `Image` without `alt` fails validation (`alt ""` for decorative).
- Actions may only touch their declared `mutates`.
- Want a library? CSS → `class()`. JS function → `use` (§14). A widget → `Custom`. A React/Svelte component → an **island** (§14).

## 16. Minimal full app
```
# src/app.muten
routes { / -> home }

# src/pages/home/home.muten
screen home
state  { name = "" : text }
action greet mutates name <- v { name.set(v) }

Page style(padding.lg, gap.md) {
  Title "Hello"
  SearchField bind @name "Your name"
  when name { Text "Hi, {name}!" }
}
```
Validate anytime: `npm run lint`.
