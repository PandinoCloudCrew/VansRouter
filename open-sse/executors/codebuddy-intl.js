import { DefaultExecutor } from "./default.js";
import {
  neutralizeCodeBuddyChannelIdentity,
  compactOversizedTools,
  captureRotatedToken,
  parseCodeBuddyError,
} from "./codebuddyShared.js";

const REQUIRED_SYSTEM_PROMPT = "You are CodeBuddy Code.";

/**
 * CodeBuddyIntlExecutor — talks to https://www.codebuddy.ai/v2/chat/completions
 *
 * Same OpenAI-compatible-but-stream-only gateway behavior as codebuddy-cn:
 * non-stream requests are rejected, and reasoning is surfaced only when the
 * request carries the IDE's OpenAI-style reasoning params. Force stream and
 * mirror reasoning_summary exactly like CodeBuddyExecutor.
 */
export class CodeBuddyIntlExecutor extends DefaultExecutor {
  constructor() {
    super("codebuddy-intl");
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
    const input = body && typeof body === "object" ? structuredClone(body) : body;
    const transformed = super.transformRequest(model, input, stream, credentials);
    transformed.stream = true;

    const eff = transformed.reasoning_effort;
    if (eff === "none" || eff === "off") {
      delete transformed.reasoning_effort;
    } else if (eff) {
      transformed.reasoning_summary = "auto";
    }

    // Neutralize third-party CLI identity markers (Claude Code, ZCode) to avoid 11128 WAF block
    const sanitizedMessages = neutralizeCodeBuddyChannelIdentity(transformed.messages);

    // CodeBuddy rejects plain OpenAI shape (11101 invalid request): needs a
    // leading system prompt + user content as typed blocks, not a bare string.
    const source = Array.isArray(sanitizedMessages) ? sanitizedMessages : [];
    const messages = [{ role: "system", content: REQUIRED_SYSTEM_PROMPT }];
    let requiredPromptSeen = false;
    for (const message of source) {
      if (!message || typeof message !== "object") continue;
      if (message.role === "system" && message.content === REQUIRED_SYSTEM_PROMPT) {
        if (requiredPromptSeen) continue;
        requiredPromptSeen = true;
        continue;
      }
      if (message.role === "user" && typeof message.content === "string") {
        messages.push({ ...message, content: [{ type: "text", text: message.content }] });
      } else {
        messages.push({ ...message });
      }
    }
    transformed.messages = messages;

    // Compact oversized tools if >64KB to avoid sensitive content rejection
    if (Array.isArray(transformed.tools) && transformed.tools.length > 0) {
      transformed.tools = compactOversizedTools(transformed.tools);
    }

    return transformed;
  }
}

export default CodeBuddyIntlExecutor;
