# Vivid Life Starship Theme Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate 48 Starship `.toml` theme files (2 per each of the 24 Vivid Life Theme flavor×variant combinations — a "colors only" recolor of Starship's stock modules, and a fixed "custom prompt" layout) from the `@vivid-life-theme/design-system` foundation tokens.

**Architecture:** Pure template functions in `src/theme-template.mjs` turn `(flavor, variant, tokens)` into TOML strings; `src/build-all.mjs` writes them to disk for a given output directory (testable with a temp dir); `build.mjs` is the thin CLI entry point that calls it against the real `themes/` directory.

**Tech Stack:** Node.js (`type: module`), `node:test` for tests, `@vivid-life-theme/design-system` (npm, `^0.6.0`, already a devDependency) for foundation tokens, no TOML library (hand-written string templates), prettier for formatting non-generated files.

**Spec:** `docs/superpowers/specs/2026-08-26-starship-theme-port-design.md`

## Global Constraints

- No TOML-serialization library dependency — all `.toml` content is built with JS template literals.
- Visual style is flat colored text + Nerd Font icons only — no powerline separators, no background-color blocks.
- Palette table scope is minimal: `bg`, `bg_soft`, `fg`, `fg_muted`, `accent`, `success`, `warning`, `danger`, `info`, plus all 6 variant hues (`red`, `orange`, `yellow`, `green`, `blue`, `purple`) — never the full syntax/ANSI token set.
- Fixed hue → language-module mapping for the custom-prompt variant (one hue per module, all 6 used exactly once): `nodejs`→green, `python`→yellow, `rust`→orange, `golang`→blue, `java`→red, `docker_context`→purple. Same mapping in every one of the 24 themes.
- Accent carriers (the only prompt elements using `palette.accent`, i.e. the thing that actually changes per variant): `directory` and `character`. Every other module uses a fixed hue or `fg_muted`.
- Colors-only variant restyles Starship's own stock/default module set only — never adds, removes, or reorders modules, and never sets a custom `format` string.
- Output file naming: `themes/vivid-life-<flavor>-<variant>.toml` (colors-only) and `themes/vivid-life-<flavor>-<variant>-custom.toml` (custom prompt). 48 files total, flat directory.
- No changes to the design-system foundation (`tokens.json`) — read-only dependency. A missing value is a foundation gap, not something to invent locally.
- `@vivid-life-theme/design-system` is imported as the package's default export (verified: `import tokens from "@vivid-life-theme/design-system"` yields the full parsed `tokens.json` object — `meta`, `palette`, `variant_hues`, `accent_shade`, `flavors`, `typography`, etc.).

---

## Task 1: Palette resolution + theme-template pure functions

**Files:**

- Create: `src/theme-template.mjs`
- Test: `src/theme-template.test.mjs`

**Interfaces:**

- Consumes: `tokens` object shaped like `@vivid-life-theme/design-system`'s default export (`tokens.flavors[flavor].surface.bg`, `.text.fg`, `.text.fg_muted`, `.semantic.{success,warning,danger,info}`; `tokens.palette[hue][shade]`; `tokens.accent_shade[flavor][hue]`; `tokens.variant_hues`).
- Produces (used by Task 2):
  - `export const FLAVORS = ["midnight", "twilight", "dawn", "noon"]`
  - `export const VARIANT_HUES = ["red", "orange", "yellow", "green", "blue", "purple"]`
  - `export const LANGUAGE_MODULE_HUE` — `{ nodejs: "green", python: "yellow", rust: "orange", golang: "blue", java: "red", docker_context: "purple" }`
  - `export function resolvePalette(flavor: string, variant: string, tokens: object): object` — returns `{ bg, bg_soft, fg, fg_muted, accent, success, warning, danger, info, red, orange, yellow, green, blue, purple }`, each value a `"#rrggbb"` string.
  - `export function buildColorsOnly(flavor: string, variant: string, tokens: object): string` — full `.toml` file content.
  - `export function buildCustomPrompt(flavor: string, variant: string, tokens: object): string` — full `.toml` file content.

- [ ] **Step 1: Write the failing test file**

Create `src/theme-template.test.mjs`:

