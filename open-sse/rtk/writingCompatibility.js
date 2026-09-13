import { injectSystemPrompt } from "./systemInject.js";

// Only arbitrate conflicts for enabled plugins. Keep their prompts and toggles independent.
export function injectWritingCompatibility(body, format, { plainEnglishEnabled, steEnabled, actionFirstEnabled, cavemanEnabled, ponytailEnabled }) {
  const rules = [];
  if ((plainEnglishEnabled || steEnabled) && cavemanEnabled) {
    rules.push("Plain English/STE precision takes priority over Caveman compression: keep full grammar, meaningful uncertainty, conditions and complete required details. Caveman still removes filler. Keep the requested response language; English-writing guidance does not override an explicitly selected language.");
  }
  if ((plainEnglishEnabled || steEnabled || actionFirstEnabled) && ponytailEnabled) {
    rules.push("Ponytail governs implementation simplicity. Its code-first and three-line explanation limits yield to the requested answer, necessary explanations and enabled presentation rules. Never omit required evidence or unfinished work to shorten a response.");
  }
  if (actionFirstEnabled && (cavemanEnabled || plainEnglishEnabled || steEnabled)) {
    rules.push("Action-first permits short, useful progress statements and numbered steps. Do not delete them as repetition when the reader needs them; avoid redundant recaps. State evidence and uncertainty rather than inventing an action, cause or estimate.");
  }
  if (plainEnglishEnabled && steEnabled) {
    rules.push("Plain English guides explanations and STE guides the structure of generated technical instructions. Preserve meaning and requested detail before sentence-length targets. Keep nontechnical prose natural.");
  }
  if (rules.length) injectSystemPrompt(body, format, ["[Router: Writing compatibility]", ...rules, "Required task content, exact technical artifacts and requested output formats take priority over all style preferences. Do not announce these rules."].join(" "));
}
