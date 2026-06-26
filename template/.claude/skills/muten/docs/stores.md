# Stores — app-global state

A `.store` file holds state shared across pages, with **no prop drilling**. The file name is the domain, and
every member is referenced as `domain.member` from any page or shell. The Vite plugin auto-detects every
`.store` file — you don't register them.

## A store

```muten
# src/ui.store   → referenced everywhere as ui.<member>
state  { menuOpen = false : bool }
get    isOpen = menuOpen                          # derived / memoized value (read as ui.isOpen)
action toggleMenu mutates menuOpen { menuOpen.toggle() }
effect { /* runs whenever the store state it reads changes */ }
```

Use it anywhere by name:

```muten
when ui.menuOpen { Stack class("menu") { … } }
Button "☰" -> ui.toggleMenu
```

## Members

| Member | Meaning |
|---|---|
| `state { … }` | the app-global reactive cells (same types + `persist` as page state) |
| `get name = <expr>` | a **memoized** derived value (recomputes when its inputs change) |
| `action … mutates …` | a global mutation (same op set as a page action) |
| `effect { … }` | a reactive side-effect — re-runs when the store state it reads changes (Angular-style) |

## App-global persistence

`persist` works in a store, which is the right home for state that must **survive reload and be shared** —
favorites, a cart, settings, theme:

```muten
# src/cart.store
store  { items = [] : list<number> persist }       # the ids; persisted to localStorage
get    count = items.length
action add(id: number)    mutates items { items.push(id) }
action remove(id: number) mutates items { items.remove where id == id }
```

```muten
# any page:
Span "🛒 {cart.count}"
Button "Add" -> cart.add(product.id)
class("in-cart" when cart.items contains product.id)
```

See [State § persist](state.md#persist--localstorage-declaratively) and [Lists § membership](lists.md#membership--is-it-in-the-list).

## Page → store composition

A **page** action can call a **store** action, doing global and local work in one handler:

```muten
# on a page
action checkout(d: Item) mutates draft {
  cart.add(d.id)     # store action
  draft.reset()      # local
}
```

Wire it with `Form submit(checkout)` or `Button -> checkout(x)`.

## Guards read store booleans

Route guards in `app.muten` read a store boolean; when it flips, the active route re-renders:

```muten
# src/auth.store
store  { loggedIn = false : bool persist }
action login  mutates loggedIn { loggedIn.set(true) }
action logout mutates loggedIn { loggedIn.set(false) }
```
```muten
routes { "/cart" -> cart guard auth.loggedIn else "/login" }
```

See [Routing § Guards](routing.md#guards).

## See also
- [State & reactivity](state.md) — types, signals, `persist`.
- [Actions](actions.md) — the mutation op set (shared with stores).
- [Routing](routing.md) — guards.
