/* Korean Learning AI Chatbot (GitHub Pages + Cloudflare Worker)
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
  if (!tbody) return;

  tbody.innerHTML = rows
    .map(
      (r, i) => `
        <tr class="${r.name === "You" ? "me" : ""}">
          <td>${i + 1}</td>
          <td>${r.name}</td>
          <td>${r.xp}</td>
        </tr>
      `
    )
    .join("");
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
  // Professional chat bubble icon (inline SVG, inherits currentColor)
  const chatIconSVG = `
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false">
      <path fill="currentColor"
        d="M12 3C7.03 3 3 6.58 3 11c0 2.02.86 3.86 2.3 5.3L5 21l4.98-1.64
           c.64.18 1.32.28 2.02.28 4.97 0 9-3.58 9-8s-4.03-8-9-8Zm0 14.6
           c-.64 0-1.25-.09-1.82-.25l-.44-.13-2.84.93.9-2.66-.34-.33
           C5.6 13.99 5 12.57 5 11c0-3.31 3.13-6 7-6s7 2.69 7 6-3.13 6-7 6Z" />
    </svg>
  `;

  const chatbotHTML = `
    <!-- Floating toggle -->
    <button id="chatbot-toggle" class="chatbot-toggle-btn" type="button" aria-label="Open chat">
      ${chatIconSVG}
    </button>

    <!-- Widget -->
    <section id="chatbot-widget" class="chatbot-container" aria-label="Korean Learning Assistant">
      <header class="chatbot-header">
        <h3>Korean Learning Assistant</h3>
        <button id="chatbot-close" class="chatbot-close-btn" type="button" aria-label="Close chat">✕</button>
      </header>

      <div id="chatbot-messages" class="chatbot-messages" aria-live="polite"></div>

      <div class="chatbot-input-area">
        <input id="chatbot-input" type="text" placeholder="Ask about Korean..." autocomplete="off" />
        <button id="chatbot-send" class="chatbot-send-btn" type="button">Send</button>
      </div>
    </section>
  `;

  // Prevent duplicates if script is loaded on multiple pages
  if (!document.getElementById("chatbot-toggle")) {
    document.body.insertAdjacentHTML("beforeend", chatbotHTML);
  }

  const toggleBtn = document.getElementById("chatbot-toggle");
  const closeBtn = document.getElementById("chatbot-close");
  const sendBtn = document.getElementById("chatbot-send");
  const input = document.getElementById("chatbot-input");
  const container = document.getElementById("chatbot-widget");

  if (!toggleBtn || !closeBtn || !sendBtn || !input || !container) return;

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

  addMessage("Welcome! Ask me anything about Korean language, culture, or grammar.", "bot");
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
  const message = (input?.value || "").trim();
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
            "You are a helpful Korean language learning assistant.\n" +
            "Help users learn Korean grammar, vocabulary, pronunciation, and culture.\n" +
            "Be encouraging and provide clear explanations.",
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
