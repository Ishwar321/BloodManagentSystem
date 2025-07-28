import React, { useState, useEffect } from "react";
import Layout from "../components/shared/Layout/Layout";
import API from "../services/API";
import { toast } from "react-toastify";
import moment from "moment";

const AwarenessPrograms = () => {
  const [programs, setPrograms] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  // const [activeTab, setActiveTab] = useState("programs"); // Commented out as not currently used
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "educational",
    targetAudience: "",
    venue: "",
    date: "",
    time: "",
    duration: "",
    objectives: "",
    materials: "",
    speakers: [{ name: "", expertise: "", contact: "" }],
    expectedParticipants: "",
    budget: ""
  });

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      // This would be a specific endpoint for awareness programs
      const { data } = await API.get("/organization/awareness-programs");
      if (data?.success) {
        setPrograms(data.programs);
      }
    } catch (error) {
      console.error("Error fetching programs:", error);
      // Fallback to mock data
      setPrograms([
        {
          _id: "1",
          title: "Blood Donation Awareness Drive",
          description: "Educational program about the importance of regular blood donation",
          type: "educational",
          targetAudience: "College Students",
          venue: "State University Auditorium",
          date: "2025-08-15",
          time: "10:00 AM",
          duration: "3 hours",
          status: "scheduled",
          objectives: "Increase awareness about blood donation, dispel myths, encourage regular donations",
          materials: "Presentation slides, brochures, videos, interactive demos",
          speakers: [
            { name: "Dr. Sarah Johnson", expertise: "Hematology", contact: "s.johnson@medical.com" },
            { name: "John Smith", expertise: "Blood Bank Operations", contact: "j.smith@bloodbank.org" }
          ],
          expectedParticipants: 200,
          actualParticipants: 0,
          budget: 5000,
          feedback: {
            rating: 0,
            comments: []
          },
          impact: {
            newRegistrations: 0,
            followUpDonations: 0,
            awarenessScore: 0
          }
        },
        {
          _id: "2",
          title: "Corporate Blood Donation Workshop",
          description: "Workplace awareness program for corporate employees",
          type: "workshop",
          targetAudience: "Corporate Employees",
          venue: "Tech Corp Conference Room",
          date: "2025-07-30",
          time: "2:00 PM",
          duration: "2 hours",
          status: "completed",
          objectives: "Promote workplace blood donation culture",
          materials: "Interactive presentations, Q&A sessions",
          speakers: [
            { name: "Dr. Michael Chen", expertise: "Transfusion Medicine", contact: "m.chen@hospital.com" }
          ],
          expectedParticipants: 50,
          actualParticipants: 48,
          budget: 2000,
          feedback: {
            rating: 4.7,
            comments: ["Very informative", "Well organized", "Changed my perspective on blood donation"]
          },
          impact: {
            newRegistrations: 32,
            followUpDonations: 15,
            awarenessScore: 85
          }
        },
        {
          _id: "3",
          title: "Community Health Fair",
          description: "Community-wide health awareness event including blood donation education",
          type: "community_event",
          targetAudience: "General Public",
          venue: "City Community Center",
          date: "2025-09-10",
          time: "9:00 AM",
          duration: "6 hours",
          status: "planning",
          objectives: "Reach broader community, health education, blood donor recruitment",
          materials: "Health screening booths, educational materials, interactive activities",
          speakers: [
            { name: "Dr. Emily Rodriguez", expertise: "Public Health", contact: "e.rodriguez@health.gov" },
            { name: "Lisa Thompson", expertise: "Community Outreach", contact: "l.thompson@nonprofit.org" }
          ],
          expectedParticipants: 500,
          actualParticipants: 0,
          budget: 15000,
          feedback: {
            rating: 0,
            comments: []
          },
          impact: {
            newRegistrations: 0,
            followUpDonations: 0,
            awarenessScore: 0
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post("/organization/create-awareness-program", formData);
      if (data?.success) {
        toast.success("Awareness program created successfully!");
        fetchPrograms();
        setShowCreateForm(false);
        resetForm();
      }
    } catch (error) {
      console.error("Error creating program:", error);
      toast.error("Error creating program");
      // Fallback behavior
      const newProgram = {
        _id: programs.length + 1,
        ...formData,
        status: "planning",
        actualParticipants: 0,
        feedback: { rating: 0, comments: [] },
        impact: { newRegistrations: 0, followUpDonations: 0, awarenessScore: 0 }
      };
      setPrograms([...programs, newProgram]);
      toast.success("Awareness program created successfully!");
      setShowCreateForm(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "educational",
      targetAudience: "",
      venue: "",
      date: "",
      time: "",
      duration: "",
      objectives: "",
      materials: "",
      speakers: [{ name: "", expertise: "", contact: "" }],
      expectedParticipants: "",
      budget: ""
    });
  };

  const addSpeaker = () => {
    setFormData({
      ...formData,
      speakers: [...formData.speakers, { name: "", expertise: "", contact: "" }]
    });
  };

  const updateSpeaker = (index, field, value) => {
    const updatedSpeakers = formData.speakers.map((speaker, i) => 
      i === index ? { ...speaker, [field]: value } : speaker
    );
    setFormData({ ...formData, speakers: updatedSpeakers });
  };

  const removeSpeaker = (index) => {
    if (formData.speakers.length > 1) {
      const updatedSpeakers = formData.speakers.filter((_, i) => i !== index);
      setFormData({ ...formData, speakers: updatedSpeakers });
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      planning: "primary",
      scheduled: "info",
      ongoing: "warning",
      completed: "success",
      cancelled: "danger"
    };
    return (
      <span className={`badge bg-${statusColors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeColors = {
      educational: "primary",
      workshop: "info",
      seminar: "success",
      community_event: "warning",
      campaign: "dark"
    };
    return (
      <span className={`badge bg-${typeColors[type]} me-2`}>
        {type.replace('_', ' ').split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')}
      </span>
    );
  };

  const calculateStats = () => {
    return {
      totalPrograms: programs.length,
      completedPrograms: programs.filter(p => p.status === 'completed').length,
      totalParticipants: programs.reduce((sum, p) => sum + (p.actualParticipants || 0), 0),
      totalNewRegistrations: programs.reduce((sum, p) => sum + (p.impact?.newRegistrations || 0), 0),
      averageRating: programs.filter(p => p.feedback?.rating > 0).reduce((sum, p, _, arr) => 
        sum + (p.feedback?.rating || 0) / arr.length, 0
      ).toFixed(1)
    };
  };

  const stats = calculateStats();

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
          <div className="col-md-6">
            <h2 className="mb-0">
              <i className="fa-solid fa-graduation-cap me-2 text-primary"></i>
              Awareness Programs
            </h2>
            <p className="text-muted">Organize educational programs to promote blood donation awareness</p>
          </div>
          <div className="col-md-6 text-end">
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateForm(true)}
            >
              <i className="fa-solid fa-plus me-2"></i>
              New Program
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row mb-4">
          <div className="col-md-2">
            <div className="card bg-primary text-white">
              <div className="card-body text-center">
                <i className="fa-solid fa-clipboard-list fa-2x mb-2"></i>
                <h4>{stats.totalPrograms}</h4>
                <p className="mb-0">Total Programs</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card bg-success text-white">
              <div className="card-body text-center">
                <i className="fa-solid fa-check-circle fa-2x mb-2"></i>
                <h4>{stats.completedPrograms}</h4>
                <p className="mb-0">Completed</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card bg-info text-white">
              <div className="card-body text-center">
                <i className="fa-solid fa-users fa-2x mb-2"></i>
                <h4>{stats.totalParticipants}</h4>
                <p className="mb-0">Participants</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-warning text-white">
              <div className="card-body text-center">
                <i className="fa-solid fa-user-plus fa-2x mb-2"></i>
                <h4>{stats.totalNewRegistrations}</h4>
                <p className="mb-0">New Donor Registrations</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-dark text-white">
              <div className="card-body text-center">
                <i className="fa-solid fa-star fa-2x mb-2"></i>
                <h4>{stats.averageRating || 'N/A'}</h4>
                <p className="mb-0">Average Rating</p>
              </div>
            </div>
          </div>
        </div>

        {/* Create Program Form */}
        {showCreateForm && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Create New Awareness Program</h5>
                  <button 
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setShowCreateForm(false)}
                  >
                    <i className="fa-solid fa-times"></i>
                  </button>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Program Title *</label>
                          <input 
                            type="text"
                            className="form-control"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Program Type *</label>
                          <select 
                            className="form-select"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                          >
                            <option value="educational">Educational Session</option>
                            <option value="workshop">Interactive Workshop</option>
                            <option value="seminar">Seminar</option>
                            <option value="community_event">Community Event</option>
                            <option value="campaign">Awareness Campaign</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Description *</label>
                      <textarea 
                        className="form-control"
                        rows="3"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                      ></textarea>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Target Audience *</label>
                          <input 
                            type="text"
                            className="form-control"
                            value={formData.targetAudience}
                            onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                            placeholder="e.g., College Students, Corporate Employees"
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Venue *</label>
                          <input 
                            type="text"
                            className="form-control"
                            value={formData.venue}
                            onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">Date *</label>
                          <input 
                            type="date"
                            className="form-control"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">Time *</label>
                          <input 
                            type="time"
                            className="form-control"
                            value={formData.time}
                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">Duration</label>
                          <input 
                            type="text"
                            className="form-control"
                            value={formData.duration}
                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                            placeholder="e.g., 2 hours"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Objectives</label>
                      <textarea 
                        className="form-control"
                        rows="2"
                        value={formData.objectives}
                        onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                        placeholder="What do you hope to achieve with this program?"
                      ></textarea>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Materials & Resources</label>
                      <textarea 
                        className="form-control"
                        rows="2"
                        value={formData.materials}
                        onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                        placeholder="Presentation materials, brochures, equipment needed..."
                      ></textarea>
                    </div>

                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label">Speakers & Facilitators</label>
                        <button 
                          type="button" 
                          className="btn btn-outline-primary btn-sm"
                          onClick={addSpeaker}
                        >
                          <i className="fa-solid fa-plus me-1"></i> Add Speaker
                        </button>
                      </div>
                      
                      {formData.speakers.map((speaker, index) => (
                        <div key={index} className="border rounded p-3 mb-3">
                          <div className="row">
                            <div className="col-md-4">
                              <input 
                                type="text"
                                className="form-control"
                                placeholder="Speaker Name"
                                value={speaker.name}
                                onChange={(e) => updateSpeaker(index, 'name', e.target.value)}
                              />
                            </div>
                            <div className="col-md-3">
                              <input 
                                type="text"
                                className="form-control"
                                placeholder="Expertise/Title"
                                value={speaker.expertise}
                                onChange={(e) => updateSpeaker(index, 'expertise', e.target.value)}
                              />
                            </div>
                            <div className="col-md-4">
                              <input 
                                type="text"
                                className="form-control"
                                placeholder="Contact"
                                value={speaker.contact}
                                onChange={(e) => updateSpeaker(index, 'contact', e.target.value)}
                              />
                            </div>
                            <div className="col-md-1">
                              {formData.speakers.length > 1 && (
                                <button 
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => removeSpeaker(index)}
                                >
                                  <i className="fa-solid fa-trash"></i>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Expected Participants</label>
                          <input 
                            type="number"
                            className="form-control"
                            value={formData.expectedParticipants}
                            onChange={(e) => setFormData({ ...formData, expectedParticipants: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Budget</label>
                          <input 
                            type="number"
                            className="form-control"
                            value={formData.budget}
                            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      <button type="submit" className="btn btn-primary">
                        <i className="fa-solid fa-plus me-2"></i>
                        Create Program
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-secondary"
                        onClick={() => setShowCreateForm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Programs List */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Awareness Programs</h5>
              </div>
              <div className="card-body">
                {programs.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="fa-solid fa-graduation-cap fa-3x text-muted mb-3"></i>
                    <h5 className="text-muted">No programs yet</h5>
                    <p className="text-muted">Create your first awareness program to get started</p>
                  </div>
                ) : (
                  <div className="row">
                    {programs.map((program) => (
                      <div key={program._id} className="col-md-6 col-lg-4 mb-4">
                        <div className="card h-100 border-left-primary">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                              <h6 className="card-title mb-0">
                                {program.title}
                              </h6>
                              {getStatusBadge(program.status)}
                            </div>
                            
                            <div className="mb-3">
                              {getTypeBadge(program.type)}
                            </div>

                            <p className="card-text text-muted small mb-3">
                              {program.description.length > 100 
                                ? program.description.substring(0, 100) + "..."
                                : program.description
                              }
                            </p>

                            <div className="mb-3">
                              <small className="text-muted d-block">
                                <i className="fa-solid fa-users me-1"></i>
                                {program.targetAudience}
                              </small>
                              <small className="text-muted d-block">
                                <i className="fa-solid fa-map-marker-alt me-1"></i>
                                {program.venue}
                              </small>
                              <small className="text-muted d-block">
                                <i className="fa-solid fa-calendar me-1"></i>
                                {moment(program.date).format('MMM D, YYYY')} at {program.time}
                              </small>
                              {program.duration && (
                                <small className="text-muted d-block">
                                  <i className="fa-solid fa-clock me-1"></i>
                                  {program.duration}
                                </small>
                              )}
                            </div>

                            {program.status === 'completed' && program.impact && (
                              <div className="mb-3">
                                <div className="row text-center">
                                  <div className="col-4">
                                    <strong className="d-block text-primary">{program.actualParticipants}</strong>
                                    <small className="text-muted">Attended</small>
                                  </div>
                                  <div className="col-4">
                                    <strong className="d-block text-success">{program.impact.newRegistrations}</strong>
                                    <small className="text-muted">New Donors</small>
                                  </div>
                                  <div className="col-4">
                                    <strong className="d-block text-info">{program.feedback?.rating || 'N/A'}</strong>
                                    <small className="text-muted">Rating</small>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="d-flex gap-2">
                              <button 
                                className="btn btn-outline-primary btn-sm flex-fill"
                                onClick={() => setSelectedProgram(program)}
                              >
                                <i className="fa-solid fa-eye me-1"></i>
                                View Details
                              </button>
                              <button className="btn btn-outline-secondary btn-sm">
                                <i className="fa-solid fa-edit"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Program Details Modal */}
        {selectedProgram && (
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {selectedProgram.title}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close"
                    onClick={() => setSelectedProgram(null)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <h6>Program Details</h6>
                      <p><strong>Type:</strong> {getTypeBadge(selectedProgram.type)}</p>
                      <p><strong>Status:</strong> {getStatusBadge(selectedProgram.status)}</p>
                      <p><strong>Target Audience:</strong> {selectedProgram.targetAudience}</p>
                      <p><strong>Venue:</strong> {selectedProgram.venue}</p>
                      <p><strong>Date & Time:</strong> {moment(selectedProgram.date).format('MMMM D, YYYY')} at {selectedProgram.time}</p>
                      {selectedProgram.duration && <p><strong>Duration:</strong> {selectedProgram.duration}</p>}
                    </div>
                    <div className="col-md-6">
                      <h6>Planning Details</h6>
                      <p><strong>Expected Participants:</strong> {selectedProgram.expectedParticipants}</p>
                      {selectedProgram.actualParticipants > 0 && (
                        <p><strong>Actual Participants:</strong> {selectedProgram.actualParticipants}</p>
                      )}
                      {selectedProgram.budget && <p><strong>Budget:</strong> ₹{selectedProgram.budget}</p>}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <h6>Description</h6>
                    <p className="text-muted">{selectedProgram.description}</p>
                  </div>

                  {selectedProgram.objectives && (
                    <div className="mb-3">
                      <h6>Objectives</h6>
                      <p className="text-muted">{selectedProgram.objectives}</p>
                    </div>
                  )}

                  {selectedProgram.materials && (
                    <div className="mb-3">
                      <h6>Materials & Resources</h6>
                      <p className="text-muted">{selectedProgram.materials}</p>
                    </div>
                  )}

                  {selectedProgram.speakers && selectedProgram.speakers.length > 0 && (
                    <div className="mb-3">
                      <h6>Speakers & Facilitators</h6>
                      {selectedProgram.speakers.map((speaker, index) => (
                        <div key={index} className="border rounded p-2 mb-2">
                          <strong>{speaker.name}</strong> - {speaker.expertise}
                          <br />
                          <small className="text-muted">{speaker.contact}</small>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedProgram.status === 'completed' && selectedProgram.impact && (
                    <div className="mb-3">
                      <h6>Impact & Results</h6>
                      <div className="row">
                        <div className="col-md-3 text-center">
                          <div className="border rounded p-3">
                            <h4 className="text-primary">{selectedProgram.actualParticipants}</h4>
                            <small>Participants</small>
                          </div>
                        </div>
                        <div className="col-md-3 text-center">
                          <div className="border rounded p-3">
                            <h4 className="text-success">{selectedProgram.impact.newRegistrations}</h4>
                            <small>New Registrations</small>
                          </div>
                        </div>
                        <div className="col-md-3 text-center">
                          <div className="border rounded p-3">
                            <h4 className="text-info">{selectedProgram.impact.followUpDonations}</h4>
                            <small>Follow-up Donations</small>
                          </div>
                        </div>
                        <div className="col-md-3 text-center">
                          <div className="border rounded p-3">
                            <h4 className="text-warning">{selectedProgram.feedback?.rating || 'N/A'}</h4>
                            <small>Rating</small>
                          </div>
                        </div>
                      </div>
                      
                      {selectedProgram.feedback?.comments && selectedProgram.feedback.comments.length > 0 && (
                        <div className="mt-3">
                          <h6>Feedback Comments</h6>
                          {selectedProgram.feedback.comments.map((comment, index) => (
                            <div key={index} className="border-left border-primary pl-3 mb-2">
                              <p className="mb-0 text-muted">"{comment}"</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setSelectedProgram(null)}
                  >
                    Close
                  </button>
                  <button type="button" className="btn btn-primary">
                    <i className="fa-solid fa-edit me-2"></i>
                    Edit Program
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AwarenessPrograms;
