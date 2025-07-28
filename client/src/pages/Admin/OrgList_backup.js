import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout/Layout";
import moment from "moment";
import API from "../../services/API";
import { toast } from "react-toastify";
import { AdminTheme, AdminGlobalStyles } from "../../styles/AdminStyles";

const OrgList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrganizations, setSelectedOrganizations] = useState([]);

  // Selection handlers
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedOrganizations(filteredData.map(org => org._id));
    } else {
      setSelectedOrganizations([]);
    }
  };

  const handleSelectOrganization = (orgId) => {
    setSelectedOrganizations(prev => 
      prev.includes(orgId) 
        ? prev.filter(id => id !== orgId)
        : [...prev, orgId]
    );
  };

  // Export to CSV function
  const exportToCSV = () => {
    const csvData = filteredData.map(org => ({
      Name: org.organisationName,
      Email: org.email,
      Phone: org.phone,
      Address: org.address || 'N/A',
      Website: org.website || 'N/A',
      Role: org.role,
      'Registration Date': moment(org.createdAt).format('DD/MM/YYYY'),
      'Registration Time': moment(org.createdAt).format('h:mm A')
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `organizations_${moment().format('YYYY-MM-DD')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

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
    let filtered = data.filter(org => {
      const matchesSearch = 
        org.organisationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.phone.includes(searchTerm) ||
        (org.address && org.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (org.website && org.website.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "recent" && moment(org.createdAt).isAfter(moment().subtract(30, 'days'))) ||
        (statusFilter === "active" && org.role === "organisation");
      
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

  return (
    <Layout>
      <style dangerouslySetInnerHTML={{ __html: AdminGlobalStyles }} />
      <style dangerouslySetInnerHTML={{
        __html: `
          .organization-gradient {
            background: linear-gradient(135deg, #2E86AB 0%, #A23B72 100%);
          }
          
          .org-stat-card {
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            border: none;
            transition: all 0.3s ease;
            overflow: hidden;
            position: relative;
          }
          
          .org-stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #2E86AB, #A23B72);
          }
          
          .org-stat-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          }
          
          .org-icon-gradient {
            background: linear-gradient(135deg, #2E86AB 0%, #A23B72 100%);
            width: 60px;
            height: 60px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.5rem;
            margin-bottom: 1rem;
          }
          
          .org-search-section {
            background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
            border-radius: 20px;
            padding: 2rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.05);
            margin-bottom: 2rem;
          }
          
          .org-search-input {
            border: 2px solid #e9ecef;
            border-radius: 12px;
            padding: 1rem 1.5rem;
            font-size: 1rem;
            transition: all 0.3s ease;
            background: white;
          }
          
          .org-search-input:focus {
            border-color: #2E86AB;
            box-shadow: 0 0 0 0.2rem rgba(46, 134, 171, 0.25);
            outline: none;
          }
          
          .org-filter-select {
            border: 2px solid #e9ecef;
            border-radius: 12px;
            padding: 1rem 1.5rem;
            font-size: 1rem;
            background: white;
            transition: all 0.3s ease;
          }
          
          .org-filter-select:focus {
            border-color: #A23B72;
            box-shadow: 0 0 0 0.2rem rgba(162, 59, 114, 0.25);
            outline: none;
          }
          
          .enhanced-org-table {
            background: white;
            border-radius: 20px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
            overflow: hidden;
            border: none;
          }
          
          .org-table-header {
            background: linear-gradient(135deg, #2E86AB 0%, #A23B72 100%);
            color: white;
            padding: 2rem;
          }
          
          .org-premium-thead {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-bottom: 2px solid #dee2e6;
          }
          
          .org-premium-thead th {
            border: none;
            padding: 1.5rem 1rem;
            font-weight: 600;
            color: #495057;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .org-premium-row {
            transition: all 0.3s ease;
            border: none;
          }
          
          .org-premium-row:hover {
            background: linear-gradient(135deg, #f0f8ff 0%, #fff0f8 100%);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
          }
          
          .org-premium-row td {
            border: none;
            padding: 1.5rem 1rem;
            vertical-align: middle;
            border-bottom: 1px solid #f1f3f4;
          }
          
          .org-avatar {
            width: 45px;
            height: 45px;
            background: linear-gradient(135deg, #2E86AB 0%, #A23B72 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.2rem;
          }
          
          .org-website-link {
            color: #2E86AB;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.3s ease;
          }
          
          .org-website-link:hover {
            color: #A23B72;
            text-decoration: underline;
          }
          
          .org-premium-btn {
            border-radius: 8px;
            padding: 0.5rem;
            width: 35px;
            height: 35px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            margin: 0 2px;
          }
          
          .org-premium-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
          }
          
          .professional-org-modal .modal-content {
            border: none;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2);
            overflow: hidden;
          }
          
          .professional-org-modal .modal-header {
            background: linear-gradient(135deg, #2E86AB 0%, #A23B72 100%);
            color: white;
            border: none;
            padding: 2rem;
          }
          
          .professional-org-footer {
            background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
            border-radius: 20px;
            padding: 2rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          }
          
          .org-footer-stat-card {
            background: white;
            border-radius: 16px;
            padding: 1.5rem;
            box-shadow: 0 8px 25px rgba(0,0,0,0.08);
            transition: all 0.3s ease;
            border: 1px solid #f1f3f4;
            height: 100%;
            display: flex;
            align-items: center;
          }
          
          .org-footer-stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(0,0,0,0.12);
          }
          
          .org-footer-stat-icon {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #2E86AB 0%, #A23B72 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.2rem;
            margin-right: 1rem;
            flex-shrink: 0;
          }
        `
      }} />
      <div className="admin-theme">
        <div className="admin-container">
          {/* Professional Header */}
          <div className="organization-header p-5 mb-4 text-center position-relative organization-gradient text-white">
            <div className="row align-items-center">
              <div className="col-md-8 text-md-start text-center">
                <div className="d-flex align-items-center justify-content-md-start justify-content-center mb-3">
                  <div className="bg-white bg-opacity-20 rounded-circle p-3 me-3">
                    <i className="fas fa-building fa-2x"></i>
                  </div>
                  <div>
                    <h1 className="mb-2 fw-bold">Organization Management System</h1>
                    <p className="mb-0 fs-5 opacity-90">Comprehensive organizational administration and oversight</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4 text-center">
                <div className="bg-white bg-opacity-20 rounded-4 p-3 d-inline-block">
                  <h3 className="mb-1 fw-bold">{data.length}</h3>
                  <p className="mb-0 small">Registered Organizations</p>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Statistics Cards */}
          <div className="row g-4 mb-5">
            <div className="col-lg-3 col-md-6">
              <div className="org-stat-card p-4 h-100">
                <div className="org-icon-gradient">
                  <i className="fas fa-building"></i>
                </div>
                <h3 className="fw-bold mb-2">{data.length}</h3>
                <p className="text-muted mb-2">Total Organizations</p>
                <small className="text-success">
                  <i className="fas fa-arrow-up me-1"></i>
                  All registered organizations
                </small>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="org-stat-card p-4 h-100">
                <div className="org-icon-gradient">
                  <i className="fas fa-search"></i>
                </div>
                <h3 className="fw-bold mb-2">{filteredData.length}</h3>
                <p className="text-muted mb-2">Search Results</p>
                <small className="text-info">
                  <i className="fas fa-filter me-1"></i>
                  Current filter results
                </small>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="org-stat-card p-4 h-100">
                <div className="org-icon-gradient">
                  <i className="fas fa-calendar-plus"></i>
                </div>
                <h3 className="fw-bold mb-2">
                  {data.filter(org => moment(org.createdAt).isAfter(moment().subtract(30, 'days'))).length}
                </h3>
                <p className="text-muted mb-2">New This Month</p>
                <small className="text-warning">
                  <i className="fas fa-clock me-1"></i>
                  Last 30 days
                </small>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="org-stat-card p-4 h-100">
                <div className="org-icon-gradient">
                  <i className="fas fa-globe"></i>
                </div>
                <h3 className="fw-bold mb-2">
                  {data.filter(org => org.website).length}
                </h3>
                <p className="text-muted mb-2">With Websites</p>
                <small className="text-primary">
                  <i className="fas fa-link me-1"></i>
                  Online presence
                </small>
              </div>
            </div>
          </div>

          {/* Enhanced Search Section */}
          <div className="org-search-section">
            <div className="row g-3 align-items-end">
              <div className="col-md-6">
                <label className="form-label fw-bold">
                  <i className="fas fa-search me-2"></i>
                  Search Organizations
                </label>
                <input
                  type="text"
                  className="form-control org-search-input"
                  placeholder="Search by name, email, phone, address, or website..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-bold">
                  <i className="fas fa-filter me-2"></i>
                  Filter by Status
                </label>
                <select
                  className="form-select org-filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Organizations</option>
                  <option value="recent">Recent (30 days)</option>
                  <option value="active">Active Organizations</option>
                </select>
              </div>
              <div className="col-md-3">
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-primary flex-fill"
                    onClick={getOrganizations}
                    disabled={loading}
                  >
                    <i className="fas fa-sync-alt me-2"></i>
                    {loading ? "Loading..." : "Refresh"}
                  </button>
                  <button 
                    className="btn btn-outline-success"
                    onClick={exportToCSV}
                    disabled={filteredData.length === 0}
                    title="Export to CSV"
                  >
                    <i className="fas fa-download"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
                  {data.filter(o => moment(o.createdAt).isAfter(moment().subtract(30, 'days'))).length} added this month
                </small>
              </div>
            </div>
            <div className="admin-stat-item">
              <div className="admin-stat-icon" style={{ backgroundColor: AdminTheme.colors.success }}>
                <i className="fas fa-check-circle"></i>
              </div>
              <div>
                <h3>{filteredData.length}</h3>
                <p>Search Results</p>
                <small className="text-muted">
                  {searchTerm ? `Matching "${searchTerm}"` : "All organizations shown"}
                </small>
              </div>
            </div>
            <div className="admin-stat-item">
              <div className="admin-stat-icon" style={{ backgroundColor: AdminTheme.colors.warning }}>
                <i className="fas fa-briefcase"></i>
              </div>
              <div>
                <h3>{data.filter(org => org.role === 'organisation').length}</h3>
                <p>Active Organizations</p>
                <small className="text-muted">
                  Verified and operational
                </small>
              </div>
            </div>
            <div className="admin-stat-item">
              <div className="admin-stat-icon" style={{ backgroundColor: AdminTheme.colors.info }}>
                <i className="fas fa-globe"></i>
              </div>
              <div>
                <h3>{data.filter(o => o.website).length}</h3>
                <p>With Websites</p>
                <small className="text-muted">
                  Organizations with web presence
                </small>
              </div>
            </div>
          </div>

          {/* Advanced Search and Filter Section */}
          <div className="admin-search-card">
            <div className="row align-items-center">
              <div className="col-md-8">
                <h5 className="admin-search-title">
                  <i className="fas fa-search me-2"></i>
                  Advanced Organization Search & Filters
                </h5>
                <div className="admin-search-input">
                  <i className="fas fa-building"></i>
                  <input
                    type="text"
                    placeholder="Search by organization name, email, phone, website, or address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button 
                      className="btn btn-sm btn-outline-secondary ms-2"
                      onClick={() => setSearchTerm("")}
                      title="Clear search"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold">Filter by Status</label>
                <select 
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Organizations</option>
                  <option value="active">Active Only</option>
                  <option value="recent">Recent (30 days)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Enhanced Table */}
          <div className="admin-table-card">
            <div className="admin-table-header">
              <h5>
                <i className="fas fa-list me-2"></i>
                Organization Directory ({filteredData.length} organizations)
              </h5>
              <button 
                className="admin-btn-primary"
                onClick={getOrganizations}
                disabled={loading}
              >
                <i className="fas fa-sync-alt me-2"></i>
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {loading ? (
              <div className="admin-loading">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p>Loading organization data...</p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="admin-no-data">
                <i className="fas fa-building fa-3x mb-3"></i>
                <h4>No Organizations Found</h4>
                <p>
                  {searchTerm 
                    ? `No organizations match your search criteria: "${searchTerm}"`
                    : "No organizations are registered in the system yet."
                  }
                </p>
                {searchTerm && (
                  <button 
                    className="admin-btn-outline"
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
                              className="admin-btn-sm admin-btn-outline"
                              onClick={() => {
                                setSelectedOrganization(record);
                                setShowDetailsModal(true);
                              }}
                              title="View Organization Details"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              className="admin-btn-sm admin-btn-primary"
                              title="Edit Organization"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="admin-btn-sm admin-btn-success me-2"
                              title="Visit Website"
                              onClick={() => record.website && window.open(record.website, '_blank')}
                              disabled={!record.website}
                            >
                              <i className="fas fa-globe"></i>
                            </button>
                            <button
                              className="admin-btn-sm admin-btn-info me-2"
                              title="Contact Organization"
                            >
                              <i className="fas fa-envelope"></i>
                            </button>
                            <button
                              className="admin-btn-sm admin-btn-danger"
                              onClick={() => handelDelete(record._id, record.organisationName || record.hospitalName)}
                              title="Delete Organization"
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

          {/* Additional Statistics Footer */}
          <div className="admin-footer-stats">
            <div className="admin-footer-stat">
              <span className="admin-footer-label">Total Organizations:</span>
              <span className="admin-footer-value">{data.length}</span>
            </div>
            <div className="admin-footer-stat">
              <span className="admin-footer-label">Last Updated:</span>
              <span className="admin-footer-value">{moment().format("DD/MM/YYYY h:mm A")}</span>
            </div>
            <div className="admin-footer-stat">
              <span className="admin-footer-label">System Status:</span>
              <span className="admin-footer-value admin-status-active">Active</span>
            </div>
            <div className="admin-footer-stat">
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={() => {
                  const csvContent = "data:text/csv;charset=utf-8," + 
                    "Organization Name,Email,Phone,Website,Address,Registration Date\n" +
                    filteredData.map(o => 
                      `"${o.organisationName}","${o.email}","${o.phone}","${o.website || 'N/A'}","${o.address || 'N/A'}","${moment(o.createdAt).format('DD/MM/YYYY')}"`
                    ).join("\n");
                  const link = document.createElement("a");
                  link.setAttribute("href", encodeURI(csvContent));
                  link.setAttribute("download", `organizations_${moment().format('YYYY-MM-DD')}.csv`);
                  link.click();
                }}
              >
                <i className="fas fa-download me-1"></i>
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Organization Details Modal */}
        {showDetailsModal && selectedOrganization && (
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">
                    <i className="fas fa-building me-2"></i>
                    Organization Details - {selectedOrganization.organisationName}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white"
                    onClick={() => setShowDetailsModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <h6 className="fw-bold text-primary mb-3">
                        <i className="fas fa-info-circle me-2"></i>
                        Basic Information
                      </h6>
                      <div className="mb-3">
                        <strong>Organization Name:</strong>
                        <div className="text-muted">{selectedOrganization.organisationName}</div>
                      </div>
                      <div className="mb-3">
                        <strong>Role:</strong>
                        <span className="badge bg-info ms-2">{selectedOrganization.role}</span>
                      </div>
                      <div className="mb-3">
                        <strong>Registration Date:</strong>
                        <div className="text-muted">
                          {moment(selectedOrganization.createdAt).format('MMMM DD, YYYY')}
                          <small className="text-muted ms-2">
                            ({moment(selectedOrganization.createdAt).fromNow()})
                          </small>
                        </div>
                      </div>
                      {selectedOrganization.website && (
                        <div className="mb-3">
                          <strong>Website:</strong>
                          <div className="text-muted">
                            <a href={selectedOrganization.website} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                              {selectedOrganization.website}
                              <i className="fas fa-external-link-alt ms-1 small"></i>
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <h6 className="fw-bold text-success mb-3">
                        <i className="fas fa-address-book me-2"></i>
                        Contact Information
                      </h6>
                      <div className="mb-3">
                        <strong>Email:</strong>
                        <div className="text-muted">
                          <a href={`mailto:${selectedOrganization.email}`} className="text-decoration-none">
                            {selectedOrganization.email}
                          </a>
                        </div>
                      </div>
                      <div className="mb-3">
                        <strong>Phone:</strong>
                        <div className="text-muted">
                          <a href={`tel:${selectedOrganization.phone}`} className="text-decoration-none">
                            {selectedOrganization.phone}
                          </a>
                        </div>
                      </div>
                      {selectedOrganization.address && (
                        <div className="mb-3">
                          <strong>Address:</strong>
                          <div className="text-muted">{selectedOrganization.address}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  {selectedOrganization.website && (
                    <button 
                      type="button" 
                      className="btn btn-outline-info"
                      onClick={() => window.open(selectedOrganization.website, '_blank')}
                    >
                      <i className="fas fa-globe me-2"></i>
                      Visit Website
                    </button>
                  )}
                  <button 
                    type="button" 
                    className="btn btn-outline-primary"
                    onClick={() => window.open(`mailto:${selectedOrganization.email}`, '_blank')}
                  >
                    <i className="fas fa-envelope me-2"></i>
                    Send Email
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    Close
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
