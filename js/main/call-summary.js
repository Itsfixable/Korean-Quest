const SUMMARY_ENDPOINT =
  "https://kq-call-summary.mr-koji-tanaka.workers.dev/api/summary";

const els = {
  transcript: document.getElementById("callTranscript"),
  aiSummaryBtn: document.getElementById("aiSummaryBtn"),
  aiSummaryStatus: document.getElementById("aiSummaryStatus"),

  // AI summary section
  summarySection: document.getElementById("summarySection"),
  summaryXp: document.getElementById("summaryXp"),
  summaryTopics: document.getElementById("summaryTopics"),
  summaryWords: document.getElementById("summaryWords"),
  summaryStrengths: document.getElementById("summaryStrengths"),
  summaryWeaknesses: document.getElementById("summaryWeaknesses"),
  summaryRecommendations: document.getElementById("summaryRecommendations"),
  summaryDailyQuests: document.getElementById("summaryDailyQuests"),
  summaryCoachNote: document.getElementById("summaryCoachNote"),
  summaryParagraph: document.getElementById("summaryParagraph"),

  // Constructed feedback section
  feedbackSection: document.getElementById("constructedFeedbackSection"),
  feedbackParticipation: document.getElementById("feedbackParticipation"),
  feedbackVocabulary: document.getElementById("feedbackVocabulary"),
  feedbackKoreanUse: document.getElementById("feedbackKoreanUse"),
  feedbackClarity: document.getElementById("feedbackClarity"),
  feedbackNextStep: document.getElementById("feedbackNextStep"),
  feedbackStrengthsList: document.getElementById("feedbackStrengthsList"),
  feedbackFocusList: document.getElementById("feedbackFocusList"),
};

function setStatus(text) {
  if (els.aiSummaryStatus) {
    els.aiSummaryStatus.textContent = text;
  }
}

function fillList(target, items) {
  if (!target) return;

  target.innerHTML = "";

  const safeItems = Array.isArray(items) ? items : [];

  safeItems.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    target.appendChild(li);
  });
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

function containsKorean(text) {
  return /[\u3131-\u318E\uAC00-\uD7A3]/u.test(text);
}

function unique(array) {
  return [...new Set(array)];
}

