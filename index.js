#!/usr/bin/env node
// create-muten — scaffold a new Muten app, with modern interactive prompts (@clack/prompts).
//
//   npm create muten@latest [name]              (or: npx create-muten)
//   create-muten [name] [--template basic|routing|full] [--css|--scss] [--tailwind] [--daisyui] [--pm npm|pnpm|yarn|bun] [--no-install]
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
const OVERLAYS = join(SELF, 'overlays');   // additive layers per template variant (routing, full)
const TEMPLATES = ['basic', 'routing', 'full'];
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
const TAILWIND_VITE = `import muten from '@muten/core/vite-plugin-muten.js';
import tailwindcss from '@tailwindcss/vite';

export default {
  plugins: [muten(), tailwindcss()],
};
`;
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

// Which PM launched us? npm/pnpm/yarn/bun set npm_config_user_agent — the idiomatic default.
const detectPM = () => { const ua = process.env.npm_config_user_agent || ''; return PMS.find((p) => ua.startsWith(p + '/')) || 'npm'; };
const validName = (n) => /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(n);
const keep = (v) => { if (isCancel(v)) { cancel('Cancelled.'); process.exit(0); } return v; };

async function main() {
  const argv = process.argv.slice(2);
  const has = (f) => argv.includes(f);
  const val = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : undefined; };
  if (has('-v') || has('--version')) { console.log(PKG.version); return; }
  if (has('-h') || has('--help')) { console.log('Usage: create-muten [name] [--template basic|routing|full] [--css|--scss] [--tailwind] [--daisyui] [--pm npm|pnpm|yarn|bun] [--no-install]'); return; }

  let name = argv.filter((a, i) => !a.startsWith('-') && argv[i - 1] !== '--pm' && argv[i - 1] !== '--template')[0];
  let template = val('--template') || (has('--full') ? 'full' : has('--routing') ? 'routing' : has('--basic') ? 'basic' : undefined);
  let style = has('--scss') ? 'scss' : has('--css') ? 'css' : undefined;     // the base stylesheet
  let tailwind = has('--tailwind') ? true : undefined;                        // optional add-on (CSS only)
  let daisyui = has('--daisyui') ? true : undefined;                          // component classes on Tailwind
  let pm = val('--pm');
  let install = has('--no-install') ? false : undefined;
  if (name && !validName(name)) { console.error(`Invalid name: "${name}" (letters, digits, . _ -)`); process.exit(1); }
  if (template && !TEMPLATES.includes(template)) { console.error(`Unknown template: "${template}" (${TEMPLATES.join(', ')})`); process.exit(1); }
  if (pm && !PMS.includes(pm)) { console.error(`Unknown package manager: "${pm}" (${PMS.join(', ')})`); process.exit(1); }
  const dpm = detectPM();

  // Styled prompts only with a real TTY (piped/CI input would hang); otherwise use flags + defaults.
  if (process.stdin.isTTY) {
    intro(color.bgCyan(color.black(' create-muten ')) + color.dim('  the AI-first frontend framework'));
    if (!name) name = keep(await text({ message: 'Project name', placeholder: 'muten-app', defaultValue: 'muten-app', validate: (v) => (v && !validName(v)) ? 'Use letters, digits, . _ - (start alphanumeric).' : undefined }));
    if (!template) template = keep(await select({ message: 'Template', options: [
      { value: 'basic', label: 'Basic', hint: 'one page' },
      { value: 'routing', label: 'Routing', hint: 'shell + multiple pages' },
      { value: 'full', label: 'Routing + store + API + Tailwind', hint: 'a real data app' },
    ] }));
    if (template === 'full') tailwind = true;   // the full template implies Tailwind
    // Tailwind is an add-on on top of CSS (Tailwind v4 is CSS-native; Sass isn't recommended).
    if (!style && !tailwind) style = keep(await select({ message: 'Stylesheet', options: [
      { value: 'css', label: 'CSS', hint: 'plain, zero deps' },
      { value: 'scss', label: 'SCSS', hint: 'adds sass' },
    ] }));
    if (tailwind === undefined) tailwind = style === 'css' ? keep(await confirm({ message: 'Add Tailwind CSS? (utility classes via class("…"))', initialValue: false })) : false;
    if (tailwind && daisyui === undefined) daisyui = keep(await confirm({ message: 'Add DaisyUI? (component classes: btn, card, modal…)', initialValue: template === 'full' }));
  }
  name = name || 'muten-app';
  template = template || 'basic';
  if (template === 'full') tailwind = true;     // full implies Tailwind
  if (daisyui) tailwind = true;                 // DaisyUI is a Tailwind plugin
  style = style || 'css';
  if (tailwind === undefined) tailwind = false;
  if (daisyui === undefined) daisyui = false;
  if (tailwind) style = 'css';            // Tailwind implies a CSS base (not SCSS)
  pm = pm || dpm;
  if (install === undefined) install = false;

  const target = resolve(name);
  if (existsSync(target)) { (process.stdin.isTTY ? cancel : console.error)(`"${name}" already exists.`); process.exit(1); }

  // scaffold from ./template (the basic base) + layer the chosen variant's overlay + the stylesheet/add-ons
  cpSync(TEMPLATE, target, { recursive: true });
  if (template !== 'basic') cpSync(join(OVERLAYS, template), target, { recursive: true });  // routing / full overlay
  const ignore = join(target, '_gitignore');
  if (existsSync(ignore)) renameSync(ignore, join(target, '.gitignore'));

  const pkgPath = join(target, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  pkg.name = name;
  const addDev = (deps) => { pkg.devDependencies = { ...(pkg.devDependencies || {}), ...deps }; };

  if (tailwind) {
    writeFileSync(join(target, 'src', 'styles.css'), tailwindStyles(daisyui));
    writeFileSync(join(target, 'vite.config.mjs'), TAILWIND_VITE);
    writeFileSync(join(target, 'theme.muten'), TAILWIND_THEME);          // scale centralized to Tailwind's
    addDev({ tailwindcss: '^4.0.0', '@tailwindcss/vite': '^4.0.0' });
    if (daisyui) addDev({ daisyui: '^5.0.0' });
    const agents = join(target, '.claude', 'AGENTS.md');                 // tell the AI what styling is available
    if (existsSync(agents)) writeFileSync(agents, readFileSync(agents, 'utf8') + TAILWIND_NOTE + (daisyui ? DAISY_NOTE : ''));
  } else {
    writeFileSync(join(target, 'src', style === 'scss' ? 'styles.scss' : 'styles.css'), RESET);
  }
  if (style === 'scss') addDev({ sass: '^1.101.0' });
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

  const desc = `${template}, ${style}${tailwind ? ' + Tailwind' : ''}${daisyui ? ' + DaisyUI' : ''}`;
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
