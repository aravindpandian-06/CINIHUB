import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { loginUser as saveUser } from "../services/auth";
import {
    isSupabaseConfigured,
    supabase,
    validateProfileImage,
    uploadAvatarToStorage,
    updateProfileAvatar,
    saveUserProfile,
    fetchUserProfile,
    formatSupabaseAuthError,
    storeDeferredAvatar,
    getDeferredAvatar,
    clearDeferredAvatar
} from "../services/supabase";

import "./Login.css";

function Login({ initialSignUp = false }) {
    const navigate = useNavigate();
    const location = useLocation();

    const isExplicitSignUp = location.pathname === "/signup";
    const [toggledSignUp, setToggledSignUp] = useState(null);
    const isSignUp = toggledSignUp !== null ? toggledSignUp : (initialSignUp || isExplicitSignUp);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        mobile: ""
    });

    const [selectedImageFile, setSelectedImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageError, setImageError] = useState("");

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const fileInputRef = useRef(null);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Handle image file selection with validation (<= 2MB, JPG/PNG/WebP)
    const handleImageChange = (event) => {
        setImageError("");
        const file = event.target.files?.[0];
        if (!file) return;

        const validation = validateProfileImage(file);
        if (!validation.valid) {
            setImageError(validation.error);
            if (fileInputRef.current) fileInputRef.current.value = "";
            setSelectedImageFile(null);
            setImagePreview(null);
            return;
        }

        setSelectedImageFile(file);
        const reader = new FileReader();
        reader.onload = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    // Handle removing the selected image before submission
    const handleRemoveSelectedImage = () => {
        setSelectedImageFile(null);
        setImagePreview(null);
        setImageError("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage("");
        setError("");
        setImageError("");

        const trimmedEmail = (formData.email || "").trim();
        const trimmedPassword = formData.password || "";

        // Client-side validation
        if (isSignUp) {
            const trimmedName = (formData.name || "").trim();
            const trimmedMobile = (formData.mobile || "").trim();

            if (!trimmedName || trimmedName.length < 2) {
                setError("Please enter your full name (minimum 2 characters).");
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(trimmedEmail)) {
                setError("Please enter a valid email address (e.g. name@cinema.com).");
                return;
            }

            const cleanMobile = trimmedMobile.replace(/[\s\-()]/g, "");
            if (!cleanMobile || cleanMobile.length < 7 || !/^\+?[0-9]{7,15}$/.test(cleanMobile)) {
                setError("Please enter a valid mobile number (7 to 15 digits).");
                return;
            }

            if (!trimmedPassword || trimmedPassword.length < 6) {
                setError("Password must be at least 6 characters long.");
                return;
            }
        } else {
            if (!trimmedEmail || !trimmedEmail.includes("@")) {
                setError("Please enter a valid email address.");
                return;
            }
            if (!trimmedPassword) {
                setError("Please enter your password.");
                return;
            }
        }

        // Verify Supabase configuration before attempting authentication
        if (!isSupabaseConfigured || !supabase) {
            setError(
                "Supabase is not configured yet. Please add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to your .env file and restart the Vite development server."
            );
            console.error("Supabase configuration check failed:", {
                hasUrl: Boolean(import.meta.env.VITE_SUPABASE_URL),
                hasKey: Boolean(
                    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
                    import.meta.env.VITE_SUPABASE_ANON_KEY
                )
            });
            return;
        }

        setLoading(true);

        try {
            if (isSignUp) {
                const trimmedName = formData.name.trim();
                const trimmedMobile = formData.mobile.trim();
                const username = trimmedEmail.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
                let uploadedAvatarUrl = null;

                // 1. Register with Supabase Auth
                const { data: authData, error: authErr } = await supabase.auth.signUp({
                    email: trimmedEmail,
                    password: trimmedPassword,
                    options: {
                        data: {
                            full_name: trimmedName,
                            name: trimmedName,
                            mobile_number: trimmedMobile,
                            mobile: trimmedMobile,
                            username: username
                        }
                    }
                });

                if (authErr) {
                    console.error("Supabase signUp error:", {
                        status: authErr.status,
                        name: authErr.name,
                        message: authErr.message
                    });
                    throw new Error(formatSupabaseAuthError(authErr));
                }

                const user = authData?.user;
                const session = authData?.session;

                if (!user) {
                    throw new Error("Unable to create account. Please verify your details and try again.");
                }

                // Supabase returns an empty identities array for existing users when email confirmation is enabled
                if (user.identities && user.identities.length === 0) {
                    throw new Error(
                        "This email address is already registered. Please log in or use another email."
                    );
                }

                if (session) {
                    // Authenticated immediately (email confirmation disabled)
                    if (selectedImageFile) {
                        try {
                            const { publicUrl } = await uploadAvatarToStorage(user.id, selectedImageFile);
                            uploadedAvatarUrl = publicUrl;
                        } catch (uploadErr) {
                            console.warn("Avatar upload notice:", uploadErr);
                        }
                    }

                    // Save user profile in public.profiles table
                    await saveUserProfile(user.id, {
                        name: trimmedName,
                        mobile: trimmedMobile,
                        avatarUrl: uploadedAvatarUrl,
                        email: trimmedEmail
                    });

                    saveUser({
                        id: user.id,
                        name: trimmedName,
                        full_name: trimmedName,
                        username: username,
                        email: trimmedEmail,
                        mobile_number: trimmedMobile,
                        avatar_url: uploadedAvatarUrl
                    });

                    setMessage("Account created and logged in successfully!");
                    navigate("/home");
                    return;
                } else {
                    // Email confirmation is required by Supabase project
                    if (selectedImageFile) {
                        await storeDeferredAvatar(trimmedEmail, selectedImageFile);
                    }

                    setMessage(
                        "Registration successful! Please check your email to verify your account before logging in."
                    );
                    setToggledSignUp(false);
                    setFormData({
                        name: "",
                        email: trimmedEmail,
                        password: "",
                        mobile: ""
                    });
                    setSelectedImageFile(null);
                    setImagePreview(null);
                    return;
                }
            } else {
                // LOGIN MODE
                const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
                    email: trimmedEmail,
                    password: trimmedPassword
                });

                if (authErr) {
                    console.error("Supabase signIn error:", {
                        status: authErr.status,
                        name: authErr.name,
                        message: authErr.message
                    });
                    throw new Error(formatSupabaseAuthError(authErr));
                }

                const authUser = authData?.user;
                if (!authUser) {
                    throw new Error("Unable to log in. Please check your credentials.");
                }

                let avatarUrl = null;

                // Check for deferred avatar awaiting upload upon first login
                const deferredFile = getDeferredAvatar(authUser.email);
                if (deferredFile) {
                    try {
                        const { publicUrl } = await uploadAvatarToStorage(authUser.id, deferredFile);
                        avatarUrl = publicUrl;
                        await updateProfileAvatar(authUser.id, avatarUrl);
                        clearDeferredAvatar(authUser.email);
                    } catch (deferErr) {
                        console.warn("Deferred avatar upload warning:", deferErr);
                    }
                }

                // Retrieve user profile from public.profiles
                let profile = await fetchUserProfile(authUser.id);

                // If profile record does not exist yet, repair/create it
                if (!profile) {
                    try {
                        profile = await saveUserProfile(authUser.id, {
                            name:
                                authUser.user_metadata?.full_name ||
                                authUser.user_metadata?.name ||
                                authUser.email.split("@")[0],
                            mobile:
                                authUser.user_metadata?.mobile_number ||
                                authUser.user_metadata?.mobile ||
                                null,
                            avatarUrl: avatarUrl,
                            email: authUser.email
                        });
                    } catch (safeProfErr) {
                        console.warn("Profile auto-creation note:", safeProfErr);
                    }
                }

                const finalAvatar = avatarUrl || profile?.avatar_url || null;
                const finalName =
                    profile?.full_name ||
                    profile?.name ||
                    authUser.user_metadata?.full_name ||
                    authUser.user_metadata?.name ||
                    authUser.email.split("@")[0];

                const finalMobile =
                    profile?.mobile_number ||
                    profile?.mobile ||
                    authUser.user_metadata?.mobile_number ||
                    authUser.user_metadata?.mobile ||
                    null;

                const finalUsername =
                    profile?.username ||
                    authUser.user_metadata?.username ||
                    (authUser.email ? authUser.email.split("@")[0].toLowerCase() : null);

                const loggedInUser = {
                    id: authUser.id,
                    name: finalName,
                    full_name: finalName,
                    username: finalUsername,
                    email: authUser.email,
                    mobile_number: finalMobile,
                    avatar_url: finalAvatar
                };

                saveUser(loggedInUser);
                setMessage("Login successful!");
                navigate("/home");
            }
        } catch (err) {
            setError(err.message || "An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setToggledSignUp(!isSignUp);
        setError("");
        setMessage("");
        setImageError("");
        setSelectedImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <section className="login-page">
            <div className="login-poster-wrapper">
                {/* Vintage Cinema Poster Card */}
                <div className={`login-card ${isSignUp ? "signup-mode" : "login-mode"}`}>
                    
                    {/* Top Exploitation Movie Header Stamp */}
                    <div className="poster-header-stamp">
                        <span className="stamp-edge">★ ★ ★</span>
                        <span className="stamp-text">A CINIHUB PRODUCTION • FEATURE PRESENTATION</span>
                        <span className="stamp-edge">★ ★ ★</span>
                    </div>

                    {/* Retro Film Reel Graphic Icon */}
                    <div className="login-icon-badge" aria-hidden="true">
                        <span className="film-reel-icon">🎬</span>
                    </div>

                    {/* Prominent Aachen Bold-Style Heading */}
                    <div className="poster-heading-block">
                        <h1 className="poster-main-heading">
                            {isSignUp ? "Create Account" : "Welcome Back"}
                        </h1>
                        <p className="poster-sub-heading">
                            {isSignUp
                                ? "Join the CINIHUB community"
                                : "Login to your CINIHUB account"}
                        </p>
                    </div>

                    {/* Decorative Film Strip Divider */}
                    <div className="poster-strip-divider" aria-hidden="true">
                        <span className="sprocket-hole"></span>
                        <span className="sprocket-hole"></span>
                        <span className="sprocket-hole"></span>
                        <span className="sprocket-hole"></span>
                        <span className="sprocket-hole"></span>
                    </div>

                    {/* Status Alert Banners */}
                    {message && (
                        <div className="success-message poster-alert" role="status">
                            <span className="alert-badge">APPROVED</span>
                            <span>{message}</span>
                        </div>
                    )}

                    {error && (
                        <div className="error-message poster-alert" role="alert">
                            <span className="alert-badge">ATTENTION</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Credentials Form */}
                    <form onSubmit={handleSubmit} className="poster-form">
                        
                        {/* Optional Profile Image Upload Field (Sign Up Only) */}
                        {isSignUp && (
                            <div className="avatar-upload-group">
                                <label className="avatar-upload-label" htmlFor="signup-avatar-input">
                                    Profile Picture <span className="optional-tag">(Optional)</span>
                                </label>

                                <div className="avatar-preview-container">
                                    <div className="avatar-preview-frame">
                                        {imagePreview ? (
                                            <img
                                                src={imagePreview}
                                                alt="Selected Profile Preview"
                                                className="avatar-preview-image"
                                            />
                                        ) : (
                                            <div className="avatar-preview-placeholder">
                                                <span className="placeholder-icon" aria-hidden="true">📷</span>
                                                <span className="placeholder-hint">NO IMAGE</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="avatar-action-controls">
                                        {/* Hidden File Input */}
                                        <input
                                            ref={fileInputRef}
                                            id="signup-avatar-input"
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,image/jpg"
                                            onChange={handleImageChange}
                                            style={{ display: "none" }}
                                            aria-label="Upload profile image (optional)"
                                        />

                                        <div className="avatar-buttons-row">
                                            <button
                                                type="button"
                                                className="avatar-select-btn"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                {imagePreview ? "Change Photo" : "Choose Photo"}
                                            </button>

                                            {imagePreview && (
                                                <button
                                                type="button"
                                                className="avatar-remove-choice-btn"
                                                onClick={handleRemoveSelectedImage}
                                                title="Remove selected photo"
                                                >
                                                    ✕ Remove
                                                </button>
                                            )}
                                        </div>

                                        <span className="avatar-requirements-hint">
                                            JPG, PNG, WebP • Max 2 MB
                                        </span>
                                    </div>
                                </div>

                                {imageError && (
                                    <div className="avatar-inline-error" role="alert">
                                        ★ {imageError}
                                    </div>
                                )}
                            </div>
                        )}

                        {isSignUp && (
                            <div className="input-group">
                                <label htmlFor="name-input">
                                    Full Name <span className="req-star">*</span>
                                </label>
                                <input
                                    id="name-input"
                                    type="text"
                                    name="name"
                                    placeholder="e.g. Vincent Vega"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    autoComplete="name"
                                />
                            </div>
                        )}

                        <div className="input-group">
                            <label htmlFor="email-input">
                                Email Address <span className="req-star">*</span>
                            </label>
                            <input
                                id="email-input"
                                type="email"
                                name="email"
                                placeholder="name@cinema.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                autoComplete="email"
                            />
                        </div>

                        {isSignUp && (
                            <div className="input-group">
                                <label htmlFor="mobile-input">
                                    Mobile Number <span className="req-star">*</span>
                                </label>
                                <input
                                    id="mobile-input"
                                    type="tel"
                                    name="mobile"
                                    placeholder="Enter your phone number"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                    required
                                    autoComplete="tel"
                                />
                            </div>
                        )}

                        <div className="input-group">
                            <label htmlFor="password-input">
                                Password <span className="req-star">*</span>
                            </label>
                            <input
                                id="password-input"
                                type="password"
                                name="password"
                                placeholder="Enter secure password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                autoComplete={isSignUp ? "new-password" : "current-password"}
                            />
                        </div>

                        {/* Bold Orange Cinema Button */}
                        <button
                            type="submit"
                            className="login-button poster-action-btn"
                            disabled={loading}
                        >
                            <span className="btn-text">
                                {loading
                                    ? "AUTHENTICATING..."
                                    : isSignUp
                                        ? "CREATE PASS & REGISTER"
                                        : "ADMIT ONE • LOGIN"}
                            </span>
                            <span className="btn-glare" aria-hidden="true"></span>
                        </button>
                    </form>

                    {/* Mode Switcher */}
                    <div className="switch-mode poster-footer-note">
                        <span className="switch-prompt">
                            {isSignUp
                                ? "Already hold a member pass?"
                                : "Don't have a cinema account yet?"}
                        </span>
                        <button
                            type="button"
                            className="switch-toggle-btn"
                            onClick={toggleMode}
                        >
                            {isSignUp ? "★ Back to Login" : "★ Join the Cast (Sign Up)"}
                        </button>
                    </div>

                    {/* Bottom Billing Block Footer */}
                    <div className="poster-billing-block" aria-hidden="true">
                        <span>ORIGINAL SCREENPLAY • RATED C FOR CINEMA • DIRECTED BY CINIHUB</span>
                    </div>

                </div>
            </div>
        </section>
    );
}

export default Login;