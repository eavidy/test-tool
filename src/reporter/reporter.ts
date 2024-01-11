import type { File, Suite, Task } from "vitest";
import { BenchmarkReportsMap } from "vitest/reporters";
import { BenchmarkDataSet, DataSetItem, ReportJSON } from "./type.js";
import path from "node:path";
/** 每个测试的数据 */
interface TargetData {
  testName: string;
  mean: number;
}

function genTargetData(task: Task): TargetData | null {
  const benchmark = task.result?.benchmark;
  if (task.type !== "custom" || !benchmark) return null;
  return { mean: benchmark.mean, testName: task.name };
}
function genGroupData(suite: Suite, nameKey: string, dimensions: Set<string>): DataSetItem {
  const series: DataSetItem = { [nameKey]: suite.name };
  for (const subTask of suite.tasks) {
    const data = genTargetData(subTask);
    if (!data) continue;
    dimensions.add(subTask.name);
    series[data.testName] = data.mean;
  }
  return series;
}

const prefix = "\0line\0-";
export default class CustomJsonReporter extends BenchmarkReportsMap.json {
  async logTasks(files: File[]): Promise<void> {
    let fileDataList: ReportJSON = [];
    for (const file of files) {
      const fileData: BenchmarkDataSet[] = [];
      for (const suite of this.findLineSuite(file)) {
        fileData.push(this.genSuiteData(suite));
      }
      this.ctx.config.root;
      if (fileData.length) {
        const relPath = path.relative(this.ctx.config.root, file.filepath);
        fileDataList.push({ file: relPath, suiteData: fileData });
      }
    }
    const str = JSON.stringify(fileDataList);
    await this.writeReport(str);
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

    const directSuite: DataSetItem = { [groupNameKey]: name };
    let directlyNested = 0;

    for (const task of suite.tasks) {
      if (task.type === "suite") {
        source.push(genGroupData(task, groupNameKey, dimensions));
      } else if (task.type === "test") {
        const data = genTargetData(task);
        if (!data) continue;
        directlyNested++;
        dimensions.add(data.testName);
        directSuite[data.testName] = data.mean;
      }
    }
    if (directlyNested) source.push(directSuite);
    return { dimensions: Array.from(dimensions), source, title: name };
  }
}
