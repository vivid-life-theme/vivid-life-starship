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
