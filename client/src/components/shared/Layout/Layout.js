import React from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

const Layout = ({ children }) => {
  return (
    <>
      <div className="header fixed-top">
        <Header />
      </div>
      <div className="row g-0" style={{ marginTop: '70px' }}>
        <div className="col-md-3">
          <Sidebar />
        </div>
        <div className="col-md-9">
          <div className="main-content">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default Layout;
