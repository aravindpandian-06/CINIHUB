import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  updateRecommendation,
  RECOMMENDATION_CATEGORIES
} from "../services/community";
import "./RecommendationDetailModal.css";

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

function RecommendationDetailModal({
  recommendation,
  currentUser,
  onClose,
  onToggleLike,
  onRecommendationUpdated,
  onRecommendationDeleted,
  onShare,
  onFilterByMovie
}) {
  const isOwner = currentUser && recommendation.user_id === currentUser.id;

  const [isEditing, setIsEditing] = useState(false);
  const [editCategory, setEditCategory] = useState(recommendation.category);
  const [editMood, setEditMood] = useState(recommendation.mood || "");
  const [editText, setEditText] = useState(recommendation.recommendation_text);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editText.trim()) {
      setEditError("Recommendation text cannot be empty.");
      return;
    }
    setSavingEdit(true);
    setEditError("");
    try {
      const updated = await updateRecommendation(
        recommendation.id,
        {
          category: editCategory,
          mood: editMood || null,
          recommendationText: editText
        },
        currentUser.id
      );
      setIsEditing(false);
      if (onRecommendationUpdated) {
        onRecommendationUpdated({
          ...recommendation,
          ...updated
        });
      }
    } catch (err) {
      setEditError(err.message || "Failed to update recommendation.");
    } finally {
      setSavingEdit(false);
    }
  };

  const authorInitial = (recommendation.author_name || recommendation.author_username || "C").charAt(0).toUpperCase();

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="recommendation-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-top-bar">
          <div className="modal-category-group">
            <span className="modal-badge">CINEPHILE DISCOVERY PICK</span>
            <span className="category-pill">{recommendation.category}</span>
          </div>

          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {isEditing ? (
          <form className="edit-rec-form" onSubmit={handleSaveEdit}>
            <h2 className="edit-form-heading">Edit Recommendation</h2>
            {editError && <div className="form-error-banner">{editError}</div>}

            <div className="form-group">
              <label htmlFor="edit-rec-category">Category</label>
              <select
                id="edit-rec-category"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="vintage-select"
              >
                {RECOMMENDATION_CATEGORIES.filter((c) => c !== "All Categories").map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="edit-rec-mood">Viewing Occasion / Mood</label>
              <input
                id="edit-rec-mood"
                type="text"
                placeholder="e.g. Late Night Nostalgia, Rainy Evening"
                value={editMood}
                onChange={(e) => setEditMood(e.target.value)}
                className="vintage-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-rec-text">Personal Recommendation Pitch</label>
              <textarea
                id="edit-rec-text"
                rows={6}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                required
                className="vintage-textarea"
              />
            </div>

            <div className="edit-form-buttons">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setIsEditing(false)}
                disabled={savingEdit}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="save-btn"
                disabled={savingEdit}
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="modal-content-body">
            <div className="detail-rec-layout">
              <div className="detail-rec-poster-wrap">
                <img
                  src={recommendation.movie_poster || FALLBACK_POSTER}
                  alt={recommendation.movie_title}
                  className="detail-rec-poster"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_POSTER;
                  }}
                />
                <div className="detail-poster-year">
                  <span>{recommendation.movie_year || "Cinema"}</span>
                </div>
                {recommendation.movie_id && (
                  <Link
                    to={`/movies/${recommendation.movie_id}`}
                    className="detail-view-movie-btn"
                    onClick={onClose}
                  >
                    View Movie Archive →
                  </Link>
                )}
              </div>

              <div className="detail-rec-main">
                <div className="detail-author-row">
                  <div className="detail-avatar" aria-hidden="true">
                    {recommendation.author_avatar ? (
                      <img
                        src={recommendation.author_avatar}
                        alt={recommendation.author_name}
                        className="detail-avatar-img"
                      />
                    ) : (
                      authorInitial
                    )}
                  </div>
                  <div className="detail-meta">
                    <h4>{recommendation.author_name || "Cinephile Critic"}</h4>
                    {recommendation.author_username && (
                      <span className="author-handle">@{recommendation.author_username}</span>
                    )}
                    <span className="dispatch-time">• {formatDate(recommendation.created_at)}</span>
                  </div>

                  {isOwner && (
                    <div className="detail-owner-actions">
                      <button
                        type="button"
                        className="action-pill edit-action"
                        onClick={() => setIsEditing(true)}
                      >
                        ✎ Edit
                      </button>
                      <button
                        type="button"
                        className="action-pill delete-action"
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this recommendation?")) {
                            onRecommendationDeleted(recommendation.id);
                            onClose();
                          }
                        }}
                      >
                        ✕ Delete
                      </button>
                    </div>
                  )}
                </div>

                <h1 className="detail-title">{recommendation.movie_title}</h1>

                <div className="detail-tag-cluster">
                  <span className="detail-cat-pill">{recommendation.category}</span>
                  {recommendation.mood && (
                    <span className="detail-mood-pill">
                      🕯️ {recommendation.mood}
                    </span>
                  )}
                  {onFilterByMovie && (
                    <button
                      type="button"
                      className="detail-filter-pill"
                      onClick={() => {
                        onFilterByMovie(recommendation.movie_id, recommendation.movie_title);
                        onClose();
                      }}
                    >
                      Filter All Picks For This Movie
                    </button>
                  )}
                </div>

                <div className="detail-rec-pitch">
                  <span className="quote-mark">“</span>
                  <div className="pitch-text">
                    {recommendation.recommendation_text.split("\n\n").map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </div>

                <div className="detail-actions-bar">
                  <button
                    type="button"
                    className={`action-pill like-action-btn ${recommendation.user_has_liked ? "liked" : ""}`}
                    onClick={() => onToggleLike && onToggleLike(recommendation.id)}
                  >
                    <span className="action-icon">{recommendation.user_has_liked ? "❤️" : "🤍"}</span>
                    <span>{recommendation.likes_count || 0} Appreciations</span>
                  </button>

                  <button
                    type="button"
                    className="action-pill share-action-btn"
                    onClick={() => onShare && onShare(recommendation)}
                  >
                    <span className="action-icon">🔗</span>
                    <span>Share Recommendation</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecommendationDetailModal;
