import { Link } from "react-router-dom";
import "./Header.css";

function Header() {
  return (
    <header className="header">

      <div className="header-container">

        <Link to="/" className="logo">
          🎬 CINI<span>HUB</span>
        </Link>

        <nav className="nav-menu">

          <Link to="/">Home</Link>

          <Link to="/movies">Movies</Link>

          <Link to="/reviews">Reviews</Link>

          <Link to="/community">Community</Link>

          <Link to="/login" className="login-link">
            Login
          </Link>

        </nav>

      </div>

    </header>
  );
}

export default Header;