#!/usr/bin/env node
// create-muten — scaffold a new Muten app, with modern interactive prompts (@clack/prompts).
//
//   npm create muten@latest [name]              (or: npx create-muten)
//   create-muten [name] [--template basic|routing|full] [--css|--scss] [--tailwind] [--daisyui] [--svelte] [--react] [--pm npm|pnpm|yarn|bun] [--no-install]
//
// Stylesheet (CSS or SCSS) is the base; Tailwind is an optional add-on ON TOP of CSS (it's a styling
// library, not a stylesheet replacement). Interactive in a TTY; flags / non-TTY make it scriptable.
import { cpSync, existsSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { intro, outro, text, select, confirm, isCancel, cancel, note } from '@clack/prompts';
import color from 'picocolors';

const SELF = dirname(fileURLToPath(import.meta.url));
const TEMPLATE = join(SELF, 'template');
const TAURI_TEMPLATE = join(SELF, 'template-tauri'); // src-tauri/ overlay, copied only when --tauri
const TEMPLATES = ['muten', 'react', 'svelte']; // the "template" IS the flavor: pure muten, or muten + a framework for islands
const PKG = JSON.parse(readFileSync(join(SELF, 'package.json'), 'utf8'));
const PMS = ['npm', 'pnpm', 'yarn', 'bun'];

// the starter reset — written by the CLI so the template stays pure .muten (no default styles file).
const RESET = `/* Your look. Muten ships STRUCTURE + LAYOUT (style() tokens); the LOOK lives here, via class("…"). */
* { box-sizing: border-box; }
body { margin: 0; font: 15px/1.55 system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; color: #111; }
h1, h2, h3, h4, h5, h6, p { margin: 0; }
h1 { font-size: 32px; font-weight: 700; letter-spacing: -.02em; }
.stack { display: flex; flex-direction: column; }
img { max-width: 100%; display: block; }
a { color: inherit; text-decoration: none; }
`;
// CSS + Tailwind v4: one @import + the @tailwindcss/vite plugin. Preflight does the reset, so this stays
// minimal — only `.stack` (a Muten layout primitive Tailwind doesn't know). You style via class("…").
const tailwindStyles = (daisyui) => `@import "tailwindcss";${daisyui ? '\n@plugin "daisyui";' : ''}

/* Muten layout primitive Tailwind doesn't define */
.stack { display: flex; flex-direction: column; }
`;
// Starter welcome page styles (used by the scaffolded home.muten). Self-contained plain CSS — looks good
// with or without Tailwind; delete it (and the page) when you build your own.
const WELCOME_CSS = `
/* — starter welcome page (src/pages/home/home.muten) — delete when you build your own — */
.welcome { background: #fafafa; color: #18181b; padding: 64px 24px; }
.wrap { max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; gap: 52px; }
.hero { text-align: center; }
.logo { width: 64px; height: 64px; border-radius: 16px; margin: 0 auto; box-shadow: 0 6px 20px rgba(255,94,0,.28); }
.brand { font-size: clamp(40px, 8vw, 58px); font-weight: 800; letter-spacing: -.04em; line-height: 1; margin-top: 22px; background: linear-gradient(135deg, #ff5e00, #ff9a00); -webkit-background-clip: text; background-clip: text; color: transparent; }
.tagline { font-size: 18px; font-weight: 600; color: #27272a; margin-top: 10px; }
.lead { max-width: 580px; margin: 14px auto 0; color: #52525b; font-size: 16px; line-height: 1.65; }
.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.stat { border: 1px solid #e4e4e7; border-radius: 14px; padding: 22px 16px; text-align: center; background: #fff; }
.stat-n { font-size: 26px; font-weight: 800; letter-spacing: -.02em; color: #ff5e00; }
.stat-l { color: #71717a; font-size: 12px; line-height: 1.45; margin-top: 6px; }
.section { display: flex; flex-direction: column; gap: 14px; }
.h2 { font-size: 22px; font-weight: 700; letter-spacing: -.02em; }
.snippet { background: #18181b; color: #e4e4e7; border-radius: 14px; padding: 20px 22px; margin: 0; overflow-x: auto; white-space: pre; font: 13px/1.7 ui-monospace, 'SF Mono', Menlo, Consolas, monospace; }
.note { color: #71717a; font-size: 13px; line-height: 1.55; }
.cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
.card { border: 1px solid #e4e4e7; border-radius: 14px; padding: 18px; background: #fff; }
.card-title { font-size: 14px; font-weight: 600; margin-bottom: 5px; }
.card-text { color: #71717a; font-size: 13px; line-height: 1.5; }
@media (max-width: 560px) { .stats, .cards { grid-template-columns: 1fr; } }
`;
// vite.config composed from the chosen options — muten always; svelte/react add island plugins; tailwind last.
const viteConfig = ({ tailwind, svelte, react }) => {
  const imports = [`import muten from '@muten/core/vite-plugin-muten.js';`];
  const plugins = ['muten()'];
  if (svelte) { imports.push(`import { svelte } from '@sveltejs/vite-plugin-svelte';`); plugins.push('svelte()'); }
  if (react) { imports.push(`import react from '@vitejs/plugin-react';`); plugins.push('react()'); }
  if (tailwind) { imports.push(`import tailwindcss from '@tailwindcss/vite';`); plugins.push('tailwindcss()'); }
  return `${imports.join('\n')}\n\nexport default {\n  plugins: [${plugins.join(', ')}],\n};\n`;
};
// Tell the AI the island plugin is wired so it can drop in a real Svelte/React component (incl. shadcn/Radix).
const ISLANDS_NOTE = ({ svelte, react }) => {
  const techs = [svelte && 'Svelte', react && 'React'].filter(Boolean).join(' + ');
  const ex = react
    ? `use Widget from "react:./Widget.jsx"` + '  →  ' + `Widget(value: @sel, onChange: pick) client:visible`
    : `use Widget from "svelte:./Widget.svelte"` + '  →  ' + `Widget(value: @sel, onChange: pick) client:visible`;
  return `
## Framework islands (${techs} — wired)
The ${techs} Vite plugin is installed. For a genuinely-interactive widget Muten can't express (date-picker,
combobox, command palette, rich editor — including React/Svelte libs like shadcn/Radix), write the component
in its own \`.${react ? 'jsx' : 'svelte'}\` file and mount it as a node: \`${ex}\`. props ↓ (\`@state\`) + events ↑
(an \`onX: action\` calls a Muten action), lazy + code-split. Default to \`.muten\` for the UI; reach for an
island only for the foreign piece. Full details: SKILL §14.
`;
};
// When Tailwind/DaisyUI is chosen, the Muten token scale is centralized to MATCH Tailwind's defaults, so
// style() tokens and Tailwind utilities share one scale (e.g. style(gap.md) == gap-4 == 1rem). Plain
// css/scss keeps the default theme.muten. (DaisyUI builds on Tailwind's scale; its colors come via @plugin.)
const TAILWIND_THEME = `# Token SCALE aligned with Tailwind's defaults — style() tokens + Tailwind utilities share one scale.
theme {
  space       { xs "0.25rem"  sm "0.5rem"  md "1rem"  lg "1.5rem"  xl "2rem" }
  font        { sm "0.875rem"  md "1rem"  lg "1.125rem"  xl "1.25rem" }
  weight      { medium "500"  semibold "600"  bold "700" }
  leading     { tight "1.25"  normal "1.5"  loose "2" }
  breakpoints { sm "640px"  md "768px"  lg "1024px"  xl "1280px" }
}
`;
const TAILWIND_NOTE = `
## Styling: Tailwind CSS v4 (installed)
This app has Tailwind ON TOP of CSS. Write the LOOK with \`class("…")\` using Tailwind utilities, e.g.
\`class("flex gap-4 rounded-lg bg-zinc-900 text-white")\`. \`style()\` still owns Muten's layout/
typography tokens — don't put Tailwind classes in \`style()\`, and don't put layout in \`class()\`.
You can still add your own rules in \`src/styles.css\` below the \`@import "tailwindcss";\`.
`;
// DaisyUI = component CLASSES on top of Tailwind (no React). The "shadcn for Muten": pre-styled components
// you drop into class("…"); behavior (open/close) you build with Muten state + class(when) + on(…).
const DAISY_NOTE = `
## DaisyUI (installed)
DaisyUI adds **component classes** on top of Tailwind — use them in \`class("…")\`: \`class("btn btn-primary")\`,
\`class("card bg-base-100 shadow-xl")\`, \`class("badge")\`, \`class("alert")\`. Pure classes, no React.
\`@plugin "daisyui";\` is already in \`src/styles.css\`. Interactive behavior (toggle a modal/dropdown) you build
with Muten: \`state\` + \`class(active when isOpen)\` + \`on(click: …)\`.
`;
// Tauri = the SAME web build wrapped in a native OS-webview window (no browser bundled). Desktop target.
const TAURI_NOTE = (pm) => `
## Desktop app (Tauri)
This app also ships as a native desktop app via Tauri (\`src-tauri/\`). The SAME \`.muten\` frontend runs in
an OS-webview window — build the UI exactly like the web app (routing works as-is: the webview runs the SPA,
no server, no URL bar, no fallback needed).
- \`${pm} run tauri dev\` — run the desktop app (hot-reloads the frontend).
- \`${pm} run tauri build\` — native installer in \`src-tauri/target/release/bundle/\`.
- Needs the **Rust toolchain** on the machine (https://rustup.rs) — Tauri compiles a small native shell. Not auto-installed.
- Custom icon: \`${pm} run tauri icon path/to/logo.png\` regenerates \`src-tauri/icons/\`.
`;

// Deploy on Vercel: muten routes are real paths (History API), so an unmatched path must fall back to
// index.html (else a hard refresh of /about 404s). Static assets are served first; only routes rewrite.
const VERCEL_JSON = `{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
`;

// Which PM launched us? npm/pnpm/yarn/bun set npm_config_user_agent — the idiomatic default.
const detectPM = () => { const ua = process.env.npm_config_user_agent || ''; return PMS.find((p) => ua.startsWith(p + '/')) || 'npm'; };
const validName = (n) => /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(n);
const keep = (v) => { if (isCancel(v)) { cancel('Cancelled.'); process.exit(0); } return v; };

// The muten mark + wordmark, in the brand orange (#FF5E00) — shown before the prompts. Truecolor ANSI
// (modern terminals); degrades to plain text where unsupported.
const logo = () => {
  const o = '\x1b[38;2;255;94;0m', tile = '\x1b[48;2;255;94;0m\x1b[1m\x1b[97m', b = '\x1b[1m', d = '\x1b[2m', r = '\x1b[0m';
  console.log(`\n  ${tile} M ${r}  ${b}${o}muten${r}`);
  console.log(`  ${d}     the AI-first frontend framework${r}\n`);
};

async function main() {
  const argv = process.argv.slice(2);
  const has = (f) => argv.includes(f);
  const val = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : undefined; };
  if (has('-v') || has('--version')) { console.log(PKG.version); return; }
  if (has('-h') || has('--help')) { console.log('Usage: create-muten [name] [--template muten|react|svelte] [--css|--scss] [--tailwind] [--daisyui] [--vercel] [--tauri] [--pm npm|pnpm|yarn|bun] [--no-install]'); return; }

  let name = argv.filter((a, i) => !a.startsWith('-') && argv[i - 1] !== '--pm' && argv[i - 1] !== '--template')[0];
  let template = val('--template') || (has('--react') ? 'react' : has('--svelte') ? 'svelte' : has('--muten') ? 'muten' : undefined); // flavor: muten | react | svelte
  let style = has('--scss') ? 'scss' : has('--css') ? 'css' : undefined;     // the base stylesheet
  let tailwind = has('--tailwind') ? true : undefined;                        // optional add-on (CSS only)
  let daisyui = has('--daisyui') ? true : undefined;                          // component classes on Tailwind
  let vercel = has('--vercel') ? true : undefined;                            // a vercel.json with the SPA fallback rewrite
  let tauri = has('--tauri') ? true : undefined;                              // src-tauri/ → native desktop app
  let pm = val('--pm');
  let install = has('--no-install') ? false : undefined;
  if (name && !validName(name)) { console.error(`Invalid name: "${name}" (letters, digits, . _ -)`); process.exit(1); }
  if (template && !TEMPLATES.includes(template)) { console.error(`Unknown template: "${template}" (${TEMPLATES.join(', ')})`); process.exit(1); }
  if (pm && !PMS.includes(pm)) { console.error(`Unknown package manager: "${pm}" (${PMS.join(', ')})`); process.exit(1); }
  const dpm = detectPM();

  // Styled prompts only with a real TTY (piped/CI input would hang); otherwise use flags + defaults.
  if (process.stdin.isTTY) {
    logo();
    intro(color.dim(`create-muten v${PKG.version}`));
    if (!name) name = keep(await text({ message: 'Project name', placeholder: 'muten-app', defaultValue: 'muten-app', validate: (v) => (v && !validName(v)) ? 'Use letters, digits, . _ - (start alphanumeric).' : undefined }));
    if (!template) template = keep(await select({ message: 'Template', options: [
      { value: 'muten', label: 'muten', hint: 'pure — the AI-first DSL, zero framework runtime' },
      { value: 'react', label: 'muten + React', hint: 'React islands: shadcn, Radix, any React lib' },
      { value: 'svelte', label: 'muten + Svelte', hint: 'Svelte islands: a lighter runtime' },
    ] }));
    if (!style && tailwind === undefined) { // ONE explicit styling choice — each is opt-in, "CSS" = nothing extra
      const styling = keep(await select({ message: 'Styling', options: [
        { value: 'css', label: 'CSS', hint: 'plain — no framework, zero deps' },
        { value: 'scss', label: 'SCSS', hint: 'adds sass' },
        { value: 'tailwind', label: 'Tailwind CSS', hint: 'utility classes on top of CSS' },
        { value: 'daisyui', label: 'DaisyUI', hint: 'component classes (btn, card, modal) — brings Tailwind with it' },
      ] }));
      style = styling === 'scss' ? 'scss' : 'css';
      tailwind = styling === 'tailwind' || styling === 'daisyui';
      daisyui = styling === 'daisyui';
    }
    if (vercel === undefined) vercel = keep(await confirm({ message: 'Add Vercel deploy config? (vercel.json — fixes real-path routing on Vercel)', initialValue: false }));
    if (tauri === undefined) tauri = keep(await confirm({ message: 'Desktop app? (Tauri — native window, ships the OS webview, needs Rust)', initialValue: false }));
  }
  name = name || 'muten-app';
  template = template || 'muten';
  style = style || 'css';
  if (daisyui) tailwind = true;                 // DaisyUI is a Tailwind plugin
  if (tailwind === undefined) tailwind = false;
  if (daisyui === undefined) daisyui = false;
  if (vercel === undefined) vercel = false;
  if (tauri === undefined) tauri = false;
  if (tailwind) style = 'css';                  // Tailwind v4 is CSS-native (not SCSS)
  const svelte = template === 'svelte';         // the flavor IS the islands choice
  const react = template === 'react';
  pm = pm || dpm;
  if (install === undefined) install = false;

  const target = resolve(name);
  if (existsSync(target)) { (process.stdin.isTTY ? cancel : console.error)(`"${name}" already exists.`); process.exit(1); }

  // EVERY flavor scaffolds the SAME base template (identical welcome page); react/svelte only add the
  // island plugin + deps below, and tailwind/daisyui only swap the stylesheet.
  cpSync(TEMPLATE, target, { recursive: true });
  const ignore = join(target, '_gitignore');
  if (existsSync(ignore)) renameSync(ignore, join(target, '.gitignore'));
  if (vercel) writeFileSync(join(target, 'vercel.json'), VERCEL_JSON); // SPA fallback so real-path routes work on Vercel

  const pkgPath = join(target, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  pkg.name = name;
  const addDev = (deps) => { pkg.devDependencies = { ...(pkg.devDependencies || {}), ...deps }; };
  const addDep = (deps) => { pkg.dependencies = { ...(pkg.dependencies || {}), ...deps }; };
  const appendAgents = (text) => { const f = join(target, '.claude', 'AGENTS.md'); if (existsSync(f)) writeFileSync(f, readFileSync(f, 'utf8') + text); };

  if (tailwind) {
    writeFileSync(join(target, 'src', 'styles.css'), tailwindStyles(daisyui) + WELCOME_CSS);
    writeFileSync(join(target, 'theme.muten'), TAILWIND_THEME);          // scale centralized to Tailwind's
    addDev({ tailwindcss: '^4.0.0', '@tailwindcss/vite': '^4.0.0' });
    if (daisyui) addDev({ daisyui: '^5.0.0' });
    appendAgents(TAILWIND_NOTE + (daisyui ? DAISY_NOTE : ''));           // tell the AI what styling is available
  } else {
    writeFileSync(join(target, 'src', style === 'scss' ? 'styles.scss' : 'styles.css'), RESET + WELCOME_CSS);
  }
  if (style === 'scss') addDev({ sass: '^1.101.0' });
  if (svelte) { addDep({ svelte: '^5.0.0' }); addDev({ '@sveltejs/vite-plugin-svelte': '^7.0.0' }); }
  if (react) { addDep({ react: '^19.0.0', 'react-dom': '^19.0.0' }); addDev({ '@vitejs/plugin-react': '^6.0.0' }); }
  if (svelte || react) appendAgents(ISLANDS_NOTE({ svelte, react }));
  if (tauri) {                                  // native desktop wrapper around the same web build (dist)
    cpSync(join(TAURI_TEMPLATE, 'src-tauri'), join(target, 'src-tauri'), { recursive: true });
    writeFileSync(join(target, 'src-tauri', '.gitignore'), '/target\n/gen/schemas\n'); // npm strips real .gitignore from packages
    const confPath = join(target, 'src-tauri', 'tauri.conf.json');
    const conf = JSON.parse(readFileSync(confPath, 'utf8'));
    conf.productName = name;
    conf.identifier = `com.muten.${name.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'app'}`; // reverse-DNS, no dashes/underscores
    conf.app.windows[0].title = name;
    conf.build.beforeDevCommand = `${pm} run dev`;
    conf.build.beforeBuildCommand = `${pm} run build`;
    writeFileSync(confPath, JSON.stringify(conf, null, 2) + '\n');
    addDev({ '@tauri-apps/cli': '^2.0.0' });
    pkg.scripts = { ...pkg.scripts, tauri: 'tauri' };
    appendAgents(TAURI_NOTE(pm));
  }
  writeFileSync(join(target, 'vite.config.mjs'), viteConfig({ tailwind, svelte, react })); // composed: muten + chosen plugins
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

  const desc = `${template}, ${style}${tailwind ? ' + Tailwind' : ''}${daisyui ? ' + DaisyUI' : ''}${vercel ? ' + Vercel' : ''}${tauri ? ' + Tauri' : ''}`;
  if (!install) {
    if (process.stdin.isTTY) { note(`cd ${name}\n${pm} install\n${pm} run dev`, 'Next steps'); outro(color.green(`Created ${name}  (${desc})`)); }
    else console.log(`\n  Created ${name} (${desc}, ${pm})\n  cd ${name} && ${pm} install && ${pm} run dev\n`);
    return;
  }

  if (process.stdin.isTTY) outro(color.green(`Created ${name} (${desc}) — installing with ${pm}…`));
  // PMs are .cmd shims on Windows → spawn needs shell:true to find them.
  const run = (a) => spawnSync(pm, a, { cwd: target, stdio: 'inherit', shell: process.platform === 'win32' });
  if (run(['install']).status === 0) run(['run', 'dev']);
}

main();
