# create-muten

The official scaffolder for **[Muten](https://www.npmjs.com/package/@muten/core)** — an AI-first
frontend framework. One command bootstraps a complete, ready-to-run Muten app, so you never copy
boilerplate by hand.

```sh
npm create muten@latest
```

## Why this exists

Muten ships as **two** packages — the same split as `vue` ↔ `create-vue`:

- **[`@muten/core`](https://www.npmjs.com/package/@muten/core)** — the engine (compiler + runtime +
  Vite plugin). Your app installs it as a normal dependency and it stays up to date on its own.
- **`create-muten`** (this package) — a tiny, **zero-dependency** CLI whose only job is to generate a
  new project already wired to the engine: `index.html`, the Vite config, a `theme.muten`, a first
  page and the right `package.json`.

You run `create-muten` **once** to scaffold; after that you just work inside your project.

## Quick start

Every package manager has a `create` shortcut. `create-muten` detects which one you used and makes it
the default for the rest of the prompts:

```sh
npm  create muten@latest        # npm
pnpm create muten               # pnpm
yarn create muten               # yarn
bun  create muten               # bun
```

Prefer no install step? Run it on demand with **npx**, optionally naming the folder:

```sh
npx create-muten my-app
```

Or install it **globally** and reuse the command anywhere:

```sh
npm i -g create-muten
create-muten my-app
```

Then start the app:

```sh
cd my-app
npm install        # only if you skipped the auto-install
npm run dev
```

## What it asks

In an interactive terminal it prompts for a few things (defaults in parentheses):

| Prompt | Options | Default |
|---|---|---|
| **Project name** | any valid folder name | `muten-app` |
| **Template** | `basic` / `routing` / `full` | `basic` |
| **Stylesheet** | `css` / `scss` | `css` |
| **Add Tailwind CSS?** | `Y` / `n` (CSS only) | `n` |
| **Add DaisyUI?** | `Y` / `n` (needs Tailwind) | `n` |
| **Framework islands?** | `none` / `svelte` / `react` / `both` | `none` |
| **Package manager** | `npm` / `pnpm` / `yarn` / `bun` | the one that launched it |
| **Install deps and start dev now?** | `Y` / `n` | `Y` |

Tailwind is an optional add-on **on top of** CSS (the look layer; you still style via `class("…")`) — it
wires `@tailwindcss/vite` + an `@import "tailwindcss"` and notes the setup in the app's `.claude/` guide.

## Templates

| Template | What you get |
|---|---|
| **basic** | one page — the minimal starter |
| **routing** | a persistent shell (navbar + footer) + multiple real-path routes + a static `about` page |
| **full** | routing + a `.store` + an `api` block + a source-backed products page + Tailwind — a real data app |

When **Tailwind or DaisyUI** is selected, `theme.muten` is centralized to **match Tailwind's scale** (so
`style()` tokens and Tailwind utilities share one scale, e.g. `style(gap.md)` == `gap-4`); plain CSS/SCSS
keeps the default scale. **DaisyUI** adds component classes (`btn`, `card`, `modal`) usable in `class("…")` —
pure classes, no React; behavior is Muten state + `on()`.

**Framework islands** (`svelte` / `react` / `both`) wire `@sveltejs/vite-plugin-svelte` / `@vitejs/plugin-react`
into `vite.config.mjs` so you can drop a real Svelte/React component (incl. React libs like **shadcn/Radix**)
into a page as an *island* — `use X from "react:./X.jsx"` → `X(value: @s, onChange: act) client:visible`
(props ↓ + events ↑, lazy + code-split). Default to `.muten`; reach for an island only for the hard widget.

If you accept the last prompt it runs `<pm> install` followed by `<pm> run dev` — your app is live in a
single step. Choosing SCSS also adds `sass` and switches the stylesheet to `.scss` automatically.

## Non-interactive (CI / scripts)

Pass the answers as arguments and it skips every prompt (this is also what runs when there is no TTY,
e.g. in CI):

```sh
create-muten my-app --scss --pm pnpm      # full control
create-muten my-app --css --no-install    # just scaffold, decide later
```

| Flag | Effect |
|---|---|
| `<name>` | the project folder (positional argument) |
| `--template <basic\|routing\|full>` | which starter (default: `basic`; `full` implies Tailwind) |
| `--css` / `--scss` | pick the stylesheet (default: `css`) |
| `--tailwind` | add Tailwind CSS v4 on top of CSS (forces `--css`) |
| `--daisyui` | add DaisyUI component classes (implies `--tailwind`) |
| `--svelte` / `--react` | wire the Svelte / React island plugin (drop in framework components, e.g. shadcn) |
| `--pm <npm\|pnpm\|yarn\|bun>` | package manager to use (default: detected) |
| `--no-install` | scaffold only — don't install or start the dev server |
| `--help` | print usage and exit |
| `--version` | print the version and exit |

## What you get

A minimal, conventional Muten app:

```
my-app/
├─ index.html              # entry — loads /src/app.muten through the Vite plugin
├─ vite.config.mjs         # the @muten/core Vite plugin (dev server, HMR, routing)
├─ theme.muten             # your design tokens: spacing, fonts, weights, breakpoints
├─ package.json            # depends on @muten/core + vite
└─ src/
   ├─ app.muten            # the ROOT: routes (+ an optional persistent shell)
   ├─ styles.css           # your look (.scss if you chose SCSS)
   └─ pages/
      └─ home/home.muten   # a page — the folder name is its route
```

There is **no hand-written `main.js`**: the Vite plugin compiles `src/app.muten` into the app's entry,
so the whole app is `.muten` from the first line.

## What you can build

A muten app reaches the whole web platform through bounded escapes — reach for the **lowest tier that works**:

- **Pure muten** — CRUD / SaaS / catalog / dashboard / content: pages, routing, `state`/`store`, `query` over
  REST, `Form` + validation, `DataTable`, `when`/`each`, SSG + SEO. The declarative 80%, zero extra deps.
- **muten + the platform** *(no framework runtime)* — native HTML (`<input type="date">`, `<dialog>`) + `class()`,
  CSS libs (Tailwind / DaisyUI), **vanilla JS via `Custom`** (charts, maps, date-pickers, rich-text, grids),
  `use fmt from "./lib.ts"` for any JS logic. Almost every "hard widget" lands here, *without React*.
- **Svelte / React island** (`--svelte` / `--react`) — only when the component *is* a framework component
  (shadcn/ui, a React-only lib). Ships that runtime, lazy + code-split. The narrow last resort.

Full reference (every primitive, the three tiers, the roadmap): [`@muten/core`](https://www.npmjs.com/package/@muten/core).

> **Status: pre-1.0.** The core (language, compiler, CLI, Vite plugin, extension, islands) is solid; the
> ecosystem is young and full island SSR is experimental. Great for real apps, not yet for critical production.

## Requirements

- **Node.js 18+**
- One of: **npm**, **pnpm**, **yarn**, **bun**

## Cross-platform

`create-muten` is a Node CLI (not a shell script), so the **exact same command** works on **Windows,
macOS and Linux** — npm generates the right launcher on each OS.

## Links

- Engine — [`@muten/core`](https://www.npmjs.com/package/@muten/core)
- Source — [github.com/karttofer/create-muten](https://github.com/karttofer/create-muten)
- License — MIT
