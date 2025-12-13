import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Admin from "./pages/Admin";
import Players from "./pages/Players";
import Sessions from "./pages/Sessions";
import "./index.css";

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <nav>
          <Link to="/">Sessions</Link>
          <Link to="/players">Players</Link>
          <Link to="/admin">Admin</Link>
        </nav>
        <main>
          <Routes>
            <Route path="/" element={<Sessions />} />
            <Route path="/players" element={<Players />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
