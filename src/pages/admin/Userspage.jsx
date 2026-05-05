import React, { useEffect, useState } from "react";
import { Button, Form, message, Card, Typography, Space } from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";

import UserTable from "../../components/users/Usertable";
import UserModal from "../../components/users/UserModal";
import MainLayout from "../../components/layout/MainLayout";

import { getToken } from "../../utils/auth";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../../api/userApi";

const { Title, Text } = Typography;
const BASE = import.meta.env.VITE_API_URL;

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form] = Form.useForm();

  // =========================
  // LOAD USERS
  // =========================
  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchUsers();
      setUsers(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error(err);
      message.error("Failed to load users ❌");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOAD ROLES
  // =========================
  const loadRoles = async () => {
    try {
      const res = await fetch(`${BASE}/api/roles`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await res.json();
      setRoles(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error(err);
      message.error("Failed to load roles ❌");
    }
  };

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  // =========================
  // CREATE / UPDATE USER
  // =========================
  const handleSubmitUser = async (values) => {
    try {
      setLoading(true);

      const role = roles.find((r) => r.role_name === values.role);

      if (!role) {
        message.error("Invalid role selected ❌");
        return;
      }

      const payload = {
        ...values,
        roleid: role.id,
      };

      let res;

      if (editingUser) {
        res = await updateUser(editingUser.id, payload);
      } else {
        res = await createUser(payload);
      }

      if (res && !res.error) {
        message.success(
          editingUser
            ? "User updated successfully ✅"
            : "User created successfully ✅"
        );

        setOpen(false);
        setEditingUser(null);
        form.resetFields();
        loadUsers();
      } else {
        throw new Error("API error");
      }
    } catch (err) {
      console.error(err);
      message.error("Something went wrong ❌");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // DELETE USER
  // =========================
  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await deleteUser(id);
      message.success("User deleted successfully ✅");
      loadUsers();
    } catch (err) {
      console.error(err);
      message.error("Delete failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      {/* HEADER */}
      <div className="mb-4 flex justify-between items-center">
        <div>
          <Title level={4}>User Management</Title>
          <Text type="secondary">Manage users and documents</Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadUsers}>
            Refresh
          </Button>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingUser(null);
              setOpen(true);
            }}
          >
            Add User
          </Button>
        </Space>
      </div>

      {/* TABLE */}
      <Card>
        <UserTable
          data={users}
          onEdit={(u) => {
            setEditingUser(u);
            setOpen(true);
          }}
          onDelete={handleDelete}
        />
      </Card>

      {/* MODAL */}
      <UserModal
        open={open}
        form={form}
        roles={roles}
        editingUser={editingUser}
        onCancel={() => {
          setOpen(false);
          setEditingUser(null);
          form.resetFields();
        }}
        onSubmit={handleSubmitUser}
        loading={loading}
      />
    </MainLayout>
  );
}

export default UsersPage;