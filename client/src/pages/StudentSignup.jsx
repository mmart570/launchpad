import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/StudentSignup.css";

// Each validator returns an error message, or "" when the value is fine.
const validators = {
  name: (v) => (v.trim() ? "" : "Enter your full name."),
  email: (v) => {
    const value = v.trim();
    if (!value) return "Enter your school email.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "Enter a valid email, like you@school.edu.";
    }
    // To limit sign-ups to .edu addresses, add:
    // if (!/\.edu$/i.test(value)) return "Use your school email ending in .edu.";
    return "";
  },
  major: (v) => (v.trim() ? "" : "Enter your major."),
  year: (v) => (v ? "" : "Select your graduation year."),
  password: (v) => {
    if (!v) return "Create a password.";
    if (v.length < 8) return "Use at least 8 characters.";
    if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) {
      return "Include at least one letter and one number.";
    }
    return "";
  },
};

const FIELD_IDS = ["name", "email", "major", "year", "password"];
const EMPTY_VALUES = { name: "", email: "", major: "", year: "", password: "" };

/* ---------- API call ---------- */

// Replace the body of this function with your real sign-up request,
// or pass your own function to the component through the onSignUp prop.
async function defaultCreateAccount(data) {
  // const res = await fetch("/api/students/signup", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(data),
  // });
  // if (!res.ok) throw new Error("Sign-up failed");
  // return res.json();
  return new Promise((resolve) => setTimeout(resolve, 600));
}

/* ---------- Component ---------- */

export default function StudentSignup({
  onSignUp = defaultCreateAccount,
  homeHref = "/",
  loginHref = "/login",
  helpHref = "/help",
}) {
  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | submitting | success | failure
  const inputRefs = useRef({});

  // Graduation years: last year through six years out.
  const years = useMemo(() => {
    const thisYear = new Date().getFullYear();
    return Array.from({ length: 8 }, (_, i) => thisYear - 1 + i);
  }, []);

  const validateField = (id, value) => {
    const message = validators[id](value);
    setErrors((prev) => ({ ...prev, [id]: message }));
    return !message;
  };

  const handleChange = (id, value) => {
    setValues((prev) => ({ ...prev, [id]: value }));
    // Clear an existing error as soon as the person starts fixing it.
    if (errors[id]) validateField(id, value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("idle");

    let firstInvalid = null;
    FIELD_IDS.forEach((id) => {
      if (!validateField(id, values[id]) && !firstInvalid) firstInvalid = id;
    });
    if (firstInvalid) {
      inputRefs.current[firstInvalid]?.focus();
      return;
    }

    setStatus("submitting");
    try {
      await onSignUp({
        name: values.name.trim(),
        email: values.email.trim(),
        major: values.major.trim(),
        graduationYear: values.year,
        password: values.password,
      });
      setValues(EMPTY_VALUES);
      setErrors({});
      setStatus("success");
    } catch {
      setStatus("failure");
    }
  };

  // Shared props for every input so labels, errors, and refs stay wired up.
  const fieldProps = (id, extraDescribedBy = "") => ({
    id,
    name: id,
    value: values[id],
    onChange: (e) => handleChange(id, e.target.value),
    onBlur: () => validateField(id, values[id]),
    "aria-invalid": errors[id] ? "true" : "false",
    "aria-describedby":
      [extraDescribedBy, errors[id] ? `${id}-error` : ""].filter(Boolean).join(" ") ||
      undefined,
    ref: (el) => {
      inputRefs.current[id] = el;
    },
  });

  const renderError = (id) =>
    errors[id] ? (
      <p id={`${id}-error`} className="su-error">
        {errors[id]}
      </p>
    ) : null;

  const submitting = status === "submitting";

  return (
    <>
      <div className="su-page">
      <section className="su-brand">
            <Link className="su-logo" to={homeHref}>
                Launch<span>Pad</span>
            </Link>

            <div className="su-brand-content">
                <h1>
                Your first real
                <br />
                project is waiting.
                </h1>
                <p>Create a free student account to browse work orders from verified businesses.</p>
            </div>

            <div className="su-brand-footer">
                <Link to={helpHref}>Need help?</Link>
            </div>
        </section>

        <main className="su-panel">
          <div className="su-card">
            <h2>Create your account</h2>
            <p className="su-lead">It takes a few minutes.</p>

            {status === "success" && (
              <div className="su-banner su-success" role="status">
                Account created! You can log in now.
              </div>
            )}
            {status === "failure" && (
              <div className="su-banner su-failure" role="status">
                We could not create your account. Check your connection and try again.
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="su-field">
                <label htmlFor="name">Full name</label>
                <input className="su-input" type="text" autoComplete="name" {...fieldProps("name")} />
                {renderError("name")}
              </div>

              <div className="su-field">
                <label htmlFor="email">School email</label>
                <input
                  className="su-input"
                  type="email"
                  autoComplete="email"
                  placeholder="you@school.edu"
                  {...fieldProps("email")}
                />
                {renderError("email")}
              </div>

              <div className="su-row">
                <div className="su-field">
                  <label htmlFor="major">Major</label>
                  <input className="su-input" type="text" autoComplete="off" {...fieldProps("major")} />
                  {renderError("major")}
                </div>
                <div className="su-field">
                  <label htmlFor="year">Graduation year</label>
                  <select className="su-input" {...fieldProps("year")}>
                    <option value="">Select</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  {renderError("year")}
                </div>
              </div>

              <div className="su-field">
                <label htmlFor="password">Password</label>
                <div className="su-pw">
                  <input
                    className="su-input"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    {...fieldProps("password", "password-hint")}
                  />
                  <button
                    type="button"
                    className="su-toggle"
                    aria-pressed={showPassword}
                    aria-controls="password"
                    onClick={() => setShowPassword((s) => !s)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <p id="password-hint" className="su-hint">
                  Use at least 8 characters with a letter and a number.
                </p>
                {renderError("password")}
              </div>

              <button type="submit" className="su-btn" disabled={submitting}>
                {submitting ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className="su-alt">
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </div>
        </main>
      </div>
    </>
  );
}