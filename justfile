# Bare `just` errors; developer must specify a recipe name.
[private]
default:
    @echo "ERROR: no recipe specified"
    @exit 1

# the "tool directory" where the latest versions of the justfile-invoked tools live.
# convention is: ${BIN_DIR}/${TOOL_NAME}/${ARTIFACT_NAME}
BIN_DIR := ".claude/commands/cc-cmd-bevy/bin"

# every third-party tool runs through mise so mise.toml pins apply without
# requiring shell activation (mandatory for Windows, where mise is shim-based).
MISE := "mise exec --"

set shell := ["bash", "-euo", "pipefail", "-c"]
set windows-shell := ["powershell.exe", "-NoLogo", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command"]

os_arch := os() + "/" + arch()

# --------------------------------------------------------------------------------------------------------

ADOCTOOL_EXE := if os_arch == "macos/aarch64" {
    BIN_DIR / "adoctool/adoctool-darwin-aarch64"
} else if os_arch == "linux/x86_64" {
    BIN_DIR / "adoctool/adoctool-linux-x86_64-gnu"
} else if os_arch == "windows/x86_64" {
    replace(BIN_DIR / "adoctool/adoctool-windows-x86_64.exe", "/", "\\")
} else {
    error("adoctool: unsupported host " + os_arch)
}

TOKEX_EXE := if os_arch == "macos/aarch64" {
    BIN_DIR / "tokex/tokex-darwin-aarch64"
} else if os_arch == "linux/x86_64" {
    BIN_DIR / "tokex/tokex-linux-x86_64-gnu"
} else if os_arch == "windows/x86_64" {
    replace(BIN_DIR / "tokex/tokex-windows-x86_64.exe", "/", "\\")
} else {
    error("tokex: unsupported host " + os_arch)
}

TSANE_EXE := if os_arch == "macos/aarch64" {
    BIN_DIR / "tsane/tsane-darwin-aarch64"
} else if os_arch == "linux/x86_64" {
    BIN_DIR / "tsane/tsane-linux-x86_64-gnu"
} else if os_arch == "windows/x86_64" {
    replace(BIN_DIR / "tsane/tsane-windows-x86_64.exe", "/", "\\")
} else {
    error("tsane: unsupported host " + os_arch)
}

# --------------------------------------------------------------------------------------------------------

epu := "git@powergun.github.com:powergun/cc-cmd-bevy.git"
epp := ".claude/commands/cc-cmd-bevy"
eppt := ".claude/commands"

[unix]
ccup:
    @mkdir -p '{{eppt}}'; if [ ! -e '{{eppt}}/.gitignore' ]; then printf 'cc-cmd-bevy/\n' > '{{eppt}}/.gitignore'; fi; if [ ! -d '{{epp}}/.git' ]; then git clone '{{epu}}' '{{epp}}'; else cd '{{epp}}'; git fetch --prune; git pull --ff-only; fi

[windows]
ccup:
    if (!(Test-Path -LiteralPath '{{eppt}}' -PathType Container)) { New-Item -ItemType Directory -Force -Path '{{eppt}}' | Out-Null }; if (!(Test-Path -LiteralPath '{{eppt}}\.gitignore' -PathType Leaf)) { Set-Content -LiteralPath '{{eppt}}\.gitignore' -Value 'cc-cmd-bevy/' -NoNewline }; if (!(Test-Path -LiteralPath '{{epp}}\.git' -PathType Container)) { git clone '{{epu}}' '{{epp}}' } else { Push-Location '{{epp}}'; try { git fetch --prune; git pull --ff-only } finally { Pop-Location } }

# Install the pinned toolchain, locked dependencies, and missing analysis commands. sec-111 and
# destruction-poc must be installed first. Bun installs the rendering library copy as hard links
# on Windows, so the copy is detached at once; the destruction lib declarations are generated
# from the sibling with its own compiler settings.
setup:
    @just installed ../sec-111
    @just installed ../destruction-poc
    mise install
    {{MISE}} bun install --frozen-lockfile
    {{MISE}} bun packages/render-gateway/detach.ts
    {{MISE}} bun packages/destruction-gateway/emit.ts
    @just commands

# Fail with the fix when the sibling at SIBLING has no install of its own.
[private]
[unix]
installed SIBLING:
    @if [ ! -d '{{SIBLING}}/node_modules' ]; then echo "{{SIBLING}} has no install: run its own just setup in {{SIBLING}}"; exit 1; fi

[private]
[windows]
installed SIBLING:
    @if (!(Test-Path -LiteralPath '{{SIBLING}}/node_modules' -PathType Container)) { Write-Output "{{SIBLING}} has no install: run its own just setup in {{SIBLING}}"; exit 1 }

# Keep an existing command bundle unchanged; ccup is the explicit update command.
[private]
[unix]
commands:
    @if [ ! -d '{{epp}}/.git' ]; then just ccup; fi

[private]
[windows]
commands:
    if (!(Test-Path -LiteralPath '{{epp}}/.git' -PathType Container)) { just ccup; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }

# Recreate the .tmp/ directory (trashing existing contents).
retmp:
    {{MISE}} coreutils rm -rf .tmp
    {{MISE}} coreutils mkdir -p .tmp

# highlight the source and document files longer than 500 LOC
lines *ARGS:
    {{TOKEX_EXE}} lines --types typescript,markdown,javascript,html,css {{ARGS}}

# list the line count of the subdirectories in the given location
subdirs *ARGS:
    {{TOKEX_EXE}} subdirs --types typescript,markdown,javascript,html,css {{ARGS}}

# list the line count per-component, require the calling environment to be a supported workspace
components *ARGS:
    {{TOKEX_EXE}} components --types typescript,markdown,javascript,html,css {{ARGS}}

# list the components information, require the calling environment to be a supported workspace.
# use "-v" to output more information per-component.
ls-components *ARGS:
    {{TOKEX_EXE}} ls-components {{ARGS}}

# Output workspace information
ws-info:
    {{TOKEX_EXE}} ws-info

# --------------------------------------------------------------------------------------------------------

# The level designer's command-line tool. Each recipe passes the scratch directory as the work
# directory; extra arguments pass through, such as `--description <path>`, and for snapshot
# `--eye=<x,y,z> --look-at=<x,y,z>`. The tool's exit status (0, 2 or 3) is the recipe's:
# powershell -Command reports any failure as 1, so on Windows the line exits explicitly.
LEVEL_CLI := MISE + " bun tools/level-cli/main.ts"
KEEP_STATUS := if os_family() == "windows" { "; exit $LASTEXITCODE" } else { "" }

# Print each prop kind with its parameters, ranges and defaults.
kinds *ARGS:
    @{{LEVEL_CLI}} kinds --workdir .tmp {{ARGS}}{{KEEP_STATUS}}

# Build the description in memory, judge it and print the report; writes nothing.
validate *ARGS:
    @{{LEVEL_CLI}} validate --workdir .tmp {{ARGS}}{{KEEP_STATUS}}

# Validate, then write the level pair to .tmp/level/ when the validator accepts.
build *ARGS:
    @{{LEVEL_CLI}} build --workdir .tmp {{ARGS}}{{KEEP_STATUS}}

# Build without judging and write the plan, section and view sheets to .tmp/snapshots/.
snapshot *ARGS:
    @{{LEVEL_CLI}} snapshot --workdir .tmp {{ARGS}}{{KEEP_STATUS}}

# Serve the QA app for the human; agents never run it. It builds the committed description,
# prints the address and the run log's path, and serves until Ctrl+C. Extra arguments pass
# through, such as `--port <n>`. The server's exit status (0, 1 or 3) is the recipe's.
qa *ARGS:
    @{{MISE}} bun tools/qa-server/main.ts --workdir .tmp --sibling ../sec-111 --sibling ../destruction-poc {{ARGS}}{{KEEP_STATUS}}

# --------------------------------------------------------------------------------------------------------

# Generate this repository's synopsis.xml files via the deployed adoctool binary.
# Extra arguments pass through to adoctool, e.g. `just syn --language python`.
syn *ARGS:
    {{ADOCTOOL_EXE}} --language ts {{ARGS}} .

# list the synopsis.xml files and their LOCs. Useful for identifying code bloating.
lsyn:
    {{MISE}} tokei --no-ignore --types xml --sort files -f -C .

# list the markdown files and their LOCs. Useful for identifying document bloating.
lmd:
    {{MISE}} tokei --types markdown --sort files -f -C

# Format TypeScript/JSON code in place (Biome, format only).
fmt:
    {{MISE}} biome format --write .

# Run all tests (Bun test runner across the workspace); tests never load the developer .env.
test:
    @just syn

    {{MISE}} bun test --parallel=4 --only-failures

# Run lint checks: the fail-fast gate, in fixed order.
lint:
    @just syn

    @echo "==== running biome format check ===="
    @{{MISE}} biome format .

    @echo "==== generating destruction lib declarations ===="
    @{{MISE}} bun packages/destruction-gateway/emit.ts
    @just typecheck packages/destruction-gateway/tsconfig.types.json

    @echo "==== running tsc type check (TypeScript 7 native) ===="
    @just typecheck tsconfig.tests.json

    @echo "==== checking browser-safe package sources ===="
    @just typecheck tsconfig.json
    @{{MISE}} bun build --target browser --root . --outdir .tmp/runtime \
        packages/sec111-gateway/src/index.ts packages/render-gateway/src/index.ts \
        packages/level-format/src/index.ts packages/level-glb/src/index.ts \
        packages/prop-kit/src/index.ts packages/level-view/src/index.ts \
        packages/qa-client/src/index.ts packages/qa-client/page/watch.ts \
        packages/qa-client/page/program.ts
    @{{MISE}} bun x --no-install oxlint --no-error-on-unmatched-pattern -c .oxlintrc.runtime.json

    @echo "==== checking tool sources ===="
    @just typecheck tsconfig.tools.json

    @echo "==== checking that product trees never read .tmp/ ===="
    @just notmp

    @echo "==== running oxlint with type-aware rules (tsgolint) ===="
    @{{MISE}} bun x --no-install oxlint --no-error-on-unmatched-pattern

    @echo "==== running knip deadcode check ===="
    @{{MISE}} bun x --no-install knip --no-progress --treat-config-hints-as-errors

    @echo "==== running jscpd clone-budget check ===="
    @{{MISE}} jscpd .

    @echo "==== running tsane (TypeScript quality enforcer) ===="
    {{TSANE_EXE}}

    @echo "==== checking synopsis.xml files longer than 500 loc (structural smell) ===="
    @echo "==== ** IF THIS STEP FAILS, PLEASE REFACTOR THE OFFENDING TS UNIT(S) ** ===="
    @{{TOKEX_EXE}} lines --types xml --no-ignore -n 500

    @echo "==== running tokex code-/doc-bloating checks ===="
    @{{TOKEX_EXE}} lines --types typescript,markdown,javascript,html,css

    @echo "==== running tokex markdown-lint ===="
    @{{TOKEX_EXE}} markdown-lint .

    @echo "==== running tokex unicode-lint ===="
    @{{TOKEX_EXE}} unicode-lint .

# Type-check one project; a project whose include globs match no source yet (TS18003) passes.
[private]
[unix]
typecheck CONFIG:
    @out=$({{MISE}} bun x --no-install tsc -p '{{CONFIG}}' 2>&1) && status=0 || status=$?; if [ "$status" -ne 0 ]; then if [[ "$out" == *TS18003* ]]; then echo "{{CONFIG}}: no sources yet"; else printf '%s\n' "$out"; exit "$status"; fi; fi

[private]
[windows]
typecheck CONFIG:
    @$out = {{MISE}} bun x --no-install tsc -p '{{CONFIG}}' 2>&1 | Out-String; $status = $LASTEXITCODE; if ($status -ne 0) { if ($out -match 'TS18003') { Write-Output '{{CONFIG}}: no sources yet' } else { Write-Output $out; exit $status } }

# Fail when packages/ or tools/ name the scratch directory .tmp/ (tracked or untracked files).
[private]
[unix]
notmp:
    @if git grep --untracked -n -I -e '\.tmp/' -- packages tools; then echo "packages/ and tools/ must not read .tmp/"; exit 1; fi

[private]
[windows]
notmp:
    git grep --untracked -n -I -e '\.tmp/' -- packages tools; if ($LASTEXITCODE -eq 0) { Write-Error "packages/ and tools/ must not read .tmp/"; exit 1 }; exit 0

# display all the tsane (typescript quality enforcer) rules
tsane_rules *ARGS:
    {{TSANE_EXE}} rules {{ARGS}}
