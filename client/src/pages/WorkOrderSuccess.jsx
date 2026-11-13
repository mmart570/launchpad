/*
╔════════════════════════════════════════════════════════════════════════════╗
║                        WorkOrderSuccess.jsx                                ║
║                                                                            ║
║  Success confirmation page after business posts a work order. Displays     ║
║  confirmation message with next steps and links to dashboard or post       ║
║  another job. Confirms work order was created and is now discoverable      ║
║  by students.                                                              ║
║                                                                            ║
║  Key Features:                                                             ║
║  - Success confirmation messaging                                          ║
║  - Navigation to business dashboard                                        ║
║  - Option to post another work order                                       ║
║  - Notification icon/link                                                  ║
╚════════════════════════════════════════════════════════════════════════════╝
*/

import { Link, useLocation } from "react-router-dom";
import "../styles/BusinessPage.css";
import NotificationBell from "../components/NotificationBell";

export default function WorkOrderSuccess() {
  const { state } = useLocation();

  return (
    <div className="business-page">
      <header className="business-navbar">
        <Link to="/business-dashboard" className="business-logo">
          Launch<span>Pad</span>
          <small>for Business</small>
        </Link>
        <NotificationBell role="business" />
      </header>

      <main
        className="business-main"
        style={{
          maxWidth: "650px",
          margin: "80px auto",
          textAlign: "center",
        }}
      >
        <div className="business-form-card" style={{ padding: "45px 30px" }}>
          <div style={{ fontSize: "52px", color: "#16a34a" }}>✓</div>

          <h1>Work order published!</h1>

          <p style={{ marginTop: "15px" }}>
            Your work order has been successfully published. Students can now
            discover it and submit applications.
          </p>

          {state?.title && <h3 style={{ marginTop: "25px" }}>{state.title}</h3>}

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "15px",
              marginTop: "30px",
              flexWrap: "wrap",
            }}
          >
            <Link
              to="/business-dashboard"
              className="business-post-button"
              style={{
                textDecoration: "none",
                padding: "14px 24px",
              }}
            >
              View Business Dashboard
            </Link>

            <Link
              to="/businesses"
              className="business-draft-button"
              style={{
                textDecoration: "none",
                padding: "14px 24px",
              }}
            >
              Post another work order
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
