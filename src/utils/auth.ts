import Cookies from "js-cookie";

// ================= SET AUTH =================
export const setAuth = (data: { access_token: string; user: any }) => {
  const token = data.access_token;
  const user = data.user;

  Cookies.set("access_token", token, { expires: 1 });
  Cookies.set("user", JSON.stringify(user), { expires: 1 });
  localStorage.setItem("access_token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

// ================= GET TOKEN =================
export const getToken = (): string | undefined => {
  return (
    Cookies.get("access_token") ||
    localStorage.getItem("access_token") ||
    undefined
  );
};

// ================= GET USER =================
export const getUser = (): any | null => {
  try {
    const cookieUser = Cookies.get("user");
    if (cookieUser) return JSON.parse(cookieUser);
    const lsUser = localStorage.getItem("user");
    return lsUser ? JSON.parse(lsUser) : null;
  } catch {
    return null;
  }
};

// ================= GET ROLE =================
export const getRoleId = (): number | null => {
  return getUser()?.roleid || null;
};

// ================= CHECK AUTH =================
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// ================= LOGOUT =================
export const logout = (): void => {
  Cookies.remove("access_token");
  Cookies.remove("user");
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
  localStorage.removeItem("last_conversation_id");
  window.location.href = "/";
};
