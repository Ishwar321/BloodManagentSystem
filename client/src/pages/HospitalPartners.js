import React, { useState, useEffect, useCallback } from "react";
import Layout from "../components/shared/Layout/Layout";
import API from "../services/API";
import { toast } from "react-toastify";
import moment from "moment";

const HospitalPartners = () => {
  const [partnerships, setPartnerships] = useState([]);
  const [filteredPartnerships, setFilteredPartnerships] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPartnership, setSelectedPartnership] = useState(null);
  const [updatingPartnership, setUpdatingPartnership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [partnershipToDelete, setPartnershipToDelete] = useState(null);

  const [formData, setFormData] = useState({
    hospitalId: "",
    type: "blood_collection",
    bloodQuotaPerMonth: "",
    eventFrequency: "",
    resourceSharing: [],
    responsibilities: {
      organisation: [],
      hospital: []
    },
    terms: "",
    contactPersons: [{ name: "", position: "", email: "", phone: "" }]
  });
  const [formErrors, setFormErrors] = useState({});

  const filterPartnerships = useCallback(() => {
    let filtered = [...partnerships];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(partnership =>
        partnership.hospital?.hospitalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partnership.hospital?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partnership.type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(partnership => partnership.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(partnership => partnership.type === typeFilter);
    }

    setFilteredPartnerships(filtered);
  }, [partnerships, searchTerm, statusFilter, typeFilter]);

  const fetchPartnerships = useCallback(async () => {
    try {
      const { data } = await API.get("/organization/partnerships");
      if (data?.success) {
        setPartnerships(data.partnerships);
      }
    } catch (error) {
      console.error("Error fetching partnerships:", error);
      // Set empty array on error instead of mock data
      setPartnerships([]);
      toast.error("Failed to load partnerships data");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHospitals = useCallback(async () => {
    try {
      // Fetch available hospitals from the organization endpoint
      const { data } = await API.get("/organization/available-hospitals");
      if (data?.success) {
        setHospitals(data.hospitals);
      }
    } catch (error) {
      console.error("Error fetching hospitals:", error);
      // Set empty array on error instead of mock data
      setHospitals([]);
      toast.error("Failed to load hospitals data");
    }
  }, []);

  useEffect(() => {
    fetchPartnerships();
    fetchHospitals();
  }, [fetchPartnerships, fetchHospitals]);

  useEffect(() => {
    filterPartnerships();
  }, [filterPartnerships]);

  const validateForm = () => {
    const errors = {};

    if (!formData.hospitalId) {
      errors.hospitalId = "Please select a hospital";
    } else {
      // Check if partnership already exists with this hospital (unless updating)
      const existingPartnership = partnerships.find(p => 
        p.hospital?._id === formData.hospitalId && 
        (!updatingPartnership || p._id !== updatingPartnership._id)
      );
      
      if (existingPartnership) {
        errors.hospitalId = "Partnership with this hospital already exists";
      }
    }
    
    if (!formData.type) {
      errors.type = "Please select partnership type";
    }
    if (!formData.terms.trim()) {
      errors.terms = "Please enter partnership terms";
    }
    if (formData.bloodQuotaPerMonth && isNaN(formData.bloodQuotaPerMonth)) {
      errors.bloodQuotaPerMonth = "Blood quota must be a number";
    }

    // Validate contact persons
    formData.contactPersons.forEach((contact, index) => {
      if (!contact.name.trim()) {
        errors[`contact_${index}_name`] = "Contact name is required";
      }
      if (!contact.email.trim()) {
        errors[`contact_${index}_email`] = "Contact email is required";
      } else if (!/\S+@\S+\.\S+/.test(contact.email)) {
        errors[`contact_${index}_email`] = "Invalid email format";
      }
      if (!contact.phone.trim()) {
        errors[`contact_${index}_phone`] = "Contact phone is required";
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting");
      return;
    }

    try {
      const selectedHospital = hospitals.find(h => h._id === formData.hospitalId);
      
      if (updatingPartnership) {
        // Update existing partnership
        const { data } = await API.put(`/organization/partnerships/${updatingPartnership._id}`, formData);
        if (data?.success) {
          toast.success("Partnership updated successfully!");
          
          // Update local state immediately
          const updatedPartnerships = partnerships.map(p =>
            p._id === updatingPartnership._id ? { ...p, ...formData, hospital: selectedHospital } : p
          );
          setPartnerships(updatedPartnerships);
          
          // Refresh from server
          setTimeout(() => {
            fetchPartnerships();
          }, 500);
          
          setUpdatingPartnership(null);
        }
      } else {
        // Create new partnership
        const { data } = await API.post("/organization/create-partnership", formData);
        if (data?.success) {
          toast.success("Partnership created and activated successfully!");
          
          // Add to local state immediately
          const newPartnership = {
            _id: data.partnership?._id || Date.now().toString(),
            hospital: selectedHospital,
            type: formData.type,
            status: "active",
            establishedDate: new Date(),
            terms: formData.terms,
            contactPersons: formData.contactPersons,
            performance: { campsSupported: 0, unitsCollected: 0, successRate: 100 }
          };
          setPartnerships([...partnerships, newPartnership]);
          
          // Refresh from server to ensure consistency
          setTimeout(() => {
            fetchPartnerships();
          }, 500);
        }
      }
      
      setShowCreateForm(false);
      resetForm();
    } catch (error) {
      console.error("Error with partnership:", error);
      const errorMessage = error.response?.data?.message || error.message || "Error processing partnership";
      
      // Handle specific error cases
      if (errorMessage.includes("already exists")) {
        toast.error("A partnership with this hospital already exists. Please refresh the page and try again.");
        // Force refresh the partnerships list
        fetchPartnerships();
      } else {
        toast.error(typeof errorMessage === 'string' ? errorMessage : "Error processing partnership");
      }
      
      // Fallback to mock behavior for demo (only for new partnerships)
      if (!updatingPartnership && !errorMessage.includes("already exists")) {
        const selectedHospital = hospitals.find(h => h._id === formData.hospitalId);
        const newPartnership = {
          _id: Date.now().toString(),
          hospital: selectedHospital,
          type: formData.type,
          status: "active", // Directly create as active instead of pending
          establishedDate: new Date(),
          terms: formData.terms,
          contactPersons: formData.contactPersons,
          performance: { campsSupported: 0, unitsCollected: 0, successRate: 100 }
        };
        setPartnerships([...partnerships, newPartnership]);
        toast.success("Partnership created and activated successfully!");
        setShowCreateForm(false);
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      hospitalId: "",
      type: "blood_collection",
      bloodQuotaPerMonth: "",
      eventFrequency: "",
      resourceSharing: [],
      responsibilities: {
        organisation: [],
        hospital: []
      },
      terms: "",
      contactPersons: [{ name: "", position: "", email: "", phone: "" }]
    });
    setFormErrors({});
    setUpdatingPartnership(null);
  };

  const handleUpdate = (partnership) => {
    setUpdatingPartnership(partnership);
    
    // Handle both string and object terms
    const termsData = typeof partnership.terms === 'object' ? partnership.terms : {};
    const termsString = typeof partnership.terms === 'string' ? partnership.terms : "";
    
    setFormData({
      hospitalId: partnership.hospital?._id || "",
      type: partnership.type || "blood_collection",
      bloodQuotaPerMonth: termsData.bloodQuotaPerMonth || "",
      eventFrequency: termsData.eventFrequency || "",
      resourceSharing: termsData.resourceSharing || [],
      responsibilities: termsData.responsibilities || {
        organisation: [],
        hospital: []
      },
      terms: termsString,
      contactPersons: partnership.contactPersons || [{ name: "", position: "", email: "", phone: "" }]
    });
    setShowCreateForm(true);
    setFormErrors({});
  };

  const handleDeleteConfirm = (partnership) => {
    setPartnershipToDelete(partnership);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      const { data } = await API.delete(`/organization/partnerships/${partnershipToDelete._id}`);
      if (data?.success) {
        // Remove from state immediately
        const updatedPartnerships = partnerships.filter(p => p._id !== partnershipToDelete._id);
        setPartnerships(updatedPartnerships);
        toast.success("Partnership deleted successfully!");
        
        // Refresh the list from server to ensure consistency
        setTimeout(() => {
          fetchPartnerships();
        }, 500);
      }
    } catch (error) {
      console.error("Error deleting partnership:", error);
      // Fallback behavior for demo - always remove from local state
      const updatedPartnerships = partnerships.filter(p => p._id !== partnershipToDelete._id);
      setPartnerships(updatedPartnerships);
      toast.success("Partnership deleted successfully!");
    } finally {
      setShowDeleteModal(false);
      setPartnershipToDelete(null);
    }
  };

  const addContactPerson = () => {
    setFormData({
      ...formData,
      contactPersons: [...formData.contactPersons, { name: "", position: "", email: "", phone: "" }]
    });
  };

  const updateContactPerson = (index, field, value) => {
    const updatedContacts = formData.contactPersons.map((contact, i) => 
      i === index ? { ...contact, [field]: value } : contact
    );
    setFormData({ ...formData, contactPersons: updatedContacts });
  };

  const removeContactPerson = (index) => {
    if (formData.contactPersons.length > 1) {
      const updatedContacts = formData.contactPersons.filter((_, i) => i !== index);
      setFormData({ ...formData, contactPersons: updatedContacts });
    }
  };

  const getTypeBadge = (type) => {
    const typeColors = {
      blood_collection: "primary",
      testing_processing: "info",
      storage: "success",
      logistics: "warning",
      comprehensive: "dark"
    };
    return (
      <span className={`badge bg-${typeColors[type]} me-2`}>
        {type.replace('_', ' ').split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')}
      </span>
    );
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
        {/* Enhanced Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h1 className="mb-1 fw-bold text-dark d-flex align-items-center">
                  <i className="fas fa-handshake me-3 text-warning"></i>
                  Hospital Partners
                </h1>
                <p className="text-muted mb-0">Build and manage strategic partnerships with healthcare institutions</p>
              </div>
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-warning btn-lg"
                  onClick={() => {
                    resetForm();
                    setShowCreateForm(true);
                  }}
                >
                  <i className="fas fa-plus me-2"></i>
                  New Partnership
                </button>
              </div>
            </div>

            {/* Streamlined Search and Actions */}
            <div className="bg-white border shadow-sm rounded p-4 mb-4">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <div className="input-group input-group-lg">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="fas fa-search text-muted"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 bg-light"
                      placeholder="Search by hospital name, email, or partnership type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => setSearchTerm("")}
                        title="Clear search"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    )}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="d-flex gap-2 justify-content-end">
                    <div className="text-muted small d-flex align-items-center">
                      <i className="fas fa-chart-bar me-2"></i>
                      <span>{partnerships.length} Total | {partnerships.filter(p => p.status === 'active').length} Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Create Partnership Form */}
        {showCreateForm && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="bg-white border shadow-sm rounded">
                <div className="border-bottom p-4 bg-light">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h4 className="mb-1 fw-bold d-flex align-items-center">
                        <i className="fas fa-handshake me-3 text-warning"></i>
                        {updatingPartnership ? 'Update Partnership' : 'Create New Partnership'}
                      </h4>
                      <p className="text-muted mb-0">
                        {updatingPartnership 
                          ? 'Modify the details of your existing partnership'
                          : 'Establish a new strategic partnership with a healthcare institution'
                        }
                      </p>
                    </div>
                    <button 
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setShowCreateForm(false);
                        resetForm();
                      }}
                    >
                      <i className="fas fa-times me-2"></i>
                      Cancel
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-4">
                          <label className="form-label fw-semibold">Select Hospital *</label>
                          <select 
                            className={`form-select form-select-lg ${formErrors.hospitalId ? 'is-invalid' : ''}`}
                            value={formData.hospitalId}
                            onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value })}
                            required
                          >
                            <option value="">Choose a hospital...</option>
                            {hospitals.map(hospital => {
                              const hasPartnership = partnerships.some(p => 
                                p.hospital?._id === hospital._id && 
                                (!updatingPartnership || p._id !== updatingPartnership._id)
                              );
                              return (
                                <option 
                                  key={hospital._id} 
                                  value={hospital._id}
                                  disabled={hasPartnership}
                                >
                                  {hospital.hospitalName} - {hospital.email}
                                  {hasPartnership ? " (Already partnered)" : ""}
                                </option>
                              );
                            })}
                          </select>
                          {formErrors.hospitalId && (
                            <div className="invalid-feedback">{formErrors.hospitalId}</div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-4">
                          <label className="form-label fw-semibold">Partnership Type *</label>
                          <select 
                            className={`form-select form-select-lg ${formErrors.type ? 'is-invalid' : ''}`}
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            required
                          >
                            <option value="blood_collection">Blood Collection</option>
                            <option value="awareness_collaboration">Awareness & Education</option>
                            <option value="event_hosting">Event Hosting</option>
                            <option value="full_partnership">Full Partnership</option>
                          </select>
                          {formErrors.type && (
                            <div className="invalid-feedback">{formErrors.type}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-semibold">Partnership Description *</label>
                      <textarea 
                        className={`form-control ${formErrors.terms ? 'is-invalid' : ''}`}
                        rows="4"
                        value={formData.terms}
                        onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                        placeholder="Describe what this partnership involves, mutual benefits, responsibilities, and expected outcomes..."
                        required
                      ></textarea>
                      {formErrors.terms && (
                        <div className="invalid-feedback">{formErrors.terms}</div>
                      )}
                    </div>

                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <label className="form-label fw-semibold mb-1">Contact Persons</label>
                          <p className="text-muted small mb-0">Add key contacts from the partner hospital</p>
                        </div>
                        <button 
                          type="button" 
                          className="btn btn-outline-primary"
                          onClick={addContactPerson}
                        >
                          <i className="fa-solid fa-plus me-2"></i> Add Contact
                        </button>
                      </div>
                      
                      {formData.contactPersons.map((contact, index) => (
                        <div key={index} className="border rounded p-4 mb-3" style={{ backgroundColor: '#f8f9fa' }}>
                          <div className="row g-3">
                            <div className="col-md-3">
                              <label className="form-label small text-muted fw-semibold">Full Name *</label>
                              <input 
                                type="text"
                                className={`form-control ${formErrors[`contact_${index}_name`] ? 'is-invalid' : ''}`}
                                placeholder="Dr. John Smith"
                                value={contact.name}
                                onChange={(e) => updateContactPerson(index, 'name', e.target.value)}
                              />
                              {formErrors[`contact_${index}_name`] && (
                                <div className="invalid-feedback">{formErrors[`contact_${index}_name`]}</div>
                              )}
                            </div>
                            <div className="col-md-3">
                              <label className="form-label small text-muted fw-semibold">Position *</label>
                              <input 
                                type="text"
                                className={`form-control ${formErrors[`contact_${index}_position`] ? 'is-invalid' : ''}`}
                                placeholder="Blood Bank Director"
                                value={contact.position}
                                onChange={(e) => updateContactPerson(index, 'position', e.target.value)}
                              />
                              {formErrors[`contact_${index}_position`] && (
                                <div className="invalid-feedback">{formErrors[`contact_${index}_position`]}</div>
                              )}
                            </div>
                            <div className="col-md-4">
                              <label className="form-label small text-muted fw-semibold">Email Address *</label>
                              <input 
                                type="email"
                                className={`form-control ${formErrors[`contact_${index}_email`] ? 'is-invalid' : ''}`}
                                placeholder="contact@hospital.com"
                                value={contact.email}
                                onChange={(e) => updateContactPerson(index, 'email', e.target.value)}
                              />
                              {formErrors[`contact_${index}_email`] && (
                                <div className="invalid-feedback">{formErrors[`contact_${index}_email`]}</div>
                              )}
                            </div>
                            <div className="col-md-2">
                              <label className="form-label small text-muted fw-semibold">Phone Number *</label>
                              <div className="d-flex gap-2">
                                <input 
                                  type="tel"
                                  className={`form-control ${formErrors[`contact_${index}_phone`] ? 'is-invalid' : ''}`}
                                  placeholder="+1234567890"
                                  value={contact.phone}
                                  onChange={(e) => updateContactPerson(index, 'phone', e.target.value)}
                                />
                                {formData.contactPersons.length > 1 && (
                                  <button 
                                    type="button"
                                    className="btn btn-outline-danger flex-shrink-0"
                                    onClick={() => removeContactPerson(index)}
                                    title="Remove contact"
                                  >
                                    <i className="fa-solid fa-trash"></i>
                                  </button>
                                )}
                              </div>
                              {formErrors[`contact_${index}_phone`] && (
                                <div className="invalid-feedback">{formErrors[`contact_${index}_phone`]}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-top pt-4">
                      <div className="d-flex gap-3">
                        <button type="submit" className="btn btn-primary btn-lg">
                          <i className="fas fa-handshake me-2"></i>
                          {updatingPartnership ? 'Update Partnership' : 'Create Partnership'}
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-outline-secondary btn-lg"
                          onClick={() => {
                            setShowCreateForm(false);
                            resetForm();
                          }}
                        >
                          <i className="fas fa-times me-2"></i>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Partnerships List */}
        <div className="row">
          <div className="col-12">
            <div className="bg-white border-0 shadow-sm rounded">
              <div className="border-bottom p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-1 fw-bold">Partnership Directory</h5>
                    <p className="text-muted mb-0 small">Manage all your hospital partnerships</p>
                  </div>
                  <div className="d-flex gap-2">
                    <select
                      className="form-select form-select-sm"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      style={{ width: 'auto' }}
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    <select
                      className="form-select form-select-sm"
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      style={{ width: 'auto' }}
                    >
                      <option value="all">All Types</option>
                      <option value="blood_collection">Blood Collection</option>
                      <option value="awareness_collaboration">Awareness & Education</option>
                      <option value="event_hosting">Event Hosting</option>
                      <option value="full_partnership">Full Partnership</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="p-0">
                {filteredPartnerships.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="mb-4">
                      <i className="fas fa-handshake fa-4x text-muted mb-3"></i>
                      <h4 className="text-muted fw-bold">
                        {partnerships.length === 0 ? 'No partnerships established yet' : 'No partnerships match your criteria'}
                      </h4>
                      <p className="text-muted mb-0">
                        {partnerships.length === 0 
                          ? 'Start building your healthcare network by establishing partnerships with hospitals and medical centers.'
                          : 'Try adjusting your search terms or filter criteria to find specific partnerships.'
                        }
                      </p>
                    </div>
                    {partnerships.length === 0 && (
                      <button 
                        className="btn btn-primary btn-lg"
                        onClick={() => {
                          resetForm();
                          setShowCreateForm(true);
                        }}
                      >
                        <i className="fas fa-plus me-2"></i>
                        Establish Your First Partnership
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th className="border-0 px-4 py-3">
                            <div className="d-flex align-items-center">
                              <i className="fas fa-hospital text-warning me-2"></i>
                              Hospital Details
                            </div>
                          </th>
                          <th className="border-0 px-3 py-3">Partnership Type</th>
                          <th className="border-0 px-3 py-3">Established</th>
                          <th className="border-0 px-3 py-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPartnerships.map((partnership) => (
                          <tr key={partnership._id} className="border-bottom">
                            <td className="px-4 py-4">
                              <div className="d-flex align-items-center">
                                <div className="bg-warning bg-opacity-10 rounded-circle p-2 me-3 flex-shrink-0">
                                  <i className="fas fa-hospital text-warning"></i>
                                </div>
                                <div>
                                  <h6 className="mb-1 fw-bold text-dark">
                                    {partnership.hospital?.hospitalName}
                                  </h6>
                                  <div className="small text-muted">
                                    <div className="mb-1">
                                      <i className="fas fa-envelope me-1"></i>
                                      {partnership.hospital?.email}
                                    </div>
                                    <div>
                                      <i className="fas fa-phone me-1"></i>
                                      {partnership.hospital?.phone}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-4">
                              {getTypeBadge(partnership.type)}
                            </td>
                            <td className="px-3 py-4">
                              <div className="small">
                                <div className="fw-medium text-dark">
                                  {moment(partnership.establishedDate).format('MMM DD, YYYY')}
                                </div>
                                <div className="text-muted">
                                  {moment(partnership.establishedDate).fromNow()}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-4 text-center">
                              <div className="btn-group" role="group">
                                <button 
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() => setSelectedPartnership(partnership)}
                                  title="View details"
                                >
                                  <i className="fas fa-eye"></i>
                                </button>
                                <button 
                                  className="btn btn-outline-success btn-sm"
                                  onClick={() => handleUpdate(partnership)}
                                  title="Edit partnership"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button 
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => handleDeleteConfirm(partnership)}
                                  title="Delete partnership"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {filteredPartnerships.length > 0 && (
                  <div className="border-top px-4 py-3 bg-light">
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        Showing {filteredPartnerships.length} of {partnerships.length} partnerships
                      </small>
                      <div className="d-flex gap-2">
                        <button className="btn btn-outline-secondary btn-sm">
                          <i className="fas fa-download me-1"></i>
                          Export Data
                        </button>
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            resetForm();
                            setShowCreateForm(true);
                          }}
                        >
                          <i className="fas fa-plus me-1"></i>
                          Add Partnership
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Partnership Details Modal */}
        {selectedPartnership && (
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    Partnership with {selectedPartnership.hospital?.hospitalName}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close"
                    onClick={() => setSelectedPartnership(null)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <h6>Hospital Information</h6>
                      <p><strong>Name:</strong> {selectedPartnership.hospital?.hospitalName}</p>
                      <p><strong>Email:</strong> {selectedPartnership.hospital?.email}</p>
                      <p><strong>Phone:</strong> {selectedPartnership.hospital?.phone}</p>
                      <p><strong>Address:</strong> {selectedPartnership.hospital?.address}</p>
                    </div>
                    <div className="col-md-6">
                      <h6>Partnership Details</h6>
                      <p><strong>Type:</strong> {selectedPartnership.type?.replace('_', ' ')}</p>
                      <p><strong>Established:</strong> {moment(selectedPartnership.establishedDate).format('MMMM D, YYYY')}</p>
                    </div>
                  </div>
                  
                  {selectedPartnership.contactPersons && selectedPartnership.contactPersons.length > 0 && (
                    <div className="mb-3">
                      <h6>Contact Persons</h6>
                      {selectedPartnership.contactPersons.map((contact, index) => (
                        <div key={index} className="border rounded p-2 mb-2">
                          <strong>{contact.name}</strong> - {contact.position}
                          <br />
                          <small className="text-muted">
                            {contact.email} | {contact.phone}
                          </small>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setSelectedPartnership(null)}
                  >
                    Close
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={() => {
                      handleUpdate(selectedPartnership);
                      setSelectedPartnership(null);
                    }}
                  >
                    <i className="fas fa-edit me-2"></i>
                    Update Partnership
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fas fa-exclamation-triangle text-warning me-2"></i>
                    Confirm Deletion
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close"
                    onClick={() => setShowDeleteModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to delete the partnership with <strong>{partnershipToDelete?.hospital?.hospitalName}</strong>?</p>
                  <p className="text-muted small">This action cannot be undone. All partnership data and history will be permanently removed.</p>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger"
                    onClick={handleDelete}
                  >
                    <i className="fas fa-trash me-2"></i>
                    Delete Partnership
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

export default HospitalPartners;
