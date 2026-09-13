import { describe, it, expect, vi, beforeEach } from "vitest";
import "../translator/registerAll.js";

const { execute, outbound } = vi.hoisted(() => ({ execute: vi.fn(), outbound: [] }));
vi.mock("../../open-sse/executors/index.js", () => ({
  getExecutor: () => ({ noAuth: true, execute }),
}));
vi.mock("../../open-sse/utils/requestLogger.js", () => ({
  createRequestLogger: async () => ({ logClientRawRequest() {}, logRawRequest() {}, logTargetRequest() {}, logProviderResponse() {}, logConvertedResponse() {}, logError() {} }),
}));
vi.mock("@/lib/usageDb.js", () => ({
  trackPendingRequest() {}, appendRequestLog: async () => {}, saveRequestDetail: async () => {},
}));
const { handleChatCore } = await import("../../open-sse/handlers/chatCore.js");

beforeEach(() => {
  outbound.length = 0;
  execute.mockImplementation(async ({ body }) => {
    outbound.push(structuredClone(body));
    return {
      response: new Response(JSON.stringify({ id: "test", object: "chat.completion", choices: [
        { index: 0, message: { role: "assistant", content: "ok" }, finish_reason: "stop" },
      ] }), { headers: { "content-type": "application/json" } }),
      url: "https://example.invalid/v1/chat/completions", headers: {}, transformedBody: body,
    };
  });
});

async function dispatch(options = {}) {
  const body = { model: "gpt-4o", stream: false, messages: [
    { role: "developer", content: "Keep required output format." },
    { role: "user", content: "The job may fail. Do not deploy." },
  ], tools: [{ type: "function", function: { name: "check", description: "Check without modifying files.", parameters: { type: "object", properties: {} } } }], response_format: { type: "json_object" } };
  const result = await handleChatCore({ body, modelInfo: { provider: "openai", model: "gpt-4o" },
    credentials: { apiKey: "test", providerSpecificData: {} }, connectionId: "test",
    loopGuardEnabled: false, log: { debug() {}, info() {}, warn() {} },
    clientRawRequest: { endpoint: "/v1/chat/completions", body, headers: {} }, ...options });
  expect(result.success).toBe(true);
  return outbound.at(-1);
}

const keys = ["plainEnglishEnabled", "steEnabled", "actionFirstEnabled"];
const markers = ["[Router: Plain English]", "[Router: STE-inspired]", "[Router: Action-first]"];
const text = body => JSON.stringify(body);

describe("independent writing plugins at provider dispatch", () => {
  it("injects all three defaults and retains task, tools and output schema", async () => {
    const body = await dispatch();
    for (const marker of markers) expect(text(body)).toContain(marker);
    expect(body.messages.find(m => m.role === "user").content).toBe("The job may fail. Do not deploy.");
    expect(body.messages[0].content).toContain("Keep required output format.");
    expect(body.tools[0].function.description).toBe("Check without modifying files.");
    expect(body.response_format).toEqual({ type: "json_object" });
  });
  for (const [index, key] of keys.entries()) {
    it(`disabling ${key} leaves the other two enabled`, async () => {
      const body = await dispatch({ [key]: false });
      markers.forEach((marker, i) => i === index ? expect(text(body)).not.toContain(marker) : expect(text(body)).toContain(marker));
    });
  }
  it("all new plugins off preserves original Caveman and Ponytail prompts", async () => {
    const { CAVEMAN_PROMPTS } = await import("../../open-sse/rtk/cavemanPrompts.js");
    const { PONYTAIL_PROMPTS } = await import("../../open-sse/rtk/ponytailPrompts.js");
    const body = await dispatch({ plainEnglishEnabled: false, steEnabled: false, actionFirstEnabled: false,
      cavemanEnabled: true, cavemanLevel: "full", ponytailEnabled: true, ponytailLevel: "lite" });
    const system = body.messages[0].content;
    expect(system).toContain(CAVEMAN_PROMPTS.full);
    expect(system).toContain(PONYTAIL_PROMPTS.lite);
    expect(system).not.toContain("[Router: Writing compatibility]");
    markers.forEach(marker => expect(system).not.toContain(marker));
  });
  it("adds compatibility only when multiple active styles need it", async () => {
    const body = await dispatch({ cavemanEnabled: true, cavemanLevel: "ultra", ponytailEnabled: true, ponytailLevel: "full" });
    expect(text(body)).toContain("[Router: Writing compatibility]");
    const alone = await dispatch({ steEnabled: false, actionFirstEnabled: false });
    expect(text(alone)).not.toContain("[Router: Writing compatibility]");
  });
  it("honors the existing per-request bypass for every writing plugin", async () => {
    const body = await dispatch({ cavemanEnabled: true, cavemanLevel: "full", ponytailEnabled: true, ponytailLevel: "full",
      clientRawRequest: { headers: { "x-9router-token-saver": "off" } } });
    expect(text(body)).not.toContain("[Router:");
    expect(text(body)).not.toContain("terse caveman");
    expect(text(body)).not.toContain("lazy senior developer");
  });
});

