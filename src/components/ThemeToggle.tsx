"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("qdn-theme");
    const isDark = stored === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("light", !isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("light", !next);
    localStorage.setItem("qdn-theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      className="btn btn-ghost p-2"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
