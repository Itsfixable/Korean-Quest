/* 
  Korean Learning AI Chatbot
  ============================
  
  SETUP:
  1. Get your OpenAI API key from https://platform.openai.com/api-keys
  2. Replace the empty string below with your actual API key
  3. The chatbot will appear as a floating circle in the bottom-left of every page
  
  SECURITY NOTE:
  For production, this API key should be stored in a backend server/environment variable.
  Never commit API keys to public repositories.
*/

import { getLeaderboard, getPlayer } from "./state.js";

/* Local leaderboard demo + optional API post example (commented) */
function renderLeaderboard() {
  const rows = getLeaderboard().slice();
  const me = getPlayer();

  // /* Add test/fake data for development */
  // rows.push(
  //   { name: "Test Player 1", xp: 500 },
  //   { name: "Test Player 2", xp: 450 },
  //   { name: "Test Player 3", xp: 400 }
  // );

  rows.push({ name: "You", xp: me.xp });

  rows.sort((a, b) => b.xp - a.xp);
  const tbody = document.querySelector("#lbTable tbody");
  if (tbody) {
    tbody.innerHTML = rows
      .map(
        (r, i) =>
          `<tr class="${r.name === "You" ? "me" : ""}"><td>${i + 1}</td><td>${
            r.name
          }</td><td>${r.xp}</td></tr>`
      )
      .join("");
  }
}

// Ensure DOM is ready before rendering
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderLeaderboard);
} else {
  renderLeaderboard();
}

/* Example: send score to your backend (Supabase/Edge Function)
fetch('/api/submitScore',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'You', xp:me.xp})})
  .then(r=>r.json()).then(console.log).catch(console.error);
*/

/* Floating AI Chatbot for Korean Learning */

const OPENAI_API_KEY = "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";
const OPENAI_MODEL = "gpt-4o-mini";

let chatHistory = [];

function initChatbot() {
  // Create chatbot widget HTML
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

  // Event listeners
  const toggleBtn = document.getElementById("chatbot-toggle");
  const closeBtn = document.getElementById("chatbot-close");
  const sendBtn = document.getElementById("chatbot-send");
  const input = document.getElementById("chatbot-input");
  const container = document.getElementById("chatbot-widget");

  toggleBtn.addEventListener("click", () => {
    container.classList.toggle("chatbot-open");
    toggleBtn.classList.toggle("chatbot-hidden");
    if (container.classList.contains("chatbot-open")) {
      input.focus();
    }
  });

  closeBtn.addEventListener("click", () => {
    container.classList.remove("chatbot-open");
    toggleBtn.classList.remove("chatbot-hidden");
  });

  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  // Add welcome message
  addMessage("Welcome to your Korean Learning Assistant! Ask me anything about Korean language, culture, or grammar.", "bot");
}

async function sendMessage() {
  const input = document.getElementById("chatbot-input");
  const message = input.value.trim();

  if (!message) return;

  if (!OPENAI_API_KEY) {
    addMessage("⚠️ API key not configured. Please add your OpenAI API key to chatbot.js", "bot");
    return;
  }

  // Add user message
  addMessage(message, "user");
  input.value = "";

  // Add loading indicator
  const loadingId = "loading-" + Date.now();
  addMessage("Thinking...", "bot", loadingId);

  try {
    // Build conversation history
    const messages = chatHistory.map((msg) => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text,
    }));

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
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
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      if (error.error?.message) {
        throw new Error(error.error.message);
      }
      throw new Error("Failed to get response from OpenAI");
    }

    const data = await response.json();
    const botReply = data.choices[0].message.content;

    // Remove loading indicator
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) loadingEl.remove();

    // Add bot response
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
  const messageEl = document.createElement("div");
  messageEl.className = `chatbot-message chatbot-${sender}`;
  if (id) messageEl.id = id;
  messageEl.textContent = text;
  messagesContainer.appendChild(messageEl);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // Store in history (skip loading messages)
  if (!id) {
    chatHistory.push({ sender, text });
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initChatbot);
} else {
  initChatbot();
}
