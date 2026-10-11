# Vivid Life Theme — Starship

A multi-flavor color theme for the [Starship](https://starship.rs) cross-shell prompt. **4 flavors × 6 variants = 24 themes**, each shipped as two configs, all WCAG AA verified. Generated from the [Vivid Life design-system foundation](https://github.com/vivid-life-theme/vivid-life-design-system): colors and contrast ratios come from a single source of truth. To boldly prompt where no prompt has prompted before, but legibly.

## Flavors

In time-of-day order:

| Flavor       | Type  |
| ------------ | ----- |
| **Midnight** | dark  |
| **Twilight** | dark  |
| **Dawn**     | light |
| **Noon**     | light |

Starship draws on top of whatever background your terminal has, so pair it with a matching terminal port such as [Windows Terminal](https://github.com/vivid-life-theme/vivid-life-windows-terminal) or [Xfce Terminal](https://github.com/vivid-life-theme/vivid-life-xfce4-terminal). Midnight prompt on a Noon terminal works about as well as you'd expect.

## Variants

Each flavor comes in six accent variants: **Red · Orange · Yellow · Green · Blue · Purple**. The variant re-tints the accent (the directory, plus the prompt character in the custom layout); status and language colors stay put across variants.

## Requirements

- [Starship](https://starship.rs/guide/#🚀-installation), installed and initialized in your shell.
- A [Nerd Font](https://www.nerdfonts.com/font-downloads), or the module icons render as a row of tofu boxes. Recommended: **Atkinson Hyperlegible Mono Nerd Font**, the Nerd Font build of the design system's own mono typeface.

## Install

Every theme is named `vivid-life-<flavor>-<variant>` and ships as **two** files in [`themes/`](themes/), the same split [Dracula's Starship theme](https://draculatheme.com/starship) offers:

| File                                        | What it is                                                                                 |
| ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `vivid-life-<flavor>-<variant>.toml`        | **Colors only**: Starship's own default modules, repainted with the theme's palette.       |
| `vivid-life-<flavor>-<variant>-custom.toml` | **Custom prompt**: a two-line, icon-rich layout (directory, git, language versions, time). |

Clone the repo, then copy your pick to Starship's config location:

```bash
git clone https://github.com/vivid-life-theme/vivid-life-starship.git
mkdir -p ~/.config
cp vivid-life-starship/themes/vivid-life-midnight-purple.toml ~/.config/starship.toml
```

Heads-up: that `cp` replaces your existing `starship.toml`. Back it up first if it holds three years of lovingly tuned config.

Or point `STARSHIP_CONFIG` at a theme file without copying, e.g. in `~/.bashrc` / `~/.zshrc`:

```bash
export STARSHIP_CONFIG=~/path/to/vivid-life-starship/themes/vivid-life-midnight-purple-custom.toml
```

Fish users put this in `~/.config/fish/config.fish` instead:

```fish
set -gx STARSHIP_CONFIG ~/path/to/vivid-life-starship/themes/vivid-life-midnight-purple-custom.toml
```

Either way, replace `~/path/to` with wherever you cloned the repo.

### Choose a theme

Default: **Midnight · Purple** (`vivid-life-midnight-purple`), matching the design system's overall default. For example:

- Colors only: [`themes/vivid-life-midnight-purple.toml`](themes/vivid-life-midnight-purple.toml)
- Custom prompt: [`themes/vivid-life-midnight-purple-custom.toml`](themes/vivid-life-midnight-purple-custom.toml)

## Recommended companion

**Font:** [Atkinson Hyperlegible Mono Nerd Font](https://www.nerdfonts.com/font-downloads) (see Requirements; this one isn't optional if you like seeing icons).

Your shell can join in too: [fish](https://github.com/vivid-life-theme/vivid-life-fish) and [PowerShell](https://github.com/vivid-life-theme/vivid-life-powershell) have matching syntax-highlighting themes. The rest of the family lives at [github.com/vivid-life-theme](https://github.com/vivid-life-theme).

## Contributing

```bash
npm install
npm run build   # regenerate themes/*.toml from the design-system tokens
npm test        # run the template/build test suite
npm run format  # prettier
```

Edit `src/theme-template.mjs` to change how foundation tokens map to the Starship palette and layout. Never hand-edit files under `themes/`: they're generated, and the next build will flatten your changes faster than you can type `git blame`.

If you need a color or token that isn't in the foundation, that's a foundation gap. Open an issue against [vivid-life-design-system](https://github.com/vivid-life-theme/vivid-life-design-system) rather than papering over it here.

## License

MIT. See [LICENSE](LICENSE).
