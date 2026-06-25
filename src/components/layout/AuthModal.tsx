"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { isSupabaseConfigured } from "@/lib/supabase";

type Mode = "signin" | "signup";

export function AuthModal() {
  const {
    authModalOpen,
    closeAuthModal,
    signIn,
    signUp,
    signInWithGoogle,
    authLoading,
    authError,
  } = useAuthStore();

  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const handleSubmit = async () => {
    setNotice(null);
    if (!email.trim() || !password.trim()) return;
    if (mode === "signup" && !name.trim()) return;

    const result =
      mode === "signup" ? await signUp(name, email, password) : await signIn(email, password);

    if (result.ok) {
      setPassword("");
      if (result.needsConfirmation) {
        setNotice("Check your email to confirm your account, then sign in.");
      }
    }
  };

  const handleGoogle = async () => {
    setNotice(null);
    await signInWithGoogle();
  };

  return (
    <div
      className="kq-auth-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div className="kq-auth-modal" role="dialog" aria-modal="true" aria-labelledby="kqAuthTitle">
        <h3 id="kqAuthTitle">{mode === "signup" ? "Create your account" : "Welcome back"}</h3>

        {mode === "signup" && (
          <div className="kq-auth-field">
            <label htmlFor="kqName">Name</label>
            <input
              id="kqName"
              type="text"
              placeholder="Enter your name"
              maxLength={30}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}

        <div className="kq-auth-field">
          <label htmlFor="kqEmail">Email</label>
          <input
            id="kqEmail"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="kq-auth-field">
          <label htmlFor="kqPass">Password</label>
          <input
            id="kqPass"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSubmit();
            }}
          />
        </div>

        {authError && <p className="kq-auth-error">{authError}</p>}
        {notice && <p className="kq-auth-notice">{notice}</p>}

        <div className="kq-auth-actions">
          <button type="button" className="kq-auth-btn" onClick={closeAuthModal}>
            Cancel
          </button>
          <button type="button" className="kq-auth-btn primary" onClick={() => void handleSubmit()} disabled={authLoading}>
            {authLoading ? "Please wait…" : mode === "signup" ? "Sign up" : "Sign in"}
          </button>
        </div>

        {isSupabaseConfigured && (
          <>
            <div className="kq-auth-divider"><span>or</span></div>
            <button
              type="button"
              className="gsi-material-button"
              onClick={() => void handleGoogle()}
              disabled={authLoading}
            >
              <div className="gsi-material-button-state"></div>
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    style={{ display: "block" }}
                  >
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span className="gsi-material-button-contents">
                  {mode === "signup" ? "Sign up with Google" : "Sign in with Google"}
                </span>
                <span style={{ display: "none" }}>
                  {mode === "signup" ? "Sign up with Google" : "Sign in with Google"}
                </span>
              </div>
            </button>
          </>
        )}

        <p className="kq-auth-switch">
          {mode === "signup" ? "Already have an account?" : "New to Korean Quest?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signup" ? "signin" : "signup");
              setNotice(null);
            }}
          >
            {mode === "signup" ? "Sign in" : "Create one"}
          </button>
        </p>
      </div>
    </div>
  );
}
