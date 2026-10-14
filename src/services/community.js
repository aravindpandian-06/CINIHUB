/**
 * CINIHUB Community Service
 * Manages Movie Discussions, Comments, Recommendations, and Likes
 * with Supabase PostgreSQL, RLS policies, and resilient fallback caching.
 */

import { supabase, isSupabaseConfigured } from "./supabase.js";

// Local storage cache keys for offline/fallback resilience
const DISCUSSIONS_CACHE_KEY = "cinihub_community_discussions_cache";
const COMMENTS_CACHE_KEY = "cinihub_community_comments_cache";
const RECOMMENDATIONS_CACHE_KEY = "cinihub_community_recommendations_cache";
const DISC_LIKES_CACHE_KEY = "cinihub_community_disc_likes_cache";
const REC_LIKES_CACHE_KEY = "cinihub_community_rec_likes_cache";

// Curated seed data for initial community experience
export const SEED_DISCUSSIONS = [
  {
    id: "seed-disc-1",
    user_id: "seed-user-1",
    title: "The Art of Shadow and Light in Modern Film Noir",
    content: "Watching Denis Villeneuve's Blade Runner 2049 alongside classic 1940s noir reveals how Roger Deakins used silhouette, warm amber backlighting, and geometric shadows to evoke timeless moral ambiguity. What other modern films have captured this balance so masterfully?",
    category: "Cinematography",
    movie_id: 335984,
    movie_title: "Blade Runner 2049",
    movie_poster: "https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
    movie_year: "2017",
    created_at: new Date(Date.now() - 3600000 * 26).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 26).toISOString(),
    author_name: "Christopher Vance",
    author_username: "shadowlens",
    author_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80",
    comments_count: 5,
    likes_count: 24,
    user_has_liked: false
  },
  {
    id: "seed-disc-2",
    user_id: "seed-user-2",
    title: "Screenplay Analysis: The Clockwork Tension of Anatomy of a Fall",
    content: "Justine Triet and Arthur Harari's screenplay refuses to answer whether Sandra is innocent or guilty. Instead, the dialogue puts marriage, translation, and memory on trial. How did the courthouse acoustics and sound design heighten that ambiguity for you?",
    category: "Screenplay and Storytelling",
    movie_id: 915935,
    movie_title: "Anatomy of a Fall",
    movie_poster: "https://image.tmdb.org/t/p/w500/5aUV2bWjovsH3WjP3yY58gJ7Y7K.jpg",
    movie_year: "2023",
    created_at: new Date(Date.now() - 3600000 * 14).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 14).toISOString(),
    author_name: "Meera Subramanian",
    author_username: "meera_script",
    author_avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80",
    comments_count: 8,
    likes_count: 31,
    user_has_liked: false
  },
  {
    id: "seed-disc-3",
    user_id: "seed-user-3",
    title: "Unforgettable Dialogue: The Opening Monologue of Apocalypse Now",
    content: "‘Saigon... shit; I'm still only in Saigon.’ Martin Sheen lying on that sweat-drenched bed under the ceiling fan with The Doors playing is pure cinematic poetry. What is your candidate for cinema’s most hypnotic opening line?",
    category: "Unforgettable Dialogue",
    movie_id: 28,
    movie_title: "Apocalypse Now",
    movie_poster: "https://image.tmdb.org/t/p/w500/gQB8Y5iNedVuHp9nyvg9OKCqIG9.jpg",
    movie_year: "1979",
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    author_name: "David Sterling",
    author_username: "sterling_cine",
    author_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
    comments_count: 12,
    likes_count: 42,
    user_has_liked: false
  }
];

export const SEED_COMMENTS = [
  {
    id: "seed-comm-1",
    discussion_id: "seed-disc-1",
    user_id: "seed-user-4",
    content: "Deakins' use of yellow fog in the Las Vegas casino sequence was achieved using actual sodium-vapor lamps and color temperature grading in-camera. Unmatched craft!",
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    author_name: "Elena Rostova",
    author_username: "elena_cinematic",
    author_avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&q=80"
  },
  {
    id: "seed-comm-2",
    discussion_id: "seed-disc-1",
    user_id: "seed-user-5",
    content: "Another modern example is Greg Fraser's work on The Batman (2021). The red flare flare-lit tunnel scene is pure neo-noir ecstasy.",
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    author_name: "Arjun Nair",
    author_username: "arjun_reel",
    author_avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80"
  },
  {
    id: "seed-comm-3",
    discussion_id: "seed-disc-2",
    user_id: "seed-user-1",
    content: "The steel-drum instrumental cover of 50 Cent's 'P.I.M.P.' playing on repeat upstairs was an absolute stroke of genius for setting forensic tension.",
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    author_name: "Christopher Vance",
    author_username: "shadowlens",
    author_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80"
  }
];

