export type ReportJSON = { file: string; suiteData: BenchmarkDataSet[] }[];

export type BenchmarkDataSet = {
  title: string;
  dimensions: string[];
  source: DataSetItem[];
};
export type DataSetItem = { [key: string]: number | string };
