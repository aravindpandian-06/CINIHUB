import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { loginUser, signupUser } from "../services/authApi";
import { loginUser as saveUser } from "../services/auth";

import "./Login.css";

function Login() {

    const navigate = useNavigate();

    const [isSignUp, setIsSignUp] = useState(false);

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

                setMessage(data.message);

                setIsSignUp(false);

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
                navigate("/");

            }

        } catch (error) {

            setError(error.message);

        } finally {

            setLoading(false);

        }

    };


    return (

        <section className="login-page">

            <div className="login-card">

                <div className="login-icon">
                    🎬
                </div>

                <h1>
                    {isSignUp
                        ? "Create Account"
                        : "Welcome Back"}
                </h1>

                <p>
                    {isSignUp
                        ? "Join the CINIHUB community"
                        : "Login to your CINIHUB account"}
                </p>


                {message && (
                    <div className="success-message">
                        {message}
                    </div>
                )}


                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}


                <form onSubmit={handleSubmit}>

                    {isSignUp && (

                        <div className="input-group">

                            <label>
                                Full Name
                            </label>

                            <input
                                type="text"
                                name="name"
                                placeholder="Enter your name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />

                        </div>

                    )}


                    <div className="input-group">

                        <label>
                            Email
                        </label>

                        <input
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />

                    </div>


                    {isSignUp && (

                        <div className="input-group">

                            <label>
                                Mobile Number
                            </label>

                            <input
                                type="tel"
                                name="mobile"
                                placeholder="Enter your mobile number"
                                value={formData.mobile}
                                onChange={handleChange}
                                required
                            />

                        </div>

                    )}


                    <div className="input-group">

                        <label>
                            Password
                        </label>

                        <input
                            type="password"
                            name="password"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />

                    </div>


                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >

                        {loading
                            ? "Please wait..."
                            : isSignUp
                                ? "Create Account"
                                : "Login"}

                    </button>

                </form>


                <div className="switch-mode">

                    {isSignUp
                        ? "Already have an account?"
                        : "Don't have an account?"}

                    <button
                        type="button"
                        onClick={() => {

                            setIsSignUp(!isSignUp);

                            setError("");
                            setMessage("");

                        }}
                    >

                        {isSignUp
                            ? " Login"
                            : " Sign Up"}

                    </button>

                </div>

            </div>

        </section>

    );

}

export default Login;