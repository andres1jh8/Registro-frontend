// src/api/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// Interceptor para enviar token en cada request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // asumimos que guardas el token así
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
