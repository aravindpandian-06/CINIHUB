/**
 * TMDB (The Movie Database) API Service
 * Handles live movie data fetching, genre mapping, normalization, and caching.
 */

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
export const FALLBACK_POSTER = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80";

// Comprehensive TMDB Genre ID to Name Mapping
export const GENRE_MAP = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western"
};

// In-memory cache to prevent redundant API calls
const apiCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Retrieves the TMDB API Read Access Token or API Key from environment variables.
 */
function getAuthCredentials() {
  const token = import.meta.env.VITE_TMDB_TOKEN ? String(import.meta.env.VITE_TMDB_TOKEN).trim() : "";
  const apiKey = import.meta.env.VITE_TMDB_API_KEY ? String(import.meta.env.VITE_TMDB_API_KEY).trim() : "";

  // Validate that token is not an unfilled placeholder
  const isValidToken = token && !token.includes("your_tmdb") && token.length > 20;
  const isValidApiKey = apiKey && !apiKey.includes("your_tmdb") && apiKey.length > 10;

  return {
    token: isValidToken ? token : null,
    apiKey: isValidApiKey ? apiKey : null,
    hasCredentials: Boolean(isValidToken || isValidApiKey)
  };
}

/**
 * Checks if TMDB API credentials are configured.
 */
export function isTmdbConfigured() {
  return getAuthCredentials().hasCredentials;
}

/**
 * Core fetch wrapper for TMDB endpoints.
 */
