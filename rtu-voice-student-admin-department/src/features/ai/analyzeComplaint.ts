import "server-only";
import { SYSTEM_PROMPT, PRIORITY_ONLY_PROMPT } from "./prompt";

const MODELS = [
  process.env.OPENROUTER_MODEL ?? "nvidia/nemotron-3-ultra-550b-a55b:free",
  process.env.OPENROUTER_FALLBACK ?? "google/gemma-4-31b-it:free",
];

const PRIORITIES = ["high", "mid", "low"] as const;
const MAX_DESCRIPTION = 500;

const PER_MODEL_MS = 15_000;
const TOTAL_MS = 35_000;

export type AnalyzeType = { title: string; description: string; is_public: boolean };

export type ComplaintAnalysis = {
  ai_title: string | null;
  ai_summary: string | null;
  priority: (typeof PRIORITIES)[number];
};

function parseAnalysis(obj: Record<string, unknown> | null, is_public: boolean): ComplaintAnalysis {
  const priority = String(obj?.priority ?? "").toLowerCase();
  if (!(PRIORITIES as readonly string[]).includes(priority)) throw new Error("Invalid AI output shape");
  const p = priority as ComplaintAnalysis["priority"];

  if (!is_public) return { ai_title: null, ai_summary: null, priority: p };

  const title = typeof obj?.title === "string" ? obj.title.trim() : "";
  const summary = typeof obj?.summary === "string" ? obj.summary.trim() : "";
  if (!title || !summary) throw new Error("Invalid AI output shape");

  return { ai_title: title.slice(0, 120), ai_summary: summary.slice(0, 600), priority: p };
}

async function callModel(model: string, { title, description, is_public }: AnalyzeType, timeoutMs: number) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      temperature: 0.2,
      messages: [
        { role: "system", content: is_public ? SYSTEM_PROMPT : PRIORITY_ONLY_PROMPT },
        {
          role: "user",
          content: `Title: ${title.slice(0, 200)}\n\nComplaint:\n"""\n${description.slice(0, MAX_DESCRIPTION)}\n"""`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).slice(0, 300);
    throw new Error(`OpenRouter ${response.status}${detail ? `: ${detail}` : ""}`);
  }

  const data = await response.json();
  const raw: string | undefined = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Empty model response");

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("No JSON in response");

  return parseAnalysis(JSON.parse(raw.slice(start, end + 1)), is_public);
}

export async function analyzeComplaint(input: AnalyzeType): Promise<ComplaintAnalysis | null> {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("[ai] OPENROUTER_API_KEY is not set");
    return null;
  }
  const deadline = Date.now() + TOTAL_MS;

  for (const model of MODELS) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;

    try {
      return await callModel(model, input, Math.min(PER_MODEL_MS, remaining));
    } catch (err) {
      console.error(`[ai] ${model} failed:`, err instanceof Error ? err.message : err);
    }
  }
  return null;
}