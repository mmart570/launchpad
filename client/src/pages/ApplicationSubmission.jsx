/*
╔════════════════════════════════════════════════════════════════════════════╗
║                     ApplicationSubmission.jsx                              ║
║                                                                            ║
║  Student work application submission form page. Allows students to         ║
║  submit applications to work orders with a note about availability.        ║
║  Shows work order summary and confirmation message after submission.       ║
║                                                                            ║
║  Key Features:                                                             ║
║  - Retrieves work order details from server                                ║
║  - Checks for existing pending applications (prevents duplicates)          ║
║  - Form validation for note and availability fields                        ║
║  - Success message with next steps after submission                        ║
║  - Responsive layout with form card and confirmation panel                 ║
╚════════════════════════════════════════════════════════════════════════════╝
*/

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "../styles/ApplicationSubmission.css";
import ProfileDropdown from "../components/ProfileDropdown";

const API_URL = "http://localhost:3000";

function getStudentSession() {
  for (const storage of [sessionStorage, localStorage]) {
    const token = storage.getItem("launchpad_token");
    const userText = storage.getItem("launchpad_user");

    if (!token || !userText) continue;

    try {
      const user = JSON.parse(userText);

      if (user.role === "student") {
        return { token, user };
      }
    } catch {
      // Ignore invalid saved session information.
    }
  }

  return null;
}

