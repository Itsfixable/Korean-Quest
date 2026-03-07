const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (url.pathname === "/api/call-summary" && request.method === "POST") {
      return handleCallSummary(request, env);
    }

    return json(
      {
        ok: false,
        error: "Not found",
      },
      404
    );
  },
};

async function handleCallSummary(request, env) {
  try {
    if (!env.HF_API_KEY) {
      return json(
        {
          ok: false,
          error: "Missing HF_API_KEY secret in Cloudflare Worker.",
        },
        500
      );
    }

    if (!env.HF_MODEL) {
      return json(
        {
          ok: false,
          error: "Missing HF_MODEL in wrangler.jsonc.",
        },
        500
      );
    }

    const body = await request.json();

    const transcript = safeString(body.transcript);
    const notes = safeString(body.notes);
    const missionTitle = safeString(body.missionTitle);
    const missionDesc = safeString(body.missionDesc);
    const promptEnglish = safeString(body.promptEnglish);
    const promptKorean = safeString(body.promptKorean);
    const words = Array.isArray(body.words)
      ? body.words.map(safeString).filter(Boolean)
      : [];
    const durationSeconds = Number(body.durationSeconds || 0);

    if (!transcript && !notes) {
      return json(
        {
          ok: false,
          error: "Provide at least transcript or notes.",
        },
        400
      );
    }

    const systemPrompt = `
You are a Korean language learning coach for a student app called Korean Quest.

You will receive:
- a transcript from a Korean speaking practice call
- optional notes
- optional tracked vocabulary
- the current roleplay mission
- the current conversation prompt
- call duration

Return ONLY strict valid JSON with this exact shape:
{
  "topics": ["..."],
  "wordsUsed": ["..."],
  "strengths": ["..."],
  "weaknesses": ["..."],
  "recommendations": ["..."],
  "dailyQuests": ["..."],
  "coachNote": "..."
}

Rules:
- Use double quotes for all keys and string values.
- Do not use markdown.
- Do not use code fences.
- Do not use single quotes.
- dailyQuests must be an array of strings, not objects.
- Be encouraging, specific, and student-friendly.
- Keep each list item concise.
- Use the transcript first, then notes and tracked words as support.
`.trim();

    const userPayload = {
      transcript,
      notes,
      missionTitle,
      missionDesc,
      promptEnglish,
      promptKorean,
      words,
      durationSeconds,
    };

    const hfResponse = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.HF_API_KEY}`,
        },
        body: JSON.stringify({
          model: env.HF_MODEL,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: JSON.stringify(userPayload, null, 2),
            },
          ],
          max_tokens: 700,
          temperature: 0.2,
        }),
      }
    );

    const rawHF = await hfResponse.json();

    if (!hfResponse.ok) {
      return json(
        {
          ok: false,
          error: "Hugging Face request failed.",
          details: rawHF,
        },
        hfResponse.status
      );
    }

    const outputText =
      rawHF?.choices?.[0]?.message?.content?.trim() ||
      rawHF?.choices?.[0]?.delta?.content?.trim() ||
      "";

    if (!outputText) {
      return json(
        {
          ok: false,
          error: "Model returned empty output.",
          details: rawHF,
        },
        502
      );
    }

    const parsed = parseJsonSafely(outputText);

    if (!parsed) {
      return json(
        {
          ok: false,
          error: "Model returned non-JSON output.",
          raw: outputText,
        },
        502
      );
    }

    const normalized = {
      topics: normalizeStringArray(parsed.topics),
      wordsUsed: normalizeStringArray(parsed.wordsUsed),
      strengths: normalizeStringArray(parsed.strengths),
      weaknesses: normalizeStringArray(parsed.weaknesses),
      recommendations: normalizeStringArray(parsed.recommendations),
      dailyQuests: normalizeDailyQuests(parsed.dailyQuests),
      coachNote: safeString(parsed.coachNote),
    };

    return json({
      ok: true,
      summary: normalized,
    });
  } catch (error) {
    return json(
      {
        ok: false,
        error: "Unexpected Worker error.",
        details: String(error?.message || error),
      },
      500
    );
  }
}

function parseJsonSafely(text) {
  let cleaned = String(text || "").trim();

  // Remove markdown fences if present
  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // Try normal JSON first
  try {
    return JSON.parse(cleaned);
  } catch {}

  // Extract main object region
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1) {
    return null;
  }

  let sliced =
    lastBrace !== -1 && lastBrace > firstBrace
      ? cleaned.slice(firstBrace, lastBrace + 1).trim()
      : cleaned.slice(firstBrace).trim();

  // If braces are unbalanced, add missing closing braces
  const openCount = (sliced.match(/{/g) || []).length;
  const closeCount = (sliced.match(/}/g) || []).length;
  if (closeCount < openCount) {
    sliced += "}".repeat(openCount - closeCount);
  }

  // Convert Python-style dict/list strings to JSON-like strings
  sliced = sliced
    .replace(/([{,]\s*)'([^']+?)'\s*:/g, '$1"$2":')   // keys
    .replace(/:\s*'([^']*?)'/g, ': "$1"')             // simple string values
    .replace(/\[\s*'([^]*?)'\s*\]/g, (match) => {
      return match.replace(/'([^']*?)'/g, '"$1"');
    })
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]");

  try {
    return JSON.parse(sliced);
  } catch {
    return null;
  }
}
function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map(safeString).filter(Boolean);
}

function normalizeDailyQuests(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();

      if (item && typeof item === "object") {
        const title = safeString(item.title);
        const description = safeString(item.description);

        if (title && description) return `${title}: ${description}`;
        if (title) return title;
        if (description) return description;
      }

      return "";
    })
    .filter(Boolean);
}

function safeString(value) {
  if (value == null) return "";
  return String(value).trim();
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}