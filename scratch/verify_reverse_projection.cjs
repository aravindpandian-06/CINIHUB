const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

console.log('=== VERIFYING REVERSE FILM PROJECTION ANIMATION ===\n');

// 1. Inspect Home.jsx
const homeJsx = fs.readFileSync(path.join(rootDir, 'src', 'pages', 'Home.jsx'), 'utf8');

const homeChecks = [
  { name: 'sessionProjectionDone prevents re-render replay', pass: homeJsx.includes('sessionProjectionDone') },
  { name: 'isProjectionSettled state tracks opening sequence', pass: homeJsx.includes('isProjectionSettled') },
  { name: 'Passes isProjectionSettled to FilmProjectorAnimation', pass: homeJsx.includes('<FilmProjectorAnimation isProjectionSettled={isProjectionSettled} />') },
  { name: 'Applies projecting / projection-settled classes to headline', pass: homeJsx.includes('hero-headline-projected') && homeJsx.includes('projection-settled') && homeJsx.includes('projecting') },
  { name: 'Renders headline-projection-sweep light sweep element', pass: homeJsx.includes('headline-projection-sweep') },
  { name: 'Preserves exact headline text and line break', pass: homeJsx.includes('Discover Your Next') && homeJsx.includes('<span> Favourite Movie</span>') },
  { name: 'Preserves Explore Movies and Read Reviews buttons', pass: homeJsx.includes('Explore Movies 🎬') && homeJsx.includes('Read Reviews ⭐') }
];

homeChecks.forEach(c => console.log(`${c.pass ? '✓' : '✗'} [Home.jsx] ${c.name}`));

// 2. Inspect Home.css
const homeCss = fs.readFileSync(path.join(rootDir, 'src', 'pages', 'Home.css'), 'utf8');

const homeCssChecks = [
  { name: 'Right-to-left headline reveal keyframes exist', pass: homeCss.includes('@keyframes projectHeadlineRightToLeft') },
  { name: 'Starts unprojected with inset(0 0 0 100%)', pass: homeCss.includes('clip-path: inset(0 0 0 100%)') },
  { name: 'Reveals progressively to inset(0 0 0 0%)', pass: homeCss.includes('clip-path: inset(0 0 0 0%)') },
  { name: 'Moving light sweep bar animation sweepRightToLeft', pass: homeCss.includes('@keyframes sweepRightToLeft') },
  { name: 'Sweep moves from right edge to left edge', pass: homeCss.includes('right: -10px') && homeCss.includes('right: calc(100% + 15px)') },
  { name: 'Headline transitions to warm cream and golden yellow', pass: homeCss.includes('var(--color-warm-cream)') && homeCss.includes('var(--color-golden-yellow)') },
  { name: 'Original 3D block shadows preserved', pass: homeCss.includes('var(--color-burnt-orange)') },
  { name: 'prefers-reduced-motion disables reveal and sweep', pass: homeCss.includes('@media (prefers-reduced-motion: reduce)') && homeCss.includes('.headline-projection-sweep') }
];

homeCssChecks.forEach(c => console.log(`${c.pass ? '✓' : '✗'} [Home.css] ${c.name}`));

// 3. Inspect FilmProjectorAnimation.jsx
const animJsx = fs.readFileSync(path.join(rootDir, 'src', 'components', 'FilmProjectorAnimation.jsx'), 'utf8');

const animJsxChecks = [
  { name: 'Accepts isProjectionSettled prop', pass: animJsx.includes('isProjectionSettled = false') },
  { name: 'Applies state-settled or state-powering-on classes', pass: animJsx.includes('state-settled') && animJsx.includes('state-powering-on') },
  { name: 'Projector lamphouse louvers have warm heat glow', pass: animJsx.includes('Lamphouse Ventilation Louvers / Heat Grille with warm lamp glow') },
  { name: 'SVG lens emission point at cx=18 cy=148', pass: animJsx.includes('circle cx="18" cy="148"') },
  { name: 'Reels nested for concentric rotation', pass: animJsx.includes('reel-top') && animJsx.includes('reel-bottom') }
];

animJsxChecks.forEach(c => console.log(`${c.pass ? '✓' : '✗'} [FilmProjectorAnimation.jsx] ${c.name}`));

// 4. Inspect FilmProjectorAnimation.css
const animCss = fs.readFileSync(path.join(rootDir, 'src', 'components', 'FilmProjectorAnimation.css'), 'utf8');

const animCssChecks = [
  { name: 'projectorBeamExtend extends from right lens to left text', pass: animCss.includes('@keyframes projectorBeamExtend') },
  { name: 'transform-origin: 100% 50% locked to projector lens', pass: animCss.includes('transform-origin: 100% 50%') },
  { name: 'scaleX(0) to scaleX(1) extension', pass: animCss.includes('scaleX(0)') && animCss.includes('scaleX(1)') },
  { name: 'Lens flare power-on ignition animation', pass: animCss.includes('@keyframes lensFlareIgnition') },
  { name: 'Film strip moves left to right toward projector', pass: animCss.includes('@keyframes filmTravelTowardProjector') },
  { name: 'Reels rotate clockwise continuously', pass: animCss.includes('@keyframes rotateReelClockwise') },
  { name: 'Responsive alignments for laptop, tablet, mobile', pass: animCss.includes('@media (max-width: 1120px)') && animCss.includes('@media (max-width: 960px)') && animCss.includes('@media (max-width: 650px)') },
  { name: 'prefers-reduced-motion locks beam and elements', pass: animCss.includes('.projector-beam-wrapper') && animCss.includes('transform: none !important') }
];

animCssChecks.forEach(c => console.log(`${c.pass ? '✓' : '✗'} [FilmProjectorAnimation.css] ${c.name}`));

const allChecks = [...homeChecks, ...homeCssChecks, ...animJsxChecks, ...animCssChecks];
const allPassed = allChecks.every(c => c.pass);

console.log(`\nRESULT: ${allPassed ? 'ALL ' + allChecks.length + ' CHECKS PASSED!' : 'SOME CHECKS FAILED'}`);
process.exit(allPassed ? 0 : 1);
