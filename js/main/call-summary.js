const SUMMARY_API_URL =
  "https://kq-call-summary.mr-koji-tanaka.workers.dev/api/call-summary";

const els = {
  transcript: document.getElementById("callTranscript"),
  notes: document.getElementById("sharedNotes"),
  missionTitle: document.getElementById("missionTitle"),
  missionDesc: document.getElementById("missionDesc"),
  promptText: document.getElementById("promptText"),
  promptSubtext: document.getElementById("promptSubtext"),
  timer: document.getElementById("callTimer"),
  wordList: document.getElementById("wordList"),

  aiSummaryBtn: document.getElementById("aiSummaryBtn"),
  aiSummaryStatus: document.getElementById("aiSummaryStatus"),

  summarySection: document.getElementById("summarySection"),
  summaryTopics: document.getElementById("summaryTopics"),
  summaryWords: document.getElementById("summaryWords"),
  summaryStrengths: document.getElementById("summaryStrengths"),
  summaryWeaknesses: document.getElementById("summaryWeaknesses"),
  summaryRecommendations: document.getElementById("summaryRecommendations"),
  summaryDailyQuests: document.getElementById("summaryDailyQuests"),
  summaryCoachNote: document.getElementById("summaryCoachNote"),
  summaryXp: document.getElementById("summaryXp"),
};

function parseTimerToSeconds(value) {
  if (!value) return 0;
  const parts = value.split(":").map(Number);
  if (parts.length !== 2 || parts.some(Number.isNaN)) return 0;
  return parts[0] * 60 + parts[1];
}

function getTrackedWords() {
  if (!els.wordList) return [];

  const chips = [...els.wordList.querySelectorAll(".chip")];

  return chips
    .map((chip) => {
      const text = chip.textContent || "";
      return text.replace("×", "").trim();
    })
    .filter(Boolean);
}

function makeList(target, items) {
  if (!target) return;

  target.innerHTML = "";

  if (!Array.isArray(items) || items.length === 0) {
    const li = document.createElement("li");
    li.textContent = "None yet.";
    target.appendChild(li);
    return;
  }

  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    target.appendChild(li);
  });
}

function setStatus(message, isError = false) {
  if (!els.aiSummaryStatus) return;
  els.aiSummaryStatus.textContent = message;
  els.aiSummaryStatus.style.color = isError ? "#cd4a4a" : "";
}

async function generateAiSummary() {
  const transcript = els.transcript?.value?.trim() || "";
  const notes = els.notes?.value?.trim() || "";

  if (!transcript && !notes) {
    setStatus("Add a transcript or notes first.", true);
    return;
  }

  if (!els.aiSummaryBtn) return;

  els.aiSummaryBtn.disabled = true;
  setStatus("Generating AI summary...");

  try {
    const payload = {
      transcript,
      notes,
      missionTitle: els.missionTitle?.textContent?.trim() || "",
      missionDesc: els.missionDesc?.textContent?.trim() || "",
      promptEnglish: els.promptText?.textContent?.trim() || "",
      promptKorean: els.promptSubtext?.textContent?.trim() || "",
      words: getTrackedWords(),
      durationSeconds: parseTimerToSeconds(
        els.timer?.textContent?.trim() || "00:00"
      ),
    };

    const response = await fetch(SUMMARY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const rawText = await response.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new Error(`Worker returned non-JSON: ${rawText.slice(0, 400)}`);
    }

    if (!response.ok || !data.ok) {
      throw new Error(data?.error || "Summary request failed.");
    }

    const summary = data.summary || {};

    makeList(els.summaryTopics, summary.topics);
    makeList(els.summaryWords, summary.wordsUsed);
    makeList(els.summaryStrengths, summary.strengths);
    makeList(els.summaryWeaknesses, summary.weaknesses);
    makeList(els.summaryRecommendations, summary.recommendations);
    makeList(els.summaryDailyQuests, summary.dailyQuests);

    if (els.summaryCoachNote) {
      els.summaryCoachNote.textContent = summary.coachNote || "Nice work.";
    }

    if (els.summaryXp) {
      const xpValueEl = document.getElementById("xpValue");
      els.summaryXp.textContent = xpValueEl?.textContent?.trim() || "0";
    }

    if (els.summarySection) {
      els.summarySection.hidden = false;
      els.summarySection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    setStatus("AI summary ready.");
  } catch (error) {
    console.error("AI summary error:", error);
    setStatus(`Error: ${error.message}`, true);
  } finally {
    els.aiSummaryBtn.disabled = false;
  }
}

function initCallSummary() {
  if (!els.aiSummaryBtn) return;
  els.aiSummaryBtn.addEventListener("click", generateAiSummary);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCallSummary);
} else {
  initCallSummary();
}