
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Intro.css";

function Intro() {
  const navigate = useNavigate();

  useEffect(() => {
    // Play the intro only once per browser tab session
    const introPlayed = sessionStorage.getItem("cinihubIntroPlayed");

    if (introPlayed === "true") {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  const goToHome = () => {
    sessionStorage.setItem("cinihubIntroPlayed", "true");
    navigate("/home", { replace: true });
  };

  const handleVideoStart = () => {
    sessionStorage.setItem("cinihubIntroPlayed", "true");
  };

  return (
    <div className="intro-container">
      <video
        className="intro-video"
        autoPlay
        muted
        playsInline
        preload="auto"
        onPlay={handleVideoStart}
        onEnded={goToHome}
        onError={() => {
          // If the video cannot load, allow the user to continue
          console.error("CINIHUB intro video could not be loaded.");
        }}
      >
        <source
          src="/videos/cinihub-intro.mp4"
          type="video/mp4"
        />
        Your browser does not support video playback.
      </video>

      <button
        type="button"
        className="skip-intro"
        onClick={goToHome}
      >
        Skip Intro →
      </button>
    </div>
  );
}

export default Intro;
