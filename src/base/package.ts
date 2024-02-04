import { fileURLToPath } from "node:url";
import path from "node:path";
/**
 * 这个模块需要编译到指定位置
 */
const filename = fileURLToPath(import.meta.url);
export const pkgRoot = path.resolve(filename, "../..");
