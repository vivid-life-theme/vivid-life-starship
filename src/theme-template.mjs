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
    "# Generated — do not edit by hand. Source: https://github.com/vivid-life-theme/vivid-life-starship",
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
$directory$git_branch$git_status$nodejs$python$rust$golang$java$docker_context$cmd_duration$fill$time
$character"""

[directory]
style = "bold accent"

[git_branch]
style = "fg_muted"

[git_status]
style = "danger"

[cmd_duration]
style = "warning"
format = "[$duration]($style) "

[fill]
style = "fg_muted"
symbol = " "

[time]
disabled = false
style = "fg_muted"
format = "[$time]($style)"

[character]
success_symbol = "[❯](accent)"
error_symbol = "[❯](danger)"

${langModules}`;
}
