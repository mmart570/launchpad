// ============================================================================
// BUSINESS INFORMATION MODAL COMPONENT
// ============================================================================
// Displays detailed business profile information in a modal dialog

import { useEffect } from "react";
import "../styles/BusinessInformation.css";

function BusinessInformation({ onClose, onMessage }) {
  // Handle Escape key to close the modal
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
    // Overlay backdrop - clicking on it closes the modal
    <div
      className="business-info-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Accessible modal dialog for business information */}
      <section
        className="business-info-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="business-info-title"
      >
        {/* Header with business name, verification badge, and close button */}
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

        {/* Brief business description */}
        <p className="business-info-description">
          [Short description of the business and what it does.]
        </p>

        {/* Key business metrics and information in grid layout */}
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

        {/* Action buttons for messaging and returning to work order */}
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
