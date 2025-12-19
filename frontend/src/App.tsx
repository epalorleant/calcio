import { Link, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import PlayersPage from "./pages/PlayersPage";
import SessionDetailPage from "./pages/SessionDetailPage";
import SessionsPage from "./pages/SessionsPage";
import TemplatesPage from "./pages/TemplatesPage";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="layout">
        <header className="topbar">
          <div className="brand">Calcio</div>
          <nav className="nav">
            <Link to="/players" reloadDocument>Players</Link>
            <Link to="/sessions" reloadDocument>Sessions</Link>
            <Link to="/templates" reloadDocument>Templates</Link>
          </nav>
        </header>

        <main className="content">
          <Routes>
            <Route path="/" element={<SessionsPage />} />
            <Route path="/players" element={<PlayersPage />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/sessions/:id" element={<SessionDetailPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
