import React, { useEffect } from "react";
import Form from "../../components/shared/Form/Form";
import { useSelector, useDispatch } from "react-redux";
import Spinner from "../../components/shared/Spinner";
import { clearError } from "../../redux/features/auth/authSlice";

const Register = () => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth); // ✅ Removed `error` since we don't use it here

  // ✅ Clear error on component mount
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  return (
    <>
      {loading && <Spinner />}
      {!loading && (
        <div className="row g-0">
          <div className="col-md-8 form-banner">
            <img src="./assets/images/banner2.jpg" alt="registerImage" />
          </div>
          <div className="col-md-4 form-container">
            <Form
              formTitle="Register"
              submitBtn="Register"
              formType="register"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Register;
