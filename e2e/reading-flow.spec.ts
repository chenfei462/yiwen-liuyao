import { expect, test } from "@playwright/test";

let failedApiResponses: string[] = [];

test.beforeEach(async ({ page }) => {
  failedApiResponses = [];
  page.on("response", (response) => {
    const url = response.url();
    if (!url.includes("/api/")) return;
    const status = response.status();
    if (status >= 400 && status !== 422) {
      failedApiResponses.push(`${status} ${url}`);
    }
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "易问六爻" })).toBeVisible();
  await page.evaluate(() => window.localStorage.clear());
  await page.waitForLoadState("networkidle");
  await expect
    .poll(() => failedApiResponses, { message: "API responses should be 200 or expected 422" })
    .toEqual([]);
});

test.afterEach(async () => {
  expect(failedApiResponses, "API responses should be 200 or expected 422").toEqual([]);
});

test("time cast completes to chart, AI controls, share, favorite, tags, and history delete confirmation", async ({ context, page }) => {
  const rawQuestion = "今天用时间起卦看看项目复盘重点";
  let readingId: string | null = null;
  page.on("response", async (response) => {
    if (!response.url().includes("/api/readings/cast") || response.status() !== 200) return;
    const payload = (await response.json()) as { reading_id?: string };
    readingId = payload.reading_id ?? null;
  });
  await expect(page.getByLabel("解读方式")).toHaveValue("light");
  await expect(page.getByRole("option", { name: "大白话" })).toBeAttached();
  await page.getByLabel("你的问题").fill(rawQuestion);
  await page.getByRole("button", { name: /时间起卦/ }).click();
  await expect(page.getByText("时间起卦 · 轻量体验")).toBeVisible();

  await page.getByRole("button", { name: "开始排盘" }).click();
  await expect(page.getByText("结果速览")).toBeVisible();
  await expect(page.getByText("用神", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "AI 解读" })).toBeVisible();
  await expect(page.getByRole("button", { name: "大白话" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "为什么取这个用神" })).toBeEnabled({ timeout: 30_000 });
  await page.getByRole("button", { name: "学习版" }).click();
  await page.getByRole("button", { name: "为什么取这个用神" }).click();
  await expect(page.getByText("为什么取这个用神？")).toBeVisible();
  await expect.poll(() => readingId).not.toBeNull();
  if (readingId === null) {
    throw new Error("reading_id was not captured from cast response");
  }
  const resolvedReadingId = readingId;

  const shareResponse = await page.request.post("/api/readings/share", {
    data: {
      reading_id: resolvedReadingId,
      visibility: "public_anonymous",
      include_ai_summary: true,
      include_evidence: true,
    },
  });
  expect(shareResponse.ok()).toBe(true);
  const sharePayload = (await shareResponse.json()) as { share_id: string; share_url: string; card_payload: { question_preview: string } };
  expect(sharePayload.share_url).toMatch(/^\/share\/share_/);
  expect(sharePayload.card_payload.question_preview).toBe("问题已脱敏");
  const publicSharePage = await context.newPage();
  await publicSharePage.goto(sharePayload.share_url);
  await expect(publicSharePage.getByText("易问六爻公开学习卡")).toBeVisible();
  await expect(publicSharePage.locator("body")).not.toContainText(rawQuestion);
  await publicSharePage.close();

  const favoriteResponse = await page.request.post("/api/readings/favorite", {
    data: { reading_id: resolvedReadingId, favorite: true },
  });
  expect(favoriteResponse.ok()).toBe(true);
  const tagsResponse = await page.request.post("/api/readings/tags", {
    data: { reading_id: resolvedReadingId, tags: ["复盘", "时间起卦"] },
  });
  expect(tagsResponse.ok()).toBe(true);
  const progressResponse = await page.request.get("/api/me/progress");
  const progressPayload = (await progressResponse.json()) as { favorites: string[]; tags: Record<string, string[]> };
  expect(progressPayload.favorites).toContain(resolvedReadingId);
  expect(progressPayload.tags[resolvedReadingId]).toEqual(["复盘", "时间起卦"]);

  await page.getByRole("button", { name: "历史" }).click();
  await page.getByLabel("删除历史记录").first().click();
  await expect(page.getByRole("alertdialog")).toContainText("确认删除这条历史记录？");
  await page.getByRole("button", { name: "取消" }).click();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await page.getByLabel("删除历史记录").first().click();
  await page.getByRole("button", { name: "确认删除" }).click();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
});

test("coin cast requires six shakes and manual cast can submit immediately", async ({ page }) => {
  await expect(page.getByRole("button", { name: "开始排盘" })).toBeDisabled();
  for (let index = 0; index < 6; index += 1) {
    await page.getByRole("button", { name: "摇一爻" }).click();
  }
  await expect(page.getByRole("button", { name: "开始排盘" })).toBeEnabled();

  await page.getByRole("button", { name: /手动输入/ }).click();
  await expect(page.getByRole("button", { name: "开始排盘" })).toBeEnabled();
  await page.getByRole("button", { name: "开始排盘" }).click();
  await expect(page.getByText("结果速览")).toBeVisible();
});

test("high-risk question is blocked before chart generation", async ({ page }) => {
  await page.getByLabel("你的问题").fill("我应该把全部积蓄买哪只股票才能稳赚");
  await page.getByRole("button", { name: /时间起卦/ }).click();
  await page.getByRole("button", { name: "开始排盘" }).click();
  await expect(page.getByText("高风险问题已拦截")).toBeVisible();
});

test("module navigation exposes learning, cases, community, privacy, and sandbox operations", async ({ page }) => {
  await page.getByRole("button", { name: "学习", exact: true }).click();
  await expect(page.getByRole("button", { name: "学习", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "继续学习" })).toBeVisible();
  await page.getByRole("button", { name: "案例", exact: true }).click();
  await expect(page.getByRole("button", { name: "案例", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "社区", exact: true }).click();
  await expect(page.getByRole("button", { name: "社区", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "注册 Web 设备" }).click();
  await page.getByRole("button", { name: "导入结构化样例" }).click();
  await page.getByRole("button", { name: "隐私设置", exact: true }).click();
  await expect(page.getByRole("button", { name: "隐私设置", exact: true })).toHaveAttribute("aria-pressed", "true");
  const privacyResponse = await page.request.post("/api/me/privacy-settings", {
    data: {
      save_history: false,
      allow_personalization: false,
      allow_sensitive_review: true,
      retain_history_days: 30,
      export_format: "json",
    },
  });
  expect(privacyResponse.ok()).toBe(true);
  const exportResponse = await page.request.post("/api/me/data-export");
  expect(exportResponse.ok()).toBe(true);
  const exportPayload = (await exportResponse.json()) as {
    export_job: {
      status: string;
      export_format: string;
      includes_raw_question_text: boolean;
      includes_private_followups: boolean;
    };
  };
  expect(exportPayload.export_job).toMatchObject({
    status: "completed",
    export_format: "json",
    includes_raw_question_text: false,
    includes_private_followups: false,
  });
});
