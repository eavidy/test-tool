import { rollup } from "rollup";
import tsPlugin from "@rollup/plugin-typescript";
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
      },
      include: ["./src/**", "./*.js"],
    }),
  ],

  external(id, importer, isResolved) {
    if (isResolved) return;
    if (id.startsWith(".") || id.startsWith("/")) return false;
    return true;
  },
});

console.log("rollup to " + output);
await write({ dir: output, chunkFileNames: "[name].js" });
