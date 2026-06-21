# create-muten

Scaffold a new [Muten](https://www.npmjs.com/package/muten) app.

```sh
npm create muten@latest      # or: npx create-muten
```

It prompts for the **project name**, the **stylesheet** (CSS/SCSS) and the **package manager**
(default = the one you invoked it with), then scaffolds and — unless you decline — runs
`<pm> install` + `<pm> run dev`. CI flags: `--css|--scss`, `--pm <npm|pnpm|yarn|bun>`, `--no-install`.

The engine (`@muten/core`) is a separate package the app installs as a dependency — the same split as
`create-vue` ↔ `vue`. It's a Node CLI (not a shell script), so it behaves the same on Windows and macOS.
