import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProfileDropdown from "../components/ProfileDropdown";
import "../styles/WorkSubmissions.css";

const API_URL = "http://localhost:3000";
function getToken() {
  for (const storage of [sessionStorage, localStorage]) {
    const token = storage.getItem("launchpad_token");
    try {
      if (
        token &&
        JSON.parse(storage.getItem("launchpad_user") || "{}").role ===
          "business"
      )
        return token;
    } catch {
      /* Ignore invalid session. */
    }
  }
  return null;
}
const statusLabel = {
  pending_review: "Awaiting review",
  changes_requested: "Changes requested",
  approved: "Approved",
};

export default function BusinessSubmissionReview() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    const token = getToken();
    if (!token) {
      setError("Please sign in as a business.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [ordersResponse, submissionsResponse] = await Promise.all([
        fetch(`${API_URL}/api/business/work-orders`, { headers }),
        fetch(`${API_URL}/api/work-orders/${id}/submissions`, { headers }),
      ]);
      const orders = await ordersResponse.json().catch(() => null);
      const history = await submissionsResponse.json().catch(() => null);
      if (!ordersResponse.ok)
        throw new Error(orders?.error || "Could not load work order.");
      if (!submissionsResponse.ok)
        throw new Error(history?.error || "Could not load submissions.");
      if (!Array.isArray(orders) || !Array.isArray(history))
        throw new Error("Unexpected server response.");
      const found = orders.find((item) => item._id === id);
      if (!found)
        throw new Error("This work order is not in your business account.");
      setOrder(found);
      setSubmissions(
        [...history].sort((a, b) => b.submissionNumber - a.submissionNumber),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [id]);

  async function downloadAttachment(submission, attachment) {
    const token = getToken();
    if (!token) return setError("Please sign in again.");
    try {
      const response = await fetch(
        `${API_URL}/api/submissions/${submission._id}/attachments/${attachment._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) throw new Error("Could not download attachment.");
      const url = URL.createObjectURL(await response.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.originalName || "attachment";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      setError(err.message);
    }
  }

  async function review(submission, decision) {
    if (decision === "changes_requested" && !feedback.trim()) {
      setError("Enter feedback before requesting changes.");
      return;
    }
    if (
      decision === "approved" &&
      !window.confirm("Approve this submission and complete the work order?")
    )
      return;
    const token = getToken();
    if (!token) return setError("Please sign in again.");
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        `${API_URL}/api/submissions/${submission._id}/review`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: decision,
            feedback: decision === "changes_requested" ? feedback.trim() : "",
          }),
        },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Review failed.");
      setFeedback("");
      setNotice(
        decision === "approved"
          ? "Submission approved. Work order completed."
          : "Changes requested. The student can resubmit.",
      );
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const latest = submissions[0];
  return (
    <div className="ws-page">
      <header className="ws-navbar">
        <Link className="ws-logo" to="/business-dashboard">
          Launch<span>Pad</span>
          <small> for Business</small>
        </Link>
        <nav>
          <Link to="/business-dashboard">Dashboard</Link>
          <ProfileDropdown role="business" initials="BU" />
        </nav>
      </header>
      <main className="ws-main">
        <Link to="/business-dashboard" className="ws-back">
          ← Back to dashboard
        </Link>
        <h1>Review submissions</h1>
        <p className="ws-muted">{order?.title || "Work order"}</p>
        {loading && <p>Loading submissions...</p>}
        {error && (
          <p className="ws-error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="ws-success" role="status">
            {notice}
          </p>
        )}
        {!loading && !error && submissions.length === 0 && (
          <section className="ws-card">
            <p>
              No work has been submitted yet. The assigned student will submit
              their work here for your review.
            </p>
          </section>
        )}
        {!loading &&
          submissions.map((submission, index) => (
            <section className="ws-card" key={submission._id}>
              <div className="ws-card-heading">
                <h2>Submission #{submission.submissionNumber}</h2>
                <span className="ws-pill">
                  {statusLabel[submission.status] || submission.status}
                </span>
              </div>
              <p className="ws-muted">
                {new Date(submission.createdAt).toLocaleString()}
              </p>
              <h3>Student notes</h3>
              <p className="ws-preserve">
                {submission.notes || "No notes provided."}
              </p>
              <h3>Project link</h3>
              {submission.projectUrl ? (
                <a
                  href={submission.projectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {submission.projectUrl}
                </a>
              ) : (
                <p className="ws-muted">No link provided.</p>
              )}
              <h3>Attached files</h3>
              {submission.attachments?.length ? (
                <ul className="ws-files">
                  {submission.attachments.map((file) => (
                    <li key={file._id}>
                      <span>
                        {file.originalName} (
                        {(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                      <button
                        type="button"
                        className="ws-link-button"
                        onClick={() => downloadAttachment(submission, file)}
                      >
                        Download
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="ws-muted">No files attached.</p>
              )}
              {submission.feedback && (
                <div className="ws-feedback">
                  <strong>Business feedback</strong>
                  <p className="ws-preserve">{submission.feedback}</p>
                </div>
              )}
              {index === 0 &&
                submission.status === "pending_review" &&
                order?.status === "in_progress" && (
                  <div className="ws-review">
                    <label htmlFor="review-feedback">
                      Feedback (required for changes)
                    </label>
                    <textarea
                      id="review-feedback"
                      rows={4}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Explain what the student should revise..."
                    />
                    <div className="ws-actions">
                      <button
                        type="button"
                        className="ws-secondary"
                        disabled={busy}
                        onClick={() => review(submission, "changes_requested")}
                      >
                        Request changes
                      </button>
                      <button
                        type="button"
                        className="ws-primary"
                        disabled={busy}
                        onClick={() => review(submission, "approved")}
                      >
                        Approve work
                      </button>
                    </div>
                  </div>
                )}
            </section>
          ))}
      </main>
    </div>
  );
}
