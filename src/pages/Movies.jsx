import MovieCard from "../components/MovieCard";
import "./Movies.css";

function Movies() {
  const movies = [
    {
      title: "Leo",
      genre: "Action • Thriller",
      rating: 8.4,
      year: 2023,
      image: "https://upload.wikimedia.org/wikipedia/en/7/75/Leo_%282023_Indian_film%29.jpg"
    },
    {
      title: "Vikram",
      genre: "Action • Crime",
      rating: 8.3,
      year: 2022,
      image: "https://upload.wikimedia.org/wikipedia/en/9/93/Vikram_2022_poster.jpg"
    },
    {
      title: "Jailer",
      genre: "Action • Comedy",
      rating: 7.1,
      year: 2023,
      image: "https://upload.wikimedia.org/wikipedia/en/c/cb/Jailer_2023_Tamil_film_poster.jpg"
    },
    {
      title: "Interstellar",
      genre: "Sci-Fi • Drama",
      rating: 8.7,
      year: 2014,
      image: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"
    },
    {
      title: "Inception",
      genre: "Sci-Fi • Thriller",
      rating: 8.8,
      year: 2010,
      image: "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg"
    },
    {
      title: "Kaithi",
      genre: "Action • Thriller",
      rating: 8.4,
      year: 2019,
      image: "https://upload.wikimedia.org/wikipedia/en/7/79/Kaithi_2019_poster.jpg"
    }
  ];

  return (
    <section className="movies-page">
      <div className="page-heading">
        <span className="section-badge">🎬 EXPLORE THE ARCHIVE</span>
        <h1>Discover Movies</h1>
        <p>
          Curated cult classics, box office thrillers, and award-winning cinema.
        </p>
      </div>

      <div className="movies-grid">
        {movies.map((movie, index) => (
          <MovieCard
            key={index}
            movie={movie}
          />
        ))}
      </div>
    </section>
  );
}

export default Movies;