---
name: muten
description: Read and write Muten — the AI-first frontend DSL this app is built in (.muten and .store files), NOT React/Vue/HTML. Use whenever creating or editing any .muten or .store file, app.muten routes, theme.muten, parts, components, stores, or deciding what can be installed. No model is trained on Muten, so consult this before writing any Muten code or adding a dependency. Assume the human will NOT read the code — you do everything.
---

# Muten — complete language reference

Muten compiles `.muten` files to vanilla JS + fine-grained signals (no virtual DOM). The `@muten/core`
Vite plugin does the compiling. You write a small declarative DSL for the UI — **not** React/JSX/Vue/Svelte/HTML.
Muten ships ZERO framework runtime; foreign code comes in only through explicit escapes (`use` for JS logic
functions — §14, `Custom` for a vanilla-JS widget — §13). A page with no reactivity compiles to plain
zero-runtime HTML; a reactive one ships ~1KB of signals.

> **Companion docs (same folder):** [`design.md`](design.md) — how to make pages look great (styling routes,
> the auto-Form skin, modern building blocks like a glass pill navbar).
> [`patterns.md`](patterns.md) — copy-paste app recipes (store-centric CRUD, dashboard KPIs, kanban, calendar,
> `use` facades). Read those when you're building UI or want a proven structure; this file is the language itself.

## Mental model & golden rules
- **UI** → `.muten` files (pages, parts, the app root, the theme). **App-global state** → `.store` files.
- **`src/app.muten` is the entry.** `index.html` loads it; the plugin boots it. **Never create `main.js`** or a `<script>` bootstrap.
- Primitives are **PascalCase** (`Stack`, `Text`); keywords/control flow are **lowercase** (`when`, `each`, `state`).
- `class("...")` is the **single way to style** — layout AND look (your CSS / Tailwind utilities); toggle reactively with `class(active when isOpen)`. Muten builds the STRUCTURE (primitives) and ships no skin.
- A reference is a **bare name** (no sigil) everywhere — `count`, `user.name`, `cart.total`. `{expr}` = interpolation inside a Text/label/path string: `Text "Hi, {user.name}"`. (NOT inside `class("…")` — for a dynamic class use `class(name when cond)`.)
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
- **Host UI via the `Custom` primitive** — write vanilla JS in `src/components/<Name>.js` (charts,
  maps, a third-party widget) and mount it with `Custom`. See §Custom.

## 2. What you CANNOT do
- **No React / Vue / Svelte — at all.** Muten ships ZERO framework runtime. Pages are `.muten` → vanilla DOM;
  you don't compose the app from MUI/Chakra/shadcn. For a widget Muten can't express, drop to a vanilla-JS
  `Custom` (§13); for JS logic, `use` a function (§14). There is no JSX/hooks/`className` anywhere.
- **No arbitrary inline CSS** — there's no inline-style hatch. ALL styling (layout, colors, borders, shadows)
  goes through `class("…")` + your CSS (Tailwind utilities, or your own classes backed by `theme.muten` vars).

## 3. Limitations & known gaps (current — these are real, plan around them)
- **The real build is `vite build` / `npm run dev`, NOT `muten build`.** `muten build` is a STRUCTURE-only static
  export (SSG for crawlability): it omits your `src/styles.css`, and does NOT bundle `use`
  functions (they throw at runtime). Use it only for zero-JS static pages; for any styled/interactive app, ship with Vite.
- **Routing uses quoted string paths** (`"/path"`, History API). Params: `"/product/:id"` + `param id` (see §10).
- **Forms** (`Form` auto-renders from an entity) render EVERY field — **no conditional fields** (gate the whole
  `Form` with a `when`, or split into per-step entities). Input types are `text`/`email`/`number`/`bool`(checkbox)/
  `enum`(select) only — **no password/date/textarea** (drop to `Custom`). An **enum field can't be `required`**.
  `SearchField` is the single bound text input.
