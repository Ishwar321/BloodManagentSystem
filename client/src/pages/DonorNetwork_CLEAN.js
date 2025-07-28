import React, { useState, useEffect } from "react";
import Layout from "../components/shared/Layout/Layout";
import API from "../services/API";
import { toast } from "react-toastify";
import moment from "moment";

const DonorNetwork = () => {
  const [donors, setDonors] = useState([]);
  const [showEngagementModal, setShowEngagementModal] = useState(false);
  const [showAddDonorModal, setShowAddDonorModal] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalDonors: 0,
    activeDonors: 0,
    newThisMonth: 0,
    campaigns: 0
  });
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
        
        // Transform the user data to match the network format using actual userModel fields
        const transformedDonors = donorUsers.map((user, index) => ({
          id: user._id || index + 1,
          name: user.name,
          email: user.email,
          phone: user.phone,
          bloodGroup: user.bloodGroup || "N/A",
          location: user.address || "Not specified",
          city: user.location?.city || "Not specified",
          state: user.location?.state || "",
          pincode: user.location?.pincode || "",
          joinDate: user.createdAt ? moment(user.createdAt).format('YYYY-MM-DD') : "Unknown",
          dateOfBirth: user.dateOfBirth || "Not provided",
          gender: user.gender || "Not specified",
          weight: user.weight || "Not provided",
          lastDonation: user.lastDonation ? moment(user.lastDonation).format('YYYY-MM-DD') : "Never",
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
          role: user.role
        }));

        setDonors(transformedDonors);
        setStats({
          totalDonors: transformedDonors.length,
          activeDonors: transformedDonors.filter(d => d.status === 'active').length,
          newThisMonth: transformedDonors.filter(d => 
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

  // Display only donors (filter out other roles)
  const displayDonors = donors.filter(donor => {
    return !donor.role || donor.role === "donar";
  });

  const getEngagementBadge = (score) => {
    if (score >= 80) return { color: "success", text: "High" };
    if (score >= 60) return { color: "warning", text: "Medium" };
    return { color: "danger", text: "Low" };
  };

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

  const calculateEngagementScore = (donor) => {
    let score = 0;
    
    // Base score from profile completeness
    score += (donor.profileCompleteness || 0) * 0.3;
    
    // Points for recent donations
    if (donor.lastDonation && moment(donor.lastDonation).isAfter(moment().subtract(6, 'months'))) {
      score += 30;
    }
    
    // Points for total donations
    score += Math.min((donor.totalDonations || 0) * 5, 25);
    
    // Points for verification
    if (donor.isVerified) score += 15;
    
    return Math.min(Math.round(score), 100);
  };

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
      <div className="container-fluid">
        {/* Header Section */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h1 className="mb-1 fw-bold text-dark d-flex align-items-center">
                  <i className="fas fa-users me-3 text-danger"></i>
                  Donor Network
                </h1>
                <p className="text-muted mb-0">Connect with and manage your network of blood donors</p>
              </div>
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-danger btn-lg"
                  onClick={() => setShowAddDonorModal(true)}
                >
                  <i className="fas fa-user-plus me-2"></i>
                  Add Donor
                </button>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="row g-4 mb-4">
              <div className="col-lg-3 col-md-6">
                <div className="bg-white border-0 shadow-sm rounded p-4">
                  <div className="d-flex align-items-center">
                    <div className="bg-danger bg-opacity-10 rounded-circle p-3 me-3">
                      <i className="fas fa-users text-danger fa-lg"></i>
                    </div>
                    <div>
                      <h3 className="mb-1 fw-bold text-danger">{stats.totalDonors}</h3>
                      <p className="mb-0 text-muted small">Total Donors</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-3 col-md-6">
                <div className="bg-white border-0 shadow-sm rounded p-4">
                  <div className="d-flex align-items-center">
                    <div className="bg-success bg-opacity-10 rounded-circle p-3 me-3">
                      <i className="fas fa-user-check text-success fa-lg"></i>
                    </div>
                    <div>
                      <h3 className="mb-1 fw-bold text-success">{stats.activeDonors}</h3>
                      <p className="mb-0 text-muted small">Active Donors</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-3 col-md-6">
                <div className="bg-white border-0 shadow-sm rounded p-4">
                  <div className="d-flex align-items-center">
                    <div className="bg-info bg-opacity-10 rounded-circle p-3 me-3">
                      <i className="fas fa-user-plus text-info fa-lg"></i>
                    </div>
                    <div>
                      <h3 className="mb-1 fw-bold text-info">{stats.newThisMonth}</h3>
                      <p className="mb-0 text-muted small">New This Month</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-3 col-md-6">
                <div className="bg-white border-0 shadow-sm rounded p-4">
                  <div className="d-flex align-items-center">
                    <div className="bg-warning bg-opacity-10 rounded-circle p-3 me-3">
                      <i className="fas fa-bullhorn text-warning fa-lg"></i>
                    </div>
                    <div>
                      <h3 className="mb-1 fw-bold text-warning">{stats.campaigns}</h3>
                      <p className="mb-0 text-muted small">Active Campaigns</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Donors List */}
        <div className="row">
          <div className="col-12">
            <div className="bg-white border-0 shadow-sm rounded">
              <div className="border-bottom p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-1 fw-bold">Donor Directory</h5>
                    <p className="text-muted mb-0 small">Manage your network of blood donors</p>
                  </div>
                </div>
              </div>
              
              <div className="p-0">
                {displayDonors.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="mb-4">
                      <i className="fas fa-users fa-4x text-muted mb-3"></i>
                      <h4 className="text-muted fw-bold">No donors found</h4>
                      <p className="text-muted mb-0">
                        Start building your donor network by adding blood donors to the system.
                      </p>
                    </div>
                    <button 
                      className="btn btn-primary btn-lg"
                      onClick={() => setShowAddDonorModal(true)}
                    >
                      <i className="fas fa-user-plus me-2"></i>
                      Add Your First Donor
                    </button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th className="border-0 px-4 py-3">Donor Details</th>
                          <th className="border-0 px-3 py-3">Blood Group</th>
                          <th className="border-0 px-3 py-3">Contact</th>
                          <th className="border-0 px-3 py-3">Last Donation</th>
                          <th className="border-0 px-3 py-3">Status</th>
                          <th className="border-0 px-3 py-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayDonors.map((donor) => (
                          <tr key={donor.id} className="border-bottom">
                            <td className="px-4 py-4">
                              <div className="d-flex align-items-center">
                                <div className="bg-danger bg-opacity-10 rounded-circle p-2 me-3 flex-shrink-0">
                                  <i className="fas fa-user text-danger"></i>
                                </div>
                                <div>
                                  <h6 className="mb-1 fw-bold text-dark">{donor.name}</h6>
                                  <div className="small text-muted">{donor.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-4">
                              <span className="badge bg-danger fs-6 px-3 py-2">
                                {donor.bloodGroup}
                              </span>
                            </td>
                            <td className="px-3 py-4">
                              <div className="small">
                                <div>{donor.phone}</div>
                                <div className="text-muted">{donor.location}</div>
                              </div>
                            </td>
                            <td className="px-3 py-4">
                              <div className="small">
                                {donor.lastDonation !== "Never" ? 
                                  moment(donor.lastDonation).format('MMM DD, YYYY') : 
                                  "Never"
                                }
                              </div>
                            </td>
                            <td className="px-3 py-4">
                              {getStatusBadge(donor.status)}
                            </td>
                            <td className="px-3 py-4 text-center">
                              <button 
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => setSelectedDonor(donor)}
                                title="View details"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
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

        {/* Add Donor Modal */}
        {showAddDonorModal && (
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add New Donor</h5>
                  <button 
                    type="button" 
                    className="btn-close"
                    onClick={() => setShowAddDonorModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleAddDonor}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Full Name *</label>
                      <input 
                        type="text"
                        className="form-control"
                        value={donorFormData.name}
                        onChange={(e) => setDonorFormData({...donorFormData, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Email Address *</label>
                      <input 
                        type="email"
                        className="form-control"
                        value={donorFormData.email}
                        onChange={(e) => setDonorFormData({...donorFormData, email: e.target.value})}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Phone Number *</label>
                      <input 
                        type="tel"
                        className="form-control"
                        value={donorFormData.phone}
                        onChange={(e) => setDonorFormData({...donorFormData, phone: e.target.value})}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Address</label>
                      <input 
                        type="text"
                        className="form-control"
                        value={donorFormData.address}
                        onChange={(e) => setDonorFormData({...donorFormData, address: e.target.value})}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Temporary Password *</label>
                      <input 
                        type="password"
                        className="form-control"
                        value={donorFormData.password}
                        onChange={(e) => setDonorFormData({...donorFormData, password: e.target.value})}
                        required
                      />
                      <div className="form-text">The donor can change this password after first login</div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => setShowAddDonorModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={loading}
                    >
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
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Donor Details - {selectedDonor.name}</h5>
                  <button 
                    type="button" 
                    className="btn-close"
                    onClick={() => setSelectedDonor(null)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <h6>Personal Information</h6>
                      <p><strong>Name:</strong> {selectedDonor.name}</p>
                      <p><strong>Email:</strong> {selectedDonor.email}</p>
                      <p><strong>Phone:</strong> {selectedDonor.phone}</p>
                      <p><strong>Blood Group:</strong> {selectedDonor.bloodGroup}</p>
                      <p><strong>Location:</strong> {selectedDonor.location}</p>
                    </div>
                    <div className="col-md-6">
                      <h6>Donation History</h6>
                      <p><strong>Total Donations:</strong> {selectedDonor.totalDonations}</p>
                      <p><strong>Last Donation:</strong> {selectedDonor.lastDonation}</p>
                      <p><strong>Status:</strong> {getStatusBadge(selectedDonor.status)}</p>
                      <p><strong>Joined:</strong> {moment(selectedDonor.joinDate).format('MMMM D, YYYY')}</p>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setSelectedDonor(null)}
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

export default DonorNetwork;
