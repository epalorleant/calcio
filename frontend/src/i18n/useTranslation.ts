import { useMemo } from "react";
import { translations } from "./translations";
import { useLanguage } from "./LanguageContext";

export function useTranslation() {
  const { language } = useLanguage();
  
  return useMemo(() => {
    const t = translations[language];
    
    // Helper function to get translations with optional parameters
    const translate = (key: keyof typeof t, ...args: any[]): string => {
      const value = t[key];
      if (typeof value === "function") {
        return value(...args);
      }
      return value as string;
    };
    
    return { t, translate };
  }, [language]);
}

