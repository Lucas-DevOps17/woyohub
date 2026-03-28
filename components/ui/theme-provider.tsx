"use client";

import { createContext, useContext, useState, useEffect } from "react";

type ThemeContextType = {
  dark: boolean;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  dark: false,
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("woyohub-theme");
    if (stored === "dark") {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  function toggle() {
    setDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("woyohub-theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("woyohub-theme", "light");
      }
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function DarkToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="relative w-12 h-[26px] rounded-full transition-colors duration-300 flex items-center"
      style={{ background: dark ? "var(--primary)" : "var(--surface-dim)", padding: 3 }}
    >
      <div
        className="w-5 h-5 rounded-full bg-white flex items-center justify-center transition-transform duration-300 text-[10px]"
        style={{ transform: dark ? "translateX(22px)" : "translateX(0)" }}
      >
        {dark ? "🌙" : "☀️"}
      </div>
    </button>
  );
}
