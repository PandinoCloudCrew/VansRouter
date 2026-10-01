import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const readSource = (relativePath) =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
const base = readSource("../../open-sse/executors/base.js");
const defaultExecutor = readSource("../../open-sse/executors/default.js");

/**
 * base.execute() passes (credentials, stream, model, body) into buildHeaders, but
 * the base declaration only named two parameters, so subclasses reading slot 3 or
 * 4 were relying on an undocumented overload. The declaration now spells out the
 * full contract, and this test keeps the producer and the consumer in step.
 */
describe("executor buildHeaders contract", () => {
  it("base declares the same slots the default executor consumes", () => {
    expect(base).toMatch(
      /buildHeaders\(credentials, stream = true, model = null, body = null\)/,
    );
    expect(defaultExecutor).toMatch(
      /buildHeaders\(credentials, stream = true, model = null, body = null\)/,
    );
  });

  it("base passes the model and body through on the execute path", () => {
    expect(base).toContain("this.buildHeaders(credentials, stream, model, body)");
  });
});
