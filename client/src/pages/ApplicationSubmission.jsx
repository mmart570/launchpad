import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import "../styles/ApplicationSubmission.css";

// Placeholder data until the work order API is connected.
const workOrder = {
  title: "[Work order title]",
  business: "[Business name]",
  pay: "[Amount]",
};

function ApplicationSubmission() {
  // Track the application fields, feedback, and confirmed submission state.
  const { id } = useParams();
  const [note, setNote] = useState("");
  const [availability, setAvailability] = useState("");
  const [notice, setNotice] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Validate required content before attempting the backend submission.
  function handleSubmit(event) {
    event.preventDefault();

    if (!note.trim() || !availability.trim()) {
      setNotice("Please complete both fields before submitting.");
      return;
    }

    // TODO: POST the application to your Express backend.
    // Only setSubmitted(true) after the server confirms it was saved.
    setNotice("Application submission is not connected to the backend yet.");
    setSubmitted(false);
  }

  return (
    <div className="application-submission-page">
      {/* Provide the brand link and navigation to student account pages. */}
      <header className="application-submission-navbar">
        <Link to="/" className="application-submission-logo">
          Launch<span>Pad</span>
        </Link>

        <nav
          className="application-submission-nav"
          aria-label="Student navigation"
        >
          <Link to="/dashboard" className="active">
            Dashboard
          </Link>
          <Link to="/my-applications">My applications</Link>
          <Link to="/profile">Profile</Link>
          <Link
            to="/profile"
            className="application-submission-avatar"
            aria-label="My profile"
          >
            [AB]
          </Link>
        </nav>
      </header>

      {/* Keep the application form and next-step confirmation side by side. */}
      <main className="application-submission-main">
        <div className="application-submission-grid">
          {/* Collect a short introduction and the student's availability. */}
          <section className="application-submission-section">
            <h2 className="application-submission-step">
              1. Submit application
            </h2>

            <div className="application-submission-card">
              <h1>Apply for this work order</h1>

              <div className="application-submission-divider" />

              <div className="application-submission-work-order">
                <div className="application-submission-business-icon">[BN]</div>

                <div>
                  <h3>{workOrder.title}</h3>
                  <p>
                    {workOrder.business} · Pay {workOrder.pay}
                  </p>
                </div>
              </div>

              {/* Clear stale feedback as the student edits either required field. */}
              <form onSubmit={handleSubmit}>
                <div className="application-submission-field">
                  <label htmlFor="application-note">Note to the business</label>
                  <textarea
                    id="application-note"
                    placeholder="[Why you are a good fit]"
                    value={note}
                    onChange={(event) => {
                      setNote(event.target.value);
                      setNotice("");
                    }}
                    rows={5}
                    required
                  />
                </div>

                <div className="application-submission-field">
                  <label htmlFor="application-availability">Availability</label>
                  <input
                    id="application-availability"
                    type="text"
                    placeholder="[e.g. Available this week]"
                    value={availability}
                    onChange={(event) => {
                      setAvailability(event.target.value);
                      setNotice("");
                    }}
                    required
                  />
                </div>

                <button type="submit" className="application-submission-submit">
                  Submit application
                </button>

                {notice && (
                  <p className="application-submission-notice" role="status">
                    {notice}
                  </p>
                )}
              </form>
            </div>
          </section>

          {/* Explain what follows submission and link to useful destinations. */}
          <section className="application-submission-section">
            <h2 className="application-submission-step">2. Confirmation</h2>

            <div className="application-confirmation-card">
              <div
                className="application-confirmation-check"
                aria-hidden="true"
              >
                ✓
              </div>

              <h2>
                {submitted
                  ? "Application submitted!"
                  : "Application confirmation"}
              </h2>

              <p className="application-confirmation-description">
                {submitted
                  ? "Your application has been sent to the business."
                  : "This is where your submission confirmation will appear."}
              </p>

              <div className="application-confirmation-steps">
                <p>
                  <span>✓</span> The business reviews your application.
                </p>
                <p>
                  <span>✓</span> You get a notification with the decision.
                </p>
                <p>
                  <span>✓</span> Accepted work shows up in My applications.
                </p>
              </div>

              <div className="application-confirmation-actions">
                <Link
                  to="/my-applications"
                  className="application-confirmation-primary"
                >
                  View my applications
                </Link>

                <Link
                  to="/dashboard"
                  className="application-confirmation-secondary"
                >
                  Back to dashboard
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default ApplicationSubmission;
