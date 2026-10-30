import { useEffect } from "react";
import "../styles/BusinessInformation.css";

function BusinessInformation({ onClose, onMessage }) {
  // Close the dialog when Escape is pressed and remove the listener on cleanup.
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    // Dim the page behind the business profile dialog.
    <div
      className="business-info-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Expose the business profile as an accessible modal dialog. */}
      <section
        className="business-info-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="business-info-title"
      >
        {/* Present the business identity and dialog close control. */}
        <div className="business-info-header">
          <div className="business-info-identity">
            <div className="business-info-avatar">[BN]</div>

            <div>
              <h2 id="business-info-title">[Business name]</h2>
              <p className="business-info-verified">✓ Verified business</p>
            </div>
          </div>

          <button
            type="button"
            className="business-info-close"
            onClick={onClose}
            aria-label="Close business information"
          >
            ×
          </button>
        </div>

        {/* Summarize the business before showing profile details. */}
        <p className="business-info-description">
          [Short description of the business and what it does.]
        </p>

        {/* Display key business attributes in a two-column layout. */}
        <div className="business-info-grid">
          <div>
            <strong>Industry</strong>
            <span>[Industry]</span>
          </div>

          <div>
            <strong>Location</strong>
            <span>[City, state]</span>
          </div>

          <div>
            <strong>Overall rating</strong>
            <span>[Rating]</span>
          </div>

          <div>
            <strong>Work orders posted</strong>
            <span>[#]</span>
          </div>

          <div>
            <strong>Member since</strong>
            <span>[Month Year]</span>
          </div>

          <div>
            <strong>Contact</strong>
            <span>[Contact name]</span>
          </div>
        </div>

        {/* Offer messaging and return actions for the work order page. */}
        <div className="business-info-actions">
          <button
            type="button"
            className="business-info-message"
            onClick={onMessage}
          >
            Message business
          </button>

          <button
            type="button"
            className="business-info-back"
            onClick={onClose}
          >
            Back to work order
          </button>
        </div>
      </section>
    </div>
  );
}

export default BusinessInformation;
