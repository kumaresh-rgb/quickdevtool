"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/** Toggles the `light` class on <html>; defaults to dark (developer-first). */
export function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("qdn-theme");
    const isLight = stored === "light";
    setLight(isLight);
    document.documentElement.classList.toggle("light", isLight);
  }, []);

  function toggle() {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    localStorage.setItem("qdn-theme", next ? "light" : "dark");
  }

  return (
    <button
      onClick={toggle}
      className="btn btn-ghost p-2"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {light ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
