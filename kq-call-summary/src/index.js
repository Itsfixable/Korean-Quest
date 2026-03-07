const SUMMARY_MODEL = "Qwen/Qwen3.5-27B";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders(),
      });
    }

    if (url.pathname === "/health") {
      return json(
        {
          ok: true,
          service: "kq-call-summary",
          model: SUMMARY_MODEL,
        },
        { headers: corsHeaders() }
      );
    }

    if (url.pathname === "/api/summary" && request.method === "POST") {
      try {
        const body = await request.json();
        const transcript = (body.transcript || "").trim();

        if (!transcript) {
          return json(
            { error: "Missing transcript." },
            { status: 400, headers: corsHeaders() }
          );
        }

        const hfResponse = await fetch(
          "https://router.huggingface.co/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${env.HF_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: SUMMARY_MODEL,
              messages: [
                {
                  role: "system",
                  content:
                    "You are a Korean language speaking coach for a student learning app called Korean Quest. Analyze the speaking transcript and return ONLY valid JSON. Do not include markdown fences. Do not include explanations before or after the JSON.",
                },
                {
                  role: "user",
                  content: buildPrompt(transcript),
                },
              ],
              temperature: 0.3,
              max_tokens: 900,
            }),
          }
        );

        const rawText = await hfResponse.text();
        let hfData = null;

        try {
          hfData = JSON.parse(rawText);
        } catch {
          hfData = null;
        }

        if (!hfResponse.ok) {
          return json(
            {
              error:
                hfData?.error ||
                hfData?.message ||
                `Hugging Face request failed with status ${hfResponse.status}.`,
              details: hfData || rawText,
            },
            { status: hfResponse.status, headers: corsHeaders() }
          );
        }

        const modelContent =
          hfData?.choices?.[0]?.message?.content ||
          hfData?.choices?.[0]?.text ||
          "";

        if (!modelContent) {
          return json(
            { error: "Model returned an empty summary response." },
            { status: 500, headers: corsHeaders() }
          );
        }

        const cleanedJson = extractJson(modelContent);

        let parsedSummary;
        try {
          parsedSummary = JSON.parse(cleanedJson);
        } catch {
          return json(
            {
              error: "Model returned invalid JSON.",
              details: modelContent,
            },
            { status: 500, headers: corsHeaders() }
          );
        }

        return json(
          {
            xpEarned: normalizeXp(parsedSummary.xpEarned),
            summaryParagraph: toStringSafe(parsedSummary.summaryParagraph),
            topicsPracticed: toStringArray(parsedSummary.topicsPracticed),
            wordsUsed: toStringArray(parsedSummary.wordsUsed),
            strengths: toStringArray(parsedSummary.strengths),
            weaknesses: toStringArray(parsedSummary.weaknesses),
            recommendedNextSteps: toStringArray(
              parsedSummary.recommendedNextSteps
            ),
            dailyQuests: toStringArray(parsedSummary.dailyQuests),
            coachNote: toStringSafe(parsedSummary.coachNote, "Nice work."),
          },
          { headers: corsHeaders() }
        );
      } catch (error) {
        return json(
          {
            error:
              error instanceof Error
                ? error.message
                : "Unknown summary worker error.",
          },
          { status: 500, headers: corsHeaders() }
        );
      }
    }

    return json(
      { error: "Not found" },
      { status: 404, headers: corsHeaders() }
    );
  },
};

function buildPrompt(transcript) {
  return `
Summarize this Korean speaking practice transcript for a student dashboard.

Transcript:
${transcript}

Return ONLY valid JSON in exactly this shape:

{
  "xpEarned": 25,
  "summaryParagraph": "2-4 sentence summary of what happened in the call",
  "topicsPracticed": ["topic 1", "topic 2"],
  "wordsUsed": ["word 1", "word 2", "word 3"],
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "recommendedNextSteps": ["next step 1", "next step 2"],
  "dailyQuests": ["quest 1", "quest 2"],
  "coachNote": "one short encouraging coaching paragraph"
}

Rules:
- Base everything only on the transcript.
- Keep the summaryParagraph concise and specific.
- If Korean words appear, include the important ones in wordsUsed.
- Each array should usually have 2 to 5 items.
- xpEarned should be a reasonable integer from 5 to 50.
- coachNote should sound encouraging and specific.
- Do not use markdown.
- Do not include explanations outside the JSON.
`;
}

function extractJson(text) {
  const trimmed = text.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

function toStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 5);
}

function toStringSafe(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function normalizeXp(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 20;
  return Math.max(5, Math.min(50, Math.round(num)));
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {}),
    },
  });
}