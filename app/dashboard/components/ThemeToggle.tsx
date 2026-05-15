"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" || "dark";
    setTheme(savedTheme);
    if (savedTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    
    if (newTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  };

  return (
    <button 
      onClick={toggleTheme}
      className="flex items-center justify-center gap-2 px-4 py-3 mt-2 rounded-xl bg-secondary text-foreground hover:bg-card transition-all border border-border-ui shadow-sm active:scale-95 group w-full"
    >
      {theme === "dark" ? (
        <>
          <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-90 transition-transform" />
          <span className="text-sm font-semibold">Modo Claro</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-indigo-500 group-hover:-rotate-12 transition-transform" />
          <span className="text-sm font-semibold">Modo Oscuro</span>
        </>
      )}
    </button>
  );
}
