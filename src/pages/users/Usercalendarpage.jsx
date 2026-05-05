import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar,
  Modal,
  Select,
  Input,
  Card,
  Button,
  Tag,
  Badge,
  message,
  Row,
  Col,
  Typography,
  Space,
  Divider,
  Alert,
  Statistic,
  Progress,
  Tooltip,
  Avatar,
  Skeleton,
  Steps,
} from "antd";
import {
  CalendarOutlined,
  PlusOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
  SendOutlined,
} from "@ant-design/icons";
import MainLayout from "../../components/layout/MainLayout";
import { getToken, getUser } from "../../utils/auth";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

// ================= STEP MAPPING =================
const getStepInfo = (step) => {
  switch (step) {
    case 1:
      return {
        name: "Department Manager",
        color: "#1890ff",
        icon: "👔",
        description: "Waiting for Department Manager approval",
      };
    case 2:
      return {
        name: "Manager",
        color: "#52c41a",
        icon: "💼",
        description: "Waiting for Manager approval",
      };
    case 3:
      return {
        name: "Owner",
        color: "#fa8c16",
        icon: "👑",
        description: "Waiting for Owner approval",
      };
    default:
      return {
        name: "Unknown",
        color: "#999",
        icon: "❓",
        description: "Unknown step",
      };
  }
};

const getStepName = (step) => {
  return getStepInfo(step).name;
};

const getLeaveCategoryConfig = (category) => {
  const config = {
    General: { color: "#1890ff", bg: "#e6f7ff", icon: "📋" },
    Sick: { color: "#ff4d4f", bg: "#fff1f0", icon: "🤒" },
    Casual: { color: "#52c41a", bg: "#f6ffed", icon: "🏖️" },
    Annual: { color: "#722ed1", bg: "#f9f0ff", icon: "🌴" },
    Emergency: { color: "#fa8c16", bg: "#fff7e6", icon: "🚨" },
  };
  return config[category] || { color: "#999", bg: "#f5f5f5", icon: "📝" };
};

