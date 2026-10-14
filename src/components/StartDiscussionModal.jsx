import { useState, useEffect, useRef } from "react";
import { searchMovies } from "../services/tmdb";
import { createDiscussion, DISCUSSION_CATEGORIES } from "../services/community";
import "./StartDiscussionModal.css";

function StartDiscussionModal({ currentUser, onClose, onDiscussionCreated }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General Movie Talk");
  const [content, setContent] = useState("");

  // Movie Search State
  const [movieSearchQuery, setMovieSearchQuery] = useState("");
  const [movieSearchResults, setMovieSearchResults] = useState([]);
  const [searchingMovies, setSearchingMovies] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Form Submission State
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
        console.warn("TMDB search error in discussion modal:", err);
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
      setErrorMessage("You must be logged in to start a discussion.");
      return;
    }

    if (!title.trim()) {
      setErrorMessage("Please enter a discussion title.");
      return;
    }

    if (!content.trim()) {
      setErrorMessage("Please write your discussion text.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const created = await createDiscussion({
        title,
        content,
        category,
        movieId: selectedMovie?.id || null,
        movieTitle: selectedMovie?.title || null,
        moviePoster: selectedMovie?.image || null,
        movieYear: selectedMovie?.year || null,
        user: currentUser
      });

      if (onDiscussionCreated) {
        onDiscussionCreated(created);
      }
      onClose();
    } catch (err) {
      console.error("Discussion create error:", err);
      setErrorMessage(err.message || "Failed to create discussion dispatch.");
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="start-discussion-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-top-bar">
          <div className="modal-badge-row">
            <span className="film-reel-badge">🎬 FILM SOCIETY DISPATCH</span>
            <h2>Start a Movie Discussion</h2>
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

        <form onSubmit={handleSubmit} className="discussion-form-body">
          {errorMessage && <div className="form-error-banner">{errorMessage}</div>}

          {/* Title */}
          <div className="form-group">
            <label htmlFor="disc-title">
              Discussion Title <span className="required-star">*</span>
            </label>
            <input
              id="disc-title"
              type="text"
              placeholder="e.g. The Symbolic Use of Amber Lighting in Neo-Noir Cinema"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="vintage-input"
              maxLength={150}
            />
          </div>

          {/* Category */}
          <div className="form-group">
            <label htmlFor="disc-category">Category</label>
            <select
              id="disc-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="vintage-select"
            >
              {DISCUSSION_CATEGORIES.filter((c) => c !== "All Categories").map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Optional Movie Selector via TMDB */}
          <div className="form-group movie-selector-group">
            <label htmlFor="movie-search">
              Associated Movie <span className="optional-tag">(Optional)</span>
            </label>

            {selectedMovie ? (
              <div className="selected-movie-card">
                {selectedMovie.image && (
                  <img
                    src={selectedMovie.image}
                    alt={selectedMovie.title}
                    className="selected-movie-poster"
                  />
                )}
                <div className="selected-movie-meta">
                  <h4>{selectedMovie.title}</h4>
                  <span className="selected-year">Released: {selectedMovie.year || "Unknown"}</span>
                </div>
                <button
                  type="button"
                  className="remove-movie-btn"
                  onClick={handleRemoveMovie}
                  title="Remove selected movie"
                >
                  ✕ Remove
                </button>
              </div>
            ) : (
              <div className="movie-search-container">
                <input
                  id="movie-search"
                  type="text"
                  placeholder="Type to search TMDB movies (e.g. Blade Runner, Oppenheimer, Leo)..."
                  value={movieSearchQuery}
                  onChange={(e) => setMovieSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (movieSearchResults.length > 0) setShowDropdown(true);
                  }}
                  className="vintage-input movie-search-input"
                  autoComplete="off"
                />
                {searchingMovies && <div className="search-spinner">Searching TMDB...</div>}

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

          {/* Discussion Content */}
          <div className="form-group">
            <label htmlFor="disc-content">
              Discussion Content <span className="required-star">*</span>
            </label>
            <textarea
              id="disc-content"
              rows={6}
              placeholder="Lay out your argument, scene breakdown, directorial analysis, or theory for the community..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
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
              disabled={submitting || !title.trim() || !content.trim()}
            >
              {submitting ? "Publishing Dispatch..." : "Publish Discussion →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StartDiscussionModal;
