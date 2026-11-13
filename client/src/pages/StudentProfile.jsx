/*
╔════════════════════════════════════════════════════════════════════════════╗
║                        StudentProfile.jsx                                  ║
║                                                                            ║
║  Student profile viewing and editing page. Displays student identity       ║
║  information (name, school, major, graduation year), skills, and           ║
║  portfolio of completed work. Provides edit button for profile updates     ║
║  and shows work statistics (completed projects, hours worked, etc).        ║
║                                                                            ║
║  Key Features:                                                             ║
║  - Student avatar and identity information                                 ║
║  - Skills display as tags                                                  ║
║  - Work statistics (completed projects, total hours)                       ║
║  - Portfolio grid showing completed work orders                            ║
║  - Edit profile button for profile updates                                 ║
║  - Business verification badges on completed work                          ║
║  - Responsive card and grid layouts                                        ║
╚════════════════════════════════════════════════════════════════════════════╝
*/

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProfileDropdown from "../components/ProfileDropdown";
import "../styles/StudentProfile.css";

const API_URL = "http://localhost:3000";

function getStudentToken() {
  for (const storage of [sessionStorage, localStorage]) {
    const token = storage.getItem("launchpad_token");
    const saved = storage.getItem("launchpad_user");
    if (!token || !saved) continue;
    try {
      if (JSON.parse(saved).role === "student") return token;
    } catch {
      // Ignore malformed stored login data.
    }
  }
  return null;
}

function toForm(profile = {}) {
  return {
    firstName: profile.firstName || "",
    lastName: profile.lastName || "",
    school: profile.school || "",
    major: profile.major || "",
    graduationYear:
      profile.graduationYear == null ? "" : String(profile.graduationYear),
    skills: Array.isArray(profile.skills) ? profile.skills.join(", ") : "",
    bio: profile.bio || "",
  };
}

