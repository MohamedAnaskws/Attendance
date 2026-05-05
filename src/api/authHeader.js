import { getToken } from "../utils/auth";

export const authHeader = () => {
  const token = getToken();

  console.log("🔐 TOKEN:", token); 

  if (!token) {
    console.error("❌ No token found");
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
    "ngrok-skip-browser-warning": "true",
  };
};