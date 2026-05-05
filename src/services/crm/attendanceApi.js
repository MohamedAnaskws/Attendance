import { authHeader } from "../../api/authHeader";

const BASE = `${import.meta.env.VITE_API_URL}/api/attendance`;

const handleResponse = async (res) => {
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
};

// ================= CHECK IN =================
export const checkIn = async () => {
  const res = await fetch(`${BASE}/check-in`, {
    method: "POST",
    headers: authHeader(),
  });

  return handleResponse(res);
};

// ================= CHECK OUT =================
export const checkOut = async () => {
  const res = await fetch(`${BASE}/check-out`, {
    method: "POST",
    headers: authHeader(),
  });

  return handleResponse(res);
};

// ================= BREAK START =================
export const breakStart = async () => {
  const res = await fetch(`${BASE}/break-start`, {
    method: "POST",
    headers: authHeader(),
  });

  return handleResponse(res);
};

// ================= BREAK END =================
export const breakEnd = async () => {
  const res = await fetch(`${BASE}/break-end`, {
    method: "POST",
    headers: authHeader(),
  });

  return handleResponse(res);
};

// ================= CURRENT STATUS =================
export const getAttendance = async () => {
  const res = await fetch(`${BASE}/current-status`, {
    method: "GET",
    headers: authHeader(),
  });

  return handleResponse(res);
};