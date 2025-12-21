import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "fr";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "calcio_language";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Try to get from localStorage, fallback to browser language or default to French
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
    if (stored && (stored === "en" || stored === "fr")) {
      return stored;
    }
    // Check browser language
    const browserLang = navigator.language.split("-")[0];
    return browserLang === "en" ? "en" : "fr";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

