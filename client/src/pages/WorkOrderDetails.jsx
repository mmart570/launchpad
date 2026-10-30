import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import "../styles/WorkOrderDetails.css";

function WorkOrderDetails() {
  // Read the work order identifier from the current route.
  const { id } = useParams();

  // Track the selected content tab and provide action feedback.
  const [activeTab, setActiveTab] = useState("details");
  const [notice, setNotice] = useState("");

  // Display a placeholder until application submission is connected.
  function handleApply() {
    setNotice("Applications are not connected to the backend yet.");
  }

  // Open the messages tab and clear any previous notice.
  function handleMessage() {
    setActiveTab("messages");
    setNotice("");
  }

  // Display a placeholder until problem reporting is available.
  function handleReport() {
    setNotice("Problem reporting is not connected to the backend yet.");
  }

  return (
    // Group navigation, work order information, and related actions.
    <div className="work-details-page">
      {/* Provide brand navigation and a return link to the dashboard. */}
      <header className="work-details-navbar">
        <Link to="/" className="work-details-logo">
          Launch<span>Pad</span>
        </Link>

        <Link to="/dashboard" className="work-details-back">
          Back to dashboard
        </Link>
      </header>

      {/* Summarize payment, estimated duration, and business contact. */}
      <section className="work-details-summary">
        <div className="work-summary-item">
          <strong>Pay: Fixed</strong>
          <span className="work-summary-pay">$[Amount]</span>
        </div>

        <div className="work-summary-item">
          <strong>Estimated time</strong>
          <span className="work-summary-time">[2] hours</span>
        </div>

        <div className="work-summary-contact">
          <span className="work-contact-avatar">[JD]</span>
          <div>
            <strong>Business contact</strong>
            <span>[Contact name]</span>
          </div>
        </div>
      </section>

      {/* Present work order actions and the selected information tab. */}
      <main className="work-details-main">
        <div className="work-details-actions">
          <button
            type="button"
            className="work-action-apply"
            onClick={handleApply}
          >
            Apply for this work order
          </button>

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

        {/* Announce action feedback to users and assistive technology. */}
        {notice && (
          <p className="work-details-notice" role="status">
            {notice}
          </p>
        )}

        {/* Let users switch between work order details and messages. */}
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
            Messages <span className="work-message-count">1</span>
          </button>
        </div>

        {/* Render the active tab's content. */}
        {activeTab === "details" ? (
          <div className="work-details-grid">
            {/* Show project overview, qualifications, and scope of work. */}
            <div className="work-details-left">
              <section className="work-info-card">
                <h2>Overview</h2>

                <div className="work-overview-grid">
                  <div>
                    <p>
                      <strong>Business:</strong> [Business name]{" "}
                      <span className="work-verified">✓</span>
                    </p>
                    <p>[Business address]</p>
                    <p className="work-muted">
                      [This is not the work order address.]
                    </p>
                    <p>Overall rating: [Rating]</p>
                    <p>Project ID: {id || "[no ID specified]"}</p>
                  </div>

                  <div>
                    <p>
                      <strong>Title:</strong> [Work order title]
                    </p>
                    <p>
                      <strong>Client:</strong> [Client or none]
                    </p>
                    <p>
                      <strong>Project:</strong> [Project or none]
                    </p>
                    <p>
                      <strong>Talent type:</strong> CS student
                    </p>
                  </div>
                </div>
              </section>

              <section className="work-info-card">
                <h2>Work Experience</h2>

                <div className="work-info-body">
                  <p>
                    <strong>Type of work:</strong>{" "}
                    <span className="work-tag">[Web development]</span>
                  </p>
                  <p>
                    <strong>Additional types of work:</strong>{" "}
                    <span className="work-tag">[Database]</span>
                  </p>
                  <p>
                    <strong>Service type:</strong>{" "}
                    <span className="work-tag">[New build]</span>
                  </p>
                </div>
              </section>

              <section className="work-info-card">
                <h2>Work Order Qualifications</h2>
                <div className="work-info-body">
                  <p>
                    [There are no requirements for requesting this work order.]
                  </p>
                </div>
              </section>

              <section className="work-info-card">
                <h2>Service Description</h2>

                <div className="work-info-body work-service-description">
                  <p>
                    <em>
                      <u>
                        Please read the ENTIRE scope of work before applying!
                      </u>
                    </em>
                  </p>

                  <div>
                    <strong>SCOPE OF WORK:</strong>
                    <p>[Describe what the business needs built or fixed.]</p>
                  </div>

                  <div>
                    <strong>Deliverables:</strong>
                    <p>[List what the student should hand over.]</p>
                  </div>

                  <div>
                    <strong>Tools and requirements:</strong>
                    <p>[List languages, tools, or access needed.]</p>
                  </div>
                </div>
              </section>
            </div>

            {/* Summarize payment terms, costs, and project schedule. */}
            <aside className="work-details-right">
              <section className="work-info-card work-payment-card">
                <div className="work-payment-heading">
                  <h2>Pay</h2>
                  <span>Fixed</span>
                </div>

                <div className="work-payment-terms">
                  <h3>Payment Terms</h3>
                  <p>
                    <strong>[14]-day terms</strong> ([how payment is processed])
                  </p>
                  <p>
                    <strong>Estimated time to approval:</strong> [7] days
                  </p>
                  <a
                    href="#payment-details"
                    onClick={(event) => {
                      event.preventDefault();
                      setNotice(
                        "Additional payment information is not available yet.",
                      );
                    }}
                  >
                    Learn more
                  </a>
                </div>

                <div className="work-payment-section">
                  <div className="work-payment-title">
                    <h3>Labor</h3>
                    <strong>$[Amount]</strong>
                  </div>

                  <div className="work-payment-row">
                    <span>Pay Amount</span>
                    <span>$[Amount]</span>
                  </div>

                  <div className="work-payment-row">
                    <span>Approximate Hours to Complete</span>
                    <span>[2]</span>
                  </div>
                </div>

                <div className="work-payment-line">
                  <strong>Additional Charges ⓘ</strong>
                  <strong className="work-money-green">$[Amount]</strong>
                </div>

                <div className="work-payment-line">
                  <strong>Service Charges ⓘ</strong>
                  <strong className="work-money-red">$[Amount]</strong>
                </div>

                <div className="work-payment-line">
                  <strong>Taxes ⓘ</strong>
                  <strong className="work-money-red">$[Amount]</strong>
                </div>
              </section>

              <section className="work-info-card work-total-card">
                <h2>Sum</h2>

                <div className="work-info-body">
                  <div className="work-payment-row">
                    <span>Work Order Cost</span>
                    <span>$[Amount]</span>
                  </div>

                  <div className="work-payment-row">
                    <span>Total Service Charges</span>
                    <span>$[Amount]</span>
                  </div>
                </div>

                <div className="work-total-row">
                  <h3>Total</h3>
                  <strong>$[Amount]</strong>
                </div>
              </section>

              <section className="work-info-card">
                <h2>Schedule</h2>

                <div className="work-info-body work-schedule">
                  <strong>[Day, Date]</strong>
                  <p>[Start time] to [End time]</p>
                  <p>Deadline: [Date]</p>
                </div>
              </section>
            </aside>
          </div>
        ) : (
          // Explain that messaging will be available after backend integration.
          <section className="work-info-card work-messages-panel">
            <h2>Messages</h2>
            <div className="work-info-body">
              <p>Messaging will be available once the backend is connected.</p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default WorkOrderDetails;
