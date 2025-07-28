import React, { useState, useEffect } from "react";
import Layout from "../components/shared/Layout/Layout";
import API from "../services/API";
import { toast } from "react-toastify";
import moment from "moment";
import { AdminGlobalStyles } from "../styles/AdminStyles";

const BloodCollection = () => {
  const [collections, setCollections] = useState([]);
  const [donors, setDonors] = useState([]);
  const [camps, setCamps] = useState([]);
  const [showCollectionForm, setShowCollectionForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    donorId: "",
    donorName: "",
    donorEmail: "",
    donorPhone: "",
    bloodGroup: "",
    quantity: "",
    campId: "",
    campName: "",
    isNewDonor: false,
    notes: ""
  });
  const [stats, setStats] = useState({
    totalCollections: 0,
    totalUnits: 0,
    todayCollections: 0,
    activeCamps: 0
  });

  useEffect(() => {
    fetchCollections();
    fetchDonors();
    fetchCamps();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update stats when camps data changes
  useEffect(() => {
    if (collections.length > 0) {
      updateStats(collections);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camps]);

  const fetchCollections = async () => {
    try {
      const { data } = await API.get("/inventory/get-inventory");
      if (data?.success) {
        const collections = data.inventory.filter(item => item.inventoryType === "in");
        setCollections(collections);
        updateStats(collections);
      }
    } catch (error) {
      console.error("Error fetching collections:", error);
      toast.error("Error fetching blood collections");
    } finally {
      setLoading(false);
    }
  };

  const fetchDonors = async () => {
    try {
      const { data } = await API.get("/inventory/get-all-donors");
      if (data?.success) {
        setDonors(data.donors);
      }
    } catch (error) {
      console.error("Error fetching donors:", error);
      toast.error("Failed to fetch donors");
    }
  };

  const fetchCamps = async () => {
    try {
      const { data } = await API.get("/camps/get-camps");
      if (data?.success) {
        setCamps(data.camps);
      }
    } catch (error) {
      console.error("Error fetching camps:", error);
      // Set empty camps array so component still works
      setCamps([]);
    }
  };

  const updateStats = (collections) => {
    const today = moment().startOf('day');
    const todayCollections = collections.filter(c => 
      moment(c.createdAt).isSame(today, 'day')
    );
    
    // Calculate active camps (upcoming or ongoing)
    const activeCamps = camps.filter(camp => {
      const campDate = moment(camp.date);
      const today = moment().startOf('day');
      return campDate.isSameOrAfter(today) || camp.status === 'ongoing';
    }).length;
    
    setStats({
      totalCollections: collections.length,
      totalUnits: collections.reduce((sum, c) => sum + (c.quantity || 0), 0),
      todayCollections: todayCollections.length,
      activeCamps: activeCamps
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let collectionData;

      if (formData.isNewDonor) {
        // Validate new donor fields
        if (!formData.donorName || !formData.donorEmail || !formData.bloodGroup || !formData.quantity) {
          toast.error("Please fill all required fields for new donor");
          setLoading(false);
          return;
        }

        // Validate quantity is positive
        if (parseInt(formData.quantity) <= 0) {
          toast.error("Quantity must be a positive number");
          setLoading(false);
          return;
        }

        // For new donors, send all the data to create donor and inventory record
        collectionData = {
          inventoryType: "in",
          bloodGroup: formData.bloodGroup,
          quantity: parseInt(formData.quantity),
          email: formData.donorEmail,
          donorName: formData.donorName,
          donorPhone: formData.donorPhone,
          isNewDonor: true,
          campName: formData.campName || "Direct Collection",
          campId: formData.campId
        };
      } else {
        // Find the selected existing donor
        const selectedDonor = donors.find(d => d._id === formData.donorId);
        
        if (!selectedDonor) {
          toast.error("Please select a donor");
          setLoading(false);
          return;
        }

        if (!formData.bloodGroup || !formData.quantity) {
          toast.error("Please fill blood group and quantity");
          setLoading(false);
          return;
        }

        // Validate quantity is positive
        if (parseInt(formData.quantity) <= 0) {
          toast.error("Quantity must be a positive number");
          setLoading(false);
          return;
        }

        collectionData = {
          inventoryType: "in",
          bloodGroup: formData.bloodGroup,
          quantity: parseInt(formData.quantity),
          email: selectedDonor.email,
          donorId: formData.donorId,
          campName: formData.campName || "Direct Collection",
          campId: formData.campId
        };
      }

      const { data } = await API.post("/inventory/create-inventory", collectionData);
      
      if (data?.success) {
        toast.success("Blood collection recorded successfully!");
        setShowCollectionForm(false);
        resetForm();
        fetchCollections();
        // Refresh donors list if new donor was added
        if (formData.isNewDonor) {
          fetchDonors();
        }
      }
    } catch (error) {
      console.error("Error recording collection:", error);
      toast.error(error.response?.data?.message || "Error recording blood collection");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      donorId: "",
      donorName: "",
      donorEmail: "",
      donorPhone: "",
      bloodGroup: "",
      quantity: "",
      campId: "",
      campName: "",
      isNewDonor: false,
      notes: ""
    });
  };

  const handleDonorSelection = (donorId) => {
    const selectedDonor = donors.find(d => d._id === donorId);
    
    if (selectedDonor) {
      setFormData({
        ...formData,
        donorId: donorId,
        donorName: selectedDonor.name,
        donorEmail: selectedDonor.email,
        donorPhone: selectedDonor.phone,
        bloodGroup: selectedDonor.bloodGroup || "",
        isNewDonor: false
      });
    } else if (donorId === "") {
      // Reset donor fields when no donor is selected
      setFormData({
        ...formData,
        donorId: "",
        donorName: "",
        donorEmail: "",
        donorPhone: "",
        bloodGroup: ""
      });
    }
  };

  const handleCampSelection = (campId) => {
    const selectedCamp = camps.find(c => c._id === campId);
    
    if (selectedCamp) {
      setFormData({
        ...formData,
        campId: campId,
        campName: selectedCamp.name
      });
    } else if (campId === "") {
      // Reset camp fields when no camp is selected
      setFormData({
        ...formData,
        campId: "",
        campName: ""
      });
    }
  };

  // Action handlers for collection management
  const handleViewCollection = (collection) => {
    setSelectedCollection(collection);
    setShowViewModal(true);
  };

  const handleEditCollection = (collection) => {
    setFormData({
      donorId: collection.donar?._id || "",
      donorName: collection.donar?.name || "",
      donorEmail: collection.donar?.email || "",
      donorPhone: collection.donar?.phone || "",
      bloodGroup: collection.bloodGroup,
      quantity: collection.quantity,
      campId: collection.campId || "",
      campName: collection.campName || "",
      isNewDonor: false,
      notes: collection.notes || ""
    });
    setShowCollectionForm(true);
  };

  const handleDeleteCollection = async (collectionId) => {
    if (window.confirm('Are you sure you want to delete this collection record? This action cannot be undone.')) {
      try {
        setLoading(true);
        const { data } = await API.delete(`/inventory/delete-inventory/${collectionId}`);
        if (data?.success) {
          toast.success('Collection record deleted successfully');
          fetchCollections(); // Refresh the list
        } else {
          toast.error(data?.message || 'Failed to delete collection record');
        }
      } catch (error) {
        console.error(error);
        toast.error('Error deleting collection record');
      } finally {
        setLoading(false);
      }
    }
  };

  const getBloodGroupBadge = (bloodGroup) => {
    const colors = {
      'O+': 'danger', 'O-': 'dark', 'A+': 'primary', 'A-': 'info',
      'B+': 'success', 'B-': 'warning', 'AB+': 'secondary', 'AB-': 'light'
    };
    return (
      <span className={`badge bg-${colors[bloodGroup] || 'secondary'}`}>
        {bloodGroup}
      </span>
    );
  };

  if (loading && collections.length === 0) {
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
      <div className="admin-theme">
        <style dangerouslySetInnerHTML={{ __html: AdminGlobalStyles }} />
        <div className="admin-container">
          {/* Professional Header */}
          <div className="admin-header donor-header text-center">
            <div className="row align-items-center">
              <div className="col-md-8 text-md-start text-center">
                <div className="d-flex align-items-center justify-content-md-start justify-content-center mb-3">
                  <div className="bg-white bg-opacity-20 rounded-circle p-3 me-3">
                    <i className="fas fa-tint fa-2x"></i>
                  </div>
                  <div>
                    <h1 className="mb-2 fw-bold">Blood Collection Management</h1>
                    <p className="mb-0 fs-5 opacity-90">Record and manage blood collections from donation camps</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4 text-center">
                <div className="bg-white bg-opacity-20 rounded-4 p-3 d-inline-block">
                  <h3 className="mb-1 fw-bold">{stats.totalCollections}</h3>
                  <p className="mb-0 small">Total Collections</p>
                </div>
                <button 
                  className="btn btn-light btn-lg mt-3"
                  onClick={() => setShowCollectionForm(true)}
                >
                  <i className="fas fa-plus me-2"></i>
                  Record Collection
                </button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="row g-4 mb-4">
            <div className="col-lg-3 col-md-6">
              <div className="admin-stat-card">
                <div className="d-flex align-items-center">
                  <div className="donor-icon-gradient me-3" style={{width: '60px', height: '60px', fontSize: '1.5rem'}}>
                    <i className="fas fa-tint"></i>
                  </div>
                  <div className="flex-grow-1">
                    <h3 className="mb-1 fw-bold" style={{color: '#dc3545'}}>{stats.totalCollections}</h3>
                    <p className="mb-1 fw-semibold text-dark">Total Collections</p>
                    <small className="text-muted">
                      <i className="fas fa-chart-line me-1"></i>
                      All recorded collections
                    </small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="admin-stat-card">
                <div className="d-flex align-items-center">
                  <div className="admin-stat-icon me-3" style={{background: 'linear-gradient(135deg, #ffc107 0%, #ff8f00 50%, #ff6f00 100%)'}}>
                    <i className="fas fa-flask"></i>
                  </div>
                  <div className="flex-grow-1">
                    <h3 className="mb-1 fw-bold text-warning">{stats.totalUnits}</h3>
                    <p className="mb-1 fw-semibold text-dark">Total Units (ML)</p>
                    <small className="text-muted">
                      <i className="fas fa-vial me-1"></i>
                      Blood volume collected
                    </small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="admin-stat-card">
                <div className="d-flex align-items-center">
                  <div className="admin-stat-icon me-3" style={{background: 'linear-gradient(135deg, #fd7e14 0%, #e55d13 50%, #c2410c 100%)'}}>
                    <i className="fas fa-calendar-day"></i>
                  </div>
                  <div className="flex-grow-1">
                    <h3 className="mb-1 fw-bold" style={{color: '#fd7e14'}}>{stats.todayCollections}</h3>
                    <p className="mb-1 fw-semibold text-dark">Today's Collections</p>
                    <small className="text-muted">
                      <i className="fas fa-clock me-1"></i>
                      Collections today
                    </small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="admin-stat-card">
                <div className="d-flex align-items-center">
                  <div className="admin-stat-icon me-3" style={{background: 'linear-gradient(135deg, #20c997 0%, #198754 50%, #0f5132 100%)'}}>
                    <i className="fas fa-campground"></i>
                  </div>
                  <div className="flex-grow-1">
                    <h3 className="mb-1 fw-bold text-success">{stats.activeCamps}</h3>
                    <p className="mb-1 fw-semibold text-dark">Active Camps</p>
                    <small className="text-muted">
                      <i className="fas fa-map-marker-alt me-1"></i>
                      Running campaigns
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Collection Form Modal */}
        {showCollectionForm && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Record Blood Collection</h5>
                  <button 
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setShowCollectionForm(false)}
                  >
                    <i className="fa-solid fa-times"></i>
                  </button>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Donor Selection</label>
                          <div className="mb-2">
                            <div className="form-check form-check-inline">
                              <input 
                                className="form-check-input" 
                                type="radio" 
                                name="donorType" 
                                id="existingDonor"
                                checked={!formData.isNewDonor}
                                onChange={() => setFormData({...formData, isNewDonor: false, donorId: "", donorName: "", donorEmail: "", donorPhone: "", bloodGroup: ""})}
                              />
                              <label className="form-check-label" htmlFor="existingDonor">
                                Existing Donor
                              </label>
                            </div>
                            <div className="form-check form-check-inline">
                              <input 
                                className="form-check-input" 
                                type="radio" 
                                name="donorType" 
                                id="newDonor"
                                checked={formData.isNewDonor}
                                onChange={() => setFormData({...formData, isNewDonor: true, donorId: "", donorName: "", donorEmail: "", donorPhone: "", bloodGroup: ""})}
                              />
                              <label className="form-check-label" htmlFor="newDonor">
                                New Donor
                              </label>
                            </div>
                          </div>
                          
                          {!formData.isNewDonor && (
                            <select 
                              className="form-select"
                              value={formData.donorId}
                              onChange={(e) => handleDonorSelection(e.target.value)}
                            >
                              <option value="">Select from registered donors ({donors.length} available)</option>
                              {donors.map(donor => (
                                <option key={donor._id} value={donor._id}>
                                  {donor.name} - {donor.bloodGroup || 'Unknown'} ({donor.email})
                                </option>
                              ))}
                            </select>
                          )}
                          
                          {donors.length === 0 && !formData.isNewDonor && (
                            <div className="form-text text-warning">
                              <i className="fa-solid fa-exclamation-triangle me-1"></i>
                              No existing donors found. Please select "New Donor" option.
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* New Donor Fields */}
                      {formData.isNewDonor && (
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Donor Name *</label>
                            <input 
                              type="text"
                              className="form-control"
                              placeholder="Enter donor full name"
                              value={formData.donorName}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                donorName: e.target.value
                              })}
                              required
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Additional fields for new donors */}
                    {formData.isNewDonor && (
                      <div className="row">
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Email *</label>
                            <input 
                              type="email"
                              className="form-control"
                              placeholder="Enter donor email"
                              value={formData.donorEmail}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                donorEmail: e.target.value
                              })}
                              required
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Phone</label>
                            <input 
                              type="tel"
                              className="form-control"
                              placeholder="Enter donor phone (optional)"
                              value={formData.donorPhone}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                donorPhone: e.target.value
                              })}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Show selected donor info */}
                    {formData.donorId && (
                      <div className="row">
                        <div className="col-12">
                          <div className="alert alert-info">
                            <h6 className="mb-2">
                              <i className="fa-solid fa-user me-2"></i>
                              Selected Donor Information
                            </h6>
                            <div className="row">
                              <div className="col-md-3">
                                <strong>Name:</strong> {formData.donorName}
                              </div>
                              <div className="col-md-3">
                                <strong>Email:</strong> {formData.donorEmail}
                              </div>
                              <div className="col-md-3">
                                <strong>Phone:</strong> {formData.donorPhone}
                              </div>
                              <div className="col-md-3">
                                <strong>Blood Group:</strong> {formData.bloodGroup}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="row">
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">Blood Group *</label>
                          <select 
                            className="form-select"
                            value={formData.bloodGroup}
                            onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                            required
                          >
                            <option value="">Select Blood Group</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">Quantity (ML) *</label>
                          <input 
                            type="number"
                            className="form-control"
                            min="1"
                            placeholder="Enter quantity in ML"
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            required
                          />
                          <small className="text-muted">Enter any positive quantity</small>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">Collection Date *</label>
                          <input 
                            type="date"
                            className="form-control"
                            value={formData.collectionDate}
                            onChange={(e) => setFormData({ ...formData, collectionDate: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Select Camp</label>
                          <select 
                            className="form-select"
                            value={formData.campId}
                            onChange={(e) => handleCampSelection(e.target.value)}
                          >
                            <option value="">Select a donation camp ({camps.length} available)</option>
                            {camps.map(camp => (
                              <option key={camp._id} value={camp._id}>
                                {camp.name} - {camp.location?.city} ({moment(camp.date).format('MMM DD, YYYY')})
                              </option>
                            ))}
                          </select>
                          {camps.length === 0 && (
                            <div className="form-text text-warning">
                              <i className="fa-solid fa-exclamation-triangle me-1"></i>
                              No camps found. You can still enter camp name manually below.
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Or Enter Camp Name</label>
                          <input 
                            type="text"
                            className="form-control"
                            placeholder="e.g., Community Blood Drive 2025"
                            value={formData.campName}
                            onChange={(e) => setFormData({ ...formData, campName: e.target.value, campId: "" })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Notes</label>
                      <textarea 
                        className="form-control"
                        rows="3"
                        placeholder="Any additional notes about the collection..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      ></textarea>
                    </div>

                    <div className="d-flex gap-2">
                      <button type="submit" className="btn btn-danger" disabled={loading}>
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Recording...
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-save me-2"></i>
                            Record Collection
                          </>
                        )}
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-secondary"
                        onClick={() => setShowCollectionForm(false)}
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

        {/* Collections List */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Recent Blood Collections ({collections.length})</h5>
              </div>
              <div className="card-body">
                {collections.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="fa-solid fa-tint fa-3x text-muted mb-3"></i>
                    <h5 className="text-muted">No collections recorded yet</h5>
                    <p className="text-muted">Start recording blood collections from your donation camps</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Donor</th>
                          <th>Blood Group</th>
                          <th>Quantity (ML)</th>
                          <th width="180">Management Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {collections.map((collection) => (
                          <tr key={collection._id}>
                            <td>{moment(collection.createdAt).format('MMM D, YYYY')}</td>
                            <td>
                              <div>
                                <strong>{collection.donar?.name || "Unknown Donor"}</strong>
                                <br />
                                <small className="text-muted">{collection.donar?.email}</small>
                              </div>
                            </td>
                            <td>{getBloodGroupBadge(collection.bloodGroup)}</td>
                            <td>
                              <strong className="text-success">{collection.quantity} ML</strong>
                            </td>
                            <td>
                              <div className="btn-group" role="group">
                                <button 
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => handleViewCollection(collection)}
                                  title="View Collection Details"
                                >
                                  <i className="fa-solid fa-eye"></i>
                                </button>
                                <button 
                                  className="btn btn-sm btn-outline-warning"
                                  onClick={() => handleEditCollection(collection)}
                                  title="Edit Collection Record"
                                >
                                  <i className="fa-solid fa-edit"></i>
                                </button>
                                <button 
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDeleteCollection(collection._id)}
                                  title="Delete Collection Record"
                                >
                                  <i className="fa-solid fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* View Collection Modal */}
        {showViewModal && selectedCollection && (
          <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header bg-danger text-white">
                  <h5 className="modal-title">
                    <i className="fa-solid fa-eye me-2"></i>
                    Collection Details
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white" 
                    onClick={() => setShowViewModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label fw-bold">Donor Name:</label>
                        <p className="mb-1">{selectedCollection.donar?.name || "Unknown Donor"}</p>
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-bold">Email:</label>
                        <p className="mb-1">{selectedCollection.donar?.email || "Not provided"}</p>
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-bold">Blood Group:</label>
                        <p className="mb-1">{getBloodGroupBadge(selectedCollection.bloodGroup)}</p>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label fw-bold">Quantity:</label>
                        <p className="mb-1">
                          <span className="badge bg-warning fs-6">{selectedCollection.quantity} ML</span>
                        </p>
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-bold">Collection Date:</label>
                        <p className="mb-1">{moment(selectedCollection.createdAt).format('MMM D, YYYY')}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowViewModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div> {/* admin-container */}
      </div> {/* admin-theme */}
    </Layout>
  );
};

export default BloodCollection;
