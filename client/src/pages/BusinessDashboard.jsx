import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/BusinessDashboard.css";
import ProfileDropdown from "../components/ProfileDropdown";

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

  if (status === "draft") {
    return "Draft";
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

  if (status === "draft") {
    return "status-draft";
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
  const [activeTab, setActiveTab] = useState("open");
  const [deletingOrderId, setDeletingOrderId] = useState(null);
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

        const response = await fetch(`${API_URL}/api/business/work-orders`, {
          headers: {
            Authorization: `Bearer ${businessToken}`,
          },
        });

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.error || `Unable to load work orders (${response.status}).`,
          );
        }

        if (!Array.isArray(result)) {
          throw new Error("Unexpected work order data from server.");
        }

        const businessOrders = result.filter(
          (order) => String(getBusinessId(order)) === String(businessUserId),
        );

        if (cancelled) return;

        setWorkOrders(businessOrders);

        const firstOrderId =
          businessOrders.find(
            (order) =>
              order.status === "open" || order.status === "in_progress",
          )?._id || null;
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

  const tabCounts = {
    open: workOrders.filter((order) =>
      ["open", "in_progress", "in-progress"].includes(order.status),
    ).length,
    draft: workOrders.filter((order) => order.status === "draft").length,
    completed: workOrders.filter((order) =>
      ["completed", "closed"].includes(order.status),
    ).length,
  };

  const filteredOrders = workOrders.filter((order) => {
    if (activeTab === "open")
      return ["open", "in_progress", "in-progress"].includes(order.status);
    if (activeTab === "draft") return order.status === "draft";
    return ["completed", "closed"].includes(order.status);
  });

  function changeTab(tab) {
    setActiveTab(tab);
    const first = workOrders.find((order) => {
      if (tab === "open")
        return ["open", "in_progress", "in-progress"].includes(order.status);
      if (tab === "draft") return order.status === "draft";
      return ["completed", "closed"].includes(order.status);
    });
    setSelectedOrderId(first && tab !== "draft" ? first._id : null);
    setNotice("");
  }

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
    (order) => order.status === "in_progress" || order.status === "in-progress",
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
      value: Object.keys(applicantErrors).length > 0 ? "—" : pendingCount,
    },
    { label: "In progress", value: inProgressCount },
    { label: "Completed", value: completedCount },
  ];

  function handleReviewApplicants(orderId) {
    setSelectedOrderId(orderId);
    setNotice("");
  }

  async function handleDeleteWorkOrder(order) {
    if (!["draft", "open"].includes(order.status)) return;

    const applicantCount = applicantsByOrder[order._id]?.length;
    if (
      order.status === "open" &&
      (applicantErrors[order._id] || applicantCount === undefined)
    ) {
      setNotice(
        "Cannot verify applications for this work order. Please try again later.",
      );
      return;
    }
    if (order.status === "open" && applicantCount > 0) {
      setNotice("This work order has applications and cannot be deleted.");
      return;
    }

    if (
      !window.confirm(
        `Permanently delete "${order.title || "Untitled draft"}"? This cannot be undone.`,
      )
    )
      return;
    const session = getBusinessSession();
    if (!session) {
      setNotice("Please log in with a business account.");
      return;
    }

    setDeletingOrderId(order._id);
    setNotice("");
    try {
      const response = await fetch(
        `${API_URL}/api/business/work-orders/${order._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${session.token}` },
        },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(result.error || "Unable to delete work order.");
      setWorkOrders((orders) =>
        orders.filter((item) => item._id !== order._id),
      );
      setApplicantsByOrder((previous) => {
        const next = { ...previous };
        delete next[order._id];
        return next;
      });
      setSelectedOrderId((current) => (current === order._id ? null : current));
      setNotice("Work order deleted successfully.");
    } catch (error) {
      setNotice(error.message || "Unable to delete work order.");
    } finally {
      setDeletingOrderId(null);
    }
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
        throw new Error(result?.error || "Unable to update application.");
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
        <Link to="/business-dashboard" className="business-dashboard-logo">
          Launch<span>Pad</span>
          <small> for Business</small>
        </Link>

        <nav
          className="business-dashboard-nav"
          aria-label="Business navigation"
        >
          <Link to="/business-dashboard" className="active" aria-current="page">
            Dashboard
          </Link>

          <Link to="/businesses">Post a Work Order</Link>

          <ProfileDropdown
            role="business"
            initials="BU"
            avatarClassName="business-dashboard-nav-avatar"
          />
        </nav>
      </header>

      <main className="business-dashboard-main">
        {/* Heading and post action */}
        <div className="business-dashboard-heading">
          <div>
            <h1>Business Dashboard</h1>
            <p>Manage your work orders and review applicants.</p>
          </div>

          <Link to="/businesses" className="business-dashboard-post">
            Post work order
          </Link>

          {notice && (
            <p className="business-dashboard-notice" role="status">
              {notice}
            </p>
          )}
        </div>

        {error && (
          <p className="business-dashboard-notice" role="alert">
            {error} {!businessUserId && <Link to="/business-auth">Log in</Link>}
          </p>
        )}

        {/* Real dashboard statistics */}
        <section
          className="business-dashboard-statistics"
          aria-label="Business statistics"
        >
          {statistics.map((stat) => (
            <div className="business-dashboard-stat-card" key={stat.label}>
              <span>{stat.label}</span>
              <strong>{loading ? "..." : stat.value}</strong>
            </div>
          ))}
        </section>

        <div className="business-dashboard-content">
          {/* Work order panel */}
          <section className="business-dashboard-panel">
            <h2>Your work orders</h2>

            <div
              className="business-dashboard-tabs"
              role="tablist"
              aria-label="Work order status"
            >
              {[
                { id: "open", label: "Open" },
                { id: "draft", label: "Drafts" },
                { id: "completed", label: "Completed" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={`business-dashboard-tab ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => changeTab(tab.id)}
                >
                  {tab.label} <span>{tabCounts[tab.id]}</span>
                </button>
              ))}
            </div>

            <div className="business-dashboard-list" role="tabpanel">
              {loading && (
                <p className="business-dashboard-empty">
                  Loading your work orders and applicants...
                </p>
              )}

              {!loading && !error && workOrders.length === 0 && (
                <p className="business-dashboard-empty">
                  You haven't posted any work orders yet.{" "}
                  <Link to="/businesses">Post your first work order</Link>
                </p>
              )}

              {!loading &&
                !error &&
                workOrders.length > 0 &&
                filteredOrders.length === 0 && (
                  <p className="business-dashboard-empty">
                    {activeTab === "draft"
                      ? "No saved drafts yet."
                      : activeTab === "completed"
                        ? "No completed work orders yet."
                        : "No open or in-progress work orders."}
                  </p>
                )}

              {!loading &&
                !error &&
                filteredOrders.map((order) => {
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
                        selectedOrderId === order._id ? "selected" : ""
                      }`}
                      key={order._id}
                    >
                      <div className="business-dashboard-order-info">
                        <h3>{order.title || "Untitled draft"}</h3>
                        <p>
                          {order.status === "draft"
                            ? "Not published"
                            : applicantText}
                        </p>
                      </div>

                      <span
                        className={`business-dashboard-status ${getStatusClass(
                          order.status,
                        )}`}
                      >
                        {formatStatus(order.status)}
                      </span>

                      {order.status !== "draft" && (
                        <button
                          type="button"
                          className="business-dashboard-outline"
                          onClick={() => handleReviewApplicants(order._id)}
                          aria-pressed={selectedOrderId === order._id}
                        >
                          Review applicants
                        </button>
                      )}
                      {!["completed", "closed"].includes(order.status) && (
                        <Link
                          to={`/businesses/edit/${order._id}`}
                          className="business-dashboard-outline"
                        >
                          Edit
                        </Link>
                      )}
                      {order.status === "draft" && (
                        <Link
                          to={`/businesses/edit/${order._id}`}
                          className="business-dashboard-accept"
                        >
                          Publish
                        </Link>
                      )}
                      {["draft", "open"].includes(order.status) && (
                        <button
                          type="button"
                          className="business-dashboard-delete"
                          onClick={() => handleDeleteWorkOrder(order)}
                          disabled={
                            deletingOrderId === order._id ||
                            (order.status === "open" &&
                              (applicantErrors[order._id] ||
                                !Array.isArray(applicantsByOrder[order._id]) ||
                                applicantsByOrder[order._id].length > 0))
                          }
                          title={
                            order.status === "open" &&
                            applicantsByOrder[order._id]?.length > 0
                              ? "Cannot delete a work order with applications"
                              : "Delete work order"
                          }
                        >
                          {deletingOrderId === order._id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      )}
                      {order.status === "in_progress" && (
                        <Link
                          to={`/business/work-orders/${order._id}/submissions`}
                          className="business-dashboard-accept"
                        >
                          Review submissions
                        </Link>
                      )}
                    </article>
                  );
                })}
            </div>
          </section>

          {/* Real applicant panel */}
          <section className="business-dashboard-panel">
            <h2>
              Applicants:{" "}
              {selectedOrder ? selectedOrder.title : "Select a work order"}
            </h2>

            <div className="business-dashboard-list">
              {loading && (
                <p className="business-dashboard-empty">
                  Loading applicants...
                </p>
              )}

              {!loading && selectedApplicantError && (
                <p className="business-dashboard-empty" role="alert">
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
                  {activeTab === "draft"
                    ? "Drafts are not visible to students and have no applicants."
                    : "Select a work order to review applicants."}
                </p>
              )}

              {!loading &&
                !selectedApplicantError &&
                visibleApplicants.map((application) => {
                  const student = application.studentId;

                  const studentName = getStudentName(student);
                  const studentInitials = getStudentInitials(student);

                  const major =
                    student?.studentProfile?.major || "Major not specified";

                  const applicationStatus = formatApplicationStatus(
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
          </section>
        </div>
      </main>
    </div>
  );
}

export default BusinessDashboard;