export default function StudentProfile() {
  const [student, setStudent] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(toForm());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadProfile() {
      const token = getStudentToken();
      if (!token) {
        setError("Please log in with your student account.");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok)
          throw new Error(data.error || "Could not load your profile.");
        if (data.role !== "student")
          throw new Error("Please use a student account.");
        if (!controller.signal.aborted) {
          setStudent(data);
          setForm(toForm(data.studentProfile));
        }
        // Completed projects are inferred from accepted applications whose work order
        // has been marked completed. A missing/deleted work order is ignored.
        try {
          const applicationsResponse = await fetch(
            `${API_URL}/api/applications/my`,
            {
              headers: { Authorization: `Bearer ${token}` },
              signal: controller.signal,
            },
          );
          if (applicationsResponse.ok) {
            const applications = await applicationsResponse.json();
            if (Array.isArray(applications) && !controller.signal.aborted) {
              setProjects(
                applications
                  .filter(
                    (application) =>
                      application.status === "accepted" &&
                      application.workOrderId &&
                      typeof application.workOrderId === "object" &&
                      application.workOrderId.status === "completed",
                  )
                  .map((application) => application.workOrderId),
              );
            }
          }
        } catch (err) {
          if (err.name === "AbortError") throw err;
          console.error("Unable to load completed projects:", err);
        }
      } catch (err) {
        if (err.name !== "AbortError")
          setError(err.message || "Could not load your profile.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadProfile();
    return () => controller.abort();
  }, []);

  const profile = student?.studentProfile || {};
  const name =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    "Student";
  const initials =
    `${(profile.firstName || "").charAt(0)}${(profile.lastName || "").charAt(0)}`.toUpperCase() ||
    "ST";
  const skills = Array.isArray(profile.skills) ? profile.skills : [];
  const companies = new Set(
    projects
      .map((project) =>
        String(project.businessId?._id || project.businessId || ""),
      )
      .filter(Boolean),
  );

  function updateField(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSaveError("");
    setSaveMessage("");
    const token = getStudentToken();
    if (!token) {
      setSaveError("Your session has expired. Please log in again.");
      return;
    }
    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      school: form.school.trim(),
      major: form.major.trim(),
      graduationYear: form.graduationYear,
      skills: [
        ...new Set(
          form.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        ),
      ],
      bio: form.bio.trim(),
    };
    if (
      !payload.firstName ||
      !payload.lastName ||
      !payload.school ||
      !payload.major
    ) {
      setSaveError("Please fill in your name, university, and major.");
      return;
    }
    if (payload.skills.length > 20) {
      setSaveError("Please enter no more than 20 skills.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/students/me/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(result.error || "Unable to save profile.");
      setStudent(result);
      setForm(toForm(result.studentProfile));
      setEditing(false);
      setSaveMessage("Profile updated successfully.");
    } catch (err) {
      setSaveError(err.message || "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  }

  const fieldStyle = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    boxSizing: "border-box",
    font: "inherit",
  };
  const formGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "14px",
    marginTop: "18px",
  };

  return (
    <div className="student-profile-page">
      <header className="student-profile-navbar">
        <Link to="/dashboard" className="student-profile-logo">
          Launch<span>Pad</span>
        </Link>
        <nav className="student-profile-nav" aria-label="Student navigation">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/my-applications">My Applications</Link>
          <ProfileDropdown
            role="student"
            initials={initials}
            avatarClassName="student-profile-nav-avatar"
          />
        </nav>
      </header>

      <main className="student-profile-main">
        {loading && <p role="status">Loading your profile...</p>}
        {!loading && error && (
          <div role="alert">
            <p>{error}</p>
            <Link to="/login">Student login</Link>
          </div>
        )}
        {!loading && !error && student && (
          <>
            <section className="student-profile-card">
              <div className="student-profile-top">
                <div className="student-profile-avatar" aria-hidden="true">
                  {initials}
                </div>
                <div className="student-profile-identity">
                  <h1>{name}</h1>
                  <p>
                    {[
                      profile.school,
                      profile.major,
                      profile.graduationYear
                        ? `Class of ${profile.graduationYear}`
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Add your education details"}
                  </p>
                  <div className="student-profile-skills">
                    {skills.map((skill, index) => (
                      <span key={`${skill}-${index}`}>{skill}</span>
                    ))}
                  </div>
                  {profile.bio && (
                    <p style={{ marginTop: "12px" }}>{profile.bio}</p>
                  )}
                </div>
                <button
                  type="button"
                  className="student-profile-edit"
                  onClick={() => {
                    setEditing((current) => !current);
                    setForm(toForm(profile));
                    setSaveError("");
                    setSaveMessage("");
                  }}
                >
                  {editing ? "Cancel editing" : "Edit profile"}
                </button>
              </div>

              {saveMessage && (
                <p role="status" style={{ marginTop: "12px" }}>
                  {saveMessage}
                </p>
              )}
              {editing && (
                <form onSubmit={saveProfile} style={{ marginTop: "20px" }}>
                  <div style={formGridStyle}>
                    {[
                      ["firstName", "First name"],
                      ["lastName", "Last name"],
                      ["school", "University / School"],
                      ["major", "Major"],
                      ["graduationYear", "Graduation year"],
                      ["skills", "Skills (comma-separated)"],
                    ].map(([key, label]) => (
                      <label key={key} style={{ display: "grid", gap: "6px" }}>
                        <span>{label}</span>
                        <input
                          style={fieldStyle}
                          value={form[key]}
                          onChange={(e) => updateField(key, e.target.value)}
                          required={[
                            "firstName",
                            "lastName",
                            "school",
                            "major",
                          ].includes(key)}
                          type={key === "graduationYear" ? "number" : "text"}
                          min={key === "graduationYear" ? 1950 : undefined}
                          max={key === "graduationYear" ? 2100 : undefined}
                        />
                      </label>
                    ))}
                  </div>
                  <label
                    style={{ display: "grid", gap: "6px", marginTop: "14px" }}
                  >
                    <span>About me / Bio</span>
                    <textarea
                      style={fieldStyle}
                      rows={4}
                      value={form.bio}
                      onChange={(e) => updateField("bio", e.target.value)}
                    />
                  </label>
                  {saveError && (
                    <p role="alert" style={{ color: "#b91c1c" }}>
                      {saveError}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="student-profile-edit"
                    disabled={saving}
                    style={{ marginTop: "14px" }}
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </form>
              )}

              <div className="student-profile-stats">
                <div className="student-profile-stat">
                  <span>Completed work orders</span>
                  <strong>{projects.length}</strong>
                </div>
                <div className="student-profile-stat">
                  <span>Average rating</span>
                  <strong>—</strong>
                </div>
                <div className="student-profile-stat">
                  <span>Businesses worked with</span>
                  <strong>{companies.size}</strong>
                </div>
              </div>
            </section>

            <section className="student-portfolio">
              <h2>Portfolio</h2>
              {projects.length > 0 ? (
                <div className="student-portfolio-grid">
                  {projects.map((project) => (
                    <article
                      className="student-portfolio-card"
                      key={project._id}
                    >
                      <span className="student-portfolio-category">
                        {project.category || "Work order"}
                      </span>
                      <h3>{project.title}</h3>
                      <p className="student-portfolio-business">
                        <span aria-label="Verified business">✓</span>{" "}
                        {project.businessId?.businessProfile?.companyName ||
                          "Business"}
                      </p>
                      <p className="student-portfolio-summary">
                        {project.description ||
                          "No project description available."}
                      </p>
                      <Link to={`/work-orders/${project._id}`}>
                        View project
                      </Link>
                    </article>
                  ))}
                </div>
              ) : (
                <p>
                  No completed projects yet. Your completed work orders will
                  appear here.
                </p>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
