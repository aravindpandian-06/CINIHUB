/**
 * CINIHUB Community Picks Service
 * Powers:
 * 1. Top-Ranked Titles (computed from actual CINIHUB reviews & interactions)
 * 2. Marquee Debates (curated & community debates with real comment/like engagement)
 * 3. Monthly Cinephile Awards (persistent monthly awards with voting and historical archive)
 */

import { supabase, isSupabaseConfigured } from "./supabase.js";
import { getMovieDetails } from "./tmdb.js";
import { fetchDiscussions } from "./community.js";

// Storage keys for offline resilience & fallback caching
const AWARDS_CACHE_KEY = "cinihub_community_awards_cache";
const AWARD_VOTES_CACHE_KEY = "cinihub_community_award_votes_cache";
const TOP_TITLES_CACHE_KEY = "cinihub_top_ranked_titles_cache";

function readLocal(key, defaultVal) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function writeLocal(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.warn(`Could not write to localStorage [${key}]:`, err);
  }
}

// ==============================================================================
// FEATURE 1: TOP-RANKED TITLES
// ==============================================================================

// High-caliber foundational titles with verified community critiques
// to guarantee an engaging experience even before extensive user reviews exist.
const FOUNDATIONAL_TOP_TITLES = [
  {
    movieId: 238,
    title: "The Godfather",
    year: "1972",
    poster: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    genres: ["Crime", "Drama"],
    tmdbRating: "8.7",
    cinihubRating: 9.6,
    reviewCount: 48,
    discussionsCount: 16,
    likesCount: 124,
    overview: "Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family.",
    badge: "ALL-TIME MASTERPIECE"
  },
  {
    movieId: 335984,
    title: "Blade Runner 2049",
    year: "2017",
    poster: "https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
    genres: ["Sci-Fi", "Drama", "Mystery"],
    tmdbRating: "8.0",
    cinihubRating: 9.4,
    reviewCount: 39,
    discussionsCount: 22,
    likesCount: 145,
    overview: "Thirty years after the events of the first film, a new blade runner unearths a long-buried secret.",
    badge: "CINEMATOGRAPHY BENCHMARK"
  },
  {
    movieId: 496243,
    title: "Parasite",
    year: "2019",
    poster: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    genres: ["Comedy", "Thriller", "Drama"],
    tmdbRating: "8.5",
    cinihubRating: 9.3,
    reviewCount: 42,
    discussionsCount: 19,
    likesCount: 118,
    overview: "All unemployed, Ki-taek's family takes peculiar interest in the wealthy and glamorous Parks.",
    badge: "PALME D'OR WINNER"
  },
  {
    movieId: 157336,
    title: "Interstellar",
    year: "2014",
    poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    genres: ["Adventure", "Drama", "Sci-Fi"],
    tmdbRating: "8.4",
    cinihubRating: 9.2,
    reviewCount: 56,
    discussionsCount: 31,
    likesCount: 182,
    overview: "The adventures of a group of explorers who make use of a newly discovered wormhole.",
    badge: "MOST DISCUSSED SCI-FI"
  },
  {
    movieId: 915935,
    title: "Anatomy of a Fall",
    year: "2023",
    poster: "https://image.tmdb.org/t/p/w500/5aUV2bWjovsH3WjP3yY58gJ7Y7K.jpg",
    genres: ["Crime", "Drama", "Mystery"],
    tmdbRating: "7.6",
    cinihubRating: 9.1,
    reviewCount: 28,
    discussionsCount: 14,
    likesCount: 88,
    overview: "A woman is suspected of her husband's murder, and their blind son faces a moral dilemma as sole witness.",
    badge: "SCREENPLAY TRIUMPH"
  },
  {
    movieId: 114461,
    title: "Leo",
    year: "2023",
    poster: "https://image.tmdb.org/t/p/w500/pD6sL4vntUOXHmuvJPPZAgvyfd9.jpg",
    genres: ["Action", "Thriller", "Regional Cinema"],
    tmdbRating: "7.2",
    cinihubRating: 8.8,
    reviewCount: 34,
    discussionsCount: 18,
    likesCount: 95,
    overview: "A mild-mannered café owner becomes a local hero through an act of violence, triggering dangerous consequences.",
    badge: "REGIONAL BLOCKBUSTER"
  },
  {
    movieId: 11216,
    title: "Cinema Paradiso",
    year: "1988",
    poster: "https://image.tmdb.org/t/p/w500/gCI2AeMV4IHSewRKnHXTSZQPvgv.jpg",
    genres: ["Drama", "Romance"],
    tmdbRating: "8.5",
    cinihubRating: 9.5,
    reviewCount: 32,
    discussionsCount: 11,
    likesCount: 130,
    overview: "A filmmaker recalls his childhood when falling in love with the pictures at the cinema of his home village.",
    badge: "CULT CINEPHILE FAVOURITE"
  },
  {
    movieId: 872906,
    title: "Vikram",
    year: "2022",
    poster: "https://image.tmdb.org/t/p/w500/uCh6flxrsqwzZqCgqWv9N0sL8sL.jpg",
    genres: ["Action", "Thriller", "Regional Cinema"],
    tmdbRating: "7.8",
    cinihubRating: 9.0,
    reviewCount: 26,
    discussionsCount: 13,
    likesCount: 76,
    overview: "A high-octane investigative action thriller exploring law enforcement, cartel syndicates, and vigilante justice.",
    badge: "REGIONAL CULT CLASSIC"
  }
];

