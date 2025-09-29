// src/utils/axios.js
import axios from "axios";

const API_BASE = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "") + "/api";

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization =token; 
  }
  return config;
}, (err) => Promise.reject(err));

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    return Promise.reject(err);
  }
);

export default api;
