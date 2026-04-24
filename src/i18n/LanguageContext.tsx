import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { TRANSLATIONS, type Lang } from './translations';

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, fallback?: string) => string;
}

const Ctx = createContext<LangCtx | null>(null);

const STORAGE_KEY = 'jansetu.lang';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'en';
    const saved = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
    return saved === 'hi' || saved === 'en' ? saved : 'en';
  });

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ }
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const t = useCallback(
    (key: string, fallback?: string) => TRANSLATIONS[lang][key] ?? fallback ?? key,
    [lang],
  );

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useLang() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLang must be used inside <LanguageProvider>');
  return v;
}
