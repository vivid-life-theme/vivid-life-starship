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
