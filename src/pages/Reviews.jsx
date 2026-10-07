import ReviewCard from "../components/ReviewCard";
import "./Reviews.css";

function Reviews() {

  const reviews = [
    {
      name: "Arun",
      movie: "Leo",
      rating: 5,
      comment:
        "A fantastic action movie with an engaging story and excellent performances."
    },
    {
      name: "Priya",
      movie: "Vikram",
      rating: 5,
      comment:
        "The action sequences and cinematography were absolutely amazing."
    },
    {
      name: "Karthik",
      movie: "Interstellar",
      rating: 5,
      comment:
        "One of the best science-fiction movies I have ever watched."
    }
  ];

  return (
    <section className="reviews-page">

      <div className="page-heading">

        <span>⭐ COMMUNITY OPINIONS</span>

        <h1>
          Movie Reviews
        </h1>

        <p>
          See what movie lovers are saying.
        </p>

      </div>


      <div className="reviews-grid">

        {reviews.map((review, index) => (

          <ReviewCard
            key={index}
            review={review}
          />

        ))}

      </div>

    </section>
  );
}

export default Reviews;