```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import tokens from "@vivid-life-theme/design-system";
import {
  FLAVORS,
  VARIANT_HUES,
  LANGUAGE_MODULE_HUE,
  resolvePalette,
  buildColorsOnly,
  buildCustomPrompt,
} from "./theme-template.mjs";

// Module section names allowed in the colors-only output. Anything outside
// this set would mean we accidentally added/removed a stock Starship module.
const COLORS_ONLY_MODULES = [
  "directory",
  "git_branch",
  "git_status",
  "character",
  "nodejs",
  "python",
  "rust",
  "golang",
  "java",
  "docker_context",
];

function sectionNames(content) {
  const names = [];
  for (const line of content.split("\n")) {
    const m = line.match(/^\[([a-z_]+)\]$/);
    if (m) names.push(m[1]);
  }
  return names;
}

function parsePaletteTable(content) {
  const start = content.indexOf("[palettes.vivid_life]");
  assert.notEqual(start, -1, "missing [palettes.vivid_life] table");
  const afterHeader = content.slice(start + "[palettes.vivid_life]".length);
  const body = afterHeader.split(/\n\[/)[0];
  const palette = {};
  for (const line of body.split("\n")) {
    const m = line.match(/^(\w+) = "(#?\w+)"$/);
    if (m) palette[m[1]] = m[2];
  }
  return palette;
}

test("resolvePalette matches tokens.json for all 24 flavor x variant combinations", () => {
  for (const flavor of FLAVORS) {
    for (const variant of VARIANT_HUES) {
      const palette = resolvePalette(flavor, variant, tokens);
      const f = tokens.flavors[flavor];

      assert.equal(palette.bg, f.surface.bg, `${flavor}+${variant}: bg`);
      assert.equal(
        palette.bg_soft,
        f.surface.bg_soft,
        `${flavor}+${variant}: bg_soft`,
      );
      assert.equal(palette.fg, f.text.fg, `${flavor}+${variant}: fg`);
      assert.equal(
        palette.fg_muted,
        f.text.fg_muted,
        `${flavor}+${variant}: fg_muted`,
      );
      assert.equal(
        palette.success,
        f.semantic.success,
        `${flavor}+${variant}: success`,
      );
      assert.equal(
        palette.warning,
        f.semantic.warning,
        `${flavor}+${variant}: warning`,
      );
      assert.equal(
        palette.danger,
        f.semantic.danger,
        `${flavor}+${variant}: danger`,
      );
      assert.equal(palette.info, f.semantic.info, `${flavor}+${variant}: info`);

      const accentShade = tokens.accent_shade[flavor][variant];
      assert.equal(
        palette.accent,
        tokens.palette[variant][accentShade],
        `${flavor}+${variant}: accent`,
      );

      for (const hue of VARIANT_HUES) {
        const shade = tokens.accent_shade[flavor][hue];
        assert.equal(
          palette[hue],
          tokens.palette[hue][shade],
          `${flavor}+${variant}: hue ${hue}`,
        );
      }
    }
  }
});

test("buildColorsOnly emits a palette table matching resolvePalette, for every combination", () => {
  for (const flavor of FLAVORS) {
    for (const variant of VARIANT_HUES) {
      const content = buildColorsOnly(flavor, variant, tokens);
      const expected = resolvePalette(flavor, variant, tokens);
      const actual = parsePaletteTable(content);
      assert.deepEqual(actual, expected, `${flavor}+${variant}`);
      assert.match(content, /\npalette = "vivid_life"\n/);
    }
  }
});

test("buildColorsOnly only touches Starship's stock module set", () => {
  const content = buildColorsOnly("midnight", "purple", tokens);
  const names = sectionNames(content);
  for (const name of names) {
    assert.ok(
      COLORS_ONLY_MODULES.includes(name),
      `unexpected module section [${name}] in colors-only output`,
    );
  }
  assert.ok(
    !content.includes("\nformat ="),
    "colors-only must not set a custom format",
  );
});

test("buildCustomPrompt emits a palette table matching resolvePalette, for every combination", () => {
  for (const flavor of FLAVORS) {
    for (const variant of VARIANT_HUES) {
      const content = buildCustomPrompt(flavor, variant, tokens);
      const expected = resolvePalette(flavor, variant, tokens);
      const actual = parsePaletteTable(content);
      assert.deepEqual(actual, expected, `${flavor}+${variant}`);
    }
  }
});

test("buildCustomPrompt pins every language module to its documented fixed hue", () => {
  const content = buildCustomPrompt("dawn", "blue", tokens);
  for (const [mod, hue] of Object.entries(LANGUAGE_MODULE_HUE)) {
    const section = content.split(`[${mod}]`)[1];
    assert.ok(section, `missing [${mod}] section`);
    const styleLine = section.split("\n").find((l) => l.startsWith("style ="));
    assert.equal(styleLine, `style = "${hue}"`, `${mod} should use hue ${hue}`);
  }
});

test("buildCustomPrompt uses accent only for directory and character", () => {
  const content = buildCustomPrompt("noon", "green", tokens);
  const directorySection = content.split("[directory]")[1].split("\n\n")[0];
  assert.match(directorySection, /style = "bold accent"/);
  const characterSection = content.split("[character]")[1];
  assert.match(characterSection, /success_symbol = "\[❯\]\(accent\)"/);
  assert.match(characterSection, /error_symbol = "\[❯\]\(danger\)"/);

  for (const mod of ["git_branch", "git_status", "cmd_duration", "time"]) {
    const section = content.split(`[${mod}]`)[1].split("\n\n")[0];
    assert.ok(
      !section.includes("accent"),
      `${mod} should not reference accent in the custom prompt`,
    );
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm install && node --test src/theme-template.test.mjs`
Expected: FAIL — `Cannot find module './theme-template.mjs'`

