// Korean Quest chat worker.
// Answers chat requests with Cloudflare Workers AI (the `AI` binding in
// wrangler.jsonc). It used to proxy the Hugging Face router, but that needs
// paid credits; Workers AI includes a free daily allowance (10,000 neurons,
// roughly 700 replies from the primary model) on the same Cloudflare account.

// Tried in order: if a model errors (or is retired), the next one answers.
// The worker owns this list; the client can't pick a model.
const MODEL_CHAIN = [
  {
    // Multilingual MoE with ~4B active params: strong Korean, and the cheapest
    // per token of the capable models. It "thinks" by default, which spends
    // the whole token budget on hidden reasoning and leaves the reply empty,
    // so switch that off.
    model: "@cf/google/gemma-4-26b-a4b-it",
    options: { chat_template_kwargs: { enable_thinking: false } },
  },
  { model: "@cf/meta/llama-3.1-8b-instruct-fp8", options: {} },
];

// Only the live site and local dev may call this worker. Browsers always send
// Origin on cross-site POSTs, so this stops other websites from spending our
// Workers AI allowance through it.
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
  "symbols. " +
  // The chat window shows plain text, so Markdown would appear as raw # and *.
  "Write plain text only: no Markdown, no headings, no bold or asterisks. " +
  "Use short lines, and start list items with a simple dash. " +
  "Keep answers brief — usually under 120 words.";

const MAX_REPLY_TOKENS = 512;

const FALLBACK_REPLY =
  "음… 지금 AI가 잠깐 바쁜 것 같아요. 다시 한 번 해볼까요?\n" +
  "(The assistant is busy right now. Please try again in a moment.)";

const DAILY_LIMIT_REPLY =
  "오늘은 AI 도우미가 쉬는 중이에요. 내일 다시 만나요!\n" +
  "(The assistant has used up today's free allowance. Please try again tomorrow.)";

const MAX_MESSAGES = 16;
const MAX_MESSAGE_CHARS = 2000;

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

    if (!env.AI) {
      console.error("kq-chat: missing AI binding");
      return replyJson(FALLBACK_REPLY, { status: 500 });
    }

    const input = {
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      max_tokens: MAX_REPLY_TOKENS,
      temperature: 0.4,
    };

    let lastError = null;

    for (const { model, options } of MODEL_CHAIN) {
      try {
        // Stream when the client asks, so the reply appears word-by-word.
        if (body?.stream === true) {
          const stream = await env.AI.run(model, { ...input, ...options, stream: true });
          return new Response(stream.pipeThrough(sseToText()), {
            headers: {
              "content-type": "text/plain; charset=utf-8",
              "cache-control": "no-store",
              ...corsHeaders(),
            },
          });
        }

        const result = await env.AI.run(model, { ...input, ...options });
        const reply = cleanReply(result?.choices?.[0]?.message?.content ?? result?.response);
        if (reply) return replyJson(reply);
        lastError = new Error(`${model} returned an empty reply`);
      } catch (error) {
        lastError = error;
        console.error(`kq-chat: ${model} failed: ${error?.message || error}`);
        // Out of free neurons: every model shares the allowance, so stop here.
        if (isDailyLimitError(error)) {
          return replyJson(DAILY_LIMIT_REPLY, { status: 429 });
        }
      }
    }

    // Keep the details in the worker logs, not in front of learners.
    console.error(`kq-chat: all models failed: ${lastError?.message || lastError}`);
    return replyJson(FALLBACK_REPLY, { status: 502 });
  },
};

// Workers AI reports an exhausted daily allocation as error 4006.
function isDailyLimitError(error) {
  const text = String(error?.message || error || "");
  return /\b4006\b|daily free allocation|neurons/i.test(text);
}

// Turns the model's server-sent events into plain reply text. Handles both
// OpenAI-style chunks (choices[0].delta.content) and the classic Workers AI
// shape ({ response }).
function sseToText() {
  const decoder = new TextDecoder("utf-8");
  const encoder = new TextEncoder();
  let buffer = "";

  return new TransformStream({
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
          const delta = json?.choices?.[0]?.delta?.content ?? json?.response;
          if (typeof delta === "string" && delta) {
            const clean = delta.replace(/\uFFFD/g, "");
            if (clean) ctrl.enqueue(encoder.encode(clean));
          }
        } catch {
          // Ignore keep-alive or non-JSON lines.
        }
      }
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
