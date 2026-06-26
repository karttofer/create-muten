# Forms & validation

In Muten a form is **derived from an entity**, not hand-wired field by field. You declare the data shape
(`entity`), hold a draft of it in `state`, and `Form` renders one input per field, validates on submit, and
calls your action with the completed record. Accessibility is built in — you write none of it (see
[§ Accessibility](#accessibility), and the cross-cutting [accessibility guide](accessibility.md)).

## The shortest complete form

```muten
screen contact

entity Message {
  name    text  required
  email   email required
  body    text  required min:10
}

state  { draft = {} : Message  sent = [] : list<Message> }
action send(m: Message) mutates sent, draft { sent.push(m)  draft.reset() }

Page class("flex flex-col gap-4 p-6") {
  Form bind(draft) submit(send) "Send message"
}
```

- **`bind(draft)`** — the form reads and writes a single page-local `state` cell whose type is an entity.
- **`submit(send)`** — on a valid submit, the action runs with the draft as its argument (a `<- item` /
  typed-param action receives it). `draft.reset()` clears the form for free, because the bind is two-way.
- The bare string (`"Send message"`) is the submit button's label.

## Field types

`Form` maps each entity field to an input by its type:

| Entity field type | Renders | Notes |
|---|---|---|
| `text` | `<input type="text">` | the default |
| `email` | `<input type="email">` | **format-validated on submit** (see below) |
| `number` | `<input type="number">` | value is coerced with `Number()` |
| `bool` | `<input type="checkbox">` | stores a boolean |
| `enum` (`role admin \| member`) | `<select>` | one `<option>` per enum value |

> **Not supported as a field type:** `password`, `date`, `textarea`, file uploads. For those, drop to a
> [`Custom`](escapes.md) component (the form is still yours; only that one input is host-JS).

## Validation — constraints on the entity field

Constraints live on the **entity** declaration, so they travel with the data shape and are enforced wherever
the entity is used. They are checked **on submit**; a failure shows a per-field message and **blocks the
action** (it never runs with invalid data).

```muten
entity Account {
  name     text  required min:2 max:40
  email    email required
  zip      text  pattern:"^\d{5}$"      # US ZIP — any regex
  age      number min:18
}
```

| Constraint | Meaning | Failure message |
|---|---|---|
| `required` | non-empty (trimmed) | `Required` |
| `min:N` / `max:N` | **number** → value bound · **text** → length bound | `Min N` / `Min N characters` (and Max) |
| `pattern:"<regex>"` | a non-empty value must match the JS regular expression | `Invalid format` |
| *(automatic)* on `email` fields | a non-empty value must look like an email | `Enter a valid email` |

`pattern` takes a normal JavaScript regex **as a string** — `pattern:"^\d{5}$"`, `pattern:"^[A-Z]{2,}$"`.
The `email` check is automatic: declaring a field `email` now validates its format (it used to only set the
input type). For a rule that spans **two** fields (`end > start`) or needs async I/O (uniqueness against the
server), do it inside the submit `action` with an `if` — and a [`use`](escapes.md) function for the async part.

### Async submit state

When the submit action does a server write (`create`/`update`/`delete`), it is async and exposes reactive
`.pending` / `.error` you can render around the form:

```muten
when send.pending { Text "Sending…" }
when send.error   { Text "Could not send: {send.error}" class("text-red-600") }
```

## Accessibility

**The compiler emits an accessible form — you write nothing for this.** Every field becomes a group:

```html
<div class="mu-field-group">
  <label class="mu-label" for="f_n7_email">Email</label>
  <input id="f_n7_email" class="mu-field" type="email"
         aria-required="true" aria-describedby="err_f_n7_email">
  <small id="err_f_n7_email" class="mu-field-error" aria-live="polite"></small>
</div>
```

What you get for free:

- A real **`<label for>`** tied to the input's `id` (never a placeholder standing in for a label).
- **`aria-required="true"`** on `required` fields, so screen readers announce them.
- The error `<small>` is linked to its input via **`aria-describedby`** and is an **`aria-live="polite"`**
  region, so a validation message is announced the moment it appears.
- Native elements (`<button type=submit>`, `<input>`, `<select>`) → keyboard and focus work with zero effort.

For an accessible widget that **isn't** an entity form (a custom dropdown, a dialog, tabs), use the
[`aria(...)`](accessibility.md#the-aria-modifier) modifier to write `aria-*`/`role` directly.

## Styling

`Form` ships **structure**, not a skin. Style it with your CSS against these classes (a baseline is scaffolded
into `src/styles.css`, override freely):

| Class | Element |
|---|---|
| `mu-form` | the `<form>` |
| `mu-field-group` | one label + control + error |
| `mu-label` | the field label |
| `mu-field` | text/email/number/select inputs |
| `mu-field-check` | a checkbox |
| `mu-field-error` | the per-field error text |
| `mu-submit` | the submit button |

`class()` on a `Form` styles the `<form>` element itself.

## Limits & escape valves

- `Form` renders **every** field, in declaration order, with **no conditional fields**. To branch, gate the
  whole `Form` with a `when`, or split the entity (e.g. a multi-step wizard = one entity per step).
- An **`enum` field cannot be `required`** (a select always has a value).
- No nested entities or field arrays inside one `Form`. For a fully bespoke form, don't use `Form` — build
  the inputs yourself with `SearchField bind(field)` + `aria(...)`, and validate in the action.

## See also
- [State & reactivity](state.md) — how the bound draft works.
- [Accessibility](accessibility.md) — the `aria(...)` modifier and the app-wide a11y the compiler emits.
- [Data](data.md) — `create`/`update`/`delete` for forms that write to a backend.
