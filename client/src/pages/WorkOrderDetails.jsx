
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "../styles/WorkOrderDetails.css";
import BusinessInformation from "../components/BusinessInformation";

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

  const [activeTab, setActiveTab] = useState("details");
  const [notice, setNotice] = useState("");
  const [showBusinessInfo, setShowBusinessInfo] = useState(false);

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
    setNotice("Problem reporting is not available yet.");
  }

  const businessName =
    workOrder?.businessId?.businessProfile?.companyName ||
    "Business name unavailable";

  const budget = formatMoney(workOrder?.budget);
  const deadline = formatDate(workOrder?.deadline);
  const category = workOrder?.category || "Not specified";
  const description =
    workOrder?.description || "No description provided.";

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
              <span className="work-summary-time">
                Not specified
              </span>
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
              <Link
                to={`/work-orders/${id}/apply`}
                className="work-apply-button"
              >
                Apply for this work order
              </Link>

              <button
                type="button"
                className="work-action-outline"
                onClick={handleMessage}
              >
                Message business
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
                          <strong>Business address:</strong>{" "}
                          Not specified
                        </p>

                        <p>
                          <strong>Overall rating:</strong>{" "}
                          Not available
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
                        <span className="work-tag">
                          {category}
                        </span>
                      </p>

                      <p>
                        <strong>Additional types of work:</strong>{" "}
                        Not specified
                      </p>

                      <p>
                        <strong>Service type:</strong>{" "}
                        Not specified
                      </p>
                    </div>
                  </section>

                  <section className="work-info-card">
                    <h2>Work Order Qualifications</h2>

                    <div className="work-info-body">
                      <p>
                        Requirements have not been specified.
                      </p>
                    </div>
                  </section>

                  <section className="work-info-card">
                    <h2>Service Description</h2>

                    <div className="work-info-body work-service-description">
                      <p>
                        <em>
                          <u>
                            Please read the ENTIRE scope of work
                            before applying!
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

                      <p>
                        Payment terms have not been specified.
                      </p>

                      <p>
                        <strong>
                          Estimated time to approval:
                        </strong>{" "}
                        Not specified
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
                      <p>
                        Start time: Not specified
                      </p>
                      <p>
                        End time: Not specified
                      </p>
                    </div>
                  </section>
                </aside>
              </div>
            ) : (
              <section className="work-info-card work-messages-panel">
                <h2>Messages</h2>

                <div className="work-info-body">
                  <p>
                    Messaging is not connected to the backend yet.
                  </p>
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