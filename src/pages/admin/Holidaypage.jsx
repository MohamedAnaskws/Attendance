import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  message,
  Card,
  Space,
  Tag,
  Avatar,
  Typography,
  Badge,
  Divider,
  Statistic,
  Row,
  Col,
  Tooltip,
} from "antd";
import { 
  PlusOutlined, 
  UserOutlined, 
  CalendarOutlined,
  TeamOutlined,
  TagOutlined,
  GiftOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import MainLayout from "../../components/layout/MainLayout";
import { getToken } from "../../utils/auth";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

function HolidayPage() {
  const [holidays, setHolidays] = useState([]);
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [statsModal, setStatsModal] = useState(false);

  const [form] = Form.useForm();

  const BASE = import.meta.env.VITE_API_URL;
  const token = getToken();

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    }),
    [token]
  );

  // ================= FETCH =================
  const fetchHolidays = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/holidays/`, { headers });
      const data = await res.json();
      setHolidays(data?.data || []);
    } catch {
      message.error("Failed to load holidays");
    }
  }, [BASE, headers]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/users/`, { headers });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data?.data || []);
    } catch {
      message.error("Failed to load users");
    }
  }, [BASE, headers]);

  useEffect(() => {
    fetchHolidays();
    fetchUsers();
  }, [fetchHolidays, fetchUsers]);

  // ================= USER MAP =================
  const userMap = useMemo(() => {
    const map = {};
    users.forEach((u) => {
      map[u.id] = u;
    });
    return map;
  }, [users]);

  // ================= STATISTICS =================
  const statistics = useMemo(() => {
    const totalHolidays = holidays.length;
    const publicHolidays = holidays.filter(h => h.holiday_type === "Public Holiday").length;
    const companyHolidays = holidays.filter(h => h.holiday_type === "Company Holiday").length;
    const optionalHolidays = holidays.filter(h => h.holiday_type === "Optional Holiday").length;
    const upcomingHolidays = holidays.filter(h => dayjs(h.to_date).isAfter(dayjs())).length;
    
    return {
      totalHolidays,
      publicHolidays,
      companyHolidays,
      optionalHolidays,
      upcomingHolidays,
    };
  }, [holidays]);

  // ================= CREATE =================
  const handleCreate = async (values) => {
    setLoading(true);
    try {
      const payload = {
        holiday_name: values.holiday_name,
        from_date: values.dates[0].format("YYYY-MM-DD"),
        to_date: values.dates[1].format("YYYY-MM-DD"),
        holiday_type: values.holiday_type,
        user_ids: values.user_ids || [],
      };

      const res = await fetch(`${BASE}/api/holidays/`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      message.success("Holiday created successfully");
      setOpen(false);
      form.resetFields();
      fetchHolidays();
    } catch {
      message.error("Failed to create holiday");
    }
    setLoading(false);
  };

  const showHolidayStats = (record) => {
    setSelectedHoliday(record);
    setStatsModal(true);
  };

  // ================= TABLE =================
  const columns = [
    {
      title: "Holiday Name",
      dataIndex: "holiday_name",
      width: 220,
      render: (text, record) => (
        <div className="flex items-center gap-2">
          <div>
            <div className="font-semibold text-gray-800">{text}</div>
            <div className="text-xs text-gray-400">
              {dayjs(record.from_date).format("YYYY")}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Date Range",
      width: 250,
      render: (_, r) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-gray-600">
            <CalendarOutlined className="text-gray-400" />
            <span className="text-sm">
              {dayjs(r.from_date).format("DD MMM YYYY")}
            </span>
            <span className="text-gray-400">→</span>
            <span className="text-sm">
              {dayjs(r.to_date).format("DD MMM YYYY")}
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {dayjs(r.to_date).diff(dayjs(r.from_date), "days") + 1} days
          </div>
        </div>
      ),
    },
    {
      title: "Type",
      width: 150,
      dataIndex: "holiday_type",
      render: (val) => {
        const config = {
          "Public Holiday": { color: "#3b82f6", bg: "#eff6ff", icon: "🏛️" },
          "Company Holiday": { color: "#10b981", bg: "#f0fdf4", icon: "🏢" },
          "Optional Holiday": { color: "#f59e0b", bg: "#fffbeb", icon: "✨" },
        };
        const { color, bg, icon } = config[val] || { color: "#6b7280", bg: "#f3f4f6", icon: "📅" };
        return (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full" style={{ backgroundColor: bg }}>
            <span className="text-sm">{icon}</span>
            <span className="text-xs font-medium" style={{ color }}>{val}</span>
          </div>
        );
      },
    },
    {
      title: "Assigned Users",
      dataIndex: "user_ids",
      width: 300,
      render: (ids, record) => {
        if (!ids?.length) {
          return (
            <div className="text-gray-400 text-sm flex items-center gap-1">
              <TeamOutlined />
              <span>All employees</span>
            </div>
          );
        }

        const displayUsers = ids.slice(0, 3);
        const remainingCount = ids.length - 3;

        return (
          <div className="flex flex-wrap items-center gap-1">
            <Avatar.Group maxCount={4} size="small">
              {displayUsers.map((id) => {
                const user = userMap[id];
                return (
                  <Tooltip key={id} title={user ? `${user.first_name} ${user.last_name}` : `User ${id}`}>
                    <Avatar 
                      size="small" 
                      icon={<UserOutlined />}
                      className="border-2 border-white"
                    />
                  </Tooltip>
                );
              })}
              {remainingCount > 0 && (
                <Tooltip title={`${remainingCount} more employees`}>
                  <Avatar size="small" className="bg-gray-300">
                    +{remainingCount}
                  </Avatar>
                </Tooltip>
              )}
            </Avatar.Group>
            <button 
              onClick={() => showHolidayStats(record)}
              className="text-xs text-blue-500 hover:text-blue-600 ml-2"
            >
              View all
            </button>
          </div>
        );
      },
    },
    {
      title: "Status",
      width: 100,
      render: (_, r) => {
        const isPast = dayjs(r.to_date).isBefore(dayjs(), "day");
        const isCurrent = dayjs(r.from_date).isBefore(dayjs(), "day") && dayjs(r.to_date).isAfter(dayjs(), "day");
        
        if (isPast) {
          return <Badge status="default" text="Passed" />;
        }
        if (isCurrent) {
          return <Badge status="processing" text="Ongoing" />;
        }
        return <Badge status="success" text="Upcoming" />;
      },
    },
  ];

  return (
    <MainLayout>
      <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <Title level={3} className="m-0 text-gray-800">
                Holiday Management
              </Title>
              <Text type="secondary" className="text-sm">
                Manage company holidays and employee time off
              </Text>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setOpen(true)}
              className="rounded-lg shadow-sm hover:shadow-md transition-all"
              size="medium"
            >
              Add Holiday
            </Button>
          </div>
          
          <Divider className="my-4" />
          
          {/* Statistics Cards */}
          <Row gutter={[16, 16]} className="mt-4">
            <Col xs={24} sm={12} lg={4}>
              <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <Statistic
                  title="Total Holidays"
                  value={statistics.totalHolidays}
                  prefix={<CalendarOutlined className="text-blue-500" />}
                  valueStyle={{ color: "#3b82f6", fontSize: "24px" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <Statistic
                  title="Upcoming"
                  value={statistics.upcomingHolidays}
                  prefix={<ClockCircleOutlined className="text-green-500" />}
                  valueStyle={{ color: "#10b981", fontSize: "24px" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <Statistic
                  title="Public Holidays"
                  value={statistics.publicHolidays}
                  prefix={<TagOutlined className="text-blue-400" />}
                  valueStyle={{ color: "#3b82f6", fontSize: "24px" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <Statistic
                  title="Company Holidays"
                  value={statistics.companyHolidays}
                  prefix={<TeamOutlined className="text-emerald-500" />}
                  valueStyle={{ color: "#10b981", fontSize: "24px" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <Statistic
                  title="Optional Holidays"
                  value={statistics.optionalHolidays}
                  prefix={<GiftOutlined className="text-orange-500" />}
                  valueStyle={{ color: "#f59e0b", fontSize: "24px" }}
                />
              </Card>
            </Col>
          </Row>
        </div>

        {/* Holiday Table */}
        <Card className="rounded-xl shadow-sm border-0">
          <Table
            rowKey="id"
            columns={columns}
            dataSource={holidays}
            loading={loading}
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} holidays`,
              className: "mt-4"
            }}
            className="holiday-table"
          />
        </Card>

        {/* Create Holiday Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                <PlusOutlined className="text-blue-500" />
              </div>
              <span className="text-lg font-semibold">Create New Holiday</span>
            </div>
          }
          open={open}
          onCancel={() => setOpen(false)}
          footer={null}
          width={550}
          centered
          className="rounded-xl"
        >
          <Divider className="my-4" />
          <Form form={form} layout="vertical" onFinish={handleCreate}>
            <Form.Item
              name="holiday_name"
              label="Holiday Name"
              rules={[{ required: true, message: "Please enter holiday name" }]}
            >
              <Input 
                placeholder="e.g., Christmas Day, New Year, etc."
                size="large"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item
              name="dates"
              label="Date Range"
              rules={[{ required: true, message: "Please select date range" }]}
            >
              <RangePicker 
                style={{ width: "100%" }} 
                size="large"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item
              name="holiday_type"
              label="Holiday Type"
              rules={[{ required: true, message: "Please select holiday type" }]}
            >
              <Select size="large" className="rounded-lg">
                <Select.Option value="Public Holiday">
                  🏛️ Public Holiday
                </Select.Option>
                <Select.Option value="Company Holiday">
                  🏢 Company Holiday
                </Select.Option>
                <Select.Option value="Optional Holiday">
                  ✨ Optional Holiday
                </Select.Option>
              </Select>
            </Form.Item>

            <Form.Item 
              name="user_ids" 
              label="Assign Users"
              tooltip="Leave empty to assign to all employees"
            >
              <Select
                mode="multiple"
                size="large"
                placeholder="Select specific employees (optional)"
                options={users.map((u) => ({
                  label: `${u.first_name} ${u.last_name}`,
                  value: u.id,
                }))}
                className="rounded-lg"
              />
            </Form.Item>

            <Divider className="my-4" />
            
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button 
                onClick={() => setOpen(false)} 
                size="large"
                className="rounded-lg"
              >
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                size="large"
                className="rounded-lg shadow-sm"
              >
                Create Holiday
              </Button>
            </Space>
          </Form>
        </Modal>

        {/* Holiday Statistics Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                <TeamOutlined className="text-indigo-500" />
              </div>
              <span className="text-lg font-semibold">Assigned Employees</span>
            </div>
          }
          open={statsModal}
          onCancel={() => setStatsModal(false)}
          footer={null}
          width={500}
          centered
        >
          {selectedHoliday && (
            <div>
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="font-semibold text-gray-800">{selectedHoliday.holiday_name}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {dayjs(selectedHoliday.from_date).format("DD MMM YYYY")} → {dayjs(selectedHoliday.to_date).format("DD MMM YYYY")}
                </div>
                <Tag className="mt-2">{selectedHoliday.holiday_type}</Tag>
              </div>
              
              <Divider className="my-3">Assigned Employees</Divider>
              
              <div className="max-h-96 overflow-y-auto">
                {selectedHoliday.user_ids?.length > 0 ? (
                  <div className="space-y-2">
                    {selectedHoliday.user_ids.map((id) => {
                      const user = userMap[id];
                      return (
                        <div key={id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                          <Avatar icon={<UserOutlined />} />
                          <div>
                            <div className="font-medium">
                              {user ? `${user.first_name} ${user.last_name}` : `User ${id}`}
                            </div>
                            <div className="text-xs text-gray-400">
                              {user?.email || "No email"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TeamOutlined className="text-4xl text-gray-300 mb-2" />
                    <div className="text-gray-500">All employees are eligible</div>
                    <div className="text-xs text-gray-400 mt-1">This holiday applies to everyone</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </MainLayout>
  );
}

export default HolidayPage;