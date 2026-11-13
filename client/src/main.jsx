// ============================================================================
// LAUNCHPAD CLIENT ENTRY POINT
// ============================================================================
// Main entry file that mounts the React application to the DOM

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Mount the React application to the DOM element with id="root"
// StrictMode enables additional development checks and warnings
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
