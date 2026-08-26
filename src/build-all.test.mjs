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
