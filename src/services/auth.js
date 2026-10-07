export function isLoggedIn() {
  return localStorage.getItem("cinihubUser") !== null;
}

export function loginUser(user) {
  localStorage.setItem(
    "cinihubUser",
    JSON.stringify(user)
  );
}

export function logoutUser() {
  localStorage.removeItem("cinihubUser");
}