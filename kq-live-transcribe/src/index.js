const MODEL_ID = "openai/whisper-large-v3";
const HF_PROVIDER = "hf-inference";

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
        { ok: true, model: MODEL_ID, provider: HF_PROVIDER },
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

        const audioBytes = await audioFile.arrayBuffer();

        const hfResponse = await fetch(
          `https://router.huggingface.co/hf-inference/models/${MODEL_ID}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${env.HF_TOKEN}`,
              "Content-Type": "audio/wav",
              "X-Wait-For-Model": "true",
            },
            body: audioBytes,
          }
        );

        const rawText = await hfResponse.text();
        let parsed;

        try {
          parsed = JSON.parse(rawText);
        } catch {
          parsed = null;
        }

        if (!hfResponse.ok) {
          return json(
            {
              error:
                parsed?.error ||
                parsed?.message ||
                `Hugging Face request failed with status ${hfResponse.status}.`,
              details: parsed || rawText,
            },
            { status: hfResponse.status, headers: corsHeaders() }
          );
        }

        const text =
          parsed?.text ||
          parsed?.generated_text ||
          parsed?.transcription ||
          "";

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