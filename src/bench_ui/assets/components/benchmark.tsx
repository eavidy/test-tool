import React, { useMemo, useState } from "react";
import { DataSetItem, SpeedCompare } from "./speed_compare.tsx";

async function getData() {
  const data = await getBenchmarkData();
  return data.map((item) => item.suiteData).flat();
}

export function BenchmarkPage() {
  const [data = [], setData] = useState<BenchmarkDataSet[] | undefined>();
  useMemo(() => {
    getData().then(setData);
  }, []);

  return (
    <div>
      {data.map((props) => {
        return <SpeedCompare {...props} />;
      })}
    </div>
  );
}
type ReportJSON = { file: string; suiteData: BenchmarkDataSet[] }[];
type BenchmarkDataSet = {
  title: string;
  yName?: string;
  chartType?: "line" | "bar";
  dimensions: string[];
  source: DataSetItem[];
  /** 误差 */
  rmeDataSet: DataSetItem[];
};

async function getBenchmarkData() {
  const resp = await fetch("result.json");
  const json: ReportJSON = await resp.json();
  return json;
}
