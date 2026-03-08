export default {
  async fetch(request) {
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
          mode: "local-rule-based-summary",
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

        const summary = buildSummaryFromTranscript(transcript);

        return json(summary, { headers: corsHeaders() });
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

function buildSummaryFromTranscript(rawTranscript) {
  const lines = getTranscriptLines(rawTranscript);
  const spokenLines = lines.map(stripSpeakerPrefix).filter(Boolean);

  const allWords = extractWords(spokenLines.join(" "));
  const uniqueWords = unique(allWords);
  const koreanLines = spokenLines.filter(containsKorean);
  const englishLines = spokenLines.filter(
    (line) => /[A-Za-z]/.test(line) && !containsKorean(line)
  );

  const commonWords = getMostFrequentWords(allWords, 6);
  const repeatedLineCount =
    spokenLines.length -
    unique(spokenLines.map((line) => line.toLowerCase())).length;

  const avgWordsPerLine =
    spokenLines.length > 0 ? allWords.length / spokenLines.length : 0;

  const topicsPracticed = buildTopics({
    spokenLines,
    koreanLines,
    englishLines,
    commonWords,
  });

  const wordsUsed = buildWordsUsed({
    rawTranscript,
    commonWords,
  });

  const strengths = buildStrengths({
    spokenLines,
    koreanLines,
    uniqueWords,
    avgWordsPerLine,
  });

  const weaknesses = buildWeaknesses({
    spokenLines,
    koreanLines,
    avgWordsPerLine,
    repeatedLineCount,
    uniqueWords,
  });

  const recommendedNextSteps = buildNextSteps({
    koreanLines,
    avgWordsPerLine,
    repeatedLineCount,
    uniqueWords,
  });

  const dailyQuests = buildDailyQuests({
    koreanLines,
    uniqueWords,
    spokenLines,
  });

  const xpEarned = buildXp({
    spokenLines,
    koreanLines,
    uniqueWords,
  });

  const summaryParagraph = buildSummaryParagraph({
    spokenLines,
    koreanLines,
    englishLines,
    commonWords,
    avgWordsPerLine,
  });

  const coachNote = buildCoachNote({
    koreanLines,
    spokenLines,
    avgWordsPerLine,
  });

  return {
    xpEarned,
    summaryParagraph,
    topicsPracticed,
    wordsUsed,
    strengths,
    weaknesses,
    recommendedNextSteps,
    dailyQuests,
    coachNote,
  };
}

function getTranscriptLines(rawTranscript) {
  return rawTranscript
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function stripSpeakerPrefix(line) {
  return line.replace(/^[A-Za-z가-힣]+:\s*/u, "").trim();
}

function extractWords(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

function unique(array) {
  return [...new Set(array)];
}

function containsKorean(text) {
  return /[\u3131-\u318E\uAC00-\uD7A3]/u.test(text);
}

function getMostFrequentWords(words, limit = 6) {
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "i",
    "you",
    "it",
    "is",
    "am",
    "are",
    "to",
    "and",
    "of",
    "in",
    "my",
    "me",
    "we",
    "our",
    "this",
    "that",
    "for",
    "on",
    "with",
    "at",
    "be",
    "was",
    "were",
    "hello",
    "name",
    "my",
    "is",
    "in",
    "korean",
    "that",
  ]);

  const counts = new Map();

  words.forEach((word) => {
    if (word.length <= 1) return;
    if (stopWords.has(word)) return;
    counts.set(word, (counts.get(word) || 0) + 1);
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

function buildTopics({ spokenLines, koreanLines, englishLines, commonWords }) {
  const topics = [];

  if (spokenLines.length > 0) {
    topics.push("Speaking practice");
  }

  if (spokenLines.some((line) => /hello|안녕|안녕하세요/i.test(line))) {
    topics.push("Greetings");
  }

  if (
    spokenLines.some((line) =>
      /my name is|이름|저는|제 이름/i.test(line)
    )
  ) {
    topics.push("Self-introductions");
  }

  if (koreanLines.length > 0) {
    topics.push("Basic Korean sentence use");
  }

  if (englishLines.length > 0 && koreanLines.length > 0) {
    topics.push("Switching between English and Korean");
  }

  if (!topics.length && commonWords.length) {
    topics.push("Vocabulary practice");
  }

  return unique(topics).slice(0, 5);
}

function buildWordsUsed({ rawTranscript, commonWords }) {
  const koreanMatches =
    rawTranscript.match(/[\u3131-\u318E\uAC00-\uD7A3]+/gu) || [];

  const importantKorean = unique(koreanMatches)
    .filter((word) => word.length >= 2)
    .slice(0, 4);

  return unique([...importantKorean, ...commonWords]).slice(0, 6);
}

function buildStrengths({ spokenLines, koreanLines, uniqueWords, avgWordsPerLine }) {
  const strengths = [];

  if (spokenLines.length >= 3) {
    strengths.push("You stayed engaged with multiple speaking turns.");
  }

  if (koreanLines.length >= 1) {
    strengths.push("You used Korean during the practice instead of staying only in English.");
  }

  if (uniqueWords.length >= 10) {
    strengths.push("You showed some vocabulary variety during the session.");
  }

  if (avgWordsPerLine >= 4) {
    strengths.push("Some responses were long enough to show sentence building.");
  }

  if (!strengths.length) {
    strengths.push("You completed the speaking practice and generated usable transcript data.");
  }

  return strengths.slice(0, 5);
}

function buildWeaknesses({
  spokenLines,
  koreanLines,
  avgWordsPerLine,
  repeatedLineCount,
  uniqueWords,
}) {
  const weaknesses = [];

  if (spokenLines.length < 3) {
    weaknesses.push("The session had limited speaking turns, so there was not much material to analyze.");
  }

  if (koreanLines.length === 0) {
    weaknesses.push("Very little Korean was detected in the transcript.");
  }

  if (avgWordsPerLine < 4) {
    weaknesses.push("Responses were short and could be expanded into fuller sentences.");
  }

  if (repeatedLineCount >= 1) {
    weaknesses.push("Some transcript lines were repeated or partially fragmented.");
  }

  if (uniqueWords.length < 8) {
    weaknesses.push("Vocabulary range was still fairly narrow in this session.");
  }

  return weaknesses.slice(0, 5);
}

function buildNextSteps({ koreanLines, avgWordsPerLine, repeatedLineCount, uniqueWords }) {
  const steps = [];

  if (koreanLines.length < 2) {
    steps.push("Try answering each prompt with at least one full Korean sentence.");
  }

  if (avgWordsPerLine < 5) {
    steps.push("Expand short answers into 2–3 sentence responses.");
  }

  if (repeatedLineCount >= 1) {
    steps.push("Speak more slowly and clearly so the transcript captures your meaning better.");
  }

  if (uniqueWords.length < 10) {
    steps.push("Use a few new Korean vocabulary words in your next call.");
  }

  if (!steps.length) {
    steps.push("Keep practicing longer Korean responses with more detail.");
  }

  return steps.slice(0, 5);
}

function buildDailyQuests({ koreanLines, uniqueWords, spokenLines }) {
  const quests = [];

  quests.push("Say one greeting and one self-introduction in Korean.");
  quests.push("Use at least 3 Korean words in complete sentences.");

  if (spokenLines.length < 4) {
    quests.push("Take at least 4 speaking turns in your next practice call.");
  } else {
    quests.push("Answer one prompt with 3 full sentences.");
  }

  if (koreanLines.length >= 1) {
    quests.push("Repeat your best Korean sentence 5 times for fluency.");
  } else {
    quests.push("Practice introducing yourself fully in Korean.");
  }

  if (uniqueWords.length < 10) {
    quests.push("Learn 3 new Korean vocabulary words before your next session.");
  }

  return unique(quests).slice(0, 5);
}

function buildXp({ spokenLines, koreanLines, uniqueWords }) {
  let xp = 10;

  xp += Math.min(spokenLines.length * 3, 15);
  xp += Math.min(koreanLines.length * 4, 12);
  xp += Math.min(uniqueWords.length, 13);

  return Math.max(5, Math.min(50, Math.round(xp)));
}

function buildSummaryParagraph({
  spokenLines,
  koreanLines,
  englishLines,
  commonWords,
  avgWordsPerLine,
}) {
  const parts = [];

  if (spokenLines.length === 0) {
    return "This call did not contain enough transcript content to summarize.";
  }

  if (spokenLines.some((line) => /hello|안녕|안녕하세요/i.test(line))) {
    parts.push("You practiced greetings during this speaking session.");
  } else {
    parts.push("You completed a Korean speaking practice session.");
  }

  if (
    spokenLines.some((line) =>
      /my name is|이름|저는|제 이름/i.test(line)
    )
  ) {
    parts.push("You also worked on introducing yourself.");
  }

  if (koreanLines.length > 0) {
    parts.push("Korean was used in the transcript, which shows active target-language practice.");
  } else {
    parts.push("Most of the transcript stayed in English, so there is room to increase Korean usage.");
  }

  if (avgWordsPerLine < 4) {
    parts.push("Many responses were still short, so the next step is building longer and more complete answers.");
  } else {
    parts.push("Some responses were developed enough to show emerging sentence structure.");
  }

  if (commonWords.length > 0) {
    parts.push(`Key vocabulary from this call included ${commonWords.join(", ")}.`);
  } else if (englishLines.length > 0) {
    parts.push("The session mixed simple English support with Korean practice.");
  }

  return parts.slice(0, 4).join(" ");
}

function buildCoachNote({ koreanLines, spokenLines, avgWordsPerLine }) {
  if (spokenLines.length <= 1) {
    return "Nice start. Try taking a few more speaking turns next time so the app can give you even better feedback.";
  }

  if (koreanLines.length === 0) {
    return "Good effort. Next time, push yourself to answer in Korean first, even if the sentence is short.";
  }

  if (avgWordsPerLine < 4) {
    return "Nice work using Korean. Your next goal is to turn short replies into fuller sentences with more detail.";
  }

  return "Great progress. You are using Korean in context, and the next step is building confidence with longer, smoother responses.";
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