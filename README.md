# Vivid Life Theme — Starship

A multi-flavor color theme for the [Starship](https://starship.rs) cross-shell prompt. 4 flavors × 6 variants = 24 themes, each shipped as two configs — WCAG AA verified.

Companion project to [vivid-life-fish](https://github.com/vivid-life-theme/vivid-life-fish) and [vivid-life-vs-code](https://github.com/vivid-life-theme/vivid-life-vs-code), built on the [Vivid Life Theme design system](https://github.com/vivid-life-theme/vivid-life-design-system).

## Requirements

- [Starship](https://starship.rs/guide/#🚀-installation) installed and initialized in your shell.
- A [Nerd Font](https://www.nerdfonts.com/font-downloads) for the module icons to render. Recommended: **Atkinson Hyperlegible Mono Nerd Font** (matches the design system's own mono typeface).

## Choosing a theme

Every theme is named `vivid-life-<flavor>-<variant>`:

- **Flavors** (background): `midnight`, `twilight`, `dawn`, `noon`
- **Variants** (accent color): `red`, `orange`, `yellow`, `green`, `blue`, `purple`

Each theme ships as **two** files in [`themes/`](themes/), the same split [Dracula's Starship theme](https://draculatheme.com/starship) offers:

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

Or point `STARSHIP_CONFIG` at it without copying, e.g. in `~/.bashrc` / `~/.zshrc` / `~/.config/fish/config.fish`:

```bash
export STARSHIP_CONFIG=~/path/to/vivid-life-starship/themes/vivid-life-midnight-purple-custom.toml
```

## Development

- `npm install` — install the `@vivid-life-theme/design-system` foundation
- `npm run build` — regenerate `themes/*.toml` from the foundation tokens
- `npm test` — run the template/build test suite
- `npm run format` / `npm run format:check` — prettier

`themes/*.toml` is generated — never hand-edit. Edit `src/theme-template.mjs` and run `npm run build`.

## License

MIT — see [LICENSE](LICENSE).
