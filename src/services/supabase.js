/**
 * Supabase Client & Profile Management Service
 * Manages Supabase Auth, public.profiles, and profile-images Storage bucket.
 */

import { createClient } from "@supabase/supabase-js";

// Helper to sanitize environment variables by trimming and stripping quotes
function cleanEnv(val) {
  if (!val) return "";
  let str = String(val).trim();
  if (
    (str.startsWith('"') && str.endsWith('"')) ||
    (str.startsWith("'") && str.endsWith("'"))
  ) {
    str = str.slice(1, -1).trim();
  }
  return str;
}

const supabaseUrl = cleanEnv(import.meta.env.VITE_SUPABASE_URL);
const supabaseKey = cleanEnv(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Check if valid Supabase configuration is present
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  !supabaseUrl.includes("your-project") &&
  supabaseUrl.startsWith("http") &&
  supabaseKey.length > 20
);

// Initialize Supabase client if configured, otherwise null
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

export const BUCKET_NAME = "profile-images";
export const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
export const ALLOWED_AVATAR_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp"
];

/**
 * Validates selected profile image file.
 */
export function validateProfileImage(file) {
  if (!file) {
    return { valid: false, error: "No file selected." };
  }

  const fileType = file.type ? file.type.toLowerCase() : "";
  if (!ALLOWED_AVATAR_TYPES.includes(fileType)) {
    return {
      valid: false,
      error: "Unsupported format. Only JPG, JPEG, PNG, and WebP images are allowed."
    };
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return {
      valid: false,
      error: "Image exceeds 2 MB. Please select an image smaller than 2 MB."
    };
  }

  return { valid: true };
}

/**
 * Uploads a profile image to the Supabase Storage 'profile-images' bucket
 * under the user's specific folder path: `<user-uuid>/<unique-filename>`.
 */
export async function uploadAvatarToStorage(userId, file) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to your .env file."
    );
  }

  const validation = validateProfileImage(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const fileExt = file.name.split(".").pop() || "jpg";
  const uniqueName = `avatar-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${fileExt}`;
  const filePath = `${userId}/${uniqueName}`;

  // Upload to public 'profile-images' bucket
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true
    });

  if (uploadError) {
    console.error("Supabase Storage upload error:", {
      code: uploadError.statusCode,
      message: uploadError.message
    });
    throw new Error(uploadError.message || "Failed to upload image to Supabase Storage.");
  }

  // Get public URL
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  const publicUrl = data?.publicUrl;
  if (!publicUrl) {
    throw new Error("Unable to retrieve public image URL from Supabase Storage.");
  }

  return { publicUrl, filePath };
}

/**
 * Helper to execute a database write with automatic column fallback
 * in case schema column names differ (e.g. full_name vs name, mobile_number vs mobile).
 */
async function executeProfileWrite(isUpdate, userId, payloadList) {
  for (const payload of payloadList) {
    try {
      if (isUpdate) {
        const { data, error } = await supabase
          .from("profiles")
          .update(payload)
          .eq("id", userId)
          .select();

        if (!error && data && data.length > 0) {
          return { success: true, data: data[0] };
        }
        if (error && error.code !== "42703") {
          // If error is not a column-missing error, return it
          return { success: false, error };
        }
      } else {
        const { data, error } = await supabase
          .from("profiles")
          .insert({ id: userId, ...payload })
          .select();

        if (!error && data && data.length > 0) {
          return { success: true, data: data[0] };
        }
        if (error && error.code !== "42703") {
          return { success: false, error };
        }
      }
    } catch (err) {
      console.warn("Profile write attempt exception:", err);
    }
  }
  return { success: false };
}

/**
 * Saves or updates a user profile in public.profiles.
 * Handles schema variations (full_name/name, mobile_number/mobile, username).
 * Respects RLS and never stores plain-text passwords.
 */
