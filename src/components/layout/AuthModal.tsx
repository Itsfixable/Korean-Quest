"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";

export function AuthModal() {
  const { authModalOpen, closeAuthModal, login } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (!authModalOpen) return null;

  const handleSubmit = () => {
    if (!name.trim()) return;
    if (!password.trim()) return;
    login(name, email, password);
    setPassword("");
  };

  return (
    <div
      className="kq-auth-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div className="kq-auth-modal" role="dialog" aria-modal="true" aria-labelledby="kqAuthTitle">
        <h3 id="kqAuthTitle">Login / Sign Up</h3>

        <div className="kq-auth-field">
          <label htmlFor="kqFakeName">Name</label>
          <input
            id="kqFakeName"
            type="text"
            placeholder="Enter your name"
            maxLength={30}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="kq-auth-field">
          <label htmlFor="kqFakeEmail">Email</label>
          <input
            id="kqFakeEmail"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="kq-auth-field">
          <label htmlFor="kqFakePass">Password</label>
          <input
            id="kqFakePass"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="kq-auth-actions">
          <button type="button" className="kq-auth-btn" onClick={closeAuthModal}>
            Cancel
          </button>
          <button type="button" className="kq-auth-btn primary" onClick={handleSubmit}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
