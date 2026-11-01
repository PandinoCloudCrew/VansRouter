import { afterEach, describe, expect, it, vi } from "vitest";
import { readBoundedJson } from "../../src/sse/utils/boundedBody.js";

const observedBytes = 17837120;
const mib = 1024 * 1024;
const request = (bytes) => new Request("http://localhost/api/v1/responses", {
  method: "POST",
  headers: { "content-type": "application/json", "content-length": String(bytes) },
  body: JSON.stringify({ input: "a".repeat(bytes - 12) }),
});

afterEach(() => vi.unstubAllEnvs());

describe("deployment JSON body limit", () => {
  it("reproduces the reported 15 MiB rejection", async () => {
    vi.stubEnv("VANSROUTER_MAX_BODY_BYTES", "");
    vi.stubEnv("NINEROUTER_MAX_BODY_BYTES", String(15 * mib));
    const { error } = await readBoundedJson(request(observedBytes));
    expect(error.status).toBe(413);
    expect((await error.json()).error.message).toBe(
      "Request body too large (17837120 bytes, limit 15728640). Raise NINEROUTER_MAX_BODY_BYTES to accept it."
    );
  });

  it.each(["VANSROUTER_MAX_BODY_BYTES", "NINEROUTER_MAX_BODY_BYTES"])(
    "accepts the reported body with %s set to 20 MiB",
    async (variable) => {
      vi.stubEnv("VANSROUTER_MAX_BODY_BYTES", "");
      vi.stubEnv("NINEROUTER_MAX_BODY_BYTES", "");
      vi.stubEnv(variable, String(20 * mib));
      const { body, bytes, error } = await readBoundedJson(request(observedBytes));
      expect(error).toBeUndefined();
      expect(bytes).toBe(observedBytes);
      expect(body.input.length).toBe(observedBytes - 12);
    }
  );

  it("keeps rejecting bodies above 20 MiB", async () => {
    vi.stubEnv("VANSROUTER_MAX_BODY_BYTES", String(20 * mib));
    const { error } = await readBoundedJson(request(20 * mib + 1));
    expect(error.status).toBe(413);
  });
});
