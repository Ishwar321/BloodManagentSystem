import React, { useState } from "react";
import InputType from "./InputType";
import { Link } from "react-router-dom";
import { handleLogin, handleRegister } from "../../../services/authService";
import { useSelector } from "react-redux"; // ✅ Import Redux state

const Form = ({ formType, submitBtn, formTitle }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("donar");
  const [name, setName] = useState("");
  const [organisationName, setOrganisationName] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  // Organization-specific fields
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [organizationType, setOrganizationType] = useState("");
  // Hospital-specific fields
  const [licenseNumber, setLicenseNumber] = useState("");
  // ✅ Get error and loading state from Redux
  const { error, loading } = useSelector((state) => state.auth);

  return (
    <div>
      <form
        onSubmit={(e) => {
          if (formType === "login")
            return handleLogin(e, email, password, role);
          else if (formType === "register")
            return handleRegister(
              e,
              name,
              role,
              email,
              password,
              phone,
              organisationName,
              address,
              hospitalName,
              website,
              registrationNumber,
              organizationType,
              licenseNumber
            );
        }}
      >
        <h1 className="text-center">{formTitle}</h1>
        <hr></hr>
        {/* ✅ Show error message if registration or login fails */}
        {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

        {/* ✅ Show loading indicator */}
        {loading && <p style={{ textAlign: "center" }}>Loading...</p>}

        <div className="d-flex mb-3">
          <div className="form-check">
            <input
              type="radio"
              className="form-check-input"
              name="role"
              id="donarRadio"
              value={"donar"}
              onChange={(e) => setRole(e.target.value)}
              defaultChecked
            />
            <label htmlFor="donarRadio" className="form-check-label">
              Donar
            </label>
          </div>
          <div className="form-check ms-2">
            <input
              type="radio"
              className="form-check-input"
              name="role"
              id="adminRadio"
              value={"admin"}
              onChange={(e) => setRole(e.target.value)}
            />
            <label htmlFor="adminRadio" className="form-check-label">
              Admin
            </label>
          </div>
          <div className="form-check ms-2">
            <input
              type="radio"
              className="form-check-input"
              name="role"
              id="hospitalRadio"
              value={"hospital"}
              onChange={(e) => setRole(e.target.value)}
            />
            <label htmlFor="hospitalRadio" className="form-check-label">
              Hospital
            </label>
          </div>
          <div className="form-check ms-2">
            <input
              type="radio"
              className="form-check-input"
              name="role"
              id="organisationRadio"
              value={"organisation"}
              onChange={(e) => setRole(e.target.value)}
            />
            <label htmlFor="organisationRadio" className="form-check-label">
              Organisation
            </label>
          </div>
        </div>
        {/* switch statement */}
        {(() => {
          //eslint-disable-next-line
          switch (true) {
            case formType === "login": {
              return (
                <>
                  <InputType
                    labelText={"email"}
                    labelFor={"forEmail"}
                    inputType={"email"}
                    name={email}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <InputType
                    labelText={"Password"}
                    labelFor={"forPassword"}
                    inputType={"password"}
                    name={"password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </>
              );
            }
            case formType === "register": {
              return (
                <>
                  {(role === "admin" || role === "donar") && (
                    <InputType
                      labelText={"Name *"}
                      labelFor={"forName"}
                      inputType={"text"}
                      name={"name"}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  )}
                  {role === "organisation" && (
                    <>
                      <InputType
                        labelText={"Organisation Name *"}
                        labelFor={"fororganisationName"}
                        inputType={"text"}
                        name={"organisationName"}
                        value={organisationName}
                        onChange={(e) => setOrganisationName(e.target.value)}
                        required
                      />
                      <InputType
                        labelText={"Registration Number *"}
                        labelFor={"forRegistrationNumber"}
                        inputType={"text"}
                        name={"registrationNumber"}
                        value={registrationNumber}
                        onChange={(e) => setRegistrationNumber(e.target.value)}
                        required
                      />
                      <div className="mb-3">
                        <label htmlFor="forOrganizationType" className="form-label">Organization Type *</label>
                        <select
                          className="form-select"
                          id="forOrganizationType"
                          name="organizationType"
                          value={organizationType}
                          onChange={(e) => setOrganizationType(e.target.value)}
                          required
                        >
                          <option value="">Select Organization Type</option>
                          <option value="ngo">NGO</option>
                          <option value="government">Government</option>
                          <option value="private">Private</option>
                          <option value="trust">Trust</option>
                        </select>
                      </div>
                    </>
                  )}
                  {role === "hospital" && (
                    <>
                      <InputType
                        labelText={"Hospital Name *"}
                        labelFor={"forHospitalName"}
                        inputType={"text"}
                        name={"hospitalName"}
                        value={hospitalName}
                        onChange={(e) => setHospitalName(e.target.value)}
                        required
                      />
                      <InputType
                        labelText={"License Number *"}
                        labelFor={"forLicenseNumber"}
                        inputType={"text"}
                        name={"licenseNumber"}
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        required
                      />
                    </>
                  )}

                  <InputType
                    labelText={"Email *"}
                    labelFor={"forEmail"}
                    inputType={"email"}
                    name={email}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <InputType
                    labelText={"Password *"}
                    labelFor={"forPassword"}
                    inputType={"password"}
                    name={"password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  <InputType
                    labelText={"Website"}
                    labelFor={"forWebsite"}
                    inputType={"text"}
                    name={"website"}
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                  <InputType
                    labelText={"Address *"}
                    labelFor={"forAddress"}
                    inputType={"text"}
                    name={"address"}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                  <InputType
                    labelText={"Phone *"}
                    labelFor={"forPhone"}
                    inputType={"text"}
                    name={"phone"}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </>
              );
            }
          }
        })()}

        <div className="d-flex flex-row justify-content-between">
          {formType === "login" ? (
            <p>
              Not registered yet ? Register
              <Link to="/register"> Here !</Link>
            </p>
          ) : (
            <p>
              Already User Please
              <Link to="/login"> Login !</Link>
            </p>
          )}
          <button className="btn btn-primary" type="submit">
            {submitBtn}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Form;
