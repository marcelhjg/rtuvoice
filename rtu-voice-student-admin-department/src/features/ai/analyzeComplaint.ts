import "server-only";
import { SYSTEM_PROMPT, PRIORITY_ONLY_PROMPT } from "./prompt";

type Provider = "openrouter" | "groq";
type Attempt = { provider: Provider; model: string; timeoutMs: number };

// Tried in order: OpenRouter first, Groq as the safety net
const ATTEMPTS: Attempt[] = [
  { provider: "openrouter", model: process.env.OPENROUTER_MODEL ?? "nvidia/nemotron-3-ultra-550b-a55b:free", timeoutMs: 10_000 },
  { provider: "openrouter", model: process.env.OPENROUTER_FALLBACK ?? "google/gemma-4-31b-it:free", timeoutMs: 10_000 },
  { provider: "groq", model: process.env.GROQ_MODEL ?? "openai/gpt-oss-120b", timeoutMs: 15_000 },
  { provider: "groq", model: process.env.GROQ_FALLBACK ?? "openai/gpt-oss-20b", timeoutMs: 15_000 },
];

const PROVIDERS: Record<Provider, { url: string; apiKey: string | undefined }> = {
  openrouter: {
    url: "https://openrouter.ai/api/v1/chat/completions",
    apiKey: process.env.OPENROUTER_API_KEY,
  },
  groq: {
    url: "https://api.groq.com/openai/v1/chat/completions",
    apiKey: process.env.GROQ_API_KEY,
  },
};

const PRIORITIES = ["high", "mid", "low"] as const;
const MAX_DESCRIPTION = 500;
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

async function callModel(
  { provider, model }: Attempt,
  { title, description, is_public }: AnalyzeType,
  timeoutMs: number,
) {
  const { url, apiKey } = PROVIDERS[provider];
  const isGroqGptOss = provider === "groq" && model.startsWith("openai/gpt-oss");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      temperature: 0.2,
      // Groq-specific options (reasoning tokens count toward the limit)
      ...(provider === "groq" && { max_completion_tokens: 1024 }),
      ...(isGroqGptOss && { reasoning_effort: "low" }),
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
    throw new Error(`${provider} ${response.status}${detail ? `: ${detail}` : ""}`);
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
  const available = ATTEMPTS.filter((a) => PROVIDERS[a.provider].apiKey);
  if (available.length === 0) {
    console.error("[ai] No API keys set (OPENROUTER_API_KEY / GROQ_API_KEY)");
    return null;
  }

  const deadline = Date.now() + TOTAL_MS;

  for (const attempt of available) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;

    try {
      return await callModel(attempt, input, Math.min(attempt.timeoutMs, remaining));
    } catch (err) {
      console.error(`[ai] ${attempt.provider}:${attempt.model} failed:`, err instanceof Error ? err.message : err);
    }
  }
  return null;
}