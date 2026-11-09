import { Link, useLocation } from "react-router-dom";
import "../styles/BusinessPage.css";

export default function WorkOrderSuccess() {
  const { state } = useLocation();

  return (
    <div className="business-page">
      <header className="business-navbar">
        <Link to="/business-dashboard" className="business-logo">
          Launch<span>Pad</span>
          <small>for Business</small>
        </Link>
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
