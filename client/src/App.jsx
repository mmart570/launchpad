import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import StudentLogin from "./pages/StudentLogin";
import StudentDashboard from "./pages/StudentDashboard";
import WorkOrderDetails from "./pages/WorkOrderDetails";
import BusinessPage from "./pages/BusinessPage";

// Configure client-side routes for student and business pages.
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Render the landing page at the root URL. */}
        <Route path="/" element={<LandingPage />} />

        {/* Provide routes for student login and dashboard pages. */}
        <Route path="/login" element={<StudentLogin />} />
        <Route path="/dashboard" element={<StudentDashboard />} />

        {/* Show details for the work order identified in the URL. */}
        <Route path="/work-orders/:id" element={<WorkOrderDetails />} />

        {/* Provide the business work order posting page. */}
        <Route path="/businesses" element={<BusinessPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
