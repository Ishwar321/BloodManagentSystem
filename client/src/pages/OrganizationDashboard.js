import React, { useState, useEffect } from "react";
import Layout from "../components/shared/Layout/Layout";
import API from "../services/API";
import { toast } from "react-toastify";
import moment from "moment";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const OrganizationDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([
    {
      id: 'default-1',
      title: "Default Blood Drive",
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      location: "Default Location",
      expectedDonors: 50,
    }
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/organization/dashboard");
      if (data?.success) {
        // Dashboard data loaded successfully

        // Process recent activities from camps and events
        const activities = [];
        
        // Add camp activities
        if (data.data.recentActivities?.camps) {
          data.data.recentActivities.camps.forEach(camp => {
            activities.push({
              id: camp._id,
              activity: `Blood Donation Camp: ${camp.name || 'Camp Event'}`,
              location: camp.location?.address || "Location TBD",
              date: new Date(camp.date || camp.createdAt),
              impact: `${camp.registeredDonors?.length || 0} donors registered`,
            });
          });
        }

        // Add event activities
        if (data.data.recentActivities?.events) {
          data.data.recentActivities.events.forEach(event => {
            activities.push({
              id: event._id,
              activity: `Event: ${event.title}`,
              location: event.location?.address || event.location || "Location TBD",
              date: new Date(event.date || event.createdAt),
              impact: `${event.expectedAttendees || 0} expected attendees`,
            });
          });
        }

        setRecentActivities(activities.slice(0, 5)); // Limit to 5 most recent

        // Process upcoming events
        if (data.data.upcomingEvents && Array.isArray(data.data.upcomingEvents) && data.data.upcomingEvents.length > 0) {
          setUpcomingEvents(data.data.upcomingEvents.map(event => ({
            id: event._id,
            title: event.title || event.name,
            date: new Date(event.date),
            location: event.location?.address || event.location || "Location TBD",
            expectedDonors: event.expectedAttendees || event.expectedDonors || 0,
          })));
        } else {
          // No upcoming events available
          setUpcomingEvents([]);
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setRecentActivities([]);
      setUpcomingEvents([]);
      toast.error("Error fetching dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="text-danger">
                  <i className="fas fa-home me-2"></i>
                  Organization Home
                </h2>
                <p className="text-muted">
                  Welcome back, {user?.organisationName}! Track your impact and manage activities.
                </p>
              </div>
              <div>
                <button 
                  className="btn btn-danger me-2"
                  onClick={() => navigate('/events-campaigns')}
                >
                  <i className="fas fa-plus me-1"></i>
                  Create Campaign
                </button>
                <button 
                  className="btn btn-outline-danger"
                  onClick={() => navigate('/events-campaigns')}
                >
                  <i className="fas fa-calendar-plus me-1"></i>
                  Schedule Event
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Overview */}
        <div className="row mb-4">
          <div className="col-md-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-danger text-white">
                <h5 className="mb-0 text-white">
                  <i className="fas fa-chart-bar me-2"></i>
                  Organization Impact Overview
                </h5>
              </div>
              <div className="card-body">
                <div className="row text-center">
                  <div className="col-md-3 mb-3">
                    <div className="p-3 border-end">
                      <div className="d-flex flex-column align-items-center">
                        <div className="bg-success bg-opacity-10 rounded-circle p-3 mb-2">
                          <i className="fas fa-heart text-success fa-2x"></i>
                        </div>
                        <h4 className="text-success mb-1">Active</h4>
                        <p className="text-muted mb-0 small">Organization Status</p>
                        <span className="badge bg-success mt-1">Operational</span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="p-3 border-end">
                      <div className="d-flex flex-column align-items-center">
                        <div className="bg-info bg-opacity-10 rounded-circle p-3 mb-2">
                          <i className="fas fa-calendar-check text-info fa-2x"></i>
                        </div>
                        <h4 className="text-info mb-1">Ready</h4>
                        <p className="text-muted mb-0 small">Campaign Planning</p>
                        <button 
                          className="btn btn-outline-info btn-sm mt-1"
                          onClick={() => navigate('/events-campaigns')}
                        >
                          <i className="fas fa-plus me-1"></i>
                          Start
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="p-3 border-end">
                      <div className="d-flex flex-column align-items-center">
                        <div className="bg-warning bg-opacity-10 rounded-circle p-3 mb-2">
                          <i className="fas fa-handshake text-warning fa-2x"></i>
                        </div>
                        <h4 className="text-warning mb-1">Expand</h4>
                        <p className="text-muted mb-0 small">Hospital Network</p>
                        <button 
                          className="btn btn-outline-warning btn-sm mt-1"
                          onClick={() => navigate('/hospital-partners')}
                        >
                          <i className="fas fa-plus me-1"></i>
                          Partner
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="p-3">
                      <div className="d-flex flex-column align-items-center">
                        <div className="bg-primary bg-opacity-10 rounded-circle p-3 mb-2">
                          <i className="fas fa-users text-primary fa-2x"></i>
                        </div>
                        <h4 className="text-primary mb-1">Growing</h4>
                        <p className="text-muted mb-0 small">Donor Community</p>
                        <button 
                          className="btn btn-outline-danger btn-sm mt-1"
                          onClick={() => navigate('/donor-network')}
                        >
                          <i className="fas fa-eye me-1"></i>
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="row mb-4">
          <div className="col-md-4 mb-3">
            <div className="card border-0 shadow-sm text-white h-100" style={{ background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)' }}>
              <div className="card-body text-center">
                <div className="mb-3">
                  <i className="fas fa-bullhorn fa-3x" style={{ opacity: 0.8 }}></i>
                </div>
                <h5 className="text-white mb-2">Campaign Management</h5>
                <p className="mb-3" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Create and manage awareness campaigns to reach more donors</p>
                <button 
                  className="btn btn-light btn-sm"
                  onClick={() => navigate('/events-campaigns')}
                >
                  <i className="fas fa-rocket me-1"></i>
                  Launch Campaign
                </button>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card border-0 shadow-sm text-white h-100" style={{ background: 'linear-gradient(135deg, #fd7e14 0%, #e55d13 100%)' }}>
              <div className="card-body text-center">
                <div className="mb-3">
                  <i className="fas fa-calendar-plus fa-3x" style={{ opacity: 0.8 }}></i>
                </div>
                <h5 className="text-white mb-2">Event Organization</h5>
                <p className="mb-3" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Schedule blood donation camps and community events</p>
                <button 
                  className="btn btn-light btn-sm"
                  onClick={() => navigate('/blood-collection')}
                >
                  <i className="fas fa-calendar me-1"></i>
                  Schedule Event
                </button>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card border-0 shadow-sm text-white h-100" style={{ background: 'linear-gradient(135deg, #6f42c1 0%, #5a3299 100%)' }}>
              <div className="card-body text-center">
                <div className="mb-3">
                  <i className="fas fa-network-wired fa-3x" style={{ opacity: 0.8 }}></i>
                </div>
                <h5 className="text-white mb-2">Partnership Network</h5>
                <p className="mb-3" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Build strategic partnerships with healthcare institutions</p>
                <button 
                  className="btn btn-light btn-sm"
                  onClick={() => navigate('/hospital-partners')}
                >
                  <i className="fas fa-handshake me-1"></i>
                  Build Network
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          {/* Recent Activities */}
          <div className="col-md-8 mb-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-bottom">
                <h5 className="mb-0">
                  <i className="fas fa-activity me-2"></i>
                  Recent Activities
                </h5>
              </div>
              <div className="card-body">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="d-flex align-items-start mb-3 pb-3 border-bottom">
                      <div className="flex-shrink-0">
                        <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center" 
                             style={{ width: '40px', height: '40px' }}>
                          <i className="fas fa-calendar text-white"></i>
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <h6 className="mb-1">{activity.activity}</h6>
                        <p className="text-muted mb-1">
                          <i className="fas fa-map-marker-alt me-1"></i>
                          {activity.location}
                        </p>
                        <small className="text-success">
                          <i className="fas fa-chart-line me-1"></i>
                          {activity.impact}
                        </small>
                        <div className="text-muted small mt-1">
                          {moment(activity.date).fromNow()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-5">
                    <div className="text-muted">
                      <i className="fas fa-calendar fa-4x mb-3 text-muted"></i>
                      <h5 className="text-muted">No Activities Yet</h5>
                      <p className="mb-3">Your recent campaigns and events will appear here</p>
                      <button 
                        className="btn btn-danger"
                        onClick={() => navigate('/events-campaigns')}
                      >
                        <i className="fas fa-plus me-2"></i>
                        Create Your First Campaign
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="col-md-4 mb-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-bottom">
                <h5 className="mb-0">
                  <i className="fas fa-calendar-alt me-2"></i>
                  Upcoming Events
                </h5>
              </div>
              <div className="card-body">
                {console.log('Upcoming events state:', upcomingEvents)}
                {upcomingEvents && upcomingEvents.length > 0 ? (
                  <>
                    {upcomingEvents.map((event) => (
                      <div key={event.id} className="mb-3 p-3 bg-light rounded">
                        <h6 className="text-danger mb-2">{event.title}</h6>
                        <p className="mb-1 small">
                          <i className="fas fa-calendar me-1"></i>
                          {moment(event.date).format("MMM DD, YYYY")}
                        </p>
                        <p className="mb-1 small">
                          <i className="fas fa-map-marker-alt me-1"></i>
                          {event.location}
                        </p>
                        <small className="text-success">
                          <i className="fas fa-users me-1"></i>
                          Expected: {event.expectedDonors} donors
                        </small>
                      </div>
                    ))}
                    <button 
                      className="btn btn-outline-danger btn-sm w-100 mt-2"
                      onClick={() => navigate('/events-campaigns')}
                    >
                      <i className="fas fa-plus me-1"></i>
                      Add Event
                    </button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-muted">
                      <i className="fas fa-calendar-plus fa-3x mb-3 text-muted"></i>
                      <h6 className="text-muted">No Events Scheduled</h6>
                      <p className="small mb-3">Schedule your first event to get started</p>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => navigate('/events-campaigns')}
                      >
                        <i className="fas fa-plus me-1"></i>
                        Schedule Event
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Organization Resources */}
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-bottom">
                <h5 className="mb-0">
                  <i className="fas fa-info-circle me-2"></i>
                  Organization Resources
                </h5>
              </div>
              <div className="card-body">
                <div className="row text-center">
                  <div className="col-md-6 mb-3">
                    <div className="p-3">
                      <i className="fas fa-users-cog fa-2x text-danger mb-2"></i>
                      <h6>Donor Management</h6>
                      <p className="text-muted small">View and manage your donor network</p>
                      <button 
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => navigate('/donor-network')}
                      >
                        <i className="fas fa-eye me-1"></i>
                        View Donors
                      </button>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="p-3">
                      <i className="fas fa-hospital fa-2x text-warning mb-2"></i>
                      <h6>Hospital Partnerships</h6>
                      <p className="text-muted small">Manage hospital partnerships and collaborations</p>
                      <button 
                        className="btn btn-outline-warning btn-sm"
                        onClick={() => navigate('/hospital-partners')}
                      >
                        <i className="fas fa-handshake me-1"></i>
                        View Partners
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrganizationDashboard;
