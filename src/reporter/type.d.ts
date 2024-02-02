export type ReportJSON = { file: string; suiteData: BenchmarkDataSet[] }[];

export type BenchmarkDataSet = {
  title: string;
  yName?: string;
  dimensions: string[];
  source: DataSetItem[];
  chartType?: ChartType;
};
export type DataSetItem = { [key: string]: number | string };

export type ChartType = "line" | "bar";
