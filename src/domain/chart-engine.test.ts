import { describe, expect, test } from "vitest";
import { castChart } from "./chart-engine";

describe("castChart", () => {
  test("casts a static all-yang chart as Qian palace with traceable line details", () => {
    const chart = castChart({
      lineValues: [7, 7, 7, 7, 7, 7],
      dayGanzhi: "甲子",
    });

    expect(chart.base_chart).toMatchObject({
      name: "乾为天",
      palace: "乾",
      shi_line: 6,
      ying_line: 3,
      xunkong: ["戌", "亥"],
    });
    expect(chart.changed_chart.name).toBe("乾为天");
    expect(chart.lines[0]).toMatchObject({
      line_no: 1,
      value: 7,
      yin_yang: "yang",
      moving: false,
      stem: "甲",
      branch: "子",
      element: "水",
      liuqin: "子孙",
      liushen: "青龙",
    });
  });

  test("flips moving old yin lines into the changed chart", () => {
    const chart = castChart({
      lineValues: [6, 7, 7, 7, 7, 7],
      dayGanzhi: "甲子",
    });

    expect(chart.base_chart.name).toBe("天风姤");
    expect(chart.changed_chart.name).toBe("乾为天");
    expect(chart.lines[0]).toMatchObject({
      line_no: 1,
      value: 6,
      yin_yang: "yin",
      moving: true,
      changed_yin_yang: "yang",
    });
  });

  test("rejects manual charts that do not contain exactly six bottom-to-top line values", () => {
    expect(() =>
      castChart({
        lineValues: [7, 7, 7, 7, 7],
        dayGanzhi: "甲子",
      }),
    ).toThrow("exactly six");
  });
});
