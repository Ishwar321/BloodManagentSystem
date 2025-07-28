import React, { useState, useEffect } from "react";
import Layout from "../components/shared/Layout/Layout";
import API from "../services/API";
import moment from "moment";
import { useSelector } from "react-redux";
import { AdminGlobalStyles } from "../styles/AdminStyles";

const DonationCamps = () => {
  const { user } = useSelector((state) => state.auth);
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filteredCamps, setFilteredCamps] = useState([]);

  const getCamps = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/camps/get-camps');
      if (data?.success) {
        setCamps(data.camps);
        setFilteredCamps(data.camps);
      } else {
        setCamps([]);
        setFilteredCamps([]);
      }
    } catch (error) {
      console.error("Error fetching camps:", error);
      setCamps([]);
      setFilteredCamps([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate useful statistics
  const calculateStats = () => {
    const totalCamps = camps.length;
    const thisMonthCamps = camps.filter(camp => 
      camp.date && moment(camp.date).isSame(moment(), 'month')
    ).length;
    const totalCapacity = camps.reduce((sum, camp) => 
      sum + (parseInt(camp.capacity) || 0), 0
    );
    const averageCapacity = totalCamps > 0 ? Math.round(totalCapacity / totalCamps) : 0;

    return {
      totalCamps,
      thisMonthCamps,
      totalCapacity,
      averageCapacity
    };
  };

  const stats = calculateStats();

  const getStatusBadge = (status) => {
    const statusColors = {
      upcoming: "primary",
      ongoing: "success",
      completed: "secondary",
      cancelled: "danger"
    };
    return (
      <span className={`admin-badge admin-badge-${statusColors[status] || 'secondary'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown'}
      </span>
    );
  };

  useEffect(() => {
    getCamps();
  }, []);

  if (loading && camps.length === 0) {
    return (
      <Layout>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading donation camps...</p>
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
                    <i className="fas fa-campground fa-2x"></i>
                  </div>
                  <div>
                    <h1 className="mb-2 fw-bold">Donation Camps {user?.role === 'donar' ? 'Directory' : 'Management'}</h1>
                    <p className="mb-0 fs-5 opacity-90">
                      {user?.role === 'donar' 
                        ? "Find and participate in blood donation camps near you"
                        : "Organize and manage blood donation camp events"
                      }
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-4 text-center">
                <div className="bg-white bg-opacity-20 rounded-4 p-3 d-inline-block">
                  <h3 className="mb-1 fw-bold">{stats.totalCamps}</h3>
                  <p className="mb-0 small">Total Camps</p>
                </div>
                {user?.role !== 'donar' && (
                  <button 
                    className="btn btn-light btn-lg mt-3"
                    onClick={() => console.log("Create Camp functionality to be implemented")}
                  >
                    <i className="fas fa-plus me-2"></i>
                    Create Camp
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="row g-4 mb-4">
            <div className="col-lg-3 col-md-6">
              <div className="admin-stat-card">
                <div className="d-flex align-items-center">
                  <div className="donor-icon-gradient me-3" style={{width: '60px', height: '60px', fontSize: '1.5rem'}}>
                    <i className="fas fa-campground"></i>
                  </div>
                  <div className="flex-grow-1">
                    <h3 className="mb-1 fw-bold" style={{color: '#f093fb'}}>{stats.totalCamps}</h3>
                    <p className="mb-1 fw-semibold text-dark">Total Camps</p>
                    <small className="text-muted">
                      <i className="fas fa-chart-line me-1"></i>
                      All registered camps
                    </small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="admin-stat-card">
                <div className="d-flex align-items-center">
                  <div className="admin-stat-icon me-3" style={{background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #047857 100%)'}}>
                    <i className="fas fa-calendar-alt"></i>
                  </div>
                  <div className="flex-grow-1">
                    <h3 className="mb-1 fw-bold text-success">{stats.thisMonthCamps}</h3>
                    <p className="mb-1 fw-semibold text-dark">This Month</p>
                    <small className="text-muted">
                      <i className="fas fa-calendar me-1"></i>
                      Camps scheduled
                    </small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="admin-stat-card">
                <div className="d-flex align-items-center">
                  <div className="admin-stat-icon me-3" style={{background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 50%, #0369a1 100%)'}}>
                    <i className="fas fa-users"></i>
                  </div>
                  <div className="flex-grow-1">
                    <h3 className="mb-1 fw-bold text-info">{stats.totalCapacity}</h3>
                    <p className="mb-1 fw-semibold text-dark">Total Capacity</p>
                    <small className="text-muted">
                      <i className="fas fa-user-friends me-1"></i>
                      Max participants
                    </small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="admin-stat-card">
                <div className="d-flex align-items-center">
                  <div className="admin-stat-icon me-3" style={{background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #b45309 100%)'}}>
                    <i className="fas fa-chart-bar"></i>
                  </div>
                  <div className="flex-grow-1">
                    <h3 className="mb-1 fw-bold text-warning">{stats.averageCapacity}</h3>
                    <p className="mb-1 fw-semibold text-dark">Average Capacity</p>
                    <small className="text-muted">
                      <i className="fas fa-calculator me-1"></i>
                      Per camp average
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Camps List */}
          <div className="admin-table-card">
            <div className="admin-table-header">
              <h5 className="mb-0">
                <i className="fas fa-list me-2"></i>
                Donation Camps ({filteredCamps.length} camps)
              </h5>
            </div>
            
            <div className="p-0">
              {filteredCamps.length === 0 ? (
                <div className="admin-no-data">
                  <i className="fas fa-campground fa-4x"></i>
                  <h4>No donation camps found</h4>
                  <p className="mb-4">
                    {user?.role === 'donar' 
                      ? "Check back later for upcoming blood donation camps in your area."
                      : "Start organizing blood donation camps to save lives in your community."
                    }
                  </p>
                  {user?.role !== 'donar' && (
                    <button 
                      className="admin-btn admin-btn-primary"
                      onClick={() => console.log("Create Camp functionality to be implemented")}
                    >
                      <i className="fas fa-plus me-2"></i>
                      Create Your First Camp
                    </button>
                  )}
                </div>
              ) : (
                <div className="row g-4 p-4">
                  {filteredCamps.map((camp) => (
                    <div key={camp._id || camp.id} className="col-lg-6 col-xl-4">
                      <div className="admin-stat-card h-100">
                        <div className="d-flex align-items-center mb-3">
                          <div className="donor-icon-gradient me-3" style={{width: '50px', height: '50px', fontSize: '1.2rem'}}>
                            <i className="fas fa-campground"></i>
                          </div>
                          <div className="flex-grow-1">
                            <h5 className="mb-1 fw-bold text-dark">{camp.name}</h5>
                            <p className="mb-0 text-muted small">{camp.description}</p>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          {getStatusBadge(camp.status)}
                        </div>

                        <div className="admin-contact-info">
                          <div className="admin-contact-item">
                            <i className="fas fa-calendar text-primary"></i>
                            <span>{camp.date ? moment(camp.date).format('MMM DD, YYYY') : 'Date TBD'}</span>
                          </div>
                          <div className="admin-contact-item">
                            <i className="fas fa-clock text-info"></i>
                            <span>{camp.startTime && camp.endTime ? `${camp.startTime} - ${camp.endTime}` : 'Time TBD'}</span>
                          </div>
                          <div className="admin-contact-item">
                            <i className="fas fa-map-marker-alt text-danger"></i>
                            <span>{camp.location?.city}, {camp.location?.state}</span>
                          </div>
                          <div className="admin-contact-item">
                            <i className="fas fa-users text-success"></i>
                            <span>Capacity: {camp.capacity || 'Unlimited'}</span>
                          </div>
                        </div>

                        <div className="text-center mt-3 pt-3 border-top">
                          <small className="text-muted">
                            <i className="fas fa-calendar me-1"></i>
                            Active Camp
                          </small>
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
    </Layout>
  );
};

export default DonationCamps;