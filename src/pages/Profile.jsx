import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUser, logoutUser, updateUserAvatar, subscribeAuth, loginUser } from "../services/auth";
import {
  isSupabaseConfigured,
  supabase,
  validateProfileImage,
  uploadAvatarToStorage,
  updateProfileAvatar,
  removeProfileAvatar,
  saveUserProfile,
  fetchUserProfile,
  fetchUserReviews
} from "../services/supabase";
import "./Profile.css";

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(getUser());
  const [profile, setProfile] = useState(null);
  const [userReviews, setUserReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    full_name: "",
    username: "",
    mobile_number: ""
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Avatar Management State
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const fileInputRef = useRef(null);

  // Tabs: "reviews" | "activity" | "watchlist"
  const [activeTab, setActiveTab] = useState("reviews");

  // Notifications
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // 1. Synchronize user and fetch profile from Supabase
  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      const currentUser = getUser();
      if (!currentUser?.id) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        let fetchedProfile = null;
        if (isSupabaseConfigured && supabase) {
          fetchedProfile = await fetchUserProfile(currentUser.id);
          if (fetchedProfile && isMounted) {
            setProfile(fetchedProfile);
            setEditFormData({
              full_name: fetchedProfile.full_name || fetchedProfile.name || currentUser.name || "",
              username: fetchedProfile.username || currentUser.username || (currentUser.email ? currentUser.email.split("@")[0] : ""),
              mobile_number: fetchedProfile.mobile_number || fetchedProfile.mobile || currentUser.mobile_number || ""
            });
          }
        }

        // Fetch user reviews
        const revs = await fetchUserReviews(currentUser.id);
        if (isMounted) {
          setUserReviews(revs || []);
        }

        // Fallback to local session data if Supabase is offline or record pending
        if (isMounted && !fetchedProfile) {
          setProfile(currentUser);
          setEditFormData({
            full_name: currentUser.name || currentUser.full_name || "",
            username: currentUser.username || (currentUser.email ? currentUser.email.split("@")[0] : ""),
            mobile_number: currentUser.mobile_number || ""
          });
        }
      } catch (err) {
        console.warn("Profile load notice:", err);
        if (isMounted) {
          setProfile(currentUser);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProfile();

    // Subscribe to auth state changes (immediate synchronization)
    const unsubscribe = subscribeAuth((updatedUser) => {
      if (!updatedUser) {
        navigate("/login");
      } else if (isMounted) {
        setUser(updatedUser);
        setAvatarLoadError(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [navigate]);

  // Handle Photo Selection and Upload
  const handlePhotoSelect = async (event) => {
    setErrorMessage("");
    setStatusMessage("");
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateProfileImage(file);
    if (!validation.valid) {
      setErrorMessage(validation.error);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (!user?.id) {
      setErrorMessage("Authentication required to upload a profile photo.");
      return;
    }

    setAvatarUploading(true);
    setStatusMessage("Uploading profile picture to Supabase Storage...");

    try {
      if (isSupabaseConfigured && supabase) {
        // Upload to profile-images bucket under user's UUID folder
        const { publicUrl } = await uploadAvatarToStorage(user.id, file);

        // Update public.profiles table
        await updateProfileAvatar(user.id, publicUrl, {
          full_name: profile?.full_name || user.name,
          username: profile?.username || user.username,
          mobile_number: profile?.mobile_number || user.mobile_number
        });

        // Update local auth state & notify Header
        updateUserAvatar(publicUrl);
        setProfile((prev) => ({ ...prev, avatar_url: publicUrl }));
        setAvatarLoadError(false);
      } else {
        // Fallback for local testing without Supabase
        const reader = new FileReader();
        await new Promise((resolve) => {
          reader.onload = () => {
            updateUserAvatar(reader.result);
            setProfile((prev) => ({ ...prev, avatar_url: reader.result }));
            resolve();
          };
          reader.readAsDataURL(file);
        });
      }

      setStatusMessage("Profile photo updated successfully!");
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (err) {
      setErrorMessage(err.message || "Failed to upload image. Please try again.");
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle Photo Removal
  const handlePhotoRemove = async () => {
    if (!user?.id || !profile?.avatar_url) return;

    setAvatarUploading(true);
    setErrorMessage("");
    setStatusMessage("Removing profile photo...");

    try {
      if (isSupabaseConfigured && supabase) {
        await removeProfileAvatar(user.id, profile.avatar_url);
      }

      // Update state to NULL
      updateUserAvatar(null);
      setProfile((prev) => ({ ...prev, avatar_url: null }));
      setStatusMessage("Profile photo removed.");
      setTimeout(() => setStatusMessage(""), 2500);
    } catch (err) {
      setErrorMessage(err.message || "Failed to remove image. Please try again.");
    } finally {
      setAvatarUploading(false);
    }
  };

  // Handle Edit Profile Form Change
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Save Profile Edits
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setStatusMessage("");

    const trimmedName = editFormData.full_name.trim();
    const cleanUsername = editFormData.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    const trimmedMobile = editFormData.mobile_number.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage("Please enter a valid full name (minimum 2 characters).");
      return;
    }

    if (trimmedMobile) {
      const cleanMobile = trimmedMobile.replace(/[\s\-()]/g, "");
      if (cleanMobile.length < 7 || !/^\+?[0-9]{7,15}$/.test(cleanMobile)) {
        setErrorMessage("Please enter a valid mobile number (7 to 15 digits).");
        return;
      }
    }

    setSavingEdit(true);

    try {
      if (isSupabaseConfigured && supabase) {
        const updated = await saveUserProfile(user.id, {
          name: trimmedName,
          username: cleanUsername,
          mobile: trimmedMobile,
          avatarUrl: profile?.avatar_url || user.avatar_url,
          email: user.email
        });

        if (updated) {
          setProfile(updated);
        } else {
          setProfile((prev) => ({
            ...prev,
            full_name: trimmedName,
            name: trimmedName,
            username: cleanUsername,
            mobile_number: trimmedMobile
          }));
        }
      } else {
        setProfile((prev) => ({
          ...prev,
          full_name: trimmedName,
          name: trimmedName,
          username: cleanUsername,
          mobile_number: trimmedMobile
        }));
      }

      // Update application auth state so Header and session stay in sync
      const updatedUser = {
        ...user,
        name: trimmedName,
        full_name: trimmedName,
        username: cleanUsername,
        mobile_number: trimmedMobile
      };
      loginUser(updatedUser);

      setStatusMessage("Profile details updated successfully!");
      setIsEditing(false);
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (err) {
      setErrorMessage(err.message || "Failed to update profile. Please try again.");
    } finally {
      setSavingEdit(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  if (loading) {
    return (
      <section className="profile-page">
        <div className="profile-loading-state">
          <div className="loading-reel-spinner" aria-hidden="true">🎬</div>
          <p className="loading-text">ACCESSING CINIHUB DOSSIER...</p>
        </div>
      </section>
    );
  }

  const displayName = profile?.full_name || profile?.name || user?.name || "CINIHUB Member";
  const displayUsername = profile?.username || user?.username || (user?.email ? user.email.split("@")[0].toLowerCase() : "cinephile");
  const displayAvatar = profile?.avatar_url || user?.avatar_url || null;
  const displayMobile = profile?.mobile_number || profile?.mobile || user?.mobile_number || "";

  // Real statistics (derived dynamically from user reviews)
  const reviewsCount = userReviews.length;
  const moviesReviewedCount = new Set(userReviews.map((r) => r.movie_id)).size;
  const communityPostsCount = 0;

  return (
    <section className="profile-page">
      <div className="profile-container">

        {/* Vintage Header Stamp Banner */}
        <div className="profile-top-marquee">
          <span className="marquee-stars">★ ★ ★</span>
          <span className="marquee-title">CINIHUB ARCHIVE • MEMBER DOSSIER</span>
          <span className="marquee-stars">★ ★ ★</span>
        </div>

        {/* Status / Error Alerts */}
        {statusMessage && (
          <div className="profile-alert success-alert" role="status">
            <span className="alert-stamp">APPROVED</span>
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="profile-alert error-alert" role="alert">
            <span className="alert-stamp">ATTENTION</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* =================================================================
            INSTAGRAM-STYLE PROFILE HEADER (Cinematic Adaptation)
            ================================================================= */}
        <header className="profile-header-card">

          {/* Left Column (Desktop) / Top (Mobile): Avatar Frame */}
          <div className="profile-avatar-column">
            <div className="profile-avatar-frame">
              {displayAvatar && !avatarLoadError ? (
                <img
                  src={displayAvatar}
                  alt={`${displayName}'s Avatar`}
                  className="profile-avatar-image"
                  onError={() => setAvatarLoadError(true)}
                />
              ) : (
                <div className="profile-avatar-placeholder" aria-label="Default avatar">
                  <svg viewBox="0 0 24 24" className="profile-avatar-svg" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              )}

              {avatarUploading && (
                <div className="profile-avatar-uploading-overlay">
                  <span className="uploading-spinner">⏳</span>
                </div>
              )}
            </div>

            {/* Profile Picture Actions */}
            <div className="avatar-quick-actions">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                style={{ display: "none" }}
                onChange={handlePhotoSelect}
                aria-label="Upload profile image"
              />
              <button
                type="button"
                className="profile-photo-btn change-photo-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                title="Upload or change your profile picture"
              >
                📷 Change Photo
              </button>

              {displayAvatar && (
                <button
                  type="button"
                  className="profile-photo-btn remove-photo-btn"
                  onClick={handlePhotoRemove}
                  disabled={avatarUploading}
                  title="Remove your profile picture"
                >
                  ✕ Remove
                </button>
              )}
            </div>
            <span className="avatar-spec-note">JPG, PNG, WebP • Max 2 MB</span>
          </div>

          {/* Right Column: User Info, Stats, Bio */}
          <div className="profile-info-column">

            {/* Top Row: Username & Primary Action Buttons */}
            <div className="profile-top-actions-row">
              <h1 className="profile-handle">@{displayUsername}</h1>

              <div className="profile-buttons-group">
                <button
                  type="button"
                  className="profile-action-btn edit-profile-btn"
                  onClick={() => setIsEditing(true)}
                >
                  ✏️ Edit Profile
                </button>

                <button
                  type="button"
                  className="profile-action-btn logout-profile-btn"
                  onClick={handleLogout}
                >
                  🚪 Logout
                </button>
              </div>
            </div>

            {/* Middle Row: Instagram-Inspired Statistics Row */}
            <div className="profile-stats-strip">
              <div className="stat-box">
                <span className="stat-count">{reviewsCount}</span>
                <span className="stat-label">reviews written</span>
              </div>
              <div className="stat-box">
                <span className="stat-count">{moviesReviewedCount}</span>
                <span className="stat-label">movies reviewed</span>
              </div>
              <div className="stat-box">
                <span className="stat-count">{communityPostsCount}</span>
                <span className="stat-label">community dispatches</span>
              </div>
            </div>

            {/* Bottom Row: User Dossier Bio Details */}
            <div className="profile-bio-dossier">
              <div className="profile-real-name-row">
                <span className="real-name">{displayName}</span>
                <span className="pass-status-pill">★ ACTIVE PASS</span>
              </div>

              <div className="profile-meta-details">
                <div className="meta-item">
                  <span className="meta-icon" aria-hidden="true">✉️</span>
                  <span className="meta-text">{user?.email || "Email unlisted"}</span>
                </div>

                {displayMobile ? (
                  <div className="meta-item">
                    <span className="meta-icon" aria-hidden="true">📱</span>
                    <span className="meta-text">{displayMobile}</span>
                  </div>
                ) : (
                  <div className="meta-item meta-empty">
                    <span className="meta-icon" aria-hidden="true">📱</span>
                    <span className="meta-text">No mobile number added</span>
                  </div>
                )}

                <div className="meta-item">
                  <span className="meta-icon" aria-hidden="true">🎟️</span>
                  <span className="meta-text">Passholder UUID: {user?.id ? `${user.id.slice(0, 8)}...` : "Authenticated"}</span>
                </div>
              </div>
            </div>

          </div>

        </header>

        {/* =================================================================
            INSTAGRAM-STYLE TAB NAVIGATION (Cinematic Adaptation)
            ================================================================= */}
        <div className="profile-tabs-nav" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "reviews"}
            className={`profile-tab-btn ${activeTab === "reviews" ? "active" : ""}`}
            onClick={() => setActiveTab("reviews")}
          >
            <span className="tab-icon">🎬</span>
            <span className="tab-text">MY REVIEWS</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "activity"}
            className={`profile-tab-btn ${activeTab === "activity" ? "active" : ""}`}
            onClick={() => setActiveTab("activity")}
          >
            <span className="tab-icon">💬</span>
            <span className="tab-text">MY ACTIVITY</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "watchlist"}
            className={`profile-tab-btn ${activeTab === "watchlist" ? "active" : ""}`}
            onClick={() => setActiveTab("watchlist")}
          >
            <span className="tab-icon">🔖</span>
            <span className="tab-text">WATCHLIST</span>
          </button>
        </div>

        {/* =================================================================
            TAB CONTENT SECTIONS (With Authentic Cinema Empty States)
            ================================================================= */}
        <div className="profile-tab-content-panel">

          {/* TAB 1: MY REVIEWS */}
          {activeTab === "reviews" && (
            userReviews.length > 0 ? (
              <div className="profile-reviews-grid">
                {userReviews.map((rev) => (
                  <article key={rev.id} className="profile-user-review-card">
                    <div className="card-top-row">
                      <span className="movie-tag">TMDB PRINT #{rev.movie_id}</span>
                      <span className="user-score-badge">⭐ {Number(rev.rating).toFixed(1)} / 10</span>
                    </div>
                    <p className="user-review-text">"{rev.review_text}"</p>
                    <div className="card-bottom-row">
                      <span className="review-date">
                        {new Date(rev.created_at).toLocaleDateString()}
                      </span>
                      <Link to={`/movies/${rev.movie_id}`} className="view-movie-action-link">
                        View Film & Edit Review →
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="tab-pane-empty-state">
                <div className="empty-state-graphic" aria-hidden="true">🎞️</div>
                <h3 className="empty-state-title">NO REVIEWS FILED YET</h3>
                <p className="empty-state-description">
                  Your cinema critic archive is currently empty. Explore trending films and submit your unvarnished dispatch reviews.
                </p>
                <Link to="/movies" className="empty-state-cta-btn">
                  ★ Explore Movies & Write a Review
                </Link>
              </div>
            )
          )}

          {/* TAB 2: MY ACTIVITY */}
          {activeTab === "activity" && (
            <div className="tab-pane-empty-state">
              <div className="empty-state-graphic" aria-hidden="true">💬</div>
              <h3 className="empty-state-title">NO COMMUNITY DISPATCHES</h3>
              <p className="empty-state-description">
                You haven't participated in the CINIHUB Film Society yet. Debate unforgettable movie scenes and recommend midnight cult discoveries.
              </p>
              <Link to="/community" className="empty-state-cta-btn">
                ★ Join the Film Society
              </Link>
            </div>
          )}

          {/* TAB 3: WATCHLIST */}
          {activeTab === "watchlist" && (
            <div className="tab-pane-empty-state">
              <div className="empty-state-graphic" aria-hidden="true">🔖</div>
              <h3 className="empty-state-title">WATCHLIST IS EMPTY</h3>
              <p className="empty-state-description">
                Your marquee watchlist is currently clear. Browse through titles to curate your personal cinema schedule.
              </p>
              <Link to="/movies" className="empty-state-cta-btn">
                ★ Discover Films for Watchlist
              </Link>
            </div>
          )}

        </div>

        {/* Vintage Bottom Billing Strip */}
        <div className="profile-footer-stamp">
          <span>ORIGINAL PRODUCTION • AUTHENTICATED CINIHUB PASS • DIRECTED BY THE FILM SOCIETY</span>
        </div>

      </div>

      {/* =================================================================
          EDIT PROFILE MODAL (Tarantino Dossier Style)
          ================================================================= */}
      {isEditing && (
        <div className="edit-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
          <div className="edit-modal-card">
            
            <div className="modal-header-stamp">
              <span className="modal-stamp-edge">★ ★ ★</span>
              <span className="modal-stamp-text">CONFIDENTIAL DOSSIER EDIT</span>
              <span className="modal-stamp-edge">★ ★ ★</span>
            </div>

            <h2 id="edit-modal-title" className="edit-modal-heading">
              Edit Member Profile
            </h2>
            <p className="edit-modal-subheading">
              Update your registered credentials in the CINIHUB database.
            </p>

            <form onSubmit={handleSaveProfile} className="edit-profile-form">
              
              <div className="modal-field-group">
                <label htmlFor="edit-full-name">
                  Full Name <span className="req-star">*</span>
                </label>
                <input
                  id="edit-full-name"
                  type="text"
                  name="full_name"
                  value={editFormData.full_name}
                  onChange={handleEditChange}
                  placeholder="e.g. Vincent Vega"
                  required
                />
              </div>

              <div className="modal-field-group">
                <label htmlFor="edit-username">
                  Username Handle <span className="req-star">*</span>
                </label>
                <input
                  id="edit-username"
                  type="text"
                  name="username"
                  value={editFormData.username}
                  onChange={handleEditChange}
                  placeholder="e.g. vincent_vega"
                  required
                />
                <span className="field-hint">Alphanumeric characters and underscores only.</span>
              </div>

              <div className="modal-field-group">
                <label htmlFor="edit-mobile">
                  Mobile Number
                </label>
                <input
                  id="edit-mobile"
                  type="tel"
                  name="mobile_number"
                  value={editFormData.mobile_number}
                  onChange={handleEditChange}
                  placeholder="e.g. +1 555-123-4567"
                />
              </div>

              <div className="modal-field-group">
                <label htmlFor="edit-email-readonly">
                  Email Address <span className="locked-tag">(Auth Credential)</span>
                </label>
                <input
                  id="edit-email-readonly"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="readonly-input"
                />
                <span className="field-hint">Email is linked to your Supabase login authentication.</span>
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => {
                    setIsEditing(false);
                    setErrorMessage("");
                  }}
                  disabled={savingEdit}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="modal-submit-btn"
                  disabled={savingEdit}
                >
                  {savingEdit ? "SAVING..." : "SAVE PROFILE PASS"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </section>
  );
}

export default Profile;
