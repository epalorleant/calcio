import type { Language } from "../i18n/LanguageContext";

const monthNamesFr = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

const monthNamesEn = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function formatDate(date: Date | string, language: Language = "fr"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  
  const day = d.getDate();
  const month = language === "fr" ? monthNamesFr[d.getMonth()] : monthNamesEn[d.getMonth()];
  const year = d.getFullYear();
  const hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const seconds = d.getSeconds().toString().padStart(2, "0");
  
  if (language === "fr") {
    // Format français: "29 Décembre 2025, 19:00:00"
    return `${day} ${month} ${year}, ${hours.toString().padStart(2, "0")}:${minutes}:${seconds}`;
  } else {
    // Format anglais: "December 29, 2025, 7:00:00 PM"
    const hour12 = hours % 12 || 12;
    const ampm = hours >= 12 ? "PM" : "AM";
    return `${month} ${day}, ${year}, ${hour12}:${minutes}:${seconds} ${ampm}`;
  }
}

export function formatDateOnly(date: Date | string, language: Language = "fr"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  
  const day = d.getDate();
  const month = language === "fr" ? monthNamesFr[d.getMonth()] : monthNamesEn[d.getMonth()];
  const year = d.getFullYear();
  
  if (language === "fr") {
    // Format français: "29 Décembre 2025"
    return `${day} ${month} ${year}`;
  } else {
    // Format anglais: "December 29, 2025"
    return `${month} ${day}, ${year}`;
  }
}

