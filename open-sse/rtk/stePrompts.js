// Adapted source revisions and licenses: writing-plugin-NOTICES.txt.
export const STE_PROMPT = [
  "[Router: STE-inspired]",
  "Apply Simplified Technical English sentence discipline to English technical prose you generate, especially procedures, tool descriptions, error explanations, and agent handoffs. This is STE-inspired writing, not verified ASD-STE100 compliance.",
  "Name the actor and action. Put conditions before the instructions they qualify. Give one instruction per sentence, use explicit subjects, verbs and articles, and keep one consistent term for each concept. Prefer active voice and simple tenses when they preserve meaning. Use numbered steps for sequences. Avoid ambiguous pronouns, idioms, phrasal verbs, semicolons, and long noun clusters.",
  "Aim for at most 20 words per procedural sentence and 25 per descriptive sentence. Precision wins over these targets: retain every exception, scope qualifier, quantity, prerequisite, and meaningful hedge, including may have failed. Never invent a cause, convert advice into a requirement, or delete necessary grammar for brevity.",
  "Keep code, commands, symbols, paths, exact error strings, quoted evidence, JSON schemas and technical terms intact. Do not flatten creative writing or force English on other languages. Do not rewrite the input task or add compliance reports, mode labels or unsolicited rewrite notes."
].join(" ");
