---
name: muten
description: Read and write Muten — the AI-first frontend DSL this app is built in (.muten and .store files), NOT React/Vue/HTML. Use whenever creating or editing any .muten or .store file, app.muten routes, theme.muten, parts, components, stores, or deciding what can be installed. No model is trained on Muten, so consult this before writing any Muten code or adding a dependency. Assume the human will NOT read the code — you do everything.
---

# Muten — complete language reference

Muten compiles `.muten` files to vanilla JS + fine-grained signals (no virtual DOM). The `@muten/core`
Vite plugin does the compiling. You write a small declarative DSL — **never** React/JSX/Vue/Svelte/HTML.
A page with no reactivity compiles to plain zero-runtime HTML; a reactive one ships ~1KB of signals.

## Mental model & golden rules
- **UI** → `.muten` files (pages, parts, the app root, the theme). **App-global state** → `.store` files.
- **`src/app.muten` is the entry.** `index.html` loads it; the plugin boots it. **Never create `main.js`** or a `<script>` bootstrap.
- Primitives are **PascalCase** (`Stack`, `Text`); keywords/control flow are **lowercase** (`when`, `each`, `state`).
- `style(...)` = layout/typography **tokens** (Muten builds STRUCTURE). `class("...")` = **look** (your CSS / Tailwind). Muten ships no skin.
- `@name` = a state reference. `{expr}` = interpolation inside any string: `Text "Hi, {user.name}"`.
- Each page has **one root node**. Reactivity is automatic: reading a state in interpolation / `when` / `each` re-renders just that spot.

## 1. What you CAN install / use
This is a normal **Vite** project, so the whole Vite/npm ecosystem for **styling, build, and data** works:
- **Tailwind CSS — YES.** Install it (`tailwindcss`, `postcss`, `autoprefixer`), add the config + the
  `@tailwind` directives to `src/styles.css`, and use utilities via `class("flex gap-4 rounded")`.
  `class()` emits raw class names, so any CSS framework (Tailwind, UnoCSS, Bootstrap CSS, your own CSS) works.
- **Sass/SCSS** — supported out of the box if you scaffolded with SCSS (or add `sass`); use `src/styles.scss`.
- **Any Vite plugin / PostCSS plugin** — add it to `vite.config.mjs` alongside `muten()`.
- **Data / utility npm packages** — usable inside `.store` logic and inside `Custom` host components
  (date libs, fetch wrappers, zod, etc.).
- **Host UI via the `Custom` primitive** — write vanilla JS in `src/components/<Name>.js` (charts,
  maps, a third-party widget) and mount it with `Custom`. See §Custom.

## 2. What you CANNOT do
- **No React / Vue / Svelte component libraries as UI.** There is no React/Vue runtime — the UI is
  `.muten` compiled to vanilla DOM. You cannot drop in MUI, Chakra, Ant, shadcn, a React table, etc.
  If you truly need a JS widget, wrap it yourself in a `Custom` component (vanilla JS).
- **No JSX / `.jsx` / `.vue` / hand-written DOM in pages.** No `className`, no hooks, no lifecycle.
- **No arbitrary inline CSS via `style()`** — `style()` only takes the layout/typography tokens below.
  Visual styling (colors, borders, shadows) goes through `class("…")` + your CSS.

## 3. Limitations (current)
- **Routing is hash-based** (`#/path`) and **paths are static** — there are **no route params** yet
  (no `/product/:id`). Model per-item views with state + `when`, or a query param read in host JS.
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
  if item.vip { rating.set(5) } else { rating.set(1) }   # if/else = the only branching in actions
}

mock    { listUsers: [ { name: "Ana", role: admin } ] }          # mock data for a query
sources { listUsers: { url: "https://api…", at: "results" } }    # real data source for a query
```

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
  - There is no `toggle`: `flag.set(not flag)`.
- Control flow in the tree: `when <expr> { … }` (mount/unmount), `each <list> as item { … }` (item is a scope var).
- Expressions: `== != < > <= >=`, `and or not`, `contains` (case-insensitive substring / list membership),
  `+ - * /`, ternary `c ? a : b`, parentheses, refs (`user.name`, `cart.total`, `$item.x`).

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

## 10. Routing — how it works
`src/app.muten` maps URLs to pages. It's a **hash router** (URLs look like `#/about`); the **first
route is the default**. The folder under `src/pages/` must match the page name.
```
routes {
  /         -> home               # src/pages/home/home.muten
  /about    -> about              # static page → compiles to zero-runtime HTML
  /cart     -> cart guard auth.loggedIn else /login    # guard: a store boolean; redirect if false
  /login    -> login guard not auth.loggedIn else /     # guest-only page
}
```
Guards read a **store boolean**; when it flips (login/logout) the active route re-renders automatically.
Navigate with `Link "x" -> /path` (client-side, no reload). **No path params** (`:id`) yet.

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

## 14. Gotchas
- It's NOT React: PascalCase primitives + `{ }` children; no JSX/hooks/`className`.
- No `main.js`/`<script>` — `app.muten` is the entry.
- `style()` (layout tokens) ≠ `class()` (look). No colors/borders in `style()`.
- `Image` without `alt` fails validation (`alt ""` for decorative).
- Actions may only touch their declared `mutates`.
- Want a library? If it's CSS → `class()`. If it's a JS widget → `Custom`. If it's React/Vue UI → not possible.

## 15. Minimal full app
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
