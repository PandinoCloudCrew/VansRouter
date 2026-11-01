// The fork bundles its patched local Monaco instead of the upstream CDN build.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MONACO_VERSION } from "@/shared/constants/monaco.js";

const readJson = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const rootPkg = readJson("../../package.json");
// Read the manifest by path: monaco-editor's exports map may not expose ./package.json.
const installedVersion = (name) => readJson(`../../node_modules/${name}/package.json`).version;

describe("Monaco editor version pin", () => {
  it("matches the monaco-editor version installed from package.json", () => {
    expect(installedVersion("monaco-editor")).toBe(MONACO_VERSION);
    expect(rootPkg.dependencies["monaco-editor"]).toBe(`^${MONACO_VERSION}`);
  });

  it("loads the local editor with the patched sanitizer", () => {
    const page = readFileSync(new URL("../../src/app/(dashboard)/dashboard/translator/page.js", import.meta.url), "utf8");
    const editor = readFileSync(new URL("../../src/shared/components/TranslatorEditor.js", import.meta.url), "utf8");
    expect(page).toContain('import("@/shared/components/TranslatorEditor")');
    expect(editor).toContain("loader.config({ monaco })");
    expect(editor).toContain('"monaco-editor/editor/editor.api"');
    expect(readFileSync(new URL("../../node_modules/monaco-editor/esm/vs/base/browser/dompurify/dompurify.js", import.meta.url), "utf8"))
      .toBe(readFileSync(new URL("../../node_modules/dompurify/dist/purify.es.mjs", import.meta.url), "utf8"));
  });
});
