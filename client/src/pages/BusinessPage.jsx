
import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/BusinessPage.css";

const API_URL = "http://localhost:3000";

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

function getBusinessSession() {
  for (const storage of [sessionStorage, localStorage]) {
    const token = storage.getItem("launchpad_token");
    const userText = storage.getItem("launchpad_user");

    if (!token || !userText) continue;

    try {
      const user = JSON.parse(userText);

      if (user.role === "business") {
        return { token, user };
      }
    } catch {
      // Ignore an invalid saved session.
    }
  }

  return null;
}

function BusinessPage() {
  const [form, setForm] = useState(initialForm);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState(null);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setNotice("");
    setNoticeType("");
    setCreatedOrderId(null);
  }

  const payAmount = Number(form.pay) || 0;
  const serviceCharges = 0;
  const total = payAmount + serviceCharges;

  async function handlePost(event) {
    event.preventDefault();

    setNotice("");
    setNoticeType("");
    setCreatedOrderId(null);

    const session = getBusinessSession();

    if (!session) {
      setNotice(
        "Please log in with a business account before posting a work order.",
      );
      setNoticeType("error");
      return;
    }

    if (!form.title.trim() || !form.description.trim()) {
      setNotice("Please enter a work order title and description.");
      setNoticeType("error");
      return;
    }

    if (!form.workType.trim()) {
      setNotice("Please enter the type of work.");
      setNoticeType("error");
      return;
    }

    if (form.pay.trim() === "" || !Number.isFinite(Number(form.pay))) {
      setNotice("Please enter a valid fixed pay amount.");
      setNoticeType("error");
      return;
    }

    if (Number(form.pay) <= 0) {
      setNotice("The fixed pay amount must be greater than zero.");
      setNoticeType("error");
      return;
    }

    if (!form.deadline) {
      setNotice("Please select a deadline.");
      setNoticeType("error");
      return;
    }

    const deadline = new Date(`${form.deadline}T12:00:00.000Z`);

    if (Number.isNaN(deadline.getTime())) {
      setNotice("Please select a valid deadline.");
      setNoticeType("error");
      return;
    }

    if (deadline.getTime() <= Date.now()) {
      setNotice("Please select a future deadline.");
      setNoticeType("error");
      return;
    }

    setLoading(true);

    try {
      // These are the fields supported by the current work order API.
      // The backend should derive businessId from the authenticated token.
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.workType.trim(),
        budget: Number(form.pay),
        deadline: deadline.toISOString(),
      };

      const response = await fetch(`${API_URL}/api/work-orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            `Unable to post work order (${response.status}).`,
        );
      }

      setCreatedOrderId(result?._id || result?.workOrder?._id || null);
      setNotice(
        "Work order posted successfully! Students can now find it on their dashboard.",
      );
      setNoticeType("success");
      setForm(initialForm);
    } catch (error) {
      console.error("Work order posting failed:", error);

      setNotice(
        error.message ||
          "Unable to post your work order. Please try again.",
      );
      setNoticeType("error");
    } finally {
      setLoading(false);
    }
  }

  function handleSaveDraft() {
    setNotice("Draft saving is not available in the backend yet.");
    setNoticeType("info");
    setCreatedOrderId(null);
  }

  return (
    <div className="business-page">
      <header className="business-navbar">
        <Link to="/" className="business-logo">
          Launch<span>Pad</span>
          <small>for Business</small>
        </Link>

        <Link
          to="/business-dashboard"
          className="business-account-name"
        >
          Business dashboard
        </Link>
      </header>

      <main className="business-main">
        <div className="business-page-heading">
          <h1>Post a work order</h1>
          <p>
            Describe the work and set the pay. Students will see it on
            their dashboard.
          </p>
        </div>

        <form
          id="business-work-order-form"
          className="business-layout"
          onSubmit={handlePost}
        >
          <div className="business-form-column">
            <section className="business-form-card">
              <h2>Overview</h2>

              <div className="business-card-body">
                <label htmlFor="business-title">
                  Work order title
                </label>
                <input
                  id="business-title"
                  name="title"
                  type="text"
                  placeholder="e.g., Inventory tracker web app"
                  value={form.title}
                  onChange={updateField}
                  required
                />

                <label htmlFor="business-description">
                  Service description
                </label>
                <textarea
                  id="business-description"
                  name="description"
                  rows="5"
                  placeholder="Describe the scope of work, deliverables, and tools."
                  value={form.description}
                  onChange={updateField}
                  required
                />
              </div>
            </section>

            <section className="business-form-card">
              <h2>Work Experience</h2>

              <div className="business-card-body">
                <div className="business-two-fields">
                  <div>
                    <label htmlFor="business-work-type">
                      Type of work
                    </label>
                    <input
                      id="business-work-type"
                      name="workType"
                      type="text"
                      placeholder="e.g., Web Development"
                      value={form.workType}
                      onChange={updateField}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="business-service-type">
                      Service type
                    </label>
                    <input
                      id="business-service-type"
                      name="serviceType"
                      type="text"
                      placeholder="e.g., New build"
                      value={form.serviceType}
                      onChange={updateField}
                    />
                  </div>
                </div>

                <label htmlFor="business-skills">
                  Required skills
                </label>
                <input
                  id="business-skills"
                  name="skills"
                  type="text"
                  placeholder="e.g., JavaScript, SQL"
                  value={form.skills}
                  onChange={updateField}
                />
              </div>
            </section>

            <section className="business-form-card">
              <h2>Pay and Schedule</h2>

              <div className="business-card-body business-three-fields">
                <div>
                  <label htmlFor="business-pay">
                    Fixed pay ($)
                  </label>
                  <input
                    id="business-pay"
                    name="pay"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Amount"
                    value={form.pay}
                    onChange={updateField}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="business-hours">
                    Estimated hours
                  </label>
                  <input
                    id="business-hours"
                    name="hours"
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="Hours"
                    value={form.hours}
                    onChange={updateField}
                  />
                </div>

                <div>
                  <label htmlFor="business-deadline">
                    Deadline
                  </label>
                  <input
                    id="business-deadline"
                    name="deadline"
                    type="date"
                    value={form.deadline}
                    onChange={updateField}
                    required
                  />
                </div>
              </div>
            </section>
          </div>

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

                <button
                  type="submit"
                  className="business-post-button"
                  disabled={loading}
                >
                  {loading
                    ? "Posting work order..."
                    : "Post work order"}
                </button>

                <button
                  type="button"
                  className="business-draft-button"
                  onClick={handleSaveDraft}
                  disabled={loading}
                >
                  Save draft
                </button>
              </div>
            </section>

            <div className="business-tip-card">
              <strong>Tip:</strong> Clear scope and deliverables help
              students apply with confidence.
            </div>

            {notice && (
              <div
                className="business-form-notice"
                role={noticeType === "error" ? "alert" : "status"}
              >
                <p>{notice}</p>

                {noticeType === "error" &&
                  notice.includes("Please log in") && (
                    <Link to="/business-auth">
                      Go to business login
                    </Link>
                  )}

                {noticeType === "success" && (
                  <p>
                    <Link to="/dashboard">
                      View student dashboard
                    </Link>
                    {createdOrderId && (
                      <>
                        {" · "}
                        <Link
                          to={`/work-orders/${createdOrderId}`}
                        >
                          View work order details
                        </Link>
                      </>
                    )}
                  </p>
                )}
              </div>
            )}
          </aside>
        </form>
      </main>
    </div>
  );
}

export default BusinessPage;