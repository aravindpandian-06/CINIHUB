import { Link } from "react-router-dom";
import "./ReviewCard.css";

function ReviewCard({ review }) {
  const reviewerName = review.name || review.reviewer_name || "Cinephile Critic";
  const ratingNum = Number(review.rating);
  const displayRating = !isNaN(ratingNum) ? ratingNum.toFixed(1) : "8.0";
  const starCount = !isNaN(ratingNum)
    ? Math.max(0, Math.min(5, Math.round(ratingNum <= 5 ? ratingNum : ratingNum / 2)))
    : 4;

  const movieSubject = review.movie || (review.movie_id ? `PRINT #${review.movie_id}` : "CINEMA");

  return (
    <article className="review-card">
      <div className="review-user">
        <div className="user-avatar" aria-hidden="true">
          {review.avatar_url ? (
            <img src={review.avatar_url} alt={reviewerName} className="user-avatar-img" />
          ) : (
            reviewerName.charAt(0)
          )}
        </div>

        <div className="user-meta">
          <h4>{reviewerName}</h4>
          {review.movie_id ? (
            <Link to={`/movies/${review.movie_id}`} className="movie-subject-link">
              ON: {movieSubject} →
            </Link>
          ) : (
            <span className="movie-subject">ON: {movieSubject}</span>
          )}
        </div>
      </div>

      <div className="review-rating" aria-label={`Rating: ${displayRating} out of 10`}>
        <span className="rating-stars">{"★".repeat(starCount)}</span>
        <span className="rating-score"> ⭐ {displayRating} / 10</span>
      </div>

      <p className="review-quote">
        "{review.comment || review.review_text}"
      </p>

      <div className="card-footer-stamp">
        <span>VERIFIED AUDIENCE DISPATCH</span>
      </div>
    </article>
  );
}

export default ReviewCard;