export async function saveUserProfile(userId, { name, mobile, avatarUrl, email, username: inputUsername }) {
  if (!isSupabaseConfigured || !supabase) {
    console.warn("saveUserProfile skipped: Supabase not configured.");
    return null;
  }

  const username = (inputUsername && String(inputUsername).trim())
    ? String(inputUsername).trim().toLowerCase().replace(/[^a-z0-9_]/g, "")
    : (email
      ? email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "")
      : "");
  const fullName = name ? name.trim() : "";
  const mobileNumber = mobile ? mobile.trim() : "";

  // Prepare ordered list of payloads from richest schema to minimal fallback
  const payloads = [
    // 1. Standard expected schema: full_name, mobile_number, username, avatar_url
    {
      full_name: fullName || null,
      mobile_number: mobileNumber || null,
      username: username || null,
      avatar_url: avatarUrl || null
    },
    // 2. Schema without username
    {
      full_name: fullName || null,
      mobile_number: mobileNumber || null,
      avatar_url: avatarUrl || null
    },
    // 3. Schema using 'name' and 'mobile'
    {
      name: fullName || null,
      mobile: mobileNumber || null,
      avatar_url: avatarUrl || null
    },
    // 4. Schema using 'name' only
    {
      name: fullName || null,
      avatar_url: avatarUrl || null
    },
    // 5. Minimal schema (id and avatar_url)
    {
      avatar_url: avatarUrl || null
    }
  ];

  try {
    // Check if profile record already exists for this user
    const { data: existing, error: selectErr } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (selectErr) {
      console.warn("Notice checking existing profile:", selectErr.message);
    }

    const hasExistingRow = Boolean(existing?.id);

    if (hasExistingRow) {
      // Record exists: perform UPDATE (works with 'Users can update their own profile' policy)
      const updateResult = await executeProfileWrite(true, userId, payloads);
      if (updateResult.success) {
        return fetchUserProfile(userId);
      }
      if (updateResult.error) {
        console.error("public.profiles UPDATE error:", {
          code: updateResult.error.code,
          message: updateResult.error.message,
          hint: updateResult.error.hint
        });
      }
    } else {
      // Record does not exist: perform INSERT
      const insertResult = await executeProfileWrite(false, userId, payloads);
      if (insertResult.success) {
        return fetchUserProfile(userId);
      }

      if (insertResult.error) {
        console.error("public.profiles INSERT error:", {
          code: insertResult.error.code,
          message: insertResult.error.message,
          hint: insertResult.error.hint
        });

        // If insert failed due to RLS (code 42501), attempt upsert as fallback
        if (insertResult.error.code === "42501") {
          console.warn(
            "Row-Level Security note: public.profiles table requires an INSERT policy or trigger on auth.users."
          );
        }
      }
    }
  } catch (err) {
    console.error("saveUserProfile unexpected error:", err);
  }

  return fetchUserProfile(userId);
}

/**
 * Updates or sets the avatar_url in the public.profiles table.
 */
export async function updateProfileAvatar(userId, avatarUrl, profileMeta = {}) {
  if (!isSupabaseConfigured || !supabase) return;

  const fullName = profileMeta.full_name || profileMeta.name || null;
  const mobileNumber = profileMeta.mobile_number || profileMeta.mobile || null;
  const username = profileMeta.username || null;

  const payloads = [
    {
      avatar_url: avatarUrl,
      ...(fullName ? { full_name: fullName } : {}),
      ...(mobileNumber ? { mobile_number: mobileNumber } : {}),
      ...(username ? { username } : {})
    },
    {
      avatar_url: avatarUrl,
      ...(fullName ? { name: fullName } : {}),
      ...(mobileNumber ? { mobile: mobileNumber } : {})
    },
    {
      avatar_url: avatarUrl
    }
  ];

  await executeProfileWrite(true, userId, payloads);
}

/**
 * Fetches user profile from public.profiles, normalizing column naming variations.
 */
export async function fetchUserProfile(userId) {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const { data, error, status } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("fetchUserProfile query error:", {
        status,
        code: error.code,
        message: error.message
      });
      return null;
    }

    if (!data) {
      console.warn("fetchUserProfile: No profile row found in public.profiles for ID:", userId);
      return null;
    }

    const resolvedName = data.full_name || data.name || data.username || null;
    const resolvedMobile = data.mobile_number || data.mobile || null;

    return {
      ...data,
      id: data.id,
      name: resolvedName,
      full_name: data.full_name || data.name || null,
      mobile: resolvedMobile,
      mobile_number: data.mobile_number || data.mobile || null,
      username: data.username || null,
      avatar_url: data.avatar_url || null
    };
  } catch (err) {
    console.error("fetchUserProfile exception:", err);
    return null;
  }
}

/**
 * Translates Supabase auth errors into friendly user messages.
 */
