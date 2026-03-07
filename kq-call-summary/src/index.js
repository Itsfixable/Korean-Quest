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
        { ok: true, service: "kq-call-summary" },
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

        return json(
          {
            xpEarned: 25,
            topicsPracticed: ["Introductions", "Basic Korean speaking"],
            wordsUsed: ["안녕하세요", "이름", "저는"],
            strengths: [
              "Used Korean during the speaking practice",
              "Participated with multiple speaking turns",
            ],
            weaknesses: [
              "Some responses were short",
              "A few transcript lines were unclear",
            ],
            recommendedNextSteps: [
              "Answer in 2–3 full Korean sentences",
              "Practice self-introductions again",
            ],
            dailyQuests: [
              "Say your name in Korean 5 times",
              "Use 3 new Korean words in a sentence",
            ],
            coachNote:
              "Nice effort. Keep practicing longer Korean responses with clearer sentence structure.",
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