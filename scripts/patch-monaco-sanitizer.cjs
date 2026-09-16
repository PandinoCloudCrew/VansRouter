const fs = require("node:fs");
const path = require("node:path");

// ponytail: replace Monaco's private sanitizer until upstream vendors the patched version.
// Keep a separate instance: Monaco installs hooks that must not affect the changelog.
fs.copyFileSync(
  path.join(path.dirname(require.resolve("dompurify")), "purify.es.mjs"),
  path.join(path.dirname(require.resolve("monaco-editor/package.json")), "esm/vs/base/browser/dompurify/dompurify.js")
);
