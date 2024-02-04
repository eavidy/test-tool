import { ECharts, EChartsOption } from "echarts-comp";
import React, { useEffect, useMemo, useRef, useState } from "react";
export type CompareItem = {
  name: string;
  time: number;
  samples: number[];
};
export function SpeedCompare(props: {
  source: DataSetItem[];
  rmeDataSet: DataSetItem[];
  chartType?: "line" | "bar";
  dimensions: string[];
  title: string;
  yName?: string;
}) {
  const { source, dimensions, title, chartType = "bar", yName, rmeDataSet = [] } = props;
  const [base, setBase] = useState<string | undefined>();

  const ref = useRef<ECharts>(null);
  const compareChart = useMemo((): EChartsOption => {
    return {
      title: { text: title, left: "center" },
      tooltip: { show: true, trigger: "axis" },
      legend: { show: true, top: "30px" },
      xAxis: {
        type: "category",
      },
      yAxis: {
        type: "value",
        name: yName,
      },
      dataset: {
        dimensions: dimensions,
        source: source,
      },
      series: dimensions.slice(1).map((name) => {
        return {
          label: {
            show: true,
            formatter: (p: any) => {
              const i = p.dataIndex;
              const seriesName = p.seriesName;
              if (!seriesName) return "unknown";
              const mean = source[i];

              let label = "";
              if (base) label += mul(mean[seriesName] as number, mean[base] as number);

              const rme = rmeDataSet[i]?.[seriesName] as number;
              if (rme) label += ` (±${rme.toFixed(2)} %)`;
              return label;
            },
            position: "top",
          },
          type: chartType,
        };
      }),
    };
  }, [source, dimensions, rmeDataSet, base]);
  useEffect(() => {
    ref.current!.on("click", (e) => {
      const name = e.seriesName;
      if (!name) return;
      setBase((raw) => (raw === name ? undefined : name));
    });
  }, []);
  return (
    <div>
      <ECharts ref={ref} option={compareChart} style={{ width: "100%", height: 400 }} />
    </div>
  );
}
function mul(value: number, base: number) {
  return (base / value).toFixed(2) + ` X`;
}
export type DataSetItem = { [key: string]: number | string };
