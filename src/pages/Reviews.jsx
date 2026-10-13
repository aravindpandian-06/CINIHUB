import { useState, useEffect } from "react";
import ReviewCard from "../components/ReviewCard";
import { fetchRecentCommunityReviews } from "../services/supabase";
import "./Reviews.css";

const FALLBACK_REVIEWS = [
  {
    name: "Arun",
    movie: "Leo",
    movie_id: 114461,
    rating: 8.5,
    comment:
      "A fantastic action movie with an engaging story, energetic direction, and excellent performances."
  },
  {
    name: "Priya",
    movie: "Vikram",
    movie_id: 872906,
    rating: 9.0,
    comment:
      "The action sequences and cinematography were absolutely amazing. An unmissable cinema dispatch."
  },
  {
    name: "Karthik",
    movie: "Interstellar",
    movie_id: 157336,
    rating: 9.5,
    comment:
      "One of the best science-fiction movies I have ever watched. Hans Zimmer's score elevates every single frame."
  }
];

function Reviews() {
  const [reviews, setReviews] = useState(FALLBACK_REVIEWS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadCommunityReviews() {
      try {
        const liveRevs = await fetchRecentCommunityReviews(20);
        if (isMounted) {
          if (liveRevs && liveRevs.length > 0) {
            setReviews(liveRevs);
          } else {
            setReviews(FALLBACK_REVIEWS);
          }
        }
      } catch (err) {
        console.warn("Could not load live reviews:", err);
        if (isMounted) {
          setReviews(FALLBACK_REVIEWS);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCommunityReviews();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="reviews-page">
      <div className="page-heading">
        <span className="section-badge">⭐ AUDIENCE CRITIQUE ARCHIVE</span>
        <h1>Movie Reviews</h1>
        <p>
          Unvarnished impressions and vintage dispatch reviews from fellow cinephiles.
        </p>
      </div>

      {loading ? (
        <div className="reviews-loading-indicator" style={{ textAlign: "center", padding: "40px 0" }}>
          <p style={{ color: "var(--color-golden-yellow)", fontFamily: "var(--font-aachen)", letterSpacing: "1.5px" }}>
            RETRIEVING DISPATCH ARCHIVE...
          </p>
        </div>
      ) : (
        <div className="reviews-grid">
          {reviews.map((review, index) => (
            <ReviewCard
              key={review.id || index}
              review={review}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default Reviews;