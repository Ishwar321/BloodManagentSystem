import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../../services/API";
import { toast } from "react-toastify";

export const userLogin = createAsyncThunk(
  "auth/login",
  async ({ role, email, password }, { rejectWithValue }) => {
    try {
      console.log("🚀 Login attempt:", { role, email }); // Debug log
      
      const { data } = await API.post("/auth/login", { role, email, password });
      
      console.log("📨 Login response:", data); // Debug log
      
      // Store token
      if (data.success) {
        localStorage.setItem("token", data.token);
        toast.success(data.message);
        
        // Role-based redirection
        let redirectPath = "/";
        if (data.user?.role === "admin") {
          redirectPath = "/admin";
        } else if (data.user?.role === "organisation") {
          redirectPath = "/";
        } else if (data.user?.role === "hospital") {
          redirectPath = "/";
        } else if (data.user?.role === "donar") {
          redirectPath = "/";
        }
        
        console.log("🔄 Redirecting to:", redirectPath);
        
        setTimeout(() => {
          window.location.replace(redirectPath);
        }, 1000);
        return data;
      } else {
        toast.error(data.message || "Login failed");
        return rejectWithValue(data.message || "Login failed");
      }
    } catch (error) {
      console.error("❌ Login error:", error); // Debug log
      const errorMessage = error.response?.data?.message || "Login failed";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

//register
export const userRegister = createAsyncThunk(
  "auth/register",
  async (
    {
      name,
      role,
      email,
      password,
      phone,
      organisationName,
      address,
      hospitalName,
      website,
      registrationNumber,
      organizationType,
      licenseNumber,
    },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await API.post("/auth/register", {
        name,
        role,
        email,
        password,
        phone,
        organisationName,
        address,
        hospitalName,
        website,
        registrationNumber,
        organizationType,
        licenseNumber,
      });

      if (data.success) {
        toast.success(data.message);
        // Delay redirect to show toast
        setTimeout(() => {
          window.location.replace("/login");
        }, 1500);
        return data;
      } else {
        toast.error(data.message || "Registration failed");
        return rejectWithValue(data.message || "Registration failed");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Registration failed";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

//current user
export const getCurrentUser = createAsyncThunk(
  "auth/getCurrentUser",
  async (_, { rejectWithValue }) => {
    // ✅ Fix: No destructuring in first parameter
    try {
      const res = await API.get("/auth/current-user");
      if (res?.data) {
        return res?.data;
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch current user"
      ); // ✅ Updated error message
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);
