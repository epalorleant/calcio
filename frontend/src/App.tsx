import { BrowserRouter as Router } from "react-router-dom";
import { LanguageProvider } from "./i18n/LanguageContext";
import { AuthProvider } from "./auth/AuthContext";
import { AppContent } from "./AppContent";
import { ToastProvider } from "./components/ui/Toast";
import { ConfirmDialogProvider } from "./components/ui/ConfirmDialog";
import "./App.css";

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ToastProvider>
          <ConfirmDialogProvider>
            <Router>
              <AppContent />
            </Router>
          </ConfirmDialogProvider>
        </ToastProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
