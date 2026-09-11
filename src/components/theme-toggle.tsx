"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
        <Sun className="h-4 w-4 opacity-50" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 rounded-full hover:bg-accent/80 transition-all text-foreground"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle dark/light mode"
    >
      {theme === "dark" ? (
        <Sun className="h-4.5 w-4.5 text-amber-400 animate-in spin-in-90 duration-300" />
      ) : (
        <Moon className="h-4.5 w-4.5 text-slate-700 dark:text-slate-200 animate-in spin-in-90 duration-300" />
      )}
    </Button>
  );
}
