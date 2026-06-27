# Muten recipes — proven app structures

Copy-paste skeletons that lint + run. Pair with `SKILL.md` (language) and `design.md` (look). These are the
shapes that work; adapt the names. All verified by building real apps.

## App skeleton (routes + shell)
```
# src/app.muten
routes {
  "/"          -> dashboard
  "/customers" -> customers
}
shell {
  Stack {
    Nav class("row gap-md pad-md divider") {
      Link "Dashboard" -> "/"          class("nav-link")
      Link "Customers" -> "/customers" class("nav-link")
    }
    Stack { slot }
  }
}
```
The folder under `src/pages/<name>/<name>.muten` must match the route's page name. First route = default.

## Store-centric data (the recommended architecture)
App-global data lives in a `.store`; pages read it by domain name. **Derive everything in the store as `get`s**
(filters, sums, counts) — pages just iterate `domain.<get>`. This is cleaner AND sidesteps cross-page type friction.
```
# src/customers.store   → referenced everywhere as customers.<member>
entity Customer { name text required  company text  email email required  status lead | active | churned }

state { items = [
  { name: "Sarah Chen", company: "Northwind", email: "sarah@nw.io", status: "active" }
] : list<Customer> }

get count  = items.length
get active = items.count where status == "active"
get leads  = items.count where status == "lead"

action add(c: Customer)              mutates items { items.push(c) }
action remove(cid: text)             mutates items { items.remove where id == cid }
action setStatus(cid: text, s: text) mutates items { items.patch where id == cid with { status: s } }
```
- Iterating a store list in a page works: `each customers.items as c { Text "{c.name}" }`.
- A page redefines the `entity` for its own `Form` draft (entities don't cross the store border — small, expected dup).
- `remove`/`patch where id == cid`: name the param DIFFERENTLY from the field (`cid`, not `id`).

## Dashboard with KPIs (aggregates — no JS)
```
screen dashboard
use money from "~/lib/money.ts"
Page class("pad-lg gap-lg") {
  Stack class("grid grid-cols-2 lg:grid-cols-4 gap-md") {
    Stack class("pad-lg gap-xs card") {
      Text "Customers" class("muted t-sm semibold")
      Text "{customers.count}" class("t-xl bold")
    }
    Stack class("pad-lg gap-xs card") {
      Text "Pipeline" class("muted t-sm semibold")
      Text "{money(deals.pipeline)}" class("t-xl bold")
    }
  }
}
```
Aggregates: `list.count where cond` · `list.sum by field` · `list.avg by field` · `list.max by field` · `list.length`.
They work over state, a query, OR a `get` (e.g. `get won = items where stage == "won"` then `get wonValue = won.sum by amount`).

## List + search + add + delete (CRUD)
```
screen customers
entity Customer { name text required  company text  email email required  status lead | active | churned }
state { draft = {} : Customer  q = "" : text }
action create(c: Customer) mutates draft { customers.add(c)  draft.reset() }   # page action CALLS the store action

Page class("pad-lg gap-lg") {
  SearchField bind(q) "Search…" class("mu-field")
  Form bind(draft) submit(create) "Add customer"          # auto-renders one input per field; skin .mu-field (see design.md)

  each customers.items as c where c.name contains q or c.company contains q {
    Stack class("row between center pad-lg card") {
      Stack class("gap-xs") { Text "{c.name}" class("semibold")  Text "{c.company}" class("muted t-sm") }
      Stack class("row center gap-sm") {
        when c.status == "active" { Text "active" class("badge badge-active") }
        when c.status == "lead"   { Text "lead"   class("badge badge-lead") }
        when c.status == "lead"   { Button "Activate" -> customers.setStatus(c.id, "active") class("btn") }
        Button "Delete" -> customers.remove(c.id) class("btn-danger")
      }
    }
  }
}
```

## Kanban / pipeline (one column per enum value)
One `each … where` per stage (each column filters by its stage value). Advance a card with `patch where … with`
(position-preserving). For a per-card badge that varies by stage, use `match card.stage { … }` inside the column.
```
state { draft = {} : Deal }
action create(d: Deal) mutates draft { deals.add(d)  draft.reset() }

Stack class("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md") {
  Stack class("pad-md gap-sm panel") {
    Text "New" class("muted t-sm bold")
    each deals.items as d where d.stage == "new" { DealCard(item: d) }
  }
  Stack class("pad-md gap-sm panel") {
    Text "Qualified" class("accent t-sm bold")
    each deals.items as d where d.stage == "qualified" { DealCard(item: d) }
  }
}
# src/parts/dealcard.muten — a part can reference stores + use + when inside
# use money from "~/lib/money.ts"
# part DealCard(item: Deal) {
#   Stack class("pad-md gap-xs panel") {
#     Text "{$item.title}" class("semibold")
#     Text "{money($item.amount)}" class("bold")
#     when $item.stage == "new"       { Button "Qualify" -> deals.advance($item.id, "qualified") class("btn") }
#     when $item.stage == "qualified" { Button "Win"     -> deals.advance($item.id, "won") class("btn") }
#   }
# }
```

## Dates / calendar (muten has NO date type — use a JS facade)
Date math lives in a `use` function. Anchor state in an ISO string; derive the grid. A `use` fn CAN return a list
that `each` iterates, with field access on the items.
```
# src/lib/cal.ts (named exports)
#   export function addMonths(anchor, n) {...}
#   export function monthLabel(anchor) {...}           // "June 2026"
#   export function monthCells(anchor) {...}           // [{ day, iso, inMonth, today }, ...] (42 cells)
screen calendar
use addMonths, monthLabel, monthCells from "~/lib/cal.ts"
state { anchor = "2026-06-01" : text }
get cells = monthCells(anchor)
action prev mutates anchor { anchor.set(addMonths(anchor, -1)) }
action next mutates anchor { anchor.set(addMonths(anchor, 1)) }

Page {
  Stack class("row center gap-md") {
    Button "‹" -> prev   Text "{monthLabel(anchor)}"   Button "›" -> next
  }
  Stack class("grid grid-cols-7 gap-xs") {
    each cells as c {
      Stack class("pad-sm gap-xs card") class("is-dim" when not c.inMonth) class("is-today" when c.today) {
        Text "{c.day}" class("t-sm")
        each events.items as e where e.date == c.iso { Text "{e.title}" class("badge") }
      }
    }
  }
}
```
Note: nested `each` works; a reactive class can be multi-token (`class("ring-2 ring-primary" when c.today)`).

## `use` — JS logic facade (formatting, dates, anything synchronous)
```
# src/lib/money.ts
export function money(n: number): string { return "$" + (n || 0).toLocaleString("en-US"); }
```
```
use money from "~/lib/money.ts"
Text "{money(deal.amount)}"          # → $48,000
```
Keep `use` SYNCHRONOUS. For async I/O use a `query` / `create` / `update` / `delete` (those expose `.pending`/`.error`).

## Async data (query) + writes
```
state   { products = query products : list<Product> }
sources { products: { url: "/products", at: "data" } }   # api { base } in app.muten sets the host once
when products.loading { Text "Loading…" }
each products.data as p { Text "{p.title}" }

action buy(p: Product)  mutates products { products.create(p) }   # POST,   optimistic
action drop(p: Product) mutates products { products.delete(p) }   # DELETE /{id}
```
