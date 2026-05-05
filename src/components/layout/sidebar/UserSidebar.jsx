import React from "react";
import { Menu } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "../../../assets/logo.webp";

import { USER_MENU } from "../../../config/menuConfig";
import { filterMenuByRole } from "../../../utils/menuFilter";

function UserSidebar({ collapsed }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = filterMenuByRole(USER_MENU);

  return (
    <div
      style={{
        height: "100%",
        background: "#0f172a",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* LOGO */}
      <div className="p-4 text-center border-b border-slate-700">
        <img
          src={Logo}
          alt="logo"
          className={`mx-auto transition-all duration-300 ${collapsed ? "h-8" : "h-10"}`}
        />
      </div>

      {/* MENU */}
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        onClick={(e) => navigate(e.key)}
        theme="dark"
        style={{
          background: "transparent",
          borderRight: "none",
          flex: 1,
          paddingRight: "6px",
          overflowX: "hidden",
        }}
        items={menuItems}
      />
    </div>
  );
}

export default UserSidebar;
