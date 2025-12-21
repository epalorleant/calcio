import { useLanguage } from "../i18n/LanguageContext";
import { formatDate, formatDateOnly } from "../utils/dateFormat";

export function useDateFormat() {
  const { language } = useLanguage();
  
  return {
    formatDate: (date: Date | string) => formatDate(date, language),
    formatDateOnly: (date: Date | string) => formatDateOnly(date, language),
  };
}

