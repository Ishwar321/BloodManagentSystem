import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout/Layout";
import moment from "moment";
import API from "../../services/API";
import { toast } from "react-toastify";
import { AdminGlobalStyles } from "../../styles/AdminStyles";

const OrgList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  //find organization records
  const getOrganizations = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/admin/org-list");
      if (data?.success) {
        setData(data?.orgData);
        setFilteredData(data?.orgData);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch organizations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getOrganizations();
  }, []);

  // Enhanced Filter function
  useEffect(() => {
    const filtered = data.filter(org => {
      return org.organisationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.phone.includes(searchTerm) ||
        (org.address && org.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (org.website && org.website.toLowerCase().includes(searchTerm.toLowerCase()));
    });
    setFilteredData(filtered);
  }, [searchTerm, data]);

  //DELETE FUNCTION
  const handelDelete = async (id, name) => {
    try {
      if (window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
        const { data } = await API.delete(`/admin/delete-donar/${id}`);
        if (data?.success) {
          toast.success(data?.message || "Organization deleted successfully");
          getOrganizations(); // Refresh the list
        } else {
          toast.error(data?.message || "Failed to delete organization");
        }
      }
    } catch (error) {
      console.log(error);
      toast.error("Error deleting organization");
    }
  };

  // EDIT FUNCTION
  const handleEdit = (organization) => {
    setSelectedOrganization(organization);
    setShowEditModal(true);
  };

  // VIEW DETAILS FUNCTION
  const handleViewDetails = (organization) => {
    setSelectedOrganization(organization);
    setShowDetailsModal(true);
  };

  // CONTACT FUNCTION (commented out as not currently used)
  // const handleContact = (organization) => {
  //   window.open(`mailto:${organization.email}?subject=Inquiry about ${organization.organisationName}&body=Dear ${organization.organisationName} team,`);
  // };

  return (
    <Layout>
      <div className="admin-theme">
        <style dangerouslySetInnerHTML={{ __html: AdminGlobalStyles }} />
        <div className="admin-container">
          {/* Professional Header with enhanced styling */}
          <div className="admin-header organization-header text-center">
            <div className="row align-items-center">
              <div className="col-md-8 text-md-start text-center">
                <div className="d-flex align-items-center justify-content-md-start justify-content-center mb-3">
                  <div className="bg-white bg-opacity-20 rounded-circle p-3 me-3 shadow">
                    <i className="fas fa-building fa-2x"></i>
                  </div>
                  <div>
                    <h1 className="mb-2 fw-bold display-5">Organization Management</h1>
                    <p className="mb-0 fs-5 opacity-90">Comprehensive organizational administration and oversight</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4 text-center">
                <div className="bg-white bg-opacity-20 rounded-4 p-4 d-inline-block shadow">
                  <h2 className="mb-1 fw-bold text-white">{data.length}</h2>
                  <p className="mb-0 small opacity-90">Registered Organizations</p>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Search Section with better styling */}
          <div className="admin-search-section">
            <div className="d-flex align-items-center mb-3">
              <div className="org-icon-gradient me-3" style={{width: '50px', height: '50px', fontSize: '1.2rem'}}>
                <i className="fas fa-search"></i>
              </div>
              <div>
                <h4 className="mb-1 fw-bold text-dark">Search Organizations</h4>
                <p className="mb-0 text-muted">Find organizations by name, email, phone, address, or website</p>
              </div>
            </div>
            <div className="row g-3 align-items-end">
              <div className="col-md-9">
                <label className="admin-form-label">
                  <i className="fas fa-search me-2"></i>
                  Search Organizations
                </label>
                <input
                  type="text"
                  className="admin-form-control org-search-input"
                  placeholder="Search by name, email, phone, address, or website..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="admin-form-label text-transparent">Actions</label>
                <div className="d-flex gap-2">
                  <button 
                    className="admin-btn admin-btn-primary flex-fill"
                    onClick={getOrganizations}
                    disabled={loading}
                  >
                    <i className="fas fa-sync-alt"></i>
                    {loading ? "Loading..." : "Refresh"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Table */}
          <div className="admin-table-card">
            <div className="admin-table-header">
              <h5 className="mb-0">
                <i className="fas fa-list me-2"></i>
                Organization Directory ({filteredData.length} organizations)
              </h5>
            </div>

            {loading ? (
              <div className="admin-loading text-center py-5">
                <div className="org-icon-gradient mx-auto mb-4" style={{width: '80px', height: '80px', fontSize: '2rem'}}>
                  <i className="fas fa-spinner fa-spin"></i>
                </div>
                <h4 className="text-muted">Loading Organizations...</h4>
                <p className="text-muted mb-0">Please wait while we fetch the latest data</p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="admin-no-data text-center py-5">
                <div className="org-icon-gradient mx-auto mb-4" style={{width: '80px', height: '80px', fontSize: '2rem'}}>
                  <i className="fas fa-search"></i>
                </div>
                <h4 className="text-dark mb-3">No Organizations Found</h4>
                <p className="text-muted mb-4">
                  {searchTerm 
                    ? `No organizations match your search criteria: "${searchTerm}"`
                    : "No organizations are registered in the system yet."
                  }
                </p>
                {searchTerm && (
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => setSearchTerm("")}
                    style={{borderRadius: '12px'}}
                  >
                    <i className="fas fa-times me-2"></i>
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="admin-table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>
                        <i className="fas fa-building me-2"></i>
                        Organization Details
                      </th>
                      <th>
                        <i className="fas fa-envelope me-2"></i>
                        Contact Information
                      </th>
                      <th>
                        <i className="fas fa-calendar me-2"></i>
                        Registration Date
                      </th>
                      <th>
                        <i className="fas fa-cog me-2"></i>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((record) => (
                      <tr key={record._id}>
                        <td>
                          <div className="admin-table-user">
                            <div className="admin-table-avatar">
                              <i className="fas fa-building"></i>
                            </div>
                            <div>
                              <div className="admin-table-name">
                                {record.organisationName || record.hospitalName}
                              </div>
                              <div className="admin-table-meta">
                                <span className="admin-badge admin-badge-info">
                                  <i className="fas fa-briefcase me-1"></i>
                                  {record.role}
                                </span>
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
                            {record.website && (
                              <div className="admin-contact-item">
                                <i className="fas fa-globe text-info"></i>
                                <span>{record.website}</span>
                              </div>
                            )}
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
                              onClick={() => handleViewDetails(record)}
                              title="View Details"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              className="admin-btn-sm admin-btn-primary"
                              onClick={() => handleEdit(record)}
                              title="Edit Organization"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="admin-btn-sm admin-btn-danger"
                              onClick={() => handelDelete(record._id, record.organisationName || record.hospitalName)}
                              title="Delete Organization"
                            >
                              <i className="fas fa-trash-alt"></i>
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

        {/* Simple Organization Details Modal */}
        {showDetailsModal && selectedOrganization && (
          <div className="modal fade show d-block admin-modal" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div className="modal-dialog modal-sm">
              <div className="modal-content">
                <div className="modal-header">
                  <h6 className="modal-title mb-0">Organization Details</h6>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white"
                    onClick={() => setShowDetailsModal(false)}
                  ></button>
                </div>
                <div className="modal-body text-center">
                  <div className="mb-4">
                    <h4 className="text-primary">{selectedOrganization.organisationName}</h4>
                    <p className="text-muted mb-0">{selectedOrganization.email}</p>
                    <p className="text-muted">{selectedOrganization.phone}</p>
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

        {/* Edit Organization Modal */}
        {showEditModal && selectedOrganization && (
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content" style={{borderRadius: '16px', overflow: 'hidden', border: 'none'}}>
                <div className="modal-header text-white" style={{background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)'}}>
                  <div className="d-flex align-items-center">
                    <div className="org-icon-gradient me-3" style={{width: '40px', height: '40px', fontSize: '1rem', background: 'rgba(255,255,255,0.2)'}}>
                      <i className="fas fa-edit"></i>
                    </div>
                    <h5 className="modal-title mb-0">
                      Edit Organization - {selectedOrganization.organisationName}
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
                          <i className="fas fa-building me-2"></i>
                          Organization Details
                        </h6>
                        <div className="mb-3">
                          <label className="form-label">Organization Name</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            defaultValue={selectedOrganization.organisationName}
                            style={{borderRadius: '8px'}}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Role</label>
                          <select className="form-select" defaultValue={selectedOrganization.role} style={{borderRadius: '8px'}}>
                            <option value="organisation">Organisation</option>
                            <option value="hospital">Hospital</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Website</label>
                          <input 
                            type="url" 
                            className="form-control" 
                            defaultValue={selectedOrganization.website || ''}
                            placeholder="https://example.com"
                            style={{borderRadius: '8px'}}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <h6 className="fw-bold text-success mb-3">
                          <i className="fas fa-address-book me-2"></i>
                          Contact Information
                        </h6>
                        <div className="mb-3">
                          <label className="form-label">Email</label>
                          <input 
                            type="email" 
                            className="form-control" 
                            defaultValue={selectedOrganization.email}
                            style={{borderRadius: '8px'}}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Phone</label>
                          <input 
                            type="tel" 
                            className="form-control" 
                            defaultValue={selectedOrganization.phone}
                            style={{borderRadius: '8px'}}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Address</label>
                          <textarea 
                            className="form-control" 
                            rows="3" 
                            defaultValue={selectedOrganization.address || ''}
                            style={{borderRadius: '8px'}}
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
                <div className="modal-footer bg-light">
                  <button 
                    type="button" 
                    className="btn btn-success"
                    onClick={() => {
                      toast.info("Edit functionality would save changes here");
                      setShowEditModal(false);
                    }}
                    style={{borderRadius: '12px'}}
                  >
                    <i className="fas fa-save me-2"></i>
                    Save Changes
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary"
                    onClick={() => setShowEditModal(false)}
                    style={{borderRadius: '12px'}}
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

export default OrgList;