const UserCalendar = () => {
  const [leaves, setLeaves] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [workSchedule, setWorkSchedule] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [loading, setLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState(null);
  const [open, setOpen] = useState(false);

  const [leaveType, setLeaveType] = useState("");
  const [reason, setReason] = useState("");

  const [selectedLeave, setSelectedLeave] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const BASE = import.meta.env.VITE_API_URL;
  const token = getToken();
  const user = getUser();

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    }),
    [token],
  );

  // ================= FETCH WORK SCHEDULE =================
  const fetchWorkSchedule = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const monthYear = currentMonth.format("YYYY-MM-01");

      const endpoints = [
        `${BASE}/api/work-schedule/user/${user.id}?month_year=${monthYear}`,
        `${BASE}/api/work-schedule/${user.id}?month_year=${monthYear}`,
        `${BASE}/api/work-schedule?user_id=${user.id}&month_year=${monthYear}`,
      ];

      let scheduleData = null;

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, { headers });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.data) {
              scheduleData = data.data;
              break;
            } else if (data.data) {
              scheduleData = data.data;
              break;
            }
          }
        } catch (err) {
          continue;
        }
      }

      if (scheduleData) {
        setWorkSchedule(scheduleData);
      } else {
        setWorkSchedule(null);
      }
    } catch (error) {
      console.error("Failed to fetch work schedule:", error);
      setWorkSchedule(null);
    } finally {
      setLoading(false);
    }
  }, [BASE, headers, user?.id, currentMonth]);

  // ================= FETCH LEAVES =================
  const fetchLeaves = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/leaves/my-leaves`, {
        headers,
      });
      const data = await res.json();

      const list = Array.isArray(data)
        ? data
        : data?.data || data?.results || [];

      setLeaves(list);
    } catch {
      message.error("Failed to load leaves");
    }
  }, [BASE, headers]);

  // ================= FETCH HOLIDAYS =================
  const fetchHolidays = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/holidays/`, {
        headers,
      });
      const data = await res.json();
      setHolidays(data?.data || []);
    } catch {
      setHolidays([]);
    }
  }, [BASE, headers]);

  useEffect(() => {
    fetchLeaves();
    fetchHolidays();
    fetchWorkSchedule();
  }, [fetchLeaves, fetchHolidays, fetchWorkSchedule]);

  // ================= HOLIDAY MAP =================
  const holidayMap = useMemo(() => {
    const map = new Map();

    holidays.forEach((h) => {
      let start = dayjs(h.from_date);
      const end = dayjs(h.to_date);

      while (start.isBefore(end) || start.isSame(end)) {
        map.set(start.format("YYYY-MM-DD"), h);
        start = start.add(1, "day");
      }
    });

    return map;
  }, [holidays]);

  // ================= WORK SCHEDULE MAP =================
  const workScheduleMap = useMemo(() => {
    const map = new Map();

    if (workSchedule?.details) {
      workSchedule.details.forEach((detail) => {
        map.set(detail.work_date, {
          canWork: detail.can_work,
          isHoliday: detail.is_holiday,
        });
      });
    } else if (workSchedule?.schedule) {
      workSchedule.schedule.forEach((detail) => {
        map.set(detail.date, {
          canWork: detail.can_work,
          isHoliday: detail.is_holiday,
        });
      });
    }

    return map;
  }, [workSchedule]);

  // ================= OPEN LEAVE =================
  const onSelect = (date) => {
    const formatted = date.format("YYYY-MM-DD");
    const schedule = workScheduleMap.get(formatted);

    if (schedule?.isHoliday) {
      message.warning("Cannot apply leave on a holiday");
      return;
    }

    if (schedule?.canWork === false) {
      message.warning("Cannot apply leave on a non-work day");
      return;
    }

    if (holidayMap.has(formatted)) {
      message.warning("Holiday - cannot apply leave");
      return;
    }

    setSelectedDate(date);
    setOpen(true);
  };

  // ================= APPLY LEAVE =================
  const handleApply = async () => {
    if (!leaveType) return message.error("Select leave type");
    if (!selectedDate) return message.error("Select date");

    try {
      const payload = {
        leave_date: selectedDate.format("YYYY-MM-DD"),
        leave_category: leaveType,
        reason,
      };

      const res = await fetch(`${BASE}/api/leaves/`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      message.success("Leave applied successfully");

      setOpen(false);
      setSelectedDate(null);
      setLeaveType("");
      setReason("");

      fetchLeaves();
    } catch {
      message.error("Failed to apply leave");
    }
  };

  // ================= STATUS =================
  const getStatus = (status) => {
    if (status === "APPROVED")
      return {
        color: "#52c41a",
        text: "Approved",
        icon: <CheckCircleOutlined />,
      };
    if (status === "REJECTED")
      return {
        color: "#ff4d4f",
        text: "Rejected",
        icon: <CloseCircleOutlined />,
      };
    return { color: "#faad14", text: "Pending", icon: <ClockCircleOutlined /> };
  };

  // ================= CALCULATE LEAVE STATISTICS =================
  const leaveStats = useMemo(() => {
    const approved = leaves.filter((l) => l.status === "APPROVED").length;
    const pending = leaves.filter(
      (l) => l.status === "PENDING" || l.status === "pending",
    ).length;
    const rejected = leaves.filter(
      (l) => l.status === "REJECTED" || l.status === "rejected",
    ).length;
    return { approved, pending, rejected, total: leaves.length };
  }, [leaves]);

  // ================= CALENDAR DATE CELL RENDER =================
  const dateCellRender = (value) => {
    const dateStr = value.format("YYYY-MM-DD");
    const dayLeaves = leaves.filter(
      (l) => l.leave_date === dateStr || l.from_date === dateStr,
    );
    const holiday = holidayMap.get(dateStr);
    const schedule = workScheduleMap.get(dateStr);
    const isWorkScheduleHoliday = schedule?.isHoliday === true;
    const canWork = schedule?.canWork;

    return (
      <div style={{ minHeight: 80, padding: "4px 0" }}>
        <div style={{ fontWeight: 500, marginBottom: 4 }}>{value.date()}</div>

        {schedule && !isWorkScheduleHoliday && canWork === true && (
          <Tag
            color="#52c41a"
            style={{
              fontSize: 10,
              borderRadius: 4,
              marginBottom: 4,
              marginRight: 0,
              display: "block",
              textAlign: "center",
            }}
          >
            ✅ Work
          </Tag>
        )}

        {schedule && canWork === false && !isWorkScheduleHoliday && (
          <Tag
            color="#fa8c16"
            style={{
              fontSize: 10,
              borderRadius: 4,
              marginBottom: 4,
              marginRight: 0,
              display: "block",
              textAlign: "center",
            }}
          >
            🚫 Off
          </Tag>
        )}

        {(isWorkScheduleHoliday || holiday) && (
          <Tag
            color="#eb2f96"
            style={{
              fontSize: 10,
              borderRadius: 4,
              marginBottom: 4,
              marginRight: 0,
              display: "block",
              textAlign: "center",
            }}
          >
            🎉 {holiday?.holiday_name || "Holiday"}
          </Tag>
        )}

        {dayLeaves.slice(0, 2).map((leave) => {
          const status = getStatus(leave.status);
          const categoryConfig = getLeaveCategoryConfig(leave.leave_category);
          const stepInfo = getStepInfo(leave.current_step);

          return (
            <div key={leave.id} style={{ marginBottom: 4 }}>
              <Tooltip
                title={`${leave.leave_category} - Step: ${stepInfo.name} - Click for details`}
              >
                <Tag
                  style={{
                    marginBottom: 4,
                    marginRight: 0,
                    fontSize: 10,
                    borderRadius: 4,
                    cursor: "pointer",
                    backgroundColor: categoryConfig.bg,
                    borderColor: categoryConfig.color,
                    color: categoryConfig.color,
                    display: "block",
                    textAlign: "center",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLeave(leave);
                    setViewModalOpen(true);
                  }}
                >
                  {categoryConfig.icon} {leave.leave_category} ({stepInfo.icon}{" "}
                  {stepInfo.name})
                </Tag>
              </Tooltip>
            </div>
          );
        })}
        {dayLeaves.length > 2 && (
          <Text
            type="secondary"
            style={{ fontSize: 10, display: "block", textAlign: "center" }}
          >
            +{dayLeaves.length - 2} more
          </Text>
        )}
      </div>
    );
  };

  const onMonthChange = (value) => {
    setCurrentMonth(value);
  };

  // ================= WORK SCHEDULE SUMMARY =================
  const leavePercentage = Math.min((leaveStats.approved / 20) * 100, 100);

  return (
    <MainLayout>
      <div style={{ padding: 24, background: "#f0f2f5", minHeight: "100vh" }}>
        {/* Header Section */}
        <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={16}>
            <Title level={2} style={{ margin: 0, marginBottom: 8 }}>
              Leave Management
            </Title>
            <Text type="secondary">
              Manage your leave requests and view your work schedule
            </Text>
          </Col>
        </Row>

        {/* Work Schedule Summary */}
        {loading ? (
          <Skeleton
            active
            paragraph={{ rows: 2 }}
            style={{ marginBottom: 24 }}
          />
        ) : workSchedule ? (
          <Card
            style={{
              marginBottom: 24,
              borderRadius: 12,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
            bodyStyle={{ padding: 20 }}
          >
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={8}>
                <Space direction="vertical">
                  <Text style={{ color: "#fff", opacity: 0.9, fontSize: 14 }}>
                    {currentMonth.format("MMMM YYYY")}
                  </Text>
                  <Title level={4} style={{ color: "#fff", margin: 0 }}>
                    Work Schedule
                  </Title>
                </Space>
              </Col>
              <Col xs={24} md={16}>
                <Row gutter={[16, 16]}>
                  {workSchedule.total_work_days !== undefined && (
                    <Col xs={12} sm={8}>
                      <Statistic
                        title={
                          <span style={{ color: "#fff", opacity: 0.9 }}>
                            Work Days
                          </span>
                        }
                        value={workSchedule.total_work_days}
                        valueStyle={{ color: "#fff", fontSize: 24 }}
                      />
                    </Col>
                  )}
                  {workSchedule.total_off_days !== undefined && (
                    <Col xs={12} sm={8}>
                      <Statistic
                        title={
                          <span style={{ color: "#fff", opacity: 0.9 }}>
                            Off Days
                          </span>
                        }
                        value={workSchedule.total_off_days}
                        valueStyle={{ color: "#fff", fontSize: 24 }}
                      />
                    </Col>
                  )}
                  {workSchedule.total_holidays !== undefined && (
                    <Col xs={12} sm={8}>
                      <Statistic
                        title={
                          <span style={{ color: "#fff", opacity: 0.9 }}>
                            Holidays
                          </span>
                        }
                        value={workSchedule.total_holidays}
                        valueStyle={{ color: "#fff", fontSize: 24 }}
                      />
                    </Col>
                  )}
                </Row>
              </Col>
            </Row>
            {workSchedule.assigned_by_name && (
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 12,
                  borderTop: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                <Text style={{ color: "#fff", fontSize: 12 }}>
                  <UserOutlined /> Assigned by: {workSchedule.assigned_by_name}
                </Text>
              </div>
            )}
          </Card>
        ) : (
          <Alert
            message="No Work Schedule"
            description={`No work schedule assigned for ${currentMonth.format("MMMM YYYY")}. Please contact your administrator.`}
            type="info"
            showIcon
            style={{ marginBottom: 24, borderRadius: 12 }}
          />
        )}

        {/* Calendar Section */}
        <Card
          style={{
            borderRadius: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
          bodyStyle={{ padding: 20 }}
        >
          <Calendar
            onSelect={onSelect}
            dateCellRender={dateCellRender}
            onPanelChange={onMonthChange}
          />
        </Card>

        {/* Apply Leave Modal */}
        <Modal
          title={
            <Space>
              <PlusOutlined style={{ color: "#52c41a" }} />
              <span>Apply for Leave</span>
            </Space>
          }
          open={open}
          onOk={handleApply}
          onCancel={() => {
            setOpen(false);
            setLeaveType("");
            setReason("");
          }}
          okText="Submit Request"
          cancelText="Cancel"
          centered
          width={500}
        >
          <div style={{ marginBottom: 16 }}>
            <Alert
              message={`Selected Date: ${selectedDate?.format("DD MMMM YYYY")}`}
              type="info"
              showIcon
              style={{ borderRadius: 8 }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <Text strong>Leave Type</Text>
            <Select
              placeholder="Select leave type"
              style={{ width: "100%", marginTop: 8 }}
              onChange={setLeaveType}
              value={leaveType}
              size="large"
            >
              <Option value="General">📋 General Leave</Option>
              <Option value="Sick">🤒 Sick Leave</Option>
              <Option value="Casual">🏖️ Casual Leave</Option>
              <Option value="Annual">🌴 Annual Leave</Option>
              <Option value="Emergency">🚨 Emergency Leave</Option>
            </Select>
          </div>

          <div>
            <Text strong>Reason</Text>
            <TextArea
              placeholder="Please provide a reason for your leave request..."
              rows={4}
              onChange={(e) => setReason(e.target.value)}
              style={{ marginTop: 8, borderRadius: 8 }}
            />
          </div>
        </Modal>

        {/* View Leave Modal with Current Step Highlight */}
        <Modal
          title={
            <Space>
              <EyeOutlined style={{ color: "#1890ff" }} />
              <span>Leave Details</span>
            </Space>
          }
          open={viewModalOpen}
          onCancel={() => setViewModalOpen(false)}
          footer={[
            <Button key="close" onClick={() => setViewModalOpen(false)}>
              Close
            </Button>,
          ]}
          centered
          width={600}
        >
          {selectedLeave && (
            <div>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Card
                    size="small"
                    style={{ background: "#f5f5f5", borderRadius: 8 }}
                  >
                    <Space>
                      <Avatar
                        icon={<CalendarOutlined />}
                        style={{ backgroundColor: "#1890ff" }}
                      />
                      <div>
                        <Text type="secondary">Date</Text>
                        <div>
                          <Text strong>
                            {selectedLeave.leave_date ||
                              selectedLeave.from_date}
                          </Text>
                        </div>
                      </div>
                    </Space>
                  </Card>
                </Col>

                <Col xs={24} sm={12}>
                  <Card size="small" style={{ borderRadius: 8 }}>
                    <Space>
                      <span>
                        {
                          getLeaveCategoryConfig(selectedLeave.leave_category)
                            .icon
                        }
                      </span>
                      <div>
                        <Text type="secondary">Leave Type</Text>
                        <div>
                          <Text strong>{selectedLeave.leave_category}</Text>
                        </div>
                      </div>
                    </Space>
                  </Card>
                </Col>

                <Col xs={24} sm={12}>
                  <Card size="small" style={{ borderRadius: 8 }}>
                    <Space>
                      {getStatus(selectedLeave.status).icon}
                      <div>
                        <Text type="secondary">Status</Text>
                        <div>
                          <Badge
                            color={getStatus(selectedLeave.status).color}
                            text={getStatus(selectedLeave.status).text}
                          />
                        </div>
                      </div>
                    </Space>
                  </Card>
                </Col>

                <Col span={24}>
                  <Card size="small" style={{ borderRadius: 8 }}>
                    <Space>
                      <FileTextOutlined style={{ color: "#1890ff" }} />
                      <div style={{ flex: 1 }}>
                        <Text type="secondary">Reason</Text>
                        <div>
                          <Text>
                            {selectedLeave.reason || "No reason provided"}
                          </Text>
                        </div>
                      </div>
                    </Space>
                  </Card>
                </Col>

                {/* Current Step Section - Highlighted */}
                <Col span={24}>
                  <Card
                    size="small"
                    style={{
                      borderRadius: 8,
                      background:
                        "linear-gradient(135deg, #f0f5ff 0%, #e6f4ff 100%)",
                      border: `2px solid ${getStepInfo(selectedLeave.current_step).color}`,
                    }}
                  >
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Space>
                          <UserOutlined
                            style={{
                              color: getStepInfo(selectedLeave.current_step)
                                .color,
                              fontSize: 18,
                            }}
                          />
                          <Text
                            strong
                            style={{
                              color: getStepInfo(selectedLeave.current_step)
                                .color,
                            }}
                          >
                            Current Approval Step
                          </Text>
                        </Space>
                        <Tag
                          color={getStepInfo(selectedLeave.current_step).color}
                          style={{ fontSize: 14, padding: "4px 12px" }}
                        >
                          {getStepInfo(selectedLeave.current_step).icon} Step{" "}
                          {selectedLeave.current_step}
                        </Tag>
                      </div>

                      <div style={{ marginTop: 8 }}>
                        <Steps
                          current={selectedLeave.current_step - 1}
                          size="small"
                          items={[
                            {
                              title: "Department Manager",
                              description: "First level approval",
                              icon: <span>👔</span>,
                            },
                            {
                              title: "Manager",
                              description: "Second level approval",
                              icon: <span>💼</span>,
                            },
                            {
                              title: "Owner",
                              description: "Final approval",
                              icon: <span>👑</span>,
                            },
                          ]}
                        />
                      </div>

                      <div
                        style={{
                          marginTop: 12,
                          padding: 8,
                          background: "#fff",
                          borderRadius: 6,
                        }}
                      >
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <InfoCircleOutlined />{" "}
                          {getStepInfo(selectedLeave.current_step).description}
                        </Text>
                      </div>
                    </Space>
                  </Card>
                </Col>
              </Row>
            </div>
          )}
        </Modal>
      </div>
    </MainLayout>
  );
};

export default UserCalendar;
