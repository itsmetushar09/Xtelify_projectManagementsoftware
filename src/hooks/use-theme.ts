import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";
const KEY = "taskforge.theme";

function apply(t: Theme) {
  const root = document.documentElement;
  const sysDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = t === "dark" || (t === "system" && sysDark);
  root.classList.toggle("dark", dark);
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("system");

  useEffect(() => {
    const stored = (localStorage.getItem(KEY) as Theme) || "system";
    setThemeState(stored);
    apply(stored);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      if ((localStorage.getItem(KEY) as Theme) === "system") apply("system");
    };
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  const setTheme = (t: Theme) => {
    localStorage.setItem(KEY, t);
    setThemeState(t);
    apply(t);
  };

  return { theme, setTheme };
}
