// Korean Quest chat worker.
// Proxies chat requests to the Hugging Face OpenAI-compatible router.
// The legacy api-inference.huggingface.co endpoint and the old
// katanemo/Arch-Router-1.5B model are decommissioned, so we use the
// router + a currently supported, Korean-capable instruct model.

const ROUTER_URL = "https://router.huggingface.co/v1/chat/completions";

// ":fastest" lets the router pick whichever live provider is fastest, which
// avoids breaking again if a single provider drops the model. The worker owns
// this list (the client can't pick a model), and walks it in order: if a model
// is dropped from the router (Qwen2.5-7B and gemma-2-2b both were), it moves on
// to the next one instead of failing.
const MODEL_CHAIN = [
  "openai/gpt-oss-20b:fastest",
  "google/gemma-3-12b-it:fastest",
  "meta-llama/Llama-3.1-8B-Instruct:fastest",
];

// Only the live site and local dev may call this worker. Browsers always send
// Origin on cross-site POSTs, so this stops other websites from spending our
// Hugging Face credits through it.
const ALLOWED_ORIGINS = new Set([
  "https://itsfixable.github.io",
  "http://localhost:3000",
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

// Upstream statuses worth retrying — transient gateway/rate/availability errors.
const TRANSIENT_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

// Abort a single upstream call after this long so we can retry / fall back
// instead of letting the request hang until the platform kills it.
const REQUEST_TIMEOUT_MS = 25000;
const ATTEMPTS_PER_MODEL = 2;

const FALLBACK_REPLY =
  "음… 지금 AI가 잠깐 바쁜 것 같아요. 다시 한 번 해볼까요?\n" +
  "(The assistant is busy right now. Please try again in a moment.)";

const MAX_MESSAGES = 16;
const MAX_MESSAGE_CHARS = 2000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return replyJson("Forbidden origin.", { status: 403 });
    }

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
      console.error("kq-chat: missing HF_TOKEN secret");
      return replyJson(FALLBACK_REPLY, { status: 500 });
    }

    const modelChain = MODEL_CHAIN;

    // When the client asks for streaming, try to open a token stream and pipe
    // deltas straight back so the reply appears word-by-word. If no model can
    // stream we fall through to the buffered retry chain below.
    if (body?.stream === true) {
      for (const model of modelChain) {
        const streamed = await tryStream(model, messages, env);
        if (streamed) return streamed;
      }
    }

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

          // Errors that won't fix themselves (e.g. a 400 because the router
          // no longer serves this model) skip straight to the next model.
          if (!TRANSIENT_STATUSES.has(response.status)) break;
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

    // Keep upstream details in the worker logs, not in front of learners.
    console.error(`kq-chat: all models failed (${lastStatus || 502}): ${lastDetail}`);
    return replyJson(FALLBACK_REPLY, { status: 502 });
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

// Opens a streaming completion and returns a Response that emits clean reply
// text as it arrives. Returns null if the stream can't be established, so the
// caller can fall back to the buffered (non-streaming) retry chain.
async function tryStream(model, messages, env) {
  const controller = new AbortController();
  // Only guard time-to-first-byte; cleared once headers arrive so long
  // replies aren't cut off mid-stream.
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let upstream;
  try {
    upstream = await fetch(ROUTER_URL, {
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
        stream: true,
      }),
      signal: controller.signal,
    });
  } catch {
    clearTimeout(timer);
    return null;
  }
  clearTimeout(timer);

  if (!upstream.ok || !upstream.body) return null;

  const decoder = new TextDecoder("utf-8");
  const encoder = new TextEncoder();
  let buffer = "";

  const transform = new TransformStream({
    transform(chunk, ctrl) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split("\n");
      // Keep the last (possibly partial) line for the next chunk.
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        try {
          const json = JSON.parse(data);
          const delta = json?.choices?.[0]?.delta?.content;
          if (delta) {
            const clean = delta.replace(/\uFFFD/g, "");
            if (clean) ctrl.enqueue(encoder.encode(clean));
          }
        } catch {
          // Ignore keep-alive or non-JSON lines.
        }
      }
    },
  });

  upstream.body.pipeTo(transform.writable).catch(() => {});

  return new Response(transform.readable, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      ...corsHeaders(),
    },
  });
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
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, MAX_MESSAGE_CHARS) }))
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
