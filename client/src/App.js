import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import BloodRequests from "./pages/BloodRequests";
import DonationCamps from "./pages/DonationCamps";
import Notifications from "./pages/Notifications";
import OrganizationDashboard from "./pages/OrganizationDashboard";
import EventsCampaigns from "./pages/EventsCampaigns";
import DonorNetwork from "./pages/DonorNetwork";
import HospitalPartners from "./pages/HospitalPartners";
import BloodCollection from "./pages/BloodCollection";
import ApplicationStatus from "./pages/ApplicationStatus";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import SystemMonitoring from "./pages/SystemMonitoring";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProtectedRoute from "./components/Routes/ProtectedRoute";
import PublicRoute from "./components/Routes/PublicRoute";
import GlobalErrorBoundary from "./components/shared/GlobalErrorBoundary";
import Donar from "./pages/Dashboard/Donar";
import Hospitals from "./pages/Dashboard/Hospitals";
import DonarList from "./pages/Admin/DonarList";
import HospitalList from "./pages/Admin/HospitalList";
import OrgList from "./pages/Admin/OrgList";
import AdminHome from "./pages/Admin/AdminHome";

function App() {
  return (
    <GlobalErrorBoundary>
      <div>
        <ToastContainer />
        <Routes>
        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donar-list"
          element={
            <ProtectedRoute>
              <DonarList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hospital-list"
          element={
            <ProtectedRoute>
              <HospitalList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/org-list"
          element={
            <ProtectedRoute>
              <OrgList />
            </ProtectedRoute>
          }
        />
        
        {/* New Feature Routes */}
        <Route
          path="/blood-requests"
          element={
            <ProtectedRoute>
              <BloodRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donation-camps"
          element={
            <ProtectedRoute>
              <DonationCamps />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        {/* Organization Routes */}
        <Route
          path="/organization-dashboard"
          element={
            <ProtectedRoute>
              <OrganizationDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/blood-collection"
          element={
            <ProtectedRoute>
              <BloodCollection />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events-campaigns"
          element={
            <ProtectedRoute>
              <EventsCampaigns />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donor-network"
          element={
            <ProtectedRoute>
              <DonorNetwork />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hospital-partners"
          element={
            <ProtectedRoute>
              <HospitalPartners />
            </ProtectedRoute>
          }
        />
        
        {/* Existing routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donar"
          element={
            <ProtectedRoute>
              <Donar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hospital"
          element={
            <ProtectedRoute>
              <Hospitals />
            </ProtectedRoute>
          }
        />

        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/application-status"
          element={
            <ProtectedRoute>
              <ApplicationStatus />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics-dashboard"
          element={
            <ProtectedRoute>
              <AnalyticsDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/system-monitoring"
          element={
            <ProtectedRoute>
              <SystemMonitoring />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
    </GlobalErrorBoundary>
  );
}

export default App;
