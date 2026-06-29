# Publishing `@karttofer/create-muten`

Published to **GitHub Packages**, the same way as [`@karttofer/muten`](https://github.com/karttofer/muten).

## One-time setup

A GitHub Personal Access Token with `write:packages` and `read:packages` (plus `repo` while the
repository is private), in your **global** `~/.npmrc` (never commit a token):

```
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
```

`publishConfig.registry` already targets `https://npm.pkg.github.com`.

## Publish

```sh
npm publish
```

Ships `index.js` + `template/` - including `template/_npmrc`, which the CLI renames to `.npmrc` in
every new app so the app's install resolves `@karttofer/muten`. After it succeeds the package shows up
under **Packages** on the repo page. Bump `version` in `package.json` before each release.

## Using it (consumers)

With the `@karttofer` registry + token in `~/.npmrc`:

```sh
npx @karttofer/create-muten my-app     # one-off
npm i -g @karttofer/create-muten       # …or install the `create-muten` command globally
create-muten my-app
```
