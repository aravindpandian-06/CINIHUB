import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  return (
    <section className="home-page">

      <div className="home-hero">

        <div className="hero-text">

          <span className="hero-badge">
            🎬 WELCOME TO CINIHUB
          </span>

          <h1>
            Discover Your Next
            <span> Favourite Movie</span>
          </h1>

          <p>
            Explore movies, share reviews, connect with movie
            lovers and discover what's worth watching.
          </p>

          <div className="hero-buttons">

            <Link to="/movies" className="primary-btn">
              Explore Movies 🎬
            </Link>

            <Link to="/reviews" className="secondary-btn">
              Read Reviews ⭐
            </Link>

          </div>

        </div>

        <div className="hero-visual">

          <div className="movie-circle">
            🎥
          </div>

          <div className="floating-card card-one">
            ⭐ 9.2 Rating
          </div>

          <div className="floating-card card-two">
            🎬 1000+ Movies
          </div>

        </div>

      </div>


      <div className="home-features">

        <div className="feature-card">
          <div>🎬</div>
          <h3>Discover Movies</h3>
          <p>
            Find movies across different genres and years.
          </p>
        </div>

        <div className="feature-card">
          <div>⭐</div>
          <h3>Share Reviews</h3>
          <p>
            Share your opinion and see what others think.
          </p>
        </div>

        <div className="feature-card">
          <div>👥</div>
          <h3>Join Community</h3>
          <p>
            Connect with fellow movie enthusiasts.
          </p>
        </div>

      </div>

    </section>
  );
}

export default Home;