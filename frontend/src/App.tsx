import { BrowserRouter as Router } from "react-router-dom";
import { LanguageProvider } from "./i18n/LanguageContext";
import { AppContent } from "./AppContent";
import "./App.css";

function App() {
  return (
    <LanguageProvider>
      <Router>
        <AppContent />
      </Router>
    </LanguageProvider>
  );
}

export default App;
