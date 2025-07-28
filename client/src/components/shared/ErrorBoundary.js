import React from "react";

const ErrorBoundary = ({ children, error, resetError }) => {
  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center">
          <h4>Something went wrong!</h4>
          <p>{error.message || "An unexpected error occurred."}</p>
          <button className="btn btn-primary" onClick={resetError}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ErrorBoundary;