export const SEED_RECOMMENDATIONS = [
  {
    id: "seed-rec-1",
    user_id: "seed-user-2",
    movie_id: 11216,
    movie_title: "Cinema Paradiso",
    movie_poster: "https://image.tmdb.org/t/p/w500/gCI2AeMV4IHSewRKnHXTSZQPvgv.jpg",
    movie_year: "1988",
    category: "Must-Watch Films",
    recommendation_text: "A timeless love letter to the magic of the projector room and childhood memories. Ennio Morricone's musical score during the final montage will make any cinema lover shed tears of pure joy.",
    mood: "Late Night Nostalgia",
    created_at: new Date(Date.now() - 3600000 * 30).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 30).toISOString(),
    author_name: "Meera Subramanian",
    author_username: "meera_script",
    author_avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80",
    likes_count: 58,
    user_has_liked: false
  },
  {
    id: "seed-rec-2",
    user_id: "seed-user-1",
    movie_id: 497,
    movie_title: "The Green Mile",
    movie_poster: "https://image.tmdb.org/t/p/w500/8VG8fDNiy50849RI32FDZaHNiof.jpg",
    movie_year: "1999",
    category: "Cult Classics",
    recommendation_text: "An extraordinary adaptation of Stephen King’s serialized novel. Michael Clarke Duncan and Tom Hanks give career-defining performances steeped in supernatural empathy and tragedy.",
    mood: "Comfort Watch",
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    author_name: "Christopher Vance",
    author_username: "shadowlens",
    author_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80",
    likes_count: 44,
    user_has_liked: false
  },
  {
    id: "seed-rec-3",
    user_id: "seed-user-3",
    movie_id: 77,
    movie_title: "Memento",
    movie_poster: "https://image.tmdb.org/t/p/w500/fKog48sjZ5GeOWt96bvOBfdw9Fl.jpg",
    movie_year: "2000",
    category: "Mind-Bending Movies",
    recommendation_text: "Christopher Nolan's reverse-chronological masterpiece. Watch it once for the mystery, and a second time to see how every single detail was meticulously planted in plain sight.",
    mood: "Mind Bender",
    created_at: new Date(Date.now() - 3600000 * 10).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 10).toISOString(),
    author_name: "David Sterling",
    author_username: "sterling_cine",
    author_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
    likes_count: 67,
    user_has_liked: false
  },
  {
    id: "seed-rec-4",
    user_id: "seed-user-4",
    movie_id: 1103,
    movie_title: "Escape from New York",
    movie_poster: "https://image.tmdb.org/t/p/w500/wPbg2KjL92w9G5u5VzZk5zH6V1E.jpg",
    movie_year: "1981",
    category: "Midnight Movies",
    recommendation_text: "John Carpenter and Kurt Russell created Snake Plissken, the ultimate antihero. Synth soundtrack, dystopian grit, and non-stop retro swagger.",
    mood: "Adrenaline Rush",
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    author_name: "Elena Rostova",
    author_username: "elena_cinematic",
    author_avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&q=80",
    likes_count: 38,
    user_has_liked: false
  }
];

// Local storage helper functions
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

/**
 * Hydrates profile details for a list of user IDs.
 */
async function fetchProfilesMap(userIds) {
  const profileMap = {};
  if (!isSupabaseConfigured || !supabase || !userIds || userIds.length === 0) {
    return profileMap;
  }

  const cleanIds = [...new Set(userIds.filter(Boolean))];
  if (cleanIds.length === 0) return profileMap;

  try {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url")
      .in("id", cleanIds);

    if (!error && profiles) {
      profiles.forEach((p) => {
        profileMap[p.id] = p;
      });
    }
  } catch (e) {
    console.warn("Could not batch load profiles:", e);
  }
  return profileMap;
}

// ==============================================================================
// FEATURE 1: MOVIE DISCUSSIONS
// ==============================================================================

export const DISCUSSION_CATEGORIES = [
  "All Categories",
  "General Movie Talk",
  "Favourite Characters",
  "Cinematography",
  "Screenplay and Storytelling",
  "Unforgettable Dialogue",
  "Directors and Filmmaking",
  "Movie Theories",
  "Alternative Climaxes"
];

/**
 * Fetch discussions with filters, search, likes, comments count, and author hydration.
 */
