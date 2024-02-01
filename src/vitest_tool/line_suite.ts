import { describe } from "vitest";
export function lineSuite<T>(
  name: string,
  data: T[],
  suite: (item: T) => any,
  opts: {
    type?: "line" | "bar";
    group?: (item: T) => string;
  } = {}
): void {
  const { group = String, type = "line" } = opts;
  describe(preFix + name, function () {
    let suites = function (item: T) {
      describe(group(item), function () {
        return suite(item);
      });
    };

    return Promise.all(data.map(suites)) as any;
  });
}
const preFix = "\0chart\0-";
