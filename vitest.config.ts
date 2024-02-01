import { defineConfig } from "vitest/config";

import { EChartsBenchmarkReporter } from "./src/reporter";

export default defineConfig({
  test: {
    benchmark: {
      reporters: [
        new EChartsBenchmarkReporter({
          server: {
            port: 8800,
          },
        }),
        "default",
      ],
    },
  },
});
