# Designing muten pages — make it look great

Muten ships **no skin** — `style()` builds STRUCTURE (layout/typography tokens), `class()` carries the LOOK.
This doc is the craft: how to get a polished, modern result. Pair it with `SKILL.md` (the language) and
`patterns.md` (full app recipes).

## 1. Pick ONE styling route per app
| Route | Layout | Look | When |
|---|---|---|---|
| **Pure muten** (theme-driven) | `style(...)` tokens | a few semantic classes in `styles.css` that read `theme.muten` vars | no framework; full control; smallest output |
| **Tailwind** | `class("flex gap-4")` | Tailwind utilities | utility-first; fast |
| **DaisyUI** | `class(...)` | daisy components (`btn`, `card`) on Tailwind | pre-styled components |

Don't mix layout routes (don't use `style(row)` AND `class("flex-row")` on the same tree) — pick one and be consistent.

## 2. Pure-muten design system (the muten-native way)
Put EVERY value in `theme.muten`; muten emits it as `:root` CSS vars. `style()` reads the scale; `styles.css`
maps the color/radius vars onto a handful of semantic classes. Edit `theme.muten` → the whole app re-skins.

```
# theme.muten — a clean dark starter
theme {
  space   { xs "4px"  sm "8px"  md "16px"  lg "24px"  xl "40px" }
  font    { sm "13px"  md "15px"  lg "20px"  xl "30px" }
  weight  { medium "500"  semibold "600"  bold "700" }
  radius  { sm "8px"  md "12px"  lg "18px"  pill "999px" }
  breakpoints { sm "640px"  md "768px"  lg "1024px" }
  colors {
    bg "#0b0f17"  surface "#141b27"  panel "#1c2533"  border "#263244"
    text "#e8edf5"  muted "#8a97ab"  primary "#6366f1"  onprimary "#ffffff"
    success "#34d399"  warning "#fbbf24"  danger "#f87171"
  }
}
```
```css
/* src/styles.css — every value is a theme var; nothing hardcoded */
* { box-sizing: border-box; }
body { margin: 0; background: var(--color-bg); color: var(--color-text); font: 15px/1.55 system-ui, sans-serif; }
.mu-stack { display: flex; flex-direction: column; }
.card    { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); }
.muted   { color: var(--color-muted); }
.accent  { color: var(--color-primary); }
.divider { border-bottom: 1px solid var(--color-border); }
.btn     { background: var(--color-primary); color: var(--color-onprimary); border: none; border-radius: var(--radius-sm); padding: 8px 14px; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn:hover { filter: brightness(1.08); }
.btn-ghost { background: transparent; color: var(--color-text); border: 1px solid var(--color-border); }
.badge   { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: var(--radius-pill); display: inline-block; }
```
Then write pages with `style()` for layout + these classes for look:
```
Stack style(padding.lg gap.md) class("card") {
  Text "Revenue" class("muted") style(text.sm weight.semibold)
  Text "{money(total)}" style(text.xl weight.bold)
}
```

