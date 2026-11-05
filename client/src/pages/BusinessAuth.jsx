
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/BusinessAuth.css";

const API_URL = "http://localhost:3000";

function BusinessAuth() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("signup");
  const [form, setForm] = useState({
    businessName: "",
    contactName: "",
    email: "",
    password: "",
  });

  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setNotice("");
  }

  function switchTab(tab) {
    if (loading) return;

    setActiveTab(tab);
    setNotice("");
    setNoticeType("");
    setForm((previous) => ({
      ...previous,
      password: "",
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setNotice("");
    setNoticeType("");
    setLoading(true);

    try {
      const isSignup = activeTab === "signup";

      const endpoint = isSignup
        ? `${API_URL}/api/auth/register`
        : `${API_URL}/api/auth/login`;

      let payload;

      if (isSignup) {
        payload = {
          email: form.email.trim(),
          password: form.password,
          role: "business",
          businessProfile: {
            companyName: form.businessName.trim(),
            contactName: form.contactName.trim(),
          },
        };
      } else {
        payload = {
          email: form.email.trim(),
          password: form.password,
        };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            (isSignup
              ? "Unable to create your business account."
              : "Unable to log in."),
        );
      }

      if (!result.userId || !result.token) {
        throw new Error(
          "The server did not return valid account credentials.",
        );
      }

      if (result.role !== "business") {
        throw new Error(
          "This is not a business account. Please use student login.",
        );
      }

      if (isSignup) {
        // Keep registration and login as separate steps.
        setNotice("Business account created! You can log in now.");
        setNoticeType("success");
        setActiveTab("login");
        setForm((previous) => ({
          ...previous,
          password: "",
        }));
        return;
      }

      // Clear any previous student or business session.
      localStorage.removeItem("launchpad_token");
      localStorage.removeItem("launchpad_user");
      sessionStorage.removeItem("launchpad_token");
      sessionStorage.removeItem("launchpad_user");

      // Store the business session for the prototype.
      sessionStorage.setItem("launchpad_token", result.token);
      sessionStorage.setItem(
        "launchpad_user",
        JSON.stringify({
          userId: result.userId,
          role: result.role,
          email: form.email.trim(),
        }),
      );

      navigate("/business-dashboard", { replace: true });
    } catch (error) {
      console.error("Business authentication failed:", error);
      setNotice(
        error.message ||
          "Something went wrong. Please check your connection.",
      );
      setNoticeType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="business-auth-page">
      <div className="business-auth-container">
        <Link to="/" className="business-auth-logo">
          Launch<span>Pad</span>
          <small> for Business</small>
        </Link>

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
            {activeTab === "signup" && (
              <>
                <div className="business-auth-field">
                  <label htmlFor="business-name">Business name</label>
                  <input
                    id="business-name"
                    name="businessName"
                    type="text"
                    placeholder="Business name"
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
                    placeholder="Contact name"
                    value={form.contactName}
                    onChange={handleChange}
                    autoComplete="name"
                    required
                  />
                </div>
              </>
            )}

            <div className="business-auth-field">
              <label htmlFor="business-email">Work email</label>
              <input
                id="business-email"
                name="email"
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>

            <div className="business-auth-field">
              <label htmlFor="business-password">Password</label>
              <input
                id="business-password"
                name="password"
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                autoComplete={
                  activeTab === "signup"
                    ? "new-password"
                    : "current-password"
                }
                minLength={activeTab === "signup" ? 8 : undefined}
                required
              />
            </div>

            <button
              type="submit"
              className="business-auth-submit"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : activeTab === "signup"
                  ? "Create business account"
                  : "Log in"}
            </button>

            {notice && (
              <p
                className="business-auth-notice"
                role={noticeType === "error" ? "alert" : "status"}
              >
                {notice}
              </p>
            )}
          </form>

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