export function formatSupabaseAuthError(error) {
  if (!error) return "An unexpected authentication error occurred. Please try again.";

  const msg = typeof error === "string" ? error : error.message || "";
  const lower = msg.toLowerCase();

  if (
    lower.includes("user already registered") ||
    lower.includes("already registered") ||
    lower.includes("user with this email already exists") ||
    lower.includes("duplicate key")
  ) {
    return "This email address is already registered. Please log in or use another email.";
  }

  if (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid_grant") ||
    lower.includes("invalid credentials")
  ) {
    return "Invalid email address or password. Please check your credentials and try again.";
  }

  if (
    lower.includes("email not confirmed") ||
    lower.includes("email link is invalid or has expired")
  ) {
    return "Your email address has not been confirmed yet. Please verify your email from the link sent to your inbox before logging in.";
  }

  if (lower.includes("password should be at least")) {
    return "Password must be at least 6 characters long.";
  }

  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "Too many attempts. Please wait a moment before trying again.";
  }

  return msg || "Authentication failed. Please verify your details and try again.";
}

/**
 * Removes an existing avatar: updates public.profiles to NULL and cleans up Storage.
 */
export async function removeProfileAvatar(userId, currentAvatarUrl) {
  // Update profiles table to NULL
  if (isSupabaseConfigured && supabase) {
    await updateProfileAvatar(userId, null);

    // If existing avatar is in Supabase storage, delete it
    if (currentAvatarUrl && currentAvatarUrl.includes(`/${BUCKET_NAME}/`)) {
      try {
        const parts = currentAvatarUrl.split(`/${BUCKET_NAME}/`);
        if (parts[1]) {
          const pathToDelete = decodeURIComponent(parts[1].split("?")[0]);
          await supabase.storage.from(BUCKET_NAME).remove([pathToDelete]);
        }
      } catch (err) {
        console.warn("Non-fatal storage file removal warning:", err);
      }
    }
  }
}

/**
 * Store deferred avatar file for pending email confirmation signup.
 */
export function storeDeferredAvatar(email, file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        sessionStorage.setItem(`pending_avatar_${email.toLowerCase()}`, JSON.stringify({
          name: file.name,
          type: file.type,
          dataUrl: reader.result
        }));
      } catch (e) {
        console.warn("Could not cache deferred avatar:", e);
      }
      resolve();
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Retrieves and converts any deferred avatar back into a File.
 */
export function getDeferredAvatar(email) {
  try {
    const item = sessionStorage.getItem(`pending_avatar_${email.toLowerCase()}`);
    if (!item) return null;
    const { name, type, dataUrl } = JSON.parse(item);
    const arr = dataUrl.split(",");
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], name, { type });
  } catch {
    return null;
  }
}

export function clearDeferredAvatar(email) {
  sessionStorage.removeItem(`pending_avatar_${email.toLowerCase()}`);
}

// ==============================================================================
// MOVIE REVIEWS & RATINGS SERVICE (public.movie_reviews)
// ==============================================================================

const LOCAL_REVIEWS_KEY = "cinihub_movie_reviews_cache";

/**
 * Local helper to read offline/cached movie reviews
 */
