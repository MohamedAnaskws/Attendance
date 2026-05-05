import React from "react";
import { Avatar, Button, Tag, Tooltip } from "antd";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getUser, logout } from "../../utils/auth";

function HeaderBar() {
  const user = getUser();
  const navigate = useNavigate();

  const roleMap = {
    1: "Owner",
    2: "Manager",
    3: "Department Manager",
    4: "Staff",
  };

  const getInitials = () => {
    if (!user?.username) return "U";
    return user.username.charAt(0).toUpperCase();
  };

  const getRoleColor = (roleid) => {
    switch (roleid) {
      case 1: return { color: "#8b5cf6", bg: "#f5f3ff", border: "#e9d5ff" };
      case 2: return { color: "#3b82f6", bg: "#eff6ff", border: "#dbeafe" };
      case 3: return { color: "#f59e0b", bg: "#fffbeb", border: "#fef3c7" };
      default: return { color: "#10b981", bg: "#ecfdf5", border: "#d1fae5" };
    }
  };

  const roleStyle = getRoleColor(user?.roleid);

  return (
    <div
      className="flex justify-between items-center px-6 py-4 shadow-sm"
      style={{
        background: "#ffffff",
        borderBottom: "1px solid #f0f2f5",
        boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
      }}
    >
      {/* LEFT */}
      <div>
        <h2 className="text-md font-semibold" style={{ color: "#1e293b" }}>
          Welcome back,{" "}
          <span style={{ color: "#3b82f6", fontWeight: 600 }}>
            {user?.username || "User"}
          </span>
        </h2>
        <div className="mt-1">
          <Tag
            style={{
              background: roleStyle.bg,
              color: roleStyle.color,
              border: `1px solid ${roleStyle.border}`,
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 500,
              padding: "2px 10px",
            }}
          >
            {roleMap[user?.roleid] || "Unknown"}
          </Tag>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3">
        {/* USER INFO */}
        <div className="text-right hidden sm:block">
          <div className="font-medium" style={{ color: "#1e293b", fontSize: "13px" }}>
            {user?.first_name} {user?.last_name}
          </div>
          <div className="text-xs" style={{ color: "#94a3b8" }}>
            {user?.email}
          </div>
        </div>

        {/* AVATAR */}
        <Avatar
          size={42}
          style={{
            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
            fontWeight: 600,
            boxShadow: "0 2px 6px rgba(59,130,246,0.25)",
            cursor: "pointer",
          }}
          icon={!user?.username && <UserOutlined />}
        >
          {user?.username ? getInitials() : null}
        </Avatar>

        {/* LOGOUT */}
        <Button
          icon={<LogoutOutlined />}
          onClick={logout}
          type="default"
          style={{
            borderRadius: "8px",
            borderColor: "#e2e8f0",
            color: "#64748b",
            fontSize: "13px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#ef4444";
            e.currentTarget.style.color = "#ef4444";
            e.currentTarget.style.background = "#fef2f2";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#e2e8f0";
            e.currentTarget.style.color = "#64748b";
            e.currentTarget.style.background = "transparent";
          }}
        >
          Logout
        </Button>
      </div>
    </div>
  );
}

export default HeaderBar;