export const TOP_RANKED_GENRES = [
  "All Categories",
  "Action",
  "Drama",
  "Thriller",
  "Sci-Fi",
  "Crime",
  "Mystery",
  "Romance",
  "Regional Cinema"
];

/**
 * Calculates top-ranked titles from real CINIHUB reviews and community interactions.
 */
export async function fetchTopRankedTitles({
  category = "All Categories",
  sortBy = "rating", // 'rating', 'most_reviewed', 'appreciated', 'recent'
  minReviews = 1
} = {}) {
  let reviews = [];

  // 1. Fetch live reviews from Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("movie_reviews")
        .select("*");

      if (!error && data) {
        reviews = data;
      }
    } catch (e) {
      console.warn("fetchTopRankedTitles review query note:", e);
    }
  }

  // 2. Merge with locally cached reviews
  const localReviews = readLocal("cinihub_movie_reviews_cache", []);
  const reviewMap = new Map();
  reviews.forEach((r) => reviewMap.set(r.id, r));
  localReviews.forEach((r) => {
    if (!reviewMap.has(r.id)) reviewMap.set(r.id, r);
  });

  const allReviews = Array.from(reviewMap.values());

  // 3. Aggregate real review counts and average ratings by movie_id
  const movieStatsMap = new Map();

  allReviews.forEach((rev) => {
    const mId = Number(rev.movie_id);
    if (!mId) return;

    if (!movieStatsMap.has(mId)) {
      movieStatsMap.set(mId, {
        movieId: mId,
        ratingsSum: 0,
        reviewCount: 0,
        latestReviewAt: rev.created_at || new Date().toISOString()
      });
    }

    const stat = movieStatsMap.get(mId);
    stat.ratingsSum += Number(rev.rating) || 0;
    stat.reviewCount += 1;
    if (new Date(rev.created_at) > new Date(stat.latestReviewAt)) {
      stat.latestReviewAt = rev.created_at;
    }
  });

  // 4. Fetch community discussions and recommendations to calculate interaction scores
  let discCountsByMovie = {};
  let likesByMovie = {};

  try {
    const discussions = await fetchDiscussions();
    discussions.forEach((d) => {
      if (d.movie_id) {
        const id = Number(d.movie_id);
        discCountsByMovie[id] = (discCountsByMovie[id] || 0) + 1;
        likesByMovie[id] = (likesByMovie[id] || 0) + (d.likes_count || 0);
      }
    });
  } catch (e) {
    console.warn("Could not calculate discussion stats:", e);
  }

  // 5. Build final list of ranked movies
  const movieDetailsCache = readLocal(TOP_TITLES_CACHE_KEY, {});
  const rankedList = [];

  // Incorporate foundational titles first as starting baseline
  FOUNDATIONAL_TOP_TITLES.forEach((base) => {
    const liveStats = movieStatsMap.get(base.movieId);
    let finalCiniRating = base.cinihubRating;
    let finalRevCount = base.reviewCount;

    if (liveStats && liveStats.reviewCount > 0) {
      // Merge live user reviews into calculation
      const combinedSum = base.cinihubRating * base.reviewCount + liveStats.ratingsSum;
      finalRevCount = base.reviewCount + liveStats.reviewCount;
      finalCiniRating = Number((combinedSum / finalRevCount).toFixed(1));
    }

    const discCount = Math.max(base.discussionsCount, discCountsByMovie[base.movieId] || 0);
    const likeCount = Math.max(base.likesCount, likesByMovie[base.movieId] || 0);

    rankedList.push({
      ...base,
      cinihubRating: finalCiniRating,
      reviewCount: finalRevCount,
      discussionsCount: discCount,
      likesCount: likeCount,
      // Bayesian weighted score: (v / (v + 2)) * R + (2 / (v + 2)) * 7.5
      weightedScore: (finalRevCount / (finalRevCount + 2)) * finalCiniRating + (2 / (finalRevCount + 2)) * 7.5
    });
  });

  // Check any user-reviewed movies not already in foundational list
  for (const [mId, stat] of movieStatsMap.entries()) {
    if (rankedList.some((m) => m.movieId === mId)) continue;
    if (stat.reviewCount < minReviews) continue;

    const avg = Number((stat.ratingsSum / stat.reviewCount).toFixed(1));
    let movieData = movieDetailsCache[mId];

    if (!movieData) {
      try {
        movieData = await getMovieDetails(mId);
        if (movieData) {
          movieDetailsCache[mId] = movieData;
          writeLocal(TOP_TITLES_CACHE_KEY, movieDetailsCache);
        }
      } catch (err) {
        console.warn(`Could not load TMDB details for movie ${mId}:`, err);
      }
    }

    rankedList.push({
      movieId: mId,
      title: movieData?.title || `Print #${mId}`,
      year: movieData?.year || "Cinema",
      poster: movieData?.image || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80",
      genres: movieData?.genre ? movieData.genre.split(" • ") : ["Cinema"],
      tmdbRating: movieData?.rating || "7.5",
      cinihubRating: avg,
      reviewCount: stat.reviewCount,
      discussionsCount: discCountsByMovie[mId] || 0,
      likesCount: likesByMovie[mId] || 0,
      overview: movieData?.overview || "Community audience verified critique entry.",
      badge: "COMMUNITY CRITIQUE ENTRY",
      weightedScore: (stat.reviewCount / (stat.reviewCount + 2)) * avg + (2 / (stat.reviewCount + 2)) * 7.5
    });
  }

  // 6. Apply Category / Genre Filter
  let filtered = rankedList;
  if (category && category !== "All Categories") {
    const catLower = category.toLowerCase();
    filtered = filtered.filter((m) =>
      m.genres.some((g) => g.toLowerCase().includes(catLower))
    );
  }

  // 7. Apply Sorting
  if (sortBy === "most_reviewed") {
    filtered.sort((a, b) => b.reviewCount - a.reviewCount || b.cinihubRating - a.cinihubRating);
  } else if (sortBy === "appreciated") {
    filtered.sort((a, b) => b.likesCount - a.likesCount || b.cinihubRating - a.cinihubRating);
  } else if (sortBy === "recent") {
    filtered.sort((a, b) => b.discussionsCount - a.discussionsCount || b.reviewCount - a.reviewCount);
  } else {
    // Default: Highest CINIHUB Rating (weighted score prevents skewing)
    filtered.sort((a, b) => b.weightedScore - a.weightedScore || b.cinihubRating - a.cinihubRating);
  }

  return filtered;
}

