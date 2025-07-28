import React, { useState, useEffect, useRef } from "react";
import { BiDonateBlood, BiUserCircle } from "react-icons/bi";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../../services/API";
import "react-toastify/dist/ReactToastify.css";

const Header = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notificationRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch notifications count
  const fetchNotificationCount = async () => {
    try {
      const { data } = await API.get("/notifications/get-notifications");
      if (data?.success) {
        const unread = data.notifications.filter(notif => !notif.read).length;
        setUnreadCount(unread);
        setNotifications(data.notifications.slice(0, 5)); // Latest 5 notifications
      }
    } catch (error) {
      // Silently handle error - notifications are not critical for app function
      console.log("Error fetching notifications:", error);
      setUnreadCount(0);
      setNotifications([]);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await API.put(`/notifications/mark-read/${notificationId}`);
      fetchNotificationCount(); // Refresh count
    } catch (error) {
      console.log("Error marking notification as read:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotificationCount();
      // Refresh notifications every 30 seconds
      const interval = setInterval(fetchNotificationCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Logout handler
  const handleLogout = () => {
    localStorage.clear();
    toast.success("Logout Successfully", {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "colored",
    });
    navigate("/login");
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
        <div className="container-fluid">
          <div className="navbar-brand h1 mb-0">
            <BiDonateBlood color="red" size={30} /> 
            <span className="ms-2">Blood Bank App</span>
          </div>
          <ul className="navbar-nav flex-row ms-auto">
            <li className="nav-item mx-3 d-flex align-items-center">
              <div className="nav-link mb-0">
                <BiUserCircle size={24} className="me-2" /> 
                <span className="me-2">Welcome</span>
                <span className="fw-bold me-2">
                  {user?.name || user?.hospitalName || user?.organisationName}
                </span>
                <span className="badge bg-primary">{user?.role}</span>
              </div>
            </li>
            
            {/* Notifications Dropdown */}
            <li className="nav-item mx-2 position-relative" ref={notificationRef}>
              <div 
                className="notification-bell"
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ cursor: 'pointer' }}
              >
                <i className="fas fa-bell fs-5 text-primary"></i>
                {unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="dropdown-header">
                    <h6 className="mb-0">Notifications</h6>
                    <small className="text-muted">{unreadCount} unread</small>
                  </div>
                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div className="no-notifications">
                        <small className="text-muted">No notifications</small>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif._id}
                          className={`notification-item ${!notif.read ? 'unread' : ''}`}
                          onClick={() => {
                            if (!notif.read) markAsRead(notif._id);
                            navigate('/notifications');
                            setShowNotifications(false);
                          }}
                        >
                          <div className="notification-content">
                            <strong>{notif.title}</strong>
                            <p className="mb-1">{notif.message}</p>
                            <small className="text-muted">
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </small>
                          </div>
                          {!notif.read && <div className="unread-dot"></div>}
                        </div>
                      ))
                    )}
                  </div>
                  <div className="dropdown-footer">
                    <button 
                      className="btn btn-sm btn-primary w-100"
                      onClick={() => {
                        navigate('/notifications');
                        setShowNotifications(false);
                      }}
                    >
                      View All Notifications
                    </button>
                  </div>
                </div>
              )}
            </li>
            
            <li className="nav-item">
              <button className="btn btn-outline-danger" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt me-1"></i>
                Logout
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
};

export default Header;
