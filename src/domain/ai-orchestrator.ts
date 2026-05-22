import { AiReadingOutputSchema, type AiReadingOutput, type ExplainMode, type FollowupType, type Scenario } from "./contracts";
import type { CastChartResult } from "./chart-engine";
import { searchKnowledgeCards, type KnowledgeCard } from "./knowledge-base";
import type { RuleAnalysisResult } from "./rule-engine";
import type { SafetyClassification } from "./safety";

export type AiStreamEvent =
  | { type: "safety"; data: SafetyClassification }
  | { type: "retrieval"; data: { cards: KnowledgeCard[] } }
  | { type: "delta"; data: { field: keyof Pick<AiReadingOutput, "summary" | "key_evidence" | "counter_evidence" | "action_tips" | "safety_notice">; text: string } }
  | { type: "final"; data: AiReadingOutput }
  | { type: "error"; data: { error: string } };

export type AiProviderInput = {
  question: string;
  scenario: Scenario;
  mode: ExplainMode;
  analysis: RuleAnalysisResult;
  chart?: CastChartResult;
  knowledgeCards: KnowledgeCard[];
  followup?: {
    message: string;
    type: FollowupType;
  };
};

export type AiProvider = {
  generate(input: AiProviderInput): Promise<AiReadingOutput>;
};

const BANNED_PROMISE_TERMS = ["必然", "保证", "包准", "改命", "消灾", "一定复合", "一定发财", "诊断", "投资建议"];
let dailyCallDate = "";
let dailyCallCount = 0;

export async function explainWithAi(input: AiProviderInput, provider = getDefaultAiProvider()): Promise<AiStreamEvent[]> {
  if (input.analysis.safety_status.status === "blocked") {
    return [
      { type: "safety", data: input.analysis.safety_status },
      { type: "final", data: buildBlockedOutput(input.analysis.safety_status) },
    ];
  }
  if (input.analysis.evidence_tree.length === 0) {
    throw new Error("AI explanation requires evidence_tree");
  }

  const evidenceRuleIds = input.analysis.evidence_tree.map((node) => node.rule_id);
  const knowledgeCards = input.knowledgeCards.length > 0
    ? input.knowledgeCards
    : searchKnowledgeCards({
        scenario: input.scenario,
        evidence_rule_ids: evidenceRuleIds,
        term: input.followup?.message,
        limit: 6,
      });
  assertAiInputBudget(input, knowledgeCards);
  assertDailyCallLimit();
  if (input.followup?.type && input.followup.type !== "free_text") {
    const deterministicOutput = buildDeterministicFollowupOutput({
      ...input,
      knowledgeCards,
    });
    validateAiOutputSafety(deterministicOutput);
    return [
      { type: "safety", data: input.analysis.safety_status },
      { type: "retrieval", data: { cards: knowledgeCards } },
      { type: "delta", data: { field: "summary", text: deterministicOutput.summary } },
      { type: "delta", data: { field: "key_evidence", text: deterministicOutput.key_evidence.map((item) => item.plain_explanation).join("\n") } },
      { type: "delta", data: { field: "counter_evidence", text: deterministicOutput.counter_evidence.join("\n") } },
      { type: "delta", data: { field: "action_tips", text: deterministicOutput.action_tips.join("\n") } },
      { type: "delta", data: { field: "safety_notice", text: deterministicOutput.safety_notice } },
      { type: "final", data: deterministicOutput },
    ];
  }
  const output = AiReadingOutputSchema.parse(
    await withAiTimeout(
      provider.generate({
        ...input,
        knowledgeCards,
      }),
      getNumberEnv("AI_STREAM_TIMEOUT_MS", 20_000),
    ),
  );
  validateAiOutputSafety(output);

  return [
    { type: "safety", data: input.analysis.safety_status },
    { type: "retrieval", data: { cards: knowledgeCards } },
    { type: "delta", data: { field: "summary", text: output.summary } },
    { type: "delta", data: { field: "key_evidence", text: output.key_evidence.map((item) => item.plain_explanation).join("\n") } },
    { type: "delta", data: { field: "counter_evidence", text: output.counter_evidence.join("\n") } },
    { type: "delta", data: { field: "action_tips", text: output.action_tips.join("\n") } },
    { type: "delta", data: { field: "safety_notice", text: output.safety_notice } },
    { type: "final", data: output },
  ];
}

