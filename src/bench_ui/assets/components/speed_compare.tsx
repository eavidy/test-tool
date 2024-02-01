import { ECharts, EChartsOption } from "echarts-comp";
import React, { useEffect, useMemo, useRef, useState } from "react";
export type CompareItem = {
  name: string;
  time: number;
  samples: number[];
};
export function SpeedCompare(props: {
  source: DataSetItem[];
  chartType?: "line" | "bar";
  dimensions: string[];
  title: string;
  yName?: string;
}) {
  const { source, dimensions, title, chartType = "bar", yName } = props;
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
            show: base ? name !== base : false,
            formatter: (p: any) => {
              const seriesName = p.seriesName;
              if (!seriesName || !base) return "unknown";
              const dataSetItem = source[p.dataIndex];
              let baseValue = dataSetItem[base] as number;
              let curentValue = dataSetItem[seriesName] as number;
              let speed = baseValue / curentValue;

              return speed.toFixed(2) + ` X`;
            },
            position: "top",
          },
          type: chartType,
        };
      }),
    };
  }, [source, dimensions, base]);
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

export type DataSetItem = { [key: string]: number | string };