export async function fetchDiscussions({
  category = "All Categories",
  search = "",
  movieId = null,
  sortBy = "recent", // 'recent' or 'appreciated'
  currentUserId = null
} = {}) {
  let liveRows = [];
  let useFallback = false;

  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from("movie_discussions")
        .select("*")
        .order("created_at", { ascending: false });

      if (category && category !== "All Categories") {
        query = query.eq("category", category);
      }

      if (movieId) {
        query = query.eq("movie_id", Number(movieId));
      }

      const { data, error } = await query;
      if (error) {
        // Table not ready or permission error - fall back safely
        console.warn("Discussions query note (using fallback):", error.message);
        useFallback = true;
      } else if (data) {
        liveRows = data;
      }
    } catch (err) {
      console.warn("Discussions exception (using fallback):", err);
      useFallback = true;
    }
  } else {
    useFallback = true;
  }

  // Merge with local storage cache to support offline or newly added dispatches
  const localList = readLocal(DISCUSSIONS_CACHE_KEY, []);
  const combinedMap = new Map();

  // Add live Supabase rows first
  liveRows.forEach((row) => combinedMap.set(String(row.id), row));

  // Add local rows if not present
  localList.forEach((row) => {
    if (!combinedMap.has(String(row.id))) {
      combinedMap.set(String(row.id), row);
    }
  });

  // If no rows exist anywhere, supply initial seed discussions
  if (combinedMap.size === 0 && useFallback) {
    SEED_DISCUSSIONS.forEach((row) => combinedMap.set(String(row.id), row));
  }

  let allDiscussions = Array.from(combinedMap.values());

  // Batch query likes & comments for live Supabase rows
  let likesByDisc = {};
  let userLikedSet = new Set();
  let commentsByDisc = {};

  if (isSupabaseConfigured && supabase && liveRows.length > 0) {
    const discIds = liveRows.map((d) => d.id);
    try {
      const { data: likesData } = await supabase
        .from("discussion_likes")
        .select("discussion_id, user_id")
        .in("discussion_id", discIds);

      if (likesData) {
        likesData.forEach((l) => {
          likesByDisc[l.discussion_id] = (likesByDisc[l.discussion_id] || 0) + 1;
          if (currentUserId && l.user_id === currentUserId) {
            userLikedSet.add(l.discussion_id);
          }
        });
      }
    } catch (e) {
      console.warn("Could not batch load discussion likes:", e);
    }

    try {
      const { data: commsData } = await supabase
        .from("discussion_comments")
        .select("id, discussion_id")
        .in("discussion_id", discIds);

      if (commsData) {
        commsData.forEach((c) => {
          commentsByDisc[c.discussion_id] = (commentsByDisc[c.discussion_id] || 0) + 1;
        });
      }
    } catch (e) {
      console.warn("Could not batch load discussion comment counts:", e);
    }
  }

  // Local likes tracking
  const localLikes = readLocal(DISC_LIKES_CACHE_KEY, {});
  const localComments = readLocal(COMMENTS_CACHE_KEY, []);

  // Hydrate profiles for all discussion authors
  const userIds = allDiscussions.map((d) => d.user_id).filter(Boolean);
  const profilesMap = await fetchProfilesMap(userIds);

  // Normalize each discussion item
  let formatted = allDiscussions.map((item) => {
    const prof = profilesMap[item.user_id] || {};
    const localLikeInfo = localLikes[item.id] || { count: 0, users: [] };
    const localHasLiked = currentUserId ? localLikeInfo.users?.includes(currentUserId) : false;
    const localCommsCount = localComments.filter((c) => String(c.discussion_id) === String(item.id)).length;

    const baseLikes = item.likes_count || 0;
    const dbLikes = likesByDisc[item.id] || 0;
    const totalLikes = dbLikes > 0 ? dbLikes : Math.max(baseLikes, localLikeInfo.count || 0);

    const baseComms = item.comments_count || 0;
    const dbComms = commentsByDisc[item.id] || 0;
    const totalComms = dbComms > 0 ? dbComms : Math.max(baseComms, localCommsCount);

    return {
      id: String(item.id),
      user_id: item.user_id,
      title: item.title,
      content: item.content,
      category: item.category || "General Movie Talk",
      movie_id: item.movie_id ? Number(item.movie_id) : null,
      movie_title: item.movie_title || null,
      movie_poster: item.movie_poster || null,
      movie_year: item.movie_year || null,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || item.created_at || new Date().toISOString(),
      author_name: prof.full_name || item.author_name || (item.author_username ? `@${item.author_username}` : "Cinephile"),
      author_username: prof.username || item.author_username || null,
      author_avatar: prof.avatar_url || item.author_avatar || null,
      likes_count: totalLikes,
      comments_count: totalComms,
      user_has_liked: userLikedSet.has(item.id) || localHasLiked || Boolean(item.user_has_liked)
    };
  });

  // Client-side filtering
  if (category && category !== "All Categories") {
    formatted = formatted.filter(
      (d) => d.category && d.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (movieId) {
    formatted = formatted.filter((d) => Number(d.movie_id) === Number(movieId));
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    formatted = formatted.filter((d) =>
      (d.title && d.title.toLowerCase().includes(q)) ||
      (d.content && d.content.toLowerCase().includes(q)) ||
      (d.movie_title && d.movie_title.toLowerCase().includes(q)) ||
      (d.author_name && d.author_name.toLowerCase().includes(q)) ||
      (d.author_username && d.author_username.toLowerCase().includes(q))
    );
  }

  // Sorting
  if (sortBy === "appreciated") {
    formatted.sort((a, b) => b.likes_count - a.likes_count || new Date(b.created_at) - new Date(a.created_at));
  } else {
    formatted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  return formatted;
}

/**
 * Fetch a single discussion by ID with author profile and interaction flags.
 */
export async function fetchDiscussionById(discussionId, currentUserId = null) {
  if (!discussionId) return null;

  let discussion = null;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("movie_discussions")
        .select("*")
        .eq("id", discussionId)
        .maybeSingle();

      if (!error && data) {
        discussion = data;
      }
    } catch (e) {
      console.warn("fetchDiscussionById query exception:", e);
    }
  }

  if (!discussion) {
    // Check local storage or seed data
    const local = readLocal(DISCUSSIONS_CACHE_KEY, []);
    discussion = local.find((d) => String(d.id) === String(discussionId)) ||
      SEED_DISCUSSIONS.find((d) => String(d.id) === String(discussionId));
  }

  if (!discussion) return null;

  // Hydrate author profile
  const profileMap = await fetchProfilesMap([discussion.user_id]);
  const prof = profileMap[discussion.user_id] || {};

  // Hydrate likes & comments
  let likesCount = discussion.likes_count || 0;
  let userHasLiked = Boolean(discussion.user_has_liked);
  let commentsCount = discussion.comments_count || 0;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: likes } = await supabase
        .from("discussion_likes")
        .select("user_id")
        .eq("discussion_id", discussionId);

      if (likes) {
        likesCount = likes.length;
        if (currentUserId) {
          userHasLiked = likes.some((l) => l.user_id === currentUserId);
        }
      }

      const { count } = await supabase
        .from("discussion_comments")
        .select("id", { count: "exact", head: true })
        .eq("discussion_id", discussionId);

      if (typeof count === "number") {
        commentsCount = count;
      }
    } catch (e) {
      console.warn("Could not fetch discussion interaction stats:", e);
    }
  }

  // Check local likes
  const localLikes = readLocal(DISC_LIKES_CACHE_KEY, {});
  if (localLikes[discussionId]) {
    if (likesCount === 0) likesCount = localLikes[discussionId].count || 0;
    if (currentUserId && localLikes[discussionId].users?.includes(currentUserId)) {
      userHasLiked = true;
    }
  }

  return {
    id: String(discussion.id),
    user_id: discussion.user_id,
    title: discussion.title,
    content: discussion.content,
    category: discussion.category || "General Movie Talk",
    movie_id: discussion.movie_id ? Number(discussion.movie_id) : null,
    movie_title: discussion.movie_title || null,
    movie_poster: discussion.movie_poster || null,
    movie_year: discussion.movie_year || null,
    created_at: discussion.created_at || new Date().toISOString(),
    updated_at: discussion.updated_at || discussion.created_at || new Date().toISOString(),
    author_name: prof.full_name || discussion.author_name || (prof.username ? `@${prof.username}` : "Cinephile"),
    author_username: prof.username || discussion.author_username || null,
    author_avatar: prof.avatar_url || discussion.author_avatar || null,
    likes_count: likesCount,
    comments_count: commentsCount,
    user_has_liked: userHasLiked
  };
}

