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

## Built-in functions

A fixed set of formatting functions is **always available** — no `use`, no import. They cover the universal
needs (dates, initials, currency, case) so you never hand-roll `Date`/string logic in a `use`:

| Function | Result |
|---|---|
| `upper(text)` / `lower(text)` | case |
| `initial(name)` | first letter, uppercased — avatar initials |
| `truncate(text, n)` | first `n` chars, + `…` if longer |
| `money(number[, "USD"])` | localized currency (`$1,234.56`) |
| `ago(isoText)` | relative time — `just now` / `5m ago` / `3h ago` / `2d ago` |
| `date(isoText)` / `time(isoText)` | short date (`Jan 5`) / short time (`3:42 PM`) |

```muten
Text "{initial(user.name)}"                       # avatar bubble
Text "{ago(msg.time)}"                             # "5m ago"
Text "{date(msg.time)} at {time(msg.time)}"        # "Jan 5 at 3:42 PM"
Text "{money(order.total)}"                        # "$48.20"
```

A timestamp is a `text` field holding an ISO string (e.g. `created text`); `ago`/`date`/`time` parse it.
Compose freely (`upper(truncate(name, 12))`). For anything NOT in this set (grouping, joins, custom parsing),
`use` a function — but never reimplement these.

## Literals

Strings `"…"` (quote text and enum values everywhere), numbers `42` / `0.21`, booleans `true` / `false`.

## See also
- [Lists](../lists.md) · [State](../state.md) · [Keywords](keywords.md)
