# Reference — Expressions

The expression grammar is shared by interpolation (`{…}`), `when` conditions, `class(… when cond)`, action
arguments, `get` values, and source/aggregate bodies.

## References

A bare name, dotted for members: `count`, `user.name`, `cart.total`, `$item.field` (in a [part](../parts.md)),
`item.field` (the scope var inside `each`). The oracle resolves every reference — an unknown or renamed one is
an `unknown-ref` error with the exact location.

## Operators

| Category | Operators |
|---|---|
| comparison | `==` `!=` `<` `>` `<=` `>=` |
| boolean | `and` `or` `not` |
| arithmetic | `+` `-` `*` `/` |
| membership / substring | `contains` |
| ternary | `cond ? a : b` |
| grouping | `( … )` |

```muten
when count > 0 and not done { … }
Text "{price * qty}"
Text "{count > 0 ? "in stock" : "sold out"}"
class("vip" when user.role == "admin")
when tags contains "sale" { Badge "Sale" }
```

`contains` is **list membership** for scalar lists (`favs contains id`) and **case-insensitive substring** for
text (`name contains q`). See [Lists § membership](../lists.md#membership--is-it-in-the-list).

## Interpolation

`{expr}` embeds an expression inside a string prop — a label, a path, an alt:

```muten
Text "Hi, {user.name} — {cart.count} items"
Link "Open" -> "/product/{p.id}"
Image "{p.image}" alt("Photo of {p.name}")
```

## Aggregates

`by` projects a value per item; `where` is a predicate. Item fields are bare (item-implicit):

| Form | Result |
|---|---|
| `list.length` | count of all items |
| `list.count where <cond>` | filtered count |
| `list.sum by <expr>` | sum of a projection |
| `list.avg by <expr>` | average |
| `list.min by <expr>` / `.max by <expr>` | extremes |

```muten
Text "Total: {lines.sum by price * qty}"
Text "Open: {todos.count where not done}"
```

**Embedding an aggregate in a bigger expression needs grouping `()`** (the `by`/`where` body runs to the end):
`when (todos.count where not done) > 0 { … }`. Standalone in a `get` needs none:
`get openCount = todos.count where not done`. See [Lists § aggregates](../lists.md#aggregates).

## Literals

Strings `"…"` (quote text and enum values everywhere), numbers `42` / `0.21`, booleans `true` / `false`.

## See also
- [Lists](../lists.md) · [State](../state.md) · [Keywords](keywords.md)