- **`match` for enums** — `match status { active -> Text "Active"  lead -> Badge … }` renders the matching arm
  (sugar for N `when status == "x"`). **`DataTable`** shows raw cell
  text (no per-column formatting — use `each` + `Stack` for formatted/badge cells). **No standalone `Select`** (Form
  makes one for enum fields; elsewhere build a button group + `class(active when …)`). **`sort by` takes a literal
  field**, not a state variable (duplicate the `each` per sort key, or sort in a `use` function).
- **`query x live`** needs the server to send a stable `id` per row, or keyed diffing rebuilds every row each push.
- **`Custom` inputs are a snapshot at mount** (not reactive — §13). **Shell has no local state** (use a `.store`).
  **Pages are single-root** (one top node). **Flip a bool** with `x.toggle()`.

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
  users = query listUsers : list<User>   # query → async; exposes users.loading/.error/.data
  # state types: scalar (text/number/bool/email/uuid), list<Entity>, OR list<scalar> (list<text>/list<uuid>/…).
  # an enum lives in an entity field, NOT as a state type; hold its value as text. A list of plain strings is list<text>.
}

const TAX = 0.21                 # compile-time immutable scalar (inlined, never reactive)

action add(item: User) mutates users {   # mutation; typed params in (…); `mutates` lists what it may change (enforced)
  users.push(item)               # local ops: push | set | reset | remove | toggle | patch
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

action buy(item: Order)  mutates orders { orders.create(item) }   # POST   /orders       → append the result
action edit(item: Order) mutates orders { orders.update(item) }   # PUT    /orders/{id}  → replace by id
action drop(item: Order) mutates orders { orders.delete(item) }   # DELETE /orders/{id}  → remove by id

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

action search(term: text) mutates products { products.refetch(q: term, page: 1) }
action next   mutates products         { page.set(page + 1)  products.refetch(q: q, page: page) }

SearchField bind(q)
Button "Search" -> search(q)
Button "Next"   -> next
```
Pass as many params as you need (`q`, `page`, `sort`, `category`, …). The query's `.loading`/`.error` reflect the refetch.

**Live data — `query x live` (WebSocket)** — append `live` to a query to subscribe to a **WebSocket** instead of fetching: the server PUSHES, muten reacts (event-driven, NOT polling). Each message replaces the data; the **keyed reconciliation** updates only the rows whose fields changed (focus/scroll survive) and writes **batch** into one render per frame:
```
state   { prices = query prices live : list<Price> }
sources { prices: { url: "ws://feed.example.com/prices", at: "data" } }
# each prices.data as p { Text "{p.symbol}  {p.value}" }   — only changed rows touch the DOM
```
Plain `WebSocket` under the hood, exposed as one keyword; it **auto-reconnects with backoff** if the socket drops and closes automatically when the page unmounts (a malformed frame is ignored, not fatal). To SEND (e.g. a chat message) the socket is receive-only — write through an action: a `create`/`post` to the backend, or a `use`'d function that POSTs; the server then pushes the updated list back over the socket. Client-side only (deploy via `vite build`). Use `refetch` for user-driven refresh, `live` for server-pushed real-time. (Polling via a timer was intentionally NOT added — it isn't reactive. For *huge* live lists you still virtualize + send server-side deltas, as in any framework.)

**Escape hatch — explicit request** (when the API isn't RESTful): `post`/`put`/`delete` a `"client:/path"` (interpolated) with an optional `body`, in an action:
```
action buy(item: Order) { post "shop:/orders" body item }        # any method, any path
action cancel(o: Order) { delete "shop:/orders/{o.id}/cancel" }   # custom path, interpolated
action ping           { post "shop:/health" }                   # no body, no `mutates` needed
```
It uses the named client's base + headers; the action is async with `.pending`/`.error`. Prefer `create`/`update`/`delete` when the API is RESTful (those also update the list); reach for `post`/`put`/`delete` only when the convention doesn't fit.

## 6. Primitives
A bare string is the node's main prop. `{ }` = children. Style everything (layout + look) with `class()`.

| Primitive | Use | Example |
|---|---|---|
| `Stack` | vertical stack (flex column) | `Stack class("gap-4") { … }` |
| `Page` | page root `<main>` (one per route) | `Page class("p-6") { … }` |
| `Header`/`Nav`/`Sidebar`/`Footer` | landmarks | `Header class("flex flex-row justify-between items-center") { … }` |
| `Text` | paragraph, interpolates | `Text "Hi, {user.name}"` |
| `Title` | heading; level keyword | `Title "Dashboard" h2` |
| `Span` | inline text | `Span "{cart.total}"` |
| `Image` | `<img>`, **alt required** | `Image "{p.image}" alt("{p.title}")` |
| `Icon` | icon via Iconify `set:name`, inlined SVG at build (tree-shaken) | `Icon "lucide:settings" class("text-xl")` |
| `Video` | `<video>`; bare-keyword flags `controls autoplay loop muted playsinline` | `Video "clip.mp4" controls` |
| `Link` | client-side nav | `Link "Catalog" -> "/catalog"` |
| `Button` | runs an action | `Button "Save" -> save(draft)` |
| `SearchField` | text input bound to state | `SearchField bind(q) "Search…"` |
| `Form` | auto-form from an entity draft | `Form bind(draft) submit(create) "Save"` |
| `DataTable` | table over a list/query (`@` sigil; raw cells, no per-column format) | `DataTable @users columns(name, email)` |
| `RowAction` | a button inside each table row | `RowAction "Delete" -> remove(row.id)` |
| `slot` | outlet inside `shell` | `slot` |
| `Custom` | host-JS escape hatch | `Custom Chart inputs(data: sales) on(pick: select)` |

Horizontal layout = a region with `class("flex flex-row")` (a `Stack` is flex-column by default; there is no
`Row` primitive). Clickable card = `Button { … }` or `Link "" -> "/x" { … }` with children instead of a label.

Modifiers (after a primitive): `class("css")` · `bind(state)` · `submit(action)` ·
`where(clauses)` · `columns(a, b)` · `alt("…")` · `inputs(k: v)` · `on(event: action)`.
`class()` also toggles reactively (`class(active when isOpen)`); a **hyphenated OR multi-class** name must be QUOTED
in a reactive toggle: `class("is-open" when x)`, `class("ring-2 ring-primary" when x)` (each token toggles
independently; bare `is-open` parses as a subtraction and errors). Stack several toggles on one node freely. `on(event: action)` works on **any** element
(keydown, mouseenter, change, blur, …) and calls the action — use `Button -> action(arg)` when you need an arg.
**`on(enter: action)`** is a synthetic event for inputs: it fires only on the Enter key. So a chat/search box that
submits on Enter is `SearchField bind(draft) on(enter: send)` (the action reads `draft` and `draft.reset()` clears
it via the two-way bind) — no `Custom` needed for "Enter to send + clear".

## 7. Theme — how it works
`theme.muten` is the agnostic **source of design values**. muten emits each entry as a `:root` CSS custom
property your CSS / `class()` consumes — `space.md "16px"` → `--space-md: 16px`, `font.lg` → `--font-lg`,
`colors.primary` → `--color-primary`.
```
theme {
  space       { xs "4px"  sm "8px"  md "16px"  lg "24px"  xl "32px" }
  font        { sm "13px"  md "15px"  lg "20px"  xl "28px" }
  weight      { medium "500"  bold "700" }
  leading     { tight "1.2"  normal "1.5" }
  breakpoints { sm "640px"  md "768px"  lg "1024px" }
}
```
Consume the vars from `src/styles.css`: `.card { padding: var(--space-lg); font-size: var(--font-lg) }`, then
apply with `class("card")`. **No CSS/reset goes in `theme.muten`** — the reset and the look live in `src/styles.css`.

### With a CSS framework (Tailwind / DaisyUI) — muten is AGNOSTIC
`theme.muten` holds your theme VALUES; a **styling adapter** (data, in `vite.config` — the scaffolder wires it
per library) tells muten how to emit them for your library. The **muten engine knows no library**; you bring
the styling, muten emits your theme into its format. When you scaffold with Tailwind/DaisyUI you get a theme
skeleton seeded for you; plain css/scss gets an empty `theme { }` (muten emits plain `:root` vars). **Hyphenated
keys are QUOTED** (like hyphenated classes):
```
theme {
  colors { primary "#6366f1"  "base-100" "#1a1d23" }   # "base-100"/"primary-content" quoted; primary bare
  radius { box "0.75rem" }
  scheme { mode "dark" }                                # color-scheme for libraries that use it (DaisyUI)
}
```
Style with `class()` using your library's utilities (`class("bg-primary p-4 hover:bg-primary")`). **Validation of
class names is your library's job** (its IntelliSense / build) — muten doesn't check them (it's agnostic; a future
muten styling *plugin* could add per-library linting).

### Styling: one path — `class("...")`
Everything (layout AND look) is a `class("...")`. Two equivalent backings — pick ONE per app:
- **Tailwind** (the default scaffold): write utilities directly. A `Stack` is flex-column by default;
  a horizontal row is `class("flex flex-row")`.
  ```
  Stack class("flex flex-col gap-4 p-6")          # column with gap + padding
  Header class("flex flex-row justify-between items-center")
  Stack class("grid grid-cols-3 gap-4")           # 3-col grid
  Text "Total" class("text-xl font-bold")
  ```
  Responsive: prefix with Tailwind's breakpoints → `class("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4")`.
- **Library-free** (theme-only): write real CSS in `src/styles.css` using the vars `theme.muten` emits, then
  apply with a semantic class.
  ```css
  .row  { display: flex; flex-direction: row; gap: var(--space-md); }
  .card { padding: var(--space-lg); border-radius: var(--radius-md); }
  ```
  ```
  Stack class("row")            # → display:flex; flex-direction:row; gap:var(--space-md)
  Stack class("card")
  ```
  The scaffold ships base classes like `.mu-stack` (the `Stack` primitive's flex-column).

## 8. State, actions & reactivity
- `state` cells are signals; reading them in interpolation / `when` / `each` auto-updates that spot.
- `query` state is async → render with `when x.loading { … }`, then use `x.data`.
- Mutate **only** through `action`s, and only the state in `mutates` (the linter enforces it):
  - `list.push(x)` (append; auto-fills uuid fields) · `s.set(v)` · `s.reset()` · `s.toggle()` (flip a bool) · `list.remove where id == itemId`
  - **Inline object literal** (build a record without leaving Muten): `posts.push({ title: draft.title, body: draft.body })`, `draft.set({ name: c.name })`. Keys must be real fields of the entity.
  - **Edit / move / toggle an item in place**: `list.patch where id == c.id with { done: not done }` — position-preserving, list ONLY the changed fields. This is the right tool for toggle/update/move (NOT remove+push, which reorders the item to the end).
  - **Item fields are bare inside `where`/`with`** (item-implicit, like a `where`-filter). So a param must be named DIFFERENTLY from any field: `remove where id == id` is an error (both mean the field) — write `remove where id == itemId` with the param named `itemId`. The oracle flags the clash and tells you to rename.
- Control flow in the tree: `when <expr> { … }` (mount/unmount), `each <list> as item { … }` (item is a scope var). Filter a list with `where`: `each posts as p where p.published { … }` renders only matching items.
- Expressions: `== != < > <= >=`, `and or not`, `contains` (case-insensitive substring / list membership),
  `+ - * /`, ternary `c ? a : b`, parentheses, refs (`user.name`, `cart.total`, `$item.x`).
- **List aggregates** — `by` projects a value per item, `where` is a predicate; item fields are bare (item-implicit). For a cart total / KPI count / "N active", NO JS needed:
  - `lines.sum by price * qty` · `todos.count where not done` · `reviews.avg by score` · `prices.min by amount` · `prices.max by amount`.
  - `.length` is the count-all; `count where cond` is the filtered count. Works in interpolation, `when`, and a `get`.
  - **Embedding in a bigger expression needs grouping `()`** (the `by`/`where` body runs to the end): `when (todos.count where not done) > 0 { … }`. Standalone (in a `get`) needs none: `get openCount = todos.count where not done`.
- **Sort a list** (`sort by` ascending / `sortDesc by` descending; returns a sorted COPY): `each contacts.sort by name as c { … }` ·
  `each scores.sortDesc by points as s { … }`. Use in `each` or a `get`. The key is a **literal field**, not a state
  variable (no `sort by sortKey` — duplicate the `each` per key, or sort in a `use` fn).
- **`match` for enums** (sugar over N `when`): renders the arm whose value the subject equals. Each arm is `value -> node`
  or `value -> { … }`; the value is the enum literal (bare or quoted). Cleaner than repeating `when status == "x"`:
  ```
  match deal.stage {
    new       -> Text "New"      class("badge")
    qualified -> Text "Qualified" class("badge badge-info")
    won       -> { Icon "lucide:check"  Text "Won" }
  }
  ```
  A reactive class per value works too: `class("badge-high" when item.priority == "high")` (quote hyphenated names).

## 9. Stores — app-global state
A `.store` file = state shared across pages, **no prop drilling**. The file name is the domain.
```
# src/ui.store   → referenced everywhere as ui.<member>
state  { menuOpen = false : bool }
get    isOpen = menuOpen                 # derived/memoized value (read as ui.isOpen)
action toggleMenu mutates menuOpen { menuOpen.toggle() }
effect { /* runs whenever the store state it reads changes */ }
```
Use it from any page/shell by name: `when ui.menuOpen { … }`, `Button "☰" -> ui.toggleMenu`. The Vite
plugin auto-detects every `.store` file. `get` = memoized; `effect` = reactive side-effect (Angular-style).
**A page action can CALL a store action** (composition) — `action add(d: Item) mutates draft { cart.add(d)  draft.reset() }` does
store work AND local work in one handler (e.g. add to the store, then clear the form). Wire it with `Form submit(add)`.

## 10. Routing — how it works
`src/app.muten` maps URLs to pages. It uses **quoted string paths** (`"/about"`, History API — client-side nav, no
reload); the **first route is the default**. The folder under `src/pages/` must match the page name.
*(Deploy: the host must serve `index.html` for any path — standard SPA fallback.)*
```
routes {
  "/"       -> home               # src/pages/home/home.muten
  "/about"  -> about              # static page → compiles to zero-runtime HTML
  "/cart"   -> cart guard auth.loggedIn else "/login"    # guard: a store boolean; redirect if false
  "/login"  -> login guard not auth.loggedIn else "/"    # guest-only page
}
```
Guards read a **store boolean**; when it flips (login/logout) the active route re-renders automatically.
A route named `"/404"` catches any unmatched path (otherwise the first route is shown).
Navigate with `Link "x" -> "/path"` (client-side, no reload).

**Route params:** a `:seg` in the route captures a URL value. The page declares it with `param <name>`,
then uses it as a read-only string in interpolation / `when` / expressions (it can't be mutated):
```
# app.muten
routes { "/product/:id" -> product }
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
  Header class("flex flex-row justify-between items-center nav") {
    Link "Home" -> "/"
    Button "☰" -> ui.toggleMenu class("burger")
  }
  when ui.menuOpen { Stack class("mobile-menu") { Link "About" -> "/about" } }
  slot
  Footer { Span "© 2026" }
}
routes { "/" -> home }
```

## 11. Entities, forms & validation
`entity` defines a shape + constraints. `Form bind(draft) submit(create)` auto-renders one input per
field and validates on submit (per-field `.field-error`), blocking the action if invalid.
```
entity Task { title text required  notes text  done bool }
state  { draft = {} : Task  tasks = [] : list<Task> }
action create(t: Task) mutates tasks, draft { tasks.push(t)  draft.reset() }
# in the page:  Form bind(draft) submit(create) "Add task"
```
`Form` renders EVERY field, no `when` inside it (gate the whole Form with a `when`, or split entities for a wizard).
Input types: `text`/`email`/`number`/`bool`(checkbox)/`enum`(select) only — password/date/textarea need a `Custom`.
An enum field **cannot be `required`**. See §3.

## 12. Parts — reusable composition
`part` = a reusable fragment, **inlined at build** (not a runtime component). Pass OBJECTS (`$x.field`)
and ACTION callbacks (`-> $onPick(...)`). A scalar param (`text`/`number`) also takes a **literal or a ref**:
`Stat(label: "Users", value: userCount)` — quoted literals stay literals, bare names are refs.
```
# src/parts/feature.muten
part Feature(item: Feature, onPick: action) {
  Stack class("flex flex-col gap-2 card") {
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
# → src/components/Chart.js defines `function mount(el, inputs, on) { ... }` (NOT `export` — see below).
#   THREE positional args: el = the host <div>, inputs = { data }, on = { pointSelect }.
#   Call a handler with `on.pointSelect(payload)`; read a value with `inputs.data`.
```
- Signature is **`mount(el, inputs, on)`** (three positional args), NOT `mount(el, { inputs, on })`.
- Define it as a plain `function mount(...)`, **not** `export function mount` — the file is inlined, so an
  `export` is a syntax error and leaves the screen blank.
- **An input value needs `@` to pass STATE: `inputs(data: @sales)` passes the array; bare `inputs(data: sales)`
  passes the literal string "sales".** The value is a **snapshot** at mount time (not reactive) — to feed a
  query's rows, make a `get` first: `get rows = orders.data` then `inputs(data: @rows)`.

## 14. `use` — JS logic functions
One escape that pulls in real JS/npm behind a typed, **synchronous** border. `use` named exports from a
`.ts`/`.js` file and call them in any expression:
```
use fmt, slug from "~/lib/format.ts"        # named exports ONLY (the .ts is a facade over any npm)
Text "{fmt(order.total)}"                    # called like any expression
Link "{slug(post.title)}" -> "/blog/{post.id}"
```
**Paths: prefer `~/` (absolute, from `src/`).** `~/lib/format.ts` resolves the SAME from EVERY file — no
counting `../`. Write `use x from "~/lib/format.ts"` whether you're in `src/pages/a/b.muten` or a part; it's
always `src/lib/format.ts`. (`./`/`../` relative still works, but `~/` is the canonical, location-independent form.)
A `use` function can ALSO be **called as a statement inside an action or `effect`** — a side effect (persist to
localStorage, scroll, analytics) that Muten can't express:
```
use persist, scrollBottom from "./fx.ts"
action send(text: text) mutates messages {
  messages.push({ role: "user", content: text })
  persist(messages)      # use fn as a statement: a side effect, NO muten state mutated (so no `mutates` entry)
  scrollBottom()
}
```
The call is checked like any other (undeclared → `unknown-function`). This replaces the old "every side effect
needs a `Custom` component" pattern. Keep the border **synchronous** (no async/`await`); for async I/O use a
`query` / `create` / `update` / `delete` (those are async with `.pending`/`.error`).

Import zod/date-fns/nanoid/whatever *inside* `format.ts` and expose tidy named functions; Muten sees only the
names, so the oracle still checks your calls. For a visual widget Muten can't express (a chart, a map, a
date-picker), drop to a vanilla-JS `Custom` (§13) — there is no framework-component escape; Muten owns the whole UI.

## 15. Gotchas
- It is NOT JSX — PascalCase primitives + `{ }` children; no JSX/hooks/`className` anywhere.
- No `main.js`/`<script>` — `app.muten` is the entry.
- `class()` is the ONLY way to style — layout AND look (Tailwind utilities, or your CSS backed by `theme.muten` vars).
- `Image` without `alt` fails validation (`alt("")` for decorative).
- Actions may only touch their declared `mutates`.
- **The runnable build is `vite build` / `npm run dev`, not `muten build`** (which is structure-only SSG — §3).
- **Paths are quoted strings** (`-> "/x"`, `routes { "/x" -> p }`); a hyphenated reactive class must be quoted (`class("is-open" when x)`).
- **`Custom` inputs need `@` to pass state** (`inputs(data: @items)`) and are a snapshot, not reactive (§13).
- Want a library? CSS → `class()`. JS function → `use` (§14, also callable in actions). A widget → `Custom` (§13). There is no framework-component escape.

## 16. Minimal full app
```
# src/app.muten
routes { "/" -> home }

# src/pages/home/home.muten
screen home
state  { name = "" : text }
action greet(v: text) mutates name { name.set(v) }

Page class("flex flex-col gap-4 p-6") {
  Title "Hello"
  SearchField bind(name) "Your name"
  when name { Text "Hi, {name}!" }
}
```
Validate anytime: `npm run lint`.
