/*
╔════════════════════════════════════════════════════════════════════════════╗
║                         BusinessPage.jsx                                   ║
║                                                                            ║
║  Business work order creation and posting form. Allows businesses to       ║
║  create new job postings with detailed specifications. Includes work       ║
║  type, service type, pay rate, schedule, scope, and deliverables.          ║
║  Displays real-time cost calculation and allows draft/publish options.     ║
║                                                                            ║
║  Key Features:                                                             ║
║  - Multi-field form for work order details                                 ║
║  - Work type and service type selection                                    ║
║  - Payment and schedule configuration                                      ║
║  - Real-time cost summary calculation                                      ║
║  - Draft/publish toggle for post-now or save-for-later                     ║
║  - Scope and deliverables description fields                               ║
║  - Form validation before submission                                       ║
╚════════════════════════════════════════════════════════════════════════════╝
*/

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "../styles/BusinessPage.css";
import ProfileDropdown from "../components/ProfileDropdown";

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
  submissionInstructions: "",
  allowEmptySubmission: false,
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
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEditing = Boolean(editId);
  const [existingStatus, setExistingStatus] = useState(null);
  const [loadingExisting, setLoadingExisting] = useState(false);

  useEffect(() => {
    if (!editId) return;

    const session = getBusinessSession();

    if (!session) {
      setNotice("Please log in with a business account.");
      setNoticeType("error");
      return;
    }

    let cancelled = false;

    async function loadExistingOrder() {
      setLoadingExisting(true);

      try {
        const response = await fetch(`${API_URL}/api/business/work-orders`, {
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
        });

        const orders = await response.json();

        if (!response.ok || !Array.isArray(orders)) {
          throw new Error("Unable to load work order.");
        }

        const order = orders.find((item) => item._id === editId);

        if (!order) {
          throw new Error("Work order not found.");
        }

        if (["completed", "closed"].includes(order.status)) {
          throw new Error("Completed work orders cannot be edited.");
        }

        if (cancelled) return;

        setExistingStatus(order.status);

        setForm({
          title: order.title || "",
          description: order.description || "",
          workType: order.category || "",
          serviceType: order.serviceType || "",
          skills: Array.isArray(order.skills) ? order.skills.join(", ") : "",
          pay: order.budget == null ? "" : String(order.budget),
          hours:
            order.estimatedHours == null ? "" : String(order.estimatedHours),
          deadline: order.deadline
            ? new Date(order.deadline).toISOString().slice(0, 10)
            : "",
          submissionInstructions: order.submissionInstructions || "",
          allowEmptySubmission: order.allowEmptySubmission === true,
        });
      } catch (error) {
        if (!cancelled) {
          setNotice(error.message);
          setNoticeType("error");
        }
      } finally {
        if (!cancelled) setLoadingExisting(false);
      }
    }

    loadExistingOrder();

    return () => {
      cancelled = true;
    };
  }, [editId]);

  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState(null);

  function updateField(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setNotice("");
    setNoticeType("");
    setCreatedOrderId(null);
  }

  const payAmount = Number(form.pay) || 0;
  const serviceCharges = 0;
  const total = payAmount + serviceCharges;

  function buildPayload(status) {
    return {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.workType.trim(),
      serviceType: form.serviceType.trim(),
      skills: form.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
      budget: form.pay === "" ? null : Number(form.pay),
      estimatedHours: form.hours === "" ? null : Number(form.hours),
      deadline: form.deadline
        ? new Date(`${form.deadline}T12:00:00.000Z`).toISOString()
        : null,
      submissionInstructions: form.submissionInstructions.trim(),
      allowEmptySubmission: form.allowEmptySubmission,
      status,
    };
  }

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
      const payload = buildPayload("open");

      let url = `${API_URL}/api/work-orders`;
      let method = "POST";

      if (isEditing) {
        url = `${API_URL}/api/business/work-orders/${editId}`;
        method = "PATCH";
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Unable to save work order.");
      }

      const savedId = result._id || editId;

      if (isEditing && existingStatus === "draft") {
        const publishResponse = await fetch(
          `${API_URL}/api/business/work-orders/${savedId}/publish`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${session.token}`,
            },
          },
        );

        const published = await publishResponse.json().catch(() => ({}));

        if (!publishResponse.ok) {
          throw new Error(
            published.error || "Draft saved, but publishing failed.",
          );
        }

        navigate(`/businesses/success`, {
          state: {
            workOrderId: savedId,
            title: published.title,
          },
        });
      } else {
        navigate(isEditing ? "/business-dashboard" : "/businesses/success", {
          state: {
            workOrderId: savedId,
            title: result.title,
          },
        });
      }
    } catch (error) {
      console.error("Work order posting failed:", error);

      setNotice(
        error.message || "Unable to post your work order. Please try again.",
      );
      setNoticeType("error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveDraft() {
    const session = getBusinessSession();

    if (!session) {
      setNotice("Please log in with a business account.");
      setNoticeType("error");
      return;
    }

    setLoading(true);
    setNotice("");

    try {
      const response = await fetch(
        isEditing
          ? `${API_URL}/api/business/work-orders/${editId}`
          : `${API_URL}/api/work-orders`,
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify(buildPayload("draft")),
        },
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Unable to save draft.");
      }

      navigate("/business-dashboard");
    } catch (error) {
      setNotice(error.message || "Unable to save draft.");
      setNoticeType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="business-page">
      <header className="business-navbar">
        <Link to="/business-dashboard" className="business-logo">
          Launch<span>Pad</span>
          <small>for Business</small>
        </Link>

        <nav className="business-nav">
          {isEditing && (
            <Link to={`/work-orders/${editId}?tab=messages`}>
              Work order messages
            </Link>
          )}
          <Link to="/business-dashboard" className="business-account-name">
            Business Dashboard
          </Link>

          <ProfileDropdown
            role="business"
            initials="BU"
            avatarClassName="business-page-nav-avatar"
          />
        </nav>
      </header>

      <main className="business-main">
        <div className="business-page-heading">
          <h1>Post a Work Order</h1>
          <p>
            Describe the work and set the pay. Students will see it on their
            dashboard.
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
                  placeholder="Describe the scope of work, deliverables, and tools."
                  value={form.description}
                  onChange={updateField}
                />
              </div>
            </section>

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
                      placeholder="e.g., Web Development"
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
                      placeholder="e.g., New build"
                      value={form.serviceType}
                      onChange={updateField}
                    />
                  </div>
                </div>

                <label htmlFor="business-skills">Required Skills</label>
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
                  <label htmlFor="business-pay">Fixed pay ($)</label>
                  <input
                    id="business-pay"
                    name="pay"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Amount"
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
                    placeholder="Hours"
                    value={form.hours}
                    onChange={updateField}
                  />
                </div>

                <div>
                  <label htmlFor="business-deadline">Deadline</label>
                  <input
                    id="business-deadline"
                    name="deadline"
                    type="date"
                    value={form.deadline}
                    onChange={updateField}
                  />
                </div>
              </div>
            </section>

            <section className="business-form-card">
              <h2>Submission Requirements</h2>
              <div className="business-card-body">
                <label htmlFor="business-submission-instructions">
                  Instructions for submitting completed work (optional)
                </label>
                <textarea
                  id="business-submission-instructions"
                  name="submissionInstructions"
                  rows="4"
                  maxLength={10000}
                  placeholder="e.g., Upload your project ZIP and screenshots, or explain how the completed work can be verified."
                  value={form.submissionInstructions}
                  onChange={updateField}
                />

                <label
                  className="business-empty-submission-option"
                  htmlFor="business-allow-empty"
                >
                  <input
                    id="business-allow-empty"
                    name="allowEmptySubmission"
                    type="checkbox"
                    checked={form.allowEmptySubmission}
                    onChange={updateField}
                  />
                  <span>
                    Allow students to submit without notes, links, or files
                  </span>
                </label>
                <p className="business-submission-help">
                  {form.allowEmptySubmission
                    ? "Students can submit with all fields empty. You will still review and approve their work."
                    : "Students must provide notes, a project link, or at least one attachment."}
                </p>
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
                  disabled={loading || loadingExisting}
                >
                  {loading
                    ? "Saving..."
                    : isEditing && existingStatus === "draft"
                      ? "Publish work order"
                      : isEditing
                        ? "Save changes"
                        : "Post work order"}
                </button>

                {(!isEditing || existingStatus === "draft") && (
                  <button
                    type="button"
                    className="business-draft-button"
                    onClick={handleSaveDraft}
                    disabled={loading || loadingExisting}
                  >
                    {loading ? "Saving..." : "Save draft"}
                  </button>
                )}
              </div>
            </section>

            <div className="business-tip-card">
              <strong>Tip:</strong> Clear scope and deliverables help students
              apply with confidence.
            </div>

            {notice && (
              <div
                className="business-form-notice"
                role={noticeType === "error" ? "alert" : "status"}
              >
                <p>{notice}</p>

                {noticeType === "error" && notice.includes("Please log in") && (
                  <Link to="/business-auth">Go to business login</Link>
                )}

                {noticeType === "success" && (
                  <p>
                    <Link to="/dashboard">View student dashboard</Link>
                    {createdOrderId && (
                      <>
                        {" · "}
                        <Link to={`/work-orders/${createdOrderId}`}>
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
