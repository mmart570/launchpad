import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/BusinessPage.css";

// Set the initial values for the work order form fields.
const initialForm = {
  title: "",
  description: "",
  workType: "",
  serviceType: "",
  skills: "",
  pay: "",
  hours: "",
  deadline: "",
};

function BusinessPage() {
  // Track form input and provide feedback after user actions.
  const [form, setForm] = useState(initialForm);
  const [notice, setNotice] = useState("");

  // Update the matching form field while preserving other values.
  function updateField(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // Calculate the displayed pay and total from the current form value.
  const payAmount = Number(form.pay) || 0;
  const serviceCharges = 0;
  const total = payAmount + serviceCharges;

  // Validate required fields before reporting the posting status.
  function handlePost(event) {
    event.preventDefault();

    if (!form.title.trim() || !form.description.trim()) {
      setNotice("Please enter a work order title and description.");
      return;
    }

    setNotice("Work order posting is not connected to the backend yet.");
  }

  // Explain that saving drafts is not available until backend integration.
  function handleSaveDraft() {
    setNotice("Draft saving is not connected to the backend yet.");
  }

  return (
    // Group business navigation, the posting form, and its summary.
    <div className="business-page">
      {/* Link the brand to the home page and identify the business area. */}
      <header className="business-navbar">
        <Link to="/" className="business-logo">
          Launch<span>Pad</span>
          <small>for Business</small>
        </Link>

        <span className="business-account-name">[Business name]</span>
      </header>

      {/* Introduce the form and guide businesses through posting work. */}
      <main className="business-main">
        <div className="business-page-heading">
          <h1>Post a work order</h1>
          <p>
            Describe the work and set the pay. Students will see it on their
            dashboard.
          </p>
        </div>

        {/* Collect work order details and handle form submission. */}
        <form
          id="business-work-order-form"
          className="business-layout"
          onSubmit={handlePost}
        >
          <div className="business-form-column">
            {/* Capture the work order title and service description. */}
            <section className="business-form-card">
              <h2>Overview</h2>

              <div className="business-card-body">
                <label htmlFor="business-title">Work order title</label>
                <input
                  id="business-title"
                  name="title"
                  type="text"
                  placeholder="e.g., Inventory tracker web app"
                  value={form.title}
                  onChange={updateField}
                />

                <label htmlFor="business-description">
                  Service description
                </label>
                <textarea
                  id="business-description"
                  name="description"
                  rows="5"
                  placeholder="[Describe the scope of work, deliverables, and tools.]"
                  value={form.description}
                  onChange={updateField}
                />
              </div>
            </section>

            {/* Gather the type of work, service, and required skills. */}
            <section className="business-form-card">
              <h2>Work Experience</h2>

              <div className="business-card-body">
                <div className="business-two-fields">
                  <div>
                    <label htmlFor="business-work-type">Type of work</label>
                    <input
                      id="business-work-type"
                      name="workType"
                      type="text"
                      placeholder="[Web development]"
                      value={form.workType}
                      onChange={updateField}
                    />
                  </div>

                  <div>
                    <label htmlFor="business-service-type">Service type</label>
                    <input
                      id="business-service-type"
                      name="serviceType"
                      type="text"
                      placeholder="[New build]"
                      value={form.serviceType}
                      onChange={updateField}
                    />
                  </div>
                </div>

                <label htmlFor="business-skills">Required skills</label>
                <input
                  id="business-skills"
                  name="skills"
                  type="text"
                  placeholder="[e.g., JavaScript, SQL]"
                  value={form.skills}
                  onChange={updateField}
                />
              </div>
            </section>

            {/* Collect compensation, estimated effort, and deadline. */}
            <section className="business-form-card">
              <h2>Pay and Schedule</h2>

              <div className="business-card-body business-three-fields">
                <div>
                  <label htmlFor="business-pay">Fixed pay ($)</label>
                  <input
                    id="business-pay"
                    name="pay"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="[Amount]"
                    value={form.pay}
                    onChange={updateField}
                  />
                </div>

                <div>
                  <label htmlFor="business-hours">Estimated hours</label>
                  <input
                    id="business-hours"
                    name="hours"
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="[Hours]"
                    value={form.hours}
                    onChange={updateField}
                  />
                </div>

                <div>
                  <label htmlFor="business-deadline">Deadline</label>
                  <input
                    id="business-deadline"
                    name="deadline"
                    type="text"
                    placeholder="[Date]"
                    value={form.deadline}
                    onChange={updateField}
                    onFocus={(event) => {
                      event.target.type = "date";
                    }}
                    onBlur={(event) => {
                      if (!event.target.value) {
                        event.target.type = "text";
                      }
                    }}
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Show the cost summary and work order actions. */}
          <aside className="business-sidebar">
            <section className="business-summary-card">
              <h2>Summary</h2>

              <div className="business-summary-body">
                <div className="business-summary-row">
                  <span>Pay</span>
                  <span>${payAmount.toFixed(2)}</span>
                </div>

                <div className="business-summary-row">
                  <span>Service charges</span>
                  <span>${serviceCharges.toFixed(2)}</span>
                </div>

                <div className="business-summary-total">
                  <strong>Total</strong>
                  <strong>${total.toFixed(2)}</strong>
                </div>

                <button type="submit" className="business-post-button">
                  Post work order
                </button>

                <button
                  type="button"
                  className="business-draft-button"
                  onClick={handleSaveDraft}
                >
                  Save draft
                </button>
              </div>
            </section>

            {/* Provide guidance and announce form status accessibly. */}
            <div className="business-tip-card">
              <strong>Tip:</strong> Clear scope and deliverables help students
              apply with confidence.
            </div>

            {notice && (
              <p className="business-form-notice" role="status">
                {notice}
              </p>
            )}
          </aside>
        </form>
      </main>
    </div>
  );
}

export default BusinessPage;
