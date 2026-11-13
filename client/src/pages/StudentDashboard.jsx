/*
╔════════════════════════════════════════════════════════════════════════════╗
║                       StudentDashboard.jsx                                 ║
║                                                                            ║
║  Primary student dashboard displaying available work orders to apply       ║
║  for. Provides browsable job listings with category filters and            ║
║  verification badges. Shows business name, work description, and           ║
║  provides quick access to work order details and application form.         ║
║                                                                            ║
║  Key Features:                                                             ║
║  - Responsive grid of work order cards                                     ║
║  - Category-based filtering (all, development, design, etc)                ║
║  - Work order status and category badges                                   ║
║  - Business verification checkmark indicator                               ║
║  - Links to detailed work order views                                      ║
║  - Search/discovery interface for students                                 ║
╚════════════════════════════════════════════════════════════════════════════╝
*/

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/StudentDashboard.css";
import ProfileDropdown from "../components/ProfileDropdown";

const API_URL = "http://localhost:3000";

// Categories will come from the actual work orders.
function StudentDashboard() {
  const [workOrders, setWorkOrders] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [myApplications, setMyApplications] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [accountNotice, setAccountNotice] = useState("");

  // Fetch real work orders from the Express backend.
  useEffect(() => {
    const controller = new AbortController();

    async function fetchWorkOrders() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/api/work-orders`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to load work orders.");
        }

        const data = await response.json();

        // Extract the work orders array from the backend response.
        const orders = Array.isArray(data) ? data : data?.workOrders;

        if (!Array.isArray(orders)) {
          throw new Error("Unexpected response from the server.");
        }

        if (!controller.signal.aborted) setWorkOrders(orders);
      } catch (err) {
        if (err.name !== "AbortError" && !controller.signal.aborted) {
          console.error("Error fetching work orders:", err);
          setError("Unable to load work orders. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchWorkOrders();
    return () => controller.abort();
  }, []);

  // Load the logged-in student's applications and private problem reports.
  useEffect(() => {
    const controller = new AbortController();
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
        // Ignore invalid saved session data.
      }
    }

    if (!token) return () => controller.abort();

    const headers = { Authorization: `Bearer ${token}` };

    async function fetchStudentActivity() {
      try {
        const [applicationsResponse, reportsResponse] = await Promise.all([
          fetch(`${API_URL}/api/applications/my`, {
            headers,
            signal: controller.signal,
          }),
          fetch(`${API_URL}/api/reports/my`, {
            headers,
            signal: controller.signal,
          }),
        ]);

        const [applications, reports] = await Promise.all([
          applicationsResponse.json().catch(() => null),
          reportsResponse.json().catch(() => null),
        ]);

        if (!applicationsResponse.ok || !Array.isArray(applications)) {
          throw new Error("Unable to load your applications.");
        }
        if (!reportsResponse.ok || !Array.isArray(reports)) {
          throw new Error("Unable to load your reports.");
        }

        if (!controller.signal.aborted) {
          setMyApplications(applications);
          setMyReports(reports);
          setAccountNotice("");
        }
      } catch (err) {
        if (!controller.signal.aborted && err.name !== "AbortError") {
          setAccountNotice(err.message || "Unable to load your activity.");
        }
      }
    }

    fetchStudentActivity();
    return () => controller.abort();
  }, []);

  // Generate category filters from the database.
  const categories = [
    "All",
    ...new Set(workOrders.map((order) => order.category).filter(Boolean)),
  ];

  const filteredOrders =
    activeCategory === "All"
      ? workOrders
      : workOrders.filter((order) => order.category === activeCategory);

  const acceptedApplications = myApplications.filter(
    (application) => application.status === "accepted",
  );

  return (
    <div className="student-dashboard-page">
      <header className="dashboard-navbar">
        <Link to="/dashboard" className="dashboard-logo">
          Launch<span>Pad</span>
        </Link>

        <nav className="dashboard-nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/my-applications">My Applications</Link>
          {/* Messages are available within each work order's detail page. */}
          <ProfileDropdown
            role="student"
            initials="AB"
            avatarClassName="dashboard-avatar"
          />
        </nav>
      </header>

      <main className="dashboard-main">
        <section
          className="dashboard-message"
          aria-label="My LaunchPad activity"
          style={{ marginBottom: 20 }}
        >
          <h2>My activity</h2>
          <p>
            <strong>
              {
                myApplications.filter(
                  (application) => application.status === "pending",
                ).length
              }
            </strong>{" "}
            pending applications ·{" "}
            <strong>{acceptedApplications.length}</strong> accepted ·{" "}
            <strong>{myReports.length}</strong> problem reports
          </p>
          {accountNotice && <p role="alert">{accountNotice}</p>}

          {acceptedApplications.map((application) => {
            const order = application.workOrderId;
            if (!order?._id) return null;

            return (
              <p key={application._id}>
                <strong>{order.title}</strong> —{" "}
                {order.status === "completed" ? "Completed" : "Active project"}{" "}
                ·{" "}
                <Link to={`/student/work-orders/${order._id}/submit`}>
                  View work submissions
                </Link>{" "}
                ·{" "}
                <Link to={`/work-orders/${order._id}?tab=messages`}>
                  Messages
                </Link>
              </p>
            );
          })}

          <Link to="/my-applications">View all applications</Link>

          {myReports.length > 0 && (
            <details style={{ marginTop: 10 }}>
              <summary>My problem reports</summary>
              {myReports.map((report) => (
                <p key={report._id}>
                  {report.reason} — {report.status} ·{" "}
                  {new Date(report.createdAt).toLocaleDateString()}
                </p>
              ))}
            </details>
          )}
        </section>

        <h1>Open work orders</h1>
        <p className="dashboard-subtitle">
          Pick a project to see the full details and the business behind it.
        </p>

        <div className="dashboard-filters" aria-label="Filter work orders">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`dashboard-filter ${activeCategory === category ? "active" : ""}`}
              onClick={() => setActiveCategory(category)}
              aria-pressed={activeCategory === category}
            >
              {category}
            </button>
          ))}
        </div>

        {loading && (
          <p className="dashboard-message" role="status">
            Loading work orders...
          </p>
        )}
        {error && (
          <p className="dashboard-message" role="alert">
            {error}
          </p>
        )}
        {!loading && !error && filteredOrders.length === 0 && (
          <p className="dashboard-message">
            No work orders available in this category yet.
          </p>
        )}

        {!loading && !error && (
          <div className="work-orders-grid">
            {filteredOrders.map((order) => (
              <article className="work-order-card" key={order._id}>
                <div className="work-order-badges">
                  <span className="work-order-status">
                    {order.status === "open" ? "Open" : order.status}
                  </span>
                  <span className="work-order-category">
                    {order.category || "Other"}
                  </span>
                </div>
                <h2>{order.title}</h2>
                <p className="work-order-business">
                  {order.businessId?.businessProfile?.companyName ||
                    "Business name unavailable"}
                </p>
                <p className="work-order-description">{order.description}</p>
                <Link
                  to={`/work-orders/${order._id}`}
                  className="view-details-button"
                >
                  View details
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default StudentDashboard;
