import { createServer } from "npm:vite";
import ts from "npm:typescript";
import denoJson from "./deno.json" assert { type: "json" };
class FindMap {
  private sub: Map<string, string> = new Map();
  private map: Map<string, string> = new Map();
  constructor(importMap: Record<string, string>) {
    for (const [k, v] of Object.entries(importMap)) {
      if (k.endsWith("/")) this.sub.set(k, v);
      else this.map.set(k, v);
    }
  }
  replace(src: string) {
    if (this.map.has(src)) return this.map.get(src);
    for (const [k, v] of this.sub) {
      if (src.startsWith(k)) return src.replace(k, v);
    }
  }
}

const maps = new FindMap(denoJson.imports as Record<string, string>);
const server = await createServer({
  plugins: [
    {
      name: "Deno-resolve",
      resolveId(src, importer, meta) {
        return maps.replace(src);
      },
      transformIndexHtml(html) {
        //虽然 resolveId 已转换，但依然要加上 importmap, 外部依赖可能会用
        return html.replace("<body>", `<body><script type="importmap">${JSON.stringify(denoJson)}</script>`);
      },
      transform(code, id, opts) {
        if (id.endsWith(".ts") || id.endsWith(".tsx")) {
          const { outputText, diagnostics, sourceMapText } = ts.transpileModule(code, {
            compilerOptions: {
              jsx: ts.JsxEmit.React,
              module: ts.ModuleKind.ESNext,
              moduleResolution: ts.ModuleResolutionKind.Bundler,
            },
          });
          if (diagnostics?.length) {
            this.warn(diagnostics.join("\n"));
          }

          return { code: outputText, map: sourceMapText };
        }
      },
    },
  ],
});

const port = 5173;
await server.listen(port);
console.log("http://localhost:" + port);
