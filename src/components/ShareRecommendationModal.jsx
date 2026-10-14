import { useState, useEffect, useRef } from "react";
import { searchMovies } from "../services/tmdb";
import {
  createRecommendation,
  RECOMMENDATION_CATEGORIES,
  RECOMMENDATION_MOODS
} from "../services/community";
import "./ShareRecommendationModal.css";

function ShareRecommendationModal({ currentUser, onClose, onRecommendationCreated }) {
  // Movie Search State
  const [movieSearchQuery, setMovieSearchQuery] = useState("");
  const [movieSearchResults, setMovieSearchResults] = useState([]);
  const [searchingMovies, setSearchingMovies] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Recommendation Form State
  const [category, setCategory] = useState("Underrated Gems");
  const [recommendationText, setRecommendationText] = useState("");
  const [mood, setMood] = useState("");
  const [customMood, setCustomMood] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const searchDebounceRef = useRef(null);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Debounced TMDB Movie Search
  useEffect(() => {
    if (!movieSearchQuery.trim() || selectedMovie) {
      setMovieSearchResults([]);
      setSearchingMovies(false);
      return;
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(async () => {
      setSearchingMovies(true);
      try {
        const { movies } = await searchMovies(movieSearchQuery.trim(), 1);
        setMovieSearchResults(movies ? movies.slice(0, 6) : []);
        setShowDropdown(true);
      } catch (err) {
        console.warn("TMDB search error in recommendation modal:", err);
      } finally {
        setSearchingMovies(false);
      }
    }, 350);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [movieSearchQuery, selectedMovie]);

  const handleSelectMovie = (m) => {
    setSelectedMovie(m);
    setMovieSearchQuery("");
    setShowDropdown(false);
    setMovieSearchResults([]);
  };

  const handleRemoveMovie = () => {
    setSelectedMovie(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!currentUser) {
      setErrorMessage("You must be logged in to share a recommendation.");
      return;
    }

    if (!selectedMovie) {
      setErrorMessage("Please search and select a movie to recommend.");
      return;
    }

    if (!recommendationText.trim()) {
      setErrorMessage("Please write your personal recommendation.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    const resolvedMood = mood === "CUSTOM" ? customMood.trim() : mood;

    try {
      const created = await createRecommendation({
        movieId: selectedMovie.id,
        movieTitle: selectedMovie.title,
        moviePoster: selectedMovie.image,
        movieYear: selectedMovie.year,
        category,
        recommendationText,
        mood: resolvedMood || null,
        user: currentUser
      });

      if (onRecommendationCreated) {
        onRecommendationCreated(created);
      }
      onClose();
    } catch (err) {
      console.error("Create recommendation error:", err);
      setErrorMessage(err.message || "Failed to submit recommendation.");
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="share-rec-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-top-bar">
          <div className="modal-badge-row">
            <span className="film-reel-badge">🎯 CINIHUB DISCOVERY ARCHIVE</span>
            <h2>Share a Movie Recommendation</h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="rec-form-body">
          {errorMessage && <div className="form-error-banner">{errorMessage}</div>}

          {/* 1. Search & Select Movie */}
          <div className="form-group movie-selector-group">
            <label htmlFor="rec-movie-search">
              1. Search & Select Movie from TMDB <span className="required-star">*</span>
            </label>

            {selectedMovie ? (
              <div className="rec-selected-movie-preview">
                {selectedMovie.image && (
                  <img
                    src={selectedMovie.image}
                    alt={selectedMovie.title}
                    className="rec-selected-poster"
                  />
                )}
                <div className="rec-selected-details">
                  <span className="rec-status-tag">SELECTED FILM</span>
                  <h3>{selectedMovie.title}</h3>
                  <p className="rec-selected-meta">
                    Year: <strong>{selectedMovie.year || "Cinema"}</strong> • Genre: {selectedMovie.genre}
                  </p>
                  <p className="rec-selected-overview">{selectedMovie.overview}</p>
                </div>
                <button
                  type="button"
                  className="remove-movie-btn"
                  onClick={handleRemoveMovie}
                  title="Choose a different movie"
                >
                  ✕ Change Film
                </button>
              </div>
            ) : (
              <div className="movie-search-container">
                <input
                  id="rec-movie-search"
                  type="text"
                  placeholder="Type film name (e.g. Blade Runner, Memories of Murder, Oldboy, Taxi Driver)..."
                  value={movieSearchQuery}
                  onChange={(e) => setMovieSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (movieSearchResults.length > 0) setShowDropdown(true);
                  }}
                  className="vintage-input movie-search-input"
                  autoComplete="off"
                />
                {searchingMovies && <div className="search-spinner">Searching TMDB Film Library...</div>}

                {showDropdown && movieSearchResults.length > 0 && (
                  <ul className="movie-search-dropdown">
                    {movieSearchResults.map((m) => (
                      <li
                        key={m.id}
                        className="movie-dropdown-item"
                        onClick={() => handleSelectMovie(m)}
                      >
                        {m.image && (
                          <img
                            src={m.image}
                            alt={m.title}
                            className="dropdown-poster"
                          />
                        )}
                        <div className="dropdown-info">
                          <span className="dropdown-title">{m.title}</span>
                          <span className="dropdown-meta">{m.year} • {m.genre}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* 2. Category Selection */}
          <div className="form-group">
            <label htmlFor="rec-category">
              2. Recommendation Category <span className="required-star">*</span>
            </label>
            <select
              id="rec-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="vintage-select"
            >
              {RECOMMENDATION_CATEGORIES.filter((c) => c !== "All Categories").map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Mood or Viewing Occasion (Optional) */}
          <div className="form-group">
            <label htmlFor="rec-mood">
              3. Viewing Mood or Occasion <span className="optional-tag">(Optional)</span>
            </label>
            <select
              id="rec-mood"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="vintage-select"
            >
              <option value="">No Specific Mood</option>
              {RECOMMENDATION_MOODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
              <option value="CUSTOM">+ Custom Viewing Occasion...</option>
            </select>

            {mood === "CUSTOM" && (
              <input
                type="text"
                placeholder="Enter custom mood (e.g. Rainy Sunday Afternoon, High-Tension Thrill)..."
                value={customMood}
                onChange={(e) => setCustomMood(e.target.value)}
                className="vintage-input custom-mood-input"
                maxLength={50}
              />
            )}
          </div>

          {/* 4. Personal Recommendation Pitch */}
          <div className="form-group">
            <label htmlFor="rec-text">
              4. Why Should Fellow Cinephiles Watch This? <span className="required-star">*</span>
            </label>
            <textarea
              id="rec-text"
              rows={5}
              placeholder="Explain what makes this film remarkable: the haunting cinematography, a tour-de-force performance, unexpected twists, or its underground cult legacy..."
              value={recommendationText}
              onChange={(e) => setRecommendationText(e.target.value)}
              required
              className="vintage-textarea"
            />
          </div>

          <div className="modal-footer-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-dispatch-btn"
              disabled={submitting || !selectedMovie || !recommendationText.trim()}
            >
              {submitting ? "Publishing Pick..." : "Share Recommendation →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ShareRecommendationModal;