function getCachedReviews() {
  try {
    const raw = localStorage.getItem(LOCAL_REVIEWS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Local helper to write offline/cached movie reviews
 */
function setCachedReviews(reviews) {
  try {
    localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(reviews));
  } catch (err) {
    console.warn("Could not cache reviews locally:", err);
  }
}

/**
 * Normalizes a raw review row from Supabase or cache into standard format
 */
function normalizeReview(row, profileMap = {}) {
  const profile = profileMap[row.user_id] || {};
  return {
    id: row.id || `local-${row.movie_id}-${row.user_id}`,
    movie_id: Number(row.movie_id),
    user_id: row.user_id,
    rating: Number(row.rating),
    review_text: row.review_text || "",
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || row.created_at || new Date().toISOString(),
    reviewer_name: profile.full_name || profile.name || row.reviewer_name || "Cinephile Critic",
    reviewer_username: profile.username || row.reviewer_username || null,
    avatar_url: profile.avatar_url || row.avatar_url || null
  };
}

/**
 * Fetches all reviews for a specific TMDB movie ID.
 * Returns { reviews: [], averageRating: number | null, totalReviews: number }
 */
export async function fetchMovieReviews(movieId) {
  const numMovieId = Number(movieId);
  let liveReviews = [];

  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Fetch from public.movie_reviews
      const { data, error } = await supabase
        .from("movie_reviews")
        .select("*")
        .eq("movie_id", numMovieId)
        .order("created_at", { ascending: false });

      if (error) {
        // Fallback check if table was created with name 'reviews'
        if (error.code === "42P01") {
          console.warn("movie_reviews table not found, attempting 'reviews' fallback table");
          const { data: altData } = await supabase
            .from("reviews")
            .select("*")
            .eq("movie_id", numMovieId)
            .order("created_at", { ascending: false });
          if (altData) liveReviews = altData;
        } else {
          console.error("fetchMovieReviews query error:", error);
        }
      } else if (data) {
        liveReviews = data;
      }
    } catch (err) {
      console.warn("Supabase fetchMovieReviews exception:", err);
    }
  }

  // 2. Merge with locally cached reviews for seamless offline/dev behavior
  const cached = getCachedReviews().filter((r) => Number(r.movie_id) === numMovieId);
  const combinedMap = new Map();

  liveReviews.forEach((r) => combinedMap.set(String(r.user_id), r));
  cached.forEach((r) => {
    if (!combinedMap.has(String(r.user_id))) {
      combinedMap.set(String(r.user_id), r);
    }
  });

  const allRows = Array.from(combinedMap.values());

  // 3. Hydrate profile information (name, username, avatar)
  const profileMap = {};
  if (isSupabaseConfigured && supabase && allRows.length > 0) {
    const userIds = [...new Set(allRows.map((r) => r.user_id))];
    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, name, username, avatar_url")
        .in("id", userIds);

      if (profiles) {
        profiles.forEach((p) => {
          profileMap[p.id] = p;
        });
      }
    } catch (e) {
      console.warn("Could not fetch reviewer profiles:", e);
    }
  }

  const formattedReviews = allRows
    .map((r) => normalizeReview(r, profileMap))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // 4. Calculate CINIHUB average rating and total review count
  const totalReviews = formattedReviews.length;
  let averageRating = null;

  if (totalReviews > 0) {
    const sum = formattedReviews.reduce((acc, curr) => acc + Number(curr.rating), 0);
    averageRating = Number((sum / totalReviews).toFixed(1));
  }

  return {
    reviews: formattedReviews,
    averageRating,
    totalReviews
  };
}

/**
 * Fetches the logged-in user's existing review for a specific movie, or null.
 */
export async function fetchUserMovieReview(movieId, userId) {
  if (!movieId || !userId) return null;
  const numMovieId = Number(movieId);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("movie_reviews")
        .select("*")
        .eq("movie_id", numMovieId)
        .eq("user_id", userId)
        .maybeSingle();

      if (!error && data) {
        return normalizeReview(data);
      }
    } catch (err) {
      console.warn("fetchUserMovieReview exception:", err);
    }
  }

  // Fallback to local cache
  const cached = getCachedReviews().find(
    (r) => Number(r.movie_id) === numMovieId && String(r.user_id) === String(userId)
  );
  return cached ? normalizeReview(cached) : null;
}

/**
 * Saves (inserts or updates) a user review for a movie.
 * Prevents duplicates for (movie_id, user_id).
 */
