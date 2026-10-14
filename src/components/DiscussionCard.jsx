import { useState } from "react";
import { Link } from "react-router-dom";
import "./DiscussionCard.css";

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

function DiscussionCard({
  discussion,
  currentUserId,
  onOpenDetails,
  onToggleLike,
  onEdit,
  onDelete,
  onShare
}) {
  const [likePending, setLikePending] = useState(false);
  const isOwner = currentUserId && discussion.user_id === currentUserId;

  const handleLike = async (e) => {
    e.stopPropagation();
    if (likePending || !onToggleLike) return;
    setLikePending(true);
    try {
      await onToggleLike(discussion.id);
    } finally {
      setLikePending(false);
    }
  };

  const handleShare = (e) => {
    e.stopPropagation();
    if (onShare) onShare(discussion);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(discussion);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(discussion);
  };

  const authorInitial = (discussion.author_name || discussion.author_username || "C").charAt(0).toUpperCase();

  return (
    <article
      className="discussion-card"
      onClick={() => onOpenDetails && onOpenDetails(discussion)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenDetails && onOpenDetails(discussion);
        }
      }}
    >
      <div className="discussion-card-header">
        <div className="author-meta">
          <div className="author-avatar" aria-hidden="true">
            {discussion.author_avatar ? (
              <img
                src={discussion.author_avatar}
                alt={discussion.author_name || "Author avatar"}
                className="author-avatar-img"
              />
            ) : (
              <span>{authorInitial}</span>
            )}
          </div>
          <div className="author-info">
            <span className="author-name">
              {discussion.author_name || "Cinephile Critic"}
            </span>
            {discussion.author_username && (
              <span className="author-handle">@{discussion.author_username}</span>
            )}
            <span className="dispatch-date">• {formatDate(discussion.created_at)}</span>
          </div>
        </div>

        <div className="card-top-badges">
          <span className="category-pill">{discussion.category || "General Movie Talk"}</span>
          {isOwner && (
            <div className="owner-card-actions" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="owner-action-btn edit-btn"
                title="Edit this discussion"
                onClick={handleEdit}
                aria-label="Edit discussion"
              >
                ✎
              </button>
              <button
                type="button"
                className="owner-action-btn delete-btn"
                title="Delete this discussion"
                onClick={handleDelete}
                aria-label="Delete discussion"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      <h3 className="discussion-title">{discussion.title}</h3>

      {discussion.movie_title && (
        <div className="associated-movie-tag" onClick={(e) => e.stopPropagation()}>
          <span className="film-reel-icon">🎬</span>
          <span className="tag-label">FOCUS ON:</span>
          {discussion.movie_id ? (
            <Link
              to={`/movies/${discussion.movie_id}`}
              className="movie-focus-link"
              title={`View ${discussion.movie_title} archive`}
            >
              {discussion.movie_title}
              {discussion.movie_year ? ` (${discussion.movie_year})` : ""} →
            </Link>
          ) : (
            <span className="movie-focus-text">
              {discussion.movie_title}
              {discussion.movie_year ? ` (${discussion.movie_year})` : ""}
            </span>
          )}
        </div>
      )}

      <p className="discussion-excerpt">{discussion.content}</p>

      <div className="discussion-card-footer">
        <div className="interaction-left">
          <button
            type="button"
            className={`action-pill like-action-btn ${discussion.user_has_liked ? "liked" : ""}`}
            onClick={handleLike}
            disabled={likePending}
            title={discussion.user_has_liked ? "Remove appreciation" : "Appreciate discussion"}
            aria-label={`${discussion.likes_count} appreciations`}
          >
            <span className="action-icon">{discussion.user_has_liked ? "❤️" : "🤍"}</span>
            <span className="action-count">{discussion.likes_count || 0}</span>
          </button>

          <button
            type="button"
            className="action-pill comment-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails && onOpenDetails(discussion);
            }}
            title="Read comments"
            aria-label={`${discussion.comments_count} dispatches`}
          >
            <span className="action-icon">💬</span>
            <span className="action-count">{discussion.comments_count || 0} Comments</span>
          </button>
        </div>

        <div className="interaction-right">
          <button
            type="button"
            className="action-pill share-action-btn"
            onClick={handleShare}
            title="Share discussion link"
            aria-label="Share discussion"
          >
            <span className="action-icon">🔗</span>
            <span className="share-text">Share</span>
          </button>

          <button
            type="button"
            className="view-dispatch-btn"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails && onOpenDetails(discussion);
            }}
          >
            Open Dispatch →
          </button>
        </div>
      </div>
    </article>
  );
}

export default DiscussionCard;
