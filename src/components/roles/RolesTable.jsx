import React from "react";
import {
  Table,
  Button,
  Space,
  Popconfirm,
  Tag,
  Card,
  Typography,
  Badge,
  Empty,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  // PlusOutlined,
  SettingOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

function RoleTable({ data = [], onEdit, onDelete, onAdd, onPermission }) {
  const columns = [
    {
      title: "Role",
      dataIndex: "role_name",
      render: (text) => (
        <Tag
          color={text === "Admin" ? "volcano" : "geekblue"}
          style={{
            padding: "6px 14px",
            borderRadius: 20,
            fontWeight: 500,
            fontSize: 13,
          }}
        >
          {text}
        </Tag>
      ),
    },
    {
      title: "Actions",
      align: "center",
      render: (_, record) => (
        <Space size="middle">
          {/* EDIT */}
          <Button
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
            style={{ borderRadius: 8 }}
          >
            Edit
          </Button>

          {/* 🔥 PERMISSION BUTTON */}
          <Button
            type="primary"
            ghost
            icon={<SettingOutlined />}
            onClick={() => onPermission(record)}
            style={{ borderRadius: 8 }}
          >
            Permissions
          </Button>

          {/* DELETE */}
          <Popconfirm
            title="Delete this role?"
            description="This action cannot be undone"
            onConfirm={() => onDelete(record.id)}
          >
            <Button
              danger
              type="primary"
              ghost
              icon={<DeleteOutlined />}
              style={{ borderRadius: 8 }}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 16,
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
      }}
      bodyStyle={{ padding: 20 }}
    >
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <Title level={5} style={{ margin: 0 }}>
            Role Management
          </Title>
          <Text type="secondary">Manage system roles easily</Text>
        </div>

        <Space>
          <Badge count={data.length} showZero>
            <Button shape="round">Total</Button>
          </Badge>

          {/* {onAdd && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onAdd}
              style={{ borderRadius: 20 }}
            >
              Add Role
            </Button>
          )} */}
        </Space>
      </div>

      {/* TABLE */}
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={{
          pageSize: 5,
          showSizeChanger: false,
        }}
        bordered={false}
        locale={{
          emptyText: <Empty description="No Roles Found" />,
        }}
        rowClassName={() =>
          "hover:bg-gray-50 transition-all duration-200"
        }
      />
    </Card>
  );
}

export default RoleTable;