function assertAiInputBudget(input: AiProviderInput, knowledgeCards: KnowledgeCard[]): void {
  const maxTokens = getNumberEnv("AI_MAX_INPUT_TOKENS", 0);
  if (maxTokens <= 0) return;
  const estimatedTokens = Math.ceil(
    JSON.stringify({
      question: input.question,
      scenario: input.scenario,
      evidence_tree: input.analysis.evidence_tree,
      counter_evidence: input.analysis.counter_evidence,
      knowledge_cards: knowledgeCards,
      followup: input.followup,
    }).length / 4,
  );
  if (estimatedTokens > maxTokens) {
    throw new Error(`AI input budget exceeded: ${estimatedTokens}/${maxTokens}`);
  }
}

function assertDailyCallLimit(): void {
  const maxCalls = getNumberEnv("AI_MAX_DAILY_CALLS", 0);
  if (maxCalls <= 0) return;
  const today = new Date().toISOString().slice(0, 10);
  if (dailyCallDate !== today) {
    dailyCallDate = today;
    dailyCallCount = 0;
  }
  if (dailyCallCount >= maxCalls) {
    throw new Error("AI daily call limit exceeded");
  }
  dailyCallCount += 1;
}

async function withAiTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  if (timeoutMs <= 0) return promise;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("AI request timed out")), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function getNumberEnv(name: string, fallback: number): number {
  const parsed = Number(process.env[name] ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getDefaultAiProvider(): AiProvider {
  if (process.env.AI_PROVIDER === "deepseek") {
    return new OpenRouterProvider({
      providerName: "deepseek",
      apiKeyEnv: "DEEPSEEK_API_KEY",
      modelEnv: "DEEPSEEK_MODEL",
      defaultModel: "deepseek-v4-flash",
      url: `${(process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com").replace(/\/$/, "")}/chat/completions`,
      proxyUrl: process.env.DEEPSEEK_PROXY_URL ?? process.env.HTTPS_PROXY ?? process.env.HTTP_PROXY,
    });
  }
  if (process.env.AI_PROVIDER === "openrouter") {
    return new OpenRouterProvider({
      providerName: "openrouter",
      apiKeyEnv: "OPENROUTER_API_KEY",
      modelEnv: "OPENROUTER_MODEL",
      defaultModel: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
      url: "https://openrouter.ai/api/v1/chat/completions",
      proxyUrl: process.env.OPENROUTER_PROXY_URL ?? process.env.HTTPS_PROXY ?? process.env.HTTP_PROXY,
      extraHeaders: {
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL ?? "http://127.0.0.1:5500",
        "X-Title": process.env.OPENROUTER_APP_NAME ?? "Yiwen Liuyao",
      },
    });
  }
  if (process.env.OPENAI_API_KEY && process.env.NODE_ENV !== "test" && process.env.AI_PROVIDER !== "fake") {
    return new OpenAiResponsesProvider();
  }
  return new FakeAiProvider();
}

export function validateAiOutputSafety(output: AiReadingOutput): void {
  const content = JSON.stringify(output);
  const banned = BANNED_PROMISE_TERMS.find((term) => content.includes(term));
  if (banned) {
    throw new Error(`AI output failed safety validation: banned term ${banned}`);
  }
}

function buildBlockedOutput(safety: SafetyClassification): AiReadingOutput {
  return {
    summary: safety.notice,
    key_evidence: [{ evidence_id: "safety:block", plain_explanation: safety.notice }],
    counter_evidence: ["该问题属于高风险范围，不进入 AI 解读。"],
    action_tips: ["请优先咨询现实中的专业人士或可信赖支持渠道。"],
    safety_notice: safety.notice,
    knowledge_card_refs: ["kc-B-YS-001-18"],
    model_metadata: {
      provider: "safety",
      model: "deterministic-guardrail",
      generated_at: new Date().toISOString(),
    },
  };
}

class FakeAiProvider implements AiProvider {
  async generate(input: AiProviderInput): Promise<AiReadingOutput> {
    const firstEvidence = selectPrimaryEvidence(input);
    const cardRefs = input.knowledgeCards.slice(0, 3).map((card) => card.id);
    const summary = process.env.AI_FAKE_UNSAFE_OUTPUT === "true"
      ? "这件事一定发财，结果必然很好。"
      : buildFakeSummary(input, firstEvidence);
    const keyEvidence = buildKeyEvidence(input, firstEvidence);

    return {
      summary,
      key_evidence: keyEvidence,
      counter_evidence:
        input.analysis.counter_evidence.length > 0
          ? input.analysis.counter_evidence.map((node) => buildFakeCounterEvidence(input, node))
          : [buildDefaultCounterEvidence(input)],
      action_tips: buildFakeActionTips(input),
      safety_notice: input.analysis.safety_notice,
      knowledge_card_refs: cardRefs.length > 0 ? cardRefs : ["kc-B-YS-001-01"],
      model_metadata: {
        provider: "fake",
        model: "fake-beta-0.8",
        generated_at: new Date().toISOString(),
      },
    };
  }
}

function selectPrimaryEvidence(input: AiProviderInput): RuleAnalysisResult["evidence_tree"][number] {
  const [firstEvidence] = input.analysis.evidence_tree;
  if (!firstEvidence) {
    throw new Error("AI explanation requires evidence_tree");
  }
  if (["why_yongshen", "key_rule", "learning_mode"].includes(input.followup?.type ?? "")) {
    return input.analysis.evidence_tree.find((node) => node.rule_id === "B-YS-001") ?? firstEvidence;
  }
  if (input.scenario !== "考试") {
    return input.analysis.evidence_tree.find((node) => node.rule_id === "B-YS-001") ?? firstEvidence;
  }
  return firstEvidence;
}

function buildDeterministicFollowupOutput(input: AiProviderInput): AiReadingOutput {
  const primary = selectPrimaryEvidence(input);
  const counter = input.analysis.counter_evidence[0];
  const timing =
    input.analysis.evidence_tree.find((node) => ["B-WR-001", "B-HC-001", "B-DV-001"].includes(node.rule_id)) ??
    primary;
  const summary =
    input.followup?.type === "why_yongshen"
      ? `为什么取这个用神：只看当前证据树，${primary.rule_id}「${primary.title}」给出的依据是：${primary.premise}${primary.conclusion}`
      : input.followup?.type === "key_rule"
        ? `当前最关键的规则是 ${primary.rule_id}「${primary.title}」：${primary.conclusion}`
        : input.followup?.type === "counter_evidence"
          ? counter
            ? `当前反证看 ${counter.rule_id}「${counter.title}」：${counter.conclusion}`
            : "当前证据树没有强反证，但这不等于可以下确定结论。"
          : input.followup?.type === "timing"
            ? `应期只能作辅助线索，当前可参考 ${timing.rule_id}「${timing.title}」：${timing.conclusion}`
            : input.followup?.type === "learning_mode"
              ? `学习拆法：先看 ${primary.rule_id} 定主线，再看反证与行动提示；不要跳出当前卦盘编新爻位。`
              : `${primary.conclusion}`;

  return {
    summary,
    key_evidence: [{
      evidence_id: primary.id,
      plain_explanation: `${primary.rule_id}｜${primary.title}：${primary.premise}${primary.conclusion}`,
    }],
    counter_evidence:
      input.analysis.counter_evidence.length > 0
        ? input.analysis.counter_evidence.map((node) => `${node.rule_id}｜${node.title}：${node.conclusion}`)
        : ["当前证据树未给出强反证，仍需保留现实不确定性。"],
    action_tips: input.analysis.action_tips,
    safety_notice: input.analysis.safety_notice,
    knowledge_card_refs: input.knowledgeCards.slice(0, 3).map((card) => card.id),
    model_metadata: {
      provider: "rules",
      model: "deterministic-followup",
      generated_at: new Date().toISOString(),
    },
  };
}

function buildFakeSummary(input: AiProviderInput, firstEvidence: RuleAnalysisResult["evidence_tree"][number]): string {
  const storyPrefix = input.mode === "story" ? "从卦象叙事看，" : "";
  const counterEvidence = input.analysis.counter_evidence[0];
  const timingEvidence =
    input.analysis.evidence_tree.find((node) => ["B-WR-001", "B-HC-001", "B-DV-001"].includes(node.rule_id)) ??
    firstEvidence;

  switch (input.followup?.type) {
    case "why_yongshen":
      return `${storyPrefix}用神问题要先看 ${firstEvidence.rule_id}：${firstEvidence.conclusion} 这条线索是在帮你确认本卦先抓哪条主线。`;
    case "key_rule":
      return `${storyPrefix}最重要的规则是 ${firstEvidence.rule_id}，因为它先定观察主线：${firstEvidence.conclusion}`;
    case "counter_evidence":
      return counterEvidence
        ? `${storyPrefix}反证重点看 ${counterEvidence.rule_id}：${counterEvidence.conclusion} 它提醒这件事不能只按顺向证据理解。`
        : `${storyPrefix}当前证据树没有给出强反证，但这不代表能下确定结论，仍要保留现实里的变化空间。`;
    case "timing":
      return `${storyPrefix}应期只能当作时间线索看，当前可参考 ${timingEvidence.rule_id}：${timingEvidence.conclusion}`;
    case "learning_mode":
      return `${storyPrefix}学习拆法是：先用 ${firstEvidence.rule_id} 找主线，再看反证和行动提示，不把单条规则当成确定预测。`;
    case "free_text":
      return `${storyPrefix}针对“${input.followup.message}”，只能回到证据树回答：${firstEvidence.conclusion}`;
    default:
      return buildModeSummary(input, firstEvidence);
  }
}

function buildModeSummary(input: AiProviderInput, firstEvidence: RuleAnalysisResult["evidence_tree"][number]): string {
  const examNarrative = buildExamNarrative(input);
  if (examNarrative) {
    switch (input.mode) {
      case "light":
        return examNarrative.lightSummary;
      case "professional":
        return examNarrative.professionalSummary;
      case "learning":
        return examNarrative.learningSummary;
      case "story":
        return examNarrative.storySummary;
      default: {
        const _exhaustive: never = input.mode;
        return _exhaustive;
      }
    }
  }

  switch (input.mode) {
    case "light":
      return `大白话说：先别急着问“准不准”，这卦主要是在提醒你看清主线：${firstEvidence.conclusion}`;
    case "professional":
      return `专业版：以 ${firstEvidence.rule_id} 为主证，结合日月、动变与反证校验，本卦主线为：${firstEvidence.conclusion}`;
    case "learning":
      return `学习版：这次先学会读证据树第一步，${firstEvidence.rule_id} 为什么进入主线，因为它给出的结论是：${firstEvidence.conclusion}`;
    case "story":
      return `剧情版：从卦象叙事看，事情像先亮出一条主线，再让阻力登场；当前主线是：${firstEvidence.conclusion}`;
    default: {
      const _exhaustive: never = input.mode;
      return _exhaustive;
    }
  }
}

function buildKeyEvidence(
  input: AiProviderInput,
  firstEvidence: RuleAnalysisResult["evidence_tree"][number],
): AiReadingOutput["key_evidence"] {
  const examNarrative = buildExamNarrative(input);
  if (examNarrative) {
    const primaryIds = new Set(
      [...input.analysis.evidence_tree, ...input.analysis.counter_evidence]
        .filter((node) => {
          const text = `${node.premise}${node.conclusion}`;
          return ["地天泰", "静卦", "父母", "官鬼", "世爻", "腾蛇"].some((keyword) => text.includes(keyword));
        })
        .map((node) => node.id),
    );
    return [
      {
        evidence_id: [...primaryIds][0] ?? firstEvidence.id,
        plain_explanation: examNarrative.evidenceExplanation,
      },
    ];
  }
  return [
    {
      evidence_id: firstEvidence.id,
      plain_explanation: buildFakeEvidenceExplanation(input, firstEvidence),
    },
  ];
}

function buildExamNarrative(input: AiProviderInput): {
  lightSummary: string;
  professionalSummary: string;
  learningSummary: string;
  storySummary: string;
  evidenceExplanation: string;
} | null {
  if (input.scenario !== "考试") return null;
  const allNodes = [...input.analysis.evidence_tree, ...input.analysis.counter_evidence];
  const allText = allNodes.map((node) => `${node.premise}${node.conclusion}`).join("\n");
  if (!allText.includes("父母") || !allText.includes("不显")) return null;

  const hexagram = findNodeText(allNodes, "地天泰") ?? "本卦有通达之象。";
  const staticChange = findNodeText(allNodes, "静卦") ?? "本卦无动爻，变化不大。";
  const shi = findNodeText(allNodes, "世爻") ?? "世爻代表你本人，可看自身状态。";
  const tengshe = findNodeText(allNodes, "腾蛇") ?? "";
  const guangui = findNodeText(allNodes, "官鬼") ?? "官鬼可看考试压力、规则和题目难度。";
  const fumu = findNodeText(allNodes, "父母") ?? "父母爻不显，结果线索不够明朗。";

  return {
    lightSummary:
      "按这个卦，大白话说：明天有过关机会，而且机会偏大，但不是闭眼过。地天泰是通达之象，静卦说明事情不太像临时逆袭，更多看你原本积累；父母爻不显，所以不能说结果已经定了。最需要注意的是官鬼带来的考试压力，以及世爻临腾蛇带来的紧张、纠结和粗心。",
    professionalSummary:
      `专业版：${hexagram}${staticChange}考试以父母爻为主，当前父母不显，卷面与通过文书不宜断死；${guangui}${shi}${tengshe}综合看为有通关条件，但压力与临场波动并存。`,
    learningSummary:
      `学习版：这卦先看三层。第一层看卦名与动变：${hexagram}${staticChange}第二层看考试用神：${fumu}第三层看辅助线：${guangui}${shi}${tengshe}所以结论只能说偏有机会，不能跳成确定判断。`,
    storySummary:
      "剧情版：这卦像是一条路已经通了，但考场门口还站着压力和心慌。泰卦给的是通达底色，静卦说不会突然大翻盘；父母不显让结果留着悬念，官鬼和腾蛇提醒你别被难题和紧张牵着走。",
    evidenceExplanation:
      `本卦证据不是一句“学习观察”就结束：${hexagram}${staticChange}${fumu}${guangui}${shi}${tengshe}`.replaceAll("。", "。"),
  };
}

function findNodeText(nodes: RuleAnalysisResult["evidence_tree"], keyword: string): string | undefined {
  const node = nodes.find((item) => `${item.premise}${item.conclusion}`.includes(keyword));
  return node ? `${node.conclusion}` : undefined;
}

function buildFakeEvidenceExplanation(
  input: AiProviderInput,
  firstEvidence: RuleAnalysisResult["evidence_tree"][number],
): string {
  switch (input.followup?.type) {
    case "why_yongshen":
      return `这里引用 ${firstEvidence.rule_id}：${firstEvidence.premise} ${firstEvidence.conclusion}`;
    case "key_rule":
      return `这条规则排在前面，是因为它直接影响后续证据怎么读：${firstEvidence.conclusion}`;
    case "counter_evidence":
      return `先保留主证据 ${firstEvidence.rule_id}，再和反证一起看，避免把学习观察说成确定结论。`;
    case "timing":
      return `应期相关问题要结合日月、动变或空亡线索，不单独靠一个日期下判断。`;
    case "learning_mode":
      return `学习模式先读规则编号，再读 premise 和 conclusion，最后看反证与行动提示。`;
    case "free_text":
      return `你的追问会被限定在已生成证据内回答：${firstEvidence.conclusion}`;
    default:
      return buildModeEvidenceExplanation(input, firstEvidence);
  }
}

function buildModeEvidenceExplanation(
  input: AiProviderInput,
  firstEvidence: RuleAnalysisResult["evidence_tree"][number],
): string {
  switch (input.mode) {
    case "light":
      return `用大白话讲，${firstEvidence.rule_id} 就是在告诉你：先抓住“${firstEvidence.title}”这条主线，${firstEvidence.conclusion}`;
    case "professional":
      return `${firstEvidence.rule_id}｜${firstEvidence.title}：premise=${firstEvidence.premise}；conclusion=${firstEvidence.conclusion}`;
    case "learning":
      return `学习拆解：规则 ${firstEvidence.rule_id} 先提出前提“${firstEvidence.premise}”，再得到“${firstEvidence.conclusion}”。`;
    case "story":
      return `剧情线索：${firstEvidence.title} 像第一幕的提示牌，把注意力推向“${firstEvidence.conclusion}”。`;
    default: {
      const _exhaustive: never = input.mode;
      return _exhaustive;
    }
  }
}

function buildFakeCounterEvidence(input: AiProviderInput, node: RuleAnalysisResult["counter_evidence"][number]): string {
  switch (input.mode) {
    case "light":
      return `也要看反面：${node.conclusion}`;
    case "professional":
      return `${node.rule_id}｜反证：${node.conclusion}`;
    case "learning":
      return `学习提醒：${node.rule_id} 是反证节点，用来限制结论边界：${node.conclusion}`;
    case "story":
      return `剧情里的阻力出现了：${node.conclusion}`;
    default: {
      const _exhaustive: never = input.mode;
      return _exhaustive;
    }
  }
}

function buildDefaultCounterEvidence(input: AiProviderInput): string {
  switch (input.mode) {
    case "light":
      return "目前没有特别硬的反面证据，但也别把它当成板上钉钉。";
    case "professional":
      return "当前证据树未给出强反证，仍需保留现实不确定性。";
    case "learning":
      return "学习提示：没有强反证不等于可以确定判断，只代表本轮证据树暂未触发反证节点。";
    case "story":
      return "故事里暂时没有强烈反转，但结局仍不能提前写死。";
    default: {
      const _exhaustive: never = input.mode;
      return _exhaustive;
    }
  }
}

function buildFakeActionTips(input: AiProviderInput): string[] {
  switch (input.mode) {
    case "light":
      return input.analysis.action_tips.map((tip) => `可以这样做：${tip}`);
    case "professional":
      return input.analysis.action_tips.map((tip) => `操作建议：${tip}`);
    case "learning":
      return input.analysis.action_tips.map((tip) => `学习复盘：${tip}`);
    case "story":
      return input.analysis.action_tips.map((tip) => `下一幕行动：${tip}`);
    default: {
      const _exhaustive: never = input.mode;
      return [_exhaustive];
    }
  }
}

class OpenAiResponsesProvider implements AiProvider {
  async generate(input: AiProviderInput): Promise<AiReadingOutput> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is required for OpenAI provider");
    }
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
        input: [
          {
            role: "system",
            content:
              "你是易问六爻的解释助手。只能解释传入的 chart_json、evidence_tree 和 knowledge_cards，不得编造卦盘事实，不得输出承诺式结论。",
          },
          {
            role: "user",
            content: JSON.stringify({
              question: input.question,
              scenario: input.scenario,
              mode: input.mode,
              evidence_tree: input.analysis.evidence_tree,
              counter_evidence: input.analysis.counter_evidence,
              knowledge_cards: input.knowledgeCards,
              followup: input.followup,
            }),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "yiwen_ai_reading_output",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["summary", "key_evidence", "counter_evidence", "action_tips", "safety_notice", "knowledge_card_refs", "model_metadata"],
              properties: {
                summary: { type: "string" },
                key_evidence: {
                  type: "array",
                  minItems: 1,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["evidence_id", "plain_explanation"],
                    properties: {
                      evidence_id: { type: "string" },
                      plain_explanation: { type: "string" },
                    },
                  },
                },
                counter_evidence: { type: "array", items: { type: "string" } },
                action_tips: { type: "array", minItems: 1, items: { type: "string" } },
                safety_notice: { type: "string" },
                knowledge_card_refs: { type: "array", minItems: 1, items: { type: "string" } },
                model_metadata: {
                  type: "object",
                  additionalProperties: false,
                  required: ["provider", "model", "generated_at"],
                  properties: {
                    provider: { type: "string" },
                    model: { type: "string" },
                    generated_at: { type: "string" },
                  },
                },
              },
            },
          },
        },
      }),
    });
    if (!response.ok) {
      throw new Error(`OpenAI Responses API failed: ${response.status}`);
    }
    const payload = await response.json() as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
    const text = payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).map((content) => content.text ?? "").join("") ?? "";
    return AiReadingOutputSchema.parse(JSON.parse(text));
  }
}

