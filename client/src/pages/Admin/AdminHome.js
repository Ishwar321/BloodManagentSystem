import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout/Layout";
import { useSelector } from "react-redux";
import API from "../../services/API";
import { AdminGlobalStyles } from "../../styles/AdminStyles";
import moment from "moment";

const AdminHome = () => {
  const { user } = useSelector((state) => state.auth);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data
  const getDashboardData = async () => {
    try {
      const response = await API.get("/admin/dashboard");
      if (response.data?.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDashboardData();
  }, []);

  return (
    <Layout>
      <style dangerouslySetInnerHTML={{ __html: AdminGlobalStyles }} />
      <div className="container-fluid p-4 admin-theme">
        {/* Professional Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="admin-card admin-header">
              <div className="card-body py-5 text-center position-relative">
                <div className="admin-icon-bg">
                  <i className="fas fa-shield-alt"></i>
                </div>
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <div className="d-flex align-items-center justify-content-center justify-content-md-start">
                      <div className="me-4">
                        <i className="fas fa-shield-alt fa-4x opacity-75"></i>
                      </div>
                      <div className="text-center text-md-start">
                        <h1 className="h2 mb-2 fw-bold">Administrative Control Center</h1>
                        <p className="mb-1 fs-5">Welcome back, <span className="text-warning fw-bold">{user?.name}</span></p>
                        <p className="mb-0 opacity-75">Comprehensive blood bank management platform</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 text-center text-md-end mt-3 mt-md-0">
                    <div className="d-flex flex-column align-items-center align-items-md-end">
                      <div className="badge bg-light text-dark fs-6 px-3 py-2 mb-2">
                        <i className="fas fa-clock me-2"></i>
                        Real-time Dashboard
                      </div>
                      <small className="opacity-75">Last updated: {moment().format('MMMM DD, YYYY [at] HH:mm')}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading">
            <div className="text-center">
              <div className="admin-spinner mb-3"></div>
              <h5 className="text-muted mb-2">Loading Dashboard Data</h5>
              <p className="text-muted">Please wait while we fetch the latest statistics...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Enhanced Statistics Cards */}
            <div className="row g-4 mb-5">
              <div className="col-lg-3 col-md-6">
                <div className="admin-stat-card donors">
                  <div className="admin-icon-bg">
                    <i className="fas fa-hand-holding-medical"></i>
                  </div>
                  <div className="d-flex align-items-center mb-3">
                    <div className="admin-stat-icon bg-danger bg-opacity-10 text-danger me-3">
                      <i className="fas fa-hand-holding-medical"></i>
                    </div>
                    <div className="flex-grow-1">
                      <div className="admin-number text-danger">{data.totalDonors || 0}</div>
                      <div className="admin-label">Total Donors</div>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      <i className="fas fa-users me-1"></i>
                      Registered Donors
                    </small>
                    <small className="text-muted">Total: {data.totalDonors || 0}</small>
                  </div>
                </div>
              </div>
              
              <div className="col-lg-3 col-md-6">
                <div className="admin-stat-card hospitals">
                  <div className="admin-icon-bg">
                    <i className="fas fa-hospital-alt"></i>
                  </div>
                  <div className="d-flex align-items-center mb-3">
                    <div className="admin-stat-icon bg-success bg-opacity-10 text-success me-3">
                      <i className="fas fa-hospital-alt"></i>
                    </div>
                    <div className="flex-grow-1">
                      <div className="admin-number text-success">{data.totalHospitals || 0}</div>
                      <div className="admin-label">Total Hospitals</div>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      <i className="fas fa-hospital me-1"></i>
                      Registered Hospitals
                    </small>
                    <small className="text-muted">Total: {data.totalHospitals || 0}</small>
                  </div>
                </div>
              </div>
              
              <div className="col-lg-3 col-md-6">
                <div className="admin-stat-card organizations">
                  <div className="admin-icon-bg">
                    <i className="fas fa-building"></i>
                  </div>
                  <div className="d-flex align-items-center mb-3">
                    <div className="admin-stat-icon bg-warning bg-opacity-10 text-warning me-3">
                      <i className="fas fa-building"></i>
                    </div>
                    <div className="flex-grow-1">
                      <div className="admin-number text-warning">{data.totalOrganizations || 0}</div>
                      <div className="admin-label">Organizations</div>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      <i className="fas fa-building me-1"></i>
                      Registered Organizations
                    </small>
                    <small className="text-muted">Total: {data.totalOrganizations || 0}</small>
                  </div>
                </div>
              </div>
              
              <div className="col-lg-3 col-md-6">
                <div className="admin-stat-card inventory">
                  <div className="admin-icon-bg">
                    <i className="fas fa-warehouse"></i>
                  </div>
                  <div className="d-flex align-items-center mb-3">
                    <div className="admin-stat-icon bg-info bg-opacity-10 text-info me-3">
                      <i className="fas fa-warehouse"></i>
                    </div>
                    <div className="flex-grow-1">
                      <div className="admin-number text-info">{data.totalInventory || 0}</div>
                      <div className="admin-label">Total Records</div>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      <i className="fas fa-warehouse me-1"></i>
                      Inventory Records
                    </small>
                    <small className="text-muted">Total: {data.totalInventory || 0}</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Blood Group Inventory */}
            <div className="row g-4">
              <div className="col-lg-12">
                <div className="admin-card">
                  <div className="card-header bg-white border-bottom-0 pb-0">
                    <h5 className="mb-3 fw-bold text-dark">
                      <i className="fas fa-tint me-2 text-danger"></i>
                      Blood Group Inventory Status
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="admin-table table table-hover align-middle mb-0">
                        <thead className="admin-table-header">
                          <tr>
                            <th scope="col" className="border-0 py-3">
                              <i className="fas fa-tint me-2 text-danger"></i>
                              Blood Group
                            </th>
                            <th scope="col" className="border-0 text-center py-3">
                              <i className="fas fa-arrow-down me-1 text-success"></i>
                              In Stock (ML)
                            </th>
                            <th scope="col" className="border-0 text-center py-3">
                              <i className="fas fa-arrow-up me-1 text-warning"></i>
                              Distributed (ML)
                            </th>
                            <th scope="col" className="border-0 text-center py-3">
                              <i className="fas fa-balance-scale me-1 text-info"></i>
                              Available
                            </th>
                            <th scope="col" className="border-0 text-center py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.bloodGroupData && data.bloodGroupData.length > 0 ? (
                            data.bloodGroupData.map((bloodGroup) => (
                              <tr key={bloodGroup.bloodGroup}>
                                <td className="py-3">
                                  <span className="badge bg-danger fs-6 px-3 py-2 fw-bold">
                                    {bloodGroup.bloodGroup}
                                  </span>
                                </td>
                                <td className="text-center py-3">
                                  <span className="fw-bold text-success">{bloodGroup.totalIn || 0}</span>
                                </td>
                                <td className="text-center py-3">
                                  <span className="fw-bold text-warning">{bloodGroup.totalOut || 0}</span>
                                </td>
                                <td className="text-center py-3">
                                  <span className="fw-bold text-info">{(bloodGroup.totalIn || 0) - (bloodGroup.totalOut || 0)}</span>
                                </td>
                                <td className="text-center py-3">
                                  <span className={`admin-badge ${
                                    ((bloodGroup.totalIn || 0) - (bloodGroup.totalOut || 0)) > 1000 
                                      ? 'admin-badge-active bg-success' 
                                      : ((bloodGroup.totalIn || 0) - (bloodGroup.totalOut || 0)) > 500 
                                        ? 'admin-badge-warning bg-warning' 
                                        : 'admin-badge-inactive bg-danger'
                                  }`}>
                                    {((bloodGroup.totalIn || 0) - (bloodGroup.totalOut || 0)) > 1000 
                                      ? 'High' 
                                      : ((bloodGroup.totalIn || 0) - (bloodGroup.totalOut || 0)) > 500 
                                        ? 'Medium' 
                                        : 'Low'
                                    }
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((bloodGroup) => (
                              <tr key={bloodGroup}>
                                <td className="py-3">
                                  <span className="badge bg-danger fs-6 px-3 py-2 fw-bold">
                                    {bloodGroup}
                                  </span>
                                </td>
                                <td className="text-center py-3">
                                  <span className="fw-bold text-muted">0</span>
                                </td>
                                <td className="text-center py-3">
                                  <span className="fw-bold text-muted">0</span>
                                </td>
                                <td className="text-center py-3">
                                  <span className="fw-bold text-muted">0</span>
                                </td>
                                <td className="text-center py-3">
                                  <span className="admin-badge admin-badge-inactive bg-secondary">
                                    No Data
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default AdminHome;