/**
 * Creates a new discussion dispatch.
 */
export async function createDiscussion({
  title,
  content,
  category = "General Movie Talk",
  movieId = null,
  movieTitle = null,
  moviePoster = null,
  movieYear = null,
  user
}) {
  if (!user || !user.id) {
    throw new Error("You must be signed in to create a discussion.");
  }
  if (!title || !title.trim()) {
    throw new Error("Please enter a discussion title.");
  }
  if (!content || !content.trim()) {
    throw new Error("Please write some discussion content.");
  }

  const payload = {
    user_id: user.id,
    title: title.trim(),
    content: content.trim(),
    category: category || "General Movie Talk",
    movie_id: movieId ? Number(movieId) : null,
    movie_title: movieTitle || null,
    movie_poster: moviePoster || null,
    movie_year: movieYear ? String(movieYear) : null
  };

  let savedRow = null;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("movie_discussions")
        .insert(payload)
        .select()
        .single();

      if (!error && data) {
        savedRow = data;
      } else if (error) {
        console.warn("Supabase createDiscussion notice:", error.message);
      }
    } catch (err) {
      console.warn("Supabase createDiscussion error:", err);
    }
  }

  // Fallback row if Supabase table is pending creation
  if (!savedRow) {
    savedRow = {
      id: `local-disc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ...payload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  // Update local cache
  const local = readLocal(DISCUSSIONS_CACHE_KEY, []);
  local.unshift(savedRow);
  writeLocal(DISCUSSIONS_CACHE_KEY, local);

  return {
    ...savedRow,
    author_name: user.full_name || user.name || (user.username ? `@${user.username}` : "Cinephile"),
    author_username: user.username || null,
    author_avatar: user.avatar_url || null,
    likes_count: 0,
    comments_count: 0,
    user_has_liked: false
  };
}

/**
 * Updates an existing discussion (owner only).
 */
export async function updateDiscussion(discussionId, { title, content, category }, userId) {
  if (!userId) throw new Error("Unauthorized");
  if (!title || !title.trim()) throw new Error("Title is required");
  if (!content || !content.trim()) throw new Error("Content is required");

  const updateFields = {
    title: title.trim(),
    content: content.trim(),
    category: category || "General Movie Talk",
    updated_at: new Date().toISOString()
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("movie_discussions")
        .update(updateFields)
        .eq("id", discussionId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error && error.code !== "PGRST205") {
        console.error("updateDiscussion error:", error);
      }
      if (data) return data;
    } catch (e) {
      console.warn("updateDiscussion error:", e);
    }
  }

  // Update local cache
  const local = readLocal(DISCUSSIONS_CACHE_KEY, []);
  const idx = local.findIndex((d) => String(d.id) === String(discussionId));
  if (idx !== -1) {
    local[idx] = { ...local[idx], ...updateFields };
    writeLocal(DISCUSSIONS_CACHE_KEY, local);
    return local[idx];
  }

  return { id: discussionId, ...updateFields };
}

/**
 * Deletes a discussion (owner only).
 */
export async function deleteDiscussion(discussionId, userId) {
  if (!userId) throw new Error("Unauthorized");

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from("movie_discussions")
        .delete()
        .eq("id", discussionId)
        .eq("user_id", userId);

      if (error && error.code !== "PGRST205") {
        console.error("deleteDiscussion error:", error);
      }
    } catch (e) {
      console.warn("deleteDiscussion error:", e);
    }
  }

  // Update local cache
  const local = readLocal(DISCUSSIONS_CACHE_KEY, []);
  const updated = local.filter((d) => String(d.id) !== String(discussionId));
  writeLocal(DISCUSSIONS_CACHE_KEY, updated);

  return true;
}

/**
 * Toggles like / appreciation on a discussion (reversible, prevents duplicates).
 */
export async function toggleDiscussionLike(discussionId, userId) {
  if (!userId) throw new Error("You must be signed in to appreciate a discussion.");

  let isLikedNow = false;

  if (isSupabaseConfigured && supabase) {
    try {
      // Check existing like
      const { data: existing } = await supabase
        .from("discussion_likes")
        .select("id")
        .eq("discussion_id", discussionId)
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        // Remove like
        await supabase
          .from("discussion_likes")
          .delete()
          .eq("discussion_id", discussionId)
          .eq("user_id", userId);
        isLikedNow = false;
      } else {
        // Add like
        await supabase
          .from("discussion_likes")
          .insert({ discussion_id: discussionId, user_id: userId });
        isLikedNow = true;
      }
    } catch (e) {
      console.warn("Supabase toggleDiscussionLike exception:", e);
      // Fall through to local fallback
    }
  }

  // Update local cache
  const localLikes = readLocal(DISC_LIKES_CACHE_KEY, {});
  const discInfo = localLikes[discussionId] || { count: 0, users: [] };
  const userIdx = discInfo.users.indexOf(userId);

  if (userIdx !== -1) {
    discInfo.users.splice(userIdx, 1);
    discInfo.count = Math.max(0, discInfo.count - 1);
    isLikedNow = false;
  } else {
    discInfo.users.push(userId);
    discInfo.count += 1;
    isLikedNow = true;
  }

  localLikes[discussionId] = discInfo;
  writeLocal(DISC_LIKES_CACHE_KEY, localLikes);

  return { liked: isLikedNow, count: discInfo.count };
}

// ==============================================================================
// DISCUSSION COMMENTS
// ==============================================================================

/**
 * Fetches all comments for a specific discussion.
 */
export async function fetchDiscussionComments(discussionId) {
  if (!discussionId) return [];

  let liveComments = [];

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("discussion_comments")
        .select("*")
        .eq("discussion_id", discussionId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        liveComments = data;
      }
    } catch (e) {
      console.warn("fetchDiscussionComments error:", e);
    }
  }

  // Merge with local comments
  const local = readLocal(COMMENTS_CACHE_KEY, []);
  const matchingLocal = local.filter((c) => String(c.discussion_id) === String(discussionId));

  const map = new Map();
  liveComments.forEach((c) => map.set(String(c.id), c));
  matchingLocal.forEach((c) => {
    if (!map.has(String(c.id))) map.set(String(c.id), c);
  });

  // Check seed comments
  if (map.size === 0) {
    SEED_COMMENTS
      .filter((c) => String(c.discussion_id) === String(discussionId))
      .forEach((c) => map.set(String(c.id), c));
  }

  const allComms = Array.from(map.values());
  const userIds = allComms.map((c) => c.user_id).filter(Boolean);
  const profilesMap = await fetchProfilesMap(userIds);

  return allComms
    .map((c) => {
      const prof = profilesMap[c.user_id] || {};
      return {
        id: String(c.id),
        discussion_id: String(c.discussion_id),
        user_id: c.user_id,
        content: c.content,
        created_at: c.created_at || new Date().toISOString(),
        author_name: prof.full_name || c.author_name || (prof.username ? `@${prof.username}` : "Cinephile"),
        author_username: prof.username || c.author_username || null,
        author_avatar: prof.avatar_url || c.author_avatar || null
      };
    })
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

/**
 * Creates a comment on a discussion.
 */
export async function createDiscussionComment({ discussionId, content, user }) {
  if (!user || !user.id) {
    throw new Error("You must be signed in to post a comment.");
  }
  if (!content || !content.trim()) {
    throw new Error("Comment cannot be empty.");
  }

  const payload = {
    discussion_id: discussionId,
    user_id: user.id,
    content: content.trim()
  };

  let savedRow = null;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("discussion_comments")
        .insert(payload)
        .select()
        .single();

      if (!error && data) {
        savedRow = data;
      }
    } catch (e) {
      console.warn("createDiscussionComment error:", e);
    }
  }

  if (!savedRow) {
    savedRow = {
      id: `local-comm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ...payload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  // Update local comments
  const local = readLocal(COMMENTS_CACHE_KEY, []);
  local.push(savedRow);
  writeLocal(COMMENTS_CACHE_KEY, local);

  return {
    ...savedRow,
    author_name: user.full_name || user.name || (user.username ? `@${user.username}` : "Cinephile"),
    author_username: user.username || null,
    author_avatar: user.avatar_url || null
  };
}

/**
 * Deletes a discussion comment (owner only).
 */
export async function deleteDiscussionComment(commentId, userId) {
  if (!userId) throw new Error("Unauthorized");

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from("discussion_comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", userId);
    } catch (e) {
      console.warn("deleteDiscussionComment error:", e);
    }
  }

  const local = readLocal(COMMENTS_CACHE_KEY, []);
  const updated = local.filter((c) => String(c.id) !== String(commentId));
  writeLocal(COMMENTS_CACHE_KEY, updated);

  return true;
}

