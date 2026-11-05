
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/BusinessDashboard.css";

const API_URL = "http://localhost:3000";

function getBusinessSession() {
  for (const storage of [sessionStorage, localStorage]) {
    const token = storage.getItem("launchpad_token");
    const userText = storage.getItem("launchpad_user");

    if (!token || !userText) continue;

    try {
      const user = JSON.parse(userText);

      if (user.role === "business" && user.userId) {
        return { token, user };
      }
    } catch {
      // Ignore invalid saved session data.
    }
  }

  return null;
}

function getBusinessId(order) {
  if (!order.businessId) return null;

  if (typeof order.businessId === "string") {
    return order.businessId;
  }

  return order.businessId._id || null;
}

function formatStatus(status) {
  if (status === "in_progress" || status === "in-progress") {
    return "In progress";
  }

  if (status === "completed") {
    return "Completed";
  }

  return "Open";
}

function getStatusClass(status) {
  if (status === "in_progress" || status === "in-progress") {
    return "status-progress";
  }

  if (status === "completed") {
    return "status-completed";
  }

  return "status-open";
}

function formatApplicationStatus(status) {
  if (status === "accepted") return "Accepted";
  if (status === "rejected") return "Not selected";
  return "Pending";
}

function getStudentName(student) {
  if (!student) return "Student unavailable";

  const firstName = student.studentProfile?.firstName || "";
  const lastName = student.studentProfile?.lastName || "";

  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || student.email || "Student unavailable";
}

