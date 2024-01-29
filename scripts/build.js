import { rollup } from "rollup";
import esmTsPlugin from "@rollup/plugin-typescript";
const tsPlugin = esmTsPlugin;
const output = "dist";

// const fetchRes = await fetch("https://esm.sh/tslib@2/tslib.es6.mjs?raw");
// console.log("fetch ok");

const { write } = await rollup({
  input: ["./src/reporter.ts", "./src/vitest_tool.ts"],
  plugins: [
    tsPlugin({
      tslib: "none",
      compilerOptions: {
        target: "ES2022",
        module: "nodenext",
        declaration: true,
        declarationDir: "dist",
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
await write({ dir: output });
