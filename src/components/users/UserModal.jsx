import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Upload,
  Card,
  Divider,
  Row,
  Col,
} from "antd";
import moment from "moment";

function UserModal({
  open,
  onCancel,
  onSubmit,
  form,
  editingUser,
  roles = [],
  loading,
}) {
  useEffect(() => {
    if (!editingUser) {
      form.resetFields();
      return;
    }

    const roleObj = roles?.find((r) => r.id === editingUser.roleid);

    form.setFieldsValue({
      ...editingUser,

      password: "",

      dob: editingUser.date_of_birth
        ? moment(editingUser.date_of_birth)
        : null,

      joiningDate: editingUser.joining_date
        ? moment(editingUser.joining_date)
        : null,

      role: roleObj?.role_name,

      // ✅ NEW FIELDS
      pin_number: editingUser.pin_number || "",
      ip_address: editingUser.ip_address || "",

      profile_image: editingUser.profile_image
        ? [
            {
              uid: "-1",
              name: "profile",
              status: "done",
              url: editingUser.profile_image,
            },
          ]
        : [],

      passport_file: editingUser.passport_file
        ? [
            {
              uid: "-2",
              name: "passport",
              status: "done",
              url: editingUser.passport_file,
            },
          ]
        : [],

      employee_contract: editingUser.employee_contract
        ? [
            {
              uid: "-3",
              name: "contract",
              status: "done",
              url: editingUser.employee_contract,
            },
          ]
        : [],

      extra_document: editingUser.extra_document
        ? [
            {
              uid: "-4",
              name: "extra",
              status: "done",
              url: editingUser.extra_document,
            },
          ]
        : [],
    });
  }, [editingUser, roles, form]);

  const normFile = (e) => (Array.isArray(e) ? e : e?.fileList || []);

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={800}
      title={editingUser ? "Edit User" : "Create User"}
      bodyStyle={{ padding: 10 }}
    >
      <Form form={form} layout="vertical" size="small">
        {/* BASIC INFO */}
        <Card size="small" title="Basic Info" bodyStyle={{ padding: 8 }}>
          <Row gutter={8}>
            <Col span={12}>
              <Form.Item
                name="first_name"
                label="First Name"
                rules={[{ required: true }]}
                style={{ marginBottom: 8 }}
              >
                <Input size="small" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="last_name"
                label="Last Name"
                style={{ marginBottom: 8 }}
              >
                <Input size="small" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="username"
                label="Username"
                rules={[{ required: true }]}
                style={{ marginBottom: 8 }}
              >
                <Input size="small" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[{ required: true }]}
                style={{ marginBottom: 8 }}
              >
                <Input size="small" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="password"
                label="Password"
                rules={
                  editingUser
                    ? []
                    : [{ required: true, message: "Password is required" }]
                }
                style={{ marginBottom: 8 }}
              >
                <Input.Password size="small" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="phone_no"
                label="Phone"
                style={{ marginBottom: 8 }}
              >
                <Input size="small" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="role"
                label="Role"
                style={{ marginBottom: 8 }}
              >
                <Select size="small">
                  {roles.map((r) => (
                    <Select.Option key={r.id} value={r.role_name}>
                      {r.role_name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* ✅ PIN */}
            <Col span={12}>
              <Form.Item
                name="pin_number"
                label="PIN Number"
                rules={[
                  {
                    pattern: /^[0-9]{4}$/,
                    message: "PIN must be exactly 4 digits",
                  },
                ]}
                style={{ marginBottom: 8 }}
              >
                <Input.Password
                  maxLength={4}
                  placeholder="Enter 4-digit PIN"
                />
              </Form.Item>
            </Col>

            {/* ✅ IP ADDRESS */}
            <Col span={12}>
              <Form.Item
                name="ip_address"
                label="IP Address"
                rules={[
                  {
                    pattern:
                      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/,
                    message: "Enter valid IP address",
                  },
                ]}
                style={{ marginBottom: 8 }}
              >
                <Input placeholder="192.168.1.1" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Divider style={{ margin: "8px 0" }} />

        {/* DETAILS */}
        <Card size="small" title="Details" bodyStyle={{ padding: 8 }}>
          <Row gutter={8}>
            <Col span={12}>
              <Form.Item name="dob" label="DOB" style={{ marginBottom: 8 }}>
                <DatePicker size="small" style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="joiningDate"
                label="Joining Date"
                style={{ marginBottom: 8 }}
              >
                <DatePicker size="small" style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="monthly_salary"
                label="Salary"
                style={{ marginBottom: 8 }}
              >
                <Input size="small" prefix="PKR" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="address"
                label="Address"
                style={{ marginBottom: 8 }}
              >
                <Input size="small" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="next_of_kin_details"
                label="Next of Kin"
                style={{ marginBottom: 8 }}
              >
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Divider style={{ margin: "8px 0" }} />

        {/* DOCUMENTS */}
        <Card size="small" title="Documents" bodyStyle={{ padding: 8 }}>
          <Row gutter={8}>
            {[
              { key: "profile_image", label: "Profile" },
              { key: "passport_file", label: "Passport" },
              { key: "employee_contract", label: "Contract" },
              { key: "extra_document", label: "Extra" },
            ].map((item) => (
              <Col span={12} key={item.key}>
                <Form.Item
                  name={item.key}
                  label={item.label}
                  valuePropName="fileList"
                  getValueFromEvent={normFile}
                  style={{ marginBottom: 8 }}
                >
                  <Upload
                    beforeUpload={() => false}
                    maxCount={1}
                    listType="picture-card"
                  >
                    +
                  </Upload>
                </Form.Item>
              </Col>
            ))}
          </Row>
        </Card>

        {/* ACTIONS */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 8,
          }}
        >
          <Button size="small" onClick={onCancel}>
            Cancel
          </Button>

          <Button
            type="primary"
            size="small"
            loading={loading}
            style={{ marginLeft: 6 }}
            onClick={async () => {
              const v = await form.validateFields();

              onSubmit({
                ...v,

                pin_number: v.pin_number,
                ip_address: v.ip_address,

                profile_image: v.profile_image?.[0]?.originFileObj,
                passport_file: v.passport_file?.[0]?.originFileObj,
                employee_contract:
                  v.employee_contract?.[0]?.originFileObj,
                extra_document: v.extra_document?.[0]?.originFileObj,

                date_of_birth: v.dob?.format("YYYY-MM-DD"),
                joining_date: v.joiningDate?.format("YYYY-MM-DD"),
              });
            }}
          >
            {editingUser ? "Update" : "Create"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

export default UserModal;