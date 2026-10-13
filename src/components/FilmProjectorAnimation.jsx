import "./FilmProjectorAnimation.css";

function FilmProjectorAnimation({ isProjectionSettled = false }) {
  return (
    <div
      className={`film-projector-container ${isProjectionSettled ? "state-settled" : "state-powering-on"}`}
      aria-hidden="true"
    >
      {/* 1. White Volumetric Projection Light Beam */}
      <div className="projector-beam-wrapper">
        <div className="projector-light-cone"></div>
        <div className="projector-beam-dust">
          <span className="dust-particle d1"></span>
          <span className="dust-particle d2"></span>
          <span className="dust-particle d3"></span>
          <span className="dust-particle d4"></span>
          <span className="dust-particle d5"></span>
          <span className="dust-particle d6"></span>
          <span className="dust-particle d7"></span>
        </div>
        <div className="lens-flare-glow"></div>
      </div>

      {/* 2. Long Moving Film Strip (Travels continuously toward the projector) */}
      <div className="moving-film-strip-track">
        <div className="film-strip-tape">
          {/* Repeated seamless film tape segment for continuous motion */}
          <div className="film-strip-content">
            {Array.from({ length: 32 }).map((_, index) => (
              <div key={index} className="film-frame">
                <div className="sprocket-row top-sprockets">
                  <span className="sprocket-hole"></span>
                  <span className="sprocket-hole"></span>
                </div>
                <div className="frame-window">
                  <span className="frame-mark">
                    {index % 4 === 0 ? "CINIHUB" : index % 4 === 2 ? "35MM" : `▶ ${24 + (index % 12)}`}
                  </span>
                </div>
                <div className="sprocket-row bottom-sprockets">
                  <span className="sprocket-hole"></span>
                  <span className="sprocket-hole"></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feeding curve that leads directly into the projector reels */}
        <div className="film-feed-curve">
          <svg viewBox="0 0 120 70" className="film-curve-svg" fill="none">
            <path
              d="M0,20 Q60,20 85,50 T110,65"
              stroke="#201a15"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <path
              d="M0,20 Q60,20 85,50 T110,65"
              stroke="#FFC247"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          </svg>
        </div>
      </div>

      {/* 3. Vintage Film Projector Illustration (SVG with animated rotating reels) */}
      <div className="vintage-projector-unit">
        <svg
          viewBox="0 0 240 290"
          className="projector-svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Metallic body gradient */}
            <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2c241c" />
              <stop offset="50%" stopColor="#1a1511" />
              <stop offset="100%" stopColor="#0f0c0a" />
            </linearGradient>

            {/* Vintage brass gradient */}
            <linearGradient id="brassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFE082" />
              <stop offset="45%" stopColor="#FFC247" />
              <stop offset="80%" stopColor="#C94700" />
              <stop offset="100%" stopColor="#8C3000" />
            </linearGradient>

            {/* Lens barrel gradient */}
            <linearGradient id="lensGrad" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#FFF5E9" />
              <stop offset="20%" stopColor="#FFC247" />
              <stop offset="70%" stopColor="#2c241c" />
              <stop offset="100%" stopColor="#171310" />
            </linearGradient>

            {/* Reel spokes template */}
            <g id="reelSpokes">
              <line x1="0" y1="-44" x2="0" y2="44" stroke="#FFC247" strokeWidth="2.5" />
              <line x1="-38" y1="-22" x2="38" y2="22" stroke="#FFC247" strokeWidth="2.5" />
              <line x1="-38" y1="22" x2="38" y2="-22" stroke="#FFC247" strokeWidth="2.5" />
              <circle cx="0" cy="0" r="30" stroke="#FFC247" strokeWidth="1.5" strokeDasharray="5 3" fill="none" />
              <circle cx="0" cy="0" r="14" fill="url(#brassGrad)" />
              <circle cx="0" cy="0" r="5" fill="#171310" />
            </g>
          </defs>

          {/* Projector Tripod Stand */}
          <g className="projector-stand">
            {/* Center column */}
            <rect x="122" y="195" width="14" height="60" rx="3" fill="#1f1814" stroke="#3d3027" strokeWidth="1.5" />
            <rect x="117" y="248" width="24" height="8" rx="2" fill="url(#brassGrad)" />
            {/* Tripod legs */}
            <line x1="122" y1="252" x2="80" y2="285" stroke="#1f1814" strokeWidth="5" strokeLinecap="round" />
            <line x1="136" y1="252" x2="178" y2="285" stroke="#1f1814" strokeWidth="5" strokeLinecap="round" />
            <line x1="129" y1="252" x2="129" y2="287" stroke="#1f1814" strokeWidth="4.5" strokeLinecap="round" />
            {/* Brass feet */}
            <circle cx="80" cy="285" r="4" fill="url(#brassGrad)" />
            <circle cx="178" cy="285" r="4" fill="url(#brassGrad)" />
            <circle cx="129" cy="287" r="3.5" fill="url(#brassGrad)" />
          </g>

          {/* Upper Reel Support Arm */}
          <path d="M125,120 L160,65" stroke="#2c241c" strokeWidth="9" strokeLinecap="round" />
          <path d="M125,120 L160,65" stroke="url(#brassGrad)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="125" cy="120" r="4" fill="url(#brassGrad)" />

          {/* Lower Reel Support Arm */}
          <path d="M125,175 L160,225" stroke="#2c241c" strokeWidth="9" strokeLinecap="round" />
          <path d="M125,175 L160,225" stroke="url(#brassGrad)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="125" cy="175" r="4" fill="url(#brassGrad)" />

          {/* Top Rotating Feed Reel */}
          <g transform="translate(160, 65)">
            <g className="projector-reel reel-top">
              {/* Outer brass rim */}
              <circle cx="0" cy="0" r="46" stroke="url(#brassGrad)" strokeWidth="3" fill="none" />
              {/* Coiled 35mm film spool */}
              <circle cx="0" cy="0" r="42" fill="#1c1612" stroke="#2e231c" strokeWidth="5" />
              {/* Spokes */}
              <use href="#reelSpokes" />
            </g>
          </g>

          {/* Bottom Rotating Take-Up Reel */}
          <g transform="translate(160, 225)">
            <g className="projector-reel reel-bottom">
              {/* Outer brass rim */}
              <circle cx="0" cy="0" r="46" stroke="url(#brassGrad)" strokeWidth="3" fill="none" />
              {/* Partially wound film spool */}
              <circle cx="0" cy="0" r="38" fill="#1c1612" stroke="#2e231c" strokeWidth="4" />
              {/* Spokes */}
              <use href="#reelSpokes" />
            </g>
          </g>

          {/* Main Lamphouse & Mechanism Body */}
          <g className="projector-main-body">
            {/* Cast Iron Housing */}
            <rect x="75" y="100" width="86" height="96" rx="8" fill="url(#bodyGrad)" stroke="#3d3027" strokeWidth="2" />

            {/* Lamphouse Ventilation Louvers / Heat Grille with warm lamp glow */}
            <rect x="118" y="112" width="34" height="3" rx="1.5" fill="#FFC247" opacity="0.65" />
            <rect x="118" y="119" width="34" height="3" rx="1.5" fill="#FFC247" opacity="0.55" />
            <rect x="118" y="126" width="34" height="3" rx="1.5" fill="#FF6B00" opacity="0.5" />
            <rect x="118" y="133" width="34" height="3" rx="1.5" fill="#C94700" opacity="0.4" />

            {/* Film Gate Housing & Transport Rollers */}
            <rect x="70" y="120" width="14" height="56" rx="3" fill="#14100d" stroke="#2e241c" strokeWidth="1.5" />
            <circle cx="77" cy="128" r="4" fill="url(#brassGrad)" />
            <circle cx="77" cy="168" r="4" fill="url(#brassGrad)" />

            {/* Brass Vintage Nameplate */}
            <rect x="86" y="146" width="46" height="15" rx="2" fill="url(#brassGrad)" stroke="#8C3000" strokeWidth="0.8" />
            <text x="109" y="157" fill="#171310" fontSize="7" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="0.8">
              CINIHUB 35
            </text>

            {/* Speed Control Dial / Switch */}
            <circle cx="140" cy="168" r="7" fill="#14100d" stroke="url(#brassGrad)" strokeWidth="1.2" />
            <line x1="140" y1="168" x2="144" y2="164" stroke="#FFE082" strokeWidth="1.5" strokeLinecap="round" />

            {/* Rivets */}
            <circle cx="82" cy="107" r="1.5" fill="#5c493c" />
            <circle cx="154" cy="107" r="1.5" fill="#5c493c" />
            <circle cx="82" cy="189" r="1.5" fill="#5c493c" />
            <circle cx="154" cy="189" r="1.5" fill="#5c493c" />
          </g>

          {/* Projector Lens Barrel (Aimed Leftward Toward Headline) */}
          <g className="projector-lens-assembly">
            {/* Primary lens housing */}
            <rect x="36" y="132" width="36" height="32" rx="3" fill="url(#lensGrad)" stroke="#FFC247" strokeWidth="1.5" />
            {/* Brass focus adjustment ring */}
            <rect x="48" y="129" width="10" height="38" rx="2" fill="url(#brassGrad)" />
            {/* Front lens barrel collar */}
            <rect x="22" y="127" width="15" height="42" rx="2" fill="#1a1511" stroke="#FFC247" strokeWidth="1.5" />
            {/* Glass objective lens element */}
            <ellipse cx="22" cy="148" rx="4" ry="19" fill="#FFFFFF" opacity="0.9" />
            <ellipse cx="24" cy="148" rx="2" ry="14" fill="#FFE082" opacity="0.85" />
            {/* Optical beam emission point */}
            <circle cx="18" cy="148" r="4" fill="#FFFFFF" opacity="0.95" />
          </g>

          {/* Threaded Film Loop Passing through mechanism */}
          <path
            d="M160,111 C130,111 90,105 77,125 L77,170 C90,190 130,185 160,180"
            fill="none"
            stroke="#3a2e24"
            strokeWidth="3.5"
            strokeDasharray="2 1"
          />
        </svg>
      </div>
    </div>
  );
}

export default FilmProjectorAnimation;
