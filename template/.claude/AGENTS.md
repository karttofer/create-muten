# Working in a Muten app — guide for AI agents

This project uses **Muten**, an AI-first frontend framework. The UI is written in **`.muten` files**
(a small declarative DSL) — **not** React, JSX, Vue, Svelte or hand-written HTML/JS. No model is
trained on Muten yet, so **follow this guide instead of guessing**: never import React/Vue, never write
`.jsx`/`.vue`, never add a JS bootstrap.

> Full language reference (every primitive, prop, token, pattern): the **`muten` skill** at
> [`skills/muten/SKILL.md`](skills/muten/SKILL.md).

## Golden rules
- UI → `.muten` files. App-global state → `.store` files. Both compile via the `@muten/core` Vite plugin.
- **No `main.js`.** `src/app.muten` IS the entry (loaded by `index.html`). Never add a JS entry/bootstrap.
- Primitives are **PascalCase** (`Stack`, `Text`, `Button`); control flow is lowercase (`when`, `each`).
- **`style(...)`** = layout/typography tokens (Muten builds STRUCTURE). **`class("...")`** = your look
  (your CSS / Tailwind). Muten ships no skin — appearance is yours.
- State references use `@name`; interpolate in any string with `{expr}`: `Text "Hi, {user.name}"`.

## File map
```
src/
  app.muten                    ROOT — routes { /url -> page }  (+ optional shell { … slot … })
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
- **Content:** `Text`, `Title "x" h2`, `Span`, `Image "{src}" alt "…"` (alt required), `Link "x" -> /route`, `Button "x" -> action(arg)`.
- **Data:** `DataTable @list columns(a, b)`, `Form bind @draft submit create`, `SearchField bind @q`.
- **Control:** `when <expr> { … }`, `each <list> as item { … }`.
- **State:** `state { q = "" : text  users = query listUsers : list<User> }` — query states expose `.loading/.error/.data`.
- **Actions:** `action add mutates users <- item { users.push(item) }` — ops: `push/set/reset/remove`; branch with `if/else`.
- **Tokens:** `gap.md padding.lg cols.3 text.lg row center between` — responsive prefix: `md:cols.2`.

## Dependencies & limits
- **CSS / Tailwind / SCSS: YES** — it's a Vite app; install them and use `class("…")` + your CSS.
- **React / Vue / Svelte UI libraries: NO** — the UI is `.muten` (vanilla DOM, no JS framework runtime).
  Need a JS widget? Wrap it in a `Custom` host component (`src/components/<Name>.js`).
- Routing is **hash-based with static paths** (no `:id` params yet). Shell has no local state → use a
  `.store`. No `toggle` op → `set(not x)`. `style()` is layout tokens only; visuals go in `class()`.
- The full reference (stores, routing, theme, every primitive) is in [`skills/muten/SKILL.md`](skills/muten/SKILL.md).

## Commands
`npm run dev` (dev server + HMR) · `npm run build` (production) · `npm run lint` (validate `.muten`).
