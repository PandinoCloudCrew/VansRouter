"use client";

import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor/editor/editor.api";
import "monaco-editor/language/json/monaco.contribution";

// Load the patched local editor and workers instead of the loader's CDN default.
self.MonacoEnvironment = {
  getWorker(_moduleId, label) {
    return label === "json"
      ? new Worker(new URL("monaco-editor/language/json/json.worker.js", import.meta.url))
      : new Worker(new URL("monaco-editor/editor/editor.worker.js", import.meta.url));
  },
};
loader.config({ monaco });

export default Editor;
