import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Spinner from "./../components/shared/Spinner";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Layout from "../components/shared/Layout/Layout";
import Modal from "../components/shared/modal/Modal";
import API from "../services/API";
import moment from "moment";

const HomePage = () => {
  const { loading, error, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const lastError = useRef(null);
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Redirect organizations to their dashboard
  useEffect(() => {
    if (user?.role === "organisation") {
      navigate("/organization-dashboard");
    }
  }, [user, navigate]);

  //get function
  const getBloodRecords = async () => {
    try {
      const { data } = await API.get("/inventory/get-inventory");
      if (data?.success) {
        setData(data?.inventory);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (error && error !== lastError.current) {
      lastError.current = error;
      toast.error(error, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
    }
  }, [error]);

  useEffect(() => {
    getBloodRecords();
  }, []);

  // Filter data based on search and filter type
  const filteredData = data.filter((record) => {
    // For donors, show only their own "in" records
    if (user?.role === "donar") {
      return record.inventoryType === "in" && record.email === user.email;
    }
    
    // For other users, apply search and filter logic
    const matchesSearch = 
      record.bloodGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterType === "all" || record.inventoryType === filterType;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <Layout>
      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="container">
            <div className="d-flex justify-content-between align-items-center my-4">
              <h4
                data-bs-toggle="modal"
                data-bs-target="#staticBackdrop"
                style={{ cursor: "pointer" }}
              >
                <i className="fa-solid fa-plus text-success py-2"></i>
                Add Inventory
              </h4>
              
              {/* Show search bars only for non-donor users */}
              {user?.role !== "donar" && (
                <div className="d-flex gap-3">
                  {/* Search Input */}
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by blood group or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: "250px" }}
                  />
                  
                  {/* Filter Dropdown */}
                  <select
                    className="form-select"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    style={{ width: "150px" }}
                  >
                    <option value="all">All Types</option>
                    <option value="in">Blood In</option>
                    <option value="out">Blood Out</option>
                  </select>
                </div>
              )}
            </div>

            {/* Statistics Cards */}
            <div className="row mb-4">
              <div className="col-md-3">
                <div className="card text-white bg-success">
                  <div className="card-body text-center">
                    <h5>Total In</h5>
                    <h3>
                      {data
                        .filter((record) => record.inventoryType === "in")
                        .reduce((sum, record) => sum + record.quantity, 0)} ML
                    </h3>
                  </div>
                </div>
              </div>
              {/* Show Total Out only for non-donor users */}
              {user?.role !== "donar" && (
                <div className="col-md-3">
                  <div className="card text-white bg-danger">
                    <div className="card-body text-center">
                      <h5>Total Out</h5>
                      <h3>
                        {data
                          .filter((record) => record.inventoryType === "out")
                          .reduce((sum, record) => sum + record.quantity, 0)} ML
                      </h3>
                    </div>
                  </div>
                </div>
              )}
              <div className="col-md-3">
                <div className="card text-white bg-primary">
                  <div className="card-body text-center">
                    <h5>Available</h5>
                    <h3>
                      {data
                        .filter((record) => record.inventoryType === "in")
                        .reduce((sum, record) => sum + record.quantity, 0) -
                      data
                        .filter((record) => record.inventoryType === "out")
                        .reduce((sum, record) => sum + record.quantity, 0)} ML
                    </h3>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card text-white bg-info">
                  <div className="card-body text-center">
                    <h5>Total Records</h5>
                    <h3>{data.length}</h3>
                  </div>
                </div>
              </div>
            </div>

            <table className="table table-striped">
              <thead>
                <tr>
                  <th scope="col">Blood Group</th>
                  <th scope="col">Inventory Type</th>
                  <th scope="col">Quantity</th>
                  <th scope="col">Email</th>
                  <th scope="col">Time & Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center">
                      No records found
                    </td>
                  </tr>
                ) : (
                  filteredData.map((record) => (
                    <tr key={record._id}>
                      <td>
                        <span className="badge bg-secondary">
                          {record.bloodGroup}
                        </span>
                      </td>
                      <td>
                        <span 
                          className={`badge ${
                            record.inventoryType === "in" 
                              ? "bg-success" 
                              : "bg-danger"
                          }`}
                        >
                          {record.inventoryType.toUpperCase()}
                        </span>
                      </td>
                      <td>{record.quantity} (ML)</td>
                      <td>{record.email}</td>
                      <td>
                        {moment(record.createdAt).format("DD/MM/YYYY hh:mm A")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <Modal />
          </div>
        </>
      )}
    </Layout>
  );
};

export default HomePage;
