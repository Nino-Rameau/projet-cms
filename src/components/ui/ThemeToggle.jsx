"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

function getStoredTheme() {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem("pb-theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function ThemeToggle({ compact = false }) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const resolved = getStoredTheme();
    setTheme(resolved);
    document.documentElement.classList.toggle("dark", resolved === "dark");
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    window.localStorage.setItem("pb-theme", nextTheme);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Basculer le thème"
      className={`inline-flex items-center gap-2 rounded-lg border border-pb-border bg-pb-background px-3 py-2 text-sm font-semibold hover:bg-pb-border/25 transition ${compact ? "px-2.5 py-1.5 text-xs" : ""}`}
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      <span>{theme === "dark" ? "Mode clair" : "Mode sombre"}</span>
    </button>
  );
}
