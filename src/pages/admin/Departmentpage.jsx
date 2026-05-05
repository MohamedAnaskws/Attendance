import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Popconfirm,
  message,
  Card,
  Select,
  Tabs,
  Typography,
  Row,
  Col,
  Divider,
  Tag,
  Empty,
  Tooltip,
  Alert,
  Spin,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ApartmentOutlined,
  AppstoreOutlined,
  ThunderboltOutlined,
  SaveOutlined,
  CloseOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";
import MainLayout from "../../components/layout/MainLayout";
import { getToken } from "../../utils/auth";

const { Title, Text } = Typography;
const { Option } = Select;

const BASE = import.meta.env.VITE_API_URL;

// ✅ HEADERS
const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
  "user-id": 1,
  "ngrok-skip-browser-warning": "true",
});

function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modulesLoading, setModulesLoading] = useState(false);

  const [modules, setModules] = useState([]);
  const [moduleName, setModuleName] = useState("");

  const [selectedModule, setSelectedModule] = useState(null);
  const [moduleDetails, setModuleDetails] = useState(null);

  const [actions, setActions] = useState(["view"]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [activeTab, setActiveTab] = useState("1");

  const [form] = Form.useForm();

  // ================= LOAD DEPARTMENTS =================
  const loadDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/departments`, {
        headers: getHeaders(),
      });
      const data = await res.json();

      setDepartments(Array.isArray(data) ? data : data.data || []);
    } catch {
      message.error("Failed to load departments ❌");
    } finally {
      setLoading(false);
    }
  }, []);

  // ================= LOAD MODULES =================
  const loadModules = useCallback(async (deptId) => {
    setModulesLoading(true);
    try {
      const res = await fetch(
        `${BASE}/api/departments/${deptId}/modules`,
        { headers: getHeaders() }
      );
      const data = await res.json();

      setModules(Array.isArray(data) ? data : data.data || []);
    } catch {
      message.error("Failed to load modules ❌");
    } finally {
      setModulesLoading(false);
    }
  }, []);

  // ================= LOAD MODULE DETAILS =================
  const loadModuleDetails = useCallback(async (deptId, moduleId) => {
    try {
      const res = await fetch(
        `${BASE}/departments/${deptId}/modules/${moduleId}`,
        { headers: getHeaders() }
      );

      const data = await res.json();
      console.log("MODULE DETAILS:", data);

      setModuleDetails(data);

      if (Array.isArray(data?.actions)) {
        setActions(data.actions.map((a) => a.name));
      } else {
        setActions(["view"]);
      }
    } catch {
      message.error("Failed to load module details ❌");
    }
  }, []);

  // ================= EFFECTS =================
  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  useEffect(() => {
    if (selectedDept) {
      loadModules(selectedDept);
      setSelectedModule(null);
      setModuleDetails(null);
      setActiveTab("2");
    }
  }, [selectedDept, loadModules]);

  useEffect(() => {
    if (selectedModule && selectedDept) {
      loadModuleDetails(selectedDept, selectedModule);
    }
  }, [selectedModule, selectedDept, loadModuleDetails]);

  // ================= DEPARTMENT CRUD =================
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const url = editing
        ? `${BASE}/api/departments/${editing.id}`
        : `${BASE}/api/departments`;

      const method = editing ? "PUT" : "POST";

      await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(values),
      });

      message.success(editing ? "Department updated ✅" : "Department created ✅");
      setOpen(false);
      setEditing(null);
      form.resetFields();
      loadDepartments();
    } catch {
      message.error("Error saving ❌");
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${BASE}/api/departments/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      message.success("Department deleted ✅");
      loadDepartments();
      if (selectedDept === id) {
        setSelectedDept(null);
        setModules([]);
      }
    } catch {
      message.error("Delete failed ❌");
    }
  };

  // ================= MODULE =================
  const handleCreateModule = async () => {
    if (!moduleName.trim()) return message.error("Enter module name");

    try {
      await fetch(`${BASE}/api/departments/${selectedDept}/modules`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          name: moduleName,
          department_id: selectedDept,
        }),
      });

      message.success("Module created ✅");
      setModuleName("");
      loadModules(selectedDept);
    } catch {
      message.error("Create module failed ❌");
    }
  };

  const handleUpdateModule = async () => {
    if (!moduleDetails) return;

    try {
      await fetch(
        `${BASE}/api/departments/${selectedDept}/modules/${selectedModule}`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({
            name: moduleDetails.name,
            department_id: selectedDept,
          }),
        }
      );

      message.success("Module updated ✅");
      loadModules(selectedDept);
    } catch {
      message.error("Update failed ❌");
    }
  };

  const handleDeleteModule = async (moduleId) => {
    try {
      await fetch(`${BASE}/api/departments/${selectedDept}/modules/${moduleId}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      message.success("Module deleted ✅");
      loadModules(selectedDept);
      if (selectedModule === moduleId) {
        setSelectedModule(null);
        setModuleDetails(null);
      }
    } catch {
      message.error("Delete failed ❌");
    }
  };

  // ================= ACTIONS =================
  const handleSaveActions = async () => {
    if (!selectedModule) return message.error("Select module");

    try {
      const uniqueActions = [
        ...new Set(actions.map((a) => a.toLowerCase().trim())),
      ].filter(a => a);

      for (let action of uniqueActions) {
        await fetch(`${BASE}/api/modules/${selectedModule}/actions`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            name: action,
            module_id: selectedModule,
          }),
        });
      }

      message.success("Actions saved ✅");
      await loadModuleDetails(selectedDept, selectedModule);
    } catch {
      message.error("Save actions failed ❌");
    }
  };

  // ================= TABLE COLUMNS =================
  const columns = [
    {
      title: "Department Name",
      dataIndex: "department_name",
      render: (text) => (
        <Space>
          <ApartmentOutlined style={{ color: "#1890ff" }} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Actions",
      width: 120,
      render: (_, r) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => {
                setEditing(r);
                form.setFieldsValue(r);
                setOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Delete Department"
              description={`Are you sure you want to delete "${r.department_name}"?`}
              onConfirm={() => handleDelete(r.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Module table columns
  const moduleColumns = [
    {
      title: "Module Name",
      dataIndex: "name",
      render: (text, record) => (
        <Space>
          <AppstoreOutlined style={{ color: "#52c41a" }} />
          <Text>{text}</Text>
          {selectedModule === record.id && (
            <Tag color="blue" style={{ marginLeft: 8 }}>Selected</Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Actions",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => setSelectedModule(record.id)}
          >
            View Details
          </Button>
          <Popconfirm
            title="Delete Module"
            description={`Delete "${record.name}"?`}
            onConfirm={() => handleDeleteModule(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ================= TABS =================
  const tabItems = [
    {
      key: "1",
      label: (
        <span>
          <ApartmentOutlined />
          Departments
        </span>
      ),
      children: (
        <div style={{ padding: "20px 0" }}>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Title level={5} style={{ margin: 0 }}>All Departments</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setOpen(true);
                setEditing(null);
                form.resetFields();
              }}
            >
              Add Department
            </Button>
          </div>
          
          <Table
            dataSource={departments}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: <Empty description="No departments found" /> }}
          />
        </div>
      ),
    },
    {
      key: "2",
      label: (
        <span>
          <AppstoreOutlined />
          Modules
        </span>
      ),
      children: (
        <div style={{ padding: "20px 0" }}>
          {!selectedDept ? (
            <Alert
              message="Please select a department first"
              description="Choose a department from the dropdown above to manage its modules"
              type="info"
              showIcon
            />
          ) : (
            <>
              <Card size="small" style={{ marginBottom: 20, background: "#f0f5ff" }}>
                <Row gutter={16} align="middle">
                  <Col flex="auto">
                    <Input
                      placeholder="Enter module name"
                      value={moduleName}
                      onChange={(e) => setModuleName(e.target.value)}
                      onPressEnter={handleCreateModule}
                      prefix={<AppstoreOutlined style={{ color: "#bfbfbf" }} />}
                    />
                  </Col>
                  <Col>
                    <Button type="primary" onClick={handleCreateModule}>
                      Create Module
                    </Button>
                  </Col>
                </Row>
              </Card>

              <Table
                dataSource={modules}
                columns={moduleColumns}
                rowKey="id"
                loading={modulesLoading}
                pagination={false}
                locale={{ emptyText: <Empty description="No modules found for this department" /> }}
              />

              {selectedModule && moduleDetails && (
                <>
                  <Divider />
                  <Card
                    title={
                      <Space>
                        <ThunderboltOutlined />
                        <span>Module Details: {moduleDetails.name}</span>
                      </Space>
                    }
                    extra={
                      <Button onClick={() => setSelectedModule(null)} type="link">
                        Close
                      </Button>
                    }
                    style={{ marginTop: 20 }}
                  >
                    <Row gutter={16}>
                      <Col span={20}>
                        <Input
                          value={moduleDetails.name}
                          onChange={(e) =>
                            setModuleDetails({
                              ...moduleDetails,
                              name: e.target.value,
                            })
                          }
                          prefix={<AppstoreOutlined />}
                        />
                      </Col>
                      <Col span={4}>
                        <Button type="primary" onClick={handleUpdateModule} block>
                          <SaveOutlined /> Update
                        </Button>
                      </Col>
                    </Row>
                  </Card>
                </>
              )}
            </>
          )}
        </div>
      ),
    },
    {
      key: "3",
      label: (
        <span>
          <ThunderboltOutlined />
          Actions
        </span>
      ),
      children: (
        <div style={{ padding: "20px 0" }}>
          {!selectedDept ? (
            <Alert
              message="Please select a department first"
              description="Choose a department from the dropdown above to manage its module actions"
              type="info"
              showIcon
            />
          ) : (
            <>
              <Card size="small" style={{ marginBottom: 20 }}>
                <Select
                  placeholder="Select a module"
                  style={{ width: "100%" }}
                  onChange={setSelectedModule}
                  value={selectedModule}
                  loading={modulesLoading}
                  showSearch
                  optionFilterProp="children"
                >
                  {modules.map((m) => (
                    <Option key={m.id} value={m.id}>
                      <AppstoreOutlined /> {m.name}
                    </Option>
                  ))}
                </Select>
              </Card>

              {selectedModule ? (
                <Card
                  title="Module Actions"
                  extra={
                    <Tag color="blue">{actions.filter(a => a).length} Actions</Tag>
                  }
                >
                  {actions.map((a, i) => (
                    <div key={i} style={{ marginBottom: 12 }}>
                      <Input
                        value={a}
                        onChange={(e) => {
                          const arr = [...actions];
                          arr[i] = e.target.value;
                          setActions(arr);
                        }}
                        placeholder={`Action ${i + 1}`}
                        prefix={<ThunderboltOutlined style={{ color: "#bfbfbf" }} />}
                      />
                    </div>
                  ))}

                  <Space style={{ marginTop: 16 }}>
                    <Button
                      onClick={() => setActions([...actions, ""])}
                      icon={<PlusOutlined />}
                    >
                      Add Action
                    </Button>
                    <Button
                      onClick={() => setActions(actions.filter(a => a))}
                      icon={<CloseOutlined />}
                      danger
                    >
                      Remove Empty
                    </Button>
                    <Button
                      type="primary"
                      onClick={handleSaveActions}
                      icon={<SaveOutlined />}
                    >
                      Save All Actions
                    </Button>
                  </Space>
                </Card>
              ) : (
                <Alert
                  message="No module selected"
                  description="Please select a module to manage its actions"
                  type="warning"
                  showIcon
                />
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <Card
        title={
          <Space>
            <FolderOpenOutlined style={{ fontSize: 24, color: "#1890ff" }} />
            <Title level={4} style={{ margin: 0 }}>Department Management</Title>
          </Space>
        }
        bordered={false}
        style={{ borderRadius: 12 }}
      >
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card size="small" style={{ background: "#fafafa", borderRadius: 8 }}>
              <Row align="middle" gutter={16}>
                <Col>
                  <Text strong>Select Department:</Text>
                </Col>
                <Col flex="auto">
                  <Select
                    placeholder="Choose a department"
                    style={{ width: "100%" }}
                    onChange={setSelectedDept}
                    value={selectedDept}
                    loading={loading}
                    showSearch
                    optionFilterProp="children"
                    allowClear
                  >
                    {departments.map((d) => (
                      <Option key={d.id} value={d.id}>
                        <ApartmentOutlined /> {d.department_name}
                      </Option>
                    ))}
                  </Select>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          style={{ marginTop: 16 }}
        />
      </Card>

      {/* Department Modal */}
      <Modal
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
          form.resetFields();
        }}
        footer={null}
        title={
          <Space>
            {editing ? <EditOutlined /> : <PlusOutlined />}
            <span>{editing ? "Edit Department" : "Create Department"}</span>
          </Space>
        }
        width={500}
        centered
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="department_name"
            label="Department Name"
            rules={[
              { required: true, message: "Please enter department name" },
              { min: 2, message: "Department name must be at least 2 characters" },
            ]}
          >
            <Input
              placeholder="e.g., Engineering, Human Resources, Sales"
              prefix={<ApartmentOutlined style={{ color: "#bfbfbf" }} />}
              size="large"
            />
          </Form.Item>

          <Divider />

          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={handleSubmit}>
              {editing ? "Update" : "Create"}
            </Button>
          </Space>
        </Form>
      </Modal>
    </MainLayout>
  );
}

export default DepartmentsPage;