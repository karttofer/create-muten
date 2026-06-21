# create-muten

Scaffold a new [Muten](https://github.com/karttofer/muten) app.

```sh
npm create muten@latest            # when published to npm
npx github:karttofer/create-muten  # from GitHub (not yet public)
```

It prompts for:

- **project name**
- **stylesheet** — CSS or SCSS
- **package manager** — npm / pnpm / yarn / bun (default = the one you invoked it with)

…then scaffolds the app and, if you accept, runs `<pm> install` + `<pm> run dev`.

The engine (`muten`) is a **separate** package the generated app installs as a dependency — the same
split as `create-vue` ↔ `vue`. It's a Node CLI (not a shell script), so the command works the same on
Windows and macOS.

> Not on npm yet: the template depends on `github:karttofer/muten`, so a scaffolded app's
> `<pm> install` pulls the engine straight from GitHub (its `prepare` step builds it).