- [ ] **Step 3: Write the implementation**

Create `src/theme-template.mjs`:

```javascript
// Maps Vivid Life foundation tokens to Starship `starship.toml` content.
// Two pure functions: (flavor, variant, tokens) -> file content string.
// Starship never sees the design system's full syntax/ANSI token set — only
// the prompt-relevant subset resolved here. See
// docs/superpowers/specs/2026-08-26-starship-theme-port-design.md.

export const FLAVORS = ["midnight", "twilight", "dawn", "noon"];
export const VARIANT_HUES = [
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
];

const FLAVOR_LABEL = {
  midnight: "Midnight",
  twilight: "Twilight",
  dawn: "Dawn",
  noon: "Noon",
};
const VARIANT_LABEL = {
  red: "Red",
  orange: "Orange",
  yellow: "Yellow",
  green: "Green",
  blue: "Blue",
  purple: "Purple",
};

// Fixed hue -> language/tool module mapping for the custom-prompt variant.
// One hue per module, all 6 hues used exactly once, same across all 24
// themes so the layout's "shape" stays identical when the variant changes.
export const LANGUAGE_MODULE_HUE = {
  nodejs: "green",
  python: "yellow",
  rust: "orange",
  golang: "blue",
  java: "red",
  docker_context: "purple",
};

function resolveHue(tokens, flavor, hue) {
  const shade = tokens.accent_shade[flavor][hue];
  return tokens.palette[hue][shade];
}

export function resolvePalette(flavor, variant, tokens) {
  const f = tokens.flavors[flavor];
  const palette = {
    bg: f.surface.bg,
    bg_soft: f.surface.bg_soft,
    fg: f.text.fg,
    fg_muted: f.text.fg_muted,
    accent: resolveHue(tokens, flavor, variant),
    success: f.semantic.success,
    warning: f.semantic.warning,
    danger: f.semantic.danger,
    info: f.semantic.info,
  };
  for (const hue of VARIANT_HUES) {
    palette[hue] = resolveHue(tokens, flavor, hue);
  }
  return palette;
}

function renderPaletteTable(palette) {
  const lines = Object.entries(palette).map(
    ([key, value]) => `${key} = "${value}"`,
  );
  return `[palettes.vivid_life]\n${lines.join("\n")}`;
}

function header(flavor, variant, kind) {
  return [
    `# Vivid Life Theme — ${FLAVOR_LABEL[flavor]} · ${VARIANT_LABEL[variant]} — ${kind}`,
    "# Generated — do not edit by hand. Source: https://github.com/MichaelvanLaar/vivid-life-starship",
    "# Requires a Nerd Font (recommended: Atkinson Hyperlegible Mono Nerd Font — https://www.nerdfonts.com/font-downloads)",
    "",
    "",
  ].join("\n");
}