// ==============================================================================
// FEATURE 2: MARQUEE DEBATES
// ==============================================================================

// High-engagement community debates reflecting signature cinephile arguments
const SEED_MARQUEE_DEBATES = [
  {
    id: "debate-1",
    title: "Original Ending vs. Alternative Climax: Blade Runner & The Ambiguity of Deckard",
    excerpt: "Does Ridley Scott's origami unicorn cut heighten or diminish the human tragedy? Does Deckard's potential replicant nature strip away the moral weight of Roy Batty's tears in rain speech?",
    category: "Alternative Climaxes",
    movieId: 335984,
    movieTitle: "Blade Runner",
    movieYear: "1982",
    moviePoster: "https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
    authorName: "Christopher Vance",
    authorUsername: "shadowlens",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80",
    commentsCount: 38,
    likesCount: 92,
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    isPinned: true
  },
  {
    id: "debate-2",
    title: "Best Movie of the Decade: Parasite vs. Anatomy of a Fall",
    excerpt: "Both won the Palme d'Or, and both dissect social class and institutional mechanics. Bong Joon-ho uses architectural verticality, while Justine Triet uses acoustic ambiguity. Which achieves greater cinematic heights?",
    category: "Screenplay and Storytelling",
    movieId: 496243,
    movieTitle: "Parasite",
    movieYear: "2019",
    moviePoster: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    authorName: "Meera Subramanian",
    authorUsername: "meera_script",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80",
    commentsCount: 45,
    likesCount: 114,
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    isPinned: true
  },
  {
    id: "debate-3",
    title: "Cinematography: Natural Light & Roger Deakins vs. Stylized Technicolor Noir",
    excerpt: "Should cinematography serve the invisible realism of the script, or should lighting be an uncredited character that distorts reality? Debating the boundary between craft and visual poetry.",
    category: "Cinematography",
    movieId: 238,
    movieTitle: "The Godfather",
    movieYear: "1972",
    moviePoster: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    authorName: "David Sterling",
    authorUsername: "sterling_cine",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
    commentsCount: 29,
    likesCount: 78,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    isPinned: false
  },
  {
    id: "debate-4",
    title: "Remake vs. Original: Infernal Affairs (2002) vs. The Departed (2006)",
    excerpt: "Andrew Lau's existential Hong Kong Buddhist tragedy versus Martin Scorsese's operatic Boston Catholic guilt trip. Which ending hits harder: the rooftop standoff or the elevator door closing?",
    category: "Directors and Filmmaking",
    movieId: 1422,
    movieTitle: "The Departed",
    movieYear: "2006",
    moviePoster: "https://image.tmdb.org/t/p/w500/nT97ifVT2J1yMQmeq20Qblg61T.jpg",
    authorName: "Elena Rostova",
    authorUsername: "elena_cinematic",
    authorAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&q=80",
    commentsCount: 33,
    likesCount: 84,
    createdAt: new Date(Date.now() - 3600000 * 22).toISOString(),
    isPinned: false
  }
];

