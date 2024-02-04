import { rollup } from "rollup";
import tsPlugin from "@rollup/plugin-typescript";
import path from "node:path";
const output = "dist";

const { write } = await rollup({
  input: ["./src/reporter.ts", "./src/vitest_tool.ts", "./src/bench.ts"],
  plugins: [
    tsPlugin({
      tslib: "none",

      compilerOptions: {
        target: "ES2022",
        module: "nodenext",
        declaration: true,
        declarationDir: "dist",
        rootDir: "./src",
      },
    }),
  ],

  external(id, importer, isResolved) {
    if (isResolved) return;
    if (id.startsWith(".") || id.startsWith("/")) return false;
    return true;
  },
});

console.log("rollup to " + output);
await write({
  dir: output,
  chunkFileNames: "[name].js",
  manualChunks(id, meta) {
    if (id === path.resolve("src/base/package.ts")) return "package";
  },
});
