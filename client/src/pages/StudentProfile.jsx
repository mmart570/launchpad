import { Link } from "react-router-dom";
import "../styles/StudentProfile.css";

// Placeholder data until student profiles are connected to MongoDB.
const student = {
  name: "[Student name]",
  initials: "[AB]",
  school: "[School]",
  major: "[Major]",
  graduationYear: "[Year]",
  skills: ["[Skill]", "[Skill]", "[Skill]"],
  completedOrders: "[#]",
  averageRating: "[#]",
  businessesWorkedWith: "[#]",
};

// Render completed work as portfolio cards linked to their work order details.
const projects = [
  {
    id: 1,
    category: "[Category]",
    title: "[Project title]",
    business: "[Business name]",
    completedDate: "[date]",
    rating: "[Rating]",
    summary: "[Short project summary.]",
  },
  {
    id: 2,
    category: "[Category]",
    title: "[Project title]",
    business: "[Business name]",
    completedDate: "[date]",
    rating: "[Rating]",
    summary: "[Short project summary.]",
  },
  {
    id: 3,
    category: "[Category]",
    title: "[Project title]",
    business: "[Business name]",
    completedDate: "[date]",
    rating: "[Rating]",
    summary: "[Short project summary.]",
  },
];

function StudentProfile() {
  return (
    <div className="student-profile-page">
      {/* Provide student navigation and mark the active profile destination. */}
      <header className="student-profile-navbar">
        <Link to="/" className="student-profile-logo">
          Launch<span>Pad</span>
        </Link>

        <nav className="student-profile-nav" aria-label="Student navigation">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/my-applications">My applications</Link>
          <Link to="/profile" className="active" aria-current="page">
            Profile
          </Link>
          <Link
            to="/profile"
            className="student-profile-nav-avatar"
            aria-label="My profile"
          >
            {student.initials}
          </Link>
        </nav>
      </header>

      {/* Show the student's identity, skills, activity, and completed projects. */}
      <main className="student-profile-main">
        <section className="student-profile-card">
          {/* Combine identity details with the profile editing action. */}
          <div className="student-profile-top">
            <div className="student-profile-avatar" aria-hidden="true">
              {student.initials}
            </div>

            <div className="student-profile-identity">
              <h1>{student.name}</h1>
              <p>
                {student.school} · {student.major} · Class of{" "}
                {student.graduationYear}
              </p>

              <div className="student-profile-skills">
                {student.skills.map((skill, index) => (
                  <span key={`${skill}-${index}`}>{skill}</span>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="student-profile-edit"
              onClick={() => {
                window.alert(
                  "Profile editing will be available after backend integration.",
                );
              }}
            >
              Edit profile
            </button>
          </div>

          {/* Summarize the student's work history and reputation. */}
          <div className="student-profile-stats">
            <div className="student-profile-stat">
              <span>Completed work orders</span>
              <strong>{student.completedOrders}</strong>
            </div>

            <div className="student-profile-stat">
              <span>Average rating</span>
              <strong>{student.averageRating}</strong>
            </div>

            <div className="student-profile-stat">
              <span>Businesses worked with</span>
              <strong>{student.businessesWorkedWith}</strong>
            </div>
          </div>
        </section>

        {/* Highlight completed work in a browsable project grid. */}
        <section className="student-portfolio">
          <h2>Portfolio</h2>

          <div className="student-portfolio-grid">
            {projects.map((project) => (
              <article className="student-portfolio-card" key={project.id}>
                <span className="student-portfolio-category">
                  {project.category}
                </span>

                <h3>{project.title}</h3>

                <p className="student-portfolio-business">
                  <span aria-label="Verified business">✓</span>{" "}
                  {project.business}
                </p>

                <p>
                  Completed {project.completedDate} · Rating {project.rating}
                </p>

                <p className="student-portfolio-summary">{project.summary}</p>

                <Link to={`/work-orders/${project.id}`}>View project</Link>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default StudentProfile;