export async function saveMovieReview({ movieId, userId, rating, reviewText, reviewerName }) {
  if (!movieId || !userId) {
    throw new Error("Movie ID and authenticated User ID are required to submit a review.");
  }

  const numMovieId = Number(movieId);
  const numRating = Number(rating);

  if (isNaN(numRating) || numRating < 0 || numRating > 10) {
    throw new Error("Rating must be a numeric score between 0 and 10.");
  }

  const cleanText = (reviewText || "").trim();
  if (!cleanText) {
    throw new Error("Please write your review thoughts before submitting.");
  }

  const timestamp = new Date().toISOString();
  let savedData = null;

  if (isSupabaseConfigured && supabase) {
    try {
      // Check if user already reviewed this movie
      const { data: existing } = await supabase
        .from("movie_reviews")
        .select("id")
        .eq("movie_id", numMovieId)
        .eq("user_id", userId)
        .maybeSingle();

      if (existing?.id) {
        // UPDATE existing review
        const { data, error } = await supabase
          .from("movie_reviews")
          .update({
            rating: numRating,
            review_text: cleanText,
            updated_at: timestamp
          })
          .eq("id", existing.id)
          .eq("user_id", userId)
          .select();

        if (error) throw error;
        if (data && data.length > 0) savedData = data[0];
      } else {
        // INSERT new review
        const { data, error } = await supabase
          .from("movie_reviews")
          .insert({
            movie_id: numMovieId,
            user_id: userId,
            rating: numRating,
            review_text: cleanText,
            created_at: timestamp,
            updated_at: timestamp
          })
          .select();

        if (error) throw error;
        if (data && data.length > 0) savedData = data[0];
      }
    } catch (err) {
      console.error("Supabase saveMovieReview error:", {
        code: err.code,
        message: err.message
      });
      // Re-throw if error is an RLS/auth rejection so UI can display proper message
      if (err.code === "42501" || err.message?.includes("policy")) {
        throw new Error("Database permission error: Authenticated access required to submit reviews.");
      }
    }
  }

  // Mirror to local cache so user's review persists seamlessly
  const currentCached = getCachedReviews();
  const existingIdx = currentCached.findIndex(
    (r) => Number(r.movie_id) === numMovieId && String(r.user_id) === String(userId)
  );

  const reviewPayload = {
    id: savedData?.id || `review-${numMovieId}-${userId}-${Date.now()}`,
    movie_id: numMovieId,
    user_id: userId,
    rating: numRating,
    review_text: cleanText,
    created_at: savedData?.created_at || (existingIdx >= 0 ? currentCached[existingIdx].created_at : timestamp),
    updated_at: timestamp,
    reviewer_name: reviewerName || "Cinephile Critic"
  };

  if (existingIdx >= 0) {
    currentCached[existingIdx] = reviewPayload;
  } else {
    currentCached.unshift(reviewPayload);
  }
  setCachedReviews(currentCached);

  return normalizeReview(savedData || reviewPayload);
}

/**
 * Deletes a review for a movie by review ID and user ID.
 */
export async function deleteMovieReview(reviewId, userId, movieId) {
  if (isSupabaseConfigured && supabase && reviewId && !String(reviewId).startsWith("local-")) {
    try {
      const { error } = await supabase
        .from("movie_reviews")
        .delete()
        .eq("id", reviewId)
        .eq("user_id", userId);

      if (error) console.error("deleteMovieReview error:", error);
    } catch (err) {
      console.warn("deleteMovieReview exception:", err);
    }
  }

  // Remove from local cache
  const cached = getCachedReviews().filter(
    (r) => !(String(r.id) === String(reviewId) || (Number(r.movie_id) === Number(movieId) && String(r.user_id) === String(userId)))
  );
  setCachedReviews(cached);

  return true;
}

/**
 * Fetches all reviews written by a specific user across all movies.
 * Used for the Profile Page 'My Reviews' tab.
 */
export async function fetchUserReviews(userId) {
  if (!userId) return [];
  let userReviews = [];

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("movie_reviews")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        userReviews = data;
      }
    } catch (err) {
      console.warn("fetchUserReviews exception:", err);
    }
  }

  // Merge with local cache
  const cached = getCachedReviews().filter((r) => String(r.user_id) === String(userId));
  const map = new Map();
  userReviews.forEach((r) => map.set(Number(r.movie_id), r));
  cached.forEach((r) => {
    if (!map.has(Number(r.movie_id))) {
      map.set(Number(r.movie_id), r);
    }
  });

  return Array.from(map.values())
    .map((r) => normalizeReview(r))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

/**
 * Fetches recent community reviews across all movies.
 * Used for the Reviews archive page.
 */
export async function fetchRecentCommunityReviews(limit = 20) {
  let reviews = [];

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("movie_reviews")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!error && data) {
        reviews = data;
      }
    } catch (err) {
      console.warn("fetchRecentCommunityReviews exception:", err);
    }
  }

  const cached = getCachedReviews();
  const map = new Map();
  reviews.forEach((r) => map.set(r.id, r));
  cached.forEach((r) => {
    if (!map.has(r.id)) {
      map.set(r.id, r);
    }
  });

  const allReviews = Array.from(map.values());

  // Fetch reviewer profiles
  const profileMap = {};
  if (isSupabaseConfigured && supabase && allReviews.length > 0) {
    const userIds = [...new Set(allReviews.map((r) => r.user_id))];
    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, name, username, avatar_url")
        .in("id", userIds);

      if (profiles) {
        profiles.forEach((p) => {
          profileMap[p.id] = p;
        });
      }
    } catch (e) {
      console.warn("Profile fetch error in fetchRecentCommunityReviews:", e);
    }
  }

  return allReviews
    .map((r) => normalizeReview(r, profileMap))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}