// ==============================================================================
// FEATURE 2: SHARE RECOMMENDATIONS
// ==============================================================================

export const RECOMMENDATION_CATEGORIES = [
  "All Categories",
  "Cult Classics",
  "Hidden Masterpieces",
  "Underrated Gems",
  "Midnight Movies",
  "Must-Watch Films",
  "Mind-Bending Movies",
  "Feel-Good Movies",
  "Regional Cinema",
  "Personal Favourites"
];

export const RECOMMENDATION_MOODS = [
  "Late Night Nostalgia",
  "Rainy Evening",
  "Mind Bender",
  "Adrenaline Rush",
  "Date Night",
  "Weekend Marathon",
  "Comfort Watch",
  "Philosophical Deep Dive"
];

/**
 * Fetch recommendations with filters, search, likes, and author profile details.
 */
export async function fetchRecommendations({
  category = "All Categories",
  search = "",
  movieId = null,
  userId = null,
  sortBy = "recent", // 'recent' or 'appreciated'
  currentUserId = null
} = {}) {
  let liveRows = [];
  let useFallback = false;

  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from("movie_recommendations")
        .select("*")
        .order("created_at", { ascending: false });

      if (category && category !== "All Categories") {
        query = query.eq("category", category);
      }

      if (movieId) {
        query = query.eq("movie_id", Number(movieId));
      }

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;
      if (error) {
        console.warn("Recommendations query notice (using fallback):", error.message);
        useFallback = true;
      } else if (data) {
        liveRows = data;
      }
    } catch (err) {
      console.warn("Recommendations exception (using fallback):", err);
      useFallback = true;
    }
  } else {
    useFallback = true;
  }

  // Merge with local storage cache
  const localList = readLocal(RECOMMENDATIONS_CACHE_KEY, []);
  const combinedMap = new Map();

  liveRows.forEach((r) => combinedMap.set(String(r.id), r));
  localList.forEach((r) => {
    if (!combinedMap.has(String(r.id))) {
      combinedMap.set(String(r.id), r);
    }
  });

  if (combinedMap.size === 0 && useFallback) {
    SEED_RECOMMENDATIONS.forEach((r) => combinedMap.set(String(r.id), r));
  }

  let allRecs = Array.from(combinedMap.values());

  // Batch query likes
  let likesByRec = {};
  let userLikedSet = new Set();

  if (isSupabaseConfigured && supabase && liveRows.length > 0) {
    const recIds = liveRows.map((r) => r.id);
    try {
      const { data: likesData } = await supabase
        .from("recommendation_likes")
        .select("recommendation_id, user_id")
        .in("recommendation_id", recIds);

      if (likesData) {
        likesData.forEach((l) => {
          likesByRec[l.recommendation_id] = (likesByRec[l.recommendation_id] || 0) + 1;
          if (currentUserId && l.user_id === currentUserId) {
            userLikedSet.add(l.recommendation_id);
          }
        });
      }
    } catch (e) {
      console.warn("Could not batch load recommendation likes:", e);
    }
  }

  const localLikes = readLocal(REC_LIKES_CACHE_KEY, {});

  // Hydrate profiles
  const userIds = allRecs.map((r) => r.user_id).filter(Boolean);
  const profilesMap = await fetchProfilesMap(userIds);

  let formatted = allRecs.map((item) => {
    const prof = profilesMap[item.user_id] || {};
    const localLikeInfo = localLikes[item.id] || { count: 0, users: [] };
    const localHasLiked = currentUserId ? localLikeInfo.users?.includes(currentUserId) : false;

    const baseLikes = item.likes_count || 0;
    const dbLikes = likesByRec[item.id] || 0;
    const totalLikes = dbLikes > 0 ? dbLikes : Math.max(baseLikes, localLikeInfo.count || 0);

    return {
      id: String(item.id),
      user_id: item.user_id,
      movie_id: Number(item.movie_id),
      movie_title: item.movie_title || "Featured Film",
      movie_poster: item.movie_poster || null,
      movie_year: item.movie_year || "Cinema",
      category: item.category || "Underrated Gems",
      recommendation_text: item.recommendation_text || "",
      mood: item.mood || null,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || item.created_at || new Date().toISOString(),
      author_name: prof.full_name || item.author_name || (prof.username ? `@${prof.username}` : "Cinephile"),
      author_username: prof.username || item.author_username || null,
      author_avatar: prof.avatar_url || item.author_avatar || null,
      likes_count: totalLikes,
      user_has_liked: userLikedSet.has(item.id) || localHasLiked || Boolean(item.user_has_liked)
    };
  });

  // Client-side filtering
  if (category && category !== "All Categories") {
    formatted = formatted.filter(
      (r) => r.category && r.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (movieId) {
    formatted = formatted.filter((r) => Number(r.movie_id) === Number(movieId));
  }

  if (userId) {
    formatted = formatted.filter((r) => r.user_id === userId);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    formatted = formatted.filter((r) =>
      (r.movie_title && r.movie_title.toLowerCase().includes(q)) ||
      (r.recommendation_text && r.recommendation_text.toLowerCase().includes(q)) ||
      (r.mood && r.mood.toLowerCase().includes(q)) ||
      (r.category && r.category.toLowerCase().includes(q)) ||
      (r.author_name && r.author_name.toLowerCase().includes(q)) ||
      (r.author_username && r.author_username.toLowerCase().includes(q))
    );
  }

  // Sorting
  if (sortBy === "appreciated") {
    formatted.sort((a, b) => b.likes_count - a.likes_count || new Date(b.created_at) - new Date(a.created_at));
  } else {
    formatted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  return formatted;
}

/**
 * Fetch a single recommendation by ID with author profile and interaction flags.
 */
export async function fetchRecommendationById(recommendationId, currentUserId = null) {
  if (!recommendationId) return null;

  let recommendation = null;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("movie_recommendations")
        .select("*")
        .eq("id", recommendationId)
        .maybeSingle();

      if (!error && data) {
        recommendation = data;
      }
    } catch (e) {
      console.warn("fetchRecommendationById exception:", e);
    }
  }

  if (!recommendation) {
    const local = readLocal(RECOMMENDATIONS_CACHE_KEY, []);
    recommendation =
      local.find((r) => String(r.id) === String(recommendationId)) ||
      SEED_RECOMMENDATIONS.find((r) => String(r.id) === String(recommendationId));
  }

  if (!recommendation) return null;

  // Hydrate author profile
  const profileMap = await fetchProfilesMap([recommendation.user_id]);
  const prof = profileMap[recommendation.user_id] || {};

  let likesCount = recommendation.likes_count || 0;
  let userHasLiked = Boolean(recommendation.user_has_liked);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: likes } = await supabase
        .from("recommendation_likes")
        .select("user_id")
        .eq("recommendation_id", recommendationId);

      if (likes) {
        likesCount = likes.length;
        if (currentUserId) {
          userHasLiked = likes.some((l) => l.user_id === currentUserId);
        }
      }
    } catch (e) {
      console.warn("Could not fetch recommendation likes:", e);
    }
  }

  const localLikes = readLocal(REC_LIKES_CACHE_KEY, {});
  if (localLikes[recommendationId]) {
    if (likesCount === 0) likesCount = localLikes[recommendationId].count || 0;
    if (currentUserId && localLikes[recommendationId].users?.includes(currentUserId)) {
      userHasLiked = true;
    }
  }

  return {
    id: String(recommendation.id),
    user_id: recommendation.user_id,
    movie_id: Number(recommendation.movie_id),
    movie_title: recommendation.movie_title || "Featured Film",
    movie_poster: recommendation.movie_poster || null,
    movie_year: recommendation.movie_year || "Cinema",
    category: recommendation.category || "Underrated Gems",
    recommendation_text: recommendation.recommendation_text || "",
    mood: recommendation.mood || null,
    created_at: recommendation.created_at || new Date().toISOString(),
    updated_at: recommendation.updated_at || recommendation.created_at || new Date().toISOString(),
    author_name: prof.full_name || recommendation.author_name || (prof.username ? `@${prof.username}` : "Cinephile"),
    author_username: prof.username || recommendation.author_username || null,
    author_avatar: prof.avatar_url || recommendation.author_avatar || null,
    likes_count: likesCount,
    user_has_liked: userHasLiked
  };
}