type ChatProviderConfig = {
  providerName: "deepseek" | "openrouter";
  apiKeyEnv: string;
  modelEnv: string;
  defaultModel: string;
  url: string;
  proxyUrl?: string;
  extraHeaders?: Record<string, string>;
};

class OpenRouterProvider implements AiProvider {
  constructor(private readonly config: ChatProviderConfig) {}

  async generate(input: AiProviderInput): Promise<AiReadingOutput> {
    const apiKey = process.env[this.config.apiKeyEnv];
    if (!apiKey) {
      throw new Error(`${this.config.apiKeyEnv} is required for ${this.config.providerName} provider`);
    }
    const model = process.env[this.config.modelEnv] ?? this.config.defaultModel;
    const payload = await callOpenRouterViaCurl({
      apiKey,
      model,
      input,
      config: this.config,
    });
    const content = payload.choices?.[0]?.message?.content ?? "";
    const output = AiReadingOutputSchema.parse(normalizeOpenRouterOutput(parseJsonObject(content, true), input, content, this.config.providerName, model));
    return {
      ...output,
      model_metadata: {
        provider: this.config.providerName,
        model,
        generated_at: output.model_metadata.generated_at || new Date().toISOString(),
      },
    };
  }
}

async function callOpenRouterViaCurl(input: {
  apiKey: string;
  model: string;
  input: AiProviderInput;
  config: ChatProviderConfig;
}): Promise<{ choices?: Array<{ message?: { content?: string } }> }> {
  const proxyUrl = input.config.proxyUrl;
  const requestBody = {
    model: input.model,
    messages: [
      {
        role: "system",
        content:
          "你是易问六爻的真实 AI 解读助手。你必须基于传入的 chart_json、evidence_tree、counter_evidence、knowledge_cards 回答，不能编造卦盘事实。回答要像懂六爻的人给用户解释：先给明确倾向，再逐条说明卦名、动爻、世应、用神、日月、六亲六神等证据。不同 mode 要明显不同：light 用大白话，professional 用术语，learning 教拆解，story 用叙事。禁止承诺式结论，不说保证、必然、包准。",
      },
      {
        role: "user",
        content: JSON.stringify({
          question: input.input.question,
          scenario: input.input.scenario,
          mode: input.input.mode,
          chart_json: input.input.chart ? {
            base_chart: input.input.chart.base_chart,
            changed_chart: input.input.chart.changed_chart,
            lines: input.input.chart.lines,
          } : undefined,
          verdict: input.input.analysis.verdict,
          yongshen: input.input.analysis.yongshen,
          evidence_tree: compactEvidenceNodes(input.input.analysis.evidence_tree),
          counter_evidence: compactEvidenceNodes(input.input.analysis.counter_evidence),
          action_tips: input.input.analysis.action_tips,
          safety_notice: input.input.analysis.safety_notice,
          knowledge_cards: input.input.knowledgeCards.slice(0, 3).map((card) => ({
            id: card.id,
            rule_id: card.rule_id,
            term: card.term,
            title: card.title,
            summary: card.summary,
          })),
          followup: input.input.followup,
          output_requirements: {
            summary: "一段自然中文，不要模板腔；直接回答用户问题，但保留不确定性边界。",
            key_evidence: "列出最关键的卦盘证据，每条解释要能落到具体爻位或规则。",
            counter_evidence: "列出限制结论的反证或不确定因素。",
            action_tips: "给现实可执行建议。",
          },
        }),
      },
    ],
    response_format: { type: "json_object" },
  };

  if (proxyUrl) {
    return callOpenRouterWithCurl({
      apiKey: input.apiKey,
      proxyUrl,
      url: input.config.url,
      extraHeaders: input.config.extraHeaders ?? {},
      providerName: input.config.providerName,
      requestBody,
    });
  }

  const response = await fetch(input.config.url, {
    method: "POST",
    headers: openRouterHeaders(input.apiKey, input.config.extraHeaders ?? {}),
    body: JSON.stringify(requestBody),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`${input.config.providerName} API failed: ${response.status}${detail ? ` ${detail.slice(0, 300)}` : ""}`);
  }
  return response.json() as Promise<{ choices?: Array<{ message?: { content?: string } }> }>;
}

