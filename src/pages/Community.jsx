import "./Community.css";

function Community() {
  return (
    <section className="community-page">
      <div className="community-container">
        <div className="page-heading">
          <span className="section-badge">👥 CINIHUB FILM SOCIETY</span>
          <h1>Movie Lovers Together</h1>
          <p>
            Debate unforgettable scenes, swap rare gems, and celebrate cinematic storytelling.
          </p>
        </div>

        <div className="community-grid">
          <div className="community-card">
            <div className="community-icon" aria-hidden="true">
              💬
            </div>
            <h2>Discuss Movies</h2>
            <p>
              Talk about your favourite movies, characters, cinematography, and unforgettable dialogue.
            </p>
            <button type="button" className="community-btn">
              Join Discussion
            </button>
          </div>

          <div className="community-card">
            <div className="community-icon" aria-hidden="true">
              🎯
            </div>
            <h2>Share Recommendations</h2>
            <p>
              Recommend cult discoveries, hidden masterpieces, and crowd-pleasing midnight movies.
            </p>
            <button type="button" className="community-btn">
              Recommend Movie
            </button>
          </div>

          <div className="community-card">
            <div className="community-icon" aria-hidden="true">
              🏆
            </div>
            <h2>Community Picks</h2>
            <p>
              Explore top-ranked titles, marquee debates, and monthly cinephile awards.
            </p>
            <button type="button" className="community-btn">
              View Picks
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Community;