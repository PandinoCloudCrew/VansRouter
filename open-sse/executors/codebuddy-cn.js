import { DefaultExecutor } from "./default.js";
import {
  neutralizeCodeBuddyChannelIdentity,
  compactOversizedTools,
  captureRotatedToken,
  parseCodeBuddyError,
} from "./codebuddyShared.js";

/**
 * CodeBuddyExecutor — talks to https://copilot.tencent.com/v2/chat/completions
 *
 * CodeBuddy is OpenAI-compatible but rejects non-stream chat requests
 * (HTTP 400, code 11101 "Non-stream chat request is currently not supported").
 * The same-format (openai→openai) translator path leaves body.stream as the
 * client sent it, so we force it true here — 9router still re-aggregates the
 * SSE into a JSON response for non-streaming clients.
 */
export class CodeBuddyExecutor extends DefaultExecutor {
  constructor() {
    super("codebuddy-cn");
  }

  async execute(input) {
    const result = await super.execute(input);
    const resp = result instanceof Response ? result : result?.response;
    captureRotatedToken(resp, input.credentials);
    return result;
  }

  parseError(response, bodyText) {
    return parseCodeBuddyError(response, bodyText);
  }

  transformRequest(model, body, stream, credentials) {
    const transformed = super.transformRequest(model, body, stream, credentials);
    transformed.stream = true;

    // CodeBuddy only surfaces model reasoning when the request carries the CLI's
    // OpenAI-style params: reasoning_effort + reasoning_summary:"auto". 9router's
    // thinking pipeline sets reasoning_effort only when the client asks, and never
    // sets reasoning_summary — so reasoning never shows. Mirror the CLI here.
    const eff = transformed.reasoning_effort;
    if (eff === "none" || eff === "off") {
      delete transformed.reasoning_effort; // gateway has no "none" — just omit
    } else if (eff) {
      // Client explicitly asked for reasoning — mirror the CLI's reasoning_summary
      // so CodeBuddy surfaces the model's reasoning.
      transformed.reasoning_summary = "auto";
    }
    // No reasoning requested: leave both unset. Forcing reasoning_effort:"medium"
    // + reasoning_summary on plain requests makes CodeBuddy trip its content
    // filter and return an error (#2071).

    // Neutralize third-party CLI identity markers (Claude Code, ZCode) to avoid 11128 WAF block
    if (Array.isArray(transformed.messages)) {
      transformed.messages = neutralizeCodeBuddyChannelIdentity(transformed.messages);
    }

    // Compact oversized tools if >64KB to avoid sensitive content rejection
    if (Array.isArray(transformed.tools) && transformed.tools.length > 0) {
      transformed.tools = compactOversizedTools(transformed.tools);
    }

    return transformed;
  }
}

export default CodeBuddyExecutor;
