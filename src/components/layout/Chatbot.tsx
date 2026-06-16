"use client";

import { useRef, useState } from "react";
import { asset } from "@/lib/asset";

const CHAT_ENDPOINT = "https://crimson-truth-507c.mr-koji-tanaka.workers.dev";
const MODEL = "HuggingFaceTB/SmolLM3-3B:hf-inference";
const MAX_HISTORY = 14;

interface ChatMessage {
  role: "user" | "bot";
  text: string;
}

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "bot", text: "Welcome! Ask me anything about Korean language, culture, or grammar." },
  ]);
  const [loading, setLoading] = useState(false);
  const historyRef = useRef<{ role: string; content: string }[]>([]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);

    historyRef.current = [
      ...historyRef.current,
      { role: "user", content: text },
    ].slice(-MAX_HISTORY);

    try {
      const res = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyRef.current, model: MODEL }),
      });
      const data = await res.json();
      const reply = data?.reply || data?.message || "Sorry, I could not respond right now.";
      historyRef.current = [
        ...historyRef.current,
        { role: "assistant", content: reply },
      ].slice(-MAX_HISTORY);
      setMessages((m) => [...m, { role: "bot", text: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "bot", text: "Connection error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        id="chatbot-toggle"
        className={`chatbot-toggle-btn${open ? " chatbot-hidden" : ""}`}
        aria-label="Open chatbot"
        onClick={() => setOpen(true)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="chatbot-toggle-icon"
          src={asset("/favicon/chatbot.png")}
          alt="Chatbot"
          width={200}
          height={200}
          draggable={false}
        />
      </button>

      <div
        id="chatbot-widget"
        className={`chatbot-container${open ? " chatbot-open" : ""}`}
        aria-live="polite"
      >
        <div className="chatbot-header">
          <h3>Korean Learning Assistant</h3>
          <button
            id="chatbot-close"
            className="chatbot-close-btn"
            aria-label="Close chatbot"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
        </div>

        <div id="chatbot-messages" className="chatbot-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chatbot-message ${msg.role}`}>
              {msg.text}
            </div>
          ))}
          {loading && <div className="chatbot-message bot">Thinking...</div>}
        </div>

        <div className="chatbot-input-area">
          <input
            id="chatbot-input"
            type="text"
            placeholder="Ask a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
          />
          <button
            id="chatbot-send"
            className="chatbot-send-btn"
            onClick={sendMessage}
            disabled={loading}
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
}
