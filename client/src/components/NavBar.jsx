import { Link } from "react-router-dom";

function NavBar() {
  return (
    <header className="navbar">
      {/* The logo always returns visitors to the landing page. */}
      <Link to="/" className="logo">
        Launch<span>Pad</span>
      </Link>

      {/* Navigation links provide entry points for students and businesses. */}
      <nav className="nav-links" aria-label="Main Navigation">
        <Link to="/browse">Browse Work</Link>
        <Link to="/businesses">For Businesses</Link>
        <Link to="/login">Log in</Link>
        <Link to="/signup" className="signup-button">
          Sign up
        </Link>
      </nav>
    </header>
  );
}

export default NavBar;
