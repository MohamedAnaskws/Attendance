import React, { useState } from "react";
import { Menu } from "antd";
import { useNavigate, useLocation } from "react-router-dom";

import Logo from "../../../assets/logo.webp";
import { ADMIN_MENU } from "../../../config/menuConfig";
import { filterMenuByRole } from "../../../utils/menuFilter";
import { getUser } from "../../../utils/auth";

function AdminSidebar({ collapsed }) {
  const navigate = useNavigate();
  const location = useLocation();

  const user = getUser();
  const roleId = user?.roleid;

  const menuItems = filterMenuByRole(ADMIN_MENU, roleId);

  const [openKeys, setOpenKeys] = useState(["hr"]);

  return (
    <div
      style={{
        height: "100%",
        background: "linear-gradient(180deg, #1a1e2b 0%, #0f1119 100%)",
        display: "flex",
        flexDirection: "column",
        boxShadow: "4px 0 12px rgba(0, 0, 0, 0.1)",
        overflow: "hidden",
      }}
    >
      {/* LOGO */}
      <div
        style={{
          padding: "16px",
          textAlign: "center",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "#0f1119",
        }}
      >
        <img
          src={Logo}
          alt="logo"
          style={{
            height: collapsed ? "32px" : "40px",
            transition: "all 0.3s ease",
            filter: "brightness(0) invert(1)",
            opacity: 0.95,
          }}
        />
      </div>

      {/* MENU */}
      <Menu
        mode="inline"
        theme="dark"
        items={menuItems}
        selectedKeys={[location.pathname]}
        openKeys={collapsed ? [] : openKeys}
        onOpenChange={setOpenKeys}
        onClick={(e) => navigate(e.key)}
        style={{
          background: "transparent",
          borderRight: "none",
          flex: 1,
          paddingRight: "6px",
          overflowX: "hidden",
        }}
      />
    </div>
  );
}

export default AdminSidebar;