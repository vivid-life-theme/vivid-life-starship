# vivid-life-starship — theme port design

Status: approved by user, 2026-08-26.

## Purpose

Port the Vivid Life Theme design system (4 flavors × 6 variants = 24 WCAG-AA
themes) to [Starship](https://starship.rs), the cross-shell prompt. Follows
Pattern B ("theme port") from the `vivid-life-theme` Claude Code skill: read
the foundation's `tokens.json`, iterate `flavor × variant`, emit one native
config file per theme.

For each of the 24 themes, ship **two** Starship configs, mirroring the two
downloads at [draculatheme.com/starship](https://draculatheme.com/starship):

1. **Colors only** — Starship's own default module set/order, repainted with
   the theme's palette. A drop-in recolor for someone who already likes the
   stock prompt shape.
2. **Custom prompt** — one fixed, icon-rich, two-line layout (same structure
   across all 24 themes) that showcases the palette more fully.

48 generated `.toml` files total.

## Non-goals

- No changes to the design-system foundation itself (`tokens.json`). If a
  needed value is missing, that's a foundation gap — open an issue upstream,
  don't invent a value here.
- No support for shells other than what Starship itself already
  supports — this port only emits `starship.toml` content.
- No powerline / background-block styling. Flat colored text + Nerd Font
  icons only (matches Dracula's own Starship theme; works without a
  powerline-patched font).
- No attempt to keep the custom-prompt module list exhaustive. Six language
  modules (one per hue) is deliberate scope, not a gap.

## Architecture

```
vivid-life-starship/
  build.mjs                    Reads design-system tokens, iterates 24 x 2, writes themes/
  src/
    theme-template.mjs         Pure functions: buildColorsOnly(flavor, variant, tokens),
                                buildCustomPrompt(flavor, variant, tokens)
    theme-template.test.mjs    node:test — validates generated output
  themes/                      Generated output — never hand-edited
    vivid-life-<flavor>-<variant>.toml           Colors-only (24 files)
    vivid-life-<flavor>-<variant>-custom.toml    Custom prompt (24 files)
  README.md                    Install instructions per variant
```

- **Foundation source**: `@vivid-life-theme/design-system` (npm devDependency,
  already declared in `package.json`). `build.mjs` reads `tokens.json` /
  `dist/tokens.js` from it — never re-encodes palette or flavor data.
- **Generation**: hand-written JS template-literal functions in
  `theme-template.mjs`. No TOML-serialization library — the shape of a
  Starship config here is fixed and small enough that string templates give
  full control over comments/section order without adding a dependency.
- **Iteration**: `build.mjs` loops `flavors × variant_hues × {colorsOnly,
custom}`, calls the matching template function, writes to `themes/`.
- **Testing**: `node:test` against the pure template functions (no file I/O
  in tests) — see Testing section below.

## Palette table (per theme)

Every generated file starts with one `[palettes.vivid_life]` table, then
`palette = "vivid_life"` to select it. Scope is **minimal — prompt-relevant
only** (not the full syntax/ANSI token set, which Starship never consumes):

| Palette key                                               | Source in `tokens.json`                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bg`                                                      | `flavors.<flavor>.surface.bg`                                                                                                                                                                                                                                                                                                                 |
| `bg_soft`                                                 | `flavors.<flavor>.surface.bg_soft`                                                                                                                                                                                                                                                                                                            |
| `fg`                                                      | `flavors.<flavor>.text.fg`                                                                                                                                                                                                                                                                                                                    |
| `fg_muted`                                                | `flavors.<flavor>.text.fg_muted`                                                                                                                                                                                                                                                                                                              |
| `accent`                                                  | `palette[variant][accent_shade[flavor][variant]]`                                                                                                                                                                                                                                                                                             |
| `success` / `warning` / `danger` / `info`                 | `flavors.<flavor>.semantic.*`                                                                                                                                                                                                                                                                                                                 |
| `red` / `orange` / `yellow` / `green` / `blue` / `purple` | `palette[hue][accent_shade[flavor][hue]]` for each of the 6 `variant_hues`, at that flavor's resolved shade — i.e. every hue is resolved as if it were the accent, using the same accent-shade ruleset the foundation already defines. This keeps all 6 swatches WCAG AA against that flavor's `bg`, matching the foundation's own guarantee. |

`accent` is the one palette entry that changes with the variant; the 6 named
hues are present in every file regardless of variant (a theme's `accent` is
just whichever hue's slot the variant selected).

## Colors-only variant

Starship's stock default module set and order (as shipped by the `starship`
CLI used during development — `directory`, `git_branch`, `git_status`, the
language-version modules Starship enables by default, `character`, etc.;
confirm via `starship print-config` or the current Starship docs). We do not
add, remove, or reorder modules. Each module's `style` (and `format`, only where
needed to reference a palette color instead of a raw hex) is repointed at
`palette.*` keys:

- `directory` → `style = "bold accent"`
- `git_branch` → `style = "purple"` (kept close to Starship's own default
  purple, now theme-relative)
- `git_status` → `style = "danger"` (conflicts/dirty state reads as the
  theme's semantic danger color)
- `character` → success/danger swap on success/error exit code, using
  `palette.success` / `palette.danger`
- Any other stock module Starship enables by default → left at its default
  `style` key name, repainted to the nearest matching palette color (neutral
  modules → `fg_muted`)

## Custom-prompt variant

One fixed two-line layout, identical structure across all 24 themes,
repainted per theme:

```
Line 1: <directory> <git_branch><git_status>  <nodejs> <python> <rust> <golang> <java> <docker_context>  <cmd_duration>          <time, right-aligned>
Line 2: <character>
```

**Accent carriers** (visibly change when the variant changes): `directory`
and `character` use `palette.accent`. Everything else uses a fixed hue or a
neutral (`fg_muted`) — switching variant recolors the prompt without
reshuffling the whole layout.

**Fixed hue → language-module mapping** (same across all 24 themes; one hue
per module, all 6 hues used exactly once):

| Module           | Hue      |
| ---------------- | -------- |
| `nodejs`         | `green`  |
| `python`         | `yellow` |
| `rust`           | `orange` |
| `golang`         | `blue`   |
| `java`           | `red`    |
| `docker_context` | `purple` |

`git_branch` uses `fg_muted`; `git_status` uses `danger` (matches
colors-only, for consistency between the two variants' git-state signal);
`cmd_duration` uses `warning`; `time` uses `fg_muted`.

Icons: each module keeps Starship's own default symbol (already Nerd-Font
glyphs) — this port doesn't redesign iconography, per the foundation's own
stance of not shipping bespoke icon sets. README notes the Nerd Font
requirement (recommend `Atkinson Hyperlegible Mono Nerd Font`, per the
foundation's typography section) up front.

## Testing

`src/theme-template.test.mjs` (`node:test`, no file I/O):

- For every `flavor × variant`, both template functions return a string
  containing a `[palettes.vivid_life]` table and `palette = "vivid_life"`.
- Every hex value emitted in the palette table matches a value actually
  present in `tokens.json` for that flavor/variant (guards against
  hardcoding or drift from the foundation).
- Custom-prompt output contains all 6 language modules from the mapping
  table above, each pinned to its documented hue.
- Colors-only output contains no module keys beyond Starship's own stock
  default set (guards against accidentally adding modules to that variant).

`npm run build` writes all 48 files to `themes/`; not itself unit-tested
beyond confirming the directory has 48 `.toml` files after a build (a single
integration-style assertion in the test file, using a temp output dir rather
than the real `themes/`, so tests don't depend on `build.mjs` having already
run).

## README

Document, per the naming convention above, how to install each of the 48
configs (copy to `~/.config/starship.toml`, or reference via `STARSHIP_CONFIG`
env var), the Nerd Font requirement, and — like the sibling ports — a link
back to the `vivid-life-design-system` foundation repo.

## Open questions / follow-ups

None outstanding — all major decisions were confirmed during brainstorming
(palette scope, colors-only module policy, custom-prompt layout style, hue
mapping, accent carriers, file naming, generation approach).
