import { useState, useEffect } from "react";
import MovieCard from "../components/MovieCard";
import {
  getPopularMovies,
  getTrendingMovies,
  getNowPlayingMovies,
  getUpcomingMovies,
  searchMovies,
  isTmdbConfigured,
  FALLBACK_MOVIES
} from "../services/tmdb";
import "./Movies.css";

function Movies() {
  const [movies, setMovies] = useState([]);
  const [activeCategory, setActiveCategory] = useState("popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isConfigured, setIsConfigured] = useState(true);

  // Fetch movies on category or search change
  useEffect(() => {
    let isCancelled = false;

    async function executeFetch() {
      setLoading(true);
      setError("");

      const configured = isTmdbConfigured();
      setIsConfigured(configured);

      if (!configured) {
        // If credentials not yet configured in .env, gracefully provide curated films
        if (!isCancelled) {
          setMovies(FALLBACK_MOVIES);
          setLoading(false);
        }
        return;
      }

      try {
        let result;
        if (submittedSearch.trim()) {
          result = await searchMovies(submittedSearch.trim());
        } else {
          switch (activeCategory) {
            case "trending":
              result = await getTrendingMovies();
              break;
            case "now_playing":
              result = await getNowPlayingMovies();
              break;
            case "upcoming":
              result = await getUpcomingMovies();
              break;
            case "popular":
            default:
              result = await getPopularMovies();
              break;
          }
        }

        if (!isCancelled) {
          setMovies(result.movies || []);
        }
      } catch (err) {
        console.error("TMDB API Error:", err.message);
        if (!isCancelled) {
          setError(err.message || "Failed to load movies from TMDB.");
          setMovies(FALLBACK_MOVIES);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    executeFetch();

    return () => {
      isCancelled = true;
    };
  }, [activeCategory, submittedSearch]);

  // Handle category tab change
  const handleCategoryChange = (category) => {
    if (activeCategory === category && !submittedSearch) return;
    setActiveCategory(category);
    setSearchQuery("");
    setSubmittedSearch("");
  };

  // Handle Search Form Submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSubmittedSearch(searchQuery.trim());
  };

  // Handle Clearing Search
  const handleClearSearch = () => {
    setSearchQuery("");
    setSubmittedSearch("");
  };

  const isSearchActive = Boolean(submittedSearch.trim());

  return (
    <section className="movies-page">
      <div className="page-heading">
        <span className="section-badge">🎬 EXPLORE THE ARCHIVE</span>
        <h1>Discover Movies</h1>
        <p>
          Live streaming from The Movie Database (TMDB) archive — popular releases, trending titles, and box office features.
        </p>
      </div>

      {/* TMDB Notice banner if token is missing */}
      {!isConfigured && (
        <div className="tmdb-notice-banner" role="status">
          <span className="notice-stamp">★ NOTICE ★</span>
          <span className="notice-text">
            Live TMDB feed awaiting API token. Paste your token into <code>VITE_TMDB_TOKEN</code> in the <code>.env</code> file. Showing curated archive in the meantime.
          </span>
        </div>
      )}

      {/* Movie Search Bar & Category Controls */}
      <div className="movies-controls-container">
        {/* Search Bar */}
        <form className="movies-search-form" onSubmit={handleSearchSubmit} role="search">
          <div className="search-input-wrapper">
            <span className="search-icon" aria-hidden="true">🔍</span>
            <input
              type="search"
              className="movies-search-input"
              placeholder="Search films by title (e.g. Inception, Dune, Oppenheimer)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search movies"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={handleClearSearch}
                aria-label="Clear search query"
              >
                ✕
              </button>
            )}
          </div>
          <button type="submit" className="search-submit-btn">
            SEARCH
          </button>
        </form>

        {/* Category Tabs */}
        <div className="movies-filter-tabs" role="tablist" aria-label="Movie category selection">
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === "popular" && !isSearchActive}
            className={`filter-tab ${activeCategory === "popular" && !isSearchActive ? "active" : ""}`}
            onClick={() => handleCategoryChange("popular")}
          >
            ★ POPULAR
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === "trending" && !isSearchActive}
            className={`filter-tab ${activeCategory === "trending" && !isSearchActive ? "active" : ""}`}
            onClick={() => handleCategoryChange("trending")}
          >
            🔥 TRENDING
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === "now_playing" && !isSearchActive}
            className={`filter-tab ${activeCategory === "now_playing" && !isSearchActive ? "active" : ""}`}
            onClick={() => handleCategoryChange("now_playing")}
          >
            🎬 NOW PLAYING
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === "upcoming" && !isSearchActive}
            className={`filter-tab ${activeCategory === "upcoming" && !isSearchActive ? "active" : ""}`}
            onClick={() => handleCategoryChange("upcoming")}
          >
            🎟️ UPCOMING
          </button>
        </div>
      </div>

      {/* Active Search / Category Indicator */}
      {isSearchActive && (
        <div className="search-status-bar">
          <span>Search Results for: <strong>"{submittedSearch}"</strong></span>
          <button type="button" className="reset-search-link" onClick={handleClearSearch}>
            Clear Search & Return to Archive
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="movies-status-box loading-box" aria-live="polite">
          <div className="status-spinner" aria-hidden="true">🎬</div>
          <p>RETRIEVING FROM THE TMDB ARCHIVE...</p>
        </div>
      )}

      {/* Error State Banner */}
      {error && !loading && (
        <div className="movies-status-box error-box" role="alert">
          <span className="status-badge">ARCHIVE NOTICE</span>
          <p>{error}</p>
          <button
            type="button"
            className="retry-btn"
            onClick={() => {
              setActiveCategory((c) => c);
            }}
          >
            RETRY REQUEST
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && movies.length === 0 && (
        <div className="movies-status-box empty-box">
          <span className="status-badge">ZERO PRINTS FOUND</span>
          <p>No films matched your search query in the archive.</p>
          <button
            type="button"
            className="retry-btn"
            onClick={() => handleCategoryChange("popular")}
          >
            VIEW POPULAR FILMS
          </button>
        </div>
      )}

      {/* Movies Grid */}
      {!loading && movies.length > 0 && (
        <div className="movies-grid">
          {movies.map((movie, index) => (
            <MovieCard
              key={movie.id ? `movie-${movie.id}-${index}` : `movie-${index}`}
              movie={movie}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default Movies;