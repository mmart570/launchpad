import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import StudentLogin from "./pages/StudentLogin";
import StudentDashboard from "./pages/StudentDashboard";
import WorkOrderDetails from "./pages/WorkOrderDetails";

// Configure the application's client-side routes.
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Show the landing page at the root URL. */}
        <Route path="/" element={<LandingPage />} />

        {/* Provide routes for student account and project pages. */}
        <Route path="/login" element={<StudentLogin />} />
        <Route path="/dashboard" element={<StudentDashboard />} />

        {/* Pass the selected work order ID to its details page. */}
        <Route path="/work-orders/:id" element={<WorkOrderDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
