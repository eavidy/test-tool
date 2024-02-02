import { hrtimeNow, Bench, Options, TaskResult } from "tinybench";
import type { BenchmarkDataSet, DataSetItem, ReportJSON, ChartType } from "../reporter/type.js";
import { ReportUiServer } from "./server.js";
export * from "tinybench";
let benchInstance: LineBench | undefined;
export function bench(name: string, fn: Fn) {
  if (!benchInstance) return;
  benchInstance!.add(name, fn);
}
export function lineSuite<T = any>(
  name: string,
  data: T[],
  suiteFn: Fn,
  opts: Pick<Options, "time" | "iterations" | "now" | "warmupIterations" | "warmupTime"> & {
    type?: "line" | "bar";
    group?: (data: T) => string;
  } = {}
): LineSuite<T> {
  const suite = new LineSuite(name, data, suiteFn, opts);
  return suite;
}
interface CustomBench {
  groupName: string;
  chartType?: ChartType;
}
class LineBench extends Bench {
  constructor(readonly customMeta: CustomBench, opts?: Options) {
    super(opts);
  }
}
export class LineSuite<T> {
  readonly benchList: LineBench[] = [];
  private chartType: ChartType;
  constructor(
    readonly name: string,
    data: T[],
    suite: (data: T) => void,
    opts: Pick<Options, "time" | "iterations" | "now" | "warmupIterations" | "warmupTime"> & {
      type?: ChartType;
      group?: (data: T) => string;
    } = {}
  ) {
    const { type = "line", group = String, ...benchOpts } = opts;
    this.chartType = type;
    for (let i = 0; i < data.length; i++) {
      benchInstance = new LineBench({ groupName: group(data[i]) }, benchOpts);
      this.benchList[i] = benchInstance;
      suite(data[i]);
      benchInstance = undefined;
    }
  }
  async run() {
    for (const item of this.benchList) {
      await item.warmup();
      await item.run();
    }
    return this.genBenchDataSet(this, this.chartType, "ms");
  }
  private genBenchDataSet(benchList: LineSuite<any>, chartType: ChartType, yName?: string): BenchmarkDataSet {
    const gName = "groupName";
    const res: BenchmarkDataSet = { yName, title: benchList.name, chartType, dimensions: [gName], source: [] };
    const bench0 = benchList.benchList[0];
    if (!bench0) return res;
    for (const { name } of bench0.tasks) {
      res.dimensions.push(name);
    }

    for (const { customMeta, tasks } of benchList.benchList) {
      let source: DataSetItem = { [gName]: customMeta.groupName };
      for (const { result, name } of tasks) {
        if (!result) continue;
        source[name] = result.mean;
      }
      res.source.push(source);
    }
    return res;
  }
}
type Fn = (...args: any[]) => any;

export async function benchSuiteRunner(name: string, port: number, suites: LineSuite<unknown>[]) {
  let results: ReportJSON[0] = { file: name, suiteData: [] };
  for (const suite of suites) {
    let res = await suite.run();
    results.suiteData.push(res);
  }
  const server = new ReportUiServer();
  server.updateBenchResult(Buffer.from(JSON.stringify([results])));
  await server.listen(port);
  console.log("http://localhost:" + port);
  return server;
}
