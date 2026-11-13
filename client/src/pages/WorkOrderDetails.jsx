import { useEffect, useState, useRef } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import "../styles/WorkOrderDetails.css";
import BusinessInformation from "../components/BusinessInformation";

const API_URL = "http://localhost:3000";

function getSession() {
  for (const storage of [sessionStorage, localStorage]) {
    const token = storage.getItem("launchpad_token");
    const userText = storage.getItem("launchpad_user");
    if (!token || !userText) {
      continue;
    }
    try {
      const user = JSON.parse(userText);
      if (user?.userId && user?.role) {
        return { token, user };
      }
    } catch {
      console.log("Ignoring invalid case");
    }
  }
  return null;
}

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

  const [searchParams] = useSearchParams ();
  const [activeTab, setActiveTab] = useState( searchParams.get("tab") === messages ? "messages" : "details");
  const [notice, setNotice] = useState("");
  const [showBusinessInfo, setShowBusinessInfo] = useState(false);

  const [thread, setThread] = useState(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [msgText, setMsgText] = useState("");
  const messagesEndRef = useRef(null);
  const session = getSession();
  const token = session?.token;
  const currentUserId = session?.user?.userId;

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

  useEffect(() => {
    if (!token || !id) {
      return;
    } 
    setThreadLoading(true);

    fetch(`${API_URL}/api/threads`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((threads) => {
        const match = Array.isArray(threads)
          ? threads.find((t) => String(t.workOrderId) === String(id))
          : null;
        setThread(match || null);
      })
      .catch((err) => console.error("Failed to load thread:", err))
      .finally(() => setThreadLoading(false));
  }, [id, token]);

  useEffect(() => {
    if (activeTab === "messages") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [thread?.messages?.length, activeTab]);

  async function handleSendWorkOrderMessage(e) {
    e.preventDefault();
    const trimmed = msgText.trim();
    if (!trimmed || !thread?._id) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/threads/${thread._id}/messages`, 
        {method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, },
        body: JSON.stringify({ text: trimmed }),
      });

      const saved = await res.json();
      if (!res.ok) {
        alert(saved.error || "Failed to send message.");
        return;
      }

      setThread((prev) => ({
        ...prev,
        messages: [...(prev.messages || []), saved],
      }));
      setMsgText("");
    } catch (err) {
      console.error("Send message failed:", err);
      alert("Could not reach the server.");
    }
  }


  function handleMessage() {
    setActiveTab("messages");
    setNotice("");
  }

  function handleReport() {
    setNotice("Problem reporting is not available yet.");
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
        <Link to="/" className="work-details-logo">
          Launch<span>Pad</span>
        </Link>

        <Link to="/dashboard" className="work-details-back">
          Back to dashboard
        </Link>
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
            {session?.user?.role !== "business" && (
              <Link
                to={`/work-orders/${id}/apply`}
                className="work-apply-button"
              >
                Apply for this work order
              </Link>
            )}

              <button
                type="button"
                className="work-action-outline"
                onClick={handleMessage}
              >
              {session?.user?.role === "business" ? "Message student" : "Message business"}
              </button>

              <button
                type="button"
                className="work-action-outline"
                onClick={handleReport}
              >
                Report problem
              </button>
            </div>

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
                      <strong>Additional Charges ⓘ</strong>
                      <span>Not specified</span>
                    </div>

                    <div className="work-payment-line">
                      <strong>Service Charges ⓘ</strong>
                      <span>Not specified</span>
                    </div>

                    <div className="work-payment-line">
                      <strong>Taxes ⓘ</strong>
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
            <h2>Messages {thread ? `(${thread.otherPerson})` : ""}</h2>
            <div className="work-info-body">
              {!session ? (
                <p>Not logged in. <Link to="/login">Log in</Link></p>
              ) : threadLoading ? (
                <p>Loading messages...</p>
              ) : !thread ? (
                <p>No active thread yet (accept an application for this work order first).</p>
              ) : (
                <div>
                  <div style={{ border: "1px solid #ccc", padding: "12px", maxHeight: "250px", overflowY: "auto", marginBottom: "10px" }}>
                    {(thread.messages || []).length === 0 ? (
                      <p>No messages yet. Say hello!</p>
                    ) : (
                      thread.messages.map((m, i) => (
                        <p key={m._id || i} style={{ margin: "6px 0" }}>
                          <strong>
                            {String(m.senderId) === String(currentUserId) ? "Me" : thread.otherPerson}:
                          </strong>{" "}
                          {m.text}{" "}
                          {m.sentAt && (
                            <small>
                              ({new Date(m.sentAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })})
                            </small>
                          )}
                        </p>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={handleSendWorkOrderMessage}>
                    <input
                      type="text"
                      value={msgText}
                      onChange={(e) => setMsgText(e.target.value)}
                      placeholder="Write a message..."
                      style={{ width: "75%", marginRight: "8px", padding: "6px" }}
                    />
                    <button type="submit">Send</button>
                  </form>
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