async function callOpenRouterWithCurl(input: {
  apiKey: string;
  proxyUrl: string;
  url: string;
  extraHeaders: Record<string, string>;
  providerName: "deepseek" | "openrouter";
  requestBody: unknown;
}): Promise<{ choices?: Array<{ message?: { content?: string } }> }> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await callOpenRouterWithCurlOnce(input);
    } catch (error) {
      lastError = error;
      if (attempt === 3 || !isTransientOpenRouterError(error)) break;
      await new Promise((resolve) => setTimeout(resolve, attempt * 700));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`${input.providerName} curl failed`);
}

async function callOpenRouterWithCurlOnce(input: {
  apiKey: string;
  proxyUrl: string;
  url: string;
  extraHeaders: Record<string, string>;
  providerName: "deepseek" | "openrouter";
  requestBody: unknown;
}): Promise<{ choices?: Array<{ message?: { content?: string } }> }> {
  const { spawn } = await import("node:child_process");
  const timeoutSeconds = Math.max(20, Math.ceil(getNumberEnv("AI_STREAM_TIMEOUT_MS", 90_000) / 1000) - 5);
  const args = [
    "--silent",
    "--show-error",
    "--proxy",
    input.proxyUrl,
    "--max-time",
    String(timeoutSeconds),
    input.url,
    "-H",
    `Authorization: Bearer ${input.apiKey}`,
    "-H",
    "Content-Type: application/json",
    "--data-binary",
    "@-",
    "--write-out",
    "\n__HTTP_STATUS__:%{http_code}",
  ];
  for (const [name, value] of Object.entries(input.extraHeaders)) {
    args.splice(args.indexOf("--data-binary"), 0, "-H", `${name}: ${value}`);
  }

  return new Promise((resolve, reject) => {
    const child = spawn("curl.exe", args, { windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      reject(error);
    });
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`${input.providerName} curl failed: ${stderr || `exit ${code}`}`));
        return;
      }
      const statusMatch = stdout.match(/\n__HTTP_STATUS__:(\d{3})\s*$/);
      const status = statusMatch ? Number(statusMatch[1]) : 0;
      const body = statusMatch ? stdout.slice(0, statusMatch.index) : stdout;
      if (status < 200 || status >= 300) {
        reject(new Error(`${input.providerName} API failed: ${status}${body ? ` ${body.slice(0, 300)}` : ""}`));
        return;
      }
      try {
        resolve(JSON.parse(body) as { choices?: Array<{ message?: { content?: string } }> });
      } catch (error) {
        reject(error);
      }
    });
    child.stdin.end(JSON.stringify(input.requestBody), "utf8");
  });
}

