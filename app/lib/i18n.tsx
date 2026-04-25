"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Lang = "zh" | "en";
const KEY = "chokepoint:lang";

type Ctx = { lang: Lang; setLang: (l: Lang) => void };

const LangContext = createContext<Ctx>({ lang: "zh", setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("zh");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY) as Lang | null;
      if (saved === "en" || saved === "zh") setLangState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

/** Inline-bilingual helper: t("中文", "English") returns the active one. */
export function useT() {
  const { lang } = useLang();
  return useCallback((zh: string, en: string) => (lang === "zh" ? zh : en), [lang]);
}

/** Pick a key from a bilingual record. */
export function useTr() {
  const { lang } = useLang();
  return useCallback(<T,>(record: { zh: T; en: T }): T => record[lang], [lang]);
}

/** Read current lang outside React (e.g. for fetch call payloads). Defaults to zh during SSR. */
export function readLangSync(): Lang {
  if (typeof window === "undefined") return "zh";
  try {
    const saved = window.localStorage.getItem(KEY) as Lang | null;
    if (saved === "en" || saved === "zh") return saved;
  } catch {
    /* ignore */
  }
  return "zh";
}
