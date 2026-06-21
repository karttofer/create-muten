#!/usr/bin/env sh
# create-muten — scaffold a new Muten app (pure shell, no Node).
#
#   sh create-muten.sh [name] [css|scss]
#
# With no args it prompts for the name and the stylesheet. Args skip the prompts
# (handy for CI). The generated app installs `muten` (the engine) as a dependency.
set -eu

template="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)/template"
[ -d "$template" ] || { echo "template not found at $template"; exit 1; }

# ── banner ───────────────────────────────────────────────────────────────────
cat <<'BANNER'

                  _
  _ __ ___  _   _| |_ ___ _ __
 | '_ ` _ \| | | | __/ _ \ '_ \
 | | | | | | |_| | ||  __/ | | |
 |_| |_| |_|\__,_|\__\___|_| |_|

 AI-first frontend framework

BANNER

# Only safe folder names: must start alphanumeric, then [A-Za-z0-9._-]. This is the
# seal — it blocks path traversal (../), absolute paths, spaces and shell metacharacters.
# The app directory AND the package.json string are built from this name, so it must be airtight.
valid_name() {
  case "$1" in
    ""|.|..)             return 1 ;;
    [!A-Za-z0-9]*)       return 1 ;;   # must start with a letter or digit
    *[!A-Za-z0-9._-]*)   return 1 ;;   # only letters, digits, . _ - allowed
    *)                   return 0 ;;
  esac
}

# ── project name (arg $1, else prompt) ───────────────────────────────────────
name="${1:-}"
if [ -n "$name" ]; then
  valid_name "$name" || { printf 'Invalid name: "%s" (use letters, digits, . _ -)\n' "$name"; exit 1; }
elif [ -t 0 ]; then
  while :; do
    printf 'Project name: (muten-app) '
    read -r name || exit 1
    [ -z "$name" ] && name="muten-app"
    valid_name "$name" && break
    echo "  Invalid name — letters, digits, . _ - only (no spaces, no /)."
  done
else
  name="muten-app"
fi

[ -e "$name" ] && { printf '"%s" already exists.\n' "$name"; exit 1; }

# ── stylesheet: css (default) or scss (arg $2, else prompt) ───────────────────
style="${2:-}"
if [ -n "$style" ]; then
  case "$style" in
    css|CSS)   style="css" ;;
    scss|SCSS) style="scss" ;;
    *) printf 'Invalid stylesheet: "%s" (css or scss)\n' "$style"; exit 1 ;;
  esac
elif [ -t 0 ]; then
  while :; do
    printf 'Stylesheet? [css/scss] (css) '
    read -r style || exit 1
    case "${style:-css}" in
      css|CSS)   style="css";  break ;;
      scss|SCSS) style="scss"; break ;;
      *) echo "  Please type css or scss." ;;
    esac
  done
else
  style="css"
fi

# ── scaffold (remove a partial directory if anything below fails) ─────────────
trap 'rm -rf "$name" 2>/dev/null || true' EXIT
cp -R "$template" "$name"

# npm strips a real ".gitignore" from published packages, so the template ships "_gitignore".
[ -f "$name/_gitignore" ] && mv "$name/_gitignore" "$name/.gitignore"

# stylesheet choice: rename the file, fix the import, and request the sass devDependency.
scss_dep=""
if [ "$style" = "scss" ]; then
  mv "$name/src/styles.css" "$name/src/styles.scss"   # the muten vite plugin auto-detects .css vs .scss
  scss_dep=',
  "devDependencies": {
    "sass": "^1.101.0"
  }'
fi

# Regenerate package.json deterministically — `name` is validated, so it is safe in the JSON string.
cat > "$name/package.json" <<EOF
{
  "name": "$name",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "muten lint"
  },
  "dependencies": {
    "muten": "github:karttofer/muten",
    "vite": "^8.0.16"
  }$scss_dep
}
EOF

trap - EXIT   # success — keep the directory
printf '\n  Created %s (%s)\n\n  cd %s\n  npm install\n  npm run dev\n\n' "$name" "$style" "$name"
