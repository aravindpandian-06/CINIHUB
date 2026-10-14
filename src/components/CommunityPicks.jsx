import { useState } from "react";
import TopRankedTitles from "./TopRankedTitles";
import MarqueeDebates from "./MarqueeDebates";
import MonthlyAwards from "./MonthlyAwards";
import "./CommunityPicks.css";

function CommunityPicks({ currentUser, onOpenDiscussion, onStartDiscussion, onShowToast }) {
  // Sub-section filter: 'all' | 'top_ranked' | 'marquee_debates' | 'monthly_awards'
  const [activeSection, setActiveSection] = useState("all");

  return (
    <div className="community-picks-container">
      {/* Sub-Navigation Strip */}
      <div className="picks-subnav-strip">
        <div className="picks-section-tabs">
          <button
            type="button"
            className={`picks-subnav-btn ${activeSection === "all" ? "active" : ""}`}
            onClick={() => setActiveSection("all")}
          >
            🌟 Full Showcase
          </button>
          <button
            type="button"
            className={`picks-subnav-btn ${activeSection === "top_ranked" ? "active" : ""}`}
            onClick={() => setActiveSection("top_ranked")}
          >
            ⭐ Top-Ranked Titles
          </button>
          <button
            type="button"
            className={`picks-subnav-btn ${activeSection === "marquee_debates" ? "active" : ""}`}
            onClick={() => setActiveSection("marquee_debates")}
          >
            🔥 Marquee Debates
          </button>
          <button
            type="button"
            className={`picks-subnav-btn ${activeSection === "monthly_awards" ? "active" : ""}`}
            onClick={() => setActiveSection("monthly_awards")}
          >
            🏆 Monthly Cinephile Awards
          </button>
        </div>

        <div className="picks-subnav-meta">
          <span>REAL COMMUNITY AUDIENCE DATA & ARCHIVES</span>
        </div>
      </div>

      {/* 1. TOP-RANKED TITLES */}
      {(activeSection === "all" || activeSection === "top_ranked") && (
        <section className="picks-feature-block">
          <TopRankedTitles onOpenDiscussion={onOpenDiscussion} />
        </section>
      )}

      {/* Decorative film perforation divider */}
      {activeSection === "all" && (
        <div className="picks-film-strip-divider" aria-hidden="true">
          <span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span>
        </div>
      )}

      {/* 2. MARQUEE DEBATES */}
      {(activeSection === "all" || activeSection === "marquee_debates") && (
        <section className="picks-feature-block">
          <MarqueeDebates
            onOpenDebate={onOpenDiscussion}
            onStartDebate={onStartDiscussion}
            currentUserId={currentUser?.id}
          />
        </section>
      )}

      {/* Decorative film perforation divider */}
      {activeSection === "all" && (
        <div className="picks-film-strip-divider" aria-hidden="true">
          <span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span>
        </div>
      )}

      {/* 3. MONTHLY CINEPHILE AWARDS */}
      {(activeSection === "all" || activeSection === "monthly_awards") && (
        <section className="picks-feature-block">
          <MonthlyAwards
            currentUser={currentUser}
            onShowToast={onShowToast}
          />
        </section>
      )}
    </div>
  );
}

export default CommunityPicks;
