import React, { useState } from "react";
import {
  Table,
  Button,
  Space,
  Popconfirm,
  Avatar,
  Tag,
  Tooltip,
  Modal,
  Descriptions,
  Typography,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  EyeOutlined,
  IdcardOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

function UserTable({ data, onEdit, onDelete }) {
  const [viewUser, setViewUser] = useState(null);

  const getInitials = (r) => {
    const first = r.first_name?.charAt(0) || "";
    const last = r.last_name?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  const roleMap = {
    1: "Owner",
    2: "Manager",
    3: "Department Manager",
    4: "Staff",
  };

  const getColor = (name = "") => {
    const colors = [
      "#6366f1",
      "#06b6d4",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#ec4899",
      "#14b8a6",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const openFile = (url) => {
    if (!url) return;
    window.open(url, "_blank");
  };

  const columns = [
    {
      title: "User",
      width: 320,
      render: (_, r) => {
        const name = `${r.first_name || ""} ${r.last_name || ""}`.trim();
        const userNo = r.user_no || r.employee_id || r.user_number || "-";
        
        return (
          <div className="flex items-center gap-3" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Avatar
              size={50}
              style={{
                backgroundColor: getColor(name),
                fontWeight: 600,
                fontSize: 18,
              }}
              icon={!name && <UserOutlined />}
            >
              {name ? getInitials(r) : null}
            </Avatar>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "3px", flexWrap: "wrap" }}>
                <Text strong style={{ fontSize: "14px", color: "#1e293b" }}>
                  {name || "No Name"}
                </Text>
                {userNo !== "-" && (
                  <Tag  style={{ borderRadius: "4px" }}>
                    {userNo}
                  </Tag>
                )}
              </div>
              <div >
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  {r.email || "No Email"}
                </Text>
              </div>
            </div>
          </div>
        );
      },
    },

    {
      title: "Phone",
      dataIndex: "phone_no",
      render: (t) => <span style={{ color: "#64748b" }}>{t || "-"}</span>,
    },

    {
      title: "Role",
      render: (_, r) => {
        const roleMap = {
          1: { name: "Owner", color: "#8b5cf6", bg: "#f5f3ff" },
          2: { name: "Manager", color: "#3b82f6", bg: "#eff6ff" },
          3: { name: "Department Manager", color: "#f59e0b", bg: "#fffbeb" },
          4: { name: "Staff", color: "#10b981", bg: "#ecfdf5" },
        };

        const role = roleMap[r.roleid] || {
          name: "Staff",
          color: "#64748b",
          bg: "#f1f5f9",
        };

        return (
          <Tag
            style={{
              background: role.bg,
              color: role.color,
              border: "none",
              borderRadius: "6px",
              padding: "4px 12px",
            }}
          >
            {role.name}
          </Tag>
        );
      },
    },

    {
      title: "Salary",
      render: (_, r) => (
        <span style={{ fontWeight: 600, color: "#10b981" }}>
          {r.monthly_salary ? `PKR ${r.monthly_salary.toLocaleString()}` : "-"}
        </span>
      ),
    },

    {
      title: "Joining",
      render: (_, r) => r.joining_date || "-",
    },

    {
      title: "Actions",
      width: 240,
      render: (_, r) => (
        <Space>
          <Tooltip title="View User">
            <Button icon={<EyeOutlined />} onClick={() => setViewUser(r)} />
          </Tooltip>

          <Tooltip title="Edit User">
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => onEdit(r)}
            />
          </Tooltip>

          <Popconfirm
            title="Delete this user?"
            description={`Are you sure you want to delete ${r.first_name || ""} ${r.last_name || ""}?`}
            onConfirm={() => onDelete(r.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete User">
              <Button danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table 
        dataSource={data} 
        columns={columns} 
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`,
        }}
      />

      {/* VIEW MODAL - Enhanced */}
      <Modal
        open={!!viewUser}
        onCancel={() => setViewUser(null)}
        footer={[
          <Button key="close" onClick={() => setViewUser(null)}>
            Close
          </Button>,
        ]}
        title={
          <Space>
            <UserOutlined style={{ color: "#1890ff" }} />
            <span>User Details</span>
          </Space>
        }
        width={700}
        centered
      >
        {viewUser && (
          <Descriptions 
            column={1} 
            bordered 
            size="middle"
            labelStyle={{ fontWeight: 600, width: "40%" }}
          >
            <Descriptions.Item label="User ID / Number">
              <Space>
                <IdcardOutlined style={{ color: "#1890ff" }} />
                <Text strong style={{ color: "#1890ff", fontSize: "16px" }}>
                  {viewUser.user_no || viewUser.employee_id || viewUser.user_number || "-"}
                </Text>
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="Full Name">
              <Text strong>
                {viewUser.first_name || ""} {viewUser.last_name || ""}
              </Text>
            </Descriptions.Item>

            <Descriptions.Item label="Username">
              {viewUser.username || "-"}
            </Descriptions.Item>

            <Descriptions.Item label="Email">
              {viewUser.email || "-"}
            </Descriptions.Item>

            <Descriptions.Item label="Phone">
              {viewUser.phone_no || "-"}
            </Descriptions.Item>

            <Descriptions.Item label="Role">
              <Tag color="blue">
                {roleMap[viewUser.roleid] || "-"}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="PIN Number">
              <span style={{ color: "#ef4444", fontWeight: 600 }}>
                {viewUser.pin_number || "-"}
              </span>
            </Descriptions.Item>

            <Descriptions.Item label="IP Address">
              <span style={{ color: "#3b82f6", fontWeight: 500 }}>
                {viewUser.ip_address || "-"}
              </span>
            </Descriptions.Item>

            <Descriptions.Item label="Salary">
              {viewUser.monthly_salary
                ? `PKR ${viewUser.monthly_salary.toLocaleString()}`
                : "-"}
            </Descriptions.Item>

            <Descriptions.Item label="Date of Birth">
              {viewUser.date_of_birth || "-"}
            </Descriptions.Item>

            <Descriptions.Item label="Joining Date">
              {viewUser.joining_date || "-"}
            </Descriptions.Item>

            <Descriptions.Item label="Address">
              {viewUser.address || "-"}
            </Descriptions.Item>

            <Descriptions.Item label="Next of Kin">
              {viewUser.next_of_kin_details || "-"}
            </Descriptions.Item>

            {/* DOCUMENTS */}
            <Descriptions.Item label="Profile Image">
              {viewUser.profile_image ? (
                <Button type="link" onClick={() => openFile(viewUser.profile_image)}>
                  View Document
                </Button>
              ) : (
                "-"
              )}
            </Descriptions.Item>

            <Descriptions.Item label="Passport">
              {viewUser.passport_file ? (
                <Button type="link" onClick={() => openFile(viewUser.passport_file)}>
                  View Document
                </Button>
              ) : (
                "-"
              )}
            </Descriptions.Item>

            <Descriptions.Item label="Employee Contract">
              {viewUser.employee_contract ? (
                <Button type="link" onClick={() => openFile(viewUser.employee_contract)}>
                  View Document
                </Button>
              ) : (
                "-"
              )}
            </Descriptions.Item>

            <Descriptions.Item label="Extra Document">
              {viewUser.extra_document ? (
                <Button type="link" onClick={() => openFile(viewUser.extra_document)}>
                  View Document
                </Button>
              ) : (
                "-"
              )}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  );
}

export default UserTable;