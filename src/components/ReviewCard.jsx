import "./ReviewCard.css";

function ReviewCard({ review }) {

  return (
    <div className="review-card">

      <div className="review-user">

        <div className="user-avatar">
          {review.name.charAt(0)}
        </div>

        <div>
          <h4>{review.name}</h4>

          <span>
            {review.movie}
          </span>
        </div>

      </div>

      <div className="review-rating">
        {"⭐".repeat(review.rating)}
      </div>

      <p>
        "{review.comment}"
      </p>

    </div>
  );
}

export default ReviewCard;