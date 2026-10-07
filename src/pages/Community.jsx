import "./Community.css";

function Community() {

  return (
    <section className="community-page">

      <div className="community-container">

        <div className="page-heading">

          <span>👥 CINIHUB COMMUNITY</span>

          <h1>
            Movie Lovers Together
          </h1>

          <p>
            Share your thoughts, discover recommendations
            and connect with fellow movie fans.
          </p>

        </div>


        <div className="community-grid">

          <div className="community-card">

            <div className="community-icon">
              💬
            </div>

            <h2>
              Discuss Movies
            </h2>

            <p>
              Talk about your favourite movies,
              characters and unforgettable scenes.
            </p>

            <button>
              Join Discussion
            </button>

          </div>


          <div className="community-card">

            <div className="community-icon">
              🎯
            </div>

            <h2>
              Share Recommendations
            </h2>

            <p>
              Recommend great movies and help others
              find something worth watching.
            </p>

            <button>
              Recommend Movie
            </button>

          </div>


          <div className="community-card">

            <div className="community-icon">
              🏆
            </div>

            <h2>
              Community Picks
            </h2>

            <p>
              Discover movies that are trending among
              CINIHUB community members.
            </p>

            <button>
              View Picks
            </button>

          </div>

        </div>

      </div>

    </section>
  );
}

export default Community;