/**
 * Creates a movie recommendation.
 */
export async function createRecommendation({
  movieId,
  movieTitle,
  moviePoster,
  movieYear,
  category = "Underrated Gems",
  recommendationText,
  mood = null,
  user
}) {
  if (!user || !user.id) {
    throw new Error("You must be signed in to recommend a movie.");
  }
  if (!movieId || !movieTitle) {
    throw new Error("Please select a movie to recommend.");
  }
  if (!recommendationText || !recommendationText.trim()) {
    throw new Error("Please write your personal recommendation.");
  }

  const payload = {
    user_id: user.id,
    movie_id: Number(movieId),
    movie_title: String(movieTitle).trim(),
    movie_poster: moviePoster || null,
    movie_year: movieYear ? String(movieYear) : "Cinema",
    category: category || "Underrated Gems",
    recommendation_text: recommendationText.trim(),
    mood: mood ? String(mood).trim() : null
  };

  let savedRow = null;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("movie_recommendations")
        .insert(payload)
        .select()
        .single();

      if (!error && data) {
        savedRow = data;
      } else if (error) {
        console.warn("Supabase createRecommendation error:", error.message);
      }
    } catch (err) {
      console.warn("Supabase createRecommendation exception:", err);
    }
  }

  if (!savedRow) {
    savedRow = {
      id: `local-rec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ...payload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  // Update local cache
  const local = readLocal(RECOMMENDATIONS_CACHE_KEY, []);
  local.unshift(savedRow);
  writeLocal(RECOMMENDATIONS_CACHE_KEY, local);

  return {
    ...savedRow,
    author_name: user.full_name || user.name || (user.username ? `@${user.username}` : "Cinephile"),
    author_username: user.username || null,
    author_avatar: user.avatar_url || null,
    likes_count: 0,
    user_has_liked: false
  };
}

/**
 * Updates a recommendation (owner only).
 */
export async function updateRecommendation(recommendationId, { category, recommendationText, mood }, userId) {
  if (!userId) throw new Error("Unauthorized");
  if (!recommendationText || !recommendationText.trim()) {
    throw new Error("Recommendation text cannot be empty.");
  }

  const updateFields = {
    category: category || "Underrated Gems",
    recommendation_text: recommendationText.trim(),
    mood: mood || null,
    updated_at: new Date().toISOString()
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("movie_recommendations")
        .update(updateFields)
        .eq("id", recommendationId)
        .eq("user_id", userId)
        .select()
        .single();

      if (data) return data;
      if (error && error.code !== "PGRST205") {
        console.error("updateRecommendation error:", error);
      }
    } catch (e) {
      console.warn("updateRecommendation error:", e);
    }
  }

  // Update local cache
  const local = readLocal(RECOMMENDATIONS_CACHE_KEY, []);
  const idx = local.findIndex((r) => String(r.id) === String(recommendationId));
  if (idx !== -1) {
    local[idx] = { ...local[idx], ...updateFields };
    writeLocal(RECOMMENDATIONS_CACHE_KEY, local);
    return local[idx];
  }

  return { id: recommendationId, ...updateFields };
}

/**
 * Deletes a recommendation (owner only).
 */
export async function deleteRecommendation(recommendationId, userId) {
  if (!userId) throw new Error("Unauthorized");

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from("movie_recommendations")
        .delete()
        .eq("id", recommendationId)
        .eq("user_id", userId);
    } catch (e) {
      console.warn("deleteRecommendation error:", e);
    }
  }

  const local = readLocal(RECOMMENDATIONS_CACHE_KEY, []);
  const updated = local.filter((r) => String(r.id) !== String(recommendationId));
  writeLocal(RECOMMENDATIONS_CACHE_KEY, updated);

  return true;
}

/**
 * Toggles like / appreciation on a recommendation (reversible, prevents duplicates).
 */
export async function toggleRecommendationLike(recommendationId, userId) {
  if (!userId) throw new Error("You must be signed in to appreciate a recommendation.");

  let isLikedNow = false;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: existing } = await supabase
        .from("recommendation_likes")
        .select("id")
        .eq("recommendation_id", recommendationId)
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("recommendation_likes")
          .delete()
          .eq("recommendation_id", recommendationId)
          .eq("user_id", userId);
        isLikedNow = false;
      } else {
        await supabase
          .from("recommendation_likes")
          .insert({ recommendation_id: recommendationId, user_id: userId });
        isLikedNow = true;
      }
    } catch (e) {
      console.warn("Supabase toggleRecommendationLike exception:", e);
    }
  }

  // Update local cache
  const localLikes = readLocal(REC_LIKES_CACHE_KEY, {});
  const recInfo = localLikes[recommendationId] || { count: 0, users: [] };
  const userIdx = recInfo.users.indexOf(userId);

  if (userIdx !== -1) {
    recInfo.users.splice(userIdx, 1);
    recInfo.count = Math.max(0, recInfo.count - 1);
    isLikedNow = false;
  } else {
    recInfo.users.push(userId);
    recInfo.count += 1;
    isLikedNow = true;
  }

  localLikes[recommendationId] = recInfo;
  writeLocal(REC_LIKES_CACHE_KEY, localLikes);

  return { liked: isLikedNow, count: recInfo.count };
}
