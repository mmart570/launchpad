
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "../styles/StudentProfile.css";

const API_URL = "http://localhost:3000";

function getBusinessToken() {
  for (const storage of [sessionStorage, localStorage]) {
    const token = storage.getItem("launchpad_token");
    const userText = storage.getItem("launchpad_user");

    if (!token || !userText) continue;

    try {
      const user = JSON.parse(userText);

      if (user.role === "business") {
        return token;
      }
    } catch {
      // Ignore invalid session data.
    }
  }

  return null;
}

function StudentPublicProfile() {
  const { id } = useParams();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadStudent() {
      const token = getBusinessToken();

      if (!token) {
        setError("Please log in with a business account.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/business/students/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.error || "Unable to load student profile.",
          );
        }

        if (!cancelled) {
          setStudent(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load student profile.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadStudent();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const profile = student?.studentProfile || {};

  const firstName = profile.firstName || "";
  const lastName = profile.lastName || "";

  const fullName =
    `${firstName} ${lastName}`.trim() || "Student";

  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() ||
    "ST";

  const school = profile.school || "School not specified";
  const major = profile.major || "Major not specified";

  const graduationYear = profile.graduationYear;

  const skills = Array.isArray(profile.skills)
    ? profile.skills
    : [];

  return (
    <div className="student-profile-page">
      <header className="student-profile-navbar">
        <Link
          to="/business-dashboard"
          className="student-profile-logo"
        >
          Launch<span>Pad</span>
        </Link>

        <nav
          className="student-profile-nav"
          aria-label="Business navigation"
        >
          <Link to="/business-dashboard">
            Dashboard
          </Link>

          <Link to="/businesses">
            Post a work order
          </Link>
        </nav>
      </header>

      <main className="student-profile-main">
        {loading && (
          <p>Loading student profile...</p>
        )}

        {!loading && error && (
          <div role="alert">
            <p>{error}</p>

            <Link to="/business-dashboard">
              Back to business dashboard
            </Link>
          </div>
        )}

        {!loading && !error && student && (
          <>
            <section className="student-profile-card">
              <div className="student-profile-top">
                <div
                  className="student-profile-avatar"
                  aria-hidden="true"
                >
                  {initials}
                </div>

                <div className="student-profile-identity">
                  <h1>{fullName}</h1>

                  <p>
                    {school} · {major}
                    {graduationYear
                      ? ` · Class of ${graduationYear}`
                      : ""}
                  </p>

                  <div className="student-profile-skills">
                    {skills.length > 0 ? (
                      skills.map((skill, index) => (
                        <span key={`${skill}-${index}`}>
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span>Skills not added yet</span>
                    )}
                  </div>

                  {profile.bio && (
                    <p style={{ marginTop: "12px" }}>
                      {profile.bio}
                    </p>
                  )}
                </div>
              </div>

              <div className="student-profile-stats">
                <div className="student-profile-stat">
                  <span>Completed work orders</span>
                  <strong>
                    {student.completedOrders ?? 0}
                  </strong>
                </div>

                <div className="student-profile-stat">
                  <span>Average rating</span>
                  <strong>—</strong>
                </div>

                <div className="student-profile-stat">
                  <span>Businesses worked with</span>
                  <strong>
                    {student.businessesWorkedWith ?? 0}
                  </strong>
                </div>
              </div>
            </section>

            <section className="student-portfolio">
              <h2>Portfolio</h2>

              {student.projects?.length > 0 ? (
                <div className="student-portfolio-grid">
                  {student.projects.map((project) => (
                    <article
                      className="student-portfolio-card"
                      key={project._id}
                    >
                      <span className="student-portfolio-category">
                        {project.category || "Work order"}
                      </span>

                      <h3>{project.title}</h3>

                      <p className="student-portfolio-business">
                        {project.businessId?.businessProfile
                          ?.companyName || "Business"}
                      </p>

                      <p className="student-portfolio-summary">
                        {project.description ||
                          "No project summary available."}
                      </p>

                      <Link
                        to={`/work-orders/${project._id}`}
                      >
                        View project
                      </Link>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="student-portfolio-grid">
                  <p>
                    No completed projects yet.
                  </p>
                </div>
              )}
            </section>

            <Link to="/business-dashboard">
              Back to business dashboard
            </Link>
          </>
        )}
      </main>
    </div>
  );
}

export default StudentPublicProfile;
