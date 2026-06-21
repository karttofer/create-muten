# create-muten - scaffold a new Muten app (pure shell, no Node).
#
#   .\create-muten.ps1 [name] [css|scss]
#
# With no args it prompts for the name and the stylesheet. Args skip the prompts.
# The generated app installs `muten` (the engine) as a dependency.
# NOTE: kept pure ASCII on purpose - Windows PowerShell 5.1 reads a BOM-less file as ANSI.
[CmdletBinding()]
param([string]$Name, [string]$Style)
$ErrorActionPreference = "Stop"

$template = Join-Path $PSScriptRoot "template"
if (-not (Test-Path $template)) { Write-Host "template not found at $template"; exit 1 }

# --- banner ---
Write-Host @'

                  _
  _ __ ___  _   _| |_ ___ _ __
 | '_ ` _ \| | | | __/ _ \ '_ \
 | | | | | | |_| | ||  __/ | | |
 |_| |_| |_|\__,_|\__\___|_| |_|

 AI-first frontend framework

'@

# Only safe folder names: must start alphanumeric, then [A-Za-z0-9._-]. This is the seal:
# it blocks path traversal (..\), absolute paths, spaces and metacharacters. The directory AND
# the package.json string are built from this name, so it must be airtight.
function Test-MutenName([string]$n) {
  if ([string]::IsNullOrWhiteSpace($n)) { return $false }
  if ($n -eq "." -or $n -eq "..") { return $false }
  return $n -match '^[A-Za-z0-9][A-Za-z0-9._-]*$'
}

# --- project name (arg, else prompt) ---
if ($Name) {
  if (-not (Test-MutenName $Name)) { Write-Host ('Invalid name: "' + $Name + '" (use letters, digits, . _ -)'); exit 1 }
} else {
  while ($true) {
    $Name = Read-Host "Project name (muten-app)"
    if ([string]::IsNullOrWhiteSpace($Name)) { $Name = "muten-app" }
    if (Test-MutenName $Name) { break }
    Write-Host "  Invalid name - letters, digits, . _ - only (no spaces, no slashes)."
  }
}

if (Test-Path $Name) { Write-Host ('"' + $Name + '" already exists.'); exit 1 }

# --- stylesheet: css (default) or scss (arg, else prompt) ---
if ($Style) {
  $low = $Style.ToLower()
  if ($low -eq "css" -or $low -eq "scss") { $Style = $low }
  else { Write-Host ('Invalid stylesheet: "' + $Style + '" (css or scss)'); exit 1 }
} else {
  $Style = "css"
  while ($true) {
    $ans = Read-Host "Stylesheet? [css/scss] (css)"
    if ([string]::IsNullOrWhiteSpace($ans)) { $Style = "css"; break }
    $low = $ans.ToLower()
    if ($low -eq "css")  { $Style = "css";  break }
    elseif ($low -eq "scss") { $Style = "scss"; break }
    else { Write-Host "  Please type css or scss." }
  }
}

# --- scaffold (remove a partial directory if anything fails) ---
try {
  New-Item -ItemType Directory -Path $Name | Out-Null
  Copy-Item -Path (Join-Path $template '*') -Destination $Name -Recurse

  # npm strips a real ".gitignore" from published packages, so the template ships "_gitignore".
  $ignore = Join-Path $Name "_gitignore"
  if (Test-Path $ignore) { Rename-Item $ignore ".gitignore" }

  # stylesheet choice: rename the file, fix the import, and request the sass devDependency.
  $scssDep = ""
  if ($Style -eq "scss") {
    Rename-Item (Join-Path $Name "src\styles.css") "styles.scss"   # the muten vite plugin auto-detects .css vs .scss
    $scssDep = ",`n  `"devDependencies`": {`n    `"sass`": `"^1.101.0`"`n  }"
  }

  # Regenerate package.json deterministically - $Name is validated, so it is safe in the JSON string.
  $pkg = @"
{
  "name": "$Name",
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
  }$scssDep
}
"@
  [System.IO.File]::WriteAllText((Join-Path $Name "package.json"), $pkg + "`n")
} catch {
  if (Test-Path $Name) { Remove-Item $Name -Recurse -Force }
  throw
}

Write-Host "`n  Created $Name ($Style)`n`n  cd $Name`n  npm install`n  npm run dev`n"
