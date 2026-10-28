import Navbar from "../components/NavBar";
import { Link } from "react-router-dom";
import "../styles/LandingPage.css";

// Keep the steps as data so their presentation stays consistent.
const steps = [
  {
    number: 1,
    title: "Create your account",
    description: "Sign up and set up your student profile in minutes.",
  },
  {
    number: 2,
    title: "Pick a work order",
    description: "Browse projects posted by businesses and open the details.",
  },
  {
    number: 3,
    title: "Build your track record",
    description:
      "Deliver real work and get noticed by the businesses you helped.",
  },
];

function LandingPage() {
  return (
    <div className="landing-page">
      {/* The hero introduces LaunchPad and highlights the primary actions. */}
      <section className="hero-section">
        <Navbar />

        <main className="hero-content">
          <h1>
            Your first real experience
            <br className="desktop-break" /> starts here.
          </h1>

          <p>
            LaunchPad connects CS students with real work orders from
            <br className="desktop-break" /> businesses, so your skills show up
            on more than a resume.
          </p>

          <div className="hero-buttons">
            <Link to="/signup" className="get-started-button">
              Get started
            </Link>

            <Link to="/businesses" className="post-work-button">
              Post a work order
            </Link>
          </div>
        </main>
      </section>

      {/* Explain the student workflow with cards generated from the step data. */}
      <section className="how-section">
        <div className="how-container">
          <h2>How it works</h2>

          <div className="steps-grid">
            {steps.map((step) => (
              <article className="step-card" key={step.number}>
                <div
                  className={`step-number ${
                    step.number === 3 ? "step-green" : ""
                  }`}
                >
                  {step.number}
                </div>

                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
