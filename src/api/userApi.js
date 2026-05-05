import { getToken } from "../utils/auth";

const BASE = `${import.meta.env.VITE_API_URL}/api/users`;

const getAuthHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ================= GET USERS =================
export const fetchUsers = async () => {
  try {
    const res = await fetch(`${BASE}/`, {
      headers: getAuthHeader(),
    });

    if (!res.ok) throw new Error("Failed to fetch users");

    return await res.json();
  } catch (err) {
    console.error("fetchUsers error:", err);
    return [];
  }
};

// ================= CREATE USER =================
export const createUser = async (payload) => {
  try {
    const formData = buildFormData(payload);

    const res = await fetch(`${BASE}/`, {
      method: "POST",
      headers: getAuthHeader(),
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("CREATE ERROR:", errText);
      throw new Error("Create user failed");
    }

    return await res.json();
  } catch (err) {
    console.error("createUser error:", err);
  }
};

// ================= UPDATE USER =================
export const updateUser = async (id, payload) => {
  try {
    const formData = buildFormData(payload);

    let res = await fetch(`${BASE}/${id}/`, {
      method: "PUT",
      headers: getAuthHeader(),
      body: formData,
    });

    if (res.status === 405) {
      formData.append("_method", "PUT");

      res = await fetch(`${BASE}/${id}/`, {
        method: "POST",
        headers: getAuthHeader(),
        body: formData,
      });
    }

    if (!res.ok) {
      const errText = await res.text();
      console.error("UPDATE ERROR:", errText);
      throw new Error("Update failed");
    }

    return await res.json();
  } catch (err) {
    console.error("updateUser error:", err);
  }
};

// ================= DELETE USER =================
export const deleteUser = async (id) => {
  try {
    const res = await fetch(`${BASE}/${id}/`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });

    if (!res.ok) throw new Error("Delete failed");

    return await res.json();
  } catch (err) {
    console.error("deleteUser error:", err);
  }
};

// ================= FORM DATA BUILDER =================
const buildFormData = (payload) => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    // ✅ FILE HANDLING
    if (
      key === "profile_image" ||
      key === "passport_file" ||
      key === "employee_contract" ||
      key === "extra_document"
    ) {
      if (value instanceof File) {
        formData.append(key, value);
      }
      return;
    }

    // ✅ NORMAL VALUES
    formData.append(key, value);
  });

  // 🔍 DEBUG (remove later)
  for (let pair of formData.entries()) {
    console.log("FORM:", pair[0], pair[1]);
  }

  return formData;
};