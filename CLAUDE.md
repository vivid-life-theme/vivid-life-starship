# Vivid Life Theme — Starship

Starship (cross-shell prompt) port of the Vivid Life Theme design system (4 flavors × 6 variants = 24 themes, WCAG AA verified). Companion project to [vivid-life-fish](https://github.com/vivid-life-theme/vivid-life-fish) and [vivid-life-vs-code](https://github.com/vivid-life-theme/vivid-life-vs-code).

## Key Config Files

| File                                       | Purpose                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| `.claude/learnings.md`                     | Auto-collected corrections/observations from config skill runs              |
| `CLAUDE.md`                                | Project instructions, loaded every message                                  |
| `.claude/settings.json`                    | Permissions, hooks, environment variables                                   |
| `.claude/skills/vivid-life-theme/SKILL.md` | Fetches the design-system tokens/foundation for building themed artifacts   |
| `.githooks/pre-commit`                     | Runs `scripts/sync-config-table.sh` before each commit                      |
| `.github/workflows/claude-code-review.yml` | Auto-review on PR open/update                                               |
| `.github/workflows/claude.yml`             | `@claude` mention trigger in issues/PRs                                     |
| `.gitignore`                               | Git ignore patterns                                                         |
| `package.json`                             | npm scripts (`build`, `test`, `format`) and the design-system devDependency |
| `scripts/sync-config-table.sh`             | Keeps this Key Config Files table in sync with the filesystem               |

<!-- cc-config: last-optimize-run: 2026-08-26 6d59ff444b4e36b50e49403701a09058c9d32990 -->

## Commands

- `npm run build` — regenerate theme output from `@vivid-life-theme/design-system` (TODO: `build.mjs` not yet written)
- `npm test` — run `src/theme-template.test.mjs` (node:test) (TODO: not yet written)
- `npm run format` / `npm run format:check` — prettier

## Structure

- Two Starship config files per flavor×variant, mirroring https://draculatheme.com/starship: a colors-only palette file and a full custom-prompt config built on that palette. Exact file layout (`themes/` naming) is TODO — decide when building with the `vivid-life-theme` skill.

## References

Use the `vivid-life-theme` skill to fetch the design-system tokens (`tokens.json`) and system overview before writing any theme/palette definitions — do not hardcode colors from memory.

## Conventions

- 24 themes = 4 flavors × 6 variants. Keep flavor/variant naming consistent with the upstream design-system and the other ports (fish, VS Code).
- Each variant ships two Starship configs: colors-only palette, and the same palette applied to a custom prompt layout (same split Dracula offers at draculatheme.com/starship).

## Don't

- Don't commit secrets or credentials to git
- Don't use --force flags — fix the underlying issue instead
- Don't hardcode color values without pulling them from the design-system tokens via the `vivid-life-theme` skill

## Learnings

When the user corrects a mistake or points out a recurring issue, append a one-line
summary to .claude/learnings.md. Don't modify CLAUDE.md directly.

## Compact Instructions

When compacting, preserve: list of modified files, current test status, open TODOs, and key decisions made.
