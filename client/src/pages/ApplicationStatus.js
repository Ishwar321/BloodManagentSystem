import React, { useState, useEffect } from "react";
import Layout from "../components/shared/Layout/Layout";
import API from "../services/API";
import { toast } from "react-toastify";

const ApplicationStatus = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchHealthData();
  }, []);

  const fetchHealthData = async () => {
    try {
      const { data } = await API.get("/test");
      if (data.success) {
        setHealthData(data);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching health data:", error);
      toast.error("Failed to fetch application status");
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchHealthData();
    setRefreshing(false);
    toast.success("Status refreshed");
  };



  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "healthy":
      case "operational": 
      case "connected":
      case "ok": 
      case "excellent":
        return "success";
      case "degraded": 
      case "warning": 
      case "good":
        return "warning";
      case "error": 
      case "unhealthy":
      case "disconnected":
      case "failed": 
        return "danger";
      default: 
        return "secondary";
    }
  };

  if (loading) {
    return (
      <Layout>
        <style>
          {`
            .service-status-item, .database-status-item {
              padding: 12px;
              border-left: 4px solid #007bff;
              background: #f8f9fa;
              border-radius: 6px;
              margin-bottom: 8px;
              transition: all 0.3s ease;
            }
            .service-status-item:hover, .database-status-item:hover {
              background: #e9ecef;
              border-left-color: #0056b3;
            }
            .performance-metric {
              transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            .performance-metric:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            .real-time-badge {
              animation: pulse 2s infinite;
            }
            @keyframes pulse {
              0% { opacity: 1; }
              50% { opacity: 0.7; }
              100% { opacity: 1; }
            }
          `}
        </style>
        <div className="container mt-4">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading application status...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <style>
        {`
          .service-status-item, .database-status-item {
            padding: 12px;
            border-left: 4px solid #007bff;
            background: #f8f9fa;
            border-radius: 6px;
            margin-bottom: 8px;
            transition: all 0.3s ease;
          }
          .service-status-item:hover, .database-status-item:hover {
            background: #e9ecef;
            border-left-color: #0056b3;
          }
          .performance-metric {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          .performance-metric:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          }
          .real-time-badge {
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
          }
        `}
      </style>
      <div className="container mt-4">
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2>
                  <i className="fas fa-heartbeat me-2 text-primary"></i>
                  Real-time System Monitor
                </h2>
                <small className="text-muted">Live application health and performance metrics</small>
              </div>
              <div>
                <span className="badge bg-success real-time-badge me-3">LIVE</span>
                <button 
                  className="btn btn-outline-primary me-2"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  {refreshing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sync-alt me-2"></i>
                      Refresh
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {healthData && (
          <>
            {/* Overall Status */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">Overall System Status</h5>
                    <div className="d-flex align-items-center">
                      <span className={`badge bg-${getStatusColor(healthData.status)} fs-6 me-3`}>
                        {healthData.status}
                      </span>
                      <span className="text-muted">
                        Last updated: {new Date(healthData.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Services Status */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">Services Status</h5>
                    <div className="row">
                      <div className="col-md-6 mb-2">
                        <div className="database-status-item">
                          <div className="d-flex justify-content-between align-items-center">
                            <strong>Database:</strong>
                            <span className={`badge bg-${healthData.database?.status === 'connected' ? 'success' : 'danger'} ms-2`}>
                              {healthData.database?.status || 'Unknown'}
                            </span>
                          </div>
                          {healthData.database?.responseTime && (
                            <small className="text-muted d-block">Response time: {healthData.database.responseTime}</small>
                          )}
                          {healthData.database?.collections && (
                            <small className="text-muted d-block">
                              Collections: {healthData.database.collections.users} users, {healthData.database.collections.inventory} inventory
                            </small>
                          )}
                        </div>
                      </div>
                      {healthData.services && Object.entries(healthData.services).map(([service, details]) => (
                        <div key={service} className="col-md-6 mb-2">
                          <div className="service-status-item">
                            <div className="d-flex justify-content-between align-items-center">
                              <strong>{service.charAt(0).toUpperCase() + service.slice(1)}:</strong>
                              <span className={`badge bg-${getStatusColor(details.status)} ms-2`}>
                                {details.status}
                              </span>
                            </div>
                            {details.description && (
                              <small className="text-muted d-block">{details.description}</small>
                            )}
                            {details.lastChecked && (
                              <small className="text-muted d-block">
                                Last checked: {new Date(details.lastChecked).toLocaleTimeString()}
                              </small>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            {healthData.performance && (
              <div className="row mb-4">
                <div className="col-12">
                  <div className="card">
                    <div className="card-body">
                      <h5 className="card-title">Real-time Performance Metrics</h5>
                      <div className="row">
                        <div className="col-md-4 mb-3">
                          <div className="performance-metric bg-primary text-white p-3 rounded text-center">
                            <h4 className="mb-1">
                              {healthData.performance.responseTime || 'N/A'}
                            </h4>
                            <small>API Response Time</small>
                          </div>
                        </div>
                        <div className="col-md-4 mb-3">
                          <div className="performance-metric bg-success text-white p-3 rounded text-center">
                            <h4 className="mb-1">
                              {healthData.performance.uptime || 'N/A'}
                            </h4>
                            <small>Server Uptime</small>
                          </div>
                        </div>
                        <div className="col-md-4 mb-3">
                          <div className={`performance-metric bg-${healthData.performance.healthScore === 'excellent' ? 'success' : 'warning'} text-white p-3 rounded text-center`}>
                            <h4 className="mb-1">{healthData.performance.healthScore}</h4>
                            <small>Health Score</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default ApplicationStatus;
