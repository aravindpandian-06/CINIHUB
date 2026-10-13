import "./MovieCard.css";

function MovieCard({ movie }) {
  return (
    <article className="movie-card">
      <div className="movie-image">
        <img
          src={movie.image}
          alt={`Official poster for ${movie.title}`}
          loading="lazy"
          onError={(e) => {
            // Graceful fallback to avoid broken images
            e.currentTarget.onerror = null;
            e.currentTarget.src = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80";
          }}
        />
        <div className="poster-badge-top">
          <span className="badge-year">{movie.year}</span>
        </div>
      </div>

      <div className="movie-info">
        <h3>{movie.title}</h3>
        <p className="genre">{movie.genre}</p>

        <div className="movie-bottom">
          <span className="rating" aria-label={`Rating: ${movie.rating} out of 10`}>
            ⭐ {movie.rating}
          </span>
          <span className="vintage-tag">FEATURE</span>
        </div>
      </div>
    </article>
  );
}

export default MovieCard;