#!/usr/bin/env node
// create-muten — scaffold a new Muten app. Zero runtime deps (Node built-ins only).
//
//   npm create muten@latest [name]              (when published to npm)
//   npx github:karttofer/create-muten [name]    (from GitHub, not yet public)
//   create-muten [name] [--css|--scss] [--pm npm|pnpm|yarn|bun] [--no-install]
//
// Interactive in a TTY (prompts for name, stylesheet, package manager); flags / non-TTY make it
// scriptable. The package manager defaults to the one that invoked us. Then it scaffolds and,
// unless --no-install, runs `<pm> install` + `<pm> run dev`.
import { cpSync, existsSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { spawnSync } from 'node:child_process';

const SELF = dirname(fileURLToPath(import.meta.url));
const TEMPLATE = join(SELF, 'template');
const PKG = JSON.parse(readFileSync(join(SELF, 'package.json'), 'utf8'));
const PMS = ['npm', 'pnpm', 'yarn', 'bun'];

const BANNER = [
  '',
  '                  _',
  '  _ __ ___  _   _| |_ ___ _ __',
  " | '_ ` _ \\| | | | __/ _ \\ '_ \\",
  ' | | | | | | |_| | ||  __/ | | |',
  ' |_| |_| |_|\\__,_|\\__\\___|_| |_|',
  '',
  ' AI-first frontend framework',
  '',
].join('\n');

// Which PM launched us? npm/pnpm/yarn/bun all set npm_config_user_agent (e.g. "pnpm/8.6 ...").
// Detecting it is what create-vue/vite do — the idiomatic default, no guessing.
const detectPM = () => {
  const ua = process.env.npm_config_user_agent || '';
  return PMS.find((p) => ua.startsWith(p + '/')) || 'npm';
};

// Safe folder name: starts alphanumeric, then [A-Za-z0-9._-]. Blocks path traversal / odd input.
const validName = (n) => /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(n);
const die = (msg) => { console.error(msg); process.exit(1); };

async function main() {
  // args: one positional name + optional flags (so the CLI is also scriptable / CI-friendly)
  const argv = process.argv.slice(2);
  const has = (f) => argv.includes(f);
  const val = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : undefined; };
  if (has('-v') || has('--version')) { console.log(PKG.version); return; }
  console.log(BANNER);
  if (has('-h') || has('--help')) { console.log('  Usage: create-muten [name] [--css|--scss] [--pm npm|pnpm|yarn|bun] [--no-install]\n'); return; }

  let name = argv.filter((a, i) => !a.startsWith('-') && argv[i - 1] !== '--pm')[0];
  let style = has('--scss') ? 'scss' : has('--css') ? 'css' : undefined;
  let pm = val('--pm');
  let install = has('--no-install') ? false : undefined;

  if (name && !validName(name)) die(`Invalid name: "${name}" (letters, digits, . _ -)`);
  if (pm && !PMS.includes(pm)) die(`Unknown package manager: "${pm}" (${PMS.join(', ')})`);

  const dpm = detectPM();

  // Prompt only with a real TTY — piped/CI input drops lines through readline, so there we use
  // flags + defaults instead of hanging on a prompt.
  if (process.stdin.isTTY) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const ask = async (q, def) => (await rl.question(q)).trim() || def;
    const pick = async (q, opts, def) => {
      for (;;) {
        const v = (await ask(q, def)).toLowerCase();
        if (opts.includes(v)) return v;
        console.log(`  Choose: ${opts.join(', ')}.`);
      }
    };
    while (!name) {
      const a = await ask('Project name: (muten-app) ', 'muten-app');
      if (validName(a)) name = a; else console.log('  Letters, digits, . _ - (start alphanumeric).');
    }
    if (!style) style = await pick('Stylesheet? [css/scss] (css) ', ['css', 'scss'], 'css');
    if (!pm) pm = await pick(`Package manager? [${PMS.join('/')}] (${dpm}) `, PMS, dpm);
    if (install === undefined) install = (await ask('Install deps and start the dev server now? [Y/n] ', 'y')).toLowerCase() !== 'n';
    rl.close();
  }
  name = name || 'muten-app';
  style = style || 'css';
  pm = pm || dpm;
  if (install === undefined) install = false;

  const target = resolve(name);
  if (existsSync(target)) die(`"${name}" already exists.`);

  // scaffold from ./template
  cpSync(TEMPLATE, target, { recursive: true });
  const ignore = join(target, '_gitignore');                        // npm strips a real .gitignore on publish
  if (existsSync(ignore)) renameSync(ignore, join(target, '.gitignore'));
  if (style === 'scss') renameSync(join(target, 'src', 'styles.css'), join(target, 'src', 'styles.scss')); // plugin auto-detects

  const pkgPath = join(target, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  pkg.name = name;
  if (style === 'scss') pkg.devDependencies = { ...(pkg.devDependencies || {}), sass: '^1.101.0' };
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

  console.log(`\n  Created ${name}  (${style}, ${pm})\n`);

  if (!install) { console.log(`  cd ${name}\n  ${pm} install\n  ${pm} run dev\n`); return; }

  // PMs are .cmd shims on Windows → spawn needs shell:true to find them.
  const run = (a) => spawnSync(pm, a, { cwd: target, stdio: 'inherit', shell: process.platform === 'win32' });
  if (run(['install']).status === 0) run(['run', 'dev']);
}

main();
