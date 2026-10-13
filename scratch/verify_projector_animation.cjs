const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

console.log('--- Verifying Film Projector Animation Implementation ---');

// 1. Verify FilmProjectorAnimation.jsx
const animJsxPath = path.join(rootDir, 'src', 'components', 'FilmProjectorAnimation.jsx');
if (!fs.existsSync(animJsxPath)) {
  console.error('FAIL: FilmProjectorAnimation.jsx does not exist!');
  process.exit(1);
}
const animJsx = fs.readFileSync(animJsxPath, 'utf8');

const jsxChecks = [
  { desc: 'Imports FilmProjectorAnimation.css', check: animJsx.includes('./FilmProjectorAnimation.css') },
  { desc: 'Contains film-projector-container', check: animJsx.includes('film-projector-container') },
  { desc: 'Contains projector-beam-wrapper', check: animJsx.includes('projector-beam-wrapper') },
  { desc: 'Contains projector-light-cone', check: animJsx.includes('projector-light-cone') },
  { desc: 'Contains lens-flare-glow', check: animJsx.includes('lens-flare-glow') },
  { desc: 'Contains dust particles', check: animJsx.includes('dust-particle') },
  { desc: 'Contains moving-film-strip-track', check: animJsx.includes('moving-film-strip-track') },
  { desc: 'Contains film-frame with sprockets', check: animJsx.includes('sprocket-row') && animJsx.includes('sprocket-hole') },
  { desc: 'Contains film feed curve', check: animJsx.includes('film-feed-curve') },
  { desc: 'Contains vintage-projector-unit', check: animJsx.includes('vintage-projector-unit') },
  { desc: 'Contains rotating top reel', check: animJsx.includes('reel-top') },
  { desc: 'Contains rotating bottom reel', check: animJsx.includes('reel-bottom') },
  { desc: 'Contains CINIHUB 35 brass badge', check: animJsx.includes('CINIHUB 35') },
  { desc: 'Aria hidden for decorative animation', check: animJsx.includes('aria-hidden="true"') },
];

jsxChecks.forEach(({ desc, check }) => {
  if (check) {
    console.log(`[PASS] JSX: ${desc}`);
  } else {
    console.error(`[FAIL] JSX: ${desc}`);
    process.exit(1);
  }
});

// 2. Verify FilmProjectorAnimation.css
const animCssPath = path.join(rootDir, 'src', 'components', 'FilmProjectorAnimation.css');
if (!fs.existsSync(animCssPath)) {
  console.error('FAIL: FilmProjectorAnimation.css does not exist!');
  process.exit(1);
}
const animCss = fs.readFileSync(animCssPath, 'utf8');

const cssChecks = [
  { desc: 'pointer-events: none on container', check: animCss.includes('pointer-events: none') },
  { desc: 'rotateReelClockwise keyframes', check: animCss.includes('@keyframes rotateReelClockwise') },
  { desc: 'Continuous reel top and bottom animations', check: animCss.includes('rotateReelClockwise 3.6s') && animCss.includes('rotateReelClockwise 4.8s') },
  { desc: 'White projection beam styling', check: animCss.includes('projector-light-cone') && animCss.includes('clip-path') },
  { desc: 'Projector beam flicker keyframes', check: animCss.includes('@keyframes projectorBeamFlicker') },
  { desc: 'Dust floating animation', check: animCss.includes('@keyframes floatDust') },
  { desc: 'Moving film strip animation towards projector', check: animCss.includes('@keyframes filmTravelTowardProjector') && animCss.includes('translateX(0px)') },
  { desc: 'Sprocket holes styling', check: animCss.includes('.sprocket-hole') },
  { desc: 'Celluloid frame window styling', check: animCss.includes('.frame-window') },
  { desc: 'Responsive media query (1120px)', check: animCss.includes('@media (max-width: 1120px)') },
  { desc: 'Responsive media query tablet (960px)', check: animCss.includes('@media (max-width: 960px)') },
  { desc: 'Responsive media query mobile (650px)', check: animCss.includes('@media (max-width: 650px)') },
  { desc: 'prefers-reduced-motion support', check: animCss.includes('@media (prefers-reduced-motion: reduce)') },
];

cssChecks.forEach(({ desc, check }) => {
  if (check) {
    console.log(`[PASS] CSS: ${desc}`);
  } else {
    console.error(`[FAIL] CSS: ${desc}`);
    process.exit(1);
  }
});

// 3. Verify Home.jsx integration
const homeJsxPath = path.join(rootDir, 'src', 'pages', 'Home.jsx');
const homeJsx = fs.readFileSync(homeJsxPath, 'utf8');

const homeChecks = [
  { desc: 'Imports FilmProjectorAnimation', check: homeJsx.includes('import FilmProjectorAnimation from "../components/FilmProjectorAnimation"') },
  { desc: 'Renders FilmProjectorAnimation', check: homeJsx.includes('<FilmProjectorAnimation />') },
  { desc: 'Preserves Discover Your Next Favourite Movie heading', check: homeJsx.includes('Discover Your Next') && homeJsx.includes('Favourite Movie') },
  { desc: 'Preserves Explore Movies button', check: homeJsx.includes('Explore Movies 🎬') },
  { desc: 'Preserves Read Reviews button', check: homeJsx.includes('Read Reviews ⭐') },
];

homeChecks.forEach(({ desc, check }) => {
  if (check) {
    console.log(`[PASS] Home.jsx: ${desc}`);
  } else {
    console.error(`[FAIL] Home.jsx: ${desc}`);
    process.exit(1);
  }
});

// 4. Verify Home.css integration
const homeCssPath = path.join(rootDir, 'src', 'pages', 'Home.css');
const homeCss = fs.readFileSync(homeCssPath, 'utf8');

const homeCssChecks = [
  { desc: 'hero-text has position: relative', check: homeCss.includes('.hero-text') && homeCss.includes('position: relative') },
  { desc: 'hero-text h1 has z-index: 3', check: homeCss.includes('.hero-text h1') && homeCss.includes('z-index: 3') },
  { desc: 'hero-buttons has z-index: 5', check: homeCss.includes('.hero-buttons') && homeCss.includes('z-index: 5') },
];

homeCssChecks.forEach(({ desc, check }) => {
  if (check) {
    console.log(`[PASS] Home.css: ${desc}`);
  } else {
    console.error(`[FAIL] Home.css: ${desc}`);
    process.exit(1);
  }
});

console.log('\n--- ALL VERIFICATIONS PASSED SUCCESSFULLY! ---');
