import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import StudentLogin from "./pages/StudentLogin";
import StudentDashboard from "./pages/StudentDashboard";
import WorkOrderDetails from "./pages/WorkOrderDetails";
import BusinessPage from "./pages/BusinessPage";
import StudentSignup from "./pages/StudentSignup";
import BusinessAuth from "./pages/BusinessAuth";
import MyApplications from "./pages/MyApplications";
import ForgotPassword from "./pages/ForgotPassword";
import ApplicationSubmission from "./pages/ApplicationSubmission";
import BusinessDashboard from "./pages/BusinessDashboard";
import StudentProfile from "./pages/StudentProfile";
import StudentPublicProfile from "./pages/StudentPublicProfile";
import WorkOrderSuccess from "./pages/WorkOrderSuccess";
import StudentWorkSubmission from "./pages/StudentWorkSubmission";
import BusinessSubmissionReview from "./pages/BusinessSubmissionReview";
import Messages from "./pages/Messages";

const API_URL = "http://localhost:3000";

// Find the saved login session.
function getSavedSession() {
  for (const storage of [sessionStorage, localStorage]) {
    const token = storage.getItem("launchpad_token");
    const userText = storage.getItem("launchpad_user");

    if (!token || !userText) continue;

    try {
      const user = JSON.parse(userText);

      if (
        user.userId &&
        (user.role === "student" || user.role === "business")
      ) {
        return { token, role: user.role };
      }
    } catch {
      // Ignore invalid saved session data.
    }
  }

  return null;
}

// Verify the saved token and role with the backend.
function useAuthenticatedRole() {
  const [auth, setAuth] = useState({
    loading: true,
    role: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      const saved = getSavedSession();

      if (!saved) {
        setAuth({ loading: false, role: null });
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${saved.token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Session is no longer valid.");
        }

        const user = await response.json();

        if (!cancelled) {
          setAuth({
            loading: false,
            role:
              user.role === "student" || user.role === "business"
                ? user.role
                : null,
          });
        }
      } catch {
        if (!cancelled) {
          setAuth({ loading: false, role: null });
        }
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  return auth;
}

// Protect pages that require a specific account role.
function RequireRole({ role, children }) {
  const auth = useAuthenticatedRole();

  if (auth.loading) {
    return <p style={{ padding: "24px" }}>Checking your session...</p>;
  }

  if (!auth.role) {
    return (
      <Navigate
        to={role === "business" ? "/business-auth" : "/login"}
        replace
      />
    );
  }

  if (auth.role !== role) {
    return (
      <Navigate
        to={auth.role === "business" ? "/business-dashboard" : "/dashboard"}
        replace
      />
    );
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* Student authentication */}
        <Route path="/login" element={<StudentLogin />} />
        <Route path="/signup" element={<StudentSignup />} />

        {/* Business authentication */}
        <Route path="/business-auth" element={<BusinessAuth />} />

        {/* Password recovery */}
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Student-only pages */}
        <Route
          path="/dashboard"
          element={
            <RequireRole role="student">
              <StudentDashboard />
            </RequireRole>
          }
        />

        <Route
          path="/profile"
          element={
            <RequireRole role="student">
              <StudentProfile />
            </RequireRole>
          }
        />

        <Route
          path="/my-applications"
          element={
            <RequireRole role="student">
              <MyApplications />
            </RequireRole>
          }
        />

        <Route
          path="/work-orders/:id"
          element={
            <RequireRole role="student">
              <WorkOrderDetails />
            </RequireRole>
          }
        />

        <Route
          path="/work-orders/:id/apply"
          element={
            <RequireRole role="student">
              <ApplicationSubmission />
            </RequireRole>
          }
        />

        {/* Business-only pages */}
        <Route
          path="/business-dashboard"
          element={
            <RequireRole role="business">
              <BusinessDashboard />
            </RequireRole>
          }
        />

        <Route
          path="/businesses"
          element={
            <RequireRole role="business">
              <BusinessPage />
            </RequireRole>
          }
        />

        <Route
          path="/students/:id"
          element={
            <RequireRole role="business">
              <StudentPublicProfile />
            </RequireRole>
          }
        />

        {/* Unknown URLs return to landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />

        {/* Business edit and success pages */}
        <Route path="/businesses/edit/:id" element={<BusinessPage />} />

        {/* Business success page */}
        <Route path="/businesses/success" element={<WorkOrderSuccess />} />

        {/* Student work submission and business submission review pages */}
        <Route path="/student/work-orders/:id/submit" element={<StudentWorkSubmission />} />

        {/* Student work submission page */}
        <Route path="/business/work-orders/:id/submissions" element={<BusinessSubmissionReview />} />
          
        {/* Messages page*/}
        <Route path="/messages" element ={<Messages />}/>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
