#!/usr/bin/env node
// create-muten — scaffold a new Muten app, with modern interactive prompts (@clack/prompts).
//
//   npm create muten@latest [name]              (or: npx create-muten)
//   create-muten [name] [--css|--scss|--tailwind] [--pm npm|pnpm|yarn|bun] [--no-install]
//
// Interactive in a TTY (styled prompts: name, styling, package manager); flags / non-TTY make it
// scriptable. It scaffolds and — unless declined — runs `<pm> install` + `<pm> run dev`.
import { cpSync, existsSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { intro, outro, text, select, confirm, isCancel, cancel, note } from '@clack/prompts';
import color from 'picocolors';

const SELF = dirname(fileURLToPath(import.meta.url));
const TEMPLATE = join(SELF, 'template');
const PKG = JSON.parse(readFileSync(join(SELF, 'package.json'), 'utf8'));
const PMS = ['npm', 'pnpm', 'yarn', 'bun'];
const STYLES = ['css', 'scss', 'tailwind'];

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
// Tailwind v4: one @import + the @tailwindcss/vite plugin (no config file). Preflight does the reset;
// .stack is a Muten layout primitive Tailwind doesn't know about, so it stays.
const TAILWIND_STYLES = `@import "tailwindcss";

/* Muten layout primitive Tailwind doesn't define */
.stack { display: flex; flex-direction: column; }
`;
const TAILWIND_VITE = `import muten from '@muten/core/vite-plugin-muten.js';
import tailwindcss from '@tailwindcss/vite';

export default {
  plugins: [muten(), tailwindcss()],
};
`;
const TAILWIND_NOTE = `
## Styling: Tailwind CSS v4 (installed)
This app has Tailwind. Write the LOOK with \`class("…")\` using Tailwind utilities, e.g.
\`class("flex gap-4 rounded-lg bg-zinc-900 text-white")\`. \`style()\` still owns Muten's layout/
typography tokens — don't put Tailwind classes in \`style()\`, and don't put layout in \`class()\`.
`;

// Which PM launched us? npm/pnpm/yarn/bun set npm_config_user_agent — the idiomatic default.
const detectPM = () => { const ua = process.env.npm_config_user_agent || ''; return PMS.find((p) => ua.startsWith(p + '/')) || 'npm'; };
const validName = (n) => /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(n);
const keep = (v) => { if (isCancel(v)) { cancel('Cancelled.'); process.exit(0); } return v; };

async function main() {
  const argv = process.argv.slice(2);
  const has = (f) => argv.includes(f);
  const val = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : undefined; };
  if (has('-v') || has('--version')) { console.log(PKG.version); return; }
  if (has('-h') || has('--help')) { console.log('Usage: create-muten [name] [--css|--scss|--tailwind] [--pm npm|pnpm|yarn|bun] [--no-install]'); return; }

  let name = argv.filter((a, i) => !a.startsWith('-') && argv[i - 1] !== '--pm')[0];
  let style = has('--tailwind') ? 'tailwind' : has('--scss') ? 'scss' : has('--css') ? 'css' : undefined;
  let pm = val('--pm');
  let install = has('--no-install') ? false : undefined;
  if (name && !validName(name)) { console.error(`Invalid name: "${name}" (letters, digits, . _ -)`); process.exit(1); }
  if (pm && !PMS.includes(pm)) { console.error(`Unknown package manager: "${pm}" (${PMS.join(', ')})`); process.exit(1); }
  const dpm = detectPM();

  // Styled prompts only with a real TTY (piped/CI input would hang); otherwise use flags + defaults.
  if (process.stdin.isTTY) {
    intro(color.bgCyan(color.black(' create-muten ')) + color.dim('  the AI-first frontend framework'));
    if (!name) name = keep(await text({ message: 'Project name', placeholder: 'muten-app', defaultValue: 'muten-app', validate: (v) => (v && !validName(v)) ? 'Use letters, digits, . _ - (start alphanumeric).' : undefined }));
    if (!style) style = keep(await select({ message: 'Styling', options: [
      { value: 'css', label: 'Plain CSS', hint: 'zero deps' },
      { value: 'scss', label: 'SCSS', hint: 'adds sass' },
      { value: 'tailwind', label: 'Tailwind CSS', hint: 'utility classes via class("…") — fastest to style' },
    ] }));
    if (!pm) pm = keep(await select({ message: 'Package manager', initialValue: dpm, options: PMS.map((p) => ({ value: p, label: p })) }));
    if (install === undefined) install = keep(await confirm({ message: 'Install dependencies and start the dev server now?' }));
  }
  name = name || 'muten-app';
  style = style || 'css';
  pm = pm || dpm;
  if (install === undefined) install = false;

  const target = resolve(name);
  if (existsSync(target)) { (process.stdin.isTTY ? cancel : console.error)(`"${name}" already exists.`); process.exit(1); }

  // scaffold from ./template (pure .muten) + apply the styling choice
  cpSync(TEMPLATE, target, { recursive: true });
  const ignore = join(target, '_gitignore');
  if (existsSync(ignore)) renameSync(ignore, join(target, '.gitignore'));

  const pkgPath = join(target, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  pkg.name = name;
  const addDev = (deps) => { pkg.devDependencies = { ...(pkg.devDependencies || {}), ...deps }; };

  if (style === 'tailwind') {
    writeFileSync(join(target, 'src', 'styles.css'), TAILWIND_STYLES);
    writeFileSync(join(target, 'vite.config.mjs'), TAILWIND_VITE);
    addDev({ tailwindcss: '^4.0.0', '@tailwindcss/vite': '^4.0.0' });
    const agents = join(target, '.claude', 'AGENTS.md');                 // tell the AI Tailwind is available
    if (existsSync(agents)) writeFileSync(agents, readFileSync(agents, 'utf8') + TAILWIND_NOTE);
  } else {
    writeFileSync(join(target, 'src', style === 'scss' ? 'styles.scss' : 'styles.css'), RESET);
    if (style === 'scss') addDev({ sass: '^1.101.0' });
  }
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

  if (!install) {
    if (process.stdin.isTTY) { note(`cd ${name}\n${pm} install\n${pm} run dev`, 'Next steps'); outro(color.green(`Created ${name}  (${style})`)); }
    else console.log(`\n  Created ${name} (${style}, ${pm})\n  cd ${name} && ${pm} install && ${pm} run dev\n`);
    return;
  }

  if (process.stdin.isTTY) outro(color.green(`Created ${name} (${style}) — installing with ${pm}…`));
  // PMs are .cmd shims on Windows → spawn needs shell:true to find them.
  const run = (a) => spawnSync(pm, a, { cwd: target, stdio: 'inherit', shell: process.platform === 'win32' });
  if (run(['install']).status === 0) run(['run', 'dev']);
}

main();