export function buildColorsOnly(flavor, variant, tokens) {
  const palette = resolvePalette(flavor, variant, tokens);
  return `${header(flavor, variant, "colors only")}${renderPaletteTable(palette)}
palette = "vivid_life"

[directory]
style = "bold accent"

[git_branch]
style = "purple"

[git_status]
style = "danger"

[character]
success_symbol = "[❯](success)"
error_symbol = "[❯](danger)"

[nodejs]
style = "green"

[python]
style = "yellow"

[rust]
style = "orange"

[golang]
style = "blue"

[java]
style = "red"

[docker_context]
style = "purple"
`;
}

export function buildCustomPrompt(flavor, variant, tokens) {
  const palette = resolvePalette(flavor, variant, tokens);
  const langModules = Object.entries(LANGUAGE_MODULE_HUE)
    .map(
      ([mod, hue]) =>
        `[${mod}]\nstyle = "${hue}"\nformat = "[$symbol$version]($style) "\n`,
    )
    .join("\n");

  return `${header(flavor, variant, "custom prompt")}${renderPaletteTable(palette)}
palette = "vivid_life"

format = """
$directory$git_branch$git_status$nodejs$python$rust$golang$java$docker_context$cmd_duration
$character"""

right_format = """$time"""

[directory]
style = "bold accent"

[git_branch]
style = "fg_muted"

[git_status]
style = "danger"

[cmd_duration]
style = "warning"
format = "[$duration]($style) "

[time]
disabled = false
style = "fg_muted"
format = "[$time]($style)"

[character]
success_symbol = "[❯](accent)"
error_symbol = "[❯](danger)"

${langModules}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/theme-template.test.mjs`
Expected: PASS — all tests green (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/theme-template.mjs src/theme-template.test.mjs
git commit -m "$(cat <<'EOF'
✨ Add Starship theme-template pure functions

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: build-all + build.mjs CLI entry

**Files:**

- Create: `src/build-all.mjs`
- Create: `src/build-all.test.mjs`
- Create: `build.mjs`
- Modify: `package.json` (test script)

**Interfaces:**

- Consumes (from Task 1): `FLAVORS`, `VARIANT_HUES`, `buildColorsOnly`, `buildCustomPrompt` from `./theme-template.mjs`.
- Produces: `export function buildAll(outDir: string, tokens: object): number` — writes 48 `.toml` files into `outDir` (creating it if needed, clearing stale `.toml` files first), returns the count written.

- [ ] **Step 1: Write the failing test**

Create `src/build-all.test.mjs`:

```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import tokens from "@vivid-life-theme/design-system";
import { buildAll } from "./build-all.mjs";

test("buildAll writes 48 .toml files (24 themes x 2 kinds)", () => {
  const outDir = mkdtempSync(join(tmpdir(), "vivid-life-starship-"));
  try {
    const count = buildAll(outDir, tokens);
    assert.equal(count, 48);

    const files = readdirSync(outDir).filter((f) => f.endsWith(".toml"));
    assert.equal(files.length, 48);
    assert.ok(files.includes("vivid-life-midnight-purple.toml"));
    assert.ok(files.includes("vivid-life-midnight-purple-custom.toml"));
    assert.ok(files.includes("vivid-life-noon-red.toml"));
    assert.ok(files.includes("vivid-life-noon-red-custom.toml"));
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});

test("buildAll clears stale .toml files from a previous run", () => {
  const outDir = mkdtempSync(join(tmpdir(), "vivid-life-starship-"));
  try {
    buildAll(outDir, tokens);
    const firstRunFiles = readdirSync(outDir).filter((f) =>
      f.endsWith(".toml"),
    );
    assert.equal(firstRunFiles.length, 48);

    const count = buildAll(outDir, tokens);
    assert.equal(count, 48);
    const secondRunFiles = readdirSync(outDir).filter((f) =>
      f.endsWith(".toml"),
    );
    assert.equal(secondRunFiles.length, 48);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/build-all.test.mjs`
Expected: FAIL — `Cannot find module './build-all.mjs'`

- [ ] **Step 3: Write the implementation**

Create `src/build-all.mjs`:

```javascript
import { mkdirSync, writeFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import {
  FLAVORS,
  VARIANT_HUES,
  buildColorsOnly,
  buildCustomPrompt,
} from "./theme-template.mjs";

export function buildAll(outDir, tokens) {
  mkdirSync(outDir, { recursive: true });

  // Clean stale theme files so renames don't leave orphans.
  for (const file of readdirSync(outDir)) {
    if (file.endsWith(".toml")) {
      rmSync(join(outDir, file));
    }
  }

  let count = 0;
  for (const flavor of FLAVORS) {
    for (const variant of VARIANT_HUES) {
      writeFileSync(
        join(outDir, `vivid-life-${flavor}-${variant}.toml`),
        buildColorsOnly(flavor, variant, tokens),
        "utf8",
      );
      count++;

      writeFileSync(
        join(outDir, `vivid-life-${flavor}-${variant}-custom.toml`),
        buildCustomPrompt(flavor, variant, tokens),
        "utf8",
      );
      count++;
    }
  }
  return count;
}
```

Create `build.mjs` (project root):

```javascript
// Reads foundation tokens from @vivid-life-theme/design-system,
// emits 48 Starship .toml files (24 flavor x variant themes x 2 kinds)
// into themes/.

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import tokens from "@vivid-life-theme/design-system";

import { buildAll } from "./src/build-all.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const count = buildAll(join(__dirname, "themes"), tokens);

console.log(
  `Built ${count} theme files (4 flavors x 6 variants x 2 kinds) into themes/`,
);
```

Modify `package.json` — change the `test` script from running a single file to auto-discovering every `*.test.mjs` under `src/`:

```json
    "test": "node --test src/",
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/`
Expected: PASS — all tests from both `theme-template.test.mjs` and `build-all.test.mjs` green (8 tests total).

- [ ] **Step 5: Commit**

```bash
git add src/build-all.mjs src/build-all.test.mjs build.mjs package.json
git commit -m "$(cat <<'EOF'
✨ Add build-all + build.mjs CLI entry for Starship themes

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Generate and commit the 48 theme files

**Files:**

- Create: `themes/*.toml` (48 generated files, via `npm run build`)

**Interfaces:**

- Consumes: `build.mjs` and `src/build-all.mjs` from Task 2 (no code changes in this task — this task runs the build and commits its output).

- [ ] **Step 1: Run the build**

Run: `npm run build`
Expected output: `Built 48 theme files (4 flavors x 6 variants x 2 kinds) into themes/`

- [ ] **Step 2: Verify file count and spot-check content**

Run: `ls themes/*.toml | wc -l`
Expected: `48`

Run: `cat themes/vivid-life-midnight-purple.toml`
Expected: valid-looking TOML — `[palettes.vivid_life]` table with 15 keys, `palette = "vivid_life"`, module sections for `directory`, `git_branch`, `git_status`, `character`, and the 6 language/tool modules. `accent` should equal `tokens.palette.purple[300]` (`#d8b4fe`, per `accent_shade.midnight.purple = 300`).

Run: `cat themes/vivid-life-noon-red-custom.toml`
Expected: valid-looking TOML — two-line `format`, `right_format = """$time"""`, `[nodejs]` styled `green`, `[java]` styled `red`, `[docker_context]` styled `purple`, `[character]` symbols referencing `accent`/`danger`.

- [ ] **Step 3: Run full test suite once more against the real tokens**

Run: `npm test`
Expected: PASS — 8 tests green.

- [ ] **Step 4: Commit the generated themes**

```bash
git add themes/
git commit -m "$(cat <<'EOF'
✨ Generate 48 Starship theme files

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: README with install instructions

**Files:**

- Create: `README.md`

**Interfaces:**

- Consumes: nothing code-level — references the file-naming convention from Task 2/3 and the Nerd Font requirement already stated in the generated file headers (Task 1).

- [ ] **Step 1: Write README.md**

Create `README.md`:

````markdown
# Vivid Life Theme — Starship

A multi-flavor color theme for the [Starship](https://starship.rs)
cross-shell prompt. 4 flavors × 6 variants = 24 themes, each shipped as two
configs — WCAG AA verified.

Companion project to [vivid-life-fish](https://github.com/vivid-life-theme/vivid-life-fish)
and [vivid-life-vs-code](https://github.com/vivid-life-theme/vivid-life-vs-code),
built on the [Vivid Life Theme design system](https://github.com/vivid-life-theme/vivid-life-design-system).

## Requirements

- [Starship](https://starship.rs/guide/#🚀-installation) installed and
  initialized in your shell.
- A [Nerd Font](https://www.nerdfonts.com/font-downloads) for the module
  icons to render. Recommended: **Atkinson Hyperlegible Mono Nerd Font**
  (matches the design system's own mono typeface).

## Choosing a theme

Every theme is named `vivid-life-<flavor>-<variant>`:

- **Flavors** (background): `midnight`, `twilight`, `dawn`, `noon`
- **Variants** (accent color): `red`, `orange`, `yellow`, `green`, `blue`, `purple`

Each theme ships as **two** files in [`themes/`](themes/), the same split
[Dracula's Starship theme](https://draculatheme.com/starship) offers:

| File                                        | What it is                                                                                  |
| ------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `vivid-life-<flavor>-<variant>.toml`        | **Colors only** — Starship's own default modules, repainted with the theme's palette.       |
| `vivid-life-<flavor>-<variant>-custom.toml` | **Custom prompt** — a two-line, icon-rich layout (directory, git, language versions, time). |

For example, Midnight · Purple:

- Colors only: [`themes/vivid-life-midnight-purple.toml`](themes/vivid-life-midnight-purple.toml)
- Custom prompt: [`themes/vivid-life-midnight-purple-custom.toml`](themes/vivid-life-midnight-purple-custom.toml)

## Installing

Copy your chosen file to Starship's config location:

```bash
cp themes/vivid-life-midnight-purple.toml ~/.config/starship.toml
```
````

Or point `STARSHIP_CONFIG` at it without copying, e.g. in `~/.bashrc` /
`~/.zshrc` / `~/.config/fish/config.fish`:

```bash
export STARSHIP_CONFIG=~/path/to/vivid-life-starship/themes/vivid-life-midnight-purple-custom.toml
```

## Development

- `npm install` — install the `@vivid-life-theme/design-system` foundation
- `npm run build` — regenerate `themes/*.toml` from the foundation tokens
- `npm test` — run the template/build test suite
- `npm run format` / `npm run format:check` — prettier

`themes/*.toml` is generated — never hand-edit. Edit
`src/theme-template.mjs` and run `npm run build`.

## License

MIT — see [LICENSE](LICENSE).

````

- [ ] **Step 2: Verify links resolve to files that exist**

Run: `test -f themes/vivid-life-midnight-purple.toml && test -f themes/vivid-life-midnight-purple-custom.toml && echo OK`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "$(cat <<'EOF'
📝 Add README with install instructions

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
````

---

## Task 5: Final verification pass

**Files:** none created/modified — verification only.

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: PASS — 8 tests green, 0 failures.

- [ ] **Step 2: Rebuild from clean and confirm no diff**

Run: `npm run build && git status --short themes/`
Expected: no output (generated files are byte-identical to what's committed — confirms the build is deterministic).

- [ ] **Step 3: Check formatting**

Run: `npm run format:check`
Expected: PASS — no files would be reformatted. If it fails, run `npm run format`, review the diff, and commit.

- [ ] **Step 4: Update CLAUDE.md's Structure/Commands sections to drop the TODOs**

Read `CLAUDE.md`. Replace the `## Structure` section's TODO note and the
`## Commands` section's "not yet written" TODOs (added during initial repo
bootstrap) with the now-accurate state: `build.mjs` and
`src/theme-template.mjs` exist, `themes/` holds 48 generated files named
`vivid-life-<flavor>-<variant>[-custom].toml`.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "$(cat <<'EOF'
📝 Update CLAUDE.md now that the theme port is implemented

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```
