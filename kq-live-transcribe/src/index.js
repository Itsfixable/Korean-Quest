// Captions run on Cloudflare Workers AI (the `AI` binding in wrangler.jsonc).
const MODEL_ID = "@cf/openai/whisper-large-v3-turbo";
const PROVIDER = "workers-ai";

// Caption chunks are a few seconds of 16 kHz mono WAV (well under 1 MB); refuse
// anything far bigger so one request can't eat the daily AI allowance.
const MAX_AUDIO_BYTES = 4 * 1024 * 1024;

// Only the live site and local dev may call this worker. Browsers always send
// Origin on cross-site requests, so this stops other websites from spending our
// Workers AI allowance through it.
const ALLOWED_ORIGINS = new Set([
  "https://itsfixable.github.io",
  "http://localhost:3000",
]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const origin = request.headers.get("Origin");
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return json({ error: "Forbidden origin." }, { status: 403, headers: corsHeaders() });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders(),
      });
    }

    if (url.pathname === "/health") {
      return json(
        { ok: true, model: MODEL_ID, provider: PROVIDER },
        { headers: corsHeaders() }
      );
    }

    if (url.pathname === "/api/transcribe" && request.method === "POST") {
      try {
        const formData = await request.formData();
        const audioFile = formData.get("audio");
        const language = (formData.get("language") || "ko").toString();

        if (!(audioFile instanceof File)) {
          return json(
            { error: "Missing audio file in form field 'audio'." },
            { status: 400, headers: corsHeaders() }
          );
        }

        if (audioFile.size > MAX_AUDIO_BYTES) {
          return json(
            { error: "Audio chunk is too large." },
            { status: 413, headers: corsHeaders() }
          );
        }

        const audioBytes = await audioFile.arrayBuffer();

        let result;
        try {
          result = await env.AI.run(MODEL_ID, {
            audio: toBase64(audioBytes),
            language,
            vad_filter: true,
          });
        } catch (error) {
          // Keep provider details in the worker logs, not the response.
          console.error(`kq-live-transcribe: ${error?.message || error}`);
          return json(
            { error: "Transcription failed." },
            { status: 502, headers: corsHeaders() }
          );
        }

        const text = (result?.text || "").trim();

        return json(
          {
            ok: true,
            text,
            model: MODEL_ID,
            language,
          },
          { headers: corsHeaders() }
        );
      } catch (error) {
        return json(
          {
            error:
              error instanceof Error
                ? error.message
                : "Unknown transcription worker error.",
          },
          { status: 500, headers: corsHeaders() }
        );
      }
    }

    return new Response("Not found", {
      status: 404,
      headers: corsHeaders(),
    });
  },
};

// Base64-encodes in chunks so large buffers don't overflow the call stack.
function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
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