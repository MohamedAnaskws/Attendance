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
} from "antd";
import MainLayout from "../../components/layout/MainLayout";
import { getToken, getUser } from "../../utils/auth";
import dayjs from "dayjs";

const { TextArea } = Input;

// ================= STEP MAPPING =================
const getStepName = (step) => {
  switch (step) {
    case 1:
      return "Department Manager";
    case 2:
      return "Manager";
    case 3:
      return "Owner";
    default:
      return "Unknown";
  }
};

const UserCalendar = () => {
  const [leaves, setLeaves] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [workSchedule, setWorkSchedule] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(dayjs());

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
    }),
    [token]
  );

  // ================= FETCH WORK SCHEDULE =================
  const fetchWorkSchedule = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // Format: YYYY-MM-01 (first day of month)
      const monthYear = currentMonth.format("YYYY-MM-01");
      
      // Try multiple possible endpoint patterns
      const endpoints = [
        `${BASE}/api/work-schedule/user/${user.id}?month_year=${monthYear}`,
        `${BASE}/api/work-schedule/${user.id}?month_year=${monthYear}`,
        `${BASE}/api/work-schedule?user_id=${user.id}&month_year=${monthYear}`,
        `${BASE}/api/user-work-schedule/${user.id}?month_year=${monthYear}`,
      ];
      
      let scheduleData = null;
      
      // Try each endpoint until one works
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
        // No schedule found - create mock data for demonstration
        console.log("No work schedule found for this month");
        setWorkSchedule(null);
      }
    } catch (error) {
      console.error("Failed to fetch work schedule:", error);
      setWorkSchedule(null);
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
      // Alternative data structure
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

    // Check if it's a holiday from work schedule
    if (schedule?.isHoliday) {
      message.warning("Cannot apply leave on a holiday");
      return;
    }

    // Check if it's a non-work day
    if (schedule?.canWork === false) {
      message.warning("Cannot apply leave on a non-work day");
      return;
    }

    // Check if it's a holiday from holidays list
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
    if (status === "APPROVED") return { color: "green", text: "Approved" };
    if (status === "REJECTED") return { color: "red", text: "Rejected" };
    return { color: "orange", text: "Pending" };
  };

  // ================= CHECK IF DATE IS WORKING DAY =================
  const isWorkingDay = (dateStr) => {
    const schedule = workScheduleMap.get(dateStr);
    if (schedule) {
      return schedule.canWork === true && !schedule.isHoliday;
    }
    // If no schedule, assume working day
    return true;
  };

  // ================= CALENDAR DATE CELL RENDER =================
  const dateCellRender = (value) => {
    const dateStr = value.format("YYYY-MM-DD");

    const list = leaves.filter(
      (l) =>
        l.leave_date === dateStr ||
        l.from_date === dateStr
    );

    const holiday = holidayMap.get(dateStr);
    const schedule = workScheduleMap.get(dateStr);

    // Check if it's a holiday from work schedule
    const isWorkScheduleHoliday = schedule?.isHoliday === true;
    const canWork = schedule?.canWork;

    return (
      <ul className="events" style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {/* WORK SCHEDULE STATUS */}
        {schedule && (
          <>
            {isWorkScheduleHoliday && (
              <li>
                <Tag color="purple" style={{ fontSize: 10, marginBottom: 2 }}>
                  📅 Holiday
                </Tag>
              </li>
            )}
            {canWork === false && !isWorkScheduleHoliday && (
              <li>
                <Tag color="orange" style={{ fontSize: 10, marginBottom: 2 }}>
                  🚫 Off Day
                </Tag>
              </li>
            )}
            {canWork === true && !isWorkScheduleHoliday && (
              <li>
                <Tag color="blue" style={{ fontSize: 10, marginBottom: 2 }}>
                  ✅ Work Day
                </Tag>
              </li>
            )}
          </>
        )}

        {/* REGULAR HOLIDAY */}
        {holiday && !isWorkScheduleHoliday && (
          <li>
            <Tag color="red" style={{ fontSize: 10, marginBottom: 2 }}>
              🎉 {holiday.holiday_name}
            </Tag>
          </li>
        )}

        {/* LEAVES */}
        {list.map((leave) => {
          const status = getStatus(leave.status);

          return (
            <li key={leave.id}>
              <Tag
                color={status.color}
                style={{
                  display: "block",
                  marginBottom: 2,
                  fontSize: 11,
                  cursor: "pointer",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedLeave(leave);
                  setViewModalOpen(true);
                }}
              >
                <div>
                  <strong>{leave.leave_category}</strong>
                  <br />
                  <span style={{ fontSize: 10 }}>
                    {status.text} - {getStepName(leave.current_step)}
                  </span>
                </div>
              </Tag>
            </li>
          );
        })}
      </ul>
    );
  };

  // ================= MONTH CHANGE HANDLER =================
  const onMonthChange = (value) => {
    setCurrentMonth(value);
  };

  // ================= WORK SCHEDULE SUMMARY =================
  const renderWorkScheduleSummary = () => {
    if (!workSchedule) {
      return (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ textAlign: "center", color: "#999" }}>
            No work schedule assigned for {currentMonth.format("MMMM YYYY")}
          </div>
        </Card>
      );
    }

    return (
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <strong>Work Schedule Summary - {currentMonth.format("MMMM YYYY")}</strong>
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {workSchedule.total_work_days !== undefined && (
              <Tag color="blue">✅ Work Days: {workSchedule.total_work_days}</Tag>
            )}
            {workSchedule.total_off_days !== undefined && (
              <Tag color="orange">🚫 Off Days: {workSchedule.total_off_days}</Tag>
            )}
            {workSchedule.total_holidays !== undefined && (
              <Tag color="purple">🎉 Holidays: {workSchedule.total_holidays}</Tag>
            )}
          </div>
        </div>
        {workSchedule.assigned_by_name && (
          <div style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
            Assigned by: {workSchedule.assigned_by_name}
          </div>
        )}
      </Card>
    );
  };

  return (
    <MainLayout>
      <div style={{ padding: 20 }}>
        {renderWorkScheduleSummary()}
        
        <Card>
          <Calendar
            onSelect={onSelect}
            dateCellRender={dateCellRender}
            onPanelChange={onMonthChange}
          />
        </Card>

        {/* APPLY MODAL */}
        <Modal
          title="Apply Leave"
          open={open}
          onOk={handleApply}
          onCancel={() => setOpen(false)}
        >
          <Select
            placeholder="Leave Type"
            style={{ width: "100%", marginBottom: 10 }}
            onChange={setLeaveType}
          >
            <Select.Option value="General">General</Select.Option>
            <Select.Option value="Sick">Sick</Select.Option>
            <Select.Option value="Casual">Casual</Select.Option>
          </Select>

          <TextArea
            placeholder="Reason"
            rows={4}
            onChange={(e) => setReason(e.target.value)}
          />
        </Modal>

        {/* VIEW MODAL */}
        <Modal
          title="Leave Details"
          open={viewModalOpen}
          onCancel={() => setViewModalOpen(false)}
          footer={[
            <Button onClick={() => setViewModalOpen(false)}>
              Close
            </Button>,
          ]}
        >
          {selectedLeave && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <strong>Date:</strong> {selectedLeave.leave_date || selectedLeave.from_date}
              </div>
              <div>
                <strong>Type:</strong> {selectedLeave.leave_category}
              </div>
              <div>
                <strong>Reason:</strong> {selectedLeave.reason || "No reason provided"}
              </div>
              <div>
                <strong>Current Step:</strong> {getStepName(selectedLeave.current_step)}
              </div>
              <div>
                <strong>Status:</strong>{" "}
                <Badge
                  status={getStatus(selectedLeave.status).color}
                  text={getStatus(selectedLeave.status).text}
                />
              </div>
            </div>
          )}
        </Modal>
      </div>
    </MainLayout>
  );
};

export default UserCalendar;