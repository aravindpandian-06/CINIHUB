import { Link, useLocation } from "react-router-dom";
import "./Header.css";

function Header() {
  const location = useLocation();

  return (
    <header className="header film-strip-border">
      <div className="header-container">
        <Link to="/home" className="logo" aria-label="CINIHUB Home">
          <img
            src="/assets/cinihub-gold-logo.png"
            alt="CINIHUB"
            className="logo-image"
          />
        </Link>

        <nav className="nav-menu" aria-label="Main Navigation">
          <Link
            to="/home"
            className={`nav-item ${location.pathname === "/home" ? "active" : ""}`}
          >
            Home
          </Link>

          <Link
            to="/movies"
            className={`nav-item ${location.pathname === "/movies" ? "active" : ""}`}
          >
            Movies
          </Link>

          <Link
            to="/reviews"
            className={`nav-item ${location.pathname === "/reviews" ? "active" : ""}`}
          >
            Reviews
          </Link>

          <Link
            to="/community"
            className={`nav-item ${location.pathname === "/community" ? "active" : ""}`}
          >
            Community
          </Link>

          <Link
            to="/login"
            className={`login-link ${location.pathname === "/login" || location.pathname === "/signup" ? "active" : ""}`}
          >
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;
