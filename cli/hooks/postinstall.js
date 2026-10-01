#!/usr/bin/env node

<<<<<<< HEAD
// The published package must be able to start with its bundled sql.js fallback.
// Native better-sqlite3 and the optional tray are provisioned lazily by the CLI
// when the corresponding feature is actually used.
=======
// Postinstall: warm-up SQLite deps into ~/.9router/runtime so the first
// `9router` start doesn't need network. Failure here is non-fatal —
// cli.js will retry at runtime if anything is missing.
// `npx 9router …` (npm_command=exec) is typically a one-shot `connect` — skip
// the runtime warm-up; cli.js self-heals it if the server is started later.
if (process.env.npm_command === "exec") process.exit(0);

>>>>>>> 31704db7 (feat(cli): add connect command for remote 9router servers)
const { ensureSqliteRuntime } = require("./sqliteRuntime");

try {
  const result = ensureSqliteRuntime({ silent: false });
  if (!result?.sqlJs) {
    console.warn("[9router] SQLite runtime is not ready; the CLI will retry on first launch");
  } else {
    console.log("[9router] bundled SQLite fallback is ready");
  }
} catch (error) {
  console.warn(`[9router] SQLite runtime setup failed: ${error.message}`);
  console.warn("[9router] continuing installation; the CLI will retry on first launch");
}
