import { isSupabaseConfigured, supabase, fetchUserProfile } from "./supabase";

/**
 * Dispatches a custom event to notify all components of auth state changes.
 */
function dispatchAuthChange(user) {
  window.dispatchEvent(
    new CustomEvent("cinihubAuthChange", {
      detail: user
    })
  );
}

/**
 * Returns the currently authenticated user object from localStorage, or null.
 */
export function getUser() {
  try {
    const raw = localStorage.getItem("cinihubUser");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error("Error reading cinihubUser from localStorage:", e);
    return null;
  }
}

/**
 * Returns true if an authenticated user session exists.
 */
export function isLoggedIn() {
  return getUser() !== null;
}

/**
 * Saves authenticated user data and notifies subscribers.
 */
export function loginUser(user) {
  if (!user) return;
  localStorage.setItem("cinihubUser", JSON.stringify(user));
  dispatchAuthChange(user);
}

/**
 * Clears authenticated session and signs out of Supabase if active.
 */
export async function logoutUser() {
  localStorage.removeItem("cinihubUser");

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Supabase signOut error:", err);
    }
  }

  dispatchAuthChange(null);
}

/**
 * Updates the user's avatar_url in localStorage and notifies subscribers.
 */
export function updateUserAvatar(avatarUrl) {
  const current = getUser();
  if (!current) return null;

  const updated = {
    ...current,
    avatar_url: avatarUrl || null
  };

  localStorage.setItem("cinihubUser", JSON.stringify(updated));
  dispatchAuthChange(updated);
  return updated;
}

/**
 * Subscribes a listener callback to auth changes (custom events and cross-tab storage).
 */
export function subscribeAuth(callback) {
  const handleCustom = (e) => {
    callback(e.detail);
  };

  const handleStorage = (e) => {
    if (e.key === "cinihubUser") {
      try {
        callback(e.newValue ? JSON.parse(e.newValue) : null);
      } catch {
        callback(null);
      }
    }
  };

  window.addEventListener("cinihubAuthChange", handleCustom);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener("cinihubAuthChange", handleCustom);
    window.removeEventListener("storage", handleStorage);
  };
}

/**
 * Actively checks Supabase session and synchronizes public.profiles data.
 */
export async function restoreSession() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.warn("Session restore note:", error.message);
        return getUser();
      }

      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        const existing = getUser();
        const resolvedName =
          profile?.full_name ||
          profile?.name ||
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          existing?.name ||
          session.user.email.split("@")[0];

        const resolvedMobile =
          profile?.mobile_number ||
          profile?.mobile ||
          session.user.user_metadata?.mobile_number ||
          session.user.user_metadata?.mobile ||
          null;

        const resolvedUsername =
          profile?.username ||
          session.user.user_metadata?.username ||
          existing?.username ||
          (session.user.email ? session.user.email.split("@")[0].toLowerCase() : null);

        const resolved = {
          id: session.user.id,
          email: session.user.email,
          name: resolvedName,
          full_name: resolvedName,
          username: resolvedUsername,
          mobile_number: resolvedMobile,
          avatar_url: profile?.avatar_url ?? existing?.avatar_url ?? null
        };

        localStorage.setItem("cinihubUser", JSON.stringify(resolved));
        dispatchAuthChange(resolved);
        return resolved;
      }
    } catch (err) {
      console.warn("Session restore error:", err);
    }
  }
  return getUser();
}

// Initialize Supabase Auth state listener if configured
if (isSupabaseConfigured && supabase) {
  // Proactively restore session on startup
  restoreSession();

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (
      (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") &&
      session?.user
    ) {
      const existing = getUser();
      let profile = null;
      try {
        profile = await fetchUserProfile(session.user.id);
      } catch (err) {
        console.warn("Could not fetch user profile on auth state change:", err);
      }

      const resolvedName =
        profile?.full_name ||
        profile?.name ||
        session.user.user_metadata?.full_name ||
        session.user.user_metadata?.name ||
        existing?.name ||
        session.user.email.split("@")[0];

      const resolvedMobile =
        profile?.mobile_number ||
        profile?.mobile ||
        session.user.user_metadata?.mobile_number ||
        session.user.user_metadata?.mobile ||
        null;

      const resolvedUsername =
        profile?.username ||
        session.user.user_metadata?.username ||
        existing?.username ||
        (session.user.email ? session.user.email.split("@")[0].toLowerCase() : null);

      const resolved = {
        id: session.user.id,
        email: session.user.email,
        name: resolvedName,
        full_name: resolvedName,
        username: resolvedUsername,
        mobile_number: resolvedMobile,
        avatar_url: profile?.avatar_url ?? existing?.avatar_url ?? null
      };

      localStorage.setItem("cinihubUser", JSON.stringify(resolved));
      dispatchAuthChange(resolved);
    } else if (event === "SIGNED_OUT") {
      localStorage.removeItem("cinihubUser");
      dispatchAuthChange(null);
    }
  });
}