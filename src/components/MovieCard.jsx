import "./MovieCard.css";

function MovieCard({ movie }) {

  return (
    <div className="movie-card">

      <div className="movie-image">

        <img
          src={movie.image}
          alt={movie.title}
        />

      </div>

      <div className="movie-info">

        <h3>
          {movie.title}
        </h3>

        <p className="genre">
          {movie.genre}
        </p>

        <div className="movie-bottom">

          <span className="rating">
            ⭐ {movie.rating}
          </span>

          <span className="year">
            {movie.year}
          </span>

        </div>

      </div>

    </div>
  );
}

export default MovieCard;