"use client";

import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true); // Asumimos oscuro por defecto en tu diseño

useEffect(() => {
    // Al cargar, verificamos qué tema prefiere el usuario o el navegador
    const theme = localStorage.getItem("tema");
    const isDarkMode = theme === "oscuro" || (!theme && document.documentElement.classList.contains("dark"));
    setIsDark(isDarkMode);
    if (isDarkMode) {
    document.documentElement.classList.add("dark");
    } else {
    document.documentElement.classList.remove("dark");
    }
}, []);

const toggleTheme = () => {
    const html = document.documentElement;
    if (isDark) {
    html.classList.remove("dark");
    localStorage.setItem("tema", "claro");
    setIsDark(false);
    } else {
    html.classList.add("dark");
    localStorage.setItem("tema", "oscuro");
    setIsDark(true);
    }
};

return (
    <Button
    variant="outline"
    size="icon"
    onClick={toggleTheme}
    className="h-10 w-10 rounded-xl bg-[#0a0f1a]/50 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
    aria-label="Alternar tema"
    >
    {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
);
}