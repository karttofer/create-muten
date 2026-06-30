# Plugins & component libraries

Muten ships **no component library** in the core (the styling core is agnostic - see [Styling](styling.md)).
Components come from **plugins**: ordinary npm packages, published under an org (e.g. `@muten/shadcn`), that
carry a **registry** of muten parts + classes. You either **import** them or **eject** (copy) them. Nothing is a
runtime - whatever you use compiles away with your app.

## Installing a plugin

```sh
npm install @muten/shadcn
```

A styling plugin also ships a stylesheet you import once (after Tailwind), in `src/styles.css`:

```css
@import "tailwindcss";
@import "@muten/shadcn/globals.css";   /* its @theme tokens + component classes */
```

If the plugin themes the app (shadcn does), empty your `theme.muten` colors so they do not fight it:

```
theme { scheme { mode "dark" } }
```

## Two ways to use a component

### 1. Import - use as-is (`plugins {}` in `muten.config`)

Declare the plugin once; its parts become available across the whole app, no copies:

```
# muten.config
plugins {
  shadcn {}
}
```

```
# any page - Card, Badge, Dialog, ... just work
Card { CardHeader { CardTitle(label: "Create project") } }
```

`<key> {}` maps to the package `@muten/<key>`. The block can hold per-plugin config later; `{}` is the default.

### 2. Eject - own the source (`muten add`)

`muten add` copies a component's `.muten` into your `src/parts/`, so you can edit it (the shadcn philosophy -
you depend on the source, not a black box):

```sh
muten add card badge dialog
```

It pulls each component's dependencies too. Importing and ejecting mix freely: import the ones you use as-is,
eject the few you want to customize.

## How it works (the registry seam)

The core defines the seam; the plugin provides the data. A plugin package has a **`registry.json`** indexing its
components, each pointing at a `.muten` part file:

```json
{
  "name": "my-ui",
  "components": [
    { "name": "card", "part": "Card", "file": "registry/card.muten" }
  ]
}
```

- **`muten add <name>`** discovers every installed dependency that has a `registry.json`, finds the component, and
  copies its `file` into `src/parts/`.
- **`plugins { my-ui {} }`** loads those same parts straight from `node_modules` at build time (no copy). The
  oracle (`muten check`) sees imported parts just like local ones, so lint stays honest.

## Custom-backed components are eject-only

A component whose registry entry has a `component` field is backed by a vanilla-JS host (a `Custom` - see
[Escapes](escapes.md)). Its `.js` must live in **your** `src/components/`, where the `Custom` primitive loads it,
so it cannot be imported - **only `muten add`** (which copies both the `.muten` part and the host `.js`):

```sh
muten add slider calendar chart      # copies the part + src/components/Slider.js, Calendar.js, Chart.js
```

These are the genuinely interactive widgets (sliders, calendars, charts, carousels): the deliberate 20% that
needs real JS. You own the host file and can edit it.

## The container / presentational pattern

Plugin components do not hold their own state - **the page owns it** (so the oracle can check it). Interactive
parts take a value + an action callback:

```
state { dark = false : bool }
action toggle mutates dark { dark.toggle() }
Switch(on: dark, onToggle: toggle)
```

Overlays own an `open` bool (`Dialog(open: open, onClose: close)`); single-select groups pass the current value
plus each item's value. Each component's `.muten` file documents its usage in a header comment.

## @muten/shadcn

The flagship plugin: the full [shadcn/ui](https://ui.shadcn.com) set, ported to muten as semantic classes
(`.card`, `.btn`, ...) + parts + a handful of Custom widgets (Slider, Calendar with all its variants, Chart, ...).
Authentic shadcn styling, your `.muten` stays readable. See its README for the component list.

## Building your own plugin

Publish an npm package with a `registry.json` + the part `.muten` files (+ optional `globals.css` and host `.js`
for Custom components). Any installed package with a `registry.json` is a registry `muten add` can read - and any
package listed in `plugins {}` is importable. Mark a scoped package public with
`"publishConfig": { "access": "public" }`.
