import axios from "axios";

const BASE_URL = `${import.meta.env.VITE_API_URL}/api/shifts`;

// GET all shifts
export const getShifts = () => axios.get(BASE_URL);

// CREATE shift
export const createShift = (data) => axios.post(BASE_URL, data);

// UPDATE shift
export const updateShift = (id, data) =>
  axios.put(`${BASE_URL}/${id}`, data);