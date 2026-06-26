# Reference — Modifiers

Modifiers come **after** a primitive's positional args and attach a prop. They compose freely on one node.

| Modifier | Applies to | What it does |
|---|---|---|
| `class("…")` | any | styling — layout AND look (Tailwind utilities or your CSS). Reactive toggles too. |
| `bind(state)` | `SearchField`, `Form` | two-way bind to a state cell |
| `submit(action)` | `Form` | the action to run on a valid submit |
| `where(clauses)` | `DataTable` | filter clauses: `where(role == admin, name contains @q)` |
| `columns(a, b)` | `DataTable` | which fields to show: `columns(name, email)` |
| `alt("…")` | `Image` | **required** accessible/SEO alt text (`alt("")` for decorative) |
| `inputs(k: v)` | `Custom` | values passed to a host-JS widget (`@` to pass state) |
| `on(event: action)` | any | wire a DOM event to an action |
| `aria(k: expr)` | any | `aria-*` / `role` attributes — accessibility, reactive |

## `class(...)`

The single styling path. Static classes plus reactive toggles:

```muten
Stack class("flex flex-col gap-4")
Button class("btn" active when isOpen)                 # toggles `active`
Stack class("ring-2 ring-primary" when invalid)        # multi-class: quote it
```

A hyphenated or multi-class name in a reactive toggle **must be quoted** (`class("is-open" when x)`). See
[Styling](../styling.md).

## `on(...)`

Works on **any** element; the event name is any DOM event:

```muten
Stack on(mouseenter: preview)
SearchField bind(q) on(enter: search)        # `enter` is synthetic: fires only on the Enter key
Button "Save" -> save(draft)                  # `-> action(arg)` is the form for "click + an argument"
```

`-> action` / `-> action(arg)` is the click shorthand on `Button`/`Link`/`RowAction`; `on(...)` is for other
events or for `Custom` component events.

## `aria(...)`

Express accessibility on any node — each key → `aria-<key>`, `role` → `role`. A literal is static; a value that
reads state is reactive:

```muten
Button "✕" -> close aria(label: "Close")
Stack aria(role: "dialog", modal: true) { … }
Button "Menu" -> ui.toggle aria(expanded: ui.open, controls: "nav")
```

See [Accessibility](../accessibility.md).

## `inputs(...)` / `on(...)` on `Custom`

`Custom` takes `inputs` (values, `@` for state) and `on` (events → actions):

```muten
Custom Chart inputs(data: @sales) on(pointSelect: select)
```

See [Escapes](../escapes.md).

## See also
- [Primitives](primitives.md) · [Keywords](keywords.md) · [Constraints](constraints.md)
