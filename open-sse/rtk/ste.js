import { injectSystemPrompt } from "./systemInject.js";
import { STE_PROMPT } from "./stePrompts.js";

export function injectSte(body, format) {
  injectSystemPrompt(body, format, STE_PROMPT);
}
