import React, { useState, useEffect } from "react";
import Layout from "../components/shared/Layout/Layout";
import API from "../services/API";
import { toast } from "react-toastify";
import moment from "moment";
// import { useSelector } from "react-redux"; // Commented out as not currently used

// Simple Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error: error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="alert alert-danger m-3">
          <h5>Something went wrong</h5>
          <p>There was an error rendering this component. Please refresh the page.</p>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Utility functions
const getLocationDisplay = (location, maxLength = 20) => {
  if (!location) return "TBD";
  if (typeof location === 'string') {
    return location.length > maxLength ? location.substring(0, maxLength) + "..." : location;
  }
  if (location.address) {
    return location.address.length > maxLength ? location.address.substring(0, maxLength) + "..." : location.address;
  }
  return "TBD";
};

const getLocationTitle = (location) => {
  if (!location) return "TBD";
  if (typeof location === 'string') return location;
  if (location.address) return location.address;
  return "TBD";
};

const formatDateForInput = (date) => {
  if (!date) return "";
  return moment(date).format("YYYY-MM-DD");
};

const EventsCampaigns = () => {
  const [activeTab, setActiveTab] = useState("campaigns");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEventDetails, setSelectedEventDetails] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [events, setEvents] = useState([]);
  const [camps, setCamps] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    targetAudience: "",
    goals: "",
    budget: "",
    type: "awareness",
    campaignSubType: "awareness" // awareness or collection
  });

  useEffect(() => {
    fetchCampaigns();
    fetchEvents();
    fetchCamps();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const { data } = await API.get("/organization/campaigns");
      console.log("Campaigns API response:", data);
      if (data?.success && Array.isArray(data.campaigns)) {
        // Ensure all data is safe for rendering
        const safeCampaigns = data.campaigns.map(campaign => ({
          ...campaign,
          title: String(campaign.title || ''),
          description: String(campaign.description || ''),
          status: String(campaign.status || 'planning'),
          reach: Number(campaign.reach) || 0
        }));
        setCampaigns(safeCampaigns);
        console.log("Set campaigns:", safeCampaigns.length);
      } else {
        console.log("No campaigns data or invalid format");
        setCampaigns([]);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      // Set empty array on error instead of mock data
      setCampaigns([]);
      toast.error("Failed to load campaigns data");
    }
  };

  const fetchEvents = async () => {
    try {
      const { data } = await API.get("/organization/events");
      console.log("Events API response:", data);
      if (data?.success && Array.isArray(data.events)) {
        // Ensure all data is safe for rendering
        const safeEvents = data.events.map(event => ({
          ...event,
          title: String(event.title || ''),
          description: String(event.description || ''),
          status: String(event.status || 'scheduled'),
          location: typeof event.location === 'object' ? event.location : { address: String(event.location || '') },
          expectedAttendees: Number(event.expectedAttendees) || 0
        }));
        setEvents(safeEvents);
        console.log("Set events:", safeEvents.length);
      } else {
        console.log("No events data or invalid format");
        setEvents([]);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]);
      toast.error("Failed to load events data");
    }
  };

  const fetchCamps = async () => {
    try {
      const { data } = await API.get("/camps/get-camps");
      if (data?.success && Array.isArray(data.camps)) {
        // Ensure all data is safe for rendering
        const safeCamps = data.camps.map(camp => ({
          ...camp,
          name: String(camp.name || ''),
          description: String(camp.description || ''),
          status: String(camp.status || 'upcoming'),
          location: typeof camp.location === 'object' ? camp.location : { address: String(camp.location || '') },
          capacity: Number(camp.capacity) || 0
        }));
        setCamps(safeCamps);
      }
    } catch (error) {
      console.error("Error fetching camps:", error);
      // Set empty camps array
      setCamps([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (activeTab === "campaigns") {
      if (formData.campaignSubType === "awareness") {
        // Create awareness campaign
        try {
          const { data } = await API.post("/organization/create-campaign", formData);
          if (data?.success) {
            toast.success("Awareness campaign created successfully!");
            fetchCampaigns(); // Refresh the list
          }
        } catch (error) {
          console.error("Error creating campaign:", error);
          const errorMessage = error.response?.data?.message || error.message || "Error creating campaign";
          toast.error(typeof errorMessage === 'string' ? errorMessage : "Error creating campaign");
          // Fallback to mock behavior
          const newCampaign = {
            id: campaigns.length + 1,
            ...formData,
            status: "planning",
            reach: 0
          };
          setCampaigns([...campaigns, newCampaign]);
          toast.success("Campaign created successfully!");
        }
      } else if (formData.campaignSubType === "collection") {
        // Create blood collection center (camp)
        if (!formData.title || !formData.description || !formData.startDate || !formData.budget) {
          toast.error("Please fill all required fields for collection center creation");
          return;
        }

        if (parseInt(formData.budget) <= 0) {
          toast.error("Capacity must be a positive number");
          return;
        }

        try {
          const campData = {
            name: formData.title,
            description: formData.description,
            date: formData.startDate,
            startTime: "09:00",
            endTime: "17:00",
            location: {
              address: formData.targetAudience || "TBD",
              city: "TBD",
              state: "TBD", 
              pincode: "000000"
            },
            capacity: parseInt(formData.budget) || 50,
            requirements: {
              equipment: [],
              staff: [],
              supplies: []
            }
          };
          
          console.log("Sending camp data:", campData); // Debug log
          
          const { data } = await API.post("/camps/create-camp", campData);
          if (data?.success) {
            toast.success("Blood collection center created successfully!");
            fetchCamps(); // Refresh the list
          }
        } catch (error) {
          console.error("Error creating collection center:", error);
          console.error("Error details:", error.response?.data); // More detailed error logging
          const errorMessage = error.response?.data?.message || error.message || "Error creating blood collection center";
          toast.error(typeof errorMessage === 'string' ? errorMessage : "Error creating blood collection center");
        }
      }
    } else if (activeTab === "events") {
      // Validate event form data
      if (!formData.title || !formData.description || !formData.startDate || !formData.targetAudience || !formData.budget) {
        toast.error("Please fill all required fields for event creation");
        return;
      }

      if (parseInt(formData.budget) <= 0) {
        toast.error("Expected attendees must be a positive number");
        return;
      }

      try {
        const eventData = {
          title: formData.title,
          description: formData.description,
          date: formData.startDate,
          startTime: "09:00",
          endTime: "17:00",
          location: { address: formData.targetAudience }, // targetAudience holds location for events
          expectedAttendees: parseInt(formData.budget) || 50, // budget holds expected attendees for events  
          type: formData.type || "blood_drive",
          requirements: {
            equipment: [],
            staff: [],
            supplies: []
          }
        };
        
        console.log("Sending event data:", eventData); // Debug log
        
        const { data } = await API.post("/organization/create-event", eventData);
        if (data?.success) {
          toast.success("Event created successfully!");
          fetchEvents(); // Refresh the list
        }
      } catch (error) {
        console.error("Error creating event:", error);
        console.error("Error details:", error.response?.data); // More detailed error logging
        const errorMessage = error.response?.data?.message || error.message || "Error creating event";
        toast.error(typeof errorMessage === 'string' ? errorMessage : "Error creating event");
        // Fallback to mock behavior
        const newEvent = {
          id: events.length + 1,
          title: formData.title,
          date: formData.startDate,
          location: formData.targetAudience,
          expectedAttendees: parseInt(formData.budget) || 50,
          status: "scheduled"
        };
        setEvents([...events, newEvent]);
        toast.success("Event created successfully!");
      }
    } else if (activeTab === "camps") {
      // Validate camp form data
      if (!formData.title || !formData.description || !formData.startDate || !formData.targetAudience || !formData.budget) {
        toast.error("Please fill all required fields for donation camp creation");
        return;
      }

      try {
        const campData = {
          name: formData.title,
          description: formData.description,
          date: formData.startDate,
          startTime: "09:00",
          endTime: "17:00",
          location: {
            address: formData.targetAudience,
            city: "TBD",
            state: "TBD", 
            pincode: "000000"
          },
          capacity: parseInt(formData.budget) || 50,
          requirements: {
            equipment: [],
            staff: [],
            supplies: []
          }
        };
        
        console.log("Sending camp data:", campData); // Debug log
        
        const { data } = await API.post("/camps/create-camp", campData);
        if (data?.success) {
          toast.success("Donation camp created successfully!");
          fetchCamps(); // Refresh the list
        }
      } catch (error) {
        console.error("Error creating camp:", error);
        console.error("Error details:", error.response?.data); // More detailed error logging
        const errorMessage = error.response?.data?.message || error.message || "Error creating donation camp";
        toast.error(typeof errorMessage === 'string' ? errorMessage : "Error creating donation camp");
      }
    }
    
    setShowCreateForm(false);
    setFormData({
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      targetAudience: "",
      goals: "",
      budget: "",
      type: "awareness",
      campaignSubType: "awareness"
    });
  };

  const handleEdit = (item, type) => {
    setIsEditing(true);
    setEditingItem({ ...item, itemType: type });
    setShowCreateForm(true);
    
    if (type === "campaign") {
      setActiveTab("campaigns");
      setFormData({
        title: item.title || "",
        description: item.description || "",
        startDate: formatDateForInput(item.startDate),
        endDate: formatDateForInput(item.endDate),
        targetAudience: "",
        goals: item.goals || "",
        budget: "",
        type: item.type || "awareness",
        campaignSubType: "awareness"
      });
    } else if (type === "event") {
      setActiveTab("events");
      setFormData({
        title: item.title || "",
        description: item.description || "",
        startDate: formatDateForInput(item.date),
        endDate: "",
        targetAudience: typeof item.location === 'string' ? item.location : item.location?.address || "",
        goals: item.notes || "",
        budget: item.expectedAttendees?.toString() || "",
        type: "awareness",
        campaignSubType: "awareness"
      });
    } else if (type === "camp") {
      setActiveTab("campaigns");
      setFormData({
        title: item.name || "",
        description: item.description || "",
        startDate: formatDateForInput(item.date),
        endDate: "",
        targetAudience: item.location?.address || "",
        goals: item.requirements ? JSON.stringify(item.requirements) : "",
        budget: item.capacity?.toString() || "",
        type: "awareness",
        campaignSubType: "collection"
      });
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!editingItem) return;

    try {
      if (editingItem.itemType === "campaign") {
        // Update campaign
        const { data } = await API.put(`/organization/campaigns/${editingItem.id}`, formData);
        if (data?.success) {
          toast.success("Campaign updated successfully!");
          fetchCampaigns();
        }
      } else if (editingItem.itemType === "event") {
        // Update event
        const eventData = {
          title: formData.title,
          description: formData.description,
          date: formData.startDate,
          location: formData.targetAudience,
          expectedAttendees: parseInt(formData.budget) || 0,
          notes: formData.goals
        };
        
        const { data } = await API.put(`/organization/events/${editingItem.id}`, eventData);
        if (data?.success) {
          toast.success("Event updated successfully!");
          fetchEvents();
        }
      } else if (editingItem.itemType === "camp") {
        // Update camp
        const campData = {
          name: formData.title,
          description: formData.description,
          date: formData.startDate,
          location: {
            address: formData.targetAudience || "TBD",
            city: "TBD",
            state: "TBD",
            pincode: "000000"
          },
          capacity: parseInt(formData.budget) || 50,
          requirements: formData.goals ? JSON.parse(formData.goals) : {
            equipment: [],
            staff: [],
            supplies: []
          }
        };
        
        const { data } = await API.put(`/camps/update-camp/${editingItem._id}`, campData);
        if (data?.success) {
          toast.success("Collection center updated successfully!");
          fetchCamps();
        }
      }
    } catch (error) {
      console.error("Error updating:", error);
      const errorMessage = error.response?.data?.message || error.message || "Error updating item. Please try again.";
      toast.error(typeof errorMessage === 'string' ? errorMessage : "Error updating item. Please try again.");
      
      // Fallback: update in local state
      if (editingItem.itemType === "campaign") {
        const updatedCampaigns = campaigns.map(campaign => 
          campaign.id === editingItem.id ? { ...campaign, ...formData } : campaign
        );
        setCampaigns(updatedCampaigns);
        toast.success("Campaign updated successfully!");
      } else if (editingItem.itemType === "event") {
        const updatedEvents = events.map(event => 
          event.id === editingItem.id ? { 
            ...event, 
            title: formData.title,
            description: formData.description,
            date: formData.startDate,
            location: formData.targetAudience,
            expectedAttendees: parseInt(formData.budget) || 0
          } : event
        );
        setEvents(updatedEvents);
        toast.success("Event updated successfully!");
      } else if (editingItem.itemType === "camp") {
        const updatedCamps = camps.map(camp => 
          camp._id === editingItem._id ? { 
            ...camp, 
            name: formData.title,
            description: formData.description,
            date: formData.startDate,
            capacity: parseInt(formData.budget) || 50,
            location: { ...camp.location, address: formData.targetAudience }
          } : camp
        );
        setCamps(updatedCamps);
        toast.success("Collection center updated successfully!");
      }
    }
    
    setShowCreateForm(false);
    setIsEditing(false);
    setEditingItem(null);
    setFormData({
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      targetAudience: "",
      goals: "",
      budget: "",
      type: "awareness",
      campaignSubType: "awareness"
    });
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      active: "success",
      planning: "warning",
      completed: "secondary",
      scheduled: "primary",
      confirmed: "success"
    };
    return (
      <span className={`badge bg-${statusColors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <ErrorBoundary>
      <Layout>
        <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="text-danger" style={{ background: 'linear-gradient(135deg, #fd7e14 0%, #e55d13 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  <i className="fas fa-bullhorn me-2" style={{ WebkitTextFillColor: '#fd7e14' }}></i>
                  Events & Campaigns
                </h2>
                <p className="text-muted">Create and manage awareness campaigns and donation events</p>
              </div>
              <button 
                className="btn" 
                style={{ background: 'linear-gradient(135deg, #fd7e14 0%, #e55d13 100%)', color: 'white' }}
                onClick={() => setShowCreateForm(true)}
              >
                <i className="fas fa-plus me-1"></i>
                Create New
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="row mb-4">
          <div className="col-xl-6 col-md-6 mb-4">
            <div className="card border-left-primary shadow h-100 py-2">
              <div className="card-body">
                <div className="row no-gutters align-items-center">
                  <div className="col mr-2">
                    <div className="text-xs font-weight-bold text-danger text-uppercase mb-1">
                      Awareness Campaigns
                    </div>
                    <div className="h5 mb-0 font-weight-bold text-gray-800">{campaigns.length + camps.length}</div>
                    <small className="text-muted">Awareness Programs & Blood Collection Centers</small>
                  </div>
                  <div className="col-auto">
                    <i className="fas fa-tint fa-2x text-gray-300"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-6 col-md-6 mb-4">
            <div className="card border-left-success shadow h-100 py-2">
              <div className="card-body">
                <div className="row no-gutters align-items-center">
                  <div className="col mr-2">
                    <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                      Educational Events
                    </div>
                    <div className="h5 mb-0 font-weight-bold text-gray-800">{events.length}</div>
                    <small className="text-muted">Community & Educational Programs</small>
                  </div>
                  <div className="col-auto">
                    <i className="fas fa-calendar-check fa-2x text-gray-300"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="row mb-4">
          <div className="col-12">
            <ul className="nav nav-pills">
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === "campaigns" ? "active" : ""}`}
                  onClick={() => setActiveTab("campaigns")}
                  style={{
                    backgroundColor: activeTab === "campaigns" ? "#007bff" : "transparent",
                    color: activeTab === "campaigns" ? "white" : "#007bff",
                    border: "1px solid #007bff",
                    marginRight: "10px"
                  }}
                >
                  <i className="fas fa-tint me-1"></i>
                  Awareness Campaigns ({campaigns.length + camps.length})
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === "events" ? "active" : ""}`}
                  onClick={() => setActiveTab("events")}
                  style={{
                    backgroundColor: activeTab === "events" ? "#28a745" : "transparent",
                    color: activeTab === "events" ? "white" : "#28a745",
                    border: "1px solid #28a745"
                  }}
                >
                  <i className="fas fa-calendar-alt me-1"></i>
                  Educational Events ({events.length})
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Awareness Campaigns Tab (includes both campaigns and camps) */}
        {activeTab === "campaigns" && (
          <div className="row">
            <div className="col-12 mb-4">
              <div className="d-flex align-items-center">
                <div className="rounded-circle p-2 me-3" style={{ background: 'linear-gradient(135deg, #fd7e14 0%, #e55d13 100%)' }}>
                  <i className="fas fa-bullhorn text-white"></i>
                </div>
                <div>
                  <h5 className="mb-0" style={{ color: '#fd7e14' }}>Awareness Campaigns</h5>
                </div>
              </div>
            </div>
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="col-md-6 mb-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body d-flex flex-column p-3">
                    <div className="text-center mb-2">
                      <div className="d-flex align-items-center justify-content-center mb-1">
                        <i className="fas fa-bullhorn me-2" style={{ color: '#fd7e14' }}></i>
                        <h6 className="card-title mb-0 fw-bold" style={{ color: '#fd7e14' }}>{campaign.title}</h6>
                      </div>
                      <div className="d-flex align-items-center justify-content-center">
                        <span className="badge me-1 small" style={{ backgroundColor: 'rgba(253, 126, 20, 0.1)', color: '#fd7e14' }}>Campaign</span>
                        {getStatusBadge(campaign.status)}
                      </div>
                    </div>
                    
                    <p className="text-muted small mb-2" style={{ minHeight: "40px", fontSize: "0.85rem" }}>
                      {campaign.description}
                    </p>
                    
                    <div className="row text-center mb-2 small">
                      <div className="col-6">
                        <div className="border-end">
                          <small className="text-muted d-block" style={{ fontSize: "0.75rem" }}>Start Date</small>
                          <div className="fw-bold small" style={{ color: '#fd7e14' }}>{moment(campaign.startDate).format("MMM DD")}</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted d-block" style={{ fontSize: "0.75rem" }}>Reach</small>
                        <div className="fw-bold text-warning small">{campaign.reach.toLocaleString()}</div>
                      </div>
                    </div>
                    
                    <div className="mt-auto">
                      <div className="d-flex gap-1">
                        <button 
                          className="btn btn-outline-primary btn-sm flex-fill py-1"
                          onClick={() => handleEdit(campaign, "campaign")}
                        >
                          <i className="fas fa-edit me-1"></i>
                          Update
                        </button>
                        <button 
                          className="btn btn-outline-success btn-sm flex-fill py-1"
                          onClick={() => {
                            // TODO: Navigate to campaign analytics
                            toast.info("Campaign analytics feature coming soon!");
                          }}
                        >
                          <i className="fas fa-chart-line me-1"></i>
                          Analytics
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {camps.map((camp) => (
              <div key={camp._id} className="col-md-6 mb-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body d-flex flex-column p-3">
                    <div className="text-center mb-2">
                      <div className="d-flex align-items-center justify-content-center mb-1">
                        <i className="fas fa-campground text-warning me-2"></i>
                        <h6 className="card-title text-warning mb-0 fw-bold">{camp.name}</h6>
                      </div>
                      <div className="d-flex align-items-center justify-content-center">
                        {getStatusBadge(camp.status)}
                      </div>
                    </div>
                    
                    <p className="text-muted small mb-2" style={{ minHeight: "40px", fontSize: "0.85rem" }}>
                      {camp.description}
                    </p>
                    
                    <div className="mb-2">
                      <div className="row text-center small">
                        <div className="col-4">
                          <div className="border-end">
                            <i className="fas fa-calendar text-primary mb-1 d-block small"></i>
                            <small className="text-muted d-block" style={{ fontSize: "0.75rem" }}>Date</small>
                            <div className="fw-bold small">{moment(camp.date).format("MMM DD")}</div>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="border-end">
                            <i className="fas fa-map-marker-alt text-danger mb-1 d-block small"></i>
                            <small className="text-muted d-block" style={{ fontSize: "0.75rem" }}>Location</small>
                            <div className="fw-bold small text-truncate" title={getLocationTitle(camp.location)}>
                              {getLocationDisplay(camp.location)}
                            </div>
                          </div>
                        </div>
                        <div className="col-4">
                          <i className="fas fa-users text-success mb-1 d-block"></i>
                          <small className="text-muted d-block">Capacity</small>
                          <div className="fw-bold small">{camp.capacity} donors</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-auto">
                      <div className="d-flex gap-2">
                        <button 
                          className="btn btn-outline-primary btn-sm flex-fill"
                          onClick={() => handleEdit(camp, "camp")}
                        >
                          <i className="fas fa-edit me-1"></i>
                          Update
                        </button>
                        <button 
                          className="btn btn-outline-danger btn-sm flex-fill"
                          onClick={() => {
                            // Navigate to blood collection page for this camp
                            window.location.href = `/blood-collection?camp=${camp._id}`;
                          }}
                        >
                          <i className="fas fa-tint me-1"></i>
                          Collect Blood
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {campaigns.length === 0 && camps.length === 0 && (
              <div className="col-12">
                <div className="text-center py-5">
                  <i className="fas fa-tint fa-3x text-muted mb-3"></i>
                  <h5>No awareness campaigns yet</h5>
                  <p className="text-muted">Create your first campaign or blood collection center to start promoting and collecting blood donations</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowCreateForm(true)}
                  >
                    <i className="fas fa-plus me-1"></i>
                    Create Awareness Campaign
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Events Tab */}
        {activeTab === "events" && (
          <div className="row">
            <div className="col-12 mb-4">
              <div className="d-flex align-items-center">
                <div className="bg-success rounded-circle p-2 me-3">
                  <i className="fas fa-calendar-check text-white"></i>
                </div>
                <div>
                  <h5 className="text-success mb-0">Educational Events</h5>
                </div>
              </div>
            </div>
            {events.map((event) => (
              <div key={event.id} className="col-md-6 mb-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body d-flex flex-column p-3">
                    <div className="text-center mb-2">
                      <div className="d-flex align-items-center justify-content-center mb-1">
                        <i className="fas fa-calendar-check text-success me-2"></i>
                        <h6 className="card-title text-success mb-0 fw-bold">{event.title}</h6>
                      </div>
                      <div className="d-flex align-items-center justify-content-center">
                        <span className="badge bg-success bg-opacity-10 text-success me-1 small">Educational Event</span>
                        {getStatusBadge(event.status)}
                      </div>
                    </div>
                    
                    <p className="text-muted small mb-2" style={{ minHeight: "40px", fontSize: "0.85rem" }}>
                      {event.description || "Educational event focused on blood donation awareness"}
                    </p>
                    
                    <div className="mb-2">
                      <div className="row text-center small">
                        <div className="col-4">
                          <div className="border-end">
                            <i className="fas fa-calendar text-primary mb-1 d-block small"></i>
                            <small className="text-muted d-block" style={{ fontSize: "0.75rem" }}>Date</small>
                            <div className="fw-bold small">{moment(event.date).format("MMM DD")}</div>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="border-end">
                            <i className="fas fa-map-marker-alt text-danger mb-1 d-block small"></i>
                            <small className="text-muted d-block" style={{ fontSize: "0.75rem" }}>Location</small>
                            <div className="fw-bold small text-truncate" title={getLocationTitle(event.location)}>
                              {getLocationDisplay(event.location)}
                            </div>
                          </div>
                        </div>
                        <div className="col-4">
                          <i className="fas fa-users text-info mb-1 d-block"></i>
                          <small className="text-muted d-block">Attendees</small>
                          <div className="fw-bold small">{event.expectedAttendees} expected</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-auto">
                      <div className="d-flex gap-2">
                        <button 
                          className="btn btn-outline-primary btn-sm flex-fill"
                          onClick={() => handleEdit(event, "event")}
                        >
                          <i className="fas fa-edit me-1"></i>
                          Update
                        </button>
                        <button 
                          className="btn btn-outline-info btn-sm flex-fill"
                          onClick={() => {
                            setSelectedEventDetails(event);
                            setShowDetailsModal(true);
                          }}
                        >
                          <i className="fas fa-info-circle me-1"></i>
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="col-12">
                <div className="text-center py-5">
                  <i className="fas fa-calendar-check fa-3x text-muted mb-3"></i>
                  <h5>No events yet</h5>
                  <p className="text-muted">Create your first event to start organizing educational and community activities</p>
                  <button 
                    className="btn btn-success"
                    onClick={() => {setActiveTab("events"); setShowCreateForm(true);}}
                  >
                    <i className="fas fa-plus me-1"></i>
                    Create Event
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fas fa-plus me-2"></i>
                    {isEditing ? "Update" : "Create New"} Activity
                  </h5>
                  <button 
                    className="btn-close"
                    onClick={() => {
                      setShowCreateForm(false);
                      setIsEditing(false);
                      setEditingItem(null);
                      setFormData({
                        title: "",
                        description: "",
                        startDate: "",
                        endDate: "",
                        targetAudience: "",
                        goals: "",
                        budget: "",
                        type: "awareness",
                        campaignSubType: "awareness"
                      });
                    }}
                  ></button>
                </div>
                <form onSubmit={isEditing ? handleUpdate : handleSubmit}>
                  <div className="modal-body">
                    {/* Type Selection */}
                    {!isEditing && (
                      <div className="mb-4">
                        <label className="form-label fw-bold">What would you like to create? *</label>
                        <div className="row">
                          <div className="col-md-6">
                            <div 
                              className={`card h-100 ${activeTab === "campaigns" ? "border-primary" : "border"}`}
                              onClick={() => setActiveTab("campaigns")}
                              style={{ cursor: "pointer", backgroundColor: activeTab === "campaigns" ? "#e3f2fd" : "white" }}
                            >
                              <div className="card-body text-center p-3">
                                <i className={`fas fa-tint fa-2x mb-2 ${activeTab === "campaigns" ? "text-primary" : "text-muted"}`}></i>
                                <h6 className={`card-title ${activeTab === "campaigns" ? "text-primary" : ""}`}>Awareness Campaign</h6>
                                <small className="text-muted">Awareness programs & collection centers</small>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div 
                              className={`card h-100 ${activeTab === "events" ? "border-success" : "border"}`}
                              onClick={() => setActiveTab("events")}
                              style={{ cursor: "pointer", backgroundColor: activeTab === "events" ? "#e8f5e8" : "white" }}
                            >
                              <div className="card-body text-center p-3">
                                <i className={`fas fa-calendar-check fa-2x mb-2 ${activeTab === "events" ? "text-success" : "text-muted"}`}></i>
                                <h6 className={`card-title ${activeTab === "events" ? "text-success" : ""}`}>Educational Event</h6>
                                <small className="text-muted">One-time educational programs</small>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Editing Info */}
                    {isEditing && (
                      <div className="alert alert-info mb-4">
                        <div className="d-flex">
                          <i className="fas fa-edit fa-lg me-3 mt-1"></i>
                          <div>
                            <strong>Updating {editingItem?.itemType === "campaign" ? "Campaign" : editingItem?.itemType === "event" ? "Event" : "Collection Center"}</strong>
                            <p className="mb-0 mt-1">You are editing an existing item. The type cannot be changed.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Selected Type Info */}
                    <div className={`alert ${activeTab === "campaigns" ? "alert-primary" : "alert-success"} mb-4`}>
                      <div className="d-flex">
                        <i className={`fas ${activeTab === "campaigns" ? "fa-tint" : "fa-calendar-check"} fa-lg me-3 mt-1`}></i>
                        <div>
                          <strong>
                            {activeTab === "campaigns" ? "Awareness Campaign" : "Educational Event"} 
                            - Best used for:
                          </strong>
                          <ul className="mb-0 mt-1">
                            {activeTab === "campaigns" ? (
                              <>
                                <li>Social media promotion and community awareness</li>
                                <li>Blood collection drives and mobile blood units</li>
                                <li>Corporate partnerships and emergency collections</li>
                              </>
                            ) : (
                              <>
                                <li>Health awareness seminars and community gatherings</li>
                                <li>Educational workshops and volunteer training</li>
                                <li>Public health programs and community education</li>
                              </>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Campaign Sub-Type Selection (only show for campaigns) */}
                    {activeTab === "campaigns" && !isEditing && (
                      <div className="mb-4">
                        <label className="form-label fw-bold">Type of Awareness Campaign *</label>
                        <div className="row">
                          <div className="col-md-6">
                            <div 
                              className={`card h-100 ${formData.campaignSubType === "awareness" ? "border-primary" : "border"}`}
                              onClick={() => setFormData({...formData, campaignSubType: "awareness"})}
                              style={{ cursor: "pointer", backgroundColor: formData.campaignSubType === "awareness" ? "#e3f2fd" : "white" }}
                            >
                              <div className="card-body text-center p-3">
                                <i className={`fas fa-bullhorn fa-2x mb-2 ${formData.campaignSubType === "awareness" ? "text-primary" : "text-muted"}`}></i>
                                <h6 className={`card-title ${formData.campaignSubType === "awareness" ? "text-primary" : ""}`}>Awareness Campaign</h6>
                                <small className="text-muted">Promote blood donation awareness</small>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div 
                              className={`card h-100 ${formData.campaignSubType === "collection" ? "border-warning" : "border"}`}
                              onClick={() => setFormData({...formData, campaignSubType: "collection"})}
                              style={{ cursor: "pointer", backgroundColor: formData.campaignSubType === "collection" ? "#fff3cd" : "white" }}
                            >
                              <div className="card-body text-center p-3">
                                <i className={`fas fa-campground fa-2x mb-2 ${formData.campaignSubType === "collection" ? "text-warning" : "text-muted"}`}></i>
                                <h6 className={`card-title ${formData.campaignSubType === "collection" ? "text-warning" : ""}`}>Collection Center</h6>
                                <small className="text-muted">Physical blood collection point</small>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Title *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">
                          {activeTab === "campaigns" ? 
                            (formData.campaignSubType === "awareness" ? "Campaign Type" : "Location") : 
                            "Location"}
                        </label>
                        {activeTab === "campaigns" ? (
                          formData.campaignSubType === "awareness" ? (
                            <select
                              className="form-select"
                              value={formData.type}
                              onChange={(e) => setFormData({...formData, type: e.target.value})}
                            >
                              <option value="awareness">Awareness</option>
                              <option value="corporate">Corporate</option>
                              <option value="social">Social Media</option>
                              <option value="community">Community</option>
                            </select>
                          ) : (
                            <input
                              type="text"
                              className="form-control"
                              value={formData.targetAudience}
                              onChange={(e) => setFormData({...formData, targetAudience: e.target.value})}
                              placeholder="Collection center location"
                            />
                          )
                        ) : (
                          <input
                            type="text"
                            className="form-control"
                            value={formData.targetAudience}
                            onChange={(e) => setFormData({...formData, targetAudience: e.target.value})}
                            placeholder="Event location"
                          />
                        )}
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                      ></textarea>
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">
                          {activeTab === "campaigns" ? "Start Date" : activeTab === "events" ? "Event Date" : "Camp Date"} *
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          value={formData.startDate}
                          onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                          required
                        />
                      </div>
                      {activeTab === "campaigns" && formData.campaignSubType === "awareness" && (
                        <div className="col-md-6 mb-3">
                          <label className="form-label">End Date</label>
                          <input
                            type="date"
                            className="form-control"
                            value={formData.endDate}
                            onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                          />
                        </div>
                      )}
                      {(activeTab === "events" || (activeTab === "campaigns" && formData.campaignSubType === "collection")) && (
                        <div className="col-md-6 mb-3">
                          <label className="form-label">
                            {activeTab === "events" ? "Expected Attendees" : "Capacity (Max Donors)"}
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            value={formData.budget}
                            onChange={(e) => setFormData({...formData, budget: e.target.value})}
                            placeholder={activeTab === "events" ? "Number of expected attendees" : "Maximum number of donors"}
                          />
                        </div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label className="form-label">
                        {activeTab === "campaigns" ? 
                          (formData.campaignSubType === "awareness" ? "Goals & Objectives" : "Requirements & Notes") : 
                          "Additional Notes"}
                      </label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={formData.goals}
                        onChange={(e) => setFormData({...formData, goals: e.target.value})}
                        placeholder={activeTab === "campaigns" ? 
                          (formData.campaignSubType === "awareness" ? "What do you want to achieve?" : "Equipment, staff, or supply requirements") : 
                          "Any special requirements or notes"}
                      ></textarea>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowCreateForm(false);
                        setIsEditing(false);
                        setEditingItem(null);
                        setFormData({
                          title: "",
                          description: "",
                          startDate: "",
                          endDate: "",
                          targetAudience: "",
                          goals: "",
                          budget: "",
                          type: "awareness",
                          campaignSubType: "awareness"
                        });
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {isEditing ? "Update" : "Create"} {activeTab === "campaigns" ? 
                        (formData.campaignSubType === "awareness" ? "Awareness Campaign" : "Collection Center") : 
                        "Educational Event"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      {showDetailsModal && selectedEventDetails && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-info text-white">
                <h5 className="modal-title">
                  <i className="fas fa-calendar-check me-2"></i>
                  Event Details
                </h5>
                <button 
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedEventDetails(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-12">
                    <h6 className="text-primary mb-3">{selectedEventDetails.title}</h6>
                  </div>
                </div>
                
                <div className="row mb-3">
                  <div className="col-sm-6">
                    <div className="d-flex align-items-center mb-2">
                      <i className="fas fa-calendar text-primary me-2"></i>
                      <div>
                        <small className="text-muted d-block">Date</small>
                        <strong>{moment(selectedEventDetails.date).format("MMMM DD, YYYY")}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="d-flex align-items-center mb-2">
                      <i className="fas fa-map-marker-alt text-danger me-2"></i>
                      <div>
                        <small className="text-muted d-block">Location</small>
                        <strong>{getLocationTitle(selectedEventDetails.location)}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-sm-6">
                    <div className="d-flex align-items-center mb-2">
                      <i className="fas fa-users text-success me-2"></i>
                      <div>
                        <small className="text-muted d-block">Expected Attendees</small>
                        <strong>{selectedEventDetails.expectedAttendees || 'Not specified'}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="d-flex align-items-center mb-2">
                      <i className="fas fa-check-circle text-info me-2"></i>
                      <div>
                        <small className="text-muted d-block">Status</small>
                        <span className="badge bg-success">{selectedEventDetails.status || 'Scheduled'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-12">
                    <div className="mb-2">
                      <i className="fas fa-file-text text-warning me-2"></i>
                      <small className="text-muted">Description</small>
                    </div>
                    <div className="bg-light p-3 rounded">
                      <p className="mb-0">{selectedEventDetails.description || 'No description available'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedEventDetails(null);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
    </ErrorBoundary>
  );
};

export default EventsCampaigns;
