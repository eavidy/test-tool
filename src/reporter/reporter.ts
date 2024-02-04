import type { File, Reporter, Suite, Task, Vitest } from "vitest";
import { BenchmarkDataSet, DataSetItem, ReportJSON } from "./type.js";
import path from "node:path";
import { ReportUiServer } from "../bench.js";
/** 每个测试的数据 */
interface TargetData {
  testName: string;
  mean: number;
  rme: number;
}

function genTargetData(task: Task): TargetData | null {
  const benchmark = task.result?.benchmark;
  if (task.type !== "custom" || !benchmark) return null;
  return { mean: benchmark.mean, testName: task.name, rme: benchmark.rme };
}
function genGroupData(suite: Suite, nameKey: string, dimensions: Set<string>) {
  const mean: DataSetItem = { [nameKey]: suite.name };
  const rmeDataSet: DataSetItem = { [nameKey]: suite.name };
  for (const subTask of suite.tasks) {
    const data = genTargetData(subTask);
    if (!data) continue;
    dimensions.add(subTask.name);
    mean[data.testName] = data.mean;
    rmeDataSet[data.testName] = data.rme;
  }
  return { mean, rme: rmeDataSet };
}

const prefix = "\0chart\0-";
export class EChartsBenchmarkReporter implements Reporter {
  constructor(private config: { writeJson?: string; server?: { port: number } } = {}) {
    this.server = new ReportUiServer();
  }
  async onFinished(files: File[] = []): Promise<void> {
    const fileDataList = this.genReportJSON(files!);
    const data = Buffer.from(JSON.stringify(fileDataList));
    this.server.updateBenchResult(data);
    this.logServerAddress();
  }

  private server: ReportUiServer;
  private ctx?: Vitest;
  async onInit(ctx: Vitest) {
    this.ctx = ctx;
    const serverConfig = this.config.server;
    if (serverConfig) await this.server.listen(serverConfig.port);
  }
  private logServerAddress() {
    const serverConfig = this.config.server;
    if (serverConfig)
      console.log("Open the browser to view the benchmark results: http://localhost:" + serverConfig.port);
  }
  protected genReportJSON(files: File[]) {
    let fileDataList: ReportJSON = [];
    for (const file of files) {
      const fileData: BenchmarkDataSet[] = [];
      for (const suite of this.findLineSuite(file)) {
        fileData.push(this.genSuiteData(suite));
      }
      const root = this.ctx?.config.root;
      if (fileData.length) {
        const relPath = root ? path.relative(root, file.filepath) : file.filepath;
        fileDataList.push({ file: relPath, suiteData: fileData });
      }
    }
    return fileDataList;
  }
  private *findLineSuite(file: File): Generator<Suite> {
    for (const task of file.tasks) {
      if (task.type !== "suite") continue;

      if (task.name.startsWith(prefix)) {
        yield task;
      }
    }
  }
  private genSuiteData(suite: Suite): BenchmarkDataSet {
    const name = suite.name.slice(prefix.length);
    const dimensions = new Set<string>();
    const groupNameKey = "groupName";
    dimensions.add(groupNameKey);
    const source: DataSetItem[] = [];
    const rmeList: DataSetItem[] = [];

    const directSuite: DataSetItem = { [groupNameKey]: name };
    let directlyNested = 0;

    for (const task of suite.tasks) {
      if (task.type === "suite") {
        const { mean, rme } = genGroupData(task, groupNameKey, dimensions);
        source.push(mean);
        rmeList.push(rme);
      } else if (task.type === "custom") {
        const data = genTargetData(task);
        if (!data) continue;
        directlyNested++;
        dimensions.add(data.testName);
        directSuite[data.testName] = data.mean;
      }
    }
    if (directlyNested) source.push(directSuite);
    return { dimensions: Array.from(dimensions), source, title: name, rmeDataSet: rmeList };
  }
}
