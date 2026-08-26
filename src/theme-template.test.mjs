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
    // Only match actual color entries (hex or valid hue names), not config keys like "palette"
    const m = line.match(
      /^(bg|bg_soft|fg|fg_muted|accent|success|warning|danger|info|red|orange|yellow|green|blue|purple) = "(#[0-9a-f]{6})"$/,
    );
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

      // Positional guard: palette = "vivid_life" must come before the first module table
      const paletteKeyIndex = content.indexOf('\npalette = "vivid_life"\n');
      const firstModuleTableIndex = content.indexOf("\n[directory]");
      assert.ok(
        paletteKeyIndex > 0 && paletteKeyIndex < firstModuleTableIndex,
        `${flavor}+${variant}: palette = "vivid_life" must appear before the first module table`,
      );
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

      // Positional guard: palette = "vivid_life" must come before the format string
      const paletteKeyIndex = content.indexOf('\npalette = "vivid_life"\n');
      const formatIndex = content.indexOf('\nformat = """');
      assert.ok(
        paletteKeyIndex > 0 && paletteKeyIndex < formatIndex,
        `${flavor}+${variant}: palette = "vivid_life" must appear before the format string`,
      );
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
