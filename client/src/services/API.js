import axios from "axios";
import { toast } from "react-toastify";

const API = axios.create({ baseURL: process.env.REACT_APP_BASEURL });

API.interceptors.request.use((req) => {
  if (localStorage.getItem("token")) {
    req.headers.Authorization = `Bearer ${localStorage.getItem("token")}`;
  }
  return req;
});

// Response interceptor for global error handling
API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 (Unauthorized) errors
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      toast.error("Session expired. Please login again.");
    }
    
    // Handle network errors
    if (!error.response) {
      toast.error("Network error. Please check your connection.");
    }
    
    return Promise.reject(error);
  }
);

export default API;
