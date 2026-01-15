/*
  Korean Learning AI Chatbot (GitHub Pages + Cloudflare Worker)
  ============================================================
  This frontend DOES NOT call OpenAI directly.
  It calls your Cloudflare Worker endpoint, which holds the API key.
*/

import { getLeaderboard, getPlayer } from "./state.js";

/* -----------------------------
   Leaderboard rendering
------------------------------ */
function renderLeaderboard() {
  const rows = getLeaderboard().slice();
  const me = getPlayer();

  rows.push({ name: "You", xp: me.xp });
  rows.sort((a, b) => b.xp - a.xp);

  const tbody = document.querySelector("#lbTable tbody");
  if (tbody) {
    tbody.innerHTML = rows
      .map(
        (r, i) =>
          `<tr class="${r.name === "You" ? "me" : ""}">
            <td>${i + 1}</td>
            <td>${r.name}</td>
            <td>${r.xp}</td>
          </tr>`
      )
      .join("");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderLeaderboard);
} else {
  renderLeaderboard();
}

/* -----------------------------
   Chatbot (calls Worker)
------------------------------ */

const CHAT_ENDPOINT = "https://crimson-truth-507c.mr-koji-tanaka.workers.dev";
const OPENAI_MODEL = "gpt-4o-mini";

let chatHistory = [];

function initChatbot() {
  const chatbotHTML = `
    <div id="chatbot-widget" class="chatbot-container">
      <div class="chatbot-header">
        <h3>Korean Learning Assistant</h3>
        <button id="chatbot-close" class="chatbot-close-btn" aria-label="Close chatbot">✕</button>
      </div>
      <div id="chatbot-messages" class="chatbot-messages"></div>
      <div class="chatbot-input-area">
        <input 
          id="chatbot-input" 
          type="text" 
          placeholder="Ask about Korean..." 
          aria-label="Message input"
        />
        <button id="chatbot-send" class="chatbot-send-btn" aria-label="Send message">Send</button>
      </div>
    </div>

    <button id="chatbot-toggle" class="chatbot-toggle-btn" aria-label="Open chatbot" title="Korean Learning Assistant">
      #
    </button>
  `;

  document.body.insertAdjacentHTML("beforeend", chatbotHTML);

  const toggleBtn = document.getElementById("chatbot-toggle");
  const closeBtn = document.getElementById("chatbot-close");
  const sendBtn = document.getElementById("chatbot-send");
  const input = document.getElementById("chatbot-input");
  const container = document.getElementById("chatbot-widget");

  toggleBtn.addEventListener("click", () => {
    container.classList.toggle("chatbot-open");
    toggleBtn.classList.toggle("chatbot-hidden");
    if (container.classList.contains("chatbot-open")) input.focus();
  });

  closeBtn.addEventListener("click", () => {
    container.classList.remove("chatbot-open");
    toggleBtn.classList.remove("chatbot-hidden");
  });

  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  addMessage(
    "Welcome! Ask me anything about Korean language, culture, or grammar.",
    "bot"
  );
}

async function callWorker(payload) {
  let res;
  try {
    res = await fetch(CHAT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    throw new Error(`Network error calling Worker: ${err.message}`);
  }

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Worker error (${res.status}): ${text.slice(0, 300)}`);
  }

  // Worker returns OpenAI JSON directly
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Worker returned non-JSON: ${text.slice(0, 300)}`);
  }

  const reply = data?.choices?.[0]?.message?.content;
  if (typeof reply !== "string") {
    throw new Error(`Unexpected Worker response: ${JSON.stringify(data).slice(0, 300)}`);
  }

  return reply;
}

async function sendMessage() {
  const input = document.getElementById("chatbot-input");
  const message = (input.value || "").trim();
  if (!message) return;

  addMessage(message, "user");
  input.value = "";

  const loadingId = "loading-" + Date.now();
  addMessage("Thinking...", "bot", loadingId);

  try {
    const messages = chatHistory.map((msg) => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text,
    }));

    const payload = {
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful Korean language learning assistant. Help users learn Korean grammar, vocabulary, pronunciation, and culture. Be encouraging and provide clear explanations.",
        },
        ...messages,
      ],
      max_tokens: 500,
      temperature: 0.7,
    };

    const botReply = await callWorker(payload);

    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) loadingEl.remove();

    addMessage(botReply, "bot");
  } catch (error) {
    console.error("Chatbot error:", error);

    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) loadingEl.remove();

    addMessage(`Error: ${error.message}`, "bot");
  }
}

function addMessage(text, sender, id = null) {
  const messagesContainer = document.getElementById("chatbot-messages");
  if (!messagesContainer) return;

  const messageEl = document.createElement("div");
  messageEl.className = `chatbot-message chatbot-${sender}`;
  if (id) messageEl.id = id;
  messageEl.textContent = text;

  messagesContainer.appendChild(messageEl);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  if (!id) chatHistory.push({ sender, text });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initChatbot);
} else {
  initChatbot();
}
