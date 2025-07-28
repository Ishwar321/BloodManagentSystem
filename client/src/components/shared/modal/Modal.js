import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import InputType from "./../Form/InputType";
import API from "./../../../services/API";

const Modal = () => {
  const [inventoryType, setInventoryType] = useState("in");
  const [bloodGroup, setBloodGroup] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useSelector((state) => state.auth);
  
  // Set default inventory type based on user role
  useEffect(() => {
    if (user?.role === "hospital") {
      setInventoryType("out");
    } else if (user?.role === "donar") {
      setInventoryType("in");
    }
  }, [user]);
  
  // Handle modal data
  const handleModalSubmit = async () => {
    try {
      setLoading(true);
      
      // Validation
      if (!bloodGroup || !quantity) {
        toast.error("Please provide all fields");
        return;
      }
      
      if (quantity <= 0) {
        toast.error("Quantity must be greater than 0");
        return;
      }
      
      if (quantity > 500) {
        toast.error("Quantity cannot exceed 500ML per donation");
        return;
      }

      // Role-based validation
      if (user?.role === "organisation") {
        toast.error("Organizations facilitate blood donations but don't directly handle inventory. Please coordinate donation camps and awareness programs.");
        return;
      }
      
      if (inventoryType === "in" && user?.role !== "donar" && user?.role !== "hospital") {
        toast.error("Only donors and hospitals can add blood to inventory");
        return;
      }
      
      if (inventoryType === "out" && user?.role !== "hospital") {
        toast.error("Only hospitals can take blood from inventory");
        return;
      }

      // Use logged-in user's email automatically
      const { data } = await API.post("/inventory/create-inventory", {
        organisation: user?._id,
        userId: user?._id,
        inventoryType,
        bloodGroup,
        quantity: parseInt(quantity),
      });
      
      if (data?.success) {
        toast.success(`Blood ${inventoryType === "in" ? "donated" : "dispensed"} successfully!`);
        // Reset form
        setBloodGroup("");
        setQuantity("");
        setInventoryType("in");
        // Close modal
        window.location.reload();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal fade"
      id="staticBackdrop"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
      tabIndex={-1}
      aria-labelledby="staticBackdropLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Manage Blood Record</h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            {/* Current User Info */}
            <div className="alert alert-info d-flex align-items-center mb-3">
              <i className="fa-solid fa-user me-2"></i>
              <div>
                <strong>Current User:</strong> {user?.name || user?.hospitalName || user?.organisationName}<br />
                <strong>Email:</strong> {user?.email}<br />
                <strong>Role:</strong> <span className="badge bg-primary">{user?.role}</span>
              </div>
            </div>

            <div className="d-flex align-items-center mb-3">
              <strong className="me-2">Blood Type:</strong>
              <div className="form-check me-3">
                <input
                  type="radio"
                  name="inventoryType"
                  value="in"
                  checked={inventoryType === "in"}
                  onChange={(e) => setInventoryType(e.target.value)}
                  className="form-check-input"
                  disabled={user?.role !== "donar" && user?.role !== "hospital"}
                />
                <label className={`form-check-label ${user?.role !== "donar" && user?.role !== "hospital" ? "text-muted" : ""}`}>
                  IN (Donation) {user?.role !== "donar" && user?.role !== "hospital" && "(Donors & Hospitals only)"}
                </label>
              </div>
              <div className="form-check">
                <input
                  type="radio"
                  name="inventoryType"
                  value="out"
                  checked={inventoryType === "out"}
                  onChange={(e) => setInventoryType(e.target.value)}
                  className="form-check-input"
                  disabled={user?.role !== "hospital"}
                />
                <label className={`form-check-label ${user?.role !== "hospital" ? "text-muted" : ""}`}>
                  OUT (Dispensing) {user?.role !== "hospital" && "(Hospitals only)"}
                </label>
              </div>
            </div>
            
            <div className="mb-3">
              <label className="form-label fw-bold">Blood Group: *</label>
              <select
                className="form-select"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                required
              >
                <option value="" disabled>
                  Select Blood Group
                </option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
              </select>
            </div>
            
            <InputType
              labelText="Quantity (ML) * (Max: 500ML)"
              labelFor="quantity"
              inputType="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="mb-3"
            />
            
            <small className="text-muted">* Required fields</small>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              data-bs-dismiss="modal"
              disabled={loading}
            >
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleModalSubmit}
              disabled={loading || !bloodGroup || !quantity}
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