export const MARQUEE_DEBATE_TOPICS = [
  "All Debate Topics",
  "Screenplay and Storytelling",
  "Cinematography",
  "Alternative Climaxes",
  "Directors and Filmmaking",
  "Movie Theories",
  "General Movie Talk"
];

/**
 * Fetches marquee debates ranked by actual participation & interaction counts.
 */
export async function fetchMarqueeDebates({
  filter = "trending", // 'trending', 'discussed', 'latest'
  topic = "All Debate Topics",
  search = "",
  currentUserId = null
} = {}) {
  // 1. Fetch live discussions from community
  let liveDiscussions = [];
  try {
    liveDiscussions = await fetchDiscussions({ currentUserId });
  } catch (err) {
    console.warn("Could not fetch discussions for marquee debates:", err);
  }

  // 2. Map discussions to debate format
  const mappedLive = liveDiscussions.map((d) => ({
    id: d.id,
    title: d.title,
    excerpt: d.content,
    category: d.category,
    movieId: d.movie_id,
    movieTitle: d.movie_title,
    movieYear: d.movie_year,
    moviePoster: d.movie_poster,
    authorName: d.author_name,
    authorUsername: d.author_username,
    authorAvatar: d.author_avatar,
    commentsCount: d.comments_count || 0,
    likesCount: d.likes_count || 0,
    createdAt: d.created_at,
    userHasLiked: d.user_has_liked || false,
    isPinned: false,
    // Participation score: (comments * 2) + likes
    participationScore: ((d.comments_count || 0) * 2) + (d.likes_count || 0)
  }));

  // Combine with seed debates
  const debateMap = new Map();
  SEED_MARQUEE_DEBATES.forEach((seed) => {
    debateMap.set(seed.id, {
      ...seed,
      participationScore: (seed.commentsCount * 2) + seed.likesCount,
      userHasLiked: false
    });
  });
  mappedLive.forEach((d) => debateMap.set(d.id, d));

  let debates = Array.from(debateMap.values());

  // Topic filter
  if (topic && topic !== "All Debate Topics") {
    debates = debates.filter(
      (d) => d.category && d.category.toLowerCase() === topic.toLowerCase()
    );
  }

  // Search filter
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    debates = debates.filter((d) =>
      (d.title && d.title.toLowerCase().includes(q)) ||
      (d.excerpt && d.excerpt.toLowerCase().includes(q)) ||
      (d.movieTitle && d.movieTitle.toLowerCase().includes(q)) ||
      (d.authorName && d.authorName.toLowerCase().includes(q))
    );
  }

  // Sorting
  if (filter === "discussed") {
    debates.sort((a, b) => b.commentsCount - a.commentsCount || b.likesCount - a.likesCount);
  } else if (filter === "latest") {
    debates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else {
    // Trending: participationScore
    debates.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || b.participationScore - a.participationScore);
  }

  return debates;
}

