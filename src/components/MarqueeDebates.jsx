import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  fetchMarqueeDebates,
  MARQUEE_DEBATE_TOPICS
} from "../services/communityPicks";
import "./MarqueeDebates.css";

function formatDate(isoString) {
  if (!isoString) return "Recently";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "Recently";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  } catch {
    return "Recently";
  }
}

function MarqueeDebates({ onOpenDebate, onStartDebate, currentUserId }) {
  const [debates, setDebates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState("trending"); // 'trending', 'discussed', 'latest'
  const [topic, setTopic] = useState("All Debate Topics");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadDebates() {
      setLoading(true);
      setError("");
      try {
        const data = await fetchMarqueeDebates({
          filter,
          topic,
          search,
          currentUserId
        });
        if (isMounted) setDebates(data);
      } catch (err) {
        console.warn("Error loading marquee debates:", err);
        if (isMounted) setError("Unable to load marquee debates at this time.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadDebates();
    return () => {
      isMounted = false;
    };
  }, [filter, topic, search, currentUserId]);

  return (
    <div className="marquee-debates-section">
      <div className="picks-subhead-banner">
        <div className="subhead-text-group">
          <span className="picks-kicker">🔥 CINEPHILE ARENA ★ HIGH-TENSION EXCHANGES</span>
          <h2>Marquee Cinema Debates</h2>
          <p>
            The most engaging debates on directorial visions, controversial climaxes, screenplays, and auteur benchmarks.
          </p>
        </div>

        <button
          type="button"
          className="vintage-cta-btn"
          onClick={onStartDebate}
        >
          + Pitch a New Debate
        </button>
      </div>

      {/* Discovery Filter Chips */}
      <div className="debate-filter-bar">
        <div className="debate-metric-tabs">
          <button
            type="button"
            className={`metric-tab-btn ${filter === "trending" ? "active" : ""}`}
            onClick={() => setFilter("trending")}
          >
            🔥 Trending Debates
          </button>
          <button
            type="button"
            className={`metric-tab-btn ${filter === "discussed" ? "active" : ""}`}
            onClick={() => setFilter("discussed")}
          >
            💬 Most Discussed
          </button>
          <button
            type="button"
            className={`metric-tab-btn ${filter === "latest" ? "active" : ""}`}
            onClick={() => setFilter("latest")}
          >
            ⏱️ Latest Pitches
          </button>
        </div>

        <div className="debate-controls-group">
          <div className="debate-search-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search debate topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="debate-search-input"
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

          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="vintage-select-debate"
          >
            {MARQUEE_DEBATE_TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Debates List */}
      {loading ? (
        <div className="feed-status-box">
          <span className="spinner-text">RETRIEVING ARENA DEBATES & INTERACTIONS...</span>
        </div>
      ) : error ? (
        <div className="feed-status-box error-box">
          <p>{error}</p>
        </div>
      ) : debates.length === 0 ? (
        <div className="empty-feed-card">
          <div className="empty-icon">💬</div>
          <h3>NO ACTIVE DEBATES FOUND</h3>
          <p>
            No cinema debates currently match your selected topic. Step into the arena and ignite the first exchange!
          </p>
          <button
            type="button"
            className="community-btn"
            onClick={onStartDebate}
          >
            Start First Debate
          </button>
        </div>
      ) : (
        <div className="marquee-debates-grid">
          {debates.map((debate) => (
            <article
              key={debate.id}
              className={`marquee-debate-card ${debate.isPinned ? "pinned-debate" : ""}`}
              onClick={() => onOpenDebate(debate)}
            >
              <div className="debate-top-meta">
                <div className="debate-category-cluster">
                  {debate.isPinned && (
                    <span className="pinned-badge">★ MARQUEE FEATURE</span>
                  )}
                  <span className="category-pill">{debate.category}</span>
                </div>

                <div className="debate-participation-pill" title="Total engagement score">
                  <span className="fire-icon">⚡</span>
                  <span>{debate.participationScore} Pts Activity</span>
                </div>
              </div>

              <h3 className="debate-card-title">{debate.title}</h3>

              {debate.movieTitle && (
                <div className="debate-movie-context" onClick={(e) => e.stopPropagation()}>
                  <span className="film-reel-icon">🎬</span>
                  <span className="focus-label">FOCUS ON:</span>
                  {debate.movieId ? (
                    <Link
                      to={`/movies/${debate.movieId}`}
                      className="debate-movie-link"
                    >
                      {debate.movieTitle} {debate.movieYear ? `(${debate.movieYear})` : ""} →
                    </Link>
                  ) : (
                    <span>{debate.movieTitle}</span>
                  )}
                </div>
              )}

              <p className="debate-excerpt-text">{debate.excerpt}</p>

              <div className="debate-card-footer">
                <div className="debate-author-info">
                  <div className="author-avatar-sm" aria-hidden="true">
                    {debate.authorAvatar ? (
                      <img src={debate.authorAvatar} alt={debate.authorName} />
                    ) : (
                      (debate.authorName || "C").charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="author-name-text">
                    {debate.authorName || (debate.authorUsername ? `@${debate.authorUsername}` : "Cinephile")}
                  </span>
                  <span className="debate-date-text">• {formatDate(debate.createdAt)}</span>
                </div>

                <div className="debate-interaction-stats">
                  <span className="stat-item comments-stat">
                    💬 {debate.commentsCount} Comments
                  </span>
                  <span className="stat-item likes-stat">
                    ❤️ {debate.likesCount} Likes
                  </span>
                  <button
                    type="button"
                    className="enter-debate-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDebate(debate);
                    }}
                  >
                    Enter Debate →
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default MarqueeDebates;
