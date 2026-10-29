import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/StudentDashboard.css";

// Provide sample work orders for the dashboard until live data is available.
const workOrders = [
  {
    id: 1,
    title: "Inventory tracker web app",
    status: "New",
    category: "Web",
    business: "[Business name]",
    description: "[Short project summary goes here.]",
  },
  {
    id: 2,
    title: "Sales report dashboard",
    status: "Paid",
    category: "Data",
    business: "[Business name]",
    description: "[Short project summary goes here.]",
  },
  {
    id: 3,
    title: "Appointment booking app",
    status: "Open",
    category: "Mobile",
    business: "[Business name]",
    description: "[Short project summary goes here.]",
  },
];

// Define the categories available in the dashboard filter controls.
const categories = ["All", "Web", "Data", "Mobile"];

function StudentDashboard() {
  // Track the selected category to keep the displayed orders in sync.
  const [activeCategory, setActiveCategory] = useState("All");

  // Show every order for "All" or only orders matching the selected category.
  const filteredOrders =
    activeCategory === "All"
      ? workOrders
      : workOrders.filter((order) => order.category === activeCategory);

  return (
    // Group dashboard navigation and work order content on one page.
    <div className="student-dashboard-page">
      {/* Provide brand navigation, page links, and a profile indicator. */}
      <header className="dashboard-navbar">
        <Link to="/" className="dashboard-logo">
          Launch<span>Pad</span>
        </Link>

        <nav className="dashboard-nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/applications">My applications</Link>
          <div className="dashboard-avatar" aria-label="Student profile">
            AB
          </div>
        </nav>
      </header>

      {/* Introduce available work orders and provide category filters. */}
      <main className="dashboard-main">
        <h1>Open work orders</h1>
        <p className="dashboard-subtitle">
          Pick a project to see the full details and the business behind it.
        </p>

        {/* Let students filter work orders by project category. */}
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

        {/* Display each order that matches the active category filter. */}
        <div className="work-orders-grid">
          {filteredOrders.map((order) => (
            <article className="work-order-card" key={order.id}>
              {/* Show the order's current status and project category. */}
              <div className="work-order-badges">
                <span className="work-order-status">{order.status}</span>
                <span className="work-order-category">{order.category}</span>
              </div>

              <h2>{order.title}</h2>

              {/* Identify the business associated with the work order. */}
              <p className="work-order-business">
                <span className="verified-check">✓</span>
                {order.business}, verified
              </p>

              <p className="work-order-description">{order.description}</p>

              {/* Link to the individual work order's detail page. */}
              <Link
                to={`/work-orders/${order.id}`}
                className="view-details-button"
              >
                View details
              </Link>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}

export default StudentDashboard;
