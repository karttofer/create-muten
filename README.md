## ALPHA - STILL ON DEVELOPMENT
Muten is still under active development. We are currently in the alpha stage and are working on training models with Muten. Please keep in mind that improvements are being made gradually, and version 1.0 has not been released yet.

The official scaffolder for **[Muten](https://www.npmjs.com/package/@muten/core)**: an AI-first
frontend framework. One command bootstraps a complete, ready-to-run Muten app, so you never copy
boilerplate by hand.

```sh
npm create muten@latest
```

## Why this exists

Muten ships as **two** packages - the same split as `vue` ↔ `create-vue`:

- **[`@muten/core`](https://www.npmjs.com/package/@muten/core)**: the engine (compiler + runtime +
  Vite plugin). Your app installs it as a normal dependency and it stays up to date on its own.
- **`create-muten`** (this package) - a tiny, **zero-dependency** CLI whose only job is to generate a
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
| **Styling** | `CSS` / `SCSS` / `Tailwind CSS` / `DaisyUI` (brings Tailwind) | `CSS` |
| **Add Vercel deploy config?** | `Y` / `n` | `n` |
| **Desktop app (Tauri)?** | `Y` / `n` | `n` |
| **Package manager** | `npm` / `pnpm` / `yarn` / `bun` | the one that launched it |
| **Install deps and start dev now?** | `Y` / `n` | `Y` |

**Styling is one explicit choice**: each is opt-in, nothing is bundled by default: `CSS` (plain) or `SCSS`
ship no framework; `Tailwind CSS` adds `@tailwindcss/vite` + `@import "tailwindcss"`; `DaisyUI` adds its
component classes on top (and brings Tailwind). You always style via `class("…")`.

**Targets are independent opt-ins**: web, desktop, both, or neither, from the same `.muten` source:
- **Vercel** writes a `vercel.json` so muten's real-path routes don't 404 on a hard refresh (SPA fallback to `index.html`).
- **Tauri** adds `src-tauri/` (a native desktop app - ships the OS webview, *not* a browser) + a `tauri` script:
  `npm run tauri dev` / `tauri build`. Needs the [Rust toolchain](https://rustup.rs) installed (not auto-installed).

## Styling

When **Tailwind or DaisyUI** is added, `theme.muten` is centralized to **match Tailwind's scale** (so
`style()` tokens and Tailwind utilities share one scale, e.g. `style(gap.md)` == `gap-4`); plain CSS/SCSS
keeps the default scale. **DaisyUI** adds component classes (`btn`, `card`, `modal`) usable in `class("…")` -
pure classes; behavior is Muten state + `on()`.

If you accept the last prompt it runs `<pm> install` followed by `<pm> run dev`, your app is live in a
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
| `--css` / `--scss` | pick the stylesheet (default: `css`) |
| `--tailwind` | add Tailwind CSS v4 on top of CSS (forces `--css`) |
| `--daisyui` | add DaisyUI component classes (implies `--tailwind`) |
| `--vercel` | add `vercel.json` (SPA fallback so real-path routes work on Vercel) |
| `--tauri` | add `src-tauri/` - a native desktop app (needs the Rust toolchain) |
| `--pm <npm\|pnpm\|yarn\|bun>` | package manager to use (default: detected) |
| `--no-install` | scaffold only - don't install or start the dev server |
| `--help` | print usage and exit |
| `--version` | print the version and exit |

## What you get

A minimal, conventional Muten app:

```
my-app/
├─ index.html              # entry - loads /src/app.muten through the Vite plugin
├─ vite.config.mjs         # the @muten/core Vite plugin (dev server, HMR, routing)
├─ theme.muten             # your design tokens: spacing, fonts, weights, breakpoints
├─ package.json            # depends on @muten/core + vite
└─ src/
   ├─ app.muten            # the ROOT: routes (+ an optional persistent shell)
   ├─ styles.css           # your look (.scss if you chose SCSS)
   └─ pages/
      └─ home/home.muten   # a page - the folder name is its route
```

There is **no hand-written `main.js`**: the Vite plugin compiles `src/app.muten` into the app's entry,
so the whole app is `.muten` from the first line.

## What you can build

**Honest framing first.** muten isn't trying to beat React/Vue/Svelte at being general-purpose, they win there.
muten wins when an **AI builds and maintains the app**: the whole language fits in context, a compiler (`muten
check`) catches mistakes in milliseconds without a browser, edits stay tiny, and almost no JS ships. Best fit: the
declarative 80% - CRUD, dashboards, catalogs, content, internal tools. For the rest, you don't fight it - you
**couple in other tech** through bounded escapes. Reach for the **lowest tier that works**:

- **Pure muten**: CRUD / SaaS / catalog / dashboard / content: pages, routing, `state`/`store` (with page→store
  action composition), `query` over REST, `Form` (text/number/email/bool/enum + validation), `DataTable`,
  `when`/`each`, SSG + SEO, and the bounded **list toolkit**: inline objects, `patch where`/`remove where` edits,
  `each…where` filter, aggregates (`sum`/`count`/`avg`/`min`/`max by`), `sort`/`sortDesc by`, `toggle`. The
  declarative 80%, zero extra deps.
- **muten + the platform** *(no framework runtime)* - native HTML (`<input type="date">`, `<dialog>`) + `class()`,
  CSS libs (Tailwind / DaisyUI), **vanilla JS via `Custom`** (charts, maps, date-pickers, rich-text, grids),
  `use fmt from "./lib.ts"` for any JS logic. Almost every "hard widget" lands here - muten ships zero framework
  runtime, so there is no React/Svelte escape; foreign UI comes in as a vanilla `Custom` component.

**Deploy, honestly:** `npm run dev` runs both tiers. For production, pure-muten static content can ship via
`muten build` (zero-JS HTML); the moment you use `use`/`Custom`/shared cross-page state, deploy with a normal
`vite build` (it bundles them - the static build doesn't). Most real apps use `vite build`.

Full reference (every primitive, the tiers, the roadmap): [`@muten/core`](https://www.npmjs.com/package/@muten/core).

> **Status: pre-1.0.** The core (language, compiler, CLI, Vite plugin, extension) is solid; the
> ecosystem is young. Great for real apps, not yet for critical production.

## Requirements

- **Node.js 18+**
- One of: **npm**, **pnpm**, **yarn**, **bun**

## Cross-platform

`create-muten` is a Node CLI (not a shell script), so the **exact same command** works on **Windows,
macOS and Linux**: npm generates the right launcher on each OS.

## Links

- Engine - [`@muten/core`](https://www.npmjs.com/package/@muten/core)
- Source - [github.com/karttofer/create-muten](https://github.com/karttofer/create-muten)
- License - MIT