async function fetchFromTmdb(endpoint, params = {}) {
  const { token, apiKey, hasCredentials } = getAuthCredentials();

  if (!hasCredentials) {
    throw new Error(
      "TMDB credentials not found. Please set VITE_TMDB_TOKEN in your .env file."
    );
  }

  // Construct URL with query parameters
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);

  // Default language
  url.searchParams.set("language", "en-US");

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  // Headers configuration
  const headers = {
    Accept: "application/json"
  };

  // If token is present, use standard Authorization Bearer header
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (apiKey) {
    // Fallback to query parameter only if Bearer token is not present
    url.searchParams.set("api_key", apiKey);
  }

  // Cache lookup
  const cacheKey = url.toString();
  const cached = apiCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const errorMessage =
      errorBody.status_message ||
      `TMDB API request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  const data = await response.json();

  // Store in cache
  apiCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });

  return data;
}

/**
 * Normalizes a raw TMDB movie object into the format expected by CINIHUB components.
 */
export function formatMovie(raw) {
  if (!raw) return null;

  // Extract 4-digit release year
  const releaseYear = raw.release_date
    ? raw.release_date.slice(0, 4)
    : raw.first_air_date
      ? raw.first_air_date.slice(0, 4)
      : "2024";

  // Map genre IDs to human-readable string
  const genreList = Array.isArray(raw.genre_ids)
    ? raw.genre_ids.map((id) => GENRE_MAP[id]).filter(Boolean).slice(0, 2)
    : Array.isArray(raw.genres)
      ? raw.genres.map((g) => g.name).slice(0, 2)
      : [];

  const genre = genreList.length > 0 ? genreList.join(" • ") : "Cinema";

  // Format rating to 1 decimal place
  const ratingValue =
    typeof raw.vote_average === "number" && raw.vote_average > 0
      ? Number(raw.vote_average).toFixed(1)
      : "7.5";

  // Construct official poster URL with fallback
  const posterUrl = raw.poster_path
    ? `${TMDB_IMAGE_BASE_URL}${raw.poster_path}`
    : FALLBACK_POSTER;

  return {
    id: raw.id,
    title: raw.title || raw.name || raw.original_title || "Untitled Film",
    genre,
    rating: ratingValue,
    year: releaseYear,
    image: posterUrl,
    overview: raw.overview || "No synopsis available for this title.",
    releaseDate: raw.release_date || "",
    voteCount: raw.vote_count || 0
  };
}

/**
 * Endpoints for CINIHUB Movies Page:
 */

// 1. Popular Movies (/movie/popular)
export async function getPopularMovies(page = 1) {
  const data = await fetchFromTmdb("/movie/popular", { page });
  return {
    page: data.page,
    totalPages: data.total_pages,
    totalResults: data.total_results,
    movies: (data.results || []).map(formatMovie)
  };
}

// 2. Trending Movies of the Week (/trending/movie/week)
export async function getTrendingMovies(page = 1) {
  const data = await fetchFromTmdb("/trending/movie/week", { page });
  return {
    page: data.page,
    totalPages: data.total_pages,
    totalResults: data.total_results,
    movies: (data.results || []).map(formatMovie)
  };
}

// 3. Now Playing Movies (/movie/now_playing)
export async function getNowPlayingMovies(page = 1) {
  const data = await fetchFromTmdb("/movie/now_playing", { page });
  return {
    page: data.page,
    totalPages: data.total_pages,
    totalResults: data.total_results,
    movies: (data.results || []).map(formatMovie)
  };
}

// 4. Upcoming Movies (/movie/upcoming)
export async function getUpcomingMovies(page = 1) {
  const data = await fetchFromTmdb("/movie/upcoming", { page });
  return {
    page: data.page,
    totalPages: data.total_pages,
    totalResults: data.total_results,
    movies: (data.results || []).map(formatMovie)
  };
}

// 5. Search Movies (/search/movie)
export async function searchMovies(query, page = 1) {
  if (!query || !query.trim()) {
    return { page: 1, totalPages: 1, totalResults: 0, movies: [] };
  }
  const data = await fetchFromTmdb("/search/movie", { query: query.trim(), page });
  return {
    page: data.page,
    totalPages: data.total_pages,
    totalResults: data.total_results,
    movies: (data.results || []).map(formatMovie)
  };
}

// 6. Get Specific Movie Details (/movie/:movieId)
export async function getMovieDetails(movieId) {
  if (!movieId) return null;
  const numId = Number(movieId);

  if (isTmdbConfigured()) {
    try {
      const data = await fetchFromTmdb(`/movie/${movieId}`);
      if (data && data.id) {
        return formatMovie(data);
      }
    } catch (err) {
      console.warn(`TMDB fetch failed for movie ${movieId}:`, err.message);
    }
  }

  // Fallback to FALLBACK_MOVIES if matched
  const matched = FALLBACK_MOVIES.find(
    (m) => Number(m.id) === numId || String(m.id) === String(movieId)
  );
  if (matched) return matched;

  // Generic fallback movie object so the page renders cleanly even if offline
  return {
    id: numId || movieId,
    title: "Feature Film",
    genre: "Cinema",
    rating: "7.5",
    year: "2024",
    image: FALLBACK_POSTER,
    overview: "A featured cinema title from the CINIHUB archive.",
    releaseDate: "2024",
    voteCount: 100
  };
}

/**
 * Fallback curated movies if credentials are not configured or while in offline demo mode.
 */
export const FALLBACK_MOVIES = [
  {
    id: 114461,
    title: "Leo",
    genre: "Action • Thriller",
    rating: "8.4",
    year: "2023",
    image: "https://upload.wikimedia.org/wikipedia/en/7/75/Leo_%282023_Indian_film%29.jpg",
    overview: "Parthiban is a mild-mannered cafe owner in Theog, who finds himself thrust into a high-stakes conflict."
  },
  {
    id: 872906,
    title: "Vikram",
    genre: "Action • Crime",
    rating: "8.3",
    year: "2022",
    image: "https://upload.wikimedia.org/wikipedia/en/9/93/Vikram_2022_poster.jpg",
    overview: "A special investigator assigned to track a case of serial killings uncovers a war for control of the underground."
  },
  {
    id: 976573,
    title: "Jailer",
    genre: "Action • Comedy",
    rating: "7.1",
    year: "2023",
    image: "https://upload.wikimedia.org/wikipedia/en/c/cb/Jailer_2023_Tamil_film_poster.jpg",
    overview: "Tiger Muthuvel Pandian is a retired jailer who steps back into action to defend his family."
  },
  {
    id: 157336,
    title: "Interstellar",
    genre: "Sci-Fi • Drama",
    rating: "8.7",
    year: "2014",
    image: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    overview: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival."
  },
  {
    id: 27205,
    title: "Inception",
    genre: "Sci-Fi • Thriller",
    rating: "8.8",
    year: "2010",
    image: "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    overview: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea."
  },
  {
    id: 641501,
    title: "Kaithi",
    genre: "Action • Thriller",
    rating: "8.4",
    year: "2019",
    image: "https://upload.wikimedia.org/wikipedia/en/7/79/Kaithi_2019_poster.jpg",
    overview: "Dilli, an ex-convict, endeavors to see his daughter for the first time after leaving prison."
  }
];
