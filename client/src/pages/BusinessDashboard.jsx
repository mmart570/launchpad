
import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/BusinessDashboard.css'

// Placeholder data until the backend is connected.
const workOrders = [
  {
    id: 1,
    title: '[Work order title]',
    status: 'Open',
    applicantCount: '[#]',
  },
  {
    id: 2,
    title: '[Work order title]',
    status: 'In progress',
    applicantCount: '[#]',
  },
  {
    id: 3,
    title: '[Work order title]',
    status: 'Completed',
    applicantCount: '[#]',
  },
]

const applicantsByOrder = {
  1: [
    { id: 1, name: '[Student name]', school: '[School]', major: '[Major]' },
    { id: 2, name: '[Student name]', school: '[School]', major: '[Major]' },
    { id: 3, name: '[Student name]', school: '[School]', major: '[Major]' },
  ],
  2: [
    { id: 4, name: '[Student name]', school: '[School]', major: '[Major]' },
    { id: 5, name: '[Student name]', school: '[School]', major: '[Major]' },
  ],
  3: [
    { id: 6, name: '[Student name]', school: '[School]', major: '[Major]' },
  ],
}

const statistics = [
  { label: 'Open work orders', value: '[#]' },
  { label: 'New applicants', value: '[#]' },
  { label: 'In progress', value: '[#]' },
  { label: 'Completed', value: '[#]' },
]

function BusinessDashboard() {
  // Track which work order's applicants are shown and any action feedback.
  const [selectedOrderId, setSelectedOrderId] = useState(1)
  const [notice, setNotice] = useState('')

  // Derive the active order and applicant list from the selected order ID.
  const selectedOrder = workOrders.find(
    (order) => order.id === selectedOrderId,
  )

  const visibleApplicants = applicantsByOrder[selectedOrderId] || []

  // Switch the applicant panel to the chosen work order.
  function handleReviewApplicants(orderId) {
    setSelectedOrderId(orderId)
    setNotice('')
  }

  // Report that applicant decisions still need backend support.
  function handleAccept() {
    setNotice('Accepting applicants is not connected to the backend yet.')
  }

  return (
    <div className="business-dashboard-page">
      {/* Provide business navigation and identify the current dashboard page. */}
      <header className="business-dashboard-navbar">
        <Link to="/business-dashboard" className="business-dashboard-logo">
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
            [BN]
          </Link>
        </nav>
      </header>

      {/* Summarize account activity and provide access to work order management. */}
      <main className="business-dashboard-main">
        <div className="business-dashboard-heading">
          <div>
            <h1>Business dashboard</h1>
            <p>Manage your work orders and review applicants.</p>
          </div>

          <Link to="/businesses" className="business-dashboard-post">
            Post work order
          </Link>
        </div>

        {/* Show at-a-glance work order and applicant counts. */}
        <section
          className="business-dashboard-statistics"
          aria-label="Business statistics"
        >
          {statistics.map((stat) => (
            <div className="business-dashboard-stat-card" key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </section>

        {/* Pair the business's work orders with the selected applicant list. */}
        <div className="business-dashboard-content">
          <section className="business-dashboard-panel">
            <h2>Your work orders</h2>

            {/* Let the business select an order to review its applicants. */}
            <div className="business-dashboard-list">
              {workOrders.map((order) => (
                <article
                  className={`business-dashboard-order ${
                    selectedOrderId === order.id ? 'selected' : ''
                  }`}
                  key={order.id}
                >
                  <div className="business-dashboard-order-info">
                    <h3>{order.title}</h3>
                    <p>{order.applicantCount} applicants</p>
                  </div>

                  <span
                    className={`business-dashboard-status ${
                      order.status === 'Open'
                        ? 'status-open'
                        : order.status === 'In progress'
                          ? 'status-progress'
                          : 'status-completed'
                    }`}
                  >
                    {order.status}
                  </span>

                  <button
                    type="button"
                    className="business-dashboard-outline"
                    onClick={() => handleReviewApplicants(order.id)}
                    aria-pressed={selectedOrderId === order.id}
                  >
                    Review applicants
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="business-dashboard-panel">
            <h2>Applicants: {selectedOrder?.title}</h2>

            {/* Present applicants for the selected order and their available actions. */}
            <div className="business-dashboard-list">
              {visibleApplicants.map((applicant) => (
                <article
                  className="business-dashboard-applicant"
                  key={applicant.id}
                >
                  <div
                    className="business-dashboard-student-avatar"
                    aria-hidden="true"
                  >
                    [ST]
                  </div>

                  <div className="business-dashboard-applicant-info">
                    <h3>{applicant.name}</h3>
                    <p>
                      {applicant.school} · {applicant.major}
                    </p>
                  </div>

                  <Link
                    to="/profile"
                    className="business-dashboard-outline"
                  >
                    View profile
                  </Link>

                  <button
                    type="button"
                    className="business-dashboard-accept"
                    onClick={handleAccept}
                  >
                    Accept
                  </button>
                </article>
              ))}

              {visibleApplicants.length === 0 && (
                <p className="business-dashboard-empty">
                  No applicants for this work order yet.
                </p>
              )}
            </div>

            {notice && (
              <p className="business-dashboard-notice" role="status">
                {notice}
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

export default BusinessDashboard