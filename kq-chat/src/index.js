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

// Smaller, faster model the worker falls back to when the primary model keeps
// timing out (504s usually mean a cold/slow provider on the bigger model).
const FAST_FALLBACK_MODEL = "google/gemma-2-2b-it:fastest";

// Upstream statuses worth retrying — transient gateway/rate/availability errors.
const TRANSIENT_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

// Abort a single upstream call after this long so we can retry / fall back
// instead of letting the request hang until the platform kills it.
const REQUEST_TIMEOUT_MS = 25000;
const ATTEMPTS_PER_MODEL = 2;

const FALLBACK_REPLY =
  "음… 지금 AI가 잠깐 바쁜 것 같아요. 다시 한 번 해볼까요?";

const MAX_MESSAGES = 16;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

    const primaryModel = ALLOWED_MODELS.has(body?.model) ? body.model : DEFAULT_MODEL;
    // Try the requested model first; if it keeps timing out, drop down to a
    // smaller/faster model so the user still gets an answer.
    const modelChain = [primaryModel];
    if (primaryModel !== FAST_FALLBACK_MODEL) modelChain.push(FAST_FALLBACK_MODEL);

    let lastStatus = 0;
    let lastDetail = "Unknown chat worker error.";

    for (const model of modelChain) {
      for (let attempt = 0; attempt < ATTEMPTS_PER_MODEL; attempt += 1) {
        try {
          const { response, parsed } = await callModel(model, messages, env);

          if (response.ok) {
            const rawReply = parsed?.choices?.[0]?.message?.content || "";
            const reply = cleanReply(rawReply) || FALLBACK_REPLY;
            return replyJson(reply);
          }

          lastStatus = response.status;
          lastDetail =
            parsed?.error?.message ||
            parsed?.error ||
            parsed?.message ||
            `status ${response.status}`;

          // Don't bother retrying errors that won't fix themselves (e.g. 400/401).
          if (!TRANSIENT_STATUSES.has(response.status)) {
            return replyJson(
              `${FALLBACK_REPLY}\n\nDetails: Hugging Face error (${lastStatus}): ${lastDetail}`,
              { status: 502 }
            );
          }
        } catch (error) {
          lastStatus = 504;
          lastDetail =
            error?.name === "AbortError"
              ? "Request timed out."
              : error instanceof Error
                ? error.message
                : "Unknown chat worker error.";
        }

        // Brief backoff before the next attempt (skip the final wait).
        const isLastAttempt =
          model === modelChain[modelChain.length - 1] && attempt === ATTEMPTS_PER_MODEL - 1;
        if (!isLastAttempt) await sleep(400 * (attempt + 1));
      }
    }

    return replyJson(
      `${FALLBACK_REPLY}\n\nDetails: Hugging Face error (${lastStatus || 502}): ${lastDetail}`,
      { status: 502 }
    );
  },
};

// Calls the Hugging Face router for one model with a hard timeout. Returns the
// raw Response plus the parsed JSON body (or null when the body isn't JSON).
async function callModel(model, messages, env) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(ROUTER_URL, {
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
      signal: controller.signal,
    });

    // Decode explicitly as UTF-8 so a mislabeled upstream charset can't
    // corrupt multi-byte Hangul.
    const rawText = new TextDecoder("utf-8").decode(await response.arrayBuffer());
    let parsed = null;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = null;
    }
    return { response, parsed };
  } finally {
    clearTimeout(timer);
  }
}

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
