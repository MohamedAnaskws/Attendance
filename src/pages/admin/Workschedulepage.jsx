import React, { useEffect, useState } from "react";
import {
  Card,
  Select,
  Calendar,
  Button,
  message,
  Row,
  Col,
  Typography,
  Tag,
  Space,
  Tooltip,
} from "antd";
import { CloseOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import MainLayout from "@/components/layout/MainLayout";
import { getToken } from "../../utils/auth";

const { Option } = Select;
const { Title, Text } = Typography;

const WorkSchedulePage = () => {
  const BASE = import.meta.env.VITE_API_URL;

  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedWorkingDates, setSelectedWorkingDates] = useState({});
  const [existingSchedule, setExistingSchedule] = useState({});
  const [existingScheduleData, setExistingScheduleData] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Working days limit: Maximum 24 working days (6 days leave automatically)
  const [maxWorkingDays, setMaxWorkingDays] = useState(24);
  const [selectedWorkingCount, setSelectedWorkingCount] = useState(0);

  // ================= API =================
  const api = axios.create({ baseURL: BASE });

 api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers["ngrok-skip-browser-warning"] = "true";

  return config;
});

  // ================= USERS =================
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/api/users/");
        setUsers(res.data || []);
      } catch {
        message.error("Failed to load users");
      }
    };
    fetchUsers();
  }, []);

  // ================= HOLIDAYS =================
  const fetchHolidays = async (year, month) => {
    try {
      const res = await api.get(
        `/api/holidays/by-month?year=${year}&month=${month}`
      );
      setHolidays(res.data?.data || []);
    } catch {
      setHolidays([]);
    }
  };

  useEffect(() => {
    fetchHolidays(currentMonth.year(), currentMonth.month() + 1);
  }, [currentMonth]);

  // ================= USER SCHEDULE =================
  const fetchUserSchedule = async (userId) => {
    try {
      const month = currentMonth.startOf("month").format("YYYY-MM-DD");

      const res = await api.get(
        `/api/work-schedule/user/${userId}?month_year=${month}`
      );

      const list = res.data?.data?.details || [];
      const scheduleInfo = res.data?.data;

      setExistingScheduleData(scheduleInfo);

      const map = {};
      let workingCount = 0;
      
      list.forEach((d) => {
        map[d.work_date] = d;
        if (d.can_work === true) {
          workingCount++;
        }
      });

      setExistingSchedule(map);
      setSelectedWorkingCount(workingCount);
      
      setSelectedWorkingDates({});
      
    } catch {
      setExistingSchedule({});
      setExistingScheduleData(null);
      setSelectedWorkingCount(0);
    }
  };

  useEffect(() => {
    if (selectedUsers.length === 1) {
      fetchUserSchedule(selectedUsers[0]);
    } else {
      setExistingSchedule({});
      setExistingScheduleData(null);
      setSelectedWorkingCount(0);
    }
  }, [selectedUsers, currentMonth]);

  // ================= HOLIDAY MAP =================
  const getHolidayColor = (type) => {
    switch (type?.toLowerCase()) {
      case "public":
        return "#ff4d4f";
      case "national":
        return "#ff7a45";
      case "religious":
        return "#ffa940";
      case "company":
        return "#52c41a";
      default:
        return "#ffc53d";
    }
  };

  const holidayMap = new Map();
  const holidayDetailsMap = new Map();

  holidays.forEach((h) => {
    let start = dayjs(h.from_date);
    const end = dayjs(h.to_date);

    while (start.isBefore(end) || start.isSame(end)) {
      const dateStr = start.format("YYYY-MM-DD");
      holidayMap.set(dateStr, h);
      holidayDetailsMap.set(dateStr, {
        name: h.holiday_name,
        type: h.holiday_type,
        color: getHolidayColor(h.holiday_type),
      });
      start = start.add(1, "day");
    }
  });

  // ================= SATURDAY PATTERN =================
  const getSaturdayStatus = (date) => {
    const firstDay = date.startOf("month");
    let firstSaturday = null;
    
    for (let i = 0; i < 7; i++) {
      const checkDate = firstDay.add(i, "day");
      if (checkDate.day() === 6) {
        firstSaturday = checkDate;
        break;
      }
    }
    
    if (!firstSaturday) return false;
    
    const diffDays = date.diff(firstSaturday, "day");
    if (diffDays < 0) return false;
    
    const saturdayIndex = Math.floor(diffDays / 7);
    return saturdayIndex % 2 === 0;
  };

  // ================= TOGGLE =================
  const toggleDate = (date) => {
    const formatted = date.format("YYYY-MM-DD");

    // Only allow clicking on current month dates
    if (date.month() !== currentMonth.month() || date.year() !== currentMonth.year()) {
      message.info("Please navigate to the month you want to edit");
      return;
    }

    const isHoliday = holidayMap.has(formatted);
    const isExisting = !!existingSchedule[formatted];
    const isCurrentlySelected = !!selectedWorkingDates[formatted];

    // Don't allow toggling if date is holiday
    if (isHoliday) {
      const holidayInfo = holidayDetailsMap.get(formatted);
      message.warning(`Cannot select holiday as working day: ${holidayInfo?.name || "Holiday"}`);
      return;
    }

    // If editing existing schedule, we need to track changes
    let currentWorkingCount = selectedWorkingCount;
    
    if (isExisting) {
      // Toggle existing schedule
      const existingItem = existingSchedule[formatted];
      if (existingItem.can_work) {
        // Remove from working days
        currentWorkingCount--;
      } else {
        // Add to working days
        if (currentWorkingCount >= maxWorkingDays) {
          message.error(`Maximum ${maxWorkingDays} working days allowed.`);
          return;
        }
        currentWorkingCount++;
      }
      
      // Update local state
      setExistingSchedule(prev => ({
        ...prev,
        [formatted]: {
          ...prev[formatted],
          can_work: !prev[formatted].can_work
        }
      }));
      setSelectedWorkingCount(currentWorkingCount);
      
    } else {
      // New selection (not in existing schedule)
      // Check working days limit when trying to add a new working day
      if (!isCurrentlySelected && selectedWorkingCount >= maxWorkingDays) {
        message.error(`Maximum ${maxWorkingDays} working days allowed. You have already selected ${selectedWorkingCount} working days.`);
        return;
      }

      setSelectedWorkingDates((prev) => {
        const updated = { ...prev };

        if (updated[formatted]) {
          delete updated[formatted];
          setSelectedWorkingCount(prev => prev - 1);
        } else {
          updated[formatted] = {
            work_date: formatted,
            can_work: true,
            is_holiday: isHoliday,
            status: "active",
          };
          setSelectedWorkingCount(prev => prev + 1);
        }

        return updated;
      });
    }
  };

  // ================= REMOVE SINGLE DATE =================
  const removeSelectedDate = (date) => {
    // Check if this date is in existing schedule
    if (existingSchedule[date]) {
      setExistingSchedule(prev => ({
        ...prev,
        [date]: {
          ...prev[date],
          can_work: false
        }
      }));
      setSelectedWorkingCount(prev => prev - 1);
    } else {
      setSelectedWorkingDates((prev) => {
        const updated = { ...prev };
        delete updated[date];
        return updated;
      });
      setSelectedWorkingCount(prev => prev - 1);
    }
  };

  // ================= SUBMIT FULL MONTH =================
  const handleSubmit = async () => {
    if (!selectedUsers.length)
      return message.warning("Select employees");

    const start = currentMonth.startOf("month");
    const days = currentMonth.daysInMonth();

    // Merge existing schedule with new selections
    const fullMonthSchedule = [];

    for (let i = 0; i < days; i++) {
      const date = start.add(i, "day");
      const formatted = date.format("YYYY-MM-DD");
      
      let canWork = false;
      
      if (selectedWorkingDates[formatted]) {
        canWork = true;
      } else if (existingSchedule[formatted]) {
        canWork = existingSchedule[formatted].can_work;
      }

      fullMonthSchedule.push({
        work_date: formatted,
        can_work: canWork,
        is_holiday: holidayMap.has(formatted),
        status: "active",
      });
    }

    try {
      setLoading(true);

      await api.post("/api/work-schedule/", {
        month_year: start.format("YYYY-MM-DD"),
        employees: selectedUsers.map((id) => ({
          user_id: id,
          schedules: fullMonthSchedule,
        })),
      });

      message.success("Schedule created/updated successfully");

      // Refresh the schedule
      await fetchUserSchedule(selectedUsers[0]);
      setSelectedWorkingDates({});
      
    } catch {
      message.error("Submit failed");
    } finally {
      setLoading(false);
    }
  };

  // ================= CALENDAR CELL =================
  const fullCellRender = (date) => {
    const formatted = date.format("YYYY-MM-DD");
    const isCurrentMonth = date.month() === currentMonth.month() && date.year() === currentMonth.year();

    const isSunday = date.day() === 0;
    const isSaturday = date.day() === 6;
    const saturdayWorking = getSaturdayStatus(date);

    const existing = existingSchedule[formatted];
    const selected = !!selectedWorkingDates[formatted];
    const isHoliday = holidayMap.has(formatted);
    const holidayInfo = holidayDetailsMap.get(formatted);

    // Determine if this date is a working day
    let isWorkingDay = false;
    if (selected) {
      isWorkingDay = true;
    } else if (existing) {
      isWorkingDay = existing.can_work === true;
    }

    // Disable if not current month
    const disabled = !isCurrentMonth;

    let bg = "#fff";
    let border = "1px solid #e8e8e8";

    // HOLIDAY (different colors based on holiday type)
    if (isHoliday) {
      bg = holidayInfo?.color || "#ffc53d";
      border = `2px solid ${holidayInfo?.color || "#ffc53d"}`;
    }
    // WORKING DAY (GREEN)
    else if (isWorkingDay && isCurrentMonth) {
      bg = "#52c41a";
      border = "1px solid #389e0d";
    }
    // SUNDAY - Light grey
    else if (isSunday && !isWorkingDay && isCurrentMonth) {
      bg = "#fafafa";
      border = "1px solid #e8e8e8";
    }
    // SATURDAY - Based on pattern
    else if (isSaturday && !isWorkingDay && isCurrentMonth) {
      if (saturdayWorking) {
        bg = "#fff";
        border = "1px solid #e8e8e8";
      } else {
        bg = "#fafafa";
        border = "1px solid #e8e8e8";
      }
    }
    // Non-current month styling
    else if (!isCurrentMonth) {
      bg = "#fafafa";
      border = "1px solid #f0f0f0";
    }

    // Check if date would exceed limit
    const wouldExceedLimit = !isWorkingDay && !isHoliday && selectedWorkingCount >= maxWorkingDays && isCurrentMonth;
    
    // Check if selectable
    let isSelectable = true;
    if (!isCurrentMonth) isSelectable = false;
    if (isHoliday) isSelectable = false;
    if (wouldExceedLimit) isSelectable = false;
    
    const isDisabled = !isSelectable;

    const cellContent = (
      <div
        onClick={() => isSelectable && toggleDate(date)}
        style={{
          height: 78,
          borderRadius: 8,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          cursor: isDisabled ? "not-allowed" : "pointer",
          opacity: !isCurrentMonth ? 0.4 : (wouldExceedLimit ? 0.6 : 1),
          background: bg,
          border,
          transition: "all 0.3s ease",
        }}
      >
        <div
          style={{
            fontWeight: 500,
            color: (isWorkingDay || isHoliday) ? "#fff" : "#1b1b1b",
            fontSize: 16,
          }}
        >
          {date.date()}
        </div>

        {isHoliday && holidayInfo && (
          <Tooltip title={`${holidayInfo.name} (${holidayInfo.type}) - Holiday`}>
            <div style={{ fontSize: 9, color: "#fff", textAlign: "center", padding: "0 4px" }}>
              {holidayInfo.name.length > 10 
                ? `${holidayInfo.name.substring(0, 8)}...` 
                : holidayInfo.name}
            </div>
          </Tooltip>
        )}

        {!isHoliday && isSaturday && !isWorkingDay && isCurrentMonth && (
          <div style={{ fontSize: 9, color: saturdayWorking ? "#52c41a" : "#999" }}>
            {saturdayWorking ? "" : "Off"}
          </div>
        )}

        {!isHoliday && isSunday && !isWorkingDay && isCurrentMonth && (
          <div style={{ fontSize: 9, color: "#999" }}>
            Off
          </div>
        )}

        {isWorkingDay && !isHoliday && (
          <div style={{ fontSize: 10, color: "#fff" }}>
            Work
          </div>
        )}

        {!isCurrentMonth && (
          <div style={{ fontSize: 8, color: "#999", marginTop: 2 }}>Locked</div>
        )}

        {wouldExceedLimit && (
          <Tooltip title={`Maximum ${maxWorkingDays} working days reached`}>
            <div style={{ fontSize: 8, color: "#ff4d4f", marginTop: 2 }}>🔒</div>
          </Tooltip>
        )}
      </div>
    );

    return cellContent;
  };

  // Get selected dates list in sorted order (for new selections only)
  const getSelectedDatesList = () => {
    return Object.keys(selectedWorkingDates).sort();
  };

  // Clear all selected dates (new selections only)
  const clearAllSelectedDates = () => {
    setSelectedWorkingDates({});
    // Reset working count to existing schedule count
    const existingWorkCount = Object.values(existingSchedule).filter(s => s.can_work === true).length;
    setSelectedWorkingCount(existingWorkCount);
  };

  // Calculate statistics
  const totalDaysInMonth = currentMonth.daysInMonth();
  const holidayCount = holidayMap.size;
  const leaveDays = totalDaysInMonth - selectedWorkingCount - holidayCount;
  const workingPercentage = (selectedWorkingCount / maxWorkingDays) * 100;

  // Get existing schedule info
  const existingWorkDays = existingScheduleData?.total_work_days || 0;
  const existingLeaveDays = existingScheduleData?.total_off_days || 0;

  return (
    <MainLayout>
      <Card>
        <Title level={4}>Work Schedule </Title>

        <Row gutter={16} style={{ marginBottom: 20 }}>
          <Col span={12}>
            <Select
              mode="multiple"
              placeholder="Select employees"
              style={{ width: "100%" }}
              value={selectedUsers}
              onChange={setSelectedUsers}
            >
              {users.map((u) => (
                <Option key={u.id} value={u.id}>
                  {u.first_name} {u.last_name}
                </Option>
              ))}
            </Select>
          </Col>
        
        </Row>

        {/* Selected Working Days Display (only for new selections) */}
        {Object.keys(selectedWorkingDates).length > 0 && (
          <Card 
            size="small" 
            style={{ 
              marginBottom: 20, 
              backgroundColor: "#f6ffed",
              borderColor: "#b7eb8f"
            }}
          >
            <Row justify="space-between" align="middle">
              <Col>
                <Space direction="vertical" size="small">
                  <Text strong style={{ color: "#52c41a" }}>
                    Modified Working Days ({Object.keys(selectedWorkingDates).length} changes):
                  </Text>
                  <Space wrap size="small">
                    {getSelectedDatesList().map((date) => (
                      <Tag
                        key={date}
                        closable
                        onClose={() => removeSelectedDate(date)}
                        color="success"
                        style={{ 
                          padding: "4px 8px",
                          fontSize: "13px",
                          marginBottom: "4px"
                        }}
                        closeIcon={<CloseOutlined style={{ fontSize: "10px" }} />}
                      >
                        {dayjs(date).format("dddd, MMM DD, YYYY")}
                      </Tag>
                    ))}
                  </Space>
                </Space>
              </Col>
              <Col>
                <Button 
                  size="small" 
                  onClick={clearAllSelectedDates}
                  danger
                >
                  Clear Changes
                </Button>
              </Col>
            </Row>
          </Card>
        )}

        <Calendar
          fullscreen
          value={currentMonth}
          onPanelChange={(val) => setCurrentMonth(val)}
          fullCellRender={fullCellRender}
        />

        <Button
          type="primary"
          block
          loading={loading}
          style={{ marginTop: 20 }}
          onClick={handleSubmit}
          size="large"
        >
          {existingScheduleData ? "Update Schedule" : "Submit Schedule"} 
        </Button>
      </Card>
    </MainLayout>
  );
};

export default WorkSchedulePage;