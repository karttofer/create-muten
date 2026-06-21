# @karttofer/create-muten

Scaffold a new [Muten](https://github.com/karttofer/muten) app.

> **GitHub Packages** (not public npm yet). One-time setup — add to your **global** `~/.npmrc` a GitHub
> token with `read:packages`:
> ```
> @karttofer:registry=https://npm.pkg.github.com
> //npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
> ```

```sh
npx @karttofer/create-muten          # run once
npm i -g @karttofer/create-muten     # …or install the `create-muten` command globally
create-muten my-app
```

It prompts for the **project name**, the **stylesheet** (CSS/SCSS) and the **package manager**
(default = the one you invoked it with), then scaffolds and — unless you decline — runs
`<pm> install` + `<pm> run dev`. CI flags: `--css|--scss`, `--pm <npm|pnpm|yarn|bun>`, `--no-install`.

The engine (`@karttofer/muten`) is a separate package the app installs as a dependency — the same
split as `create-vue` ↔ `vue`. It's a Node CLI (not a shell script), so the command behaves the same
on Windows and macOS. The generated app ships an `.npmrc` pointing `@karttofer` at GitHub Packages,
so its `install` resolves the engine (your `~/.npmrc` token still applies).
