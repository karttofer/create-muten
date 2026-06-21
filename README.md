# create-muten

Shell scaffolder for a new [Muten](../muten) app. It holds only the **template + the scripts**; the
engine (`muten`) is a separate package the generated app installs as a dependency — the same split as
`create-vue` ↔ `vue`.

## Create an app

**macOS / Linux** (or Git Bash on Windows):

```sh
sh create-muten.sh
```

**Windows** (PowerShell):

```powershell
.\create-muten.ps1
```

Both print the banner and prompt for the **project name** and the **stylesheet** (CSS or SCSS). Then:

```sh
cd my-app
npm install      # pulls in `muten` (the engine) + vite  (+ sass, if you chose SCSS)
npm run dev
```

### Skip the prompts (CI / scripted)

Pass the name and stylesheet as arguments:

```sh
sh create-muten.sh my-app scss
.\create-muten.ps1 my-app css      # Windows
```

## Notes

- **Two scripts** because a single `.sh` does not run on native Windows: `.sh` covers macOS/Linux,
  `.ps1` covers Windows. Both do exactly the same work.
- **Hardened name** — only `[A-Za-z0-9._-]`, must start alphanumeric. This blocks path traversal
  (`../`), absolute paths, spaces and shell metacharacters; bad input is rejected, and a half-written
  directory is removed if anything fails.
- **SCSS** renames `src/styles.css` → `.scss`, fixes the import in `main.js`, and adds `sass` as a
  devDependency. `package.json` is regenerated deterministically (no fragile text surgery).
