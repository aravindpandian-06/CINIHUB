import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { loginUser, signupUser } from "../services/authApi";
import { loginUser as saveUser } from "../services/auth";

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

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage("");
        setError("");
        setLoading(true);

        try {
            if (isSignUp) {
                const data = await signupUser(formData);
                setMessage(data.message || "Account created successfully! Please login.");
                setToggledSignUp(false);
                setFormData({
                    name: "",
                    email: formData.email,
                    password: "",
                    mobile: ""
                });
            } else {
                const data = await loginUser(
                    formData.email,
                    formData.password
                );

                // Save verified user in localStorage
                saveUser(data.user);
                setMessage("Login successful!");

                // Go to Home
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