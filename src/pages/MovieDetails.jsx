import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getMovieDetails } from "../services/tmdb";
import { getUser } from "../services/auth";
import {
  fetchMovieReviews,
  fetchUserMovieReview,
  saveMovieReview,
  deleteMovieReview
} from "../services/supabase";
import "./MovieDetails.css";

function MovieDetails() {
  const { movieId } = useParams();

  const [currentUser] = useState(() => getUser());

  // Movie Details State
  const [movie, setMovie] = useState(null);
  const [loadingMovie, setLoadingMovie] = useState(true);
  const [movieError, setMovieError] = useState("");

  // Reviews State
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(null);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewsError, setReviewsError] = useState("");

  // Review Form State
  const [reviewRating, setReviewRating] = useState(8.0);
  const [reviewText, setReviewText] = useState("");
  const [existingReview, setExistingReview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState("");
  const [formError, setFormError] = useState("");

  // 1. Fetch movie details and reviews on mount or movieId change
  useEffect(() => {
    let isCancelled = false;
    const user = getUser();

    async function loadData() {
      setLoadingMovie(true);
      setLoadingReviews(true);
      setMovieError("");
      setReviewsError("");
      setFormStatus("");
      setFormError("");

      try {
        // Fetch Movie Details
        const movieData = await getMovieDetails(movieId);
        if (!isCancelled) {
          if (movieData) {
            setMovie(movieData);
          } else {
            setMovieError("Movie not found in the CINIHUB archive.");
          }
          setLoadingMovie(false);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Movie details error:", err);
          setMovieError("Failed to retrieve movie details from archive.");
          setLoadingMovie(false);
        }
      }

      // Fetch Reviews for this movie ONLY
      try {
        const { reviews: fetchedReviews, averageRating, totalReviews: count } =
          await fetchMovieReviews(movieId);

        if (!isCancelled) {
          setReviews(fetchedReviews);
          setAvgRating(averageRating);
          setTotalReviews(count);
          setLoadingReviews(false);

          // Check if current user already submitted a review
          if (user?.id) {
            const userRev = await fetchUserMovieReview(movieId, user.id);
            if (!isCancelled && userRev) {
              setExistingReview(userRev);
              setReviewRating(Number(userRev.rating));
              setReviewText(userRev.review_text);
            } else if (!isCancelled) {
              setExistingReview(null);
              setReviewRating(8.0);
              setReviewText("");
            }
          }
        }
      } catch (revErr) {
        if (!isCancelled) {
          console.error("Reviews load error:", revErr);
          setReviewsError("Unable to load community reviews at this moment.");
          setLoadingReviews(false);
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [movieId]);

  // Re-fetch reviews helper after save/delete
  const reloadReviews = async () => {
    try {
      const { reviews: fetchedReviews, averageRating, totalReviews: count } =
        await fetchMovieReviews(movieId);
      setReviews(fetchedReviews);
      setAvgRating(averageRating);
      setTotalReviews(count);

      if (currentUser?.id) {
        const userRev = await fetchUserMovieReview(movieId, currentUser.id);
        setExistingReview(userRev);
        if (userRev) {
          setReviewRating(Number(userRev.rating));
          setReviewText(userRev.review_text);
        }
      }
    } catch (e) {
      console.warn("Could not reload reviews:", e);
    }
  };

  // Handle Review Submission
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setFormStatus("");
    setFormError("");

    if (!currentUser?.id) {
      setFormError("Please log in to submit or edit your review.");
      return;
    }

    const trimmedText = reviewText.trim();
    if (!trimmedText) {
      setFormError("Please write your review thoughts before submitting.");
      return;
    }

    if (isNaN(reviewRating) || reviewRating < 0 || reviewRating > 10) {
      setFormError("Rating score must be between 0 and 10.");
      return;
    }

    setSubmitting(true);

    try {
      const saved = await saveMovieReview({
        movieId,
        userId: currentUser.id,
        rating: reviewRating,
        reviewText: trimmedText,
        reviewerName: currentUser.name || currentUser.full_name || currentUser.username || "Cinephile Critic"
      });

      setExistingReview(saved);
      setFormStatus(
        existingReview
          ? "★ Review updated successfully in the CINIHUB archive!"
          : "★ Review published successfully to the CINIHUB archive!"
      );

      // Refresh community reviews and ratings immediately
      await reloadReviews();
    } catch (err) {
      setFormError(err.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Review Deletion
  const handleDeleteReview = async () => {
    if (!existingReview || !currentUser?.id) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete your review for this movie?"
    );
    if (!confirmDelete) return;

    setSubmitting(true);
    setFormError("");
    setFormStatus("");

    try {
      await deleteMovieReview(existingReview.id, currentUser.id, movieId);
      setExistingReview(null);
      setReviewText("");
      setReviewRating(8.0);
      setFormStatus("Your review has been removed from the archive.");
      await reloadReviews();
    } catch (err) {
      setFormError(err.message || "Failed to delete review.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingMovie) {
    return (
      <section className="movie-details-page">
        <div className="details-status-box loading-box">
          <div className="details-spinner" aria-hidden="true">🎬</div>
          <p>PROJECTIONIST LOADING ARCHIVE PRINT...</p>
        </div>
      </section>
    );
  }

  if (movieError || !movie) {
    return (
      <section className="movie-details-page">
        <div className="details-status-box error-box" role="alert">
          <span className="status-badge">ARCHIVE NOTICE</span>
          <h2>{movieError || "Print not found in archive."}</h2>
          <Link to="/movies" className="back-to-archive-btn">
            ← Return to Movies Archive
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="movie-details-page">
      <div className="movie-details-container">

        {/* Top Navigation & Breadcrumb */}
        <div className="details-nav-bar">
          <Link to="/movies" className="back-link">
            ← BACK TO MOVIES ARCHIVE
          </Link>

          <div className="marquee-stamp">
            <span>★ CINIHUB FEATURE DOSSIER • ARCHIVE PRINT #{movie.id} ★</span>
          </div>
        </div>

        {/* =================================================================
            MOVIE HERO CARD & SCOREBOARD
            ================================================================= */}
        <article className="movie-hero-card">
          
          {/* Movie Poster */}
          <div className="hero-poster-frame">
            <img
              src={movie.image}
              alt={`Official movie poster for ${movie.title}`}
              className="hero-poster-img"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src =
                  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80";
              }}
            />
            <div className="poster-year-stamp">
              <span>{movie.year || "CINEMA"}</span>
            </div>
          </div>

          {/* Movie Information & Ratings */}
          <div className="hero-info-block">
            <div className="hero-meta-badge">
              <span className="meta-genre">{movie.genre}</span>
              {movie.releaseDate && (
                <span className="meta-date">RELEASE: {movie.releaseDate}</span>
              )}
            </div>

            <h1 className="hero-movie-title">{movie.title}</h1>

            {/* Scoreboard Block (CINIHUB Community Score vs TMDB Critic Score) */}
            <div className="scoreboard-grid">
              
              {/* CINIHUB Community Rating Card */}
              <div className="score-card cinihub-score-card">
                <div className="score-header">
                  <span className="score-icon">★</span>
                  <span className="score-title">CINIHUB RATING</span>
                </div>
                <div className="score-main-value">
                  {avgRating !== null ? (
                    <>
                      <span className="score-number">{avgRating}</span>
                      <span className="score-scale">/ 10</span>
                    </>
                  ) : (
                    <span className="score-unrated">UNRATED</span>
                  )}
                </div>
                <div className="score-footer">
                  {totalReviews > 0 ? (
                    <span>Based on <strong>{totalReviews}</strong> {totalReviews === 1 ? "review" : "reviews"}</span>
                  ) : (
                    <span>No CINIHUB reviews yet</span>
                  )}
                </div>
              </div>

              {/* TMDB Score Card */}
              <div className="score-card tmdb-score-card">
                <div className="score-header">
                  <span className="score-icon">🎬</span>
                  <span className="score-title">TMDB SCORE</span>
                </div>
                <div className="score-main-value">
                  <span className="score-number">{movie.rating}</span>
                  <span className="score-scale">/ 10</span>
                </div>
                <div className="score-footer">
                  <span>TMDB Global Rating</span>
                </div>
              </div>

            </div>

            {/* Synopsis / Overview */}
            <div className="hero-synopsis-block">
              <h3 className="synopsis-heading">FEATURE SYNOPSIS</h3>
              <p className="synopsis-text">{movie.overview}</p>

              <div className="movie-community-shortcuts" style={{ marginTop: "18px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <Link
                  to={`/community?tab=discussions&movieId=${movie.id}`}
                  className="vintage-tag"
                  style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  💬 Discuss in Film Society →
                </Link>
                <Link
                  to={`/community?tab=recommendations&movieId=${movie.id}`}
                  className="vintage-tag"
                  style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  🎯 Film Recommendations →
                </Link>
              </div>
            </div>

          </div>

        </article>

        {/* Decorative Vintage Perforated Film Strip */}
        <div className="film-strip-divider" aria-hidden="true">
          <span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span>
        </div>

        {/* =================================================================
            WRITE / EDIT REVIEW SECTION
            ================================================================= */}
        <section className="review-compose-section" aria-labelledby="compose-heading">
          <div className="compose-header-stamp">
            <span className="stamp-star">★</span>
            <h2 id="compose-heading" className="compose-title">
              {existingReview
                ? "EDIT YOUR DISPATCH REVIEW"
                : "WRITE YOUR DISPATCH REVIEW"}
            </h2>
            <span className="stamp-star">★</span>
          </div>

          {/* Feedback Messages */}
          {formStatus && (
            <div className="review-alert success-alert" role="status">
              <span className="alert-badge">RECORDED</span>
              <span>{formStatus}</span>
            </div>
          )}

          {formError && (
            <div className="review-alert error-alert" role="alert">
              <span className="alert-badge">ATTENTION</span>
              <span>{formError}</span>
            </div>
          )}

          {currentUser ? (
            /* Logged-In User Review Form */
            <form onSubmit={handleSubmitReview} className="review-form-card">
              
              {/* Rating Meter Control (0 to 10 Scale) */}
              <div className="rating-meter-group">
                <div className="rating-meter-header">
                  <label htmlFor="rating-slider" className="rating-label">
                    YOUR RATING METER:
                  </label>
                  <div className="rating-score-display" aria-live="polite">
                    <span className="score-star-icon">⭐</span>
                    <span className="score-digit">{Number(reviewRating).toFixed(1)}</span>
                    <span className="score-max">/ 10</span>
                  </div>
                </div>

                {/* Rating Slider (Step 0.5, Range 0 to 10) */}
                <input
                  id="rating-slider"
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                  className="rating-range-slider"
                  aria-label="Rating score from 0 to 10"
                />

                {/* Preset Shortcut Buttons */}
                <div className="rating-presets-row">
                  <button
                    type="button"
                    className={`preset-btn ${reviewRating === 0 ? "selected" : ""}`}
                    onClick={() => setReviewRating(0)}
                  >
                    0.0 (Flop)
                  </button>
                  <button
                    type="button"
                    className={`preset-btn ${reviewRating === 2.5 ? "selected" : ""}`}
                    onClick={() => setReviewRating(2.5)}
                  >
                    2.5
                  </button>
                  <button
                    type="button"
                    className={`preset-btn ${reviewRating === 5.0 ? "selected" : ""}`}
                    onClick={() => setReviewRating(5.0)}
                  >
                    5.0 (Average)
                  </button>
                  <button
                    type="button"
                    className={`preset-btn ${reviewRating === 7.5 ? "selected" : ""}`}
                    onClick={() => setReviewRating(7.5)}
                  >
                    7.5
                  </button>
                  <button
                    type="button"
                    className={`preset-btn ${reviewRating === 10.0 ? "selected" : ""}`}
                    onClick={() => setReviewRating(10.0)}
                  >
                    10.0 (Masterpiece!)
                  </button>
                </div>
              </div>

              {/* Written Review Text Area */}
              <div className="review-textarea-group">
                <label htmlFor="review-text-input" className="textarea-label">
                  YOUR WRITTEN CRITIQUE <span className="req-star">*</span>
                </label>
                <textarea
                  id="review-text-input"
                  rows="5"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your unvarnished thoughts on the screenplay, direction, cinematography, performances, and unforgettable scenes..."
                  required
                />
              </div>

              {/* Action Buttons Row */}
              <div className="form-action-row">
                {existingReview && (
                  <button
                    type="button"
                    className="delete-review-btn"
                    onClick={handleDeleteReview}
                    disabled={submitting}
                  >
                    ✕ DELETE REVIEW
                  </button>
                )}

                <button
                  type="submit"
                  className="submit-review-btn"
                  disabled={submitting}
                >
                  <span className="btn-text">
                    {submitting
                      ? "RECORDING IN ARCHIVE..."
                      : existingReview
                        ? "UPDATE DISPATCH REVIEW"
                        : "SUBMIT CRITIC REVIEW"}
                  </span>
                </button>
              </div>

            </form>
          ) : (
            /* Logged-Out Prompt Banner */
            <div className="logged-out-prompt-card">
              <div className="prompt-ticket-icon" aria-hidden="true">🎟️</div>
              <h3 className="prompt-title">ADMIT ONE: LOG IN TO WRITE A REVIEW</h3>
              <p className="prompt-description">
                You must be logged into your CINIHUB member account to rate films from 0 to 10 and publish verified critic dispatch reviews.
              </p>
              <Link to="/login" className="prompt-login-btn">
                ★ LOGIN TO WRITE A REVIEW
              </Link>
            </div>
          )}

        </section>

        {/* Decorative Divider */}
        <div className="film-strip-divider" aria-hidden="true">
          <span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span>
        </div>

        {/* =================================================================
            COMMUNITY REVIEWS SECTION
            ================================================================= */}
        <section className="community-reviews-section" aria-labelledby="community-heading">
          <div className="section-header-row">
            <div>
              <span className="section-badge">👥 AUDIENCE VERDICTS</span>
              <h2 id="community-heading" className="section-title">
                CINIHUB Community Reviews ({totalReviews})
              </h2>
            </div>
            {avgRating !== null && (
              <div className="badge-avg-pill">
                CINIHUB SCORE: <strong>⭐ {avgRating} / 10</strong>
              </div>
            )}
          </div>

          {/* Reviews Loading State */}
          {loadingReviews && (
            <div className="reviews-status-box">
              <div className="status-spinner" aria-hidden="true">🎬</div>
              <p>RETRIEVING DISPATCH REVIEWS FROM THE DATABASE...</p>
            </div>
          )}

          {/* Reviews Error State */}
          {reviewsError && !loadingReviews && (
            <div className="reviews-status-box error-box" role="alert">
              <p>{reviewsError}</p>
            </div>
          )}

          {/* Empty Reviews State */}
          {!loadingReviews && !reviewsError && reviews.length === 0 && (
            <div className="reviews-empty-state">
              <div className="empty-reel-graphic" aria-hidden="true">🎞️</div>
              <h3 className="empty-title">NO COMMUNITY REVIEWS FILED YET</h3>
              <p className="empty-desc">
                Be the first cinephile to submit a critique for <strong>{movie.title}</strong>!
              </p>
            </div>
          )}

          {/* Reviews List */}
          {!loadingReviews && reviews.length > 0 && (
            <div className="reviews-grid-list">
              {reviews.map((rev) => {
                const isOwner = currentUser?.id && rev.user_id === currentUser.id;
                const formattedDate = new Date(rev.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric"
                });

                return (
                  <article
                    key={rev.id}
                    className={`movie-review-card ${isOwner ? "user-owned-review" : ""}`}
                  >
                    <div className="review-card-header">
                      
                      {/* Reviewer Meta */}
                      <div className="reviewer-info">
                        <div className="reviewer-avatar-frame">
                          {rev.avatar_url ? (
                            <img
                              src={rev.avatar_url}
                              alt={rev.reviewer_name}
                              className="reviewer-avatar-img"
                            />
                          ) : (
                            <div className="reviewer-default-avatar">
                              {rev.reviewer_name?.charAt(0) || "C"}
                            </div>
                          )}
                        </div>

                        <div className="reviewer-titles">
                          <h4 className="reviewer-name">
                            {rev.reviewer_name}
                            {isOwner && <span className="owner-tag">YOUR CRITIQUE</span>}
                          </h4>
                          <span className="review-date">{formattedDate}</span>
                        </div>
                      </div>

                      {/* Review Rating Badge */}
                      <div
                        className="review-rating-badge"
                        aria-label={`Rated ${rev.rating} out of 10`}
                      >
                        ⭐ {Number(rev.rating).toFixed(1)} <span className="badge-max">/ 10</span>
                      </div>

                    </div>

                    {/* Written Review Quote */}
                    <div className="review-body">
                      <p className="review-quote-text">"{rev.review_text}"</p>
                    </div>

                    {/* Review Footer Stamp */}
                    <div className="review-card-footer">
                      <span className="card-stamp">VERIFIED CINIHUB AUDIENCE DISPATCH</span>
                      {isOwner && (
                        <button
                          type="button"
                          className="edit-shortcut-btn"
                          onClick={() => {
                            window.scrollTo({ top: 700, behavior: "smooth" });
                          }}
                        >
                          ✏️ Edit Critique
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

        </section>

      </div>
    </section>
  );
}

export default MovieDetails;
