import React from "react";
import { donorMenu, hospitalMenu, organisationMenu, adminMenu } from "./Menus/userMenu";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { roleDisplayNames } from "../../../utils/rolePermissions";
import "../../../styles/Layout.css";

const Sidebar = () => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();

  // Determine which menu to show based on user role
  const getSidebarMenu = () => {
    switch (user?.role) {
      case "admin":
        return adminMenu;
      case "donar":
        return donorMenu;
      case "hospital":
        return hospitalMenu;
      case "organisation":
        return organisationMenu;
      default:
        return donorMenu;
    }
  };

  const sidebarMenu = getSidebarMenu();

  // Logout handler
  const handleLogout = () => {
    localStorage.clear();
    toast.success("Logout Successfully", {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "colored",
    });
    navigate("/login");
  };

  return (
    <div>
      <div className="sidebar">
        {/* User Profile Section */}
        <div className="user-profile">
          <div className="user-avatar">
            <i className="fa-solid fa-user-circle"></i>
          </div>
          <div className="user-info">
            <h6 className="user-name">
              {user?.name || user?.hospitalName || user?.organisationName}
            </h6>
            <span className="user-role">
              {roleDisplayNames[user?.role] || user?.role}
            </span>
          </div>
        </div>

        <div className="menu">
          {sidebarMenu.map((menu) => {
            const isActive = location.pathname === menu.path;
            return (
              <div
                className={`menu-item ${isActive && "active"}`}
                key={menu.name}
              >
                <i className={menu.icon}></i>
                <Link to={menu.path}>{menu.name}</Link>
              </div>
            );
          })}
          
          {/* Logout Menu Item */}
          <div className="menu-item logout-item" onClick={handleLogout}>
            <i className="fa-solid fa-sign-out-alt"></i>
            <span style={{cursor: 'pointer', color: 'white', textDecoration: 'none', fontSize: '1.1rem', fontWeight: '500'}}>
              Logout
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
