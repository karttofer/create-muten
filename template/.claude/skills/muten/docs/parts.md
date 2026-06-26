# Parts — reusable composition

A `part` is a reusable fragment of UI. It is **inlined at build time**, not a runtime component — there is no
component instance, no extra runtime, no prop-diffing. Think of it as a typed macro: the part disappears and
its tree is substituted in place, with the call's arguments filled in.

## Defining a part

Parts live in `src/parts/<name>.muten` and have a **single root**. Params are typed; you pass **objects**
(`$x.field`) and **action callbacks** (`-> $onPick(...)`):

```muten
# src/parts/feature.muten
part Feature(item: Feature, onPick: action) {
  Stack class("card flex flex-col gap-2") {
    Title "{$item.title}" h3
    Text  "{$item.body}"
    Button "Choose" -> $onPick($item.id)
  }
}
```

- Object params are read as `$item.field` inside the part.
- Action params are called as `-> $onPick(arg)`.
- A scalar param (`text`/`number`) also takes a **literal or a ref**: `Stat(label: "Users", value: userCount)`
  — a quoted literal stays literal, a bare name is a ref.

## Using a part

Call it like a primitive, passing the args by name:

```muten
each features as f {
  Feature(item: f, onPick: select)
}
```

```muten
part Stat(label: text, value: number) {
  Stack class("stat") { Span "{$value}" class("stat-n")  Span "{$label}" class("stat-l") }
}
# use it:
Stat(label: "Active users", value: activeCount)
```

## When to use a part vs a `Custom`

| Need | Reach for |
|---|---|
| Repeat a chunk of **Muten** UI (a card, a stat, a nav item) | a **`part`** |
| A widget Muten can't express (a chart, a map) | a [`Custom`](escapes.md) |

A part is pure Muten — it stays inside the language and the oracle. Use it to DRY a repeated row (one template,
N calls) instead of copy-pasting; it's fewer tokens for the same bundle (the part inlines, so the output is
identical to writing it out).

## See also
- [Escapes](escapes.md) — `Custom` for non-Muten widgets, `use` for logic.
- [Lists](lists.md) — `each` + a part is the idiom for a styled, repeated list.
