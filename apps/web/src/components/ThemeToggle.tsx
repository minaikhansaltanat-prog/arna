"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "@phosphor-icons/react";
import { STORAGE } from "@/lib/site";

/** Light/dark switch (L-08). The inline script in the layout has already applied the saved or system theme. */
export function ThemeToggle({
  toDark,
  toLight,
  className = "",
  withLabel = false,
}: {
  toDark: string;
  toLight: string;
  className?: string;
  withLabel?: boolean;
}) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  }, []);

  const toggle = () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE.theme, next);
    } catch {}
    setTheme(next);
  };

  const label = theme === "dark" ? toLight : toDark;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={withLabel ? `theme-row ${className}` : `icon-btn ${className}`}
    >
      <Sun size={22} weight="duotone" aria-hidden className="theme-sun" />
      <Moon size={22} weight="duotone" aria-hidden className="theme-moon" />
      {withLabel && <span suppressHydrationWarning>{label}</span>}
    </button>
  );
}
