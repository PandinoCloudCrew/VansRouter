// cli-chat-proxy.grok.com refuses any client below 1.0.13 with HTTP 426 Upgrade
// Required (issue #153). The value is read once at import and can be overridden
// per deployment, because the gate moves with the upstream release, not with our
// credentials:
//
//   GROK_CLI_VERSION=1.4.2
//
// A malformed value is ignored (with a warning) rather than sent upstream, since
// the upstream compares it as a version and junk is refused exactly like an
// outdated one. Requires a process restart.
const DEFAULT_GROK_CLI_VERSION = "1.4.2";
const VERSION_RE = /^\d+(?:\.\d+){1,3}$/;
const requestedGrokCliVersion = (process.env.GROK_CLI_VERSION || "").trim();
if (requestedGrokCliVersion && !VERSION_RE.test(requestedGrokCliVersion)) {
  console.warn(
    `[grok-cli] ignoring GROK_CLI_VERSION="${requestedGrokCliVersion}" (expected e.g. 1.4.2)`,
  );
}
export const GROK_CLI_VERSION = VERSION_RE.test(requestedGrokCliVersion)
  ? requestedGrokCliVersion
  : DEFAULT_GROK_CLI_VERSION;
export const GROK_CLI_MODEL = "grok-build";
export const GROK_CLI_BASE_URL = "https://cli-chat-proxy.grok.com/v1";
export const GROK_CLI_CLIENT_IDENTIFIER = "grok-shell";
export const GROK_CLI_USER_AGENT = `grok-shell/${GROK_CLI_VERSION} (linux; x86_64)`;

export function supportsGrokCliReasoningEffort(model) {
  // ponytail: unknown models omit effort until live metadata reaches dispatch.
  return /^grok-4\.[56](?:$|-)/.test(String(model || ""));
}
