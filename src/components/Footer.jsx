import "./Footer.css";

function Footer() {
  return (
    <footer className="footer film-strip-border">
      <div className="footer-content">
        <h3>
          🎬 CINI<span>HUB</span>
        </h3>

        <p className="footer-tagline">
          Your Ultimate Vintage Cinema & Movie Review Community
        </p>

        <div className="footer-marquee-line" aria-hidden="true">
          <span>★ SOUNDSTAGE ★ PROJECTION ROOM ★ FILM CRITIQUE ARCHIVE ★</span>
        </div>

        <p className="copyright">
          © 2026 CINIHUB. All Rights Reserved. • A CINIHUB Production
        </p>
      </div>
    </footer>
  );
}

export default Footer;