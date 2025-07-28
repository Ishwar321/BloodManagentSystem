import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/shared/Layout/Layout';
import API from '../services/API';
import { toast } from 'react-toastify';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/analytics/analytics?timeRange=${timeRange}`);
      if (data?.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  const fetchRealTimeMetrics = useCallback(async () => {
    try {
      const { data } = await API.get('/analytics/metrics/realtime');
      if (data?.success) {
        setRealTimeMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Error fetching real-time metrics:', error);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
    fetchRealTimeMetrics();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchRealTimeMetrics, 30000);
    return () => clearInterval(interval);
  }, [timeRange, fetchAnalytics, fetchRealTimeMetrics]);

  const exportData = async (type) => {
    try {
      const { data } = await API.get(`/analytics/export?type=${type}&format=json`);
      if (data?.success) {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${type}_export_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        toast.success('Data exported successfully');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  const bloodGroupChartData = {
    labels: analytics?.trends?.bloodGroup?.map(bg => bg._id) || [],
    datasets: [
      {
        label: 'Donors by Blood Group',
        data: analytics?.trends?.bloodGroup?.map(bg => bg.count) || [],
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
          '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
        ],
        borderWidth: 1,
      },
    ],
  };

  const monthlyTrendsData = {
    labels: [
      ...new Set(
        analytics?.trends?.monthly?.map(trend => {
          const date = new Date(trend._id.year, trend._id.month - 1);
          return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        })
      )
    ].sort((a, b) => new Date(a) - new Date(b)) || [],
    datasets: [
      {
        label: 'Donations',
        data: [...new Set(analytics?.trends?.monthly?.map(trend => {
          const date = new Date(trend._id.year, trend._id.month - 1);
          return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        }))].sort((a, b) => new Date(a) - new Date(b)).map(monthLabel => {
          const donation = analytics?.trends?.monthly?.find(t => {
            const tDate = new Date(t._id.year, t._id.month - 1);
            const tLabel = tDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            return tLabel === monthLabel && t._id.type === 'in';
          });
          return donation ? donation.quantity : 0;
        }) || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
        fill: false,
      },
      {
        label: 'Requests',
        data: [...new Set(analytics?.trends?.monthly?.map(trend => {
          const date = new Date(trend._id.year, trend._id.month - 1);
          return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        }))].sort((a, b) => new Date(a) - new Date(b)).map(monthLabel => {
          const request = analytics?.trends?.monthly?.find(t => {
            const tDate = new Date(t._id.year, t._id.month - 1);
            const tLabel = tDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            return tLabel === monthLabel && t._id.type === 'out';
          });
          return request ? request.quantity : 0;
        }) || [],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1,
        fill: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Blood Donation & Request Trends',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y} units`;
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Month'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Units'
        },
        beginAtZero: true
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container-fluid">
          <div className="d-flex justify-content-center align-items-center" style={{ height: '500px' }}>
            <div className="spinner-border text-danger" role="status">
              <span className="visually-hidden">Loading...</span>
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
              <h2 className="text-danger">📊 Analytics Dashboard</h2>
              <div className="d-flex gap-2">
                <select 
                  className="form-select" 
                  value={timeRange} 
                  onChange={(e) => setTimeRange(e.target.value)}
                  style={{ width: 'auto' }}
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 3 months</option>
                  <option value="365">Last year</option>
                </select>
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => fetchAnalytics()}
                >
                  🔄 Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Metrics */}
        {realTimeMetrics && (
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card text-center">
                <div className="card-body">
                  <h5 className="card-title text-success">Today's Donations</h5>
                  <h2 className="text-success">{realTimeMetrics.today.donations}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center">
                <div className="card-body">
                  <h5 className="card-title text-warning">Today's Requests</h5>
                  <h2 className="text-warning">{realTimeMetrics.today.requests}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center">
                <div className="card-body">
                  <h5 className="card-title text-info">New Donors</h5>
                  <h2 className="text-info">{realTimeMetrics.today.newDonors}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center">
                <div className="card-body">
                  <h5 className="card-title text-danger">Critical Levels</h5>
                  <h2 className="text-danger">{realTimeMetrics.criticalLevels?.length || 0}</h2>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'trends' ? 'active' : ''}`}
              onClick={() => setActiveTab('trends')}
            >
              Trends
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveTab('inventory')}
            >
              Inventory
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'export' ? 'active' : ''}`}
              onClick={() => setActiveTab('export')}
            >
              Export Data
            </button>
          </li>
        </ul>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && analytics && (
            <div className="row">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <h5>User Statistics ({timeRange} days)</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-6">
                        <strong>New Donors:</strong> {analytics.userStatistics.newDonors}
                      </div>
                      <div className="col-6">
                        <strong>New Hospitals:</strong> {analytics.userStatistics.newHospitals}
                      </div>
                      <div className="col-6">
                        <strong>New Organizations:</strong> {analytics.userStatistics.newOrganizations}
                      </div>
                      <div className="col-6">
                        <strong>Total New Users:</strong> {analytics.userStatistics.totalNewUsers}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <h5>Blood Statistics</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-6">
                        <strong>Total Donations:</strong> {analytics.bloodStatistics.totalDonations}
                      </div>
                      <div className="col-6">
                        <strong>Total Requests:</strong> {analytics.bloodStatistics.totalRequests}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'trends' && analytics && (
            <div className="row">
              <div className="col-md-8">
                <div className="card">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">📈 Monthly Trends</h5>
                    <small>Real-time data from your blood bank operations</small>
                  </div>
                  <div className="card-body" style={{height: '400px'}}>
                    <Line data={monthlyTrendsData} options={chartOptions} />
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card">
                  <div className="card-header">
                    <h5>Donors by Blood Group</h5>
                  </div>
                  <div className="card-body">
                    <Doughnut data={bloodGroupChartData} />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'trends' && analytics?.trends?.monthly && (
            <div className="row mt-3">
              <div className="col-12">
                <div className="alert alert-info">
                  <h6 className="mb-2">📊 Monthly Trends Data Summary:</h6>
                  <div className="row">
                    <div className="col-md-4">
                      <strong>Total Months:</strong> {[...new Set(analytics.trends.monthly.map(t => `${t._id.year}-${t._id.month}`))].length}
                    </div>
                    <div className="col-md-4">
                      <strong>Total Donations:</strong> {analytics.trends.monthly.filter(t => t._id.type === 'in').reduce((sum, t) => sum + t.quantity, 0)} units
                    </div>
                    <div className="col-md-4">
                      <strong>Total Requests:</strong> {analytics.trends.monthly.filter(t => t._id.type === 'out').reduce((sum, t) => sum + t.quantity, 0)} units
                    </div>
                  </div>
                  <small className="text-muted">✅ Chart is displaying real data from your database inventory records</small>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && realTimeMetrics && (
            <div className="row">
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h5>Current Blood Inventory</h5>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th>Blood Group</th>
                            <th>Available Units</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {realTimeMetrics.bloodAvailability?.map((blood, index) => (
                            <tr key={index}>
                              <td>
                                <span className="badge bg-primary">{blood._id}</span>
                              </td>
                              <td>{blood.available}</td>
                              <td>
                                <span 
                                  className={`badge ${
                                    blood.available < 10 
                                      ? 'bg-danger' 
                                      : blood.available < 20 
                                        ? 'bg-warning' 
                                        : 'bg-success'
                                  }`}
                                >
                                  {blood.available < 10 
                                    ? 'Critical' 
                                    : blood.available < 20 
                                      ? 'Low' 
                                      : 'Good'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="row">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <h5>Export Data</h5>
                  </div>
                  <div className="card-body">
                    <p>Export your data for external analysis or reporting:</p>
                    <div className="d-grid gap-2">
                      <button 
                        className="btn btn-outline-primary"
                        onClick={() => exportData('donations')}
                      >
                        📤 Export Donations Data
                      </button>
                      <button 
                        className="btn btn-outline-primary"
                        onClick={() => exportData('requests')}
                      >
                        📤 Export Requests Data
                      </button>
                      <button 
                        className="btn btn-outline-primary"
                        onClick={() => exportData('users')}
                      >
                        📤 Export Users Data
                      </button>
                      <button 
                        className="btn btn-outline-primary"
                        onClick={() => exportData('inventory')}
                      >
                        📤 Export Inventory Summary
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AnalyticsDashboard;
