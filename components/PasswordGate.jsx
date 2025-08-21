"use client";

import { Eye, EyeOff } from "lucide-react";
import React, { useState, useEffect } from "react";

const PASSWORD_KEY = "multi_screen_password";

export default function PasswordGate({ children }) {
  // Use NEXT_PUBLIC_APP_PASSWORD for client-side access
  const appPassword = process.env.NEXT_PUBLIC_APP_PASSWORD;
  const [showPassword, setShowPassword] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Check localStorage for previous unlock
    const saved = localStorage.getItem(PASSWORD_KEY);
    if (saved && saved === appPassword) {
      setUnlocked(true);
    }
  }, [appPassword]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input === appPassword) {
      setUnlocked(true);
      localStorage.setItem(PASSWORD_KEY, input);
      setError("");
    } else {
      setError("Incorrect password. Please try again.");
    }
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-sm"
        >
          <h2 className="text-2xl font-bold mb-4 text-center">Enter Password</h2>
          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full p-3 rounded border border-gray-700 bg-gray-800 text-white pr-12"
              placeholder="Password"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 px-2 py-1"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded"
          >
            Unlock
          </button>
          {error && <p className="text-red-400 mt-3 text-center">{error}</p>}
        </form>
      </div>
    );
  }
  return children;
}
