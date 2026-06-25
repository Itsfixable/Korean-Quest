// Korean Quest chat worker.
// Proxies chat requests to the Hugging Face OpenAI-compatible router.
// The legacy api-inference.huggingface.co endpoint and the old
// katanemo/Arch-Router-1.5B model are decommissioned, so we use the
// router + a currently supported, Korean-capable instruct model.

const ROUTER_URL = "https://router.huggingface.co/v1/chat/completions";

// ":fastest" lets the router pick whichever live provider is fastest, which
// avoids breaking again if a single provider drops the model.
const DEFAULT_MODEL = "Qwen/Qwen2.5-7B-Instruct:fastest";

// Models the client is allowed to request. Anything else (including the old
// deprecated id) falls back to DEFAULT_MODEL so the chatbot keeps working.
const ALLOWED_MODELS = new Set([
  "Qwen/Qwen2.5-7B-Instruct:fastest",
  "meta-llama/Llama-3.1-8B-Instruct:fastest",
  "google/gemma-2-2b-it:fastest",
]);

const SYSTEM_PROMPT =
  "You are the Korean Quest learning assistant. Help the user with Korean " +
  "language, grammar, vocabulary, and culture. Keep answers clear and " +
  "encouraging. Respond primarily in English. " +
  "When you write Korean, use ONLY Hangul (한글). " +
  "Never use Chinese or Japanese characters, and never use Hanja (Chinese " +
  "characters) — even for words of Chinese origin, always write them in " +
  "Hangul. For every Korean phrase, include its romanization and a short " +
  "English translation so beginners can follow along. " +
  "Only output valid, complete characters — never emit broken or placeholder " +
  "symbols.";

const FALLBACK_REPLY =
  "음… 지금 AI가 잠깐 바쁜 것 같아요. 다시 한 번 해볼까요?";

const MAX_MESSAGES = 16;

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    if (request.method !== "POST") {
      return replyJson(
        "Method not allowed. Use POST.",
        { status: 405 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return replyJson("Invalid JSON body.", { status: 400 });
    }

    const incoming = Array.isArray(body?.messages) ? body.messages : [];
    const messages = sanitizeMessages(incoming);

    if (messages.length === 0) {
      return replyJson("Please send a message.", { status: 400 });
    }

    if (!env.HF_TOKEN) {
      return replyJson(
        `${FALLBACK_REPLY}\n\nDetails: Server is missing HF_TOKEN secret.`,
        { status: 500 }
      );
    }

    const model = ALLOWED_MODELS.has(body?.model) ? body.model : DEFAULT_MODEL;

    try {
      const hfResponse = await fetch(ROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
          max_tokens: 512,
          temperature: 0.4,
        }),
      });

      // Decode explicitly as UTF-8 so a mislabeled upstream charset can't
      // corrupt multi-byte Hangul.
      const rawText = new TextDecoder("utf-8").decode(await hfResponse.arrayBuffer());
      let parsed = null;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = null;
      }

      if (!hfResponse.ok) {
        const detail =
          parsed?.error?.message ||
          parsed?.error ||
          parsed?.message ||
          `status ${hfResponse.status}`;
        return replyJson(
          `${FALLBACK_REPLY}\n\nDetails: Hugging Face error (${hfResponse.status}): ${detail}`,
          { status: 502 }
        );
      }

      const rawReply = parsed?.choices?.[0]?.message?.content || "";
      const reply = cleanReply(rawReply) || FALLBACK_REPLY;

      return replyJson(reply);
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : "Unknown chat worker error.";
      return replyJson(`${FALLBACK_REPLY}\n\nDetails: ${detail}`, {
        status: 502,
      });
    }
  },
};

function cleanReply(text) {
  return String(text || "")
    // Drop Unicode replacement characters left by any broken byte sequence.
    .replace(/\uFFFD/g, "")
    // Collapse whitespace that stripping may have left dangling.
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function sanitizeMessages(messages) {
  return messages
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
    )
    .map((m) => ({ role: m.role, content: m.content.trim() }))
    .slice(-MAX_MESSAGES);
}

function replyJson(reply, init = {}) {
  const payload = {
    reply,
    choices: [{ message: { role: "assistant", content: reply } }],
  };
  return new Response(JSON.stringify(payload), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders(),
      ...(init.headers || {}),
    },
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}
