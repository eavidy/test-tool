import { Server } from "node:http";
import fs from "node:fs/promises";
import { Buffer } from "node:buffer";
import path from "node:path";
import mime from "mime";
import { pkgRoot } from "#root/package.js";
const assetsDir = path.resolve(pkgRoot, "dist/bench_ui/assets");

export class ReportUiServer {
  private readonly server = new Server();
  constructor() {
    this.server.on("error", () => {});
    this.server.on("request", async (req, res) => {
      let url = req.url;

      if (url === "/") url = "./index.html";
      else url = "." + url;

      if (url === "./result.json") {
        res.writeHead(200, undefined, { "content-type": mime.getType("json")! });
        res.write(this.json);
        res.end();
        return;
      } else if (url) {
        const filename = path.resolve(assetsDir, url);
        try {
          const info = await fs.stat(filename);
          if (info.isFile()) {
            const mim = mime.getType(path.parse(filename).ext);
            const content = await fs.readFile(filename);
            res.writeHead(200, undefined, { "content-type": mim ?? "", "content-length": content.byteLength });
            res.write(content);
            res.end();
            return;
          }
        } catch (error) {}
      }
      res.writeHead(404);
      res.write(url);
      res.end();
    });
  }

  private json: Uint8Array = Buffer.from("[]");
  updateBenchResult(data: Uint8Array) {
    this.json = data;
  }
  async listen(port: number) {
    this.server.listen(port);
  }
  close() {
    return new Promise((resolve, reject) => {
      this.server.close(resolve);
    });
  }
}
