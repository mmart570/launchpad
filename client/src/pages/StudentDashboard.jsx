
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/StudentDashboard.css";

const API_URL = "http://localhost:3000";

// Categories will come from the actual work orders.
function StudentDashboard() {
  const [workOrders, setWorkOrders] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch real work orders from Max's Express backend.
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

        if (!Array.isArray(data)) {
          throw new Error("Unexpected response from the server.");
        }

        setWorkOrders(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching work orders:", err);
          setError("Unable to load work orders. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchWorkOrders();

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

  return (
    <div className="student-dashboard-page">
      <header className="dashboard-navbar">
        <Link to="/" className="dashboard-logo">
          Launch<span>Pad</span>
        </Link>

        <nav className="dashboard-nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/my-applications">My applications</Link>

          <Link
            to="/profile"
            className="dashboard-avatar"
            aria-label="Student profile"
          >
            AB
          </Link>
        </nav>
      </header>

      <main className="dashboard-main">
        <h1>Open work orders</h1>

        <p className="dashboard-subtitle">
          Pick a project to see the full details and the business behind it.
        </p>

        <div className="dashboard-filters" aria-label="Filter work orders">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`dashboard-filter ${
                activeCategory === category ? "active" : ""
              }`}
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

                <p className="work-order-description">
                  {order.description}
                </p>

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
