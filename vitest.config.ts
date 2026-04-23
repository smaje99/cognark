import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const rootPath = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@cognark\/module-documents\/(.*)$/,
        replacement: `${rootPath}modules/documents/$1`,
      },
      {
        find: "@cognark/module-documents",
        replacement: `${rootPath}modules/documents/index.ts`,
      },
      {
        find: /^@cognark\/module-logging\/(.*)$/,
        replacement: `${rootPath}modules/logging/$1`,
      },
      {
        find: "@cognark/module-logging",
        replacement: `${rootPath}modules/logging/index.ts`,
      },
      {
        find: /^@cognark\/module-persistence\/(.*)$/,
        replacement: `${rootPath}modules/persistence/$1`,
      },
      {
        find: "@cognark/module-persistence",
        replacement: `${rootPath}modules/persistence/index.ts`,
      },
      {
        find: /^@cognark\/module-session\/(.*)$/,
        replacement: `${rootPath}modules/session/$1`,
      },
      {
        find: "@cognark/module-session",
        replacement: `${rootPath}modules/session/index.ts`,
      },
      {
        find: /^@cognark\/module-workspace\/(.*)$/,
        replacement: `${rootPath}modules/workspace/$1`,
      },
      {
        find: "@cognark/module-workspace",
        replacement: `${rootPath}modules/workspace/index.ts`,
      },
      {
        find: "@cognark/shared-kernel",
        replacement: `${rootPath}packages/shared-kernel/src/index.ts`,
      },
    ],
  },
  test: {
    exclude: ["**/node_modules/**", "**/.git/**", "**/dist/**"],
  },
});
