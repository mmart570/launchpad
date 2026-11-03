import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/BusinessAuth.css";

function BusinessAuth() {
  // Keep the selected account mode and field values in sync with the form.
  const [activeTab, setActiveTab] = useState("signup");
  const [form, setForm] = useState({
    businessName: "",
    contactName: "",
    email: "",
    password: "",
  });
  const [notice, setNotice] = useState("");

  // Update only the edited field and clear stale submission feedback.
  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
    setNotice("");
  }

  // Switch account modes without carrying over an old status message.
  function switchTab(tab) {
    setActiveTab(tab);
    setNotice("");
  }

  // Prevent a page reload and explain that authentication is not wired up yet.
  function handleSubmit(event) {
    event.preventDefault();

    if (activeTab === "signup") {
      setNotice("Business registration is not connected to the backend yet.");
    } else {
      setNotice("Business login is not connected to the backend yet.");
    }
  }

  return (
    // Center the branded account card within the page.
    <main className="business-auth-page">
      <div className="business-auth-container">
        {/* Return to the landing page through the LaunchPad wordmark. */}
        <Link to="/" className="business-auth-logo">
          Launch<span>Pad</span>
          <small> for Business</small>
        </Link>

        {/* Let businesses switch between registration and login forms. */}
        <section className="business-auth-card">
          <div
            className="business-auth-tabs"
            role="tablist"
            aria-label="Business account"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "login"}
              className={activeTab === "login" ? "active" : ""}
              onClick={() => switchTab("login")}
            >
              Log in
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "signup"}
              className={activeTab === "signup" ? "active" : ""}
              onClick={() => switchTab("signup")}
            >
              Sign up
            </button>
          </div>

          <form className="business-auth-form" onSubmit={handleSubmit}>
            {/* Request organization and contact details only during signup. */}
            {activeTab === "signup" && (
              <>
                <div className="business-auth-field">
                  <label htmlFor="business-name">Business name</label>
                  <input
                    id="business-name"
                    name="businessName"
                    type="text"
                    placeholder="[Business name]"
                    value={form.businessName}
                    onChange={handleChange}
                    autoComplete="organization"
                    required
                  />
                </div>

                <div className="business-auth-field">
                  <label htmlFor="contact-name">Contact name</label>
                  <input
                    id="contact-name"
                    name="contactName"
                    type="text"
                    placeholder="[Contact name]"
                    value={form.contactName}
                    onChange={handleChange}
                    autoComplete="name"
                    required
                  />
                </div>
              </>
            )}

            {/* Collect credentials in both account modes. */}
            <div className="business-auth-field">
              <label htmlFor="business-email">Work email</label>
              <input
                id="business-email"
                name="email"
                type="email"
                placeholder="[you@company.com]"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>

            {/* Use mode-specific password guidance and submit labels. */}
            <div className="business-auth-field">
              <label htmlFor="business-password">Password</label>
              <input
                id="business-password"
                name="password"
                type="password"
                placeholder="[Password]"
                value={form.password}
                onChange={handleChange}
                autoComplete={
                  activeTab === "signup" ? "new-password" : "current-password"
                }
                minLength={activeTab === "signup" ? 8 : undefined}
                required
              />
            </div>

            {/* Submit the selected account action and show status feedback. */}
            <button type="submit" className="business-auth-submit">
              {activeTab === "signup" ? "Create business account" : "Log in"}
            </button>

            {/* Announce submission status accessibly when feedback is available. */}
            {notice && (
              <p className="business-auth-notice" role="status">
                {notice}
              </p>
            )}
          </form>

          {/* Explain the review process only to prospective new accounts. */}
          {activeTab === "signup" && (
            <p className="business-auth-footer">
              We review each business before work orders go live.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

export default BusinessAuth;
