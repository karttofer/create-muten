# Lists

Muten has a **bounded list toolkit**: rendering, filtering, aggregating, sorting, and membership — all
declarative, all checked by the oracle. There is intentionally **no raw `map`/`reduce`/`filter`** in the
language: the common list jobs have first-class forms, and anything past them is an explicit
[`use`](escapes.md) function. This keeps lists analyzable (and keeps an AI from re-deriving them by hand).

## Rendering — `each`

```muten
each todos as t {
  Text "{t.title}"
}
```

`each <list> as <item> { … }` renders the block once per item; `item` is a scope variable inside the block.
For a `query` state, iterate `.data`:

```muten
each users.data as u { Text "{u.name}" }
```

### Filtering — `where`

Render only the matching items (the item's fields are bare inside `where`):

```muten
each posts as p where p.published {
  Text "{p.title}"
}
```

## Aggregates

`by` projects a value per item; `where` is a predicate. Item fields are bare. No JS needed for a total, a
count, or an average:

```muten
Text "Total: {lines.sum by price * qty}"
Text "Open: {todos.count where not done}"
Text "Avg score: {reviews.avg by score}"
Text "Cheapest: {prices.min by amount}"
Text "Priciest: {prices.max by amount}"
```

- `.length` is the count of all items; `count where <cond>` is the filtered count.
- Works in interpolation, in a `when`, and in a `get`.
- **Embedding an aggregate in a bigger expression needs grouping `()`** (the `by`/`where` body runs to the
  end of the expression): `when (todos.count where not done) > 0 { … }`. Standalone (in a `get`) needs none:
  `get openCount = todos.count where not done`.

## Sorting — `sort` / `sortDesc`

Return a sorted **copy** (ascending with `sort by`, descending with `sortDesc by`):

```muten
each contacts.sort by name as c { Text "{c.name}" }
each scores.sortDesc by points as s { Text "{s.name}: {s.points}" }
```

The sort key is a **field name** — `sort by price`. To let the user **choose the column at runtime**, sort
by a `text` state holding the field name (a sortable table header):

```muten
state { sortCol = "price" : text }            # the chosen column
get sorted = rows.sortDesc by sortCol         # sorts by rows[sortCol]
# Button "Price" -> setSort("price")  Button "Name" -> setSort("name")
```

A **literal** field (`by price`) stays a static key; a ref to a `text` **state** (`by sortCol`) is the dynamic
column. (The oracle requires the dynamic key to be `text`.)

## Pagination / top-N — `take`

`list.take(n)` returns the first `n` items — a "load more" page or a leaderboard top-N. `n` is a literal or a
`number` state, so a button that raises a `limit` state grows the page reactively:

```muten
state { posts = query posts : list<Post>  limit = 10 : number }
get page = posts.take(limit)                  # reactive: bump `limit` -> more rows
# each page as p { … }   Button "Load more" -> more   # more: limit.set(limit + 10)
```

Combine freely: `posts.sortDesc by date` then `.take(limit)` for "latest N".

## Membership — "is it in the list?"

For a selection / favorites / "is X chosen" check, store the **ids as a scalar list** and use `contains`:

```muten
state { favs = [] : list<number> persist }     # the ids, not the objects (in a .store file)

# anywhere:
when favs contains movie.id { Icon "lucide:heart" }
class("on" when favs contains movie.id)
```

`contains` is **list membership** for scalars (and case-insensitive substring for text):
`tags contains "sale"`, `favs contains movie.id`.

To **add or remove** from such a set (favorite / un-favorite, subscribe / unsubscribe), use `toggle` in an
action — it adds the value if absent, removes it if present:

```muten
action fav(id: number) mutates favs { favs.toggle(id) }   # on a list<number>: in ⇄ out
```

(`favs.toggle(id)` is the scalar-list membership flip; `bool.toggle()` with no arg flips a boolean.)

> **Why store ids, not objects?** `list<Entity> contains <scalar>` is always false — it compares object
> identity, not a field. So a "favorites" set is a `list<number>` of ids. If you *do* have a list of objects
> and must test a field, use the count form: `(favs.count where id == movie.id) > 0`.
>
> **Never** write a `use` function doing `items.some(x => x.id === id)` — `contains` (or `count where`) *is*
> that, declaratively, and the oracle checks it. See [when NOT to escape](escapes.md#dont-escape-for-what-muten-already-does).

## Editing items in place — `patch`

To toggle or update an item **without reordering it**, use `patch` in an action (position-preserving; list
only the changed fields):

```muten
action toggle(id: uuid) mutates todos {
  todos.patch where id == id with { done: not done }
}
```

(`remove`/`push` reorder; `patch` keeps the item where it is.) See [Actions](actions.md) for the full op set.

## The bounded toolkit, at a glance

| Job | Form |
|---|---|
| render | `each list as item { … }` |
| filter render | `each list as item where cond { … }` |
| count / total / avg / min / max | `list.count where …`, `list.sum by …`, `.avg`, `.min`, `.max` |
| sort | `each list.sort by field as item`, `sortDesc by field` (field can be a `text` state = dynamic column) |
| paginate / top-N | `list.take(n)` (n = literal or `number` state) |
| membership | `list contains x` · `(list.count where field == x) > 0` |
| add ⇄ remove | `list.toggle(x)` (in an action) |
| edit in place | `list.patch where … with { … }` (in an action) |

Anything beyond these (an arbitrary transform) is a [`use`](escapes.md) function — a deliberate, checked
border, not a hole in the language.

## See also
- [State & reactivity](state.md) — list state types and keyed reconciliation.
- [Actions & mutations](actions.md) — `push`/`patch`/`remove` and the rest.
- [Escapes](escapes.md) — `use` for transforms the toolkit doesn't cover.
