import { fileURLToPath } from "node:url";
import path from "node:path";
const filename = fileURLToPath(import.meta.url);
export const pkgRoot = path.resolve(filename, "..");
