
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/StudentLogin.css";

const API_URL = "http://localhost:3000";

function StudentLogin({ accountCreated = false }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your school email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Login failed. Please check your credentials.",
        );
      }

      if (!result.token || !result.userId) {
        throw new Error("The server did not return a valid login session.");
      }

      // Only allow student accounts on the student login page.
      if (result.role !== "student") {
        throw new Error(
          "This account is not a student account. Please use business login.",
        );
      }

      // Clear any previous session before storing the new one.
      localStorage.removeItem("launchpad_token");
      localStorage.removeItem("launchpad_user");
      sessionStorage.removeItem("launchpad_token");
      sessionStorage.removeItem("launchpad_user");

      // Remember me keeps the session after the browser is closed.
      // Otherwise, the session lasts for the current browser tab.
      const storage = rememberMe ? localStorage : sessionStorage;

      storage.setItem("launchpad_token", result.token);
      storage.setItem(
        "launchpad_user",
        JSON.stringify({
          userId: result.userId,
          role: result.role,
          email: email.trim(),
        }),
      );

      // Redirect to the student's dashboard.
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Login failed:", err);

      setError(
        err.message ||
          "Unable to log in. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="student-login-page">
      <section className="login-brand-panel">
        <Link to="/" className="login-logo">
          Launch<span>Pad</span>
        </Link>

        <div className="login-brand-content">
          <h1>
            Start building your
            <br />
            track record.
          </h1>

          <p>
            Log in to browse real work orders from verified businesses.
          </p>
        </div>

        <div className="login-panel-footer">
          LaunchPad · Student portal
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-card">
          <h2>Welcome back</h2>

          <p className="login-subtitle">
            Log in to your student account.
          </p>

          {accountCreated && (
            <div className="login-success-message" role="status">
              Account created! You can log in now.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="school-email">School email</label>

              <input
                id="school-email"
                type="email"
                placeholder="you@school.edu"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="login-field">
              <label htmlFor="student-password">Password</label>

              <input
                id="student-password"
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <div className="login-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                Remember me
              </label>

              <Link to="/forgot-password">
                Forgot password?
              </Link>
            </div>

            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="login-submit-button"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="login-signup-text">
            New to LaunchPad?{" "}
            <Link to="/signup">Create an account</Link>
          </p>
        </div>
      </section>
    </div>
  );
}

export default StudentLogin;