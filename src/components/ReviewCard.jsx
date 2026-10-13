import "./ReviewCard.css";

function ReviewCard({ review }) {
  return (
    <article className="review-card">
      <div className="review-user">
        <div className="user-avatar" aria-hidden="true">
          {review.name.charAt(0)}
        </div>

        <div className="user-meta">
          <h4>{review.name}</h4>
          <span className="movie-subject">ON: {review.movie}</span>
        </div>
      </div>

      <div className="review-rating" aria-label={`Rating: ${review.rating} out of 5 stars`}>
        {"★".repeat(review.rating)}
      </div>

      <p className="review-quote">
        "{review.comment}"
      </p>

      <div className="card-footer-stamp">
        <span>VERIFIED AUDIENCE DISPATCH</span>
      </div>
    </article>
  );
}

export default ReviewCard;