function getMostFrequentWords(words, limit = 8) {
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

function buildConstructedFeedback(rawTranscript) {
  const lines = getTranscriptLines(rawTranscript);
  const spokenLines = lines.map(stripSpeakerPrefix).filter(Boolean);

  const allWords = extractWords(spokenLines.join(" "));
  const uniqueWords = unique(allWords);
  const koreanLines = spokenLines.filter(containsKorean);
  const repeatedLineCount =
    spokenLines.length -
    unique(spokenLines.map((line) => line.toLowerCase())).length;

  const avgWordsPerLine =
    spokenLines.length > 0 ? allWords.length / spokenLines.length : 0;

  getMostFrequentWords(allWords, 8);

  let participation = "Very limited participation.";
  if (spokenLines.length >= 8) {
    participation = "Strong participation with multiple speaking turns.";
  } else if (spokenLines.length >= 4) {
    participation = "Solid participation with a few complete speaking turns.";
  } else if (spokenLines.length >= 2) {
    participation = "Basic participation with short responses.";
  }

  let vocabulary = "Very limited range of vocabulary so far.";
  if (uniqueWords.length >= 35) {
    vocabulary = "Strong vocabulary range with varied word choice.";
  } else if (uniqueWords.length >= 20) {
    vocabulary = "Good vocabulary variety with room to expand further.";
  } else if (uniqueWords.length >= 10) {
    vocabulary = "Developing vocabulary range with some repetition.";
  }

  let koreanUse = "Very little Korean detected in the transcript.";
  if (koreanLines.length >= 4) {
    koreanUse =
      "Strong Korean usage was detected throughout the speaking practice.";
  } else if (koreanLines.length >= 2) {
    koreanUse = "Some Korean usage was detected, which is a good sign.";
  } else if (koreanLines.length >= 1) {
    koreanUse =
      "A little Korean was used. Try to increase it in the next round.";
  }

  let clarity = "Responses were extremely short, so clarity is hard to judge.";
  if (avgWordsPerLine >= 8) {
    clarity =
      "Responses were fairly developed and easier to understand as complete thoughts.";
  } else if (avgWordsPerLine >= 4) {
    clarity =
      "Responses were understandable but could be expanded with more detail.";
  } else if (avgWordsPerLine >= 2) {
    clarity =
      "Responses were brief. Try to answer in longer, fuller sentences.";
  }

  const strengths = [];
  const focusAreas = [];

  if (spokenLines.length >= 4) {
    strengths.push("You consistently stayed engaged in the speaking task.");
  } else {
    focusAreas.push(
      "Try to speak more often so the practice session has more usable material."
    );
  }

  if (koreanLines.length >= 1) {
    strengths.push(
      "You used Korean during the session instead of staying only in English."
    );
  } else {
    focusAreas.push(
      "Use at least one or two full Korean responses in each session."
    );
  }

  if (uniqueWords.length >= 15) {
    strengths.push(
      "You showed some vocabulary variety instead of repeating only one phrase."
    );
  } else {
    focusAreas.push(
      "Work on using a wider range of words instead of repeating the same response style."
    );
  }

  if (avgWordsPerLine < 4) {
    focusAreas.push(
      "Try to turn short answers into full sentences with extra detail."
    );
  } else {
    strengths.push(
      "Some responses were long enough to show actual sentence building."
    );
  }

  if (repeatedLineCount >= 2) {
    focusAreas.push(
      "Some transcript lines were repeated. Slow down and speak clearly to improve transcription quality."
    );
  }

  const nextStep =
    koreanLines.length > 0
      ? "Next time, answer in 2–3 full Korean sentences for each prompt."
      : "Next time, begin every response in Korean first, then add English only if needed.";

  return {
    participation,
    vocabulary,
    koreanUse,
    clarity,
    nextStep,
    strengths,
    focusAreas,
  };
}

function renderConstructedFeedback(rawTranscript) {
  if (!els.feedbackSection) return;

  const feedback = buildConstructedFeedback(rawTranscript);

  els.feedbackSection.hidden = false;

  if (els.feedbackParticipation) {
    els.feedbackParticipation.textContent = feedback.participation;
  }

  if (els.feedbackVocabulary) {
    els.feedbackVocabulary.textContent = feedback.vocabulary;
  }

  if (els.feedbackKoreanUse) {
    els.feedbackKoreanUse.textContent = feedback.koreanUse;
  }

  if (els.feedbackClarity) {
    els.feedbackClarity.textContent = feedback.clarity;
  }

  if (els.feedbackNextStep) {
    els.feedbackNextStep.textContent = feedback.nextStep;
  }

  fillList(els.feedbackStrengthsList, feedback.strengths);
  fillList(els.feedbackFocusList, feedback.focusAreas);
}

function fillAiSummary(data) {
  if (els.summarySection) {
    els.summarySection.hidden = false;
  }

  if (els.summaryXp) {
    els.summaryXp.textContent = data.xpEarned ?? 0;
  }

  if (els.summaryParagraph) {
    els.summaryParagraph.textContent =
      data.summaryParagraph || "No summary paragraph available.";
  }

  fillList(els.summaryTopics, data.topicsPracticed);
  fillList(els.summaryWords, data.wordsUsed);
  fillList(els.summaryStrengths, data.strengths);
  fillList(els.summaryWeaknesses, data.weaknesses);
  fillList(els.summaryRecommendations, data.recommendedNextSteps);
  fillList(els.summaryDailyQuests, data.dailyQuests);

  if (els.summaryCoachNote) {
    els.summaryCoachNote.textContent = data.coachNote || "Nice work.";
  }
}

async function generateSummary() {
  const transcript = els.transcript?.value?.trim() || "";

  if (!transcript) {
    setStatus("Add or capture some transcript text first.");
    return;
  }

  renderConstructedFeedback(transcript);

  if (els.aiSummaryBtn) {
    els.aiSummaryBtn.disabled = true;
  }

  setStatus("Generating constructed feedback and AI summary...");

  try {
    const response = await fetch(SUMMARY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transcript,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Summary request failed.");
    }

    fillAiSummary(data);
    setStatus("Constructed feedback and AI summary generated.");
  } catch (error) {
    console.error(error);
    setStatus(
      error.message ||
        "Could not generate AI summary, but constructed feedback is still available."
    );
  } finally {
    if (els.aiSummaryBtn) {
      els.aiSummaryBtn.disabled = false;
    }
  }
}

if (els.aiSummaryBtn) {
  els.aiSummaryBtn.addEventListener("click", generateSummary);
}