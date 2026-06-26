# State & reactivity

State is the reactive data a page holds. You declare it in a `state {}` block; reading it anywhere in the tree
makes that spot update automatically when the value changes. There is **no `useState`, no setter wiring, no
dependency arrays** — reactivity is a property of the compiler, not something you manage.

## Declaring state

```muten
state {
  query    = ""                  : text
  count    = 0                    : number
  open     = false               : bool
  tags     = []                  : list<text>      # a list of plain strings
  todos    = []                  : list<Todo>      # a list of an entity
  users    = query listUsers     : list<User>      # async — backed by a source
}
```

Each cell is `name = <initial> : <type>`.

### Types

| Type | Examples |
|---|---|
| **scalar** | `text`, `number`, `bool`, `email`, `uuid` |
| **`list<scalar>`** | `list<text>`, `list<number>`, `list<uuid>` — a flat list of primitives |
| **`list<Entity>`** | `list<Todo>` — a list of records (an `entity` you declared) |

A `list` **must be initialized with `[]`** (an empty list) — never `{}` or a scalar. `todos = {} : list<Todo>`
is the classic slip (`{}` is the *draft* seed for an entity, not a list); the oracle rejects it. A non-list value
here would crash `each` at runtime with "not iterable".

An **enum** is not a state type — it lives as a field inside an `entity`; hold its current value as `text`.

A `get` (derived value) **cannot reference itself**, directly or through another `get` — a cycle compiles to a
"cannot access before initialization" crash, so the oracle rejects it (`get-cycle`).

## Reactivity — how it updates

- **Reads subscribe, writes notify.** Every place that reads a state — `{count}` interpolation, a `when`
  condition, an `each` list, a reactive `class(active when open)` — compiles to its own tiny effect that
  tracks exactly the signals it reads. When one changes, **only that spot** updates. There is no virtual DOM
  and no re-render of the tree.
- **Lists reconcile by `id`.** `each` / `DataTable` keep a per-row signal; on new data only the rows whose
  fields changed touch the DOM (focus, scroll, and input survive live updates).
- **Writes batch.** A burst of writes in one tick re-renders each spot **once** (a microtask), the way Solid
  does — so a real-time feed costs one render per frame, not one per message.

You don't opt into any of this; it's how reading a state behaves.

## Mutating state — only through actions

State is read freely, but **changed only inside an `action`**, and only the cells the action lists in
`mutates` (the compiler enforces it). See [Actions & mutations](actions.md).

```muten
action inc mutates count { count.set(count + 1) }
action addTag(t: text) mutates tags { tags.push(t) }
```

## `query` state (async)

A state initialised with `query <name>` is **asynchronous** — it fetches from a [`source`](data.md) and
exposes rich sub-fields instead of a plain value:

```muten
state   { users = query listUsers : list<User> }
sources { listUsers: "https://api.example.com/users" }

Page {
  when users.loading { Text "Loading…" }
  when users.error   { Text "Failed: {users.error}" }
  each users.data as u { Text "{u.name}" }
}
```

`.loading` (bool), `.error` (the error or null), and `.data` (the rows). See [Data](data.md) for `refetch`,
CRUD, and `query x live` (WebSocket).

## `persist` — localStorage, declaratively

Append **`persist`** to a state to back it with `localStorage`: it hydrates from storage on load (falling back
to the declared initial) and saves on every change, so it survives a reload. **This is the declarative
localStorage — never hand-roll `localStorage.getItem/setItem` in a [`use`](escapes.md) function.**

```muten
state { theme = "dark" : text persist }     # a setting that survives reload
```

`persist` works **page-local** *and* inside a [`.store`](stores.md) for **app-global** persisted state —
favorites, a cart, settings, the current theme:

```muten
# src/favorites.store  → referenced everywhere as favorites.ids
state  { ids = [] : list<number> persist }
action toggle(id: number) mutates ids { ids.push(id) }
```

```muten
# any page — "is this favorited?" is membership, not a JS escape:
class("on" when favorites.ids contains movie.id)
```

(That membership check is [`contains`](lists.md#membership); storing the **ids** as `list<number>` is what
makes both `contains` and `persist` work — see the [Lists](lists.md) guide.)

`persist` is **not** for `query`-backed state (the server is the source of truth there).

## Constants — `const`

For a value that never changes, use `const` (a compile-time scalar, inlined, never reactive):

```muten
const TAX = 0.21
Text "Total: {subtotal * (1 + TAX)}"
```

## See also
- [Actions & mutations](actions.md) — the only way to change state.
- [Stores](stores.md) — app-global state shared across pages.
- [Lists](lists.md) — `each`, aggregates, `sort`, membership.
- [Data](data.md) — `query`, `sources`, CRUD, real-time.
