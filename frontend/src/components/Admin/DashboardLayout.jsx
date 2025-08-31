// src/components/admin/DashboardLayout.jsx
import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "../../style/DashboardLayout.css";

const DashboardLayout = ({ children }) => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main">
        <Topbar />
        <div className="content">{children}</div>
      </div>
    </div>
  );
};

export default DashboardLayout;