## 3. Style the auto-Form (every route needs this — don't skip it)
`Form` auto-renders inputs with muten's OWN classes — `class()` on the `<Form>` styles the form CONTAINER,
NOT the inputs. So skin these once in `styles.css` (or your forms look unstyled):
```css
.mu-form        { display: flex; flex-direction: column; gap: 12px; }
.mu-form-title  { display: none; }                 /* hides the auto "New <Entity>" heading */
.mu-field       { width: 100%; padding: 9px 12px; font-size: 14px; border-radius: 8px;
                  border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text); }
.mu-field:focus { outline: 2px solid var(--color-primary); outline-offset: -1px; }
.mu-field-check { width: 16px; height: 16px; accent-color: var(--color-primary); }
.mu-field-error { color: var(--color-danger); font-size: 12px; }
.mu-submit      { grid-column: 1 / -1; padding: 9px 14px; border: none; border-radius: 8px;
                  background: var(--color-primary); color: var(--color-onprimary); font-weight: 600; cursor: pointer; }
```
(Tailwind/Daisy: same idea, use the framework's vars/utilities in these rules.) `SearchField` DOES take `class()`
directly — only the auto-`Form` needs this.

## 4. The craft — what makes it look "designed"
- **One accent, restrained palette.** A neutral surface scale + ONE accent color. Resist rainbow.
- **Contrast discipline.** Never light text on a light surface. On dark themes use a `muted` (~60% lum) for secondary text, full `text` for primary.
- **Type hierarchy = size + weight, not color.** Title `text.xl weight.bold`, label `text.sm weight.semibold muted`, body default.
- **Spacing rhythm.** Reuse the scale (`gap.md` between rows, `gap.lg` between sections, `padding.lg` in cards). Consistency reads as polish.
- **Cards.** `border` (1px, subtle) + `radius.md` + a soft shadow. On light themes add `shadow-sm`; on dark, the border alone is enough.
- **Numbers** get formatted via `use` (`use money from "./lib/money.ts"`) — raw `48000` looks unfinished; `$48,000` looks shipped.
- **Empty states & loading.** `when list.length == 0 { … }` and `when q.loading { … }` — never a blank panel.

## 5. Modern building blocks (copy-paste)

### Glass pill navbar (current trend — floating, translucent, blurred)
**Pure muten** — add to `styles.css`:
```css
.nav-pill { position: fixed; top: 16px; left: 50%; transform: translateX(-50%); z-index: 50;
  display: flex; align-items: center; gap: 4px; padding: 6px; border-radius: 999px;
  background: color-mix(in srgb, var(--color-surface) 65%, transparent);
  backdrop-filter: blur(12px) saturate(1.4); -webkit-backdrop-filter: blur(12px) saturate(1.4);
  border: 1px solid color-mix(in srgb, var(--color-text) 12%, transparent);
  box-shadow: 0 10px 30px rgba(0,0,0,.18); }
.nav-pill-link { padding: 7px 16px; border-radius: 999px; font-size: 14px; font-weight: 500; color: var(--color-muted); }
.nav-pill-link:hover { background: color-mix(in srgb, var(--color-text) 8%, transparent); color: var(--color-text); }
.nav-pill-link.is-active { background: var(--color-primary); color: var(--color-onprimary); }
```
```
# in shell { } — floats over the page; pad the content so it clears
Nav class("nav-pill") {
  Link "Home"     -> "/"        class("nav-pill-link")
  Link "Features" -> "/features" class("nav-pill-link")
  Link "Pricing"  -> "/pricing"  class("nav-pill-link")
}
Stack style(padding.xl) { slot }
```
**Tailwind** equivalent:
```
Nav class("fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 p-1.5 rounded-full bg-white/70 backdrop-blur-md border border-white/50 shadow-lg shadow-black/5") {
  Link "Home" -> "/" class("px-4 py-1.5 rounded-full text-sm font-medium text-zinc-700 hover:bg-black/5")
}
```

### Hero (centered, gradient accent)
```
Stack style(padding.xl gap.md align.center) {
  Title "Build faster" h1 style(text.xl weight.bold align.center)
  Text "One clear sentence about the product." class("muted") style(text.lg align.center)
  Stack style(row gap.sm) { Button "Start" class("btn")  Button "Docs" class("btn-ghost") }
}
```

### KPI stat card
```
Stack style(padding.lg gap.xs) class("card") {
  Text "Customers" class("muted") style(text.sm weight.semibold)
  Text "{count}" style(text.xl weight.bold)
}
```

### Reactive multi-class (now supported)
A reactive toggle string may hold MULTIPLE classes — just quote it; each token toggles:
`class("ring-2 ring-primary" when c.active)`. Hyphenated names also need the quotes.

## 6. Reference-driven design (clone a look)
To match a reference (screenshot/URL), work the loop:
1. Look at the reference; name the **layout** (vertical stacks? a grid? a sidebar? a floating navbar?).
2. Map **layout → `Stack`/`style(grid cols.N)`**, **components → primitives + your styling route**.
3. Write the page, then **build + screenshot your result** and compare side by side.
4. Fix the deltas (spacing, color, radius, weight) and repeat. Two or three passes gets you close.
Keep the palette + radius + spacing in `theme.muten` so a tweak there moves the whole page toward the target.

## 7. Responsive
Prefix any `style()` token with a breakpoint: `style(grid cols.1 md:cols.2 lg:cols.4)`, `style(column md:row)`.
Breakpoint pixels live in `theme.muten`'s `breakpoints`. Mobile-first: the bare token is the small-screen
default, the `md:`/`lg:` variant overrides up. Test at a narrow width — keep big numbers from overflowing 2-col grids.
