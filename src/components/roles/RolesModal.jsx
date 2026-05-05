import React, { useEffect } from "react";
import { Modal, Form, Input } from "antd";

function RoleModal({ open, onCancel, onSubmit, editingRole }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (editingRole) {
      form.setFieldsValue({
        role_name: editingRole.role_name,
      });
    } else {
      form.resetFields();
    }
  }, [editingRole, form]);

  const handleOk = () => {
    form.validateFields().then((values) => {
      onSubmit(values);
      form.resetFields();
    });
  };

  return (
    <Modal
      title={editingRole ? "Edit Role" : "Add Role"}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
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
  );
}

export default RoleModal;