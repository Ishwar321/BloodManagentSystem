import React, { useEffect, useState } from "react";
import Layout from "./../../components/shared/Layout/Layout";
import moment from "moment";
import API from "../../services/API";
import { toast } from "react-toastify";
import { AdminGlobalStyles } from "../../styles/AdminStyles";

const DonarList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);

  //find donar records
  const getDonars = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/admin/donar-list");
      if (data?.success) {
        // Filter to show only donors (users with role 'donar')
        const donorsOnly = data?.donarData?.filter(user => user.role === 'donar') || [];
        setData(donorsOnly);
        setFilteredData(donorsOnly);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch donors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDonars();
  }, []);

  // Filter function
  useEffect(() => {
    const filtered = data.filter(donor =>
      (donor.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      donor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donor.phone.includes(searchTerm) ||
      (donor.inventorytype || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (donor.bloodGroup || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(filtered);
  }, [searchTerm, data]);

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
                    <i className="fas fa-users fa-2x"></i>
                  </div>
                  <div>
                    <h1 className="mb-2 fw-bold">Donor Management System</h1>
                    <p className="mb-0 fs-5 opacity-90">Comprehensive blood donor administration and oversight</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4 text-center">
                <div className="bg-white bg-opacity-20 rounded-4 p-3 d-inline-block">
                  <h3 className="mb-1 fw-bold">{data.length}</h3>
                  <p className="mb-0 small">Registered Donors</p>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="row g-4 mb-4">
            <div className="col-lg-3 col-md-6">
              <div className="admin-stat-card">
                <div className="d-flex align-items-center">
                  <div className="donor-icon-gradient me-3" style={{width: '60px', height: '60px', fontSize: '1.5rem'}}>
                    <i className="fas fa-users"></i>
                  </div>
                  <div className="flex-grow-1">
                    <h3 className="mb-1 fw-bold" style={{color: '#f093fb'}}>{data.length}</h3>
                    <p className="mb-1 fw-semibold text-dark">Total Donors</p>
                    <small className="text-muted">
                      <i className="fas fa-plus-circle me-1"></i>
                      {data.filter(d => moment(d.createdAt).isAfter(moment().subtract(30, 'days'))).length} added this month
                    </small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="admin-stat-card">
                <div className="d-flex align-items-center">
                  <div className="admin-stat-icon me-3" style={{background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #047857 100%)'}}>
                    <i className="fas fa-search"></i>
                  </div>
                  <div className="flex-grow-1">
                    <h3 className="mb-1 fw-bold text-success">{filteredData.length}</h3>
                    <p className="mb-1 fw-semibold text-dark">Search Results</p>
                    <small className="text-muted">
                      <i className="fas fa-filter me-1"></i>
                      {searchTerm ? `Matching "${searchTerm}"` : "All donors shown"}
                    </small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="admin-stat-card">
                <div className="d-flex align-items-center">
                  <div className="admin-stat-icon me-3" style={{background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #b91c1c 100%)'}}>
                    <i className="fas fa-tint"></i>
                  </div>
                  <div className="flex-grow-1">
                    <h3 className="mb-1 fw-bold text-danger">{[...new Set(data.map(d => d.bloodGroup))].length}</h3>
                    <p className="mb-1 fw-semibold text-dark">Blood Groups</p>
                    <small className="text-muted">
                      <i className="fas fa-heartbeat me-1"></i>
                      Available types
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
                    <h3 className="mb-1 fw-bold text-info">{data.filter(d => moment(d.createdAt).isAfter(moment().subtract(7, 'days'))).length}</h3>
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

          {/* Search Section */}
          <div className="admin-search-section">
            <div className="d-flex align-items-center mb-3">
              <div className="donor-icon-gradient me-3" style={{width: '50px', height: '50px', fontSize: '1.2rem'}}>
                <i className="fas fa-search"></i>
              </div>
              <div>
                <h4 className="mb-1 fw-bold text-dark">Search Donors</h4>
                <p className="mb-0 text-muted">Find donors by name, email, phone, or blood group</p>
              </div>
            </div>
            <div className="row g-3 align-items-end">
              <div className="col-md-9">
                <label className="admin-form-label">
                  <i className="fas fa-search me-2"></i>
                  Search Donors
                </label>
                <input
                  type="text"
                  className="admin-form-control donor-search-input"
                  placeholder="Search by name, email, phone, or blood group..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <button 
                  className="admin-btn admin-btn-primary w-100"
                  onClick={getDonars}
                  disabled={loading}
                >
                  <i className="fas fa-sync-alt"></i>
                  {loading ? "Loading..." : "Refresh"}
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="admin-table-card">
            <div className="admin-table-header">
              <h5 className="mb-0">
                <i className="fas fa-list me-2"></i>
                Donor Directory ({filteredData.length} donors)
              </h5>
            </div>

            {loading ? (
              <div className="admin-loading">
                <i className="fas fa-spinner fa-spin"></i>
                <h4 className="text-muted">Loading Donors...</h4>
                <p className="text-muted mb-0">Please wait while we fetch the latest data</p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="admin-no-data">
                <i className="fas fa-users"></i>
                <h4>No Donors Found</h4>
                <p>
                  {searchTerm 
                    ? `No donors match your search criteria: "${searchTerm}"`
                    : "No donors are registered in the system yet."
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
                      <th>
                        <i className="fas fa-user me-2"></i>
                        Donor Details
                      </th>
                      <th>
                        <i className="fas fa-envelope me-2"></i>
                        Contact Information
                      </th>
                      <th>
                        <i className="fas fa-tint me-2"></i>
                        Blood Information
                      </th>
                      <th>
                        <i className="fas fa-calendar me-2"></i>
                        Registration Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((record) => (
                      <tr key={record._id}>
                        <td>
                          <div className="admin-table-user">
                            <div className="admin-table-avatar">
                              <i className="fas fa-user"></i>
                            </div>
                            <div>
                              <div className="admin-table-name">
                                {record.name || record.organisationName}
                              </div>
                              <div className="admin-table-meta">
                                <span className="admin-badge admin-badge-info">
                                  <i className="fas fa-user me-1"></i>
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
                            {record.address && (
                              <div className="admin-contact-item">
                                <i className="fas fa-map-marker-alt text-danger"></i>
                                <span>{record.address}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="me-3">
                              <span className="admin-badge admin-badge-primary" style={{fontSize: '1rem', padding: '0.5rem 1rem'}}>
                                <i className="fas fa-tint me-2"></i>
                                {record.bloodGroup || 'N/A'}
                              </span>
                            </div>
                            {record.inventorytype && (
                              <small className="text-muted">
                                Type: {record.inventorytype}
                              </small>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DonarList;