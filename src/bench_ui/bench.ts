import { Bench, Options, TaskResult } from "tinybench";
import type { BenchmarkDataSet, DataSetItem, ReportJSON, ChartType } from "../reporter/type.js";
import { ReportUiServer } from "./server.js";
export * from "tinybench";
let benchInstance: BenchSeries | undefined;
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
export class BenchSeries extends Bench {
  constructor(readonly customMeta: CustomBench, opts?: Options) {
    super(opts);
  }
}
export function genBenchDataSet(
  benchList: BenchSeries[],
  opts: { title?: string; yName?: string; chartType?: ChartType } = {}
): BenchmarkDataSet {
  const gName = "groupName";
  const res: BenchmarkDataSet = {
    yName: opts.yName,
    title: opts.title ?? "Title",
    chartType: opts.chartType ?? "bar",
    rmeDataSet: [],
    dimensions: [gName],
    source: [],
  };
  const bench0 = benchList[0];
  if (!bench0) return res;
  for (const { name } of bench0.tasks) {
    res.dimensions.push(name);
  }

  for (const { customMeta, tasks } of benchList) {
    let source: DataSetItem = { [gName]: customMeta.groupName };
    let moeItem: DataSetItem = { [gName]: customMeta.groupName };
    for (const { result, name } of tasks) {
      if (!result) continue;
      source[name] = result.mean;
      moeItem[name] = result.rme;
    }
    res.source.push(source);
    res.rmeDataSet.push(moeItem);
  }
  return res;
}
export class LineSuite<T> {
  readonly benchList: BenchSeries[] = [];
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
      benchInstance = new BenchSeries({ groupName: group(data[i]) }, benchOpts);
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
    return genBenchDataSet(this.benchList, { chartType: this.chartType, yName: "ms", title: this.name });
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
