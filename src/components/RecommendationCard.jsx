import { useState } from "react";
import { Link } from "react-router-dom";
import "./RecommendationCard.css";

const FALLBACK_POSTER = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80";

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

function RecommendationCard({
  recommendation,
  currentUserId,
  onOpenDetails,
  onToggleLike,
  onEdit,
  onDelete,
  onShare,
  onFilterByMovie,
  onFilterByUser
}) {
  const [likePending, setLikePending] = useState(false);
  const isOwner = currentUserId && recommendation.user_id === currentUserId;

  const handleLike = async (e) => {
    e.stopPropagation();
    if (likePending || !onToggleLike) return;
    setLikePending(true);
    try {
      await onToggleLike(recommendation.id);
    } finally {
      setLikePending(false);
    }
  };

  const handleShare = (e) => {
    e.stopPropagation();
    if (onShare) onShare(recommendation);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(recommendation);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(recommendation);
  };

  const authorInitial = (recommendation.author_name || recommendation.author_username || "C").charAt(0).toUpperCase();

  return (
    <article
      className="recommendation-card"
      onClick={() => onOpenDetails && onOpenDetails(recommendation)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenDetails && onOpenDetails(recommendation);
        }
      }}
    >
      <div className="rec-poster-frame">
        <img
          src={recommendation.movie_poster || FALLBACK_POSTER}
          alt={`Poster for ${recommendation.movie_title}`}
          className="rec-poster-img"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = FALLBACK_POSTER;
          }}
        />
        <div className="rec-year-badge">
          <span>{recommendation.movie_year || "Cinema"}</span>
        </div>
      </div>

      <div className="rec-content-column">
        <div className="rec-header-row">
          <div className="rec-author-meta" onClick={(e) => e.stopPropagation()}>
            <div className="rec-author-avatar" aria-hidden="true">
              {recommendation.author_avatar ? (
                <img
                  src={recommendation.author_avatar}
                  alt={recommendation.author_name}
                  className="rec-author-avatar-img"
                />
              ) : (
                authorInitial
              )}
            </div>
            <div className="rec-author-text">
              <span
                className="rec-author-name filterable"
                onClick={() => onFilterByUser && onFilterByUser(recommendation.user_id)}
                title="View user recommendations"
              >
                {recommendation.author_name || "Cinephile Critic"}
              </span>
              {recommendation.author_username && (
                <span className="rec-author-username">@{recommendation.author_username}</span>
              )}
              <span className="rec-date">• {formatDate(recommendation.created_at)}</span>
            </div>
          </div>

          <div className="rec-top-actions">
            <span className="rec-category-badge">{recommendation.category}</span>
            {isOwner && (
              <div className="owner-rec-controls" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="owner-action-btn edit-btn"
                  title="Edit recommendation"
                  onClick={handleEdit}
                  aria-label="Edit recommendation"
                >
                  ✎
                </button>
                <button
                  type="button"
                  className="owner-action-btn delete-btn"
                  title="Delete recommendation"
                  onClick={handleDelete}
                  aria-label="Delete recommendation"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="rec-movie-title-row">
          <h3 className="rec-movie-title">{recommendation.movie_title}</h3>
          {recommendation.mood && (
            <span className="rec-mood-badge">
              <span className="mood-icon">🕯️</span> {recommendation.mood}
            </span>
          )}
        </div>

        <p className="rec-quote-text">
          "{recommendation.recommendation_text}"
        </p>

        <div className="rec-card-footer">
          <div className="rec-footer-left">
            <button
              type="button"
              className={`action-pill like-action-btn ${recommendation.user_has_liked ? "liked" : ""}`}
              onClick={handleLike}
              disabled={likePending}
              title={recommendation.user_has_liked ? "Remove appreciation" : "Appreciate recommendation"}
              aria-label={`${recommendation.likes_count} appreciations`}
            >
              <span className="action-icon">{recommendation.user_has_liked ? "❤️" : "🤍"}</span>
              <span className="action-count">{recommendation.likes_count || 0}</span>
            </button>

            <button
              type="button"
              className="action-pill share-action-btn"
              onClick={handleShare}
              title="Share recommendation"
              aria-label="Share recommendation"
            >
              <span className="action-icon">🔗</span>
            </button>

            {onFilterByMovie && (
              <button
                type="button"
                className="action-pill filter-movie-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onFilterByMovie(recommendation.movie_id, recommendation.movie_title);
                }}
                title={`Filter all recommendations for ${recommendation.movie_title}`}
              >
                All Picks For Film
              </button>
            )}
          </div>

          <div className="rec-footer-right" onClick={(e) => e.stopPropagation()}>
            <Link
              to={`/movies/${recommendation.movie_id}`}
              className="view-film-link-btn"
              title="View full movie archive and reviews"
            >
              Movie Details →
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export default RecommendationCard;
