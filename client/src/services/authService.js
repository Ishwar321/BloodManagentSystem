import { userLogin, userRegister } from "../redux/features/auth/authActions";
import store from "../redux/store";

export const handleLogin = (e, email, password, role) => {
  e.preventDefault();
  try {
    console.log("🔍 Form submission:", { email, role, passwordLength: password?.length }); // Debug log
    
    if (!role || !email || !password) {
      console.log("❌ Missing fields:", { role: !!role, email: !!email, password: !!password });
      return alert("Please provide all fields: role, email, and password");
    }
    
    if (!email.includes('@')) {
      return alert("Please provide a valid email address");
    }
    
    console.log("✅ Dispatching login action...");
    store.dispatch(userLogin({ email: email.trim(), password, role }));
  } catch (error) {
    console.error("❌ Login form error:", error);
    alert("Login failed. Please try again.");
  }
};

export const handleRegister = (
  e,
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
  licenseNumber
) => {
  e.preventDefault();
  try {
    // Basic validation
    if (!role || !email || !password || !phone || !address) {
      return alert("Please provide all required fields: role, email, password, phone, and address");
    }

    // Role-specific validation
    if ((role === 'donar' || role === 'admin') && !name) {
      return alert("Name is required for donors and admins");
    }

    if (role === 'organisation') {
      if (!organisationName || !registrationNumber || !organizationType) {
        return alert("Organisation name, registration number, and organization type are required");
      }
    }

    if (role === 'hospital') {
      if (!hospitalName || !licenseNumber) {
        return alert("Hospital name and license number are required");
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return alert("Please provide a valid email address");
    }

    // Password validation
    if (password.length < 6) {
      return alert("Password must be at least 6 characters long");
    }

    store.dispatch(
      userRegister({
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
      })
    );
  } catch (error) {
    console.log(error);
    alert("Registration failed. Please try again.");
  }
};
