import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  fetchCommunityAwards,
  toggleAwardVote,
  AWARD_PERIODS
} from "../services/communityPicks";
import "./MonthlyAwards.css";

const FALLBACK_POSTER = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80";

function MonthlyAwards({ currentUser, onShowToast }) {
  const [selectedPeriod, setSelectedPeriod] = useState(AWARD_PERIODS[0]);
  const [awards, setAwards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [votingId, setVotingId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadAwards() {
      setLoading(true);
      setError("");
      try {
        const data = await fetchCommunityAwards({
          month: selectedPeriod.month,
          year: selectedPeriod.year,
          currentUserId: currentUser?.id
        });
        if (isMounted) setAwards(data);
      } catch (err) {
        console.warn("Error loading awards:", err);
        if (isMounted) setError("Unable to retrieve monthly awards at this time.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadAwards();
    return () => {
      isMounted = false;
    };
  }, [selectedPeriod, currentUser?.id]);

  const handleVote = async (award) => {
    if (!currentUser) {
      if (onShowToast) onShowToast("Please sign in to vote for Community Awards.");
      return;
    }

    if (votingId || !award.is_active) return;
    setVotingId(award.id);

    try {
      const res = await toggleAwardVote({
        awardId: award.id,
        user: currentUser
      });

      setAwards((prev) =>
        prev.map((a) => {
          if (a.id === award.id) {
            return {
              ...a,
              user_has_voted: res.voted,
              votes_count: res.votesCount
            };
          }
          return a;
        })
      );

      if (onShowToast) {
        onShowToast(
          res.voted
            ? `🏆 Your vote has been recorded for ${award.title}!`
            : `Vote removed for ${award.title}.`
        );
      }
    } catch (err) {
      if (onShowToast) onShowToast(err.message || "Failed to submit award vote.");
    } finally {
      setVotingId(null);
    }
  };

  const movieAwards = awards.filter((a) => a.recipient_type === "movie");
  const communityAwards = awards.filter((a) => a.recipient_type !== "movie");

  return (
    <div className="monthly-awards-section">
      {/* Banner */}
      <div className="picks-subhead-banner">
        <div className="subhead-text-group">
          <span className="picks-kicker">🏆 THE CINIHUB ACADEMY ★ MONTHLY HONORS</span>
          <h2>Monthly Cinephile Awards</h2>
          <p>
            Celebrating outstanding films and distinguished community critics. Voted by society members and verified archives.
          </p>
        </div>

        {/* Period Selector */}
        <div className="period-selector-box">
          <label htmlFor="award-period-select">Select Period:</label>
          <select
            id="award-period-select"
            value={`${selectedPeriod.month}-${selectedPeriod.year}`}
            onChange={(e) => {
              const [m, y] = e.target.value.split("-");
              const p = AWARD_PERIODS.find((item) => item.month === m && item.year === Number(y));
              if (p) setSelectedPeriod(p);
            }}
            className="vintage-select-period"
          >
            {AWARD_PERIODS.map((p) => (
              <option key={`${p.month}-${p.year}`} value={`${p.month}-${p.year}`}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Period Status Notice */}
      <div className="period-status-banner">
        {selectedPeriod.isActive ? (
          <div className="active-voting-callout">
            <span className="ballot-box-icon">🗳️</span>
            <div>
              <strong>OCTOBER 2026 MEMBER BALLOT IS OPEN:</strong> Authenticated cinephiles can cast one vote per category. Winners will be permanently sealed into the archive at the end of the month.
            </div>
          </div>
        ) : (
          <div className="archived-winners-callout">
            <span className="laurel-icon">📜</span>
            <div>
              <strong>OFFICIAL ARCHIVE RECORDS:</strong> Displaying sealed winners and certified community vote totals for {selectedPeriod.month} {selectedPeriod.year}.
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="feed-status-box">
          <span className="spinner-text">CERTIFYING AWARDS & TALLYING COMMUNITY BALLOTS...</span>
        </div>
      ) : error ? (
        <div className="feed-status-box error-box">
          <p>{error}</p>
        </div>
      ) : awards.length === 0 ? (
        <div className="empty-feed-card">
          <div className="empty-icon">🏆</div>
          <h3>NOT ENOUGH COMMUNITY DATA YET</h3>
          <p>
            No certified awards recorded for {selectedPeriod.month} {selectedPeriod.year}. Active reviews and community recommendations will determine the upcoming nominees!
          </p>
        </div>
      ) : (
        <div className="awards-layout-grid">
          {/* SECTION 1: MOVIE AWARDS */}
          <div className="awards-category-cluster">
            <div className="cluster-header">
              <span className="cluster-icon">🎬</span>
              <h3>Celluloid & Directorial Honors</h3>
              <span className="cluster-tag">FEATURE FILMS</span>
            </div>

            <div className="awards-card-grid">
              {movieAwards.map((award) => (
                <article key={award.id} className="cinephile-award-card">
                  <div className="award-header-strip">
                    <span className="award-category-title">{award.category}</span>
                    <span className={`award-type-badge ${award.award_type}`}>
                      {award.award_type === "community_voted" ? "🏆 COMMUNITY VOTED" : "✨ EDITORIAL JURY"}
                    </span>
                  </div>

                  <div className="award-recipient-row">
                    <div className="award-poster-box">
                      <img
                        src={award.movie_poster || FALLBACK_POSTER}
                        alt={award.title}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = FALLBACK_POSTER;
                        }}
                      />
                      <span className="award-year-tag">{award.movie_year || "Cinema"}</span>
                    </div>

                    <div className="award-details-main">
                      <h4 className="award-film-heading">{award.title}</h4>

                      {award.movie_id && (
                        <Link
                          to={`/movies/${award.movie_id}`}
                          className="award-movie-link"
                        >
                          View Feature Dossier →
                        </Link>
                      )}

                      <div className="award-criteria-box">
                        <span className="criteria-label">SELECTION CRITERIA:</span>
                        <p>{award.criteria}</p>
                      </div>

                      {award.reason && (
                        <p className="award-citation-text">
                          “{award.reason}”
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Voting / Action Footer */}
                  <div className="award-footer-row">
                    <div className="award-votes-tally">
                      <span className="votes-count-number">{award.votes_count}</span>
                      <span className="votes-label">
                        {selectedPeriod.isActive ? "Votes Cast" : "Certified Votes"}
                      </span>
                    </div>

                    {selectedPeriod.isActive && (
                      <button
                        type="button"
                        className={`award-vote-btn ${award.user_has_voted ? "voted" : ""}`}
                        onClick={() => handleVote(award)}
                        disabled={votingId === award.id}
                      >
                        {award.user_has_voted ? "✓ Voted (Recorded)" : "🗳️ Cast Your Vote"}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* SECTION 2: COMMUNITY SOCIETY AWARDS */}
          <div className="awards-category-cluster">
            <div className="cluster-header">
              <span className="cluster-icon">👥</span>
              <h3>Cinema Society Participation Honors</h3>
              <span className="cluster-tag">MEMBERS & DISPATCHES</span>
            </div>

            <div className="awards-card-grid">
              {communityAwards.map((award) => (
                <article key={award.id} className="cinephile-award-card community-member-award">
                  <div className="award-header-strip">
                    <span className="award-category-title">{award.category}</span>
                    <span className={`award-type-badge ${award.award_type}`}>
                      {award.award_type === "community_voted" ? "🏆 COMMUNITY VOTED" : "✨ EDITORIAL JURY"}
                    </span>
                  </div>

                  <div className="award-recipient-row">
                    <div className="award-avatar-box">
                      {award.user_avatar ? (
                        <img src={award.user_avatar} alt={award.user_name || "Recipient"} />
                      ) : (
                        <span>{(award.user_name || "C").charAt(0).toUpperCase()}</span>
                      )}
                    </div>

                    <div className="award-details-main">
                      <h4 className="award-film-heading">{award.title}</h4>
                      <span className="recipient-label">Distinguished Film Society Member</span>

                      <div className="award-criteria-box">
                        <span className="criteria-label">SELECTION CRITERIA:</span>
                        <p>{award.criteria}</p>
                      </div>

                      {award.reason && (
                        <p className="award-citation-text">
                          “{award.reason}”
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="award-footer-row">
                    <div className="award-votes-tally">
                      <span className="votes-count-number">{award.votes_count}</span>
                      <span className="votes-label">
                        {selectedPeriod.isActive ? "Votes Cast" : "Certified Votes"}
                      </span>
                    </div>

                    {selectedPeriod.isActive && (
                      <button
                        type="button"
                        className={`award-vote-btn ${award.user_has_voted ? "voted" : ""}`}
                        onClick={() => handleVote(award)}
                        disabled={votingId === award.id}
                      >
                        {award.user_has_voted ? "✓ Voted (Recorded)" : "🗳️ Cast Your Vote"}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MonthlyAwards;
