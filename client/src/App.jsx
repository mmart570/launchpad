// ============================================================================
// LAUNCHPAD CLIENT - React App Main Component
// ============================================================================
// This file sets up the main application routing and authentication flow

import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Page imports - Landing and Auth
import LandingPage from "./pages/LandingPage";
import StudentLogin from "./pages/StudentLogin";
import StudentSignup from "./pages/StudentSignup";
import BusinessAuth from "./pages/BusinessAuth";
import ForgotPassword from "./pages/ForgotPassword";

// Page imports - Student Pages
import StudentDashboard from "./pages/StudentDashboard";
import StudentProfile from "./pages/StudentProfile";
import StudentPublicProfile from "./pages/StudentPublicProfile";
import MyApplications from "./pages/MyApplications";
import ApplicationSubmission from "./pages/ApplicationSubmission";
import StudentWorkSubmission from "./pages/StudentWorkSubmission";
import WorkOrderDetails from "./pages/WorkOrderDetails";

// Page imports - Business Pages
import BusinessDashboard from "./pages/BusinessDashboard";
import BusinessPage from "./pages/BusinessPage";
import BusinessMessages from "./pages/BusinessMessages";
import BusinessSubmissionReview from "./pages/BusinessSubmissionReview";
import WorkOrderSuccess from "./pages/WorkOrderSuccess";

// ============================================================================
// CONFIGURATION
// ============================================================================
const API_URL = "http://localhost:3000";

// ============================================================================
// AUTHENTICATION UTILITIES
// ============================================================================

// Retrieve saved login session from browser storage (sessionStorage or localStorage)
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
      // Ignore invalid saved session data
    }
  }

  return null;
}

// Custom hook to verify saved session token with backend and get user role
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

        // Session expired or invalid - clear stored credentials
        if (response.status === 401) {
          for (const storage of [sessionStorage, localStorage]) {
            storage.removeItem("launchpad_token");
            storage.removeItem("launchpad_user");
          }

          throw new Error("Session has expired or is invalid.");
        }

        if (!response.ok) {
          throw new Error("Unable to verify session.");
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

    // Re-check session when tab comes into focus
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        checkSession();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return auth;
}

// ============================================================================
// ROUTE PROTECTION
// ============================================================================

// Component to protect routes that require a specific user role
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

  // Redirect if user has wrong role
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

// Dynamic routing for work order display (different views for students vs businesses)
function WorkOrderRoute() {
  const auth = useAuthenticatedRole();
  if (auth.loading)
    return <p style={{ padding: 24 }}>Checking your session...</p>;
  if (!auth.role) return <Navigate to="/login" replace />;
  return auth.role === "business" ? <BusinessMessages /> : <WorkOrderDetails />;
}

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* =====================================================
            PUBLIC ROUTES (No authentication required)
            ===================================================== */}

        {/* Landing page - first page users see */}
        <Route path="/" element={<LandingPage />} />

        {/* Student authentication routes */}
        <Route path="/login" element={<StudentLogin />} />
        <Route path="/signup" element={<StudentSignup />} />

        {/* Business authentication routes */}
        <Route path="/business-auth" element={<BusinessAuth />} />

        {/* Password recovery for both roles */}
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* =====================================================
            STUDENT-ONLY ROUTES (Require student role)
            ===================================================== */}

        {/* Student dashboard - main hub for students */}
        <Route
          path="/dashboard"
          element={
            <RequireRole role="student">
              <StudentDashboard />
            </RequireRole>
          }
        />

        {/* Student profile management */}
        <Route
          path="/profile"
          element={
            <RequireRole role="student">
              <StudentProfile />
            </RequireRole>
          }
        />

        {/* View all submitted applications */}
        <Route
          path="/my-applications"
          element={
            <RequireRole role="student">
              <MyApplications />
            </RequireRole>
          }
        />

        {/* View work order details and apply */}
        <Route path="/work-orders/:id" element={<WorkOrderRoute />} />

        {/* Apply to a specific work order */}
        <Route
          path="/work-orders/:id/apply"
          element={
            <RequireRole role="student">
              <ApplicationSubmission />
            </RequireRole>
          }
        />

        {/* Submit completed work to an accepted work order */}
        <Route
          path="/student/work-orders/:id/submit"
          element={
            <RequireRole role="student">
              <StudentWorkSubmission />
            </RequireRole>
          }
        />

        {/* =====================================================
            BUSINESS-ONLY ROUTES (Require business role)
            ===================================================== */}

        {/* Business dashboard - main hub for businesses */}
        <Route
          path="/business-dashboard"
          element={
            <RequireRole role="business">
              <BusinessDashboard />
            </RequireRole>
          }
        />

        {/* Create and manage work orders */}
        <Route
          path="/businesses"
          element={
            <RequireRole role="business">
              <BusinessPage />
            </RequireRole>
          }
        />

        {/* Edit existing work order */}
        <Route
          path="/businesses/edit/:id"
          element={
            <RequireRole role="business">
              <BusinessPage />
            </RequireRole>
          }
        />

        {/* Work order creation success page */}
        <Route
          path="/businesses/success"
          element={
            <RequireRole role="business">
              <WorkOrderSuccess />
            </RequireRole>
          }
        />

        {/* View student public profile (businesses only) */}
        <Route
          path="/students/:id"
          element={
            <RequireRole role="business">
              <StudentPublicProfile />
            </RequireRole>
          }
        />

        {/* Message thread with selected student */}
        <Route
          path="/business/work-orders/:id/messages"
          element={
            <RequireRole role="business">
              <BusinessMessages />
            </RequireRole>
          }
        />

        {/* Review student work submissions */}
        <Route
          path="/business/work-orders/:id/submissions"
          element={
            <RequireRole role="business">
              <BusinessSubmissionReview />
            </RequireRole>
          }
        />

        {/* =====================================================
            CATCH-ALL ROUTE (404 handling)
            ===================================================== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