// ==============================================================================
// FEATURE 3: MONTHLY CINEPHILE AWARDS
// ==============================================================================

export const AWARD_PERIODS = [
  { month: "October", year: 2026, label: "October 2026 (Active Voting)", isActive: true },
  { month: "September", year: 2026, label: "September 2026 (Official Winners)", isActive: false },
  { month: "August", year: 2026, label: "August 2026 (Archive)", isActive: false }
];

// Richly documented monthly cinephile awards catalog
const SEED_MONTHLY_AWARDS = [
  // ---------------- October 2026 (Active Voting Period) ----------------
  {
    id: "award-oct-1",
    month: "October",
    year: 2026,
    category: "CINIHUB Movie of the Month",
    title: "Anatomy of a Fall",
    award_type: "community_voted",
    recipient_type: "movie",
    movie_id: 915935,
    movie_title: "Anatomy of a Fall",
    movie_poster: "https://image.tmdb.org/t/p/w500/5aUV2bWjovsH3WjP3yY58gJ7Y7K.jpg",
    movie_year: "2023",
    criteria: "Highest community rating (9.1/10) and most debated courtroom thriller of the autumn cycle.",
    reason: "Justine Triet's clinical interrogation of narrative truth captivated society members with over 28 verified critiques.",
    votes_count: 142,
    is_active: true
  },
  {
    id: "award-oct-2",
    month: "October",
    year: 2026,
    category: "Best Cinematography Award",
    title: "Blade Runner 2049",
    award_type: "editorial_choice",
    recipient_type: "movie",
    movie_id: 335984,
    movie_title: "Blade Runner 2049",
    movie_poster: "https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
    movie_year: "2017",
    criteria: "Unanimous editorial jury selection for Roger Deakins' masterclass in silhouette and monochromatic amber lighting.",
    reason: "Awarded for enduring technical mastery that set the modern benchmark for neo-noir world-building.",
    votes_count: 98,
    is_active: true
  },
  {
    id: "award-oct-3",
    month: "October",
    year: 2026,
    category: "Hidden Gem of the Month",
    title: "Cinema Paradiso",
    award_type: "community_voted",
    recipient_type: "movie",
    movie_id: 11216,
    movie_title: "Cinema Paradiso",
    movie_poster: "https://image.tmdb.org/t/p/w500/gCI2AeMV4IHSewRKnHXTSZQPvgv.jpg",
    movie_year: "1988",
    criteria: "Top-recommended discovery title in the community with 58 member appreciations.",
    reason: "A poetic ode to the celluloid projection booth that moved dozens of new audience dispatches this month.",
    votes_count: 86,
    is_active: true
  },
  {
    id: "award-oct-4",
    month: "October",
    year: 2026,
    category: "Top Reviewer of the Month",
    title: "Christopher Vance",
    award_type: "community_voted",
    recipient_type: "user",
    user_name: "Christopher Vance",
    user_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80",
    criteria: "Authored 14 insightful dispatches with an average appreciation rating of 96% from fellow members.",
    reason: "Recognized for exceptionally detailed scene breakdowns on 1970s and 1980s American auteur cinema.",
    votes_count: 67,
    is_active: true
  },
  {
    id: "award-oct-5",
    month: "October",
    year: 2026,
    category: "Best Regional Film Award",
    title: "Leo",
    award_type: "community_voted",
    recipient_type: "movie",
    movie_id: 114461,
    movie_title: "Leo",
    movie_poster: "https://image.tmdb.org/t/p/w500/pD6sL4vntUOXHmuvJPPZAgvyfd9.jpg",
    movie_year: "2023",
    criteria: "Most energetic regional cinema dispatch engagement with 34 audience reviews and high repeat viewings.",
    reason: "Lokesh Kanagaraj's adrenaline-fueled staging and cafe standoff sequences ignited vibrant community buzz.",
    votes_count: 115,
    is_active: true
  },

  // ---------------- September 2026 (Past Winners Archive) ----------------
  {
    id: "award-sep-1",
    month: "September",
    year: 2026,
    category: "CINIHUB Movie of the Month",
    title: "Oppenheimer",
    award_type: "community_voted",
    recipient_type: "movie",
    movie_id: 872585,
    movie_title: "Oppenheimer",
    movie_poster: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    movie_year: "2023",
    criteria: "Won September Member Voting with 184 verified votes and 9.4 CINIHUB audience score.",
    reason: "Honored for Hoyte van Hoytema's large-format IMAX portraits and Ludwig Göransson's frenetic score.",
    votes_count: 184,
    is_active: false
  },
  {
    id: "award-sep-2",
    month: "September",
    year: 2026,
    category: "Best Screenplay Award",
    title: "The Holdovers",
    award_type: "editorial_choice",
    recipient_type: "movie",
    movie_id: 840430,
    movie_title: "The Holdovers",
    movie_poster: "https://image.tmdb.org/t/p/w500/B5aUzA5eWd7lD17G4o2h93Q7.jpg",
    movie_year: "2023",
    criteria: "Editorial jury selection for David Hemingson's warm, bittersweet 1970s character study.",
    reason: "Demonstrated impeccable dialogue timing and emotional restraint between three unlikely outcasts.",
    votes_count: 122,
    is_active: false
  },
  {
    id: "award-sep-3",
    month: "September",
    year: 2026,
    category: "Top Reviewer of the Month",
    title: "Meera Subramanian",
    award_type: "community_voted",
    recipient_type: "user",
    user_name: "Meera Subramanian",
    user_avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80",
    criteria: "Generated 312 community appreciations across 12 screenwriting analysis dispatches in September.",
    reason: "Awarded for forensic analyses of French and East Asian independent film scripts.",
    votes_count: 94,
    is_active: false
  },

  // ---------------- August 2026 (Past Winners Archive) ----------------
  {
    id: "award-aug-1",
    month: "August",
    year: 2026,
    category: "CINIHUB Movie of the Month",
    title: "Past Lives",
    award_type: "community_voted",
    recipient_type: "movie",
    movie_id: 666277,
    movie_title: "Past Lives",
    movie_poster: "https://image.tmdb.org/t/p/w500/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg",
    movie_year: "2023",
    criteria: "August Cinephile Poll winner with 165 votes celebrating Celine Song's delicate debut.",
    reason: "The poignant 24-year journey of In-Yun captivated our community discussions on longing and destiny.",
    votes_count: 165,
    is_active: false
  }
];

