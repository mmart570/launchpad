import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/StudentLogin.css";

function StudentLogin({ accountCreated = false }) {
  // Store the current form values and submission feedback.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  // Validate required credentials and report the current authentication status.
  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your school email and password.");
      return;
    }

    // Replace this placeholder with the backend authentication request.
    setError("Login is not connected to the server yet.");
  }

  return (
    // Separate the branded introduction from the credential form.
    <div className="student-login-page">
      <section className="login-brand-panel">
        {/* Link the brand mark to the application's home page. */}
        <Link to="/" className="login-logo">
          Launch<span>Pad</span>
        </Link>

        {/* Explain the platform's value to students. */}
        <div className="login-brand-content">
          <h1>
            Start building your
            <br />
            track record.
          </h1>
          <p>Log in to browse real work orders from verified businesses.</p>
        </div>

        {/* Reserve a location for support details or footer content. */}
        <div className="login-panel-footer">[Footer or support link]</div>
      </section>

      {/* Present the login form and account-related messaging. */}
      <section className="login-form-panel">
        <div className="login-card">
          <h2>Welcome back</h2>
          <p className="login-subtitle">Log in to your student account.</p>

          {/* Confirm account creation for users returning from registration. */}
          {accountCreated && (
            <div className="login-success-message">
              Account created! You can log in now.
            </div>
          )}

          {/* Collect credentials and handle form submission. */}
          <form onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="school-email">School email</label>
              <input
                id="school-email"
                type="email"
                placeholder="[you@school.edu]"
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
                placeholder="[Password]"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            {/* Provide session preference and password recovery options. */}
            <div className="login-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                Remember me
              </label>

              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            {/* Announce form errors to users and assistive technologies. */}
            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="login-submit-button">
              Log in
            </button>
          </form>

          {/* Direct prospective users to account registration. */}
          <p className="login-signup-text">
            New to LaunchPad? <Link to="/signup">Create an account</Link>
          </p>
        </div>
      </section>
    </div>
  );
}

export default StudentLogin;
