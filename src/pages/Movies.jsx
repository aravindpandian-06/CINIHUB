import MovieCard from "../components/MovieCard";
import "./Movies.css";

function Movies() {

  const movies = [
    {
      title: "Leo",
      genre: "Action • Thriller",
      rating: 8.4,
      year: 2023,
      image:
        "https://image.tmdb.org/t/p/w500/9x4i9y7dX4q2Z2s8G7J3H6M5F8M.jpg"
    },
    {
      title: "Vikram",
      genre: "Action • Crime",
      rating: 8.3,
      year: 2022,
      image:
        "https://image.tmdb.org/t/p/w500/7749QZB6B7m5qX7Z9R4P8S2N6F.jpg"
    },
    {
      title: "Jailer",
      genre: "Action • Comedy",
      rating: 7.1,
      year: 2023,
      image:
        "https://image.tmdb.org/t/p/w500/7A1k9fQ5X8N2D6M4P3R7S9T1V.jpg"
    },
    {
      title: "Interstellar",
      genre: "Sci-Fi • Drama",
      rating: 8.7,
      year: 2014,
      image:
        "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"
    },
    {
      title: "Inception",
      genre: "Sci-Fi • Thriller",
      rating: 8.8,
      year: 2010,
      image:
        "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg"
    },
    {
      title: "Kaithi",
      genre: "Action • Thriller",
      rating: 8.4,
      year: 2019,
      image:
        "https://image.tmdb.org/t/p/w500/rJ3G1wY8N4M6Q7P2S9T5V1X3Z.jpg"
    }
  ];

  return (
    <section className="movies-page">

      <div className="page-heading">

        <span>🎬 EXPLORE</span>

        <h1>
          Discover Movies
        </h1>

        <p>
          Find your next favourite movie.
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