describe("writing plugin format coverage and retry deduplication", () => {
  const fixtures = [
    ["openai", { messages: [{ role: "system", content: [{ type: "text", text: "base" }] }, { role: "user", content: "Keep this task." }] }],
    ["openai-responses", { instructions: "base", input: "Keep this task." }],
    ["openai-responses", { input: [{ type: "message", role: "user", content: [{ type: "input_text", text: "Keep this task." }] }] }],
    ["claude", { system: [{ type: "text", text: "base", cache_control: { type: "ephemeral" } }], messages: [{ role: "user", content: "Keep this task." }] }],
    ["gemini", { systemInstruction: { parts: [{ text: "base" }] }, contents: [{ role: "user", parts: [{ text: "Keep this task." }] }] }],
    ["antigravity", { request: { contents: [{ role: "user", parts: [{ text: "Keep this task." }] }] } }],
    ["kiro", { conversationState: { currentMessage: { userInputMessage: { content: "Keep this task." } } } }],
  ];
  for (const [format, fixture] of fixtures) {
    it(`injects independent plugins once in ${format} ${Object.keys(fixture).join("/")}`, async () => {
      const { injectPlainEnglish } = await import("../../open-sse/rtk/plainEnglish.js");
      const { injectSte } = await import("../../open-sse/rtk/ste.js");
      const { injectActionFirst } = await import("../../open-sse/rtk/actionFirst.js");
      const { injectWritingCompatibility } = await import("../../open-sse/rtk/writingCompatibility.js");
      const body = structuredClone(fixture);
      const inject = () => {
        injectPlainEnglish(body, format); injectSte(body, format); injectActionFirst(body, format);
        injectWritingCompatibility(body, format, { plainEnglishEnabled: true, steEnabled: true, actionFirstEnabled: true, cavemanEnabled: true, ponytailEnabled: true });
      };
      inject();
      const first = structuredClone(body);
      inject();
      expect(body).toEqual(first);
      for (const marker of [...markers, "[Router: Writing compatibility]"]) expect(text(body)).toContain(marker);
      expect(text(body)).toContain("Keep this task.");
      if (format === "claude") expect(body.system.at(-1)).toEqual(fixture.system[0]);
    });
  }
});

describe("Kiro wire payload", () => {
  it("delivers writing instructions without a forbidden top-level systemPrompt", async () => {
    const { translateRequest } = await import("../../open-sse/translator/index.js");
    const { injectPlainEnglish } = await import("../../open-sse/rtk/plainEnglish.js");
    const { injectSte } = await import("../../open-sse/rtk/ste.js");
    const body = translateRequest("openai", "kiro", "claude-sonnet-4", {
      messages: [{ role: "system", content: "Original system." }, { role: "user", content: "Keep this task." }],
    }, false, {}, "kiro");
    expect(body).toBeTruthy();
    injectPlainEnglish(body, "kiro"); injectSte(body, "kiro");
    const wire = JSON.parse(JSON.stringify(body));
    expect(wire).not.toHaveProperty("systemPrompt");
    expect(text(wire)).toContain(markers[0]);
    expect(text(wire)).toContain(markers[1]);
    expect(text(wire).split(markers[0])).toHaveLength(2);
    expect(text(wire).split(markers[1])).toHaveLength(2);
    expect(text(wire)).toContain("Original system.");
    expect(text(wire)).toContain("Keep this task.");
    injectPlainEnglish(body, "kiro"); injectSte(body, "kiro");
    expect(JSON.parse(JSON.stringify(body))).toEqual(wire);
  });
});
