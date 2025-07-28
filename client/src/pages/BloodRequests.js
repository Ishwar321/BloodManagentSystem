import React, { useState, useEffect } from "react";
import Layout from "../components/shared/Layout/Layout";
import API from "../services/API";
import { toast } from "react-toastify";
import moment from "moment";
const BloodRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [filterType, setFilterType] = useState("all"); // all, incoming, outgoing
  const [operationType, setOperationType] = useState("request"); // "request" or "add"

  // Form state
  const [formData, setFormData] = useState({
    bloodGroup: "",
    quantity: "",
    urgency: "medium",
    message: "",
    patientName: "",
    hospitalName: "",
    contactNumber: "",
    scheduledDate: "",
    // For adding blood
    donorName: "",
    donorEmail: "",
    donorPhone: "",
    donorAddress: "",
    location: {
      address: "",
      city: "",
      state: "",
      pincode: "",
    },
  });

  const getRequests = async () => {
    try {
      setLoading(true);
      console.log("Fetching inventory data...");
      const { data } = await API.get('/inventory/get-inventory');
      console.log("API Response:", data);
      if (data?.success) {
        console.log("Inventory data:", data.inventory);
        setRequests(data.inventory);
        setFilteredRequests(data.inventory);
      } else {
        console.log("API call unsuccessful:", data);
        toast.error("Failed to fetch inventory data");
      }
    } catch (error) {
      console.log("Error details:", error);
      console.log("Error response:", error.response?.data);
      toast.error(error.response?.data?.message || "Error fetching inventory data");
    } finally {
      setLoading(false);
    }
  };

  // Enhanced filtering logic
  useEffect(() => {
    let filtered = requests;

    // Always show only "in" records (incoming blood requests)
    filtered = filtered.filter(record => record.inventoryType === "in");

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.bloodGroup?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.quantity?.toString().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
  }, [searchTerm, filterType, requests]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Prepare inventory data based on the form
      let inventoryData;
      
      if (operationType === "request") {
        // Hospital requesting blood
        inventoryData = {
          inventoryType: "out", // Hospitals request blood (out from inventory)
          bloodGroup: formData.bloodGroup,
          quantity: parseInt(formData.quantity),
          patientName: formData.patientName,
          hospitalName: formData.hospitalName,
          contactNumber: formData.contactNumber,
          urgency: formData.urgency,
          message: formData.message,
          scheduledDate: formData.scheduledDate,
          location: formData.location
        };
      } else {
        // Hospital adding blood
        inventoryData = {
          inventoryType: "in", // Hospitals adding blood (in to inventory)
          bloodGroup: formData.bloodGroup,
          quantity: parseInt(formData.quantity),
          donorName: formData.donorName,
          donorEmail: formData.donorEmail,
          donorPhone: formData.donorPhone,
          donorAddress: formData.donorAddress,
          isNewDonor: true, // Assuming new donor for simplicity
          message: formData.message,
        };
      }

      const { data } = await API.post("/inventory/create-inventory", inventoryData);
      if (data?.success) {
        toast.success(operationType === "request" ? "Blood request created successfully!" : "Blood added to inventory successfully!");
        setShowCreateForm(false);
        setFormData({
          bloodGroup: "",
          quantity: "",
          urgency: "medium",
          message: "",
          patientName: "",
          hospitalName: "",
          contactNumber: "",
          scheduledDate: "",
          donorName: "",
          donorEmail: "",
          donorPhone: "",
          donorAddress: "",
          location: { address: "", city: "", state: "", pincode: "" },
        });
        getRequests();
      }
    } catch (error) {
      console.error("Error details:", error.response?.data);
      toast.error(error.response?.data?.message || "Error creating inventory record");
    } finally {
      setLoading(false);
    }
  };

  // Commented out unused functions
  // const updateRequestStatus = async (requestId, status, notes = "") => {
  //   try {
  //     const { data } = await API.put(`/requests/update-status/${requestId}`, {
  //       status,
  //       adminNotes: notes,
  //     });
  //     if (data?.success) {
  //       toast.success("Request status updated!");
  //       getRequests();
  //     }
  //   } catch (error) {
  //     toast.error("Error updating request status");
  //   }
  // };

  useEffect(() => {
    getRequests();
  }, []);

  // const getStatusBadge = (status) => {
  //   const statusConfig = {
  //     pending: { class: "bg-warning", icon: "fas fa-clock" },
  //     approved: { class: "bg-success", icon: "fas fa-check-circle" },
  //     rejected: { class: "bg-danger", icon: "fas fa-times-circle" },
  //     fulfilled: { class: "bg-info", icon: "fas fa-check-double" },
  //     expired: { class: "bg-secondary", icon: "fas fa-ban" },
  //   };
  // };

  return (
    <Layout>
      <style>
        {`
          .hover-shadow:hover {
            box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
            transform: translateY(-2px);
            transition: all 0.3s ease;
          }
          .table tbody tr:hover {
            background-color: #f8f9fa;
          }
          .btn-group .btn {
            border-radius: 0.25rem !important;
            margin: 0 1px;
          }
          .card-header {
            border-radius: 0.5rem 0.5rem 0 0 !important;
          }
          .badge {
            font-weight: 500;
            letter-spacing: 0.5px;
          }
          .text-gradient {
            background: linear-gradient(45deg, #dc3545, #c82333);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
        `}
      </style>
      <div className="container-fluid p-4">
        {/* Professional Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-lg">
              <div className="card-body" style={{
                background: 'linear-gradient(135deg, #dc3545 0%, #c82333 50%, #bd2130 100%)',
                color: 'white',
                borderRadius: '0.5rem'
              }}>
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <div className="d-flex align-items-center">
                      <div className="me-4">
                        <i className="fas fa-heartbeat fa-3x opacity-75"></i>
                      </div>
                      <div>
                        <h1 className="h3 mb-1 fw-bold">Blood Inventory Management System</h1>
                        <p className="mb-0 opacity-90">
                          Add blood donations to inventory and create blood requests for patients
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 text-md-end">
                    <div className="d-flex flex-column align-items-md-end">
                      <div className="badge bg-light text-danger fs-6 px-3 py-2 mb-2">
                        <i className="fas fa-clock me-1"></i>
                        Real-time Updates
                      </div>
                      <small className="opacity-75">Last updated: {moment().format('MMMM DD, YYYY')}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Search and Filters */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-light border-0">
                <h5 className="mb-0 text-dark">
                  <i className="fas fa-filter me-2"></i>
                  Search & Filter Inventory
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-lg-8">
                    <label className="form-label fw-semibold">
                      <i className="fas fa-search me-2 text-primary"></i>
                      Global Search
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-primary text-white border-0">
                        <i className="fas fa-search"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search by blood group, email, or quantity..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      {searchTerm && (
                        <button 
                          className="btn btn-outline-secondary"
                          onClick={() => setSearchTerm("")}
                          title="Clear search"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-12">
                    <div className="d-flex flex-wrap gap-2 align-items-center">
                      <div className="btn-group" role="group">
                        <button
                          className={`btn ${operationType === 'request' ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => {
                            setOperationType('request');
                            setShowCreateForm(false);
                          }}
                        >
                          <i className="fas fa-hand-holding-medical me-2"></i>
                          Request Blood
                        </button>
                        <button
                          className={`btn ${operationType === 'add' ? 'btn-success' : 'btn-outline-success'}`}
                          onClick={() => {
                            setOperationType('add');
                            setShowCreateForm(false);
                          }}
                        >
                          <i className="fas fa-plus me-2"></i>
                          Add Blood
                        </button>
                      </div>
                      <button
                        className={`btn ${operationType === 'request' ? 'btn-primary' : 'btn-success'}`}
                        onClick={() => setShowCreateForm(!showCreateForm)}
                      >
                        <i className="fas fa-plus me-2"></i>
                        {showCreateForm ? 'Cancel' : (operationType === 'request' ? 'Create Request' : 'Add Blood Inventory')}
                      </button>
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          setSearchTerm("");
                          setFilterType("all");
                        }}
                      >
                        <i className="fas fa-times-circle me-2"></i>
                        Clear Filters
                      </button>
                      <div className="ms-auto">
                        <span className="text-muted">
                          Showing {filteredRequests.length} of {requests.length} inventory records
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="card border-0 shadow">
                <div className={`card-header ${operationType === 'request' ? 'bg-primary' : 'bg-success'} text-white`}>
                  <h5 className="mb-0">
                    <i className={`fas ${operationType === 'request' ? 'fa-hand-holding-medical' : 'fa-plus-circle'} me-2`}></i>
                    {operationType === 'request' ? 'Create Blood Request' : 'Add Blood to Inventory'}
                  </h5>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-bold">
                          <i className="fas fa-tint me-2 text-danger"></i>
                          Blood Group *
                        </label>
                        <select
                          className="form-select form-select-lg"
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
                      <div className="col-md-6">
                        <label className="form-label fw-bold">
                          <i className="fas fa-flask me-2 text-info"></i>
                          Quantity (ML) *
                        </label>
                        <input
                          type="number"
                          className="form-control form-control-lg"
                          value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                          placeholder="Enter quantity in ML"
                          min="1"
                          required
                        />
                      </div>
                    </div>

                    {/* Conditional Fields Based on Operation Type */}
                    {operationType === 'request' ? (
                      // Blood Request Fields
                      <div className="row g-3 mt-2">
                        <div className="col-md-6">
                          <label className="form-label fw-bold">
                            <i className="fas fa-user-injured me-2 text-primary"></i>
                            Patient Name *
                          </label>
                          <input
                            type="text"
                            className="form-control form-control-lg"
                            value={formData.patientName}
                            onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                            placeholder="Enter patient name"
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-bold">
                            <i className="fas fa-phone me-2 text-primary"></i>
                            Contact Number *
                          </label>
                          <input
                            type="tel"
                            className="form-control form-control-lg"
                            value={formData.contactNumber}
                            onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                            placeholder="Enter contact number"
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-bold">
                            <i className="fas fa-exclamation-triangle me-2 text-warning"></i>
                            Urgency Level
                          </label>
                          <select
                            className="form-select form-select-lg"
                            value={formData.urgency}
                            onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="emergency">Emergency</option>
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-bold">
                            <i className="fas fa-calendar me-2 text-primary"></i>
                            Scheduled Date
                          </label>
                          <input
                            type="date"
                            className="form-control form-control-lg"
                            value={formData.scheduledDate}
                            onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                          />
                        </div>
                        <div className="col-12">
                          <label className="form-label fw-bold">
                            <i className="fas fa-comment me-2 text-primary"></i>
                            Additional Message
                          </label>
                          <textarea
                            className="form-control"
                            rows="3"
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            placeholder="Enter any additional details or special requirements..."
                          />
                        </div>
                      </div>
                    ) : (
                      // Add Blood Fields (Donor Information)
                      <div className="row g-3 mt-2">
                        <div className="col-md-6">
                          <label className="form-label fw-bold">
                            <i className="fas fa-user me-2 text-success"></i>
                            Donor Name *
                          </label>
                          <input
                            type="text"
                            className="form-control form-control-lg"
                            value={formData.donorName}
                            onChange={(e) => setFormData({ ...formData, donorName: e.target.value })}
                            placeholder="Enter donor name"
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-bold">
                            <i className="fas fa-envelope me-2 text-success"></i>
                            Donor Email *
                          </label>
                          <input
                            type="email"
                            className="form-control form-control-lg"
                            value={formData.donorEmail}
                            onChange={(e) => setFormData({ ...formData, donorEmail: e.target.value })}
                            placeholder="Enter donor email"
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-bold">
                            <i className="fas fa-phone me-2 text-success"></i>
                            Donor Phone
                          </label>
                          <input
                            type="tel"
                            className="form-control form-control-lg"
                            value={formData.donorPhone}
                            onChange={(e) => setFormData({ ...formData, donorPhone: e.target.value })}
                            placeholder="Enter donor phone number"
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-bold">
                            <i className="fas fa-map-marker-alt me-2 text-success"></i>
                            Donor Address
                          </label>
                          <input
                            type="text"
                            className="form-control form-control-lg"
                            value={formData.donorAddress}
                            onChange={(e) => setFormData({ ...formData, donorAddress: e.target.value })}
                            placeholder="Enter donor address"
                          />
                        </div>
                        <div className="col-12">
                          <label className="form-label fw-bold">
                            <i className="fas fa-comment me-2 text-success"></i>
                            Collection Notes
                          </label>
                          <textarea
                            className="form-control"
                            rows="3"
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            placeholder="Enter any collection notes or special information..."
                          />
                        </div>
                      </div>
                    )}

                    <div className="mt-4 d-flex gap-3">
                      <button 
                        type="submit" 
                        className={`btn ${operationType === 'request' ? 'btn-primary' : 'btn-success'} btn-lg px-4`} 
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            {operationType === 'request' ? 'Creating Request...' : 'Adding to Inventory...'}
                          </>
                        ) : (
                          <>
                            <i className={`fas ${operationType === 'request' ? 'fa-hand-holding-medical' : 'fa-plus'} me-2`}></i>
                            {operationType === 'request' ? 'Create Request' : 'Add to Inventory'}
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-lg px-4"
                        onClick={() => setShowCreateForm(false)}
                      >
                        <i className="fas fa-times me-2"></i>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Professional Requests Table */}
        <div className="card border-0 shadow-lg">
          <div className="card-header border-0" style={{ backgroundColor: '#f8f9fa' }}>
            <div className="row align-items-center">
              <div className="col">
                <h5 className="mb-0 text-dark fw-bold">
                  <i className="fas fa-table me-2 text-primary"></i>
                  Blood Inventory Management
                </h5>
                <small className="text-muted">
                  {filteredRequests.length} inventory records found
                  {(searchTerm || filterType !== 'all') && 
                    ' (filtered)'
                  }
                </small>
              </div>
            </div>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-danger mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                <h5 className="text-muted">Loading blood requests...</h5>
                <p className="text-muted">Please wait while we fetch the latest data</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead style={{ backgroundColor: '#343a40', color: 'white' }}>
                    <tr>
                      <th scope="col" className="px-4 py-3">
                        <div className="d-flex align-items-center">
                          <i className="fas fa-hashtag me-2"></i>
                          Record ID
                        </div>
                      </th>
                      <th scope="col" className="px-4 py-3">
                        <div className="d-flex align-items-center">
                          <i className="fas fa-tint me-2"></i>
                          Blood Group
                        </div>
                      </th>
                      <th scope="col" className="px-4 py-3">
                        <div className="d-flex align-items-center">
                          <i className="fas fa-flask me-2"></i>
                          Quantity (ML)
                        </div>
                      </th>
                      <th scope="col" className="px-4 py-3">
                        <div className="d-flex align-items-center">
                          <i className="fas fa-exchange-alt me-2"></i>
                          Transaction Type
                        </div>
                      </th>
                      <th scope="col" className="px-4 py-3">
                        <div className="d-flex align-items-center">
                          <i className="fas fa-envelope me-2"></i>
                          Email
                        </div>
                      </th>
                      <th scope="col" className="px-4 py-3">
                        <div className="d-flex align-items-center">
                          <i className="fas fa-calendar me-2"></i>
                          Date
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-5">
                          <div className="d-flex flex-column align-items-center">
                            <i className="fas fa-inbox fa-4x text-muted mb-3 opacity-50"></i>
                            <h4 className="text-muted mb-2">No Inventory Records Found</h4>
                            <p className="text-muted mb-3">
                              {searchTerm || filterType !== 'all'
                                ? "No inventory records match your current filters. Try adjusting your search criteria."
                                : "There are currently no inventory records in the system."
                              }
                            </p>
                            {!searchTerm && filterType === 'all' && (
                              <button 
                                className="btn btn-primary"
                                onClick={() => setShowCreateForm(true)}
                              >
                                <i className="fas fa-plus me-2"></i>
                                Add First Record
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map((record, index) => (
                        <tr key={record._id} className="border-bottom">
                          <td className="px-4 py-3">
                            <div className="d-flex align-items-center">
                              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                                   style={{ width: '35px', height: '35px', fontSize: '12px' }}>
                                {index + 1}
                              </div>
                              <div>
                                <span className="fw-bold text-primary">#{record._id?.slice(-6).toUpperCase()}</span>
                                <br />
                                <small className="text-muted">Record #{index + 1}</small>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="badge bg-danger fs-6 px-3 py-2">
                              <i className="fas fa-tint me-1"></i>
                              {record.bloodGroup}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="fw-bold text-dark">
                              {record.quantity} ML
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`badge fs-6 px-3 py-2 ${
                              record.inventoryType === 'in' ? 'bg-success text-white' : 'bg-warning text-dark'
                            }`}>
                              <i className={`fas ${
                                record.inventoryType === 'in' ? 'fa-plus' : 'fa-minus'
                              } me-1`}></i>
                              {record.inventoryType === 'in' ? 'Blood Added' : 'Blood Withdrawn'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="fw-semibold">
                              {record.email || 'Not Provided'}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="fw-semibold">
                              {moment(record.createdAt).format('MMM DD, YYYY')}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {filteredRequests.length > 0 && (
            <div className="card-footer bg-light border-0">
              <div className="row align-items-center">
                <div className="col">
                  <small className="text-muted">
                    Displaying {filteredRequests.length} of {requests.length} total inventory records
                  </small>
                </div>
                <div className="col-auto">
                  <nav>
                    <ul className="pagination pagination-sm mb-0">
                      <li className="page-item disabled">
                        <span className="page-link">Previous</span>
                      </li>
                      <li className="page-item active">
                        <span className="page-link">1</span>
                      </li>
                      <li className="page-item disabled">
                        <span className="page-link">Next</span>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default BloodRequests;
