"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { useTheme } from "@/components/admin/ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-full p-2.5 text-muted transition-colors hover:bg-white/30 hover:text-primary-500 dark:hover:bg-white/10"
      aria-label={mounted && theme === "dark" ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"}
      suppressHydrationWarning
    >
      {mounted && theme === "dark" ? (
        <Sun className="h-5 w-5" strokeWidth={2} />
      ) : (
        <Moon className="h-5 w-5" strokeWidth={2} />
      )}
    </button>
  );
}
