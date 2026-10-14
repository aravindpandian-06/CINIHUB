import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  fetchDiscussionComments,
  createDiscussionComment,
  deleteDiscussionComment,
  updateDiscussion,
  DISCUSSION_CATEGORIES
} from "../services/community";
import "./DiscussionDetailModal.css";

function formatDate(isoString) {
  if (!isoString) return "Recently";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "Recently";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  } catch {
    return "Recently";
  }
}

function DiscussionDetailModal({
  discussion,
  currentUser,
  onClose,
  onToggleLike,
  onDiscussionUpdated,
  onDiscussionDeleted,
  onShare
}) {
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState("");

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(discussion.title);
  const [editCategory, setEditCategory] = useState(discussion.category);
  const [editContent, setEditContent] = useState(discussion.content);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  const isOwner = currentUser && discussion.user_id === currentUser.id;

  // Load comments
  useEffect(() => {
    let isMounted = true;
    async function loadComments() {
      setLoadingComments(true);
      try {
        const comms = await fetchDiscussionComments(discussion.id);
        if (isMounted) setComments(comms);
      } catch (e) {
        console.warn("Failed to load comments:", e);
      } finally {
        if (isMounted) setLoadingComments(false);
      }
    }
    loadComments();
    return () => {
      isMounted = false;
    };
  }, [discussion.id]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Submit comment
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;
    if (!currentUser) {
      setCommentError("Please sign in to submit a comment.");
      return;
    }

    setSubmittingComment(true);
    setCommentError("");

    try {
      const added = await createDiscussionComment({
        discussionId: discussion.id,
        content: newComment,
        user: currentUser
      });
      setComments((prev) => [...prev, added]);
      setNewComment("");
      if (onDiscussionUpdated) {
        onDiscussionUpdated({
          ...discussion,
          comments_count: (discussion.comments_count || 0) + 1
        });
      }
    } catch (err) {
      setCommentError(err.message || "Could not post comment.");
    } finally {
      setSubmittingComment(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      await deleteDiscussionComment(commentId, currentUser.id);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      if (onDiscussionUpdated) {
        onDiscussionUpdated({
          ...discussion,
          comments_count: Math.max(0, (discussion.comments_count || 1) - 1)
        });
      }
    } catch (err) {
      alert("Failed to delete comment: " + err.message);
    }
  };

  // Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editContent.trim()) {
      setEditError("Title and content cannot be empty.");
      return;
    }
    setSavingEdit(true);
    setEditError("");
    try {
      const updated = await updateDiscussion(
        discussion.id,
        {
          title: editTitle,
          category: editCategory,
          content: editContent
        },
        currentUser.id
      );
      setIsEditing(false);
      if (onDiscussionUpdated) {
        onDiscussionUpdated({
          ...discussion,
          ...updated
        });
      }
    } catch (err) {
      setEditError(err.message || "Failed to update discussion.");
    } finally {
      setSavingEdit(false);
    }
  };

  const authorInitial = (discussion.author_name || discussion.author_username || "C").charAt(0).toUpperCase();

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="discussion-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-top-bar">
          <div className="modal-category-group">
            <span className="modal-badge">FILM DISPATCH</span>
            <span className="category-pill">{discussion.category}</span>
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
          <form className="edit-discussion-form" onSubmit={handleSaveEdit}>
            <h2 className="edit-form-heading">Edit Discussion</h2>
            {editError && <div className="form-error-banner">{editError}</div>}

            <div className="form-group">
              <label htmlFor="edit-title">Discussion Title</label>
              <input
                id="edit-title"
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                className="vintage-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-category">Category</label>
              <select
                id="edit-category"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="vintage-select"
              >
                {DISCUSSION_CATEGORIES.filter((c) => c !== "All Categories").map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="edit-content">Content</label>
              <textarea
                id="edit-content"
                rows={6}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
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
            <div className="detail-author-row">
              <div className="detail-avatar" aria-hidden="true">
                {discussion.author_avatar ? (
                  <img
                    src={discussion.author_avatar}
                    alt={discussion.author_name}
                    className="detail-avatar-img"
                  />
                ) : (
                  authorInitial
                )}
              </div>
              <div className="detail-meta">
                <h4>{discussion.author_name || "Cinephile Critic"}</h4>
                {discussion.author_username && (
                  <span className="author-handle">@{discussion.author_username}</span>
                )}
                <span className="dispatch-time">• {formatDate(discussion.created_at)}</span>
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
                      if (window.confirm("Are you sure you want to delete this entire discussion?")) {
                        onDiscussionDeleted(discussion.id);
                        onClose();
                      }
                    }}
                  >
                    ✕ Delete
                  </button>
                </div>
              )}
            </div>

            <h1 className="detail-title">{discussion.title}</h1>

            {discussion.movie_title && (
              <div className="detail-movie-card">
                {discussion.movie_poster && (
                  <img
                    src={discussion.movie_poster}
                    alt={discussion.movie_title}
                    className="detail-movie-thumb"
                  />
                )}
                <div className="detail-movie-info">
                  <span className="movie-tag-label">ASSOCIATED FILM</span>
                  <h3>
                    {discussion.movie_title}
                    {discussion.movie_year ? ` (${discussion.movie_year})` : ""}
                  </h3>
                  {discussion.movie_id && (
                    <Link
                      to={`/movies/${discussion.movie_id}`}
                      className="view-movie-archive-btn"
                      onClick={onClose}
                    >
                      View Movie & Reviews Archive →
                    </Link>
                  )}
                </div>
              </div>
            )}

            <div className="detail-text">
              {discussion.content.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            <div className="detail-actions-bar">
              <button
                type="button"
                className={`action-pill like-action-btn ${discussion.user_has_liked ? "liked" : ""}`}
                onClick={() => onToggleLike && onToggleLike(discussion.id)}
              >
                <span className="action-icon">{discussion.user_has_liked ? "❤️" : "🤍"}</span>
                <span>{discussion.likes_count || 0} Appreciations</span>
              </button>

              <button
                type="button"
                className="action-pill share-action-btn"
                onClick={() => onShare && onShare(discussion)}
              >
                <span className="action-icon">🔗</span>
                <span>Share Link</span>
              </button>
            </div>

            {/* Comments Thread */}
            <div className="comments-section">
              <div className="comments-header">
                <h3>💬 CINEPHILE DISPATCHES ({comments.length})</h3>
                <span className="ticket-stamp">VERIFIED COMMUNITY THREAD</span>
              </div>

              {/* Add comment form */}
              {currentUser ? (
                <form className="add-comment-form" onSubmit={handleCommentSubmit}>
                  {commentError && <div className="form-error-banner">{commentError}</div>}
                  <div className="comment-input-wrap">
                    <textarea
                      placeholder="Share your perspective, analysis, or rebuttal..."
                      rows={3}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      required
                      className="vintage-textarea comment-textarea"
                    />
                    <div className="comment-form-footer">
                      <span className="char-count">{newComment.length} characters</span>
                      <button
                        type="submit"
                        className="post-comment-btn"
                        disabled={submittingComment || !newComment.trim()}
                      >
                        {submittingComment ? "Posting..." : "Post Comment →"}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="login-to-comment-banner">
                  <p>
                    Want to contribute to this film discussion?{" "}
                    <Link to="/login" className="login-link">
                      Sign in to your CINIHUB account →
                    </Link>
                  </p>
                </div>
              )}

              {/* Comments list */}
              {loadingComments ? (
                <div className="comments-loading">
                  <span>RETRIEVING DISPATCHES...</span>
                </div>
              ) : comments.length === 0 ? (
                <div className="no-comments-yet">
                  <p>No comments on this discussion yet. Be the first cinephile to chime in!</p>
                </div>
              ) : (
                <div className="comments-list">
                  {comments.map((comment) => {
                    const isCommentOwner = currentUser && comment.user_id === currentUser.id;
                    const cInitial = (comment.author_name || comment.author_username || "C").charAt(0).toUpperCase();

                    return (
                      <div key={comment.id} className="comment-item">
                        <div className="comment-avatar" aria-hidden="true">
                          {comment.author_avatar ? (
                            <img
                              src={comment.author_avatar}
                              alt={comment.author_name}
                              className="comment-avatar-img"
                            />
                          ) : (
                            cInitial
                          )}
                        </div>

                        <div className="comment-content-wrap">
                          <div className="comment-top">
                            <div className="comment-author-meta">
                              <span className="comment-author-name">
                                {comment.author_name || "Cinephile"}
                              </span>
                              {comment.author_username && (
                                <span className="comment-handle">@{comment.author_username}</span>
                              )}
                              <span className="comment-date">• {formatDate(comment.created_at)}</span>
                            </div>

                            {isCommentOwner && (
                              <button
                                type="button"
                                className="delete-comment-btn"
                                title="Delete this comment"
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                ✕
                              </button>
                            )}
                          </div>

                          <p className="comment-body">{comment.content}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DiscussionDetailModal;
