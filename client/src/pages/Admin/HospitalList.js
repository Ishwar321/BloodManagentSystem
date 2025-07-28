import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout/Layout";
import moment from "moment";
import API from "../../services/API";
import { toast } from "react-toastify";
import { AdminGlobalStyles } from "../../styles/AdminStyles";

const HospitalList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedHospitals, setSelectedHospitals] = useState([]);

  // Selection handlers
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedHospitals(filteredData.map(hospital => hospital._id));
    } else {
      setSelectedHospitals([]);
    }
  };

  const handleSelectHospital = (hospitalId) => {
    setSelectedHospitals(prev => 
      prev.includes(hospitalId) 
        ? prev.filter(id => id !== hospitalId)
        : [...prev, hospitalId]
    );
  };

  // Export to CSV function (commented out as not currently used)
  // const exportToCSV = () => {
  //   const csvData = filteredData.map(hospital => ({
  //     Name: hospital.hospitalName || hospital.organisationName,
  //     Email: hospital.email,
  //     Phone: hospital.phone,
  //     Address: hospital.address || 'N/A',
  //     Role: hospital.role,
  //     'Registration Date': moment(hospital.createdAt).format('DD/MM/YYYY'),
  //     'Registration Time': moment(hospital.createdAt).format('h:mm A')
  //   }));

  //   const csvContent = [
  //     Object.keys(csvData[0]).join(','),
  //     ...csvData.map(row => Object.values(row).join(','))
  //   ].join('\n');

  //   const blob = new Blob([csvContent], { type: 'text/csv' });
  //   const url = window.URL.createObjectURL(blob);
  //   const a = document.createElement('a');
  //   a.href = url;
  //   a.download = `hospitals_${moment().format('YYYY-MM-DD')}.csv`;
  //   a.click();
  //   window.URL.revokeObjectURL(url);
  // };

  //find hospital records
  const getHospitals = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/admin/hospital-list");
      if (data?.success) {
        setData(data?.hospitalData);
        setFilteredData(data?.hospitalData);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch hospitals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getHospitals();
  }, []);

  // Enhanced Filter function
  useEffect(() => {
    let filtered = data.filter(hospital => {
      const matchesSearch = 
        hospital.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hospital.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hospital.phone.includes(searchTerm) ||
        (hospital.address && hospital.address.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "recent" && moment(hospital.createdAt).isAfter(moment().subtract(30, 'days'))) ||
        (statusFilter === "active" && hospital.role === "hospital");
      
      return matchesSearch && matchesStatus;
    });
    setFilteredData(filtered);
  }, [searchTerm, data, statusFilter]);

  //DELETE FUNCTION
  const handelDelete = async (id, name) => {
    try {
      if (window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
        const { data } = await API.delete(`/admin/delete-donar/${id}`);
        if (data?.success) {
          toast.success(data?.message || "Hospital deleted successfully");
          getHospitals(); // Refresh the list
        } else {
          toast.error(data?.message || "Failed to delete hospital");
        }
      }
    } catch (error) {
      console.log(error);
      toast.error("Error deleting hospital");
    }
  };

  // EDIT FUNCTION
  const handleEdit = (hospital) => {
    setSelectedHospital(hospital);
    setShowEditModal(true);
  };

  return (
    <Layout>
      <div className="admin-theme">
        <style dangerouslySetInnerHTML={{ __html: AdminGlobalStyles }} />
        <div className="admin-container">
          {/* Professional Header */}
          <div className="admin-header hospital-header text-center">
            <div className="row align-items-center">
              <div className="col-md-8 text-md-start text-center">
                <div className="d-flex align-items-center justify-content-md-start justify-content-center mb-3">
                  <div className="bg-white bg-opacity-20 rounded-circle p-3 me-3">
                    <i className="fas fa-hospital-alt fa-2x"></i>
                  </div>
                  <div>
                    <h1 className="mb-2 fw-bold">Hospital Management System</h1>
                    <p className="mb-0 fs-5 opacity-90">Comprehensive healthcare facility administration and oversight</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4 text-center">
                <div className="bg-white bg-opacity-20 rounded-4 p-3 d-inline-block">
                  <h3 className="mb-1 fw-bold">{data.length}</h3>
                  <p className="mb-0 small">Registered Hospitals</p>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Statistics Cards */}
          <div className="row g-4 mb-4">
            <div className="col-lg-3 col-md-6">
              <div className="admin-stat-card">
                <div className="d-flex align-items-center">
                  <div className="admin-stat-icon me-3">
                    <i className="fas fa-hospital"></i>
                  </div>
                  <div className="flex-grow-1">
                    <h3 className="mb-1 fw-bold text-primary">{data.length}</h3>
                    <p className="mb-1 fw-semibold text-dark">Total Hospitals</p>
                    <small className="text-muted">
                      <i className="fas fa-plus-circle me-1"></i>
                      {data.filter(h => moment(h.createdAt).isAfter(moment().subtract(30, 'days'))).length} added this month
                    </small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="admin-stat-card">
                <div className="d-flex align-items-center">
                  <div className="admin-stat-icon me-3" style={{background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #047857 100%)'}}>
                    <i className="fas fa-check-circle"></i>
                  </div>
                  <div className="flex-grow-1">
                    <h3 className="mb-1 fw-bold text-success">{filteredData.length}</h3>
                    <p className="mb-1 fw-semibold text-dark">Search Results</p>
                    <small className="text-muted">
                      <i className="fas fa-search me-1"></i>
                      {searchTerm ? `Matching "${searchTerm}"` : "All hospitals shown"}
                    </small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="admin-stat-card">
                <div className="d-flex align-items-center">
                  <div className="admin-stat-icon me-3" style={{background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #b45309 100%)'}}>
                    <i className="fas fa-user-md"></i>
                  </div>
                  <div className="flex-grow-1">
                    <h3 className="mb-1 fw-bold text-warning">{data.filter(h => h.role === 'hospital').length}</h3>
                    <p className="mb-1 fw-semibold text-dark">Active Hospitals</p>
                    <small className="text-muted">
                      <i className="fas fa-heartbeat me-1"></i>
                      Verified and operational
                    </small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="admin-stat-card">
                <div className="d-flex align-items-center">
                  <div className="admin-stat-icon me-3" style={{background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 50%, #0369a1 100%)'}}>
                    <i className="fas fa-calendar-plus"></i>
                  </div>
                  <div className="flex-grow-1">
                    <h3 className="mb-1 fw-bold text-info">{data.filter(h => moment(h.createdAt).isAfter(moment().subtract(7, 'days'))).length}</h3>
                    <p className="mb-1 fw-semibold text-dark">New This Week</p>
                    <small className="text-muted">
                      <i className="fas fa-clock me-1"></i>
                      Recently registered
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Search and Filter Section */}
          <div className="admin-search-section">
            <div className="row align-items-end">
              <div className="col-lg-8 col-md-6 mb-3 mb-md-0">
                <h5 className="fw-bold text-dark mb-3 d-flex align-items-center">
                  <div className="hospital-icon-gradient p-2 me-3" style={{width: '40px', height: '40px', fontSize: '1rem'}}>
                    <i className="fas fa-search"></i>
                  </div>
                  Advanced Hospital Search & Filters
                </h5>
                <div className="position-relative">
                  <input
                    type="text"
                    className="admin-form-control hospital-search-input"
                    placeholder="Search by hospital name, email, phone, or address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button 
                      className="btn btn-outline-secondary position-absolute end-0 top-50 translate-middle-y me-2"
                      onClick={() => setSearchTerm("")}
                      title="Clear search"
                      style={{borderRadius: '6px', padding: '0.375rem 0.75rem'}}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
              </div>
              <div className="col-lg-2 col-md-3 mb-3 mb-md-0">
                <label className="admin-form-label">Filter by Status</label>
                <select 
                  className="admin-form-control"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Hospitals</option>
                  <option value="active">Active Only</option>
                  <option value="recent">Recent (30 days)</option>
                </select>
              </div>
              <div className="col-lg-2 col-md-3">
                <button 
                  className="admin-btn admin-btn-outline w-100"
                  onClick={getHospitals}
                  disabled={loading}
                >
                  <i className="fas fa-sync-alt"></i>
                  {loading ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Table */}
          <div className="admin-table-card">
            <div className="admin-table-header">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="fw-bold mb-1 d-flex align-items-center">
                    <i className="fas fa-list me-2 text-primary"></i>
                    Hospital Directory
                  </h5>
                  <p className="text-muted mb-0 small">Showing {filteredData.length} of {data.length} registered hospitals</p>
                </div>
                <div className="d-flex gap-2">
                  <span className="admin-badge admin-badge-success">
                    <i className="fas fa-database me-1"></i>
                    System Active
                  </span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="admin-loading">
                <i className="fas fa-spinner fa-spin"></i>
                <h4 className="text-muted">Loading Hospitals...</h4>
                <p className="text-muted mb-0">Please wait while we fetch the latest data</p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="admin-no-data">
                <i className="fas fa-hospital"></i>
                <h4>No Hospitals Found</h4>
                <p>
                  {searchTerm 
                    ? `No hospitals match your search criteria: "${searchTerm}"`
                    : "No hospitals are registered in the system yet."
                  }
                </p>
                {searchTerm && (
                  <button 
                    className="admin-btn admin-btn-outline"
                    onClick={() => setSearchTerm("")}
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="admin-table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th className="ps-4">
                        <div className="d-flex align-items-center">
                          <input 
                            type="checkbox" 
                            className="form-check-input me-2"
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            checked={selectedHospitals?.length === filteredData.length && filteredData.length > 0}
                          />
                          <span className="fw-bold">
                            <i className="fas fa-hospital me-2"></i>
                            Hospital Details
                          </span>
                        </div>
                      </th>
                      <th className="fw-bold">
                        <i className="fas fa-envelope me-2"></i>
                        Contact Information
                      </th>
                      <th className="fw-bold">
                        <i className="fas fa-calendar me-2"></i>
                        Registration Date
                      </th>
                      <th className="fw-bold text-center">
                        <i className="fas fa-cog me-2"></i>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((record) => (
                      <tr key={record._id}>
                        <td className="ps-4">
                          <div className="d-flex align-items-center">
                            <input 
                              type="checkbox" 
                              className="form-check-input me-3"
                              checked={selectedHospitals?.includes(record._id) || false}
                              onChange={() => handleSelectHospital(record._id)}
                            />
                            <div className="admin-table-user">
                              <div className="admin-table-avatar">
                                <i className="fas fa-hospital"></i>
                              </div>
                              <div>
                                <div className="admin-table-name">
                                  {record.hospitalName || record.organisationName}
                                </div>
                                <div className="admin-table-meta">
                                  <span className="admin-badge admin-badge-primary">
                                    <i className="fas fa-user-tie me-1"></i>
                                    {record.role}
                                  </span>
                                  <span className="admin-badge admin-badge-info">
                                    ID: #{record._id.slice(-6)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="admin-contact-info">
                            <div className="admin-contact-item">
                              <i className="fas fa-envelope text-primary"></i>
                              <span>{record.email}</span>
                            </div>
                            <div className="admin-contact-item">
                              <i className="fas fa-phone text-success"></i>
                              <span>{record.phone}</span>
                            </div>
                            {record.address && (
                              <div className="admin-contact-item">
                                <i className="fas fa-map-marker-alt text-danger"></i>
                                <span>{record.address}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="admin-date-info">
                            <div className="admin-date-primary">
                              {moment(record.createdAt).format("DD/MM/YYYY")}
                            </div>
                            <div className="admin-date-secondary">
                              {moment(record.createdAt).format("h:mm A")}
                            </div>
                            <div className="admin-date-relative">
                              {moment(record.createdAt).fromNow()}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="admin-action-buttons">
                            <button
                              className="admin-btn-sm admin-btn-info"
                              onClick={() => {
                                setSelectedHospital(record);
                                setShowDetailsModal(true);
                              }}
                              title="View Hospital Details"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              className="admin-btn-sm admin-btn-primary"
                              onClick={() => handleEdit(record)}
                              title="Edit Hospital"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="admin-btn-sm admin-btn-danger"
                              onClick={() => handelDelete(record._id, record.hospitalName || record.organisationName)}
                              title="Delete Hospital"
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
          </div>
        </div>

        {/* Simple Hospital Details Modal */}
        {showDetailsModal && selectedHospital && (
          <div className="modal fade show d-block admin-modal" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div className="modal-dialog modal-sm">
              <div className="modal-content">
                <div className="modal-header">
                  <h6 className="modal-title mb-0">Hospital Details</h6>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white"
                    onClick={() => setShowDetailsModal(false)}
                  ></button>
                </div>
                <div className="modal-body text-center">
                  <div className="mb-4">
                    <h4 className="text-primary">{selectedHospital.hospitalName}</h4>
                    <p className="text-muted mb-0">{selectedHospital.email}</p>
                    <p className="text-muted">{selectedHospital.phone}</p>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="admin-btn admin-btn-outline btn-sm"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Hospital Modal */}
        {showEditModal && selectedHospital && (
          <div className="modal fade show d-block admin-modal" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <div className="d-flex align-items-center">
                    <div className="hospital-icon-gradient me-3" style={{width: '40px', height: '40px', fontSize: '1rem'}}>
                      <i className="fas fa-edit"></i>
                    </div>
                    <h5 className="modal-title mb-0">
                      Edit Hospital - {selectedHospital.hospitalName}
                    </h5>
                  </div>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white"
                    onClick={() => setShowEditModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <form>
                    <div className="row">
                      <div className="col-md-6">
                        <h6 className="fw-bold text-primary mb-3">
                          <i className="fas fa-hospital me-2"></i>
                          Hospital Details
                        </h6>
                        <div className="admin-form-group">
                          <label className="admin-form-label">Hospital Name</label>
                          <input 
                            type="text" 
                            className="admin-form-control" 
                            defaultValue={selectedHospital.hospitalName}
                          />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-form-label">Role</label>
                          <select className="admin-form-control" defaultValue={selectedHospital.role}>
                            <option value="hospital">Hospital</option>
                            <option value="organisation">Organisation</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <h6 className="fw-bold text-success mb-3">
                          <i className="fas fa-address-book me-2"></i>
                          Contact Information
                        </h6>
                        <div className="admin-form-group">
                          <label className="admin-form-label">Email</label>
                          <input 
                            type="email" 
                            className="admin-form-control" 
                            defaultValue={selectedHospital.email}
                          />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-form-label">Phone</label>
                          <input 
                            type="tel" 
                            className="admin-form-control" 
                            defaultValue={selectedHospital.phone}
                          />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-form-label">Address</label>
                          <textarea 
                            className="admin-form-control" 
                            rows="3" 
                            defaultValue={selectedHospital.address || ''}
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="admin-btn admin-btn-primary"
                    onClick={() => {
                      toast.info("Edit functionality would save changes here");
                      setShowEditModal(false);
                    }}
                  >
                    <i className="fas fa-save me-2"></i>
                    Save Changes
                  </button>
                  <button 
                    type="button" 
                    className="admin-btn admin-btn-outline"
                    onClick={() => setShowEditModal(false)}
                  >
                    <i className="fas fa-times me-2"></i>
                    Cancel
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

export default HospitalList;
