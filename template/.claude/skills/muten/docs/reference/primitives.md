# Reference — Primitives

Every primitive, its output element, and how it's used. Primitives are **PascalCase**. A bare string is the
node's main prop; `{ … }` is its children. Style any primitive with [`class()`](modifiers.md); add
accessibility with [`aria()`](modifiers.md).

## Layout & landmarks

| Primitive | Element | Notes |
|---|---|---|
| `Stack` | `<div>` | a **flex column** by default; a row is `class("flex flex-row")` |
| `Page` | `<main>` | the page root — **one per route**; the focus target on navigation |
| `Header` | `<header>` | landmark |
| `Nav` | `<nav>` | landmark; `Nav "Main" …` sets its `aria-label` |
| `Sidebar` | `<aside>` | complementary landmark |
| `Footer` | `<footer>` | landmark |

```muten
Page class("flex flex-col gap-6") {
  Header class("flex flex-row justify-between") { … }
  Stack class("grid grid-cols-3 gap-4") { … }
  Footer { … }
}
```

## Text

| Primitive | Element | Notes |
|---|---|---|
| `Text` | `<p>` | interpolates state: `Text "Hi, {user.name}"` |
| `Title` | `<h1>`…`<h6>` | level keyword: `Title "Dashboard" h2` (default `h1`) |
| `Span` | `<span>` | inline text |

## Media

| Primitive | Element | Notes |
|---|---|---|
| `Image` | `<img>` | **`alt` required**: `Image "{p.image}" alt("{p.title}")` — `alt("")` for decorative |
| `Icon` | inline `<svg>` | Iconify `set:name`, resolved at build (tree-shaken), `aria-hidden`: `Icon "lucide:settings"` |
| `Video` | `<video>` | bare-keyword flags: `Video "clip.mp4" controls autoplay loop muted playsinline` |

> **Data-driven icon?** The `Icon` name is a static literal (it inlines the SVG at build, so it can't read
> data). Two paths: a **per-value** icon (status / type / category) is a `match` over static Icons —
> `match item.status { active -> Icon "lucide:check"  paused -> Icon "lucide:pause" }` (each arm still
> tree-shakes); an icon whose **URL lives in your data** is an `Image` — `Image "{item.iconUrl}" alt("")`.

## Interactive

| Primitive | Element | Notes |
|---|---|---|
| `Link` | `<a href>` | client-side nav: `Link "Catalog" -> "/catalog"`; children → a clickable card |
| `Button` | `<button>` | runs an action: `Button "Save" -> save(draft)`; children allowed |
| `SearchField` | `<input type=search>` | bound text input: `SearchField bind(q) "Search…"`; has an accessible name |

```muten
Link "Product" -> "/product/{p.id}" { Stack class("card") { Title "{p.name}" h3 } }   # clickable card
Button "Delete" -> remove(item.id)
SearchField bind(q) on(enter: search) "Search products"
```

## Data-driven

| Primitive | Element | Notes |
|---|---|---|
| `Form` | `<form>` | auto-built from an entity draft: `Form bind(draft) submit(create) "Save"` — see [Forms](../forms.md) |
| `DataTable` | `<table>` | a reactive table over a list/query (`@` sigil): `DataTable @users columns(name, email)`; headers are `<th scope>` |
| `RowAction` | `<button>` (per row) | a button inside each `DataTable` row: `RowAction "Delete" -> remove(row.id)` |

```muten
DataTable @users columns(name, email, role) {
  RowAction "Edit"   -> edit(row)
  RowAction "Delete" -> remove(row.id)
}
```

`DataTable` shows **raw** cell values (no per-column formatting); for formatted/badge cells, use `each` + a
[part](../parts.md).

## Structural & escape

| Primitive | Element | Notes |
|---|---|---|
| `slot` | — | the outlet for caller content: the active page inside a `shell`, or the caller's children inside a `part` |
| `Custom` | host `<div>` | mount a vanilla-JS widget: `Custom Chart inputs(data: @sales) on(pick: select)` — see [Escapes](../escapes.md) |

## Control flow (lowercase keywords, not primitives)

| Form | Meaning |
|---|---|
| `when <expr> { … }` | mount/unmount reactively |
| `each <list> as item { … }` | render per item; `item` is a scope var (`where` to filter) |
| `match <enum> { value -> node … }` | render the arm matching the enum value (sugar over N `when`) |

```muten
when cart.count > 0 { Span "🛒 {cart.count}" }
each products as p where p.inStock { Text "{p.name}" }
match deal.stage { new -> Text "New"  won -> Icon "lucide:check" }
```

## See also
- [Modifiers](modifiers.md) · [Keywords](keywords.md) · [Expressions](expressions.md)
- [Forms](../forms.md) · [Lists](../lists.md) · [Accessibility](../accessibility.md)
