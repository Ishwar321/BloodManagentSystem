import React, { useState, useEffect, useCallback } from "react";
import Layout from "../components/shared/Layout/Layout";
import API from "../services/API";
import { toast } from "react-toastify";
import moment from "moment";
import { useSelector } from "react-redux";

const Notifications = () => {
  const { user } = useSelector((state) => state.auth);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState("all");

  // Form state for creating notifications (Admin only)
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "announcement",
    targetAudience: "all",
    priority: "medium",
    criteria: {
      bloodGroup: [],
      location: { city: "", state: "" },
    },
  });

  const getNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/notifications/get-notifications?unreadOnly=${filter === "unread"}`);
      if (data?.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.log(error);
      toast.error("Error fetching notifications");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const markAsRead = async (notificationId) => {
    try {
      await API.put(`/notifications/mark-read/${notificationId}`);
      getNotifications();
    } catch (error) {
      console.log(error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data } = await API.put("/notifications/mark-all-read");
      if (data?.success) {
        toast.success("All notifications marked as read");
        getNotifications();
      }
    } catch (error) {
      toast.error("Error marking notifications as read");
    }
  };

  const createNotification = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data } = await API.post("/notifications/create", formData);
      if (data?.success) {
        toast.success(`Notification sent to ${data.recipientCount} users!`);
        setShowCreateForm(false);
        setFormData({
          title: "",
          message: "",
          type: "announcement",
          targetAudience: "all",
          priority: "medium",
          criteria: { bloodGroup: [], location: { city: "", state: "" } },
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error creating notification");
    } finally {
      setLoading(false);
    }
  };

  const sendDonationReminders = async () => {
    try {
      const { data } = await API.post("/notifications/send-reminders");
      if (data?.success) {
        toast.success(`Donation reminders sent to ${data.count} eligible donors!`);
      }
    } catch (error) {
      toast.error("Error sending reminders");
    }
  };

  useEffect(() => {
    getNotifications();
  }, [getNotifications]);

  const getNotificationIcon = (type) => {
    const icons = {
      donation_reminder: "fa-heart",
      blood_request: "fa-droplet",
      camp_invitation: "fa-calendar",
      announcement: "fa-bullhorn",
      approval: "fa-check-circle",
      rejection: "fa-times-circle",
      alert: "fa-exclamation-triangle",
      emergency: "fa-ambulance",
    };
    return icons[type] || "fa-bell";
  };

  const getPriorityBadge = (priority) => {
    const priorityClasses = {
      low: "bg-success",
      medium: "bg-warning",
      high: "bg-danger",
      urgent: "bg-dark",
    };
    return `badge ${priorityClasses[priority] || "bg-secondary"}`;
  };

  return (
    <Layout>
      <div className="container">
        <div className="d-flex justify-content-between align-items-center my-4">
          <div>
            <h2>
              Notifications
              {unreadCount > 0 && (
                <span className="badge bg-danger ms-2">{unreadCount}</span>
              )}
            </h2>
          </div>
          <div>
            {user?.role === "admin" && (
              <>
                <button
                  className="btn btn-info me-2"
                  onClick={sendDonationReminders}
                >
                  <i className="fa-solid fa-paper-plane"></i> Send Reminders
                </button>
                <button
                  className="btn btn-primary me-2"
                  onClick={() => setShowCreateForm(!showCreateForm)}
                >
                  <i className="fa-solid fa-plus"></i> Create Notification
                </button>
              </>
            )}
            {unreadCount > 0 && (
              <button className="btn btn-secondary" onClick={markAllAsRead}>
                Mark All Read
              </button>
            )}
          </div>
        </div>

        {/* Filter */}
        <div className="row mb-4">
          <div className="col-md-6">
            <select
              className="form-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread Only</option>
            </select>
          </div>
        </div>

        {/* Create Notification Form (Admin Only) */}
        {showCreateForm && user?.role === "admin" && (
          <div className="card mb-4">
            <div className="card-header">
              <h5>Create Notification</h5>
            </div>
            <div className="card-body">
              <form onSubmit={createNotification}>
                <div className="row">
                  <div className="col-md-6">
                    <label className="form-label">Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Type *</label>
                    <select
                      className="form-select"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      required
                    >
                      <option value="announcement">Announcement</option>
                      <option value="alert">Alert</option>
                      <option value="emergency">Emergency</option>
                      <option value="donation_reminder">Donation Reminder</option>
                      <option value="camp_invitation">Camp Invitation</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="form-label">Message *</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  ></textarea>
                </div>

                <div className="row mt-3">
                  <div className="col-md-6">
                    <label className="form-label">Target Audience</label>
                    <select
                      className="form-select"
                      value={formData.targetAudience}
                      onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    >
                      <option value="all">All Users</option>
                      <option value="donors">Donors Only</option>
                      <option value="hospitals">Hospitals Only</option>
                      <option value="organizations">Organizations Only</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-select"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Sending..." : "Send Notification"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary ms-2"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="card">
          <div className="card-body">
            {loading ? (
              <div className="text-center">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center text-muted">
                <i className="fa-solid fa-bell-slash fa-3x mb-3"></i>
                <p>No notifications found</p>
              </div>
            ) : (
              <div className="list-group list-group-flush">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`list-group-item ${
                      !notification.isRead ? "bg-light border-start border-primary border-3" : ""
                    }`}
                    style={{ cursor: "pointer" }}
                    onClick={() => !notification.isRead && markAsRead(notification._id)}
                  >
                    <div className="d-flex w-100 justify-content-between">
                      <div className="d-flex align-items-start">
                        <i className={`fa-solid ${getNotificationIcon(notification.type)} me-3 mt-1`}></i>
                        <div>
                          <h6 className="mb-1">
                            {notification.title}
                            {!notification.isRead && (
                              <span className="badge bg-primary ms-2">New</span>
                            )}
                          </h6>
                          <p className="mb-1">{notification.message}</p>
                          <small className="text-muted">
                            {moment(notification.createdAt).fromNow()}
                          </small>
                        </div>
                      </div>
                      <div>
                        <span className={getPriorityBadge(notification.priority)}>
                          {notification.priority.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Notifications;