function ApplicationSubmission() {
  const { id } = useParams();

  const [workOrder, setWorkOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [orderError, setOrderError] = useState("");

  const [note, setNote] = useState("");
  const [availability, setAvailability] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingApplication, setExistingApplication] = useState(null);
  const [checkingApplication, setCheckingApplication] = useState(true);
  const [applicationError, setApplicationError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadMyApplication() {
      const session = getStudentSession();
      if (!session) {
        if (!cancelled) { setCheckingApplication(false); setApplicationError("Please log in with your student account."); }
        return;
      }
      try {
        const response = await fetch(`${API_URL}/api/applications/my`, {
          headers: { Authorization: `Bearer ${session.token}` },
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !Array.isArray(data)) {
          throw new Error(data?.error || "Unable to check existing applications.");
        }
        const existing = data.find((item) =>
          String(item.workOrderId?._id || item.workOrderId) === String(id)
        ) || null;
        if (!cancelled) {
          setExistingApplication(existing);
          if (existing) {
            const saved = existing.message || "";
            const match = saved.match(/(?:^|\n)Availability: ([^\n]*)\s*$/);
            setAvailability(match ? match[1].trim() : "");
            setNote(match ? saved.slice(0, match.index).trim() : saved.trim());
          }
        }
      } catch (err) {
        if (!cancelled) setApplicationError(err.message);
      } finally {
        if (!cancelled) setCheckingApplication(false);
      }
    }
    loadMyApplication();
    return () => { cancelled = true; };
  }, [id]);


  // Load the real work order from MongoDB.
  useEffect(() => {
    let cancelled = false;

    async function loadWorkOrder() {
      try {
        setLoadingOrder(true);
        setOrderError("");

        const response = await fetch(`${API_URL}/api/work-orders/${id}`);

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(result?.error || "Unable to load this work order.");
        }

        if (!cancelled) {
          setWorkOrder(result);
        }
      } catch (error) {
        if (!cancelled) {
          setOrderError(error.message);
        }
      } finally {
        if (!cancelled) {
          setLoadingOrder(false);
        }
      }
    }

    loadWorkOrder();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Submit the student's application to MongoDB.
  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting || submitted || checkingApplication || applicationError) return;
    if (existingApplication && existingApplication.status !== "pending") {
      return setNotice("Only pending applications can be edited.");
    }

    setNotice("");

    if (!note.trim() || !availability.trim()) {
      setNotice("Please complete both fields before submitting.");
      return;
    }

    if (!workOrder || (!existingApplication && workOrder.status !== "open")) {
      setNotice("This work order is not available for applications.");
      return;
    }

    const session = getStudentSession();

    if (!session) {
      setNotice("Please log in with your student account before applying.");
      return;
    }

    setSubmitting(true);

    try {
      // Save both form answers in the backend's message field.
      const message = [
        note.trim(),
        "",
        `Availability: ${availability.trim()}`,
      ].join("\n");

      const response = await fetch(
        existingApplication
          ? `${API_URL}/api/applications/${existingApplication._id}`
          : `${API_URL}/api/work-orders/${id}/applications`,
        {
          method: existingApplication ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({ message }),
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            `Unable to submit application (${response.status}).`,
        );
      }

      // Only show confirmation after the backend succeeds.
      setSubmitted(true);
      setNotice("");
    } catch (error) {
      console.error("Application submission failed:", error);

      setNotice(
        error.message || "Unable to submit your application. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const businessName =
    workOrder?.businessId?.businessProfile?.companyName ||
    "Business name unavailable";

  const pay =
    typeof workOrder?.budget === "number"
      ? `$${workOrder.budget.toFixed(2)}`
      : "Not specified";

  return (
    <div className="application-submission-page">
      {/* Student navigation */}
      <header className="application-submission-navbar">
        <Link to="/dashboard" className="application-submission-logo">
          Launch<span>Pad</span>
        </Link>

        <nav
          className="application-submission-nav"
          aria-label="Student navigation"
        >
          <Link to="/dashboard" className="active">
            Dashboard
          </Link>

          <Link to="/my-applications">My Applications</Link>

          <ProfileDropdown
            role="student"
            initials="ST"
            avatarClassName="application-submission-avatar"
          />
        </nav>
      </header>

      <main className="application-submission-main">
        <div className="application-submission-grid">
          {/* STEP 1: Show the form before submission. */}
          {!submitted && (
            <section className="application-submission-section">
              <div className="application-submission-card">
                <h1>{existingApplication ? "Edit application" : "Apply for this work order"}</h1>

                <div className="application-submission-divider" />

                <div className="application-submission-work-order">
                  <div className="application-submission-business-icon">BN</div>

                  <div>
                    {loadingOrder ? (
                      <p>Loading work order...</p>
                    ) : orderError ? (
                      <p role="alert">{orderError}</p>
                    ) : (
                      <>
                        <h3>{workOrder?.title}</h3>
                        <p>
                          {businessName} · Pay {pay}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {checkingApplication && <p role="status">Checking your application...</p>}
                {applicationError && <p role="alert">{applicationError}</p>}
                {existingApplication?.status !== "pending" && existingApplication && (
                  <p role="status">Your application has been {existingApplication.status}. It can no longer be edited.</p>
                )}
                <form onSubmit={handleSubmit}>
                  <div className="application-submission-field">
                    <label htmlFor="application-note">
                      Note to the business
                    </label>

                    <textarea
                      id="application-note"
                      placeholder="Why are you a good fit for this work order?"
                      value={note}
                      onChange={(event) => {
                        setNote(event.target.value);
                        setNotice("");
                      }}
                      rows={5}
                      required
                      disabled={submitting || checkingApplication || !!applicationError || (existingApplication && existingApplication.status !== "pending")}
                    />
                  </div>

                  <div className="application-submission-field">
                    <label htmlFor="application-availability">
                      Availability
                    </label>

                    <input
                      id="application-availability"
                      type="text"
                      placeholder="e.g., Available this week"
                      value={availability}
                      onChange={(event) => {
                        setAvailability(event.target.value);
                        setNotice("");
                      }}
                      required
                      disabled={submitting || checkingApplication || !!applicationError || (existingApplication && existingApplication.status !== "pending")}
                    />
                  </div>

                  <button
                    type="submit"
                    className="application-submission-submit"
                    disabled={
                      submitting ||
                      loadingOrder ||
                      checkingApplication ||
                      !!applicationError ||
                      (existingApplication && existingApplication.status !== "pending") ||
                      !!orderError ||
                      !workOrder ||
                      (!existingApplication && workOrder.status !== "open")
                    }
                  >
                    {submitting ? "Saving..." : existingApplication ? "Save changes" : "Submit application"}
                  </button>

                  {notice && (
                    <p className="application-submission-notice" role="alert">
                      {notice}
                    </p>
                  )}

                  {notice.includes("Please log in") && (
                    <Link to="/login">Go to student login</Link>
                  )}
                </form>
              </div>
            </section>
          )}

          {/* STEP 2: Show confirmation only after success. */}
          {submitted && (
            <section className="application-submission-section">
              <div className="application-confirmation-card">
                <div
                  className="application-confirmation-check"
                  aria-hidden="true"
                >
                  ✓
                </div>

                <h2>{existingApplication ? "Application updated!" : "Application submitted!"}</h2>

                <p className="application-confirmation-description">
                  {existingApplication
                    ? "Your updated application has been saved for the business to review."
                    : "Your application has been saved and sent to the business for review."}
                </p>

                <div className="application-confirmation-steps">
                  <p>
                    <span>✓</span> The business can review your application.
                  </p>

                  <p>
                    <span>✓</span> You can check your application status in My
                    applications.
                  </p>

                  <p>
                    <span>✓</span> Accepted work will appear in My applications.
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
          )}
        </div>
      </main>
    </div>
  );
}

export default ApplicationSubmission;
