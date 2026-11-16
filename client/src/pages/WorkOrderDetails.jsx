/*
╔════════════════════════════════════════════════════════════════════════════╗
║                        WorkOrderDetails.jsx                                ║
║                                                                            ║
║  Comprehensive work order details page. Students view complete job         ║
║  specifications including scope, deliverables, payment terms, and          ║
║  schedule. Provides apply button, messaging interface, and business        ║
║  profile modal. Tabbed interface between details and message history.      ║
║                                                                            ║
║  Key Features:                                                             ║
║  - Complete work order information display                                 ║
║  - Payment breakdown and total calculation                                 ║
║  - Apply to work order button                                              ║
║  - Direct messaging with business (tab interface)                          ║
║  - Business profile modal with contact button                              ║
║  - Work type and service category tags                                     ║
║  - Verified business indicator                                             ║
╚════════════════════════════════════════════════════════════════════════════╝
*/

import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import "../styles/WorkOrderDetails.css";
import BusinessInformation from "../components/BusinessInformation";
import NotificationBell from "../components/NotificationBell";

const API_URL = "http://localhost:3000";

function formatMoney(value) {
  const amount = Number(value);
  return value !== null && value !== undefined && Number.isFinite(amount)
    ? `$${amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : "Not specified";
}

function formatDate(value) {
  if (!value) return "Not specified";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not specified";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function WorkOrderDetails() {
  const { id } = useParams();

  const [workOrder, setWorkOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") === "messages" ? "messages" : "details",
  );
  const [notice, setNotice] = useState("");
  const [showBusinessInfo, setShowBusinessInfo] = useState(false);
  const [myApplication, setMyApplication] = useState(null);
  const [checkingApplication, setCheckingApplication] = useState(true);
  const [applicationError, setApplicationError] = useState("");
  // The authenticated session is shared by messaging, reporting, and navigation.
  const [session, setSession] = useState(null);
  const [threads, setThreads] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [messageBusy, setMessageBusy] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [messageLoading, setMessageLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("communication");
  const [reportDescription, setReportDescription] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const [reportNotice, setReportNotice] = useState("");
  const [reportError, setReportError] = useState("");

  // Restore the active student/business session from browser storage.
  useEffect(() => {
    let found = null;
    for (const storage of [sessionStorage, localStorage]) {
      try {
        const user = JSON.parse(storage.getItem("launchpad_user") || "{}");
        const token = storage.getItem("launchpad_token");
        if (token && ["student", "business"].includes(user.role)) {
          found = { token, role: user.role };
          break;
        }
      } catch {
        /* Invalid session */
      }
    }
    setSession(found);
  }, [id]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tab") === "messages")
      setActiveTab("messages");
  }, [id]);

  // Businesses can choose which applicant conversation to view.
  useEffect(() => {
    if (activeTab !== "messages" || !session || session.role !== "business")
      return;
    let cancelled = false;
    fetch(`${API_URL}/api/work-orders/${id}/conversations`, {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok)
          throw new Error(data.error || "Unable to load conversations.");
        return data;
      })
      .then((data) => {
        if (!cancelled) {
          setThreads(data);
          setSelectedStudent((current) =>
            data.some((t) => t.studentId === current)
              ? current
              : data[0]?.studentId || "",
          );
        }
      })
      .catch((err) => {
        if (!cancelled) setMessageError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, id, session]);

  // Load messages for the selected work order and student conversation.
  async function loadMessages() {
    if (!session || (session.role === "student" && !myApplication)) {
      setMessages([]);
      return;
    }
    if (session.role === "business" && !selectedStudent) {
      setMessages([]);
      return;
    }
    setMessageLoading(true);
    setMessageError("");
    try {
      const query =
        session.role === "business"
          ? `?studentId=${encodeURIComponent(selectedStudent)}`
          : "";
      const response = await fetch(
        `${API_URL}/api/work-orders/${id}/messages${query}`,
        { headers: { Authorization: `Bearer ${session.token}` } },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Unable to load messages.");
      setMessages(data);
    } catch (err) {
      setMessageError(err.message);
    } finally {
      setMessageLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === "messages") loadMessages();
  }, [activeTab, id, session, selectedStudent, myApplication]);

  // Send a message using the work-order messaging API.
  async function sendMessage(event) {
    event.preventDefault();
    if (!messageText.trim() || messageBusy || !session) return;
    if (session.role === "business" && !selectedStudent) return;
    setMessageBusy(true);
    setMessageError("");
    try {
      const response = await fetch(
        `${API_URL}/api/work-orders/${id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({
            body: messageText.trim(),
            ...(session.role === "business"
              ? { studentId: selectedStudent }
              : {}),
          }),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Unable to send message.");
      setMessageText("");
      await loadMessages();
    } catch (err) {
      setMessageError(err.message);
    } finally {
      setMessageBusy(false);
    }
  }

  // Students can privately report a problem with the work order.
  async function submitReport(event) {
    event.preventDefault();
    if (!session || session.role !== "student")
      return setReportError("Sign in as a student to report a problem.");
    setReportBusy(true);
    setReportError("");
    setReportNotice("");
    try {
      const response = await fetch(`${API_URL}/api/work-orders/${id}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          reason: reportReason,
          description: reportDescription.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Unable to submit report.");
      setReportNotice("Your report was submitted and saved with Open status.");
      setReportDescription("");
      setShowReport(false);
    } catch (err) {
      setReportError(err.message);
    } finally {
      setReportBusy(false);
    }
  }

  // Prevent duplicate applications and show the current application status.
  useEffect(() => {
    let cancelled = false;
    async function checkApplication() {
      setCheckingApplication(true);
      setApplicationError("");
      setMyApplication(null);
      let token = null;
      for (const storage of [sessionStorage, localStorage]) {
        try {
          if (
            JSON.parse(storage.getItem("launchpad_user") || "{}").role ===
            "student"
          ) {
            token = storage.getItem("launchpad_token");
            if (token) break;
          }
        } catch {
          /* Invalid stored session. */
        }
      }
      if (!token) {
        if (!cancelled) setCheckingApplication(false);
        return;
      }
      try {
        const response = await fetch(`${API_URL}/api/applications/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !Array.isArray(data)) {
          throw new Error(data?.error || "Could not check application status.");
        }
        if (!cancelled)
          setMyApplication(
            data.find(
              (item) =>
                String(item.workOrderId?._id || item.workOrderId) ===
                String(id),
            ) || null,
          );
      } catch (err) {
        if (!cancelled) setApplicationError(err.message);
      } finally {
        if (!cancelled) setCheckingApplication(false);
      }
    }
    checkApplication();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Fetch the work order and cancel the request when navigating away.
  useEffect(() => {
    const controller = new AbortController();

    async function loadWorkOrder() {
      try {
        setLoading(true);
        setError("");
        setWorkOrder(null);

        const response = await fetch(
          `${API_URL}/api/work-orders/${encodeURIComponent(id)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "This work order could not be found."
              : "Unable to load work order details.",
          );
        }

        const data = await response.json();

        if (!data || Array.isArray(data) || !data._id) {
          throw new Error("Unexpected response from the backend.");
        }

        if (!controller.signal.aborted) {
          setWorkOrder(data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Work order request failed:", err);
          setError(err.message || "Unable to load work order details.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadWorkOrder();

    return () => controller.abort();
  }, [id]);

  function handleMessage() {
    setActiveTab("messages");
    setNotice("");
  }

  function handleReport() {
    setReportError("");
    setShowReport((current) => !current);
  }

  const businessName =
    workOrder?.businessId?.businessProfile?.companyName ||
    "Business name unavailable";

  const budget = formatMoney(workOrder?.budget);
  const deadline = formatDate(workOrder?.deadline);
  const category = workOrder?.category || "Not specified";
  const description = workOrder?.description || "No description provided.";

  return (
    <div className="work-details-page">
      <header className="work-details-navbar">
        <Link to={session?.role === "business" ? "/business-dashboard" : session?.role === "student" ?"/dashboard" : "/"} className="work-details-logo">
          Launch<span>Pad</span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {session && <NotificationBell role={session.role} />}
          <Link
            to={
              session?.role === "business"
                ? "/business-dashboard"
                : "/dashboard"
            }
            className="work-details-back"
          >
            Back to dashboard
          </Link>
        </div>
      </header>

      {loading && (
        <main className="work-details-main">
          <p role="status">Loading work order details...</p>
        </main>
      )}

      {!loading && error && (
        <main className="work-details-main">
          <h1>Unable to display work order</h1>
          <p role="alert">{error}</p>
          <Link to="/dashboard">Return to dashboard</Link>
        </main>
      )}

      {!loading && !error && workOrder && (
        <>
          <section className="work-details-summary">
            <div className="work-summary-item">
              <strong>Pay: Fixed</strong>
              <span className="work-summary-pay">{budget}</span>
            </div>

            <div className="work-summary-item">
              <strong>Estimated time</strong>
              <span className="work-summary-time">Not specified</span>
            </div>

            <div className="work-summary-contact">
              <span className="work-contact-avatar">B</span>
              <div>
                <strong>Business</strong>
                <span>{businessName}</span>
              </div>
            </div>
          </section>

          <main className="work-details-main">
            <div className="work-details-actions">
              {session?.role === "business" ? null : checkingApplication ? (
                <span className="work-apply-button" aria-live="polite">
                  Checking application...
                </span>
              ) : applicationError ? (
                <span role="alert">{applicationError}</span>
              ) : myApplication ? (
                <>
                  <span
                    className="work-apply-button"
                    role="status"
                    aria-disabled="true"
                  >
                    {myApplication.status === "accepted"
                      ? "Application accepted"
                      : myApplication.status === "rejected"
                        ? "Application declined"
                        : "Application submitted"}
                  </span>
                  {myApplication.status === "pending" && (
                    <Link
                      to={`/work-orders/${id}/apply`}
                      className="work-action-outline"
                    >
                      Edit application
                    </Link>
                  )}
                </>
              ) : workOrder.status === "open" ? (
                <Link
                  to={`/work-orders/${id}/apply`}
                  className="work-apply-button"
                >
                  Apply for this work order
                </Link>
              ) : (
                <span className="work-apply-button" aria-disabled="true">
                  Applications closed
                </span>
              )}

              <button
                type="button"
                className="work-action-outline"
                onClick={handleMessage}
              >
                {session?.role === "business"
                  ? "Message student"
                  : "Message business"}
              </button>

              {session?.role !== "business" && (
                <button
                  type="button"
                  className="work-action-outline"
                  onClick={handleReport}
                >
                  Report problem
                </button>
              )}
            </div>

            {reportNotice && (
              <p className="work-details-notice" role="status">
                {reportNotice}
              </p>
            )}
            {showReport && (
              <section className="work-info-card work-messages-panel">
                <h2>Report a problem</h2>
                <form
                  className="work-info-body"
                  onSubmit={submitReport}
                  style={{ display: "grid", gap: 12 }}
                >
                  <label htmlFor="report-reason">Reason</label>
                  <select
                    id="report-reason"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                  >
                    <option value="communication">Communication</option>
                    <option value="payment">Payment</option>
                    <option value="scope">Work scope</option>
                    <option value="conduct">Conduct</option>
                    <option value="other">Other</option>
                  </select>
                  <label htmlFor="report-description">
                    Describe the problem
                  </label>
                  <textarea
                    id="report-description"
                    rows={5}
                    minLength={10}
                    maxLength={5000}
                    required
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Explain what happened (at least 10 characters)..."
                  />
                  {reportError && <p role="alert">{reportError}</p>}
                  <button
                    className="work-apply-button"
                    type="submit"
                    disabled={reportBusy || session?.role !== "student"}
                  >
                    {reportBusy ? "Submitting..." : "Submit report"}
                  </button>
                  <p>
                    Reports are stored privately. A moderation review dashboard
                    has not been implemented yet.
                  </p>
                </form>
              </section>
            )}
            {notice && (
              <p className="work-details-notice" role="status">
                {notice}
              </p>
            )}

            <div className="work-details-tabs">
              <button
                type="button"
                className={activeTab === "details" ? "active" : ""}
                onClick={() => setActiveTab("details")}
              >
                Details
              </button>

              <button
                type="button"
                className={activeTab === "messages" ? "active" : ""}
                onClick={() => setActiveTab("messages")}
              >
                Messages
              </button>
            </div>

            {activeTab === "details" ? (
              <div className="work-details-grid">
                <div className="work-details-left">
                  <section className="work-info-card">
                    <h2>Overview</h2>

                    <div className="work-overview-grid">
                      <div>
                        <p>
                          <strong>Business:</strong>{" "}
                          <button
                            type="button"
                            className="work-business-link"
                            onClick={() => setShowBusinessInfo(true)}
                          >
                            {businessName}
                          </button>
                        </p>

                        <p>
                          <strong>Business address:</strong> Not specified
                        </p>

                        <p>
                          <strong>Overall rating:</strong> Not available
                        </p>

                        <p>
                          <strong>Project ID:</strong> {workOrder._id}
                        </p>
                      </div>

                      <div>
                        <p>
                          <strong>Title:</strong> {workOrder.title}
                        </p>

                        <p>
                          <strong>Client:</strong> Not specified
                        </p>

                        <p>
                          <strong>Project:</strong> Not specified
                        </p>

                        <p>
                          <strong>Talent type:</strong> CS student
                        </p>

                        <p>
                          <strong>Status:</strong>{" "}
                          {workOrder.status || "Not specified"}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="work-info-card">
                    <h2>Work Experience</h2>

                    <div className="work-info-body">
                      <p>
                        <strong>Type of work:</strong>{" "}
                        <span className="work-tag">{category}</span>
                      </p>

                      <p>
                        <strong>Additional types of work:</strong> Not specified
                      </p>

                      <p>
                        <strong>Service type:</strong> Not specified
                      </p>
                    </div>
                  </section>

                  <section className="work-info-card">
                    <h2>Work Order Qualifications</h2>

                    <div className="work-info-body">
                      <p>Requirements have not been specified.</p>
                    </div>
                  </section>

                  <section className="work-info-card">
                    <h2>Service Description</h2>

                    <div className="work-info-body work-service-description">
                      <p>
                        <em>
                          <u>
                            Please read the ENTIRE scope of work before
                            applying!
                          </u>
                        </em>
                      </p>

                      <div>
                        <strong>SCOPE OF WORK:</strong>
                        <p>{description}</p>
                      </div>

                      <div>
                        <strong>Deliverables:</strong>
                        <p>Not specified</p>
                      </div>

                      <div>
                        <strong>Tools and requirements:</strong>
                        <p>Not specified</p>
                      </div>
                    </div>
                  </section>
                </div>

                <aside className="work-details-right">
                  <section className="work-info-card work-payment-card">
                    <div className="work-payment-heading">
                      <h2>Pay</h2>
                      <span>Fixed</span>
                    </div>

                    <div className="work-payment-terms">
                      <h3>Payment Terms</h3>

                      <p>Payment terms have not been specified.</p>

                      <p>
                        <strong>Estimated time to approval:</strong> Not
                        specified
                      </p>

                      <button
                        type="button"
                        className="work-business-link"
                        onClick={() =>
                          setNotice(
                            "Additional payment information is not available yet.",
                          )
                        }
                      >
                        Learn more
                      </button>
                    </div>

                    <div className="work-payment-section">
                      <div className="work-payment-title">
                        <h3>Labor</h3>
                        <strong>{budget}</strong>
                      </div>

                      <div className="work-payment-row">
                        <span>Pay Amount</span>
                        <span>{budget}</span>
                      </div>

                      <div className="work-payment-row">
                        <span>Approximate Hours to Complete</span>
                        <span>Not specified</span>
                      </div>
                    </div>

                    <div className="work-payment-line">
                      <strong>Additional Charges {" "}
                        <span
                          title="Extra project related expenses."
                          style={{ cursor: "help" }}
                        >
                        ⓘ
                        </span> 
                      </strong>
                      <span>Not specified</span>
                    </div>

                    <div className="work-payment-line">
                      <strong>
                        Service Charges {" "}
                        <span
                        title="Launchpad related service fee."
                        style={{ cursor: "help" }}
                        >
                        ⓘ
                        </span>
                      </strong>
                      <span>Not specified</span>
                    </div>

                    <div className="work-payment-line">
                      <strong>
                        Taxes {" "}
                        <span
                        title="Taxes may vary based on location!"
                        style={{ cursor: "help" }}
                        >
                        ⓘ
                        </span>
                      </strong>
                      <span>Not specified</span>
                    </div>
                  </section>

                  <section className="work-info-card work-total-card">
                    <h2>Sum</h2>

                    <div className="work-info-body">
                      <div className="work-payment-row">
                        <span>Work Order Budget</span>
                        <span>{budget}</span>
                      </div>

                      <div className="work-payment-row">
                        <span>Total Service Charges</span>
                        <span>Not specified</span>
                      </div>
                    </div>

                    <div className="work-total-row">
                      <h3>Total</h3>
                      <strong>Not calculated</strong>
                    </div>
                  </section>

                  <section className="work-info-card">
                    <h2>Schedule</h2>

                    <div className="work-info-body work-schedule">
                      <strong>Deadline: {deadline}</strong>
                      <p>Start time: Not specified</p>
                      <p>End time: Not specified</p>
                    </div>
                  </section>
                </aside>
              </div>
            ) : (
              <section className="work-info-card work-messages-panel">
                <h2>Messages</h2>
                <div className="work-info-body">
                  {!session ? (
                    <p>
                      Sign in to use messages. <Link to="/login">Log in</Link>
                    </p>
                  ) : session.role === "student" && !myApplication ? (
                    <p>
                      Apply to this work order before messaging the business.
                    </p>
                  ) : (
                    <div style={{ display: "grid", gap: 14 }}>
                      {session.role === "business" && (
                        <>
                          <label htmlFor="conversation-student">
                            Student conversation
                          </label>
                          <select
                            id="conversation-student"
                            value={selectedStudent}
                            onChange={(event) =>
                              setSelectedStudent(event.target.value)
                            }
                          >
                            {threads.length === 0 && (
                              <option value="">No applicants yet</option>
                            )}
                            {threads.map((thread) => (
                              <option
                                key={thread.studentId}
                                value={thread.studentId}
                              >
                                {thread.name} ({thread.applicationStatus})
                              </option>
                            ))}
                          </select>
                        </>
                      )}
                      {messageError && <p role="alert">{messageError}</p>}
                      <button
                        type="button"
                        className="work-action-outline"
                        onClick={loadMessages}
                        disabled={
                          messageLoading ||
                          (session.role === "business" && !selectedStudent)
                        }
                      >
                        Refresh messages
                      </button>
                      {messageLoading ? (
                        <p>Loading messages...</p>
                      ) : messages.length === 0 ? (
                        <p>No messages yet.</p>
                      ) : (
                        <div style={{ display: "grid", gap: 12 }}>
                          {messages.map((message) => (
                            <div
                              key={message._id}
                              style={{
                                padding: 12,
                                border: "1px solid #ddd",
                                borderRadius: 8,
                              }}
                            >
                              <strong>
                                {message.senderRole === "business"
                                  ? "Business"
                                  : "Student"}
                              </strong>
                              <small style={{ marginLeft: 10 }}>
                                {new Date(message.createdAt).toLocaleString()}
                              </small>
                              <p
                                style={{
                                  whiteSpace: "pre-wrap",
                                  overflowWrap: "anywhere",
                                }}
                              >
                                {message.body}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                      {(session.role === "student" || selectedStudent) && (
                        <form
                          onSubmit={sendMessage}
                          style={{ display: "grid", gap: 10 }}
                        >
                          <label htmlFor="new-message">New message</label>
                          <textarea
                            id="new-message"
                            rows={4}
                            maxLength={5000}
                            value={messageText}
                            onChange={(event) =>
                              setMessageText(event.target.value)
                            }
                            placeholder="Write your message..."
                            required
                          />
                          <button
                            className="work-apply-button"
                            type="submit"
                            disabled={messageBusy || !messageText.trim()}
                          >
                            {messageBusy ? "Sending..." : "Send message"}
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}
          </main>

          {showBusinessInfo && (
            <BusinessInformation
              onClose={() => setShowBusinessInfo(false)}
              onMessage={() => {
                setShowBusinessInfo(false);
                handleMessage();
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

export default WorkOrderDetails;
