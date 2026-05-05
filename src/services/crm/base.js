import axios from "axios";
import { getToken } from "../../utils/auth";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const crmApi = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

crmApi.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

crmApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

export default crmApi;