function isTransientOpenRouterError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /curl: \(35\)|curl: \(28\)|fetch failed|ECONNRESET|TLS|handshake|timed out/i.test(error.message);
}

function compactEvidenceNodes(nodes: RuleAnalysisResult["evidence_tree"]): Array<{
  id: string;
  rule_id: string;
  title: string;
  line_refs: number[];
  premise: string;
  conclusion: string;
  polarity: string;
}> {
  return nodes.map((node) => ({
    id: node.id,
    rule_id: node.rule_id,
    title: node.title,
    line_refs: node.line_refs,
    premise: node.premise,
    conclusion: node.conclusion,
    polarity: node.polarity,
  }));
}

function openRouterHeaders(apiKey: string, extraHeaders: Record<string, string>): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    ...extraHeaders,
  };
}

function normalizeOpenRouterOutput(
  raw: unknown,
  input: AiProviderInput,
  fallbackContent = "",
  providerName: "deepseek" | "openrouter" = "openrouter",
  model = process.env.OPENROUTER_MODEL ?? "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
): AiReadingOutput {
  const parsed = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const keyEvidence = Array.isArray(parsed.key_evidence)
    ? parsed.key_evidence.map((item, index) => {
        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          return {
            evidence_id: typeof record.evidence_id === "string" ? record.evidence_id : input.analysis.evidence_tree[index]?.id ?? input.analysis.evidence_tree[0].id,
            plain_explanation: typeof record.plain_explanation === "string" ? record.plain_explanation : JSON.stringify(record),
          };
        }
        return {
          evidence_id: input.analysis.evidence_tree[index]?.id ?? input.analysis.evidence_tree[0].id,
          plain_explanation: String(item),
        };
      })
    : [
        {
          evidence_id: input.analysis.evidence_tree[0].id,
          plain_explanation: input.analysis.evidence_tree[0].conclusion,
        },
      ];

  const summary =
    typeof parsed.summary === "string"
      ? parsed.summary
      : typeof parsed.tendency === "string"
        ? parsed.tendency
        : typeof parsed.answer === "string"
          ? parsed.answer
          : typeof parsed.response === "string"
            ? parsed.response
            : fallbackContent.trim()
              ? fallbackContent.trim()
              : keyEvidence.map((item) => item.plain_explanation).join("\n");

  const counterEvidence = Array.isArray(parsed.counter_evidence)
    ? parsed.counter_evidence.map((item) => typeof item === "string" ? item : JSON.stringify(item))
    : input.analysis.counter_evidence.length > 0
      ? input.analysis.counter_evidence.map((node) => node.conclusion)
      : ["当前模型未补充额外反证，仍需保留现实不确定性。"];

  const actionTips = Array.isArray(parsed.action_tips)
    ? parsed.action_tips.map((item) => typeof item === "string" ? item : JSON.stringify(item))
    : input.analysis.action_tips;

  const knowledgeCardRefs = Array.isArray(parsed.knowledge_card_refs)
    ? parsed.knowledge_card_refs.map(String).filter(Boolean)
    : input.knowledgeCards.slice(0, 3).map((card) => card.id);

  const normalized: AiReadingOutput = {
    summary,
    key_evidence: keyEvidence,
    counter_evidence: counterEvidence.length > 0 ? counterEvidence : ["需结合现实情况复核。"],
    action_tips: actionTips.length > 0 ? actionTips : ["把卦象作为参考，同时落实到现实行动。"],
    safety_notice: typeof parsed.safety_notice === "string" ? parsed.safety_notice : input.analysis.safety_notice,
    knowledge_card_refs: knowledgeCardRefs.length > 0 ? knowledgeCardRefs : ["kc-B-YS-001-01"],
    model_metadata: {
      provider: providerName,
      model,
      generated_at: new Date().toISOString(),
    },
  };
  return repairUnsupportedStemsAndBranches(normalized, input);
}

