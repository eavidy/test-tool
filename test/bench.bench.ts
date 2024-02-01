import { bench, describe } from "vitest";
import { lineSuite } from "../src/vitest_tool";
lineSuite("xxx", [10, 30], function (ms) {
  bench("aa", async function () {
    await time(ms);
  });
});
lineSuite("xxx2", [10, 30], function (ms) {
  bench("aa", async function () {
    await time(ms);
  });
  bench("bb", async function () {
    await time(ms);
  });
});

function time(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
