import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { getUser, subscribeAuth } from "../services/auth";
import {
  fetchDiscussions,
  fetchDiscussionById,
  toggleDiscussionLike,
  deleteDiscussion,
  fetchRecommendations,
  fetchRecommendationById,
  toggleRecommendationLike,
  deleteRecommendation,
  DISCUSSION_CATEGORIES,
  RECOMMENDATION_CATEGORIES
} from "../services/community";

import DiscussionCard from "../components/DiscussionCard";
import DiscussionDetailModal from "../components/DiscussionDetailModal";
import StartDiscussionModal from "../components/StartDiscussionModal";

import RecommendationCard from "../components/RecommendationCard";
import RecommendationDetailModal from "../components/RecommendationDetailModal";
import ShareRecommendationModal from "../components/ShareRecommendationModal";
import CommunityPicks from "../components/CommunityPicks";

import "./Community.css";

const PAGE_SIZE = 9;

function Community() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab: 'discussions', 'recommendations', or 'picks'
  const initialTab = searchParams.get("tab") || "discussions";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => getUser());

  // Data States
  const [discussions, setDiscussions] = useState([]);
  const [loadingDiscussions, setLoadingDiscussions] = useState(true);
  const [discussionsError, setDiscussionsError] = useState("");

  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [recommendationsError, setRecommendationsError] = useState("");

  // Filters for Discussions
  const [discSearch, setDiscSearch] = useState("");
  const [discCategory, setDiscCategory] = useState("All Categories");
  const [discSortBy, setDiscSortBy] = useState("recent"); // 'recent' or 'appreciated'
  const [discMovieFilter, setDiscMovieFilter] = useState(searchParams.get("movieId") || null);
  const [discVisibleCount, setDiscVisibleCount] = useState(PAGE_SIZE);

  // Filters for Recommendations
  const [recSearch, setRecSearch] = useState("");
  const [recCategory, setRecCategory] = useState("All Categories");
  const [recSortBy, setRecSortBy] = useState("recent"); // 'recent' or 'appreciated'
  const [recDiscoveryFilter, setRecDiscoveryFilter] = useState("all"); // 'all', 'appreciated', 'cult', 'masterpiece', 'midnight', 'my_recs'
  const [recMovieFilter, setRecMovieFilter] = useState(null);
  const [recMovieTitleFilter, setRecMovieTitleFilter] = useState("");
  const [recUserFilter, setRecUserFilter] = useState(null);
  const [recVisibleCount, setRecVisibleCount] = useState(PAGE_SIZE);

  // Modals State
  const [showStartDiscModal, setShowStartDiscModal] = useState(false);
  const [showShareRecModal, setShowShareRecModal] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState("");

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? "" : curr));
    }, 3200);
  }, []);

  // Sync auth state
  useEffect(() => {
    const unsubscribe = subscribeAuth((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Sync tab with URL
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", newTab);
    setSearchParams(newParams);
  };

  // 1. Load Discussions
  const loadDiscussionsData = useCallback(async () => {
    setLoadingDiscussions(true);
    setDiscussionsError("");
    try {
      const data = await fetchDiscussions({
        category: discCategory,
        search: discSearch,
        movieId: discMovieFilter,
        sortBy: discSortBy,
        currentUserId: currentUser?.id
      });
      setDiscussions(data);
    } catch (err) {
      console.warn("Discussions load notice:", err);
      setDiscussionsError("Unable to load movie discussions. Please try again.");
    } finally {
      setLoadingDiscussions(false);
    }
  }, [discCategory, discSearch, discMovieFilter, discSortBy, currentUser?.id]);

  useEffect(() => {
    loadDiscussionsData();
  }, [loadDiscussionsData]);

  // 2. Load Recommendations
  const loadRecommendationsData = useCallback(async () => {
    setLoadingRecommendations(true);
    setRecommendationsError("");
    try {
      let cat = recCategory;
      let sort = recSortBy;
      let userFilter = recUserFilter;

      if (!userFilter) {
        if (recDiscoveryFilter === "cult") {
          cat = "Cult Classics";
        } else if (recDiscoveryFilter === "masterpiece") {
          cat = "Hidden Masterpieces";
        } else if (recDiscoveryFilter === "midnight") {
          cat = "Midnight Movies";
        } else if (recDiscoveryFilter === "appreciated") {
          sort = "appreciated";
        } else if (recDiscoveryFilter === "my_recs") {
          userFilter = currentUser?.id || "none";
        }
      }

      const data = await fetchRecommendations({
        category: cat,
        search: recSearch,
        movieId: recMovieFilter,
        userId: userFilter,
        sortBy: sort,
        currentUserId: currentUser?.id
      });
      setRecommendations(data);
    } catch (err) {
      console.warn("Recommendations load notice:", err);
      setRecommendationsError("Unable to load movie recommendations. Please try again.");
    } finally {
      setLoadingRecommendations(false);
    }
  }, [recCategory, recSearch, recMovieFilter, recUserFilter, recSortBy, recDiscoveryFilter, currentUser]);

  useEffect(() => {
    loadRecommendationsData();
  }, [loadRecommendationsData]);

  // Check URL deep links for discussionId or recommendationId
  useEffect(() => {
    const discId = searchParams.get("discussionId");
    if (discId && !selectedDiscussion) {
      fetchDiscussionById(discId, currentUser?.id).then((found) => {
        if (found) {
          setSelectedDiscussion(found);
          setActiveTab("discussions");
        }
      });
    }

    const recId = searchParams.get("recommendationId");
    if (recId && !selectedRecommendation) {
      fetchRecommendationById(recId, currentUser?.id).then((found) => {
        if (found) {
          setSelectedRecommendation(found);
          setActiveTab("recommendations");
        }
      });
    }
  }, [searchParams, currentUser?.id, selectedDiscussion, selectedRecommendation]);

  // Toggle Discussion Like
  const handleToggleDiscussionLike = async (discussionId) => {
    if (!currentUser) {
      showToast("Please sign in to appreciate dispatches.");
      return;
    }
    try {
      const result = await toggleDiscussionLike(discussionId, currentUser.id);
      setDiscussions((prev) =>
        prev.map((d) => {
          if (d.id === String(discussionId)) {
            return {
              ...d,
              user_has_liked: result.liked,
              likes_count: result.liked ? (d.likes_count || 0) + 1 : Math.max(0, (d.likes_count || 1) - 1)
            };
          }
          return d;
        })
      );
      if (selectedDiscussion && selectedDiscussion.id === String(discussionId)) {
        setSelectedDiscussion((prev) => ({
          ...prev,
          user_has_liked: result.liked,
          likes_count: result.liked ? (prev.likes_count || 0) + 1 : Math.max(0, (prev.likes_count || 1) - 1)
        }));
      }
    } catch (err) {
      showToast("Error updating appreciation: " + err.message);
    }
  };

  // Toggle Recommendation Like
  const handleToggleRecommendationLike = async (recId) => {
    if (!currentUser) {
      showToast("Please sign in to appreciate recommendations.");
      return;
    }
    try {
      const result = await toggleRecommendationLike(recId, currentUser.id);
      setRecommendations((prev) =>
        prev.map((r) => {
          if (r.id === String(recId)) {
            return {
              ...r,
              user_has_liked: result.liked,
              likes_count: result.liked ? (r.likes_count || 0) + 1 : Math.max(0, (r.likes_count || 1) - 1)
            };
          }
          return r;
        })
      );
      if (selectedRecommendation && selectedRecommendation.id === String(recId)) {
        setSelectedRecommendation((prev) => ({
          ...prev,
          user_has_liked: result.liked,
          likes_count: result.liked ? (prev.likes_count || 0) + 1 : Math.max(0, (prev.likes_count || 1) - 1)
        }));
      }
    } catch (err) {
      showToast("Error updating appreciation: " + err.message);
    }
  };

  // Delete Discussion
  const handleDeleteDiscussion = async (discussionId) => {
    if (!window.confirm("Are you sure you want to delete this discussion dispatch?")) return;
    try {
      await deleteDiscussion(discussionId, currentUser.id);
      setDiscussions((prev) => prev.filter((d) => d.id !== String(discussionId)));
      showToast("Discussion dispatch deleted.");
      if (selectedDiscussion?.id === String(discussionId)) {
        setSelectedDiscussion(null);
      }
    } catch (err) {
      showToast("Failed to delete discussion: " + err.message);
    }
  };

  // Delete Recommendation
  const handleDeleteRecommendation = async (recId) => {
    if (!window.confirm("Are you sure you want to delete this movie recommendation?")) return;
    try {
      await deleteRecommendation(recId, currentUser.id);
      setRecommendations((prev) => prev.filter((r) => r.id !== String(recId)));
      showToast("Movie recommendation deleted.");
      if (selectedRecommendation?.id === String(recId)) {
        setSelectedRecommendation(null);
      }
    } catch (err) {
      showToast("Failed to delete recommendation: " + err.message);
    }
  };

  // Share Discussion Link
  const handleShareDiscussion = (discussion) => {
    const url = `${window.location.origin}/community?tab=discussions&discussionId=${discussion.id}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url);
      showToast("🔗 Discussion link copied to clipboard!");
    } else {
      prompt("Copy discussion link:", url);
    }
  };

  // Share Recommendation Link
  const handleShareRecommendation = (rec) => {
    const url = `${window.location.origin}/community?tab=recommendations&recommendationId=${rec.id}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url);
      showToast("🔗 Recommendation link copied to clipboard!");
    } else {
      prompt("Copy recommendation link:", url);
    }
  };

  // Filter recommendations by movie
  const handleFilterRecsByMovie = (movieId, movieTitle) => {
    setRecMovieFilter(movieId);
    setRecMovieTitleFilter(movieTitle);
    setActiveTab("recommendations");
    showToast(`Filtering recommendations for: ${movieTitle}`);
  };

  // Filter recommendations by user
  const handleFilterRecsByUser = (userId) => {
    setRecUserFilter(userId);
    setRecDiscoveryFilter("all");
    setActiveTab("recommendations");
    showToast("Filtering recommendations by author.");
  };

  // Clear user filter
  const clearRecUserFilter = () => {
    setRecUserFilter(null);
  };

  // Clear movie filter
  const clearRecMovieFilter = () => {
    setRecMovieFilter(null);
    setRecMovieTitleFilter("");
  };

  return (
    <section className="community-page">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="community-toast-banner" role="status" aria-live="polite">
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="community-container">
        {/* Film Society Header */}
        <div className="page-heading">
          <span className="section-badge">👥 CINIHUB FILM SOCIETY</span>
          <h1>Movie Lovers Together</h1>
          <p>
            Debate unforgettable scenes, swap rare gems, and celebrate cinematic storytelling.
          </p>
        </div>

        {/* Existing Film Society Lobby Cards */}
        <div className="community-grid">
          <div
            className={`community-card ${activeTab === "discussions" ? "active-feature" : ""}`}
            onClick={() => handleTabChange("discussions")}
          >
            <div className="community-icon" aria-hidden="true">
              💬
            </div>
            <h2>Discuss Movies</h2>
            <p>
              Talk about your favourite movies, characters, cinematography, and unforgettable dialogue.
            </p>
            <button
              type="button"
              className="community-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleTabChange("discussions");
                if (currentUser) {
                  setShowStartDiscModal(true);
                } else {
                  showToast("Please sign in to start a discussion dispatch.");
                }
              }}
            >
              + Start Discussion
            </button>
          </div>

          <div
            className={`community-card ${activeTab === "recommendations" ? "active-feature" : ""}`}
            onClick={() => handleTabChange("recommendations")}
          >
            <div className="community-icon" aria-hidden="true">
              🎯
            </div>
            <h2>Share Recommendations</h2>
            <p>
              Recommend cult discoveries, hidden masterpieces, and crowd-pleasing midnight movies.
            </p>
            <button
              type="button"
              className="community-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleTabChange("recommendations");
                if (currentUser) {
                  setShowShareRecModal(true);
                } else {
                  showToast("Please sign in to share a recommendation.");
                }
              }}
            >
              + Recommend Movie
            </button>
          </div>

          <div
            className={`community-card ${activeTab === "picks" ? "active-feature" : ""}`}
            onClick={() => handleTabChange("picks")}
          >
            <div className="community-icon" aria-hidden="true">
              🏆
            </div>
            <h2>Community Picks</h2>
            <p>
              Explore top-ranked titles, marquee debates, and monthly cinephile awards.
            </p>
            <button
              type="button"
              className="community-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleTabChange("picks");
              }}
            >
              View Picks
            </button>
          </div>
        </div>

        {/* Community Navigation & Section Tabs */}
        <div className="community-nav-bar">
          <div className="community-tabs">
            <button
              type="button"
              className={`community-tab-btn ${activeTab === "discussions" ? "active" : ""}`}
              onClick={() => handleTabChange("discussions")}
            >
              💬 Film Discussions
              <span className="tab-count-pill">{discussions.length}</span>
            </button>

            <button
              type="button"
              className={`community-tab-btn ${activeTab === "recommendations" ? "active" : ""}`}
              onClick={() => handleTabChange("recommendations")}
            >
              🎯 Movie Recommendations
              <span className="tab-count-pill">{recommendations.length}</span>
            </button>

            <button
              type="button"
              className={`community-tab-btn ${activeTab === "picks" ? "active" : ""}`}
              onClick={() => handleTabChange("picks")}
            >
              🏆 Cinephile Hall of Fame
            </button>
          </div>

          <div className="community-cta-group">
            {activeTab === "discussions" && (
              <button
                type="button"
                className="vintage-cta-btn"
                onClick={() => {
                  if (currentUser) {
                    setShowStartDiscModal(true);
                  } else {
                    showToast("Please sign in to start a movie discussion.");
                  }
                }}
              >
                + Start a Discussion
              </button>
            )}

            {activeTab === "recommendations" && (
              <button
                type="button"
                className="vintage-cta-btn"
                onClick={() => {
                  if (currentUser) {
                    setShowShareRecModal(true);
                  } else {
                    showToast("Please sign in to share a movie recommendation.");
                  }
                }}
              >
                + Share a Recommendation
              </button>
            )}
          </div>
        </div>

        {/* ================================================================ */}
        {/* TAB 1: MOVIE DISCUSSIONS FEED */}
        {/* ================================================================ */}
        {activeTab === "discussions" && (
          <div className="community-section-view">
            {/* Filter & Search Bar */}
            <div className="community-filter-panel">
              <div className="filter-search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search discussions by title, theory, character, or director..."
                  value={discSearch}
                  onChange={(e) => setDiscSearch(e.target.value)}
                  className="vintage-input-search"
                />
                {discSearch && (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => setDiscSearch("")}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="filter-controls-row">
                <div className="filter-select-group">
                  <label htmlFor="disc-cat-filter">Category:</label>
                  <select
                    id="disc-cat-filter"
                    value={discCategory}
                    onChange={(e) => setDiscCategory(e.target.value)}
                    className="vintage-select-filter"
                  >
                    {DISCUSSION_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-select-group">
                  <label htmlFor="disc-sort-filter">Order:</label>
                  <select
                    id="disc-sort-filter"
                    value={discSortBy}
                    onChange={(e) => setDiscSortBy(e.target.value)}
                    className="vintage-select-filter"
                  >
                    <option value="recent">Most Recent Dispatches</option>
                    <option value="appreciated">Most Appreciated (Likes)</option>
                  </select>
                </div>

                {discMovieFilter && (
                  <div className="active-movie-filter-pill">
                    <span>Filtered by Film #{discMovieFilter}</span>
                    <button
                      type="button"
                      onClick={() => setDiscMovieFilter(null)}
                      title="Clear movie filter"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Discussions Feed */}
            {loadingDiscussions ? (
              <div className="feed-status-box">
                <span className="spinner-text">RETRIEVING FILM SOCIETY DISPATCHES...</span>
              </div>
            ) : discussionsError ? (
              <div className="feed-status-box error-box">
                <p>{discussionsError}</p>
                <button
                  type="button"
                  className="vintage-retry-btn"
                  onClick={loadDiscussionsData}
                >
                  Retry Loading
                </button>
              </div>
            ) : discussions.length === 0 ? (
              <div className="empty-feed-card">
                <div className="empty-icon">🎬</div>
                <h3>NO DISPATCHES FOUND</h3>
                <p>
                  No active discussions match your search or filter. Be the cinephile who sparks
                  the conversation!
                </p>
                <button
                  type="button"
                  className="community-btn"
                  onClick={() => {
                    setDiscSearch("");
                    setDiscCategory("All Categories");
                    setDiscMovieFilter(null);
                    if (currentUser) setShowStartDiscModal(true);
                  }}
                >
                  Start First Discussion
                </button>
              </div>
            ) : (
              <>
                <div className="discussions-feed-grid">
                  {discussions.slice(0, discVisibleCount).map((disc) => (
                    <DiscussionCard
                      key={disc.id}
                      discussion={disc}
                      currentUserId={currentUser?.id}
                      onOpenDetails={(d) => setSelectedDiscussion(d)}
                      onToggleLike={handleToggleDiscussionLike}
                      onEdit={(d) => setSelectedDiscussion(d)}
                      onDelete={(d) => handleDeleteDiscussion(d.id)}
                      onShare={handleShareDiscussion}
                    />
                  ))}
                </div>

                {discVisibleCount < discussions.length && (
                  <div className="load-more-row">
                    <button
                      type="button"
                      className="load-more-btn"
                      onClick={() => setDiscVisibleCount((prev) => prev + PAGE_SIZE)}
                    >
                      + LOAD MORE DISPATCHES ({discussions.length - discVisibleCount} REMAINING)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 2: RECOMMENDATIONS FEED */}
        {/* ================================================================ */}
        {activeTab === "recommendations" && (
          <div className="community-section-view">
            {/* Discovery Control Chips */}
            <div className="discovery-chips-bar">
              <span className="chips-label">DISCOVER:</span>
              <button
                type="button"
                className={`discovery-chip ${recDiscoveryFilter === "all" ? "active" : ""}`}
                onClick={() => setRecDiscoveryFilter("all")}
              >
                All Recommendations
              </button>
              <button
                type="button"
                className={`discovery-chip ${recDiscoveryFilter === "appreciated" ? "active" : ""}`}
                onClick={() => setRecDiscoveryFilter("appreciated")}
              >
                ⭐ Most Appreciated
              </button>
              <button
                type="button"
                className={`discovery-chip ${recDiscoveryFilter === "cult" ? "active" : ""}`}
                onClick={() => setRecDiscoveryFilter("cult")}
              >
                🎞️ Cult Classics
              </button>
              <button
                type="button"
                className={`discovery-chip ${recDiscoveryFilter === "masterpiece" ? "active" : ""}`}
                onClick={() => setRecDiscoveryFilter("masterpiece")}
              >
                💎 Hidden Masterpieces
              </button>
              <button
                type="button"
                className={`discovery-chip ${recDiscoveryFilter === "midnight" ? "active" : ""}`}
                onClick={() => setRecDiscoveryFilter("midnight")}
              >
                🌙 Midnight Movies
              </button>
              {currentUser && (
                <button
                  type="button"
                  className={`discovery-chip ${recDiscoveryFilter === "my_recs" ? "active" : ""}`}
                  onClick={() => setRecDiscoveryFilter("my_recs")}
                >
                  👤 My Recommendations
                </button>
              )}
            </div>

            {/* Filter & Search Bar */}
            <div className="community-filter-panel">
              <div className="filter-search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search recommendations by movie title, mood, genre, or keyword..."
                  value={recSearch}
                  onChange={(e) => setRecSearch(e.target.value)}
                  className="vintage-input-search"
                />
                {recSearch && (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => setRecSearch("")}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="filter-controls-row">
                <div className="filter-select-group">
                  <label htmlFor="rec-cat-filter">Category:</label>
                  <select
                    id="rec-cat-filter"
                    value={recCategory}
                    onChange={(e) => {
                      setRecCategory(e.target.value);
                      setRecDiscoveryFilter("all");
                    }}
                    className="vintage-select-filter"
                  >
                    {RECOMMENDATION_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-select-group">
                  <label htmlFor="rec-sort-filter">Order:</label>
                  <select
                    id="rec-sort-filter"
                    value={recSortBy}
                    onChange={(e) => setRecSortBy(e.target.value)}
                    className="vintage-select-filter"
                  >
                    <option value="recent">Latest Recommendations</option>
                    <option value="appreciated">Most Appreciated</option>
                  </select>
                </div>

                {recMovieFilter && (
                  <div className="active-movie-filter-pill">
                    <span>Film: {recMovieTitleFilter || `#${recMovieFilter}`}</span>
                    <button
                      type="button"
                      onClick={clearRecMovieFilter}
                      title="Clear movie filter"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {recUserFilter && (
                  <div className="active-movie-filter-pill">
                    <span>Filtered by Author</span>
                    <button
                      type="button"
                      onClick={clearRecUserFilter}
                      title="Clear author filter"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Recommendations Feed */}
            {loadingRecommendations ? (
              <div className="feed-status-box">
                <span className="spinner-text">RETRIEVING CULT GEMS & RECOMMENDATIONS...</span>
              </div>
            ) : recommendationsError ? (
              <div className="feed-status-box error-box">
                <p>{recommendationsError}</p>
                <button
                  type="button"
                  className="vintage-retry-btn"
                  onClick={loadRecommendationsData}
                >
                  Retry Loading
                </button>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="empty-feed-card">
                <div className="empty-icon">🎯</div>
                <h3>NO RECOMMENDATIONS FOUND</h3>
                <p>
                  No movie recommendations match your selection. Share your favourite hidden
                  masterpiece with the society!
                </p>
                <button
                  type="button"
                  className="community-btn"
                  onClick={() => {
                    setRecSearch("");
                    setRecCategory("All Categories");
                    setRecDiscoveryFilter("all");
                    clearRecMovieFilter();
                    if (currentUser) setShowShareRecModal(true);
                  }}
                >
                  Share First Recommendation
                </button>
              </div>
            ) : (
              <>
                <div className="recommendations-feed-grid">
                  {recommendations.slice(0, recVisibleCount).map((rec) => (
                    <RecommendationCard
                      key={rec.id}
                      recommendation={rec}
                      currentUserId={currentUser?.id}
                      onOpenDetails={(r) => setSelectedRecommendation(r)}
                      onToggleLike={handleToggleRecommendationLike}
                      onEdit={(r) => setSelectedRecommendation(r)}
                      onDelete={(r) => handleDeleteRecommendation(r.id)}
                      onShare={handleShareRecommendation}
                      onFilterByMovie={handleFilterRecsByMovie}
                      onFilterByUser={handleFilterRecsByUser}
                    />
                  ))}
                </div>

                {recVisibleCount < recommendations.length && (
                  <div className="load-more-row">
                    <button
                      type="button"
                      className="load-more-btn"
                      onClick={() => setRecVisibleCount((prev) => prev + PAGE_SIZE)}
                    >
                      + LOAD MORE PICKS ({recommendations.length - recVisibleCount} REMAINING)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 3: COMMUNITY PICKS (TOP TITLES, DEBATES, AWARDS) */}
        {/* ================================================================ */}
        {activeTab === "picks" && (
          <div className="community-section-view">
            <CommunityPicks
              currentUser={currentUser}
              onOpenDiscussion={async (item) => {
                const full = await fetchDiscussionById(item.id, currentUser?.id);
                setSelectedDiscussion(full || item);
              }}
              onStartDiscussion={() => {
                if (currentUser) {
                  setShowStartDiscModal(true);
                } else {
                  showToast("Please sign in to pitch a cinema debate.");
                }
              }}
              onShowToast={showToast}
            />
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* MODALS */}
      {/* ================================================================ */}

      {/* Start Discussion Modal */}
      {showStartDiscModal && (
        <StartDiscussionModal
          currentUser={currentUser}
          onClose={() => setShowStartDiscModal(false)}
          onDiscussionCreated={(created) => {
            setDiscussions((prev) => [created, ...prev]);
            showToast("🎬 Discussion dispatch published to the community!");
          }}
        />
      )}

      {/* Share Recommendation Modal */}
      {showShareRecModal && (
        <ShareRecommendationModal
          currentUser={currentUser}
          onClose={() => setShowShareRecModal(false)}
          onRecommendationCreated={(created) => {
            setRecommendations((prev) => [created, ...prev]);
            showToast("🎯 Recommendation posted to the society archive!");
          }}
        />
      )}

      {/* Discussion Details & Comments Modal */}
      {selectedDiscussion && (
        <DiscussionDetailModal
          discussion={selectedDiscussion}
          currentUser={currentUser}
          onClose={() => setSelectedDiscussion(null)}
          onToggleLike={handleToggleDiscussionLike}
          onDiscussionUpdated={(updated) => {
            setDiscussions((prev) =>
              prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d))
            );
            setSelectedDiscussion(updated);
            showToast("Discussion updated.");
          }}
          onDiscussionDeleted={(deletedId) => {
            handleDeleteDiscussion(deletedId);
          }}
          onShare={handleShareDiscussion}
        />
      )}

      {/* Recommendation Details Modal */}
      {selectedRecommendation && (
        <RecommendationDetailModal
          recommendation={selectedRecommendation}
          currentUser={currentUser}
          onClose={() => setSelectedRecommendation(null)}
          onToggleLike={handleToggleRecommendationLike}
          onRecommendationUpdated={(updated) => {
            setRecommendations((prev) =>
              prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
            );
            setSelectedRecommendation(updated);
            showToast("Recommendation updated.");
          }}
          onRecommendationDeleted={(deletedId) => {
            handleDeleteRecommendation(deletedId);
          }}
          onShare={handleShareRecommendation}
          onFilterByMovie={handleFilterRecsByMovie}
          onFilterByUser={handleFilterRecsByUser}
        />
      )}
    </section>
  );
}

export default Community;