function repairUnsupportedStemsAndBranches(output: AiReadingOutput, input: AiProviderInput): AiReadingOutput {
  if (!input.chart) return output;
  const allowedTokens = new Set<string>();
  input.chart.lines.forEach((line) => {
    allowedTokens.add(`${line.stem}${line.branch}`);
    allowedTokens.add(`${line.branch}${line.element}`);
  });
  const content = JSON.stringify(output);
  const suspiciousTokens = content.match(/[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]|[子丑寅卯辰巳午未申酉戌亥][木火土金水]/g) ?? [];
  const unsupported = suspiciousTokens.filter((token) => !allowedTokens.has(token));
  if (unsupported.length === 0) return output;

  const primary = selectPrimaryEvidence(input);
  return {
    ...output,
    key_evidence: [{
      evidence_id: primary.id,
      plain_explanation: `${primary.rule_id}｜${primary.title}：${primary.premise}${primary.conclusion}`,
    }],
    counter_evidence: [
      `模型原文包含当前卦盘未出现的干支/五行组合：${[...new Set(unsupported)].join("、")}；已回退为证据树口径。`,
      ...output.counter_evidence,
    ],
  };
}

function parseJsonObject(content: string, allowPlainText = false): unknown {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      if (allowPlainText) return {};
      throw new Error("AI provider returned non-JSON content");
    }
    return JSON.parse(match[0]);
  }
}
