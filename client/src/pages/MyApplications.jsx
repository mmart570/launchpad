import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/MyApplications.css";

// Sample applications until the backend is connected.
// Replace these records with data from MongoDB later.
const applications = [
  {
    id: 1,
    title: "[Work order title]",
    business: "[Business name]",
    date: "[date]",
    status: "Pending",
  },
  {
    id: 2,
    title: "[Work order title]",
    business: "[Business name]",
    date: "[date]",
    status: "Accepted",
  },
  {
    id: 3,
    title: "[Work order title]",
    business: "[Business name]",
    date: "[date]",
    status: "Pending",
  },
  {
    id: 4,
    title: "[Work order title]",
    business: "[Business name]",
    date: "[date]",
    status: "Not selected",
  },
];

const filters = ["All", "Pending", "Accepted", "Not selected"];

function MyApplications() {
  // Keep the selected status filter in sync with the application list.
  const [activeFilter, setActiveFilter] = useState("All");

  // Show every record for "All", or only records matching the chosen status.
  const visibleApplications =
    activeFilter === "All"
      ? applications
      : applications.filter(
          (application) => application.status === activeFilter,
        );

  return (
    <div className="my-applications-page">
      {/* Provide student navigation and indicate the current page. */}
      <header className="my-applications-navbar">
        <Link to="/" className="my-applications-logo">
          Launch<span>Pad</span>
        </Link>

        <nav className="my-applications-nav" aria-label="Student navigation">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/applications" className="active" aria-current="page">
            My applications
          </Link>
          <Link
            to="/profile"
            className="my-applications-avatar"
            aria-label="My profile"
          >
            [AB]
          </Link>
        </nav>
      </header>

      {/* Introduce the page and let students narrow applications by status. */}
      <main className="my-applications-main">
        <div className="my-applications-heading">
          <h1>My applications</h1>
          <p>Track every work order you have applied to.</p>
        </div>

        <div
          className="my-applications-filters"
          aria-label="Filter applications"
        >
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={activeFilter === filter ? "active" : ""}
              onClick={() => setActiveFilter(filter)}
              aria-pressed={activeFilter === filter}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Render matching application rows or an empty-state message. */}
        <section
          className="my-applications-list"
          aria-label="Your applications"
        >
          {visibleApplications.length > 0 ? (
            visibleApplications.map((application) => (
              <article className="my-application-row" key={application.id}>
                {/* Show the work order, business, submission date, and status. */}
                <div
                  className="my-application-business-icon"
                  aria-hidden="true"
                >
                  [BN]
                </div>

                <div className="my-application-info">
                  <h2>{application.title}</h2>
                  <p>
                    {application.business} · Applied {application.date}
                  </p>
                </div>

                <span
                  className={`my-application-status ${
                    application.status === "Pending"
                      ? "status-pending"
                      : application.status === "Accepted"
                        ? "status-accepted"
                        : "status-not-selected"
                  }`}
                >
                  {application.status}
                </span>

                <Link
                  to={`/work-orders/${application.id}`}
                  className="my-application-details"
                >
                  View details
                </Link>
              </article>
            ))
          ) : (
            <div className="my-applications-empty">
              No applications with this status yet.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default MyApplications;
