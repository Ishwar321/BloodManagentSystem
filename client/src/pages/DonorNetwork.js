import React, { useState, useEffect } from "react";
import Layout from "../components/shared/Layout/Layout";
import API from "../services/API";
import { toast } from "react-toastify";
import moment from "moment";
import { AdminGlobalStyles } from "../styles/AdminStyles";

const DonorNetwork = () => {
  const [donors, setDonors] = useState([]);
  // const [showEngagementModal, setShowEngagementModal] = useState(false); // Commented out as not currently used
  const [showAddDonorModal, setShowAddDonorModal] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  const [stats, setStats] = useState({
    totalDonors: 0,
    activeDonors: 0,
    newThisMonth: 0,
    campaigns: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBloodGroup, setFilterBloodGroup] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [donorFormData, setDonorFormData] = useState({
    role: "donar",
    name: "",
    email: "",
    password: "",
    website: "",
    address: "",
    phone: ""
  });

  useEffect(() => {
    fetchDonorNetwork();
  }, []);

  const fetchDonorNetwork = async () => {
    try {
      // Try to fetch users with donor role specifically
      const { data } = await API.get("/auth/users?role=donar");
      if (data?.success && data.users) {
        // Filter to ensure only donors are included
        const donorUsers = data.users.filter(user => user.role === "donar");
        
        // Fetch inventory data for all donors to get their blood type information
        const donorsWithInventory = await Promise.all(
          donorUsers.map(async (user) => {
            let inventoryData = null;
            try {
              // Fetch inventory records and filter by donor email
              const inventoryResponse = await API.get("/inventory/get-inventory");
              if (inventoryResponse.data?.success && inventoryResponse.data.inventory?.length > 0) {
                // Find inventory records for this specific donor by email
                const donorInventory = inventoryResponse.data.inventory.filter(
                  inv => inv.email === user.email && inv.inventoryType === 'in'
                );
                if (donorInventory.length > 0) {
                  // Get the most recent inventory record
                  inventoryData = donorInventory[0];
                }
              }
            } catch (inventoryError) {
              console.log(`No inventory data found for donor ${user.email}`);
            }

            return {
              id: user._id || Date.now() + Math.random(),
              name: user.name,
              email: user.email,
              phone: user.phone,
              bloodGroup: inventoryData?.bloodGroup || user.bloodGroup || "N/A",
              inventoryType: inventoryData?.inventoryType || "N/A",
              location: user.address || "Not specified",
              city: user.location?.city || "Not specified",
              state: user.location?.state || "",
              pincode: user.location?.pincode || "",
              joinDate: user.createdAt ? moment(user.createdAt).format('YYYY-MM-DD') : "Unknown",
              dateOfBirth: user.dateOfBirth || "Not provided",
              gender: user.gender || "Not specified",
              weight: user.weight || "Not provided",
              lastDonation: inventoryData?.createdAt ? moment(inventoryData.createdAt).format('YYYY-MM-DD') : 
                           (user.lastDonation ? moment(user.lastDonation).format('YYYY-MM-DD') : "Never"),
              totalDonations: user.totalDonations || 0,
              isEligible: user.isEligible !== false,
              isVerified: user.isVerified || false,
              verificationStatus: user.verificationStatus || "pending",
              profileCompleteness: user.profileCompleteness || 50,
              status: user.status || "active",
              healthConditions: user.healthConditions || {
                diabetes: false,
                hypertension: false,
                heartDisease: false,
                anemia: false,
                other: ""
              },
              emergencyContact: user.emergencyContact || {
                name: "",
                phone: "",
                relation: ""
              },
              preferences: user.preferences || {
                emailNotifications: true,
                smsNotifications: true,
                donationReminders: true
              },
              lastLoginAt: user.lastLoginAt || user.createdAt,
              createdAt: user.createdAt,
              role: user.role,
              // Additional inventory information
              inventoryInfo: inventoryData
            };
          })
        );

        setDonors(donorsWithInventory);
        setStats({
          totalDonors: donorsWithInventory.length,
          activeDonors: donorsWithInventory.filter(d => d.status === 'active').length,
          newThisMonth: donorsWithInventory.filter(d => 
            moment(d.createdAt).isAfter(moment().subtract(1, 'month'))
          ).length,
          campaigns: 0
        });
        return;
      }
    } catch (error) {
      console.error("Error fetching donors from users API:", error);
    }

    try {
      // Alternative approach: try organization-specific endpoint
      const { data } = await API.get("/organization/donor-network");
      if (data?.success && data.donors) {
        setDonors(data.donors.filter(donor => !donor.role || donor.role === "donar"));
        setStats({
          totalDonors: data.donors.length,
          activeDonors: data.donors.filter(d => d.status === 'active').length,
          newThisMonth: data.donors.filter(d => 
            moment(d.createdAt).isAfter(moment().subtract(1, 'month'))
          ).length,
          campaigns: data.totalCampaigns || 0
        });
        return;
      }
    } catch (error) {
      console.error("Error fetching existing donor data:", error);
    }

    // Set empty data on error instead of mock data
    console.log("Setting empty data as fallback");
    setDonors([]);
    setStats({
      totalDonors: 0,
      activeDonors: 0,
      newThisMonth: 0,
      campaigns: 0
    });
  };

  // Display only donors with search and filter functionality
  const displayDonors = donors.filter(donor => {
    // Filter out non-donors
    if (donor.role && donor.role !== "donar") return false;
    
    // Search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        donor.name?.toLowerCase().includes(searchLower) ||
        donor.email?.toLowerCase().includes(searchLower) ||
        donor.phone?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }
    
    // Blood group filter
    if (filterBloodGroup && donor.bloodGroup !== filterBloodGroup) {
      return false;
    }
    
    // Status filter
    if (filterStatus && donor.status !== filterStatus) {
      return false;
    }
    
    return true;
  });

  // Commented out unused functions
  // const getEngagementBadge = (score) => {
  //   if (score >= 80) return { color: "success", text: "High" };
  //   if (score >= 60) return { color: "warning", text: "Medium" };
  //   return { color: "danger", text: "Low" };
  // };

  const getStatusBadge = (status) => {
    const statusColors = {
      active: "success",
      inactive: "secondary",
      pending: "warning",
      suspended: "danger"
    };
    return (
      <span className={`badge bg-${statusColors[status] || 'secondary'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // const calculateEngagementScore = (donor) => {
  //   let score = 0;
    
  //   // Base score from profile completeness
  //   score += (donor.profileCompleteness || 0) * 0.3;
    
  //   // Points for recent donations
  //   if (donor.lastDonation && moment(donor.lastDonation).isAfter(moment().subtract(6, 'months'))) {
  //     score += 30;
  //   }
    
  //   // Points for total donations
  //   score += Math.min((donor.totalDonations || 0) * 5, 25);
    
  //   // Points for verification
  //   if (donor.isVerified) score += 15;
    
  //   return Math.min(Math.round(score), 100);
  // };

  const handleAddDonor = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data } = await API.post("/auth/register", donorFormData);
      if (data?.success) {
        toast.success("New donor added successfully!");
        setShowAddDonorModal(false);
        setDonorFormData({
          role: "donar",
          name: "",
          email: "",
          password: "",
          website: "",
          address: "",
          phone: ""
        });
        fetchDonorNetwork();
      }
    } catch (error) {
      console.error("Error adding donor:", error);
      toast.error(error.response?.data?.message || "Error adding donor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="admin-theme">
        <style dangerouslySetInnerHTML={{ __html: AdminGlobalStyles }} />
        <style dangerouslySetInnerHTML={{ __html: `
          /* Professional Header */
          .donor-header {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%);
            padding: 3rem 0;
            margin-bottom: 2rem;
            position: relative;
            overflow: hidden;
          }
          .donor-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('/assets/images/blood-pattern.png') repeat;
            opacity: 0.1;
            z-index: 1;
          }
          .donor-stat-card {
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
            border: 1px solid rgba(102, 126, 234, 0.1);
            transition: all 0.3s ease;
            height: 100%;
          }
          .donor-stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(102, 126, 234, 0.15);
          }
          .donor-icon-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            width: 50px;
            height: 50px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.2rem;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
          }
          .donor-table-card {
            background: white;
            border-radius: 16px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
            border: 1px solid rgba(102, 126, 234, 0.1);
            overflow: hidden;
          }
          .donor-table-header {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 1.5rem;
            border-bottom: 2px solid rgba(102, 126, 234, 0.1);
          }
          .donor-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 10px;
            padding: 0.6rem 1.5rem;
            color: white;
            font-weight: 600;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
            transition: all 0.3s ease;
          }
          .donor-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
            color: white;
          }
          .donor-btn-outline {
            background: transparent;
            border: 2px solid #667eea;
            color: #667eea;
            box-shadow: none;
          }
          .donor-btn-outline:hover {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .donor-badge-custom {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 0.4rem 0.8rem;
            border-radius: 8px;
            font-size: 0.85rem;
            font-weight: 600;
          }
          .donor-blood-badge {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 10px;
            font-weight: 700;
            box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
          }
          .donor-contact-item {
            display: flex;
            align-items: center;
            margin-bottom: 0.5rem;
            padding: 0.4rem 0.8rem;
            background: rgba(102, 126, 234, 0.05);
            border-radius: 8px;
            border-left: 3px solid #667eea;
          }
          .donor-contact-item i {
            margin-right: 0.5rem;
            width: 16px;
          }
          .donor-modal {
            border-radius: 16px;
            border: none;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          }
          .donor-modal-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 16px 16px 0 0;
            padding: 1.5rem;
          }
          .donor-action-btn {
            background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
            border: none;
            border-radius: 8px;
            padding: 0.4rem 0.8rem;
            color: white;
            margin: 0 0.2rem;
            transition: all 0.3s ease;
          }
          .donor-action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(6, 182, 212, 0.4);
            color: white;
          }
        ` }} />
        <div className="donor-theme">
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
                    <h1 className="mb-2 fw-bold">Donor Network Management</h1>
                    <p className="mb-0 fs-5 opacity-90">Connect with and manage your network of blood donors</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4 text-center">
                <div className="bg-white bg-opacity-20 rounded-4 p-3 d-inline-block">
                  <h3 className="mb-1 fw-bold">{stats.totalDonors}</h3>
                  <p className="mb-0 small">Total Donors</p>
                </div>
                <button 
                  className="btn btn-light btn-lg mt-3"
                  onClick={() => setShowAddDonorModal(true)}
                >
                  <i className="fas fa-user-plus me-2"></i>
                  Add Donor
                </button>
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
                    <h3 className="mb-1 fw-bold" style={{color: '#f093fb'}}>{stats.totalDonors}</h3>
                    <p className="mb-1 fw-semibold text-dark">Total Donors</p>
                    <small className="text-muted">
                      <i className="fas fa-plus-circle me-1"></i>
                      All registered donors
                    </small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="admin-stat-card">
                <div className="d-flex align-items-center">
                  <div className="admin-stat-icon me-3" style={{background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #047857 100%)'}}>
                    <i className="fas fa-user-check"></i>
                  </div>
                  <div className="flex-grow-1">
                    <h3 className="mb-1 fw-bold text-success">{stats.activeDonors}</h3>
                    <p className="mb-1 fw-semibold text-dark">Active Donors</p>
                    <small className="text-muted">
                      <i className="fas fa-heart me-1"></i>
                      Currently active
                    </small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="admin-stat-card">
                <div className="d-flex align-items-center">
                  <div className="admin-stat-icon me-3" style={{background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 50%, #0369a1 100%)'}}>
                    <i className="fas fa-user-plus"></i>
                  </div>
                  <div className="flex-grow-1">
                    <h3 className="mb-1 fw-bold text-info">{stats.newThisMonth}</h3>
                    <p className="mb-1 fw-semibold text-dark">New This Month</p>
                    <small className="text-muted">
                      <i className="fas fa-calendar me-1"></i>
                      Recently joined
                    </small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="admin-stat-card">
                <div className="d-flex align-items-center">
                  <div className="admin-stat-icon me-3" style={{background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #b45309 100%)'}}>
                    <i className="fas fa-bullhorn"></i>
                  </div>
                  <div className="flex-grow-1">
                    <h3 className="mb-1 fw-bold text-warning">{stats.campaigns}</h3>
                    <p className="mb-1 fw-semibold text-dark">Active Campaigns</p>
                    <small className="text-muted">
                      <i className="fas fa-activity me-1"></i>
                      Running campaigns
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Search and Filter Section */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid rgba(99, 102, 241, 0.1)',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)'
          }}>
            <div className="row g-3">
              <div className="col-md-6">
                <div style={{position: 'relative'}}>
                  <i className="fas fa-search" style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#6366f1',
                    zIndex: 1
                  }}></i>
                  <input
                    type="text"
                    className="form-control"
                    style={{
                      paddingLeft: '48px',
                      height: '48px',
                      border: '2px solid rgba(99, 102, 241, 0.2)',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: '500',
                      transition: 'all 0.3s ease',
                      background: '#fff'
                    }}
                    placeholder="Search donors by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(99, 102, 241, 0.2)'}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <select
                  className="form-select"
                  style={{
                    height: '48px',
                    border: '2px solid rgba(99, 102, 241, 0.2)',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    background: '#fff'
                  }}
                  value={filterBloodGroup}
                  onChange={(e) => setFilterBloodGroup(e.target.value)}
                  onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(99, 102, 241, 0.2)'}
                >
                  <option value="">All Blood Groups</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              <div className="col-md-3">
                <select
                  className="form-select"
                  style={{
                    height: '48px',
                    border: '2px solid rgba(99, 102, 241, 0.2)',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    background: '#fff'
                  }}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(99, 102, 241, 0.2)'}
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* View Mode Toggle and Actions */}
          <div style={{marginBottom: '24px'}}>
            <div className="row align-items-center">
              <div className="col-md-6">
                <div className="btn-group" role="group" style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '12px',
                  padding: '4px',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)'
                }}>
                  <button 
                    type="button" 
                    style={{
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      fontWeight: '600',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      background: viewMode === 'table' ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'transparent',
                      color: viewMode === 'table' ? '#fff' : '#6b7280',
                      transform: viewMode === 'table' ? 'scale(1.02)' : 'scale(1)'
                    }}
                    onClick={() => setViewMode('table')}
                  >
                    <i className="fas fa-table me-2"></i>
                    Table View
                  </button>
                  <button 
                    type="button" 
                    style={{
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      fontWeight: '600',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      background: viewMode === 'card' ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'transparent',
                      color: viewMode === 'card' ? '#fff' : '#6b7280',
                      transform: viewMode === 'card' ? 'scale(1.02)' : 'scale(1)'
                    }}
                    onClick={() => setViewMode('card')}
                  >
                    <i className="fas fa-th-large me-2"></i>
                    Card View
                  </button>
                </div>
              </div>
              <div className="col-md-6 text-end">
                <div className="d-flex justify-content-end gap-2">
                  <button 
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px 20px',
                      color: '#fff',
                      fontWeight: '600',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
                    }}
                    className="btn"
                    onClick={() => setShowAddDonorModal(true)}
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0px)'}
                  >
                    <i className="fas fa-user-plus me-2"></i>
                    Add New Donor
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Donors List */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.1)'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              padding: '20px 24px',
              color: '#fff'
            }}>
              <h5 className="mb-0 fw-bold">
                <i className="fas fa-list me-2"></i>
                Donor Directory ({displayDonors.length} donors)
              </h5>
            </div>
              
            <div style={{padding: '24px'}}>
              {displayDonors.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                  borderRadius: '12px',
                  border: '2px dashed rgba(99, 102, 241, 0.2)'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '20px'
                  }}>
                    <i className="fas fa-users" style={{fontSize: '4rem'}}></i>
                  </div>
                  <h4 style={{color: '#374151', fontWeight: '700', marginBottom: '12px'}}>No donors found</h4>
                  <p style={{color: '#6b7280', marginBottom: '24px', fontSize: '16px'}}>
                    Start building your donor network by adding blood donors to the system.
                  </p>
                  <button 
                    style={{
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px 24px',
                      color: '#fff',
                      fontWeight: '600',
                      fontSize: '15px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
                    }}
                    onClick={() => setShowAddDonorModal(true)}
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0px)'}
                  >
                    <i className="fas fa-user-plus me-2"></i>
                    Add Your First Donor
                  </button>
                </div>
              ) : viewMode === 'table' ? (
                // Enhanced Table View
                <div style={{overflowX: 'auto'}}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'separate',
                    borderSpacing: '0',
                    background: '#fff'
                  }}>
                    <thead>
                      <tr style={{
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)'
                      }}>
                        <th style={{
                          padding: '16px 20px',
                          textAlign: 'left',
                          fontWeight: '700',
                          fontSize: '14px',
                          color: '#374151',
                          borderBottom: '2px solid rgba(99, 102, 241, 0.1)',
                          position: 'sticky',
                          top: 0,
                          zIndex: 10
                        }}>
                          <i className="fas fa-user me-2" style={{color: '#6366f1'}}></i>
                          Donor Details
                        </th>
                        <th style={{
                          padding: '16px 20px',
                          textAlign: 'left',
                          fontWeight: '700',
                          fontSize: '14px',
                          color: '#374151',
                          borderBottom: '2px solid rgba(99, 102, 241, 0.1)',
                          position: 'sticky',
                          top: 0,
                          zIndex: 10
                        }}>
                          <i className="fas fa-tint me-2" style={{color: '#ef4444'}}></i>
                          Blood Group
                        </th>
                        <th style={{
                          padding: '16px 20px',
                          textAlign: 'left',
                          fontWeight: '700',
                          fontSize: '14px',
                          color: '#374151',
                          borderBottom: '2px solid rgba(99, 102, 241, 0.1)',
                          position: 'sticky',
                          top: 0,
                          zIndex: 10
                        }}>
                          <i className="fas fa-phone me-2" style={{color: '#10b981'}}></i>
                          Contact
                        </th>
                        <th style={{
                          padding: '16px 20px',
                          textAlign: 'left',
                          fontWeight: '700',
                          fontSize: '14px',
                          color: '#374151',
                          borderBottom: '2px solid rgba(99, 102, 241, 0.1)',
                          position: 'sticky',
                          top: 0,
                          zIndex: 10
                        }}>
                          <i className="fas fa-calendar me-2" style={{color: '#8b5cf6'}}></i>
                          Last Donation
                        </th>
                        <th style={{
                          padding: '16px 20px',
                          textAlign: 'left',
                          fontWeight: '700',
                          fontSize: '14px',
                          color: '#374151',
                          borderBottom: '2px solid rgba(99, 102, 241, 0.1)',
                          position: 'sticky',
                          top: 0,
                          zIndex: 10
                        }}>
                          <i className="fas fa-check-circle me-2" style={{color: '#10b981'}}></i>
                          Status
                        </th>
                        <th style={{
                          padding: '16px 20px',
                          textAlign: 'center',
                          fontWeight: '700',
                          fontSize: '14px',
                          color: '#374151',
                          borderBottom: '2px solid rgba(99, 102, 241, 0.1)',
                          position: 'sticky',
                          top: 0,
                          zIndex: 10
                        }}>
                          <i className="fas fa-cog me-2" style={{color: '#6b7280'}}></i>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayDonors.map((donor, index) => (
                        <tr key={donor.id} style={{
                          borderBottom: '1px solid rgba(99, 102, 241, 0.08)',
                          transition: 'all 0.3s ease',
                          background: index % 2 === 0 ? '#fff' : 'rgba(99, 102, 241, 0.02)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(99, 102, 241, 0.05)';
                          e.target.style.transform = 'scale(1.005)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = index % 2 === 0 ? '#fff' : 'rgba(99, 102, 241, 0.02)';
                          e.target.style.transform = 'scale(1)';
                        }}
                        >
                          <td style={{padding: '16px 20px', verticalAlign: 'middle'}}>
                            <div style={{display: 'flex', alignItems: 'center'}}>
                              <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '12px',
                                color: '#fff',
                                fontSize: '18px'
                              }}>
                                <i className="fas fa-user"></i>
                              </div>
                              <div>
                                <div style={{fontWeight: '600', color: '#111827', marginBottom: '4px', fontSize: '15px'}}>
                                  {donor.name}
                                </div>
                                <div style={{
                                  background: 'rgba(99, 102, 241, 0.1)',
                                  color: '#6366f1',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  display: 'inline-block'
                                }}>
                                  <i className="fas fa-envelope me-1"></i>
                                  {donor.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{padding: '16px 20px', verticalAlign: 'middle'}}>
                            <div style={{display: 'flex', alignItems: 'center'}}>
                              <span style={{
                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                color: '#fff',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '700',
                                marginRight: '8px',
                                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                              }}>
                                <i className="fas fa-tint me-2"></i>
                                {donor.bloodGroup}
                              </span>
                              {donor.inventoryType && donor.inventoryType !== 'N/A' && (
                                <span style={{
                                  background: 'rgba(107, 114, 128, 0.1)',
                                  color: '#6b7280',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: '500'
                                }}>
                                  {donor.inventoryType === 'in' ? 'Donor' : 'Recipient'}
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{padding: '16px 20px', verticalAlign: 'middle'}}>
                            <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <i className="fas fa-phone" style={{color: '#10b981', fontSize: '14px'}}></i>
                                <span style={{fontSize: '14px', color: '#374151', fontWeight: '500'}}>{donor.phone}</span>
                              </div>
                              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <i className="fas fa-map-marker-alt" style={{color: '#f59e0b', fontSize: '14px'}}></i>
                                <span style={{fontSize: '13px', color: '#6b7280'}}>{donor.location}</span>
                              </div>
                            </div>
                          </td>
                          <td style={{padding: '16px 20px', verticalAlign: 'middle'}}>
                            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
                              <span style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: donor.lastDonation !== "Never" ? '#374151' : '#6b7280',
                                marginBottom: '4px'
                              }}>
                                {donor.lastDonation !== "Never" ? 
                                  moment(donor.lastDonation).format('MMM DD, YYYY') : 
                                  "Never"
                                }
                              </span>
                              {donor.lastDonation !== "Never" && (
                                <span style={{
                                  fontSize: '12px',
                                  color: '#8b5cf6',
                                  background: 'rgba(139, 92, 246, 0.1)',
                                  padding: '2px 6px',
                                  borderRadius: '4px'
                                }}>
                                  {moment(donor.lastDonation).fromNow()}
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{padding: '16px 20px', verticalAlign: 'middle'}}>
                            {getStatusBadge(donor.status)}
                          </td>
                          <td style={{padding: '16px 20px', verticalAlign: 'middle', textAlign: 'center'}}>
                            <button 
                              style={{
                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                color: '#fff',
                                fontSize: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                              }}
                              onClick={() => setSelectedDonor(donor)}
                              title="View details"
                              onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0px)';
                                e.target.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
                              }}
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                // Card View
                <div className="p-4">
                  <div className="row g-4">
                    {displayDonors.map((donor) => (
                      <div key={donor.id} className="col-lg-4 col-md-6">
                        <div className="admin-stat-card h-100">
                          <div className="d-flex align-items-center mb-3">
                            <div className="donor-icon-gradient me-3" style={{width: '50px', height: '50px', fontSize: '1.2rem'}}>
                              <i className="fas fa-user"></i>
                            </div>
                            <div className="flex-grow-1">
                              <h5 className="mb-1 fw-bold text-dark">{donor.name}</h5>
                              <p className="mb-0 text-muted small">{donor.email}</p>
                            </div>
                          </div>
                          
                          <div className="row g-3 mb-3">
                            <div className="col-6">
                              <div className="d-flex flex-column align-items-center p-3 bg-light rounded">
                                <span className="admin-badge admin-badge-danger" style={{fontSize: '0.9rem', padding: '0.4rem 0.8rem'}}>
                                  <i className="fas fa-tint me-1"></i>
                                  {donor.bloodGroup}
                                </span>
                                <small className="text-muted mt-1">Blood Group</small>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="d-flex flex-column align-items-center p-3 bg-light rounded">
                                {getStatusBadge(donor.status)}
                                <small className="text-muted mt-1">Status</small>
                              </div>
                            </div>
                          </div>

                          {donor.inventoryType && donor.inventoryType !== 'N/A' && (
                            <div className="mb-3">
                              <small className={`admin-badge w-100 py-2 text-center d-block ${donor.inventoryType === 'in' ? 'admin-badge-success' : 'admin-badge-warning'}`}>
                                <i className="fas fa-tint me-2"></i>
                                {donor.inventoryType === 'in' ? 'Blood Donor' : 'Blood Recipient'}
                              </small>
                            </div>
                          )}

                          <div className="border-top pt-3">
                            <div className="admin-contact-info">
                              <div className="admin-contact-item">
                                <i className="fas fa-phone text-success"></i>
                                <span>{donor.phone}</span>
                              </div>
                              <div className="admin-contact-item">
                                <i className="fas fa-map-marker-alt text-info"></i>
                                <span>{donor.location}</span>
                              </div>
                              <div className="admin-contact-item">
                                <i className="fas fa-calendar text-warning"></i>
                                <span>
                                  Last: {donor.lastDonation !== "Never" ? 
                                    moment(donor.lastDonation).format('MMM DD, YYYY') : 
                                    "Never"
                                  }
                                </span>
                              </div>
                            </div>
                            <div className="text-center mt-3">
                              <button 
                                className="admin-btn-sm admin-btn-info"
                                onClick={() => setSelectedDonor(donor)}
                                title="View details"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div> {/* admin-container */}
        </div> {/* donor-theme */}

        {/* Add Donor Modal */}
        {showAddDonorModal && (
          <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content admin-modal">
                <div className="modal-header admin-modal-header">
                  <h5 className="modal-title admin-modal-title">
                    <i className="fas fa-user-plus me-2"></i>
                    Add New Donor
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close admin-btn-close"
                    onClick={() => setShowAddDonorModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleAddDonor}>
                  <div className="modal-body admin-modal-body">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label admin-form-label">Full Name *</label>
                          <input 
                            type="text"
                            className="form-control admin-form-control"
                            value={donorFormData.name}
                            onChange={(e) => setDonorFormData({...donorFormData, name: e.target.value})}
                            required
                            placeholder="Enter full name"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label admin-form-label">Email Address *</label>
                          <input 
                            type="email"
                            className="form-control admin-form-control"
                            value={donorFormData.email}
                            onChange={(e) => setDonorFormData({...donorFormData, email: e.target.value})}
                            required
                            placeholder="Enter email address"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label admin-form-label">Phone Number *</label>
                          <input 
                            type="tel"
                            className="form-control admin-form-control"
                            value={donorFormData.phone}
                            onChange={(e) => setDonorFormData({...donorFormData, phone: e.target.value})}
                            required
                            placeholder="Enter phone number"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label admin-form-label">Address</label>
                          <input 
                            type="text"
                            className="form-control admin-form-control"
                            value={donorFormData.address}
                            onChange={(e) => setDonorFormData({...donorFormData, address: e.target.value})}
                            placeholder="Enter address"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label admin-form-label">Temporary Password *</label>
                      <input 
                        type="password"
                        className="form-control admin-form-control"
                        value={donorFormData.password}
                        onChange={(e) => setDonorFormData({...donorFormData, password: e.target.value})}
                        required
                        placeholder="Enter temporary password"
                      />
                      <div className="form-text text-muted mt-1">
                        <i className="fas fa-info-circle me-1"></i>
                        The donor can change this password after first login
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer admin-modal-footer">
                    <button 
                      type="button" 
                      className="admin-btn admin-btn-secondary"
                      onClick={() => setShowAddDonorModal(false)}
                    >
                      <i className="fas fa-times me-2"></i>
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="admin-btn admin-btn-primary"
                      disabled={loading}
                    >
                      <i className={loading ? "fas fa-spinner fa-spin me-2" : "fas fa-plus me-2"}></i>
                      {loading ? "Adding..." : "Add Donor"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Donor Details Modal */}
        {selectedDonor && (
          <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog modal-xl">
              <div className="modal-content admin-modal">
                <div className="modal-header admin-modal-header">
                  <h5 className="modal-title admin-modal-title">
                    <i className="fas fa-user-circle me-2"></i>
                    Donor Details - {selectedDonor.name}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close admin-btn-close"
                    onClick={() => setSelectedDonor(null)}
                  ></button>
                </div>
                <div className="modal-body admin-modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="admin-info-card mb-4">
                        <h6 className="admin-info-title">
                          <i className="fas fa-user me-2"></i>
                          Personal Information
                        </h6>
                        <div className="admin-info-content">
                          <div className="admin-info-item">
                            <strong>Name:</strong> 
                            <span className="ms-2">{selectedDonor.name}</span>
                          </div>
                          <div className="admin-info-item">
                            <strong>Email:</strong> 
                            <span className="ms-2">{selectedDonor.email}</span>
                          </div>
                          <div className="admin-info-item">
                            <strong>Phone:</strong> 
                            <span className="ms-2">{selectedDonor.phone}</span>
                          </div>
                          <div className="admin-info-item">
                            <strong>Blood Group:</strong> 
                            <span className="admin-badge admin-badge-danger ms-2">{selectedDonor.bloodGroup}</span>
                          </div>
                          <div className="admin-info-item">
                            <strong>Location:</strong> 
                            <span className="ms-2">{selectedDonor.location}</span>
                          </div>
                          {selectedDonor.inventoryType && (
                            <div className="admin-info-item">
                              <strong>Inventory Type:</strong>
                              <span className={`admin-badge ms-2 ${selectedDonor.inventoryType === 'in' ? 'admin-badge-success' : 'admin-badge-warning'}`}>
                                {selectedDonor.inventoryType === 'in' ? 'Donor (Blood In)' : 'Recipient (Blood Out)'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="admin-info-card mb-4">
                        <h6 className="admin-info-title">
                          <i className="fas fa-heart me-2"></i>
                          Donation History
                        </h6>
                        <div className="admin-info-content">
                          <div className="admin-info-item">
                            <strong>Total Donations:</strong> 
                            <span className="admin-badge admin-badge-primary ms-2">{selectedDonor.totalDonations}</span>
                          </div>
                          <div className="admin-info-item">
                            <strong>Last Donation:</strong> 
                            <span className="ms-2">{selectedDonor.lastDonation}</span>
                          </div>
                          <div className="admin-info-item">
                            <strong>Status:</strong> 
                            <span className="ms-2">{getStatusBadge(selectedDonor.status)}</span>
                          </div>
                          <div className="admin-info-item">
                            <strong>Joined:</strong> 
                            <span className="ms-2">{moment(selectedDonor.joinDate).format('MMMM D, YYYY')}</span>
                          </div>
                          {selectedDonor.inventoryInfo && (
                            <>
                              <h6 className="admin-info-subtitle mt-3">
                                <i className="fas fa-boxes me-2"></i>
                                Inventory Details
                              </h6>
                              <div className="admin-info-item">
                                <strong>Last Record:</strong> 
                                <span className="ms-2">{moment(selectedDonor.inventoryInfo.createdAt).format('MMMM D, YYYY')}</span>
                              </div>
                              <div className="admin-info-item">
                                <strong>Quantity:</strong> 
                                <span className="admin-badge admin-badge-info ms-2">{selectedDonor.inventoryInfo.quantity} units</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer admin-modal-footer">
                  <button 
                    type="button" 
                    className="admin-btn admin-btn-secondary"
                    onClick={() => setSelectedDonor(null)}
                  >
                    <i className="fas fa-times me-2"></i>
                    Close
                  </button>
                  <button 
                    type="button" 
                    className="admin-btn admin-btn-primary"
                    onClick={() => {
                      // Add edit functionality here if needed
                      setSelectedDonor(null);
                    }}
                  >
                    <i className="fas fa-edit me-2"></i>
                    Edit Donor
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div> {/* admin-theme */}
    </Layout>
  );
};

export default DonorNetwork;
