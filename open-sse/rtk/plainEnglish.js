import { injectSystemPrompt } from "./systemInject.js";
import { PLAIN_ENGLISH_PROMPT } from "./plainEnglishPrompts.js";

export function injectPlainEnglish(body, format) {
  injectSystemPrompt(body, format, PLAIN_ENGLISH_PROMPT);
}
