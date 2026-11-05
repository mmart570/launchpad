import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import StudentLogin from "./pages/StudentLogin";
import StudentDashboard from "./pages/StudentDashboard";
import WorkOrderDetails from "./pages/WorkOrderDetails";
import BusinessPage from "./pages/BusinessPage";
import StudentSignup from "./pages/StudentSignup";
import BusinessAuth from "./pages/BusinessAuth";
import MyApplications from "./pages/MyApplications";
import StudentProfile from "./pages/StudentProfile";
import ForgotPassword from "./pages/ForgotPassword";
import ApplicationSubmission from "./pages/ApplicationSubmission";

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

        {/* Provide routes for student signup. */}
        <Route path="/signup" element={<StudentSignup />} />

        {/* Show details for the work order identified in the URL. */}
        <Route path="/work-orders/:id" element={<WorkOrderDetails />} />

        {/* Provide the business work order posting page. */}
        <Route path="/businesses" element={<BusinessPage />} />

        {/* Provide the business authentication page. */}
        <Route path="/business-auth" element={<BusinessAuth />} />

        {/* Provide the student's applications page. */}
        <Route path="/my-applications" element={<MyApplications />} />

        {/* Provide the student's profile page. */}
        <Route path="/profile" element={<StudentProfile />} />

        {/* Provide the forgot password page route. */}
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Provide the application submission page route. */}
        <Route
          path="/work-orders/:id/apply"
          element={<ApplicationSubmission />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