function getStudentInitials(student) {
  const firstName = student?.studentProfile?.firstName || "";
  const lastName = student?.studentProfile?.lastName || "";

  if (firstName || lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  return "ST";
}

function BusinessDashboard() {
  const [workOrders, setWorkOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const [applicantsByOrder, setApplicantsByOrder] = useState({});
  const [applicantErrors, setApplicantErrors] = useState({});

  const [loading, setLoading] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const session = getBusinessSession();
  const businessUserId = session?.user.userId;
  const businessToken = session?.token;

  // Load work orders belonging to the logged-in business.
  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      if (!businessUserId || !businessToken) {
        setError("Please log in with a business account.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/business/work-orders`,
          {
            headers: {
              Authorization: `Bearer ${businessToken}`,
            },
          },
        );

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.error ||
              `Unable to load work orders (${response.status}).`,
          );
        }

        if (!Array.isArray(result)) {
          throw new Error("Unexpected work order data from server.");
        }

        const businessOrders = result.filter(
          (order) =>
            String(getBusinessId(order)) === String(businessUserId),
        );

        if (cancelled) return;

        setWorkOrders(businessOrders);

        const firstOrderId = businessOrders[0]?._id || null;
        setSelectedOrderId(firstOrderId);

        // Load application counts for every business work order.
        const results = await Promise.allSettled(
          businessOrders.map(async (order) => {
            const applicantResponse = await fetch(
              `${API_URL}/api/work-orders/${order._id}/applications`,
              {
                headers: {
                  Authorization: `Bearer ${businessToken}`,
                },
              },
            );

            const applicantResult = await applicantResponse
              .json()
              .catch(() => null);

            if (!applicantResponse.ok) {
              throw new Error(
                applicantResult?.error ||
                  `Unable to load applicants (${applicantResponse.status}).`,
              );
            }

            if (!Array.isArray(applicantResult)) {
              throw new Error("Unexpected applicant data from server.");
            }

            return {
              orderId: order._id,
              applicants: applicantResult,
            };
          }),
        );

        if (cancelled) return;

        const nextApplicants = {};
        const nextErrors = {};

        results.forEach((result, index) => {
          const orderId = businessOrders[index]._id;

          if (result.status === "fulfilled") {
            nextApplicants[orderId] = result.value.applicants;
          } else {
            nextErrors[orderId] =
              result.reason?.message || "Unable to load applicants.";
          }
        });

        setApplicantsByOrder(nextApplicants);
        setApplicantErrors(nextErrors);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load dashboard.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [businessUserId, businessToken]);

  const selectedOrder = workOrders.find(
    (order) => order._id === selectedOrderId,
  );

  const visibleApplicants = selectedOrderId
    ? applicantsByOrder[selectedOrderId] || []
    : [];

  const selectedApplicantError = selectedOrderId
    ? applicantErrors[selectedOrderId]
    : null;

  const openCount = workOrders.filter(
    (order) => order.status === "open",
  ).length;

  const inProgressCount = workOrders.filter(
    (order) =>
      order.status === "in_progress" ||
      order.status === "in-progress",
  ).length;

  const completedCount = workOrders.filter(
    (order) => order.status === "completed",
  ).length;

  const allApplicants = Object.values(applicantsByOrder).flat();

  const pendingCount = allApplicants.filter(
    (application) => application.status === "pending",
  ).length;

  const statistics = [
    { label: "Open work orders", value: openCount },
    {
      label: "New applicants",
      value:
        Object.keys(applicantErrors).length > 0 ? "—" : pendingCount,
    },
    { label: "In progress", value: inProgressCount },
    { label: "Completed", value: completedCount },
  ];

  function handleReviewApplicants(orderId) {
    setSelectedOrderId(orderId);
    setNotice("");
  }
  
  async function handleApplicationDecision(applicationId, status) {
    const session = getBusinessSession();

    if (!session) {
      setNotice("Please log in with a business account.");
      return;
    }

    setNotice("");

    try {
      const response = await fetch(
        `${API_URL}/api/applications/${applicationId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({ status }),
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error || "Unable to update application.",
        );
      }

      // Reload so work order statuses and applicant counts
      // reflect the latest data from MongoDB.
      window.location.reload();
    } catch (error) {
      console.error("Application decision failed:", error);
      setNotice(error.message);
    }
  }


  return (
    <div className="business-dashboard-page">
      {/* Business navigation */}
      <header className="business-dashboard-navbar">
        <Link
          to="/business-dashboard"
          className="business-dashboard-logo"
        >
          Launch<span>Pad</span>
          <small> for Business</small>
        </Link>

        <nav
          className="business-dashboard-nav"
          aria-label="Business navigation"
        >
          <Link
            to="/business-dashboard"
            className="active"
            aria-current="page"
          >
            Dashboard
          </Link>

          <Link to="/businesses">Post a work order</Link>

          <Link
            to="/business-dashboard"
            className="business-dashboard-nav-avatar"
            aria-label="Business dashboard"
          >
            BU
          </Link>
        </nav>
      </header>

      <main className="business-dashboard-main">
        {/* Heading and post action */}
        <div className="business-dashboard-heading">
          <div>
            <h1>Business dashboard</h1>
            <p>Manage your work orders and review applicants.</p>
          </div>

          <Link
            to="/businesses"
            className="business-dashboard-post"
          >
            Post work order
          </Link>
        </div>

        {error && (
          <p className="business-dashboard-notice" role="alert">
            {error}{" "}
            {!businessUserId && (
              <Link to="/business-auth">Log in</Link>
            )}
          </p>
        )}

        {/* Real dashboard statistics */}
        <section
          className="business-dashboard-statistics"
          aria-label="Business statistics"
        >
          {statistics.map((stat) => (
            <div
              className="business-dashboard-stat-card"
              key={stat.label}
            >
              <span>{stat.label}</span>
              <strong>{loading ? "..." : stat.value}</strong>
            </div>
          ))}
        </section>

        <div className="business-dashboard-content">
          {/* Work order panel */}
          <section className="business-dashboard-panel">
            <h2>Your work orders</h2>

            <div className="business-dashboard-list">
              {loading && (
                <p className="business-dashboard-empty">
                  Loading your work orders and applicants...
                </p>
              )}

              {!loading && !error && workOrders.length === 0 && (
                <p className="business-dashboard-empty">
                  You haven't posted any work orders yet.{" "}
                  <Link to="/businesses">
                    Post your first work order
                  </Link>
                </p>
              )}

              {!loading &&
                workOrders.map((order) => {
                  const applicants = applicantsByOrder[order._id];
                  const applicantError = applicantErrors[order._id];

                  let applicantText = "0 applicants";

                  if (applicantError) {
                    applicantText = "Applicant count unavailable";
                  } else if (applicants) {
                    const count = applicants.length;

                    applicantText = `${count} ${
                      count === 1 ? "applicant" : "applicants"
                    }`;
                  }

                  return (
                    <article
                      className={`business-dashboard-order ${
                        selectedOrderId === order._id
                          ? "selected"
                          : ""
                      }`}
                      key={order._id}
                    >
                      <div className="business-dashboard-order-info">
                        <h3>{order.title}</h3>
                        <p>{applicantText}</p>
                      </div>

                      <span
                        className={`business-dashboard-status ${getStatusClass(
                          order.status,
                        )}`}
                      >
                        {formatStatus(order.status)}
                      </span>

                      <button
                        type="button"
                        className="business-dashboard-outline"
                        onClick={() =>
                          handleReviewApplicants(order._id)
                        }
                        aria-pressed={
                          selectedOrderId === order._id
                        }
                      >
                        Review applicants
                      </button>
                    </article>
                  );
                })}
            </div>
          </section>

          {/* Real applicant panel */}
          <section className="business-dashboard-panel">
            <h2>
              Applicants:{" "}
              {selectedOrder
                ? selectedOrder.title
                : "Select a work order"}
            </h2>

            <div className="business-dashboard-list">
              {loading && (
                <p className="business-dashboard-empty">
                  Loading applicants...
                </p>
              )}

              {!loading && selectedApplicantError && (
                <p
                  className="business-dashboard-empty"
                  role="alert"
                >
                  {selectedApplicantError}
                </p>
              )}

              {!loading &&
                !selectedApplicantError &&
                selectedOrder &&
                visibleApplicants.length === 0 && (
                  <p className="business-dashboard-empty">
                    No applicants for this work order yet.
                  </p>
                )}

              {!loading && !selectedOrder && (
                <p className="business-dashboard-empty">
                  Select a work order to review applicants.
                </p>
              )}

              {!loading &&
                !selectedApplicantError &&
                visibleApplicants.map((application) => {
                  const student = application.studentId;

                  const studentName = getStudentName(student);
                  const studentInitials =
                    getStudentInitials(student);

                  const major =
                    student?.studentProfile?.major ||
                    "Major not specified";

                  const applicationStatus =
                    formatApplicationStatus(
                      application.status,
                    );

                  return (
                    <article
                      className="business-dashboard-applicant"
                      key={application._id}
                      style={{
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        className="business-dashboard-student-avatar"
                        aria-hidden="true"
                      >
                        {studentInitials}
                      </div>

                      <div className="business-dashboard-applicant-info">
                        <h3>{studentName}</h3>

                        <p>{major}</p>

                        <p
                          style={{
                            marginTop: "8px",
                            whiteSpace: "pre-wrap",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {application.message ||
                            "No application message provided."}
                        </p>

                        <p
                          style={{
                            marginTop: "8px",
                            fontWeight: 700,
                          }}
                        >
                          Status: {applicationStatus}
                        </p>
                      </div>

                      {student?._id && (
                        <Link
                          to={`/students/${student._id}`}
                          className="business-dashboard-outline"
                        >
                          View profile
                        </Link>
                      )}

                      {application.status === "pending" && (
                        <>
                          <button
                            type="button"
                            className="business-dashboard-accept"
                            onClick={() =>
                              handleApplicationDecision(
                                application._id,
                                "accepted",
                              )
                            }
                          >
                            Accept
                          </button>

                          <button
                            type="button"
                            className="business-dashboard-outline"
                            onClick={() =>
                              handleApplicationDecision(
                                application._id,
                                "rejected",
                              )
                            }
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </article>
                  );
                })}
            </div>

            {notice && (
              <p
                className="business-dashboard-notice"
                role="status"
              >
                {notice}
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default BusinessDashboard;