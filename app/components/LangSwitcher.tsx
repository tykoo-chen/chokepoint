"use client";
import { useLang } from "@/app/lib/i18n";

export default function LangSwitcher() {
  const { lang, setLang } = useLang();
  const sel = "text-amber bg-amber/10 border border-amber-dim";
  const idle = "text-faint hover:text-amber border border-line";
  return (
    <div className="fixed bottom-3 left-3 z-50 panel-raised flex items-center gap-1 px-1.5 py-1 text-[10px] tracking-widest shadow-lg">
      <span className="text-faint pl-1 pr-2 border-r border-line">LANG</span>
      <button
        type="button"
        onClick={() => setLang("zh")}
        aria-pressed={lang === "zh"}
        className={`px-2 py-0.5 transition-colors ${lang === "zh" ? sel : idle}`}
      >
        中
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={`px-2 py-0.5 transition-colors ${lang === "en" ? sel : idle}`}
      >
        EN
      </button>
    </div>
  );
}
