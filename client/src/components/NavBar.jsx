// ============================================================================
// NAVIGATION BAR COMPONENT
// ============================================================================
// Main navigation header shown on landing page and public pages

import { Link } from "react-router-dom";

function NavBar() {
  return (
    <header className="navbar">
      {/* Logo - Links back to landing page for quick navigation */}
      <Link to="/" className="logo">
        Launch<span>Pad</span>
      </Link>

      {/* Navigation links for public site visitors */}
      <nav className="nav-links" aria-label="Main Navigation">
        <Link to="/login">Browse Work</Link>
        <Link to="/business-auth">For Businesses</Link>
        <Link to="/login">Log in</Link>
        <Link to="/signup" className="signup-button">
          Sign up
        </Link>
      </nav>
    </header>
  );
}

export default NavBar;
