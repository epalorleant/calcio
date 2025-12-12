import React from "react";
import ReactDOM from "react-dom/client";

const App: React.FC = () => {
  return <div>Calcio frontend scaffold</div>;
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
