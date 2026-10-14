import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  fetchTopRankedTitles,
  TOP_RANKED_GENRES
} from "../services/communityPicks";
import "./TopRankedTitles.css";

function TopRankedTitles() {
  const [titles, setTitles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [category, setCategory] = useState("All Categories");
  const [sortBy, setSortBy] = useState("rating");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadTitles() {
      setLoading(true);
      setError("");
      try {
        const data = await fetchTopRankedTitles({
          category,
          sortBy
        });
        if (isMounted) setTitles(data);
      } catch (err) {
        console.warn("Error loading top-ranked titles:", err);
        if (isMounted) setError("Unable to retrieve community rankings at this time.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadTitles();
    return () => {
      isMounted = false;
    };
  }, [category, sortBy]);

  const filteredTitles = titles.filter((t) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.overview && t.overview.toLowerCase().includes(q)) ||
      (t.genres && t.genres.some((g) => g.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="top-ranked-section">
      <div className="picks-subhead-banner">
        <div className="subhead-text-group">
          <span className="picks-kicker">★ COMMUNITY CONSENSUS LEADERBOARD ★</span>
          <h2>Top-Ranked Cinema Titles</h2>
          <p>
            Rankings formulated purely from verified audience critiques, review weights, and cinema society appreciations.
          </p>
        </div>

        <div className="rating-legend-box">
          <div className="legend-item">
            <span className="legend-badge cini-badge">⭐ CINIHUB SCORE</span>
            <span className="legend-desc">Community Critic Avg</span>
          </div>
          <div className="legend-divider">|</div>
          <div className="legend-item">
            <span className="legend-badge tmdb-badge">🎬 TMDB SCORE</span>
            <span className="legend-desc">Global Baseline</span>
          </div>
        </div>
      </div>

      {/* Control & Filter Bar */}
      <div className="top-ranked-controls-panel">
        <div className="ranked-search-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search ranked titles by name, genre, or premise..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ranked-search-input"
          />
          {search && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearch("")}
            >
              ✕
            </button>
          )}
        </div>

        <div className="ranked-filter-row">
          <div className="control-group">
            <label htmlFor="ranked-cat-select">Genre / Category:</label>
            <select
              id="ranked-cat-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="vintage-select-ranked"
            >
              {TOP_RANKED_GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="ranked-sort-select">Sort Metric:</label>
            <select
              id="ranked-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="vintage-select-ranked"
            >
              <option value="rating">Highest CINIHUB Score (Weighted)</option>
              <option value="most_reviewed">Most Reviewed Dispatches</option>
              <option value="appreciated">Most Society Appreciations</option>
              <option value="recent">Recently Debated & Discussed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Titles Grid */}
      {loading ? (
        <div className="feed-status-box">
          <span className="spinner-text">COMPUTING CINIHUB AUDIENCE LEADERBOARD...</span>
        </div>
      ) : error ? (
        <div className="feed-status-box error-box">
          <p>{error}</p>
        </div>
      ) : filteredTitles.length === 0 ? (
        <div className="empty-feed-card">
          <div className="empty-icon">⭐</div>
          <h3>NO RANKED TITLES FOR THIS FILTER</h3>
          <p>
            No community reviewed titles currently match this filter. Be the first to compose a critique in the archive!
          </p>
          <Link to="/movies" className="community-btn">
            Browse Movies Archive →
          </Link>
        </div>
      ) : (
        <div className="top-ranked-grid">
          {filteredTitles.map((movie, index) => (
            <article key={movie.movieId} className="ranked-title-card">
              <div className="ranked-number-stamp">
                <span className="rank-hash">#</span>
                <span className="rank-digit">{index + 1}</span>
              </div>

              <div className="ranked-poster-wrapper">
                <img
                  src={movie.poster}
                  alt={`Official poster for ${movie.title}`}
                  className="ranked-poster-img"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src =
                      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80";
                  }}
                />
                <span className="ranked-year-tag">{movie.year}</span>
              </div>

              <div className="ranked-details-column">
                <div className="ranked-card-top">
                  <div className="ranked-badge-cluster">
                    {movie.badge && <span className="ranked-honor-badge">{movie.badge}</span>}
                    <span className="ranked-genres-text">
                      {movie.genres?.join(" • ") || "Cinema"}
                    </span>
                  </div>

                  <h3 className="ranked-film-title">
                    <Link to={`/movies/${movie.movieId}`}>
                      {movie.title}
                    </Link>
                  </h3>
                </div>

                {/* Comparative Dual Rating Meter */}
                <div className="comparative-score-bar">
                  <div className="score-meter-card cinihub-meter">
                    <span className="meter-kicker">CINIHUB COMMUNITY</span>
                    <div className="meter-value-row">
                      <span className="meter-star">⭐</span>
                      <span className="meter-score-num">{Number(movie.cinihubRating).toFixed(1)}</span>
                      <span className="meter-max">/ 10</span>
                    </div>
                    <span className="meter-reviews-count">
                      Based on {movie.reviewCount} {movie.reviewCount === 1 ? "Dispatch" : "Dispatches"}
                    </span>
                  </div>

                  <div className="score-meter-card tmdb-meter">
                    <span className="meter-kicker">TMDB GLOBAL</span>
                    <div className="meter-value-row">
                      <span className="meter-star">🎬</span>
                      <span className="meter-score-num">{movie.tmdbRating}</span>
                      <span className="meter-scale">/ 10</span>
                    </div>
                    <span className="meter-reviews-count">Global Baseline</span>
                  </div>
                </div>

                <p className="ranked-synopsis">{movie.overview}</p>

                <div className="ranked-card-bottom-actions">
                  <div className="ranked-engagement-meta">
                    <span title="Community Discussions">💬 {movie.discussionsCount || 0} Debates</span>
                    <span title="Member Appreciations">❤️ {movie.likesCount || 0} Likes</span>
                  </div>

                  <div className="ranked-links-group">
                    <Link
                      to={`/movies/${movie.movieId}`}
                      className="ranked-view-movie-btn"
                    >
                      Movie Details & Reviews →
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default TopRankedTitles;
