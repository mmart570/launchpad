import { BrowserRouter, Routes, Route } from "react-router-dom";

// Import the page components used by the application's routes.
import LandingPage from "./pages/LandingPage";
import StudentLogin from "./pages/StudentLogin";
import StudentDashboard from "./pages/StudentDashboard";

// Set up client-side navigation for the main application pages.
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Render the landing page at the root URL. */}
        <Route path="/" element={<LandingPage />} />

        {/* Render student login and dashboard pages at their respective URLs. */}
        <Route path="/login" element={<StudentLogin />} />
        <Route path="/dashboard" element={<StudentDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
