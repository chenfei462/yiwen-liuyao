import { describe, expect, test } from "vitest";

import {
  buildLearningExerciseProgress,
  buildCreatorExportPayload,
  defaultEvidenceExpansion,
  formatCreatorExportText,
  getDefaultCreatorSource,
  getDefaultLearningNodeId,
  getLearningNodeStatuses,
  learningPathNodes,
  learningPathSections,
  rollCoinsFromTosses,
  toggleEvidenceSection,
} from "./reading-workbench";

describe("rollCoinsFromTosses", () => {
  test("maps three coin tosses to all four liuyao line values", () => {
    expect(rollCoinsFromTosses([2, 2, 2])).toBe(6);
    expect(rollCoinsFromTosses([3, 2, 2])).toBe(7);
    expect(rollCoinsFromTosses([3, 3, 2])).toBe(8);
    expect(rollCoinsFromTosses([3, 3, 3])).toBe(9);
  });
});

describe("learning path helpers", () => {
  test("offers a multi-section course instead of a tiny starter checklist", () => {
    expect(learningPathSections).toHaveLength(5);
    expect(learningPathNodes).toHaveLength(30);
    expect(new Set(learningPathNodes.map((node) => node.sectionId))).toEqual(
      new Set(learningPathSections.map((section) => section.id)),
    );
    expect(learningPathNodes.every((node) => node.core && node.example && node.counterExample && node.practicePrompt)).toBe(
      true,
    );
  });

  test("selects the first node when there is no progress", () => {
    expect(getDefaultLearningNodeId(learningPathNodes, [])).toBe(learningPathNodes[0].id);
  });

  test("marks completed nodes from learning progress and advances current node", () => {
    const statuses = getLearningNodeStatuses(learningPathNodes, [
      { subject_id: learningPathNodes[0].id, subject_type: "exercise" },
      { subject_id: learningPathNodes[1].id, subject_type: "exercise" },
    ]);

    expect(statuses[learningPathNodes[0].id]).toBe("completed");
    expect(statuses[learningPathNodes[1].id]).toBe("completed");
    expect(statuses[learningPathNodes[2].id]).toBe("current");
    expect(statuses[learningPathNodes[3].id]).toBe("locked");
  });

  test("builds exercise progress payloads from the selected learning node", () => {
    expect(buildLearningExerciseProgress(learningPathNodes[0])).toEqual({
      subject_id: learningPathNodes[0].id,
      subject_type: "exercise",
      completed: true,
      badge: learningPathNodes[0].title,
      score: 100,
    });
  });
});

describe("creator material helpers", () => {
  const exportResult = {
    id: "creator_export_1",
    export_type: "article" as const,
    title: "案例素材 · 图文讲解",
    content_sections: ["开头", "证据", "反证", "结尾"],
    source_refs: ["source-a"],
    safety_notice: "仅用于学习复盘。",
  };

  test("chooses reading as the default source only when a reading exists", () => {
    expect(getDefaultCreatorSource(true, true)).toBe("reading");
    expect(getDefaultCreatorSource(false, true)).toBe("case");
    expect(getDefaultCreatorSource(false, false)).toBe("case");
  });

  test("builds creator export payloads with a single source", () => {
    expect(
      buildCreatorExportPayload({
        sourceType: "reading",
        readingId: "reading-1",
        caseId: "case-1",
        exportType: "short_video_script",
      }),
    ).toEqual({
      reading_id: "reading-1",
      export_type: "short_video_script",
    });

    expect(
      buildCreatorExportPayload({
        sourceType: "case",
        readingId: "reading-1",
        caseId: "case-1",
        exportType: "long_image",
      }),
    ).toEqual({
      case_id: "case-1",
      export_type: "long_image",
    });
  });

  test("formats creator exports with title, all sections, and safety notice", () => {
    expect(formatCreatorExportText(exportResult)).toBe(
      ["# 案例素材 · 图文讲解", "", "## 素材内容", "1. 开头", "2. 证据", "3. 反证", "4. 结尾", "", "## 安全提示", "仅用于学习复盘。"].join("\n"),
    );
  });
});

describe("evidence expansion helpers", () => {
  test("keeps every evidence section collapsed by default", () => {
    expect(defaultEvidenceExpansion).toEqual({
      keyEvidence: false,
      counterEvidence: false,
      actionTips: false,
    });
  });

  test("toggles a single evidence section without changing the others", () => {
    expect(toggleEvidenceSection(defaultEvidenceExpansion, "keyEvidence")).toEqual({
      keyEvidence: true,
      counterEvidence: false,
      actionTips: false,
    });
  });
});
