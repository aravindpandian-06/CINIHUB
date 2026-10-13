import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getUser, logoutUser, updateUserAvatar, subscribeAuth } from "../services/auth";
import {
  isSupabaseConfigured,
  supabase,
  BUCKET_NAME,
  validateProfileImage,
  uploadAvatarToStorage,
  updateProfileAvatar,
  removeProfileAvatar
} from "../services/supabase";
import "./Header.css";

function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(getUser());
  const [menuOpen, setMenuOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  const menuRef = useRef(null);
  const fileInputRef = useRef(null);

  // Subscribe to auth state updates (immediate synchronization)
  useEffect(() => {
    const unsubscribe = subscribeAuth((updatedUser) => {
      setUser(updatedUser);
      setAvatarLoadError(false);
    });
    return unsubscribe;
  }, []);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
        setErrorMessage("");
        setStatusMessage("");
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  // Handle image upload from profile dropdown
  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate size and format
    const validation = validateProfileImage(file);
    if (!validation.valid) {
      setErrorMessage(validation.error);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    setErrorMessage("");
    setStatusMessage("Uploading new image...");

    try {
      const prevAvatarUrl = user?.avatar_url;

      if (isSupabaseConfigured && supabase) {
        // Upload new image to Supabase Storage (<user-id>/unique-name)
        const { publicUrl } = await uploadAvatarToStorage(user.id, file);

        // Update avatar_url in public.profiles table
        await updateProfileAvatar(user.id, publicUrl);

        // Update local auth state so Header updates immediately
        updateUserAvatar(publicUrl);

        // Delete previous storage image only after new image and DB update succeeded
        if (prevAvatarUrl && prevAvatarUrl.includes(`/${BUCKET_NAME}/`)) {
          try {
            const parts = prevAvatarUrl.split(`/${BUCKET_NAME}/`);
            if (parts[1]) {
              const pathToDelete = decodeURIComponent(parts[1].split("?")[0]);
              await supabase.storage.from(BUCKET_NAME).remove([pathToDelete]);
            }
          } catch (storageErr) {
            console.warn("Storage cleanup note:", storageErr);
          }
        }
      } else {
        // Fallback for local development if Supabase keys not configured
        const reader = new FileReader();
        await new Promise((resolve) => {
          reader.onload = () => {
            updateUserAvatar(reader.result);
            resolve();
          };
          reader.readAsDataURL(file);
        });
      }

      setStatusMessage("Profile image updated!");
      setTimeout(() => {
        setStatusMessage("");
        setMenuOpen(false);
      }, 1200);
    } catch (err) {
      setErrorMessage(err.message || "Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle profile image removal
  const handleRemoveImage = async () => {
    if (!user?.avatar_url) return;

    setUploading(true);
    setErrorMessage("");
    setStatusMessage("Removing image...");

    try {
      if (isSupabaseConfigured && supabase) {
        await removeProfileAvatar(user.id, user.avatar_url);
      }

      // Set avatar_url to null in auth state; immediately restores default user icon
      updateUserAvatar(null);
      setStatusMessage("Image removed!");

      setTimeout(() => {
        setStatusMessage("");
        setMenuOpen(false);
      }, 1000);
    } catch (err) {
      setErrorMessage(err.message || "Failed to remove image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await logoutUser();
    setMenuOpen(false);

    // If on a protected route, navigate to login
    const protectedRoutes = ["/movies", "/reviews", "/community", "/profile"];
    if (protectedRoutes.includes(location.pathname)) {
      navigate("/login");
    }
  };

  return (
    <header className="header film-strip-border">
      <div className="header-container">
        <Link to="/home" className="logo" aria-label="CINIHUB Home">
          <img
            src="/assets/cinihub-gold-logo.png"
            alt="CINIHUB"
            className="logo-image"
          />
        </Link>

        <nav className="nav-menu" aria-label="Main Navigation">
          <Link
            to="/home"
            className={`nav-item ${location.pathname === "/home" ? "active" : ""}`}
          >
            Home
          </Link>

          <Link
            to="/movies"
            className={`nav-item ${location.pathname === "/movies" ? "active" : ""}`}
          >
            Movies
          </Link>

          <Link
            to="/reviews"
            className={`nav-item ${location.pathname === "/reviews" ? "active" : ""}`}
          >
            Reviews
          </Link>

          <Link
            to="/community"
            className={`nav-item ${location.pathname === "/community" ? "active" : ""}`}
          >
            Community
          </Link>

          {/* Conditional: Profile Avatar (Logged in) OR Login Button (Logged out) */}
          {user ? (
            <div className="header-profile-wrapper" ref={menuRef}>
              {/* Circular Avatar Link: Directly navigates to /profile page */}
              <Link
                to="/profile"
                id="header-profile-btn"
                className={`header-avatar-btn ${location.pathname === "/profile" ? "active" : ""}`}
                aria-label={`View profile for ${user.name || "Member"}`}
                title="View Profile"
              >
                {user.avatar_url && !avatarLoadError ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name || "User Avatar"}
                    className="header-avatar-img"
                    onError={() => setAvatarLoadError(true)}
                  />
                ) : (
                  <div
                    className="header-avatar-default"
                    aria-label="Default avatar"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="header-avatar-svg"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
              </Link>

              {/* Quick Options Dropdown Toggle */}
              <button
                type="button"
                className={`header-avatar-toggle-btn ${menuOpen ? "open" : ""}`}
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle user options menu"
                aria-expanded={menuOpen}
              >
                <span className="caret-arrow" aria-hidden="true">▾</span>
              </button>

              {/* Profile Dropdown Menu */}
              {menuOpen && (
                <div
                  className="header-profile-dropdown"
                  role="menu"
                  aria-labelledby="header-profile-btn"
                >
                  {/* User Information Block */}
                  <div className="profile-dropdown-user-block">
                    <span className="profile-badge">MEMBER PASS</span>
                    <h3 className="profile-user-name">
                      {user.name || "CINIHUB Member"}
                    </h3>
                    {user.email && (
                      <p className="profile-user-email">{user.email}</p>
                    )}
                  </div>

                  <div className="dropdown-film-strip-divider" aria-hidden="true">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>

                  {/* Feedback Messages */}
                  {statusMessage && (
                    <div className="dropdown-status-msg" role="status">
                      ★ {statusMessage}
                    </div>
                  )}

                  {errorMessage && (
                    <div className="dropdown-error-msg" role="alert">
                      ! {errorMessage}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="profile-dropdown-actions">
                    {/* View Profile Page Link */}
                    <Link
                      to="/profile"
                      className="dropdown-item-btn view-profile-item"
                      onClick={() => setMenuOpen(false)}
                      role="menuitem"
                    >
                      <span className="dropdown-item-icon">👤</span>
                      <span>View Profile</span>
                    </Link>

                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                      aria-hidden="true"
                    />

                    {/* Change Profile Image */}
                    <button
                      type="button"
                      className="dropdown-item-btn"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      role="menuitem"
                    >
                      <span className="dropdown-item-icon">📷</span>
                      <span>Change Profile Image</span>
                    </button>

                    {/* Remove Profile Image - ONLY visible when avatar exists */}
                    {user.avatar_url && (
                      <button
                        type="button"
                        className="dropdown-item-btn remove-btn"
                        onClick={handleRemoveImage}
                        disabled={uploading}
                        role="menuitem"
                      >
                        <span className="dropdown-item-icon">🗑️</span>
                        <span>Remove Profile Image</span>
                      </button>
                    )}

                    {/* Vintage Perforated Separation */}
                    <div className="dropdown-perforation" aria-hidden="true"></div>

                    {/* Logout */}
                    <button
                      type="button"
                      className="dropdown-item-btn logout-btn"
                      onClick={handleLogout}
                      role="menuitem"
                    >
                      <span className="dropdown-item-icon">🚪</span>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className={`login-link ${location.pathname === "/login" || location.pathname === "/signup" ? "active" : ""}`}
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;

