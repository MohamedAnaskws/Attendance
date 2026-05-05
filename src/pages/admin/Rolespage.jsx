import React, { useEffect, useState } from "react";
import { message, Modal, Form, Input } from "antd";

import MainLayout from "../../components/layout/MainLayout";
import RoleTable from "../../components/roles/RolesTable";
import RolePermissionModal from "../../components/roles/RolePermissionModal";
import { getToken } from "../../utils/auth";

const BASE = `${import.meta.env.VITE_API_URL}/api/roles`;

function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  const [permissionOpen, setPermissionOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  const [loading, setLoading] = useState(false);

  const [form] = Form.useForm();

  // ================= LOAD ROLES =================
  const loadRoles = async () => {
    try {
      const res = await fetch(BASE, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "ngrok-skip-browser-warning": "true", // Skip ngrok warning page
          "user-id": 1,
        },
      });

      const data = await res.json();
      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log(err);
      message.error("Failed to load roles ❌");
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  // ================= SAVE ROLE =================
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const url = editingRole ? `${BASE}/${editingRole.id}` : BASE;

      const method = editingRole ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true", // Skip ngrok warning page
          Authorization: `Bearer ${getToken()}`,
          "user-id": 1,
        },
        body: JSON.stringify(values),
      });

      if (!res.ok) throw new Error();

      message.success("Role saved ✅");

      setOpen(false);
      setEditingRole(null);
      form.resetFields();
      loadRoles();
    } catch (err) {
      console.log(err);
      message.error("Save failed ❌");
    } finally {
      setLoading(false);
    }
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    try {
      await fetch(`${BASE}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "ngrok-skip-browser-warning": "true", 
          "user-id": 1,
        },
      });

      message.success("Deleted ✅");
      loadRoles();
    } catch {
      message.error("Delete failed ❌");
    }
  };

  // ================= OPEN PERMISSION =================
  const handleOpenPermission = (role) => {
    if (!role?.id) {
      message.error("Invalid role ❌");
      return;
    }

    setSelectedRole(role);
    setPermissionOpen(true);
  };

  // ================= SAVE PERMISSION =================
  const handleSavePermissions = async (perms) => {
    try {
      if (!selectedRole?.id) {
        message.error("Role not selected ❌");
        return;
      }

      const actionIds = [];

      Object.values(perms).forEach((modules) => {
        Object.values(modules).forEach((module) => {
          const actionMap = module.__actionIds || {};
          const actions = module.__actions || [];

          actions.forEach((actionName) => {
            if (module[actionName] && actionMap[actionName]) {
              actionIds.push(actionMap[actionName]);
            }
          });
        });
      });

      const uniqueActionIds = [...new Set(actionIds)];

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/roles/permissions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            role_id: selectedRole.id,
            action_ids: uniqueActionIds,
          }),
        },
      );

      if (!res.ok) throw new Error();

      message.success("Permissions updated ✅");
      setPermissionOpen(false);
    } catch (err) {
      console.log(err);
      message.error("Save failed ❌");
    }
  };

  return (
    <MainLayout>
      <RoleTable
        data={roles}
        onEdit={(role) => {
          setEditingRole(role);
          form.setFieldsValue(role);
          setOpen(true);
        }}
        onDelete={handleDelete}
        onAdd={() => {
          setEditingRole(null);
          form.resetFields();
          setOpen(true);
        }}
        onPermission={handleOpenPermission}
      />

      {/* ROLE MODAL */}
      <Modal
        open={open}
        title={editingRole ? "Edit Role" : "Add Role"}
        onCancel={() => setOpen(false)}
        onOk={handleSubmit}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="role_name"
            label="Role Name"
            rules={[{ required: true, message: "Enter role name" }]}
          >
            <Input placeholder="Enter role name" />
          </Form.Item>
        </Form>
      </Modal>

      {/* PERMISSION MODAL */}
      <RolePermissionModal
        open={permissionOpen}
        role={selectedRole}
        onCancel={() => setPermissionOpen(false)}
        onSave={handleSavePermissions}
      />
    </MainLayout>
  );
}

export default RolesPage;
