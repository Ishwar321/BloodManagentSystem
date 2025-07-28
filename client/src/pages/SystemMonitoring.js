import React, { useState, useEffect } from 'react';
import Layout from '../components/shared/Layout/Layout';
import API from '../services/API';
import { toast } from 'react-toastify';

const SystemMonitoring = () => {
  const [metrics, setMetrics] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchData();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching system monitoring data...');
      
      const [testRes, healthRes] = await Promise.all([
        API.get('/test'), // Main system metrics from test controller
        API.get('/health') // Basic health check
      ]);

      console.log('📊 Test endpoint response:', testRes.data);
      console.log('❤️ Health endpoint response:', healthRes.data);

      if (testRes.data?.success) {
        setMetrics(testRes.data);
      } else {
        console.error('Test endpoint returned failure:', testRes.data);
        toast.error('Failed to fetch system metrics');
      }

      if (healthRes.data?.success) {
        setHealthData(healthRes.data);
      } else {
        console.error('Health endpoint returned failure:', healthRes.data);
        toast.error('Failed to fetch health data');
      }
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      toast.error(`Failed to fetch system data: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };



  const getStatusColor = (value, thresholds) => {
    if (value >= thresholds.critical) return 'text-danger';
    if (value >= thresholds.warning) return 'text-warning';
    return 'text-success';
  };

  const formatUptime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m ${seconds % 60}s`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="container-fluid">
          <div className="d-flex justify-content-center align-items-center" style={{ height: '500px' }}>
            <div className="text-center">
              <div className="spinner-border text-danger mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted">Loading system monitoring data...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!metrics && !healthData) {
    return (
      <Layout>
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="alert alert-warning" role="alert">
                <h4 className="alert-heading">⚠️ No Data Available</h4>
                <p>Unable to fetch system monitoring data. This could be due to:</p>
                <ul>
                  <li>Server connectivity issues</li>
                  <li>Authentication problems</li>
                  <li>Service temporarily unavailable</li>
                </ul>
                <hr />
                <div className="d-flex gap-2">
                  <button className="btn btn-outline-primary" onClick={fetchData}>
                    🔄 Retry
                  </button>
                  <button className="btn btn-outline-secondary" onClick={() => window.location.reload()}>
                    🔁 Refresh Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <h2 className="text-danger">🖥️ System Monitoring</h2>
              <div className="d-flex gap-2">
                <div className="form-check form-switch">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="autoRefresh"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="autoRefresh">
                    Auto Refresh (30s)
                  </label>
                </div>
                <button className="btn btn-outline-primary btn-sm" onClick={fetchData}>
                  🔄 Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* System Overview */}
        {(healthData || metrics) && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="card">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">🔧 System Health Overview</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-3">
                      <div className="d-flex align-items-center">
                        <div className={`badge ${(metrics?.status === 'healthy' || healthData?.status === 'OK') ? 'bg-success' : 'bg-danger'} me-2`}>
                          {(metrics?.status === 'healthy' || healthData?.status === 'OK') ? '✅' : '❌'}
                        </div>
                        <span><strong>Overall Status:</strong> {metrics?.status || healthData?.status || 'Unknown'}</span>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <strong>Database:</strong> 
                      <span className={`ms-2 ${metrics?.database?.status === 'connected' ? 'text-success' : 'text-danger'}`}>
                        {metrics?.database?.status || 'Unknown'}
                      </span>
                    </div>
                    <div className="col-md-3">
                      <strong>Response Time:</strong> 
                      <span className="ms-2 text-info">
                        {metrics?.performance?.responseTime || metrics?.statistics?.responseTime || 'N/A'}
                      </span>
                    </div>
                    <div className="col-md-3">
                      <strong>Uptime:</strong> 
                      <span className="ms-2 text-success">
                        {metrics?.performance?.uptime || metrics?.statistics?.systemUptime || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        {metrics && metrics.statistics && (
          <>
            <div className="row mb-4">
              <div className="col-md-3">
                <div className="card text-center">
                  <div className="card-body">
                    <h5 className="card-title text-primary">� Total Users</h5>
                    <h2 className="text-primary">{metrics.statistics.totalUsers || 0}</h2>
                    <small className="text-muted">Registered users</small>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card text-center">
                  <div className="card-body">
                    <h5 className="card-title text-success">🩸 Total Inventory</h5>
                    <h2 className="text-success">{metrics.statistics.totalInventory || 0}</h2>
                    <small className="text-muted">Blood records</small>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card text-center">
                  <div className="card-body">
                    <h5 className="card-title text-info">⏱️ Response Time</h5>
                    <h2 className="text-info">{metrics.statistics.responseTime || 'N/A'}</h2>
                    <small className="text-muted">Current response</small>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card text-center">
                  <div className="card-body">
                    <h5 className="card-title text-warning">🏥 Organizations</h5>
                    <h2 className="text-warning">{metrics.statistics.totalOrganizations || 0}</h2>
                    <small className="text-muted">Active orgs</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Database Statistics */}
            <div className="row mb-4">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <h5>🏥 User Distribution</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-6">
                        <strong>Donors:</strong> 
                        <span className="badge bg-success ms-2">{metrics.statistics.totalDonors || 0}</span>
                      </div>
                      <div className="col-6">
                        <strong>Hospitals:</strong> 
                        <span className="badge bg-info ms-2">{metrics.statistics.totalHospitals || 0}</span>
                      </div>
                      <div className="col-6 mt-2">
                        <strong>Organizations:</strong> 
                        <span className="badge bg-warning ms-2">{metrics.statistics.totalOrganizations || 0}</span>
                      </div>
                      <div className="col-6 mt-2">
                        <strong>Total Users:</strong> 
                        <span className="badge bg-primary ms-2">{metrics.statistics.totalUsers || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <h5>🩸 Blood Inventory Status</h5>
                  </div>
                  <div className="card-body">
                    {metrics.statistics.bloodInventory && (
                      <div className="row">
                        {Object.entries(metrics.statistics.bloodInventory).map(([bloodType, count]) => (
                          <div key={bloodType} className="col-3 mb-2">
                            <strong>{bloodType}:</strong> 
                            <span className={`badge ms-2 ${count > 10 ? 'bg-success' : count > 5 ? 'bg-warning' : 'bg-danger'}`}>
                              {count} units
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {!metrics.statistics.bloodInventory && (
                      <p className="text-muted">No blood inventory data available</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Services Status */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h5>� Services Status</h5>
                  </div>
                  <div className="card-body">
                    {metrics.services && (
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Service</th>
                              <th>Status</th>
                              <th>Description</th>
                              <th>Last Checked</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(metrics.services).map(([serviceName, service]) => (
                              <tr key={serviceName}>
                                <td><strong>{serviceName}</strong></td>
                                <td>
                                  <span className={`badge ${
                                    service.status === 'operational' ? 'bg-success' : 
                                    service.status === 'warning' ? 'bg-warning' : 
                                    service.status === 'degraded' ? 'bg-warning' : 'bg-danger'
                                  }`}>
                                    {service.status}
                                  </span>
                                </td>
                                <td>{service.description}</td>
                                <td>
                                  <small className="text-muted">
                                    {new Date(service.lastChecked).toLocaleTimeString()}
                                  </small>
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

            {/* Database Information */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h5>💾 Database Information</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-3">
                        <strong>Status:</strong> 
                        <span className={`badge ms-2 ${metrics.database?.status === 'connected' ? 'bg-success' : 'bg-danger'}`}>
                          {metrics.database?.status || 'Unknown'}
                        </span>
                      </div>
                      <div className="col-md-3">
                        <strong>Response Time:</strong> 
                        <span className="text-info ms-2">{metrics.database?.responseTime || 'N/A'}</span>
                      </div>
                      <div className="col-md-3">
                        <strong>Users Collection:</strong> 
                        <span className="text-primary ms-2">{metrics.database?.collections?.users || 0} documents</span>
                      </div>
                      <div className="col-md-3">
                        <strong>Inventory Collection:</strong> 
                        <span className="text-success ms-2">{metrics.database?.collections?.inventory || 0} documents</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Summary */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h5>⚡ Performance Summary</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-4">
                        <strong>Health Score:</strong> 
                        <span className={`badge ms-2 ${
                          metrics.performance?.healthScore === 'excellent' ? 'bg-success' : 
                          metrics.performance?.healthScore === 'good' ? 'bg-info' : 'bg-warning'
                        }`}>
                          {metrics.performance?.healthScore || 'Unknown'}
                        </span>
                      </div>
                      <div className="col-md-4">
                        <strong>System Uptime:</strong> 
                        <span className="text-success ms-2">{metrics.statistics?.systemUptime || 'N/A'}</span>
                      </div>
                      <div className="col-md-4">
                        <strong>DB Response Time:</strong> 
                        <span className="text-info ms-2">{metrics.statistics?.databaseResponseTime || 'N/A'}</span>
                      </div>
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

export default SystemMonitoring;
