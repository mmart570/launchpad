
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/MyApplications.css";

const API_URL = "http://localhost:3000";

const filters = ["All", "Pending", "Accepted", "Not selected"];

// Find the logged-in student's session.
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
      // Ignore invalid saved session data.
    }
  }

  return null;
}

// Convert MongoDB status values into readable labels.
function formatStatus(status) {
  switch (status) {
    case "pending":
      return "Pending";
    case "accepted":
      return "Accepted";
    case "rejected":
      return "Not selected";
    default:
      return "Pending";
  }
}

// Format the application submission date.
function formatDate(dateString) {
  if (!dateString) return "Date unavailable";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadApplications() {
      const session = getStudentSession();

      if (!session) {
        setError("Please log in with your student account.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/applications/my`,
          {
            headers: {
              Authorization: `Bearer ${session.token}`,
            },
          },
        );

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.error ||
              `Unable to load applications (${response.status}).`,
          );
        }

        if (!Array.isArray(result)) {
          throw new Error(
            "The server returned unexpected application data.",
          );
        }

        if (!cancelled) {
          setApplications(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || "Unable to load your applications.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadApplications();

    return () => {
      cancelled = true;
    };
  }, []);

  // Filter real MongoDB applications by their status.
  const visibleApplications =
    activeFilter === "All"
      ? applications
      : applications.filter(
          (application) =>
            formatStatus(application.status) === activeFilter,
        );

  return (
    <div className="my-applications-page">
      {/* Student navigation */}
      <header className="my-applications-navbar">
        <Link to="/" className="my-applications-logo">
          Launch<span>Pad</span>
        </Link>

        <nav
          className="my-applications-nav"
          aria-label="Student navigation"
        >
          <Link to="/dashboard">Dashboard</Link>

          <Link
            to="/my-applications"
            className="active"
            aria-current="page"
          >
            My applications
          </Link>

          <Link
            to="/profile"
            className="my-applications-avatar"
            aria-label="My profile"
          >
            ST
          </Link>
        </nav>
      </header>

      {/* Page heading */}
      <main className="my-applications-main">
        <div className="my-applications-heading">
          <h1>My applications</h1>
          <p>Track every work order you have applied to.</p>
        </div>

        {/* Status filters */}
        <div
          className="my-applications-filters"
          aria-label="Filter applications"
        >
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={
                activeFilter === filter ? "active" : ""
              }
              onClick={() => setActiveFilter(filter)}
              aria-pressed={activeFilter === filter}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {loading && (
          <section className="my-applications-list">
            <div className="my-applications-empty">
              Loading your applications...
            </div>
          </section>
        )}

        {/* Error state */}
        {!loading && error && (
          <section className="my-applications-list">
            <div
              className="my-applications-empty"
              role="alert"
            >
              <p>{error}</p>

              {error.includes("Please log in") && (
                <Link to="/login">
                  Go to student login
                </Link>
              )}
            </div>
          </section>
        )}

        {/* Real application records */}
        {!loading && !error && (
          <section
            className="my-applications-list"
            aria-label="Your applications"
          >
            {visibleApplications.length > 0 ? (
              visibleApplications.map((application) => {
                const workOrder = application.workOrderId;

                const workOrderId =
                  typeof workOrder === "object" &&
                  workOrder !== null
                    ? workOrder._id
                    : workOrder;

                const title =
                  typeof workOrder === "object" &&
                  workOrder !== null
                    ? workOrder.title ||
                      "Work order unavailable"
                    : "Work order unavailable";

                // The current /api/applications/my route
                // does not populate the business profile.
                const business = "Business details unavailable";

                const status = formatStatus(
                  application.status,
                );

                return (
                  <article
                    className="my-application-row"
                    key={application._id}
                  >
                    <div
                      className="my-application-business-icon"
                      aria-hidden="true"
                    >
                      BN
                    </div>

                    <div className="my-application-info">
                      <h2>{title}</h2>

                      <p>
                        {business} · Applied{" "}
                        {formatDate(application.createdAt)}
                      </p>
                    </div>

                    <span
                      className={`my-application-status ${
                        status === "Pending"
                          ? "status-pending"
                          : status === "Accepted"
                            ? "status-accepted"
                            : "status-not-selected"
                      }`}
                    >
                      {status}
                    </span>

                    {workOrderId ? (
                      <Link
                        to={`/work-orders/${workOrderId}`}
                        className="my-application-details"
                      >
                        View details
                      </Link>
                    ) : (
                      <span className="my-application-details">
                        Unavailable
                      </span>
                    )}
                  </article>
                );
              })
            ) : (
              <div className="my-applications-empty">
                {activeFilter === "All"
                  ? "You haven't submitted any applications yet."
                  : "No applications with this status yet."}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default MyApplications;