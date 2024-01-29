// @ts-check
import { rollup } from "rollup";
import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
const output = "dist/bench_ui/assets";
const inputDir = "src/bench_ui/assets";
// const fetchRes = await fetch("https://esm.sh/tslib@2/tslib.es6.mjs?raw");
// console.log("fetch ok");

/** @type  {ts.TranspileOptions["compilerOptions"] } */
const compilerOptions = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.React };
const { write } = await rollup({
  input: path.resolve(inputDir, "main.tsx"),
  plugins: [
    {
      name: "tsTranspile",
      transform(code, id) {
        if (id.endsWith(".ts") || id.endsWith("tsx")) {
          const res = ts.transpileModule(code, {
            compilerOptions: { ...compilerOptions, importHelpers: true, sourceMap: true },
          });
          if (res.diagnostics?.length) this.warn(res.diagnostics.join("\n"));
          return { code: res.outputText, map: res.sourceMapText };
        }
      },
    },
  ],

  external(id, importer, isResolved) {
    if (isResolved) return;
    if (id.startsWith(".") || id.startsWith("/")) return false;
    return true;
  },
});

const index = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="importmap" src="./import_map.json"></script>
    <script src="./main.js" type="module"></script>
  </body>
</html>
`;

const indexHtml = path.resolve(output, "index.html");
const importMap = path.resolve(output, "import_mpa.json");
console.log();
console.log(indexHtml);
console.log(importMap);
console.log();
await fs.mkdir(output, { recursive: true });
await Promise.all([
  fs.writeFile(indexHtml, index, { flag: "w+" }),
  fs.cp(path.resolve(inputDir, "import_map.json"), importMap),
]);

console.log("rollup to " + output);
await write({ dir: output });
