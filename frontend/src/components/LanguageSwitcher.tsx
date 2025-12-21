import { useLanguage } from "../i18n/LanguageContext";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
      <button
        onClick={() => setLanguage("en")}
        style={{
          padding: "0.4rem 0.8rem",
          backgroundColor: language === "en" ? "#2563eb" : "transparent",
          color: language === "en" ? "#fff" : "#cbd5e1",
          border: language === "en" ? "1px solid #2563eb" : "1px solid #475569",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "0.9rem",
          fontWeight: language === "en" ? "600" : "400",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          if (language !== "en") {
            e.currentTarget.style.backgroundColor = "#1e293b";
            e.currentTarget.style.borderColor = "#64748b";
          }
        }}
        onMouseLeave={(e) => {
          if (language !== "en") {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.borderColor = "#475569";
          }
        }}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage("fr")}
        style={{
          padding: "0.4rem 0.8rem",
          backgroundColor: language === "fr" ? "#2563eb" : "transparent",
          color: language === "fr" ? "#fff" : "#cbd5e1",
          border: language === "fr" ? "1px solid #2563eb" : "1px solid #475569",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "0.9rem",
          fontWeight: language === "fr" ? "600" : "400",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          if (language !== "fr") {
            e.currentTarget.style.backgroundColor = "#1e293b";
            e.currentTarget.style.borderColor = "#64748b";
          }
        }}
        onMouseLeave={(e) => {
          if (language !== "fr") {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.borderColor = "#475569";
          }
        }}
      >
        FR
      </button>
    </div>
  );
}

