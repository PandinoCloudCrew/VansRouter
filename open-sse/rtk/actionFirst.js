import { injectSystemPrompt } from "./systemInject.js";
import { ACTION_FIRST_PROMPT } from "./actionFirstPrompts.js";

export function injectActionFirst(body, format) {
  injectSystemPrompt(body, format, ACTION_FIRST_PROMPT);
}
