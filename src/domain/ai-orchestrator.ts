import { AiReadingOutputSchema, type AiReadingOutput, type ExplainMode, type FollowupType, type Scenario } from "./contracts";
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
    const firstEvidence = input.analysis.evidence_tree[0];
    const cardRefs = input.knowledgeCards.slice(0, 3).map((card) => card.id);
    const summary = process.env.AI_FAKE_UNSAFE_OUTPUT === "true"
      ? "这件事一定发财，结果必然很好。"
      : `${input.mode === "story" ? "从卦象叙事看，" : ""}本次解读只基于已生成的证据树与知识卡，适合作为学习观察。`;

    return {
      summary,
      key_evidence: [
        {
          evidence_id: firstEvidence.id,
          plain_explanation: input.followup?.type === "why_yongshen"
            ? `这里引用 ${firstEvidence.rule_id}：${firstEvidence.conclusion}`
            : `关键证据 ${firstEvidence.rule_id} 显示：${firstEvidence.conclusion}`,
        },
      ],
      counter_evidence:
        input.analysis.counter_evidence.length > 0
          ? input.analysis.counter_evidence.map((node) => `${node.rule_id}：${node.conclusion}`)
          : ["当前证据树未给出强反证，仍需保留现实不确定性。"],
      action_tips: input.analysis.action_tips,
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
