import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProfileDropdown from "../components/ProfileDropdown";
import "../styles/WorkSubmissions.css";

const API_URL = "http://localhost:3000";
const MAX_FILES = 10;
const MAX_SIZE = 20 * 1024 * 1024;
function getToken() {
  for (const storage of [sessionStorage, localStorage]) {
    const token = storage.getItem("launchpad_token");
    try {
      if (
        token &&
        JSON.parse(storage.getItem("launchpad_user") || "{}").role === "student"
      )
        return token;
    } catch {
      /* Ignore invalid session. */
    }
  }
  return null;
}
const statusLabel = {
  pending_review: "Awaiting business review",
  changes_requested: "Changes requested",
  approved: "Approved",
};

export default function StudentWorkSubmission() {
  const { id } = useParams();
  const inputRef = useRef(null);
  const [order, setOrder] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [notes, setNotes] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    const token = getToken();
    if (!token) {
      setError("Please sign in as a student.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [ordersResponse, submissionsResponse] = await Promise.all([
        fetch(`${API_URL}/api/applications/my`, { headers }),
        fetch(`${API_URL}/api/work-orders/${id}/submissions`, { headers }),
      ]);
      const applications = await ordersResponse.json().catch(() => null);
      const history = await submissionsResponse.json().catch(() => null);
      if (!ordersResponse.ok)
        throw new Error(
          applications?.error || "Could not load your applications.",
        );
      if (!submissionsResponse.ok)
        throw new Error(history?.error || "Could not load submissions.");
      if (!Array.isArray(applications) || !Array.isArray(history))
        throw new Error("Unexpected server response.");
      const application = applications.find(
        (a) =>
          String(a.workOrderId?._id || a.workOrderId) === String(id) &&
          a.status === "accepted",
      );
      if (!application)
        throw new Error(
          "Only the accepted student can submit work for this order.",
        );
      setOrder(application.workOrderId);
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

  function addFiles(incoming) {
    setError("");
    const additions = Array.from(incoming);
    if (additions.some((file) => file.size > MAX_SIZE))
      return setError("Each file must be 20 MB or smaller.");
    setFiles((current) => {
      const unique = additions.filter(
        (file) =>
          !current.some(
            (old) =>
              old.name === file.name &&
              old.size === file.size &&
              old.lastModified === file.lastModified,
          ),
      );
      if (current.length + unique.length > MAX_FILES) {
        setError("You can attach up to 10 files.");
        return current;
      }
      return [...current, ...unique];
    });
  }

  async function submit(event) {
    event.preventDefault();
    const token = getToken();
    if (!token) return setError("Please sign in again.");
    const canSubmitEmpty = order?.allowEmptySubmission === true;

    if (
      !canSubmitEmpty &&
      !notes.trim() &&
      !projectUrl.trim() &&
      files.length === 0
    ) {
      setError(
        "This work order requires notes, a project link, or at least one file."
      );
      return;
    }
    if (projectUrl.trim()) {
      try {
        const parsed = new URL(projectUrl.trim());
        if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
      } catch {
        return setError("Enter a valid http:// or https:// project URL.");
      }
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const form = new FormData();
      form.append("notes", notes.trim());
      form.append("projectUrl", projectUrl.trim());
      files.forEach((file) => form.append("files", file));
      const response = await fetch(
        `${API_URL}/api/work-orders/${id}/submissions`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(result.error || "Could not submit work.");
      setNotes("");
      setProjectUrl("");
      setFiles([]);
      if (inputRef.current) inputRef.current.value = "";
      setNotice("Work submitted successfully. The business can now review it.");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const latest = submissions[0];
  const canSubmit =
    order?.status === "in_progress" &&
    (!latest || latest.status === "changes_requested");
  return (
    <div className="ws-page">
      <header className="ws-navbar">
        <Link className="ws-logo" to="/dashboard">
          Launch<span>Pad</span>
        </Link>
        <nav>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/my-applications">My applications</Link>
          <ProfileDropdown role="student" initials="ST" />
        </nav>
      </header>
      <main className="ws-main">
        <Link className="ws-back" to="/my-applications">
          ← Back to my applications
        </Link>
        <h1>Submit Completed Work</h1>
        <p className="ws-muted">{order?.title || "Work order"}</p>
        {loading && <p>Loading your project...</p>}
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
        {!loading && order && (
          <>
            <section className="ws-card">
              <h2>Business instructions</h2>
              <p className="ws-preserve">
                {order.submissionInstructions ||
                  "Follow the work order description and submit your completed deliverables."}
              </p>
              <p className="ws-muted">
                {order.allowEmptySubmission
                  ? "You may submit without notes, a link, or files."
                  : "Provide at least one: notes, a project link, or an attachment."}
              </p>
            </section>
            {latest?.status === "pending_review" && (
              <div className="ws-info">
                Your latest submission is awaiting review. You can resubmit if
                the business requests changes.
              </div>
            )}
            {latest?.status === "approved" && (
              <div className="ws-success">
                Your work has been approved. This project is complete.
              </div>
            )}
            {latest?.status === "changes_requested" && (
              <div className="ws-feedback">
                <strong>Changes requested by the business</strong>
                <p className="ws-preserve">
                  {latest.feedback || "Please revise your work and resubmit."}
                </p>
              </div>
            )}
            {canSubmit && (
              <form className="ws-card" onSubmit={submit}>
                <h2>
                  {latest
                    ? `Resubmit work (version ${latest.submissionNumber + 1})`
                    : "Submit your work"}
                </h2>
                <label htmlFor="ws-notes">Submission notes (optional)</label>
                <textarea
                  id="ws-notes"
                  rows={5}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Explain what you completed..."
                />
                <label htmlFor="ws-url">Project link (optional)</label>
                <input
                  id="ws-url"
                  type="url"
                  value={projectUrl}
                  onChange={(e) => setProjectUrl(e.target.value)}
                  placeholder="https://github.com/..."
                />
                <label>Attachments (optional)</label>
                <div
                  className={`ws-dropzone ${dragging ? "ws-dragging" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    addFiles(e.dataTransfer.files);
                  }}
                >
                  <span className="ws-upload-icon" aria-hidden="true">
                    ⇧
                  </span>
                  <strong>Drag and drop files here</strong>
                  <span>or</span>
                  <button
                    type="button"
                    className="ws-secondary"
                    onClick={() => inputRef.current?.click()}
                  >
                    Browse files
                  </button>
                  <input
                    ref={inputRef}
                    type="file"
                    multiple
                    hidden
                    onChange={(e) => {
                      addFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  <small>
                    Up to 10 files, 20 MB each. Files are private to the
                    assigned student and business.
                  </small>
                </div>
                {files.length > 0 && (
                  <ul className="ws-files">
                    {files.map((file, i) => (
                      <li key={`${file.name}-${file.lastModified}-${i}`}>
                        <span>
                          {file.name} ({(file.size / 1024 / 1024).toFixed(2)}{" "}
                          MB)
                        </span>
                        <button
                          type="button"
                          className="ws-link-button"
                          onClick={() =>
                            setFiles((previous) =>
                              previous.filter((_, index) => index !== i),
                            )
                          }
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <button type="submit" className="ws-primary" disabled={busy}>
                  {busy ? "Submitting..." : "Submit Work for Review"}
                </button>
              </form>
            )}
            <section className="ws-card">
              <h2>Submission history</h2>
              {submissions.length === 0 ? (
                <p className="ws-muted">No submissions yet.</p>
              ) : (
                submissions.map((submission) => (
                  <div className="ws-history-item" key={submission._id}>
                    <strong>Submission #{submission.submissionNumber}</strong>
                    <span className="ws-pill">
                      {statusLabel[submission.status] || submission.status}
                    </span>
                    <p className="ws-muted">
                      {new Date(submission.createdAt).toLocaleString()} ·{" "}
                      {submission.attachments?.length || 0} file(s)
                    </p>
                    {submission.feedback && (
                      <p className="ws-preserve">
                        Feedback: {submission.feedback}
                      </p>
                    )}
                  </div>
                ))
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