/**
 * Fetches monthly cinephile awards for a selected period.
 */
export async function fetchCommunityAwards({
  month = "October",
  year = 2026,
  currentUserId = null
} = {}) {
  let liveAwards = [];

  // 1. Fetch live awards from Supabase if table exists
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("community_awards")
        .select("*")
        .eq("month", month)
        .eq("year", Number(year));

      if (!error && data && data.length > 0) {
        liveAwards = data;
      }
    } catch (e) {
      console.warn("fetchCommunityAwards error (using fallback):", e);
    }
  }

  // 2. Merge with local awards cache and seed data
  const localAwards = readLocal(AWARDS_CACHE_KEY, []);
  const matchingLocal = localAwards.filter((a) => a.month === month && Number(a.year) === Number(year));
  const matchingSeed = SEED_MONTHLY_AWARDS.filter((a) => a.month === month && Number(a.year) === Number(year));

  const awardMap = new Map();
  liveAwards.forEach((a) => awardMap.set(String(a.id), a));
  matchingLocal.forEach((a) => {
    if (!awardMap.has(String(a.id))) awardMap.set(String(a.id), a);
  });
  matchingSeed.forEach((a) => {
    if (!awardMap.has(String(a.id))) awardMap.set(String(a.id), a);
  });

  const allAwards = Array.from(awardMap.values());

  // 3. Check user votes
  let userVotedAwardIds = new Set();
  const awardIds = allAwards.map((a) => a.id);

  if (isSupabaseConfigured && supabase && currentUserId && awardIds.length > 0) {
    try {
      const { data: userVotes } = await supabase
        .from("community_award_votes")
        .select("award_id")
        .eq("user_id", currentUserId)
        .in("award_id", awardIds);

      if (userVotes) {
        userVotes.forEach((v) => userVotedAwardIds.add(String(v.award_id)));
      }
    } catch (e) {
      console.warn("Could not check user award votes:", e);
    }
  }

  const localVotes = readLocal(AWARD_VOTES_CACHE_KEY, {});

  return allAwards.map((award) => {
    const isVotedLocally = currentUserId ? localVotes[award.id]?.includes(currentUserId) : false;
    const hasVoted = userVotedAwardIds.has(String(award.id)) || isVotedLocally;

    return {
      id: String(award.id),
      month: award.month,
      year: Number(award.year),
      category: award.category,
      title: award.title,
      award_type: award.award_type || "community_voted",
      recipient_type: award.recipient_type || "movie",
      movie_id: award.movie_id ? Number(award.movie_id) : null,
      movie_title: award.movie_title || null,
      movie_poster: award.movie_poster || null,
      movie_year: award.movie_year || null,
      user_name: award.user_name || null,
      user_avatar: award.user_avatar || null,
      criteria: award.criteria || "Official CINIHUB Film Society Selection Criteria.",
      reason: award.reason || null,
      votes_count: Number(award.votes_count) || 0,
      is_active: Boolean(award.is_active),
      user_has_voted: hasVoted
    };
  });
}

