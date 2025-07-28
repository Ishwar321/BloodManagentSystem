import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/auth/authSlice"; // Correct import

const store = configureStore({
  reducer: {
    auth: authReducer, // Use the correct export
  },
});

export default store;