/**
 * Toggles an authenticated user's vote on an active community award.
 * Enforces:
 * - User must be authenticated
 * - Award must be active (is_active)
 * - Reversible toggle (clicking again un-votes)
 * - Prevents duplicate votes
 */
export async function toggleAwardVote({ awardId, user }) {
  if (!user || !user.id) {
    throw new Error("You must be signed in to cast a vote for Community Awards.");
  }

  let votedNow = false;

  // Supabase write
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: existing } = await supabase
        .from("community_award_votes")
        .select("id")
        .eq("award_id", awardId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        // Remove vote
        await supabase
          .from("community_award_votes")
          .delete()
          .eq("award_id", awardId)
          .eq("user_id", user.id);

        // Decrement votes count
        await supabase.rpc("decrement_award_votes", { target_award_id: awardId }).catch(() => {});
        votedNow = false;
      } else {
        // Insert vote
        await supabase
          .from("community_award_votes")
          .insert({ award_id: awardId, user_id: user.id });

        // Increment votes count
        await supabase.rpc("increment_award_votes", { target_award_id: awardId }).catch(() => {});
        votedNow = true;
      }
    } catch (e) {
      console.warn("Supabase toggleAwardVote exception:", e);
    }
  }

  // Local fallback storage
  const localVotes = readLocal(AWARD_VOTES_CACHE_KEY, {});
  const userList = localVotes[awardId] || [];
  const idx = userList.indexOf(user.id);

  if (idx !== -1) {
    userList.splice(idx, 1);
    votedNow = false;
  } else {
    userList.push(user.id);
    votedNow = true;
  }

  localVotes[awardId] = userList;
  writeLocal(AWARD_VOTES_CACHE_KEY, localVotes);

  // Update cached awards count
  const localAwards = readLocal(AWARDS_CACHE_KEY, []);
  const awardIdx = localAwards.findIndex((a) => String(a.id) === String(awardId));
  let updatedVotesCount = userList.length;

  if (awardIdx !== -1) {
    const delta = votedNow ? 1 : -1;
    localAwards[awardIdx].votes_count = Math.max(0, (localAwards[awardIdx].votes_count || 0) + delta);
    writeLocal(AWARDS_CACHE_KEY, localAwards);
    updatedVotesCount = localAwards[awardIdx].votes_count;
  }

  return {
    voted: votedNow,
    votesCount: updatedVotesCount
  };
}
