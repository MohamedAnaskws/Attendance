import React, { useEffect, useState, useCallback } from "react";
import {
  Table, Card, Typography, Row, Col, Avatar, DatePicker, message, Tag,
  Statistic, Modal, Tooltip, Space, Button, Spin
} from "antd";
import {
  UserOutlined, CoffeeOutlined, LoginOutlined, LogoutOutlined,
  ClockCircleOutlined, CalendarOutlined, EyeOutlined,
  CloseCircleOutlined, CheckCircleOutlined
} from "@ant-design/icons";
import { BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import axios from "axios";
import dayjs from "dayjs";
import MainLayout from "../../components/layout/MainLayout";
import { getToken } from "../../utils/auth";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function AttendancePage() {
  const BASE = import.meta.env.VITE_API_URL;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [dateRange, setDateRange] = useState([dayjs().startOf("week"), dayjs().endOf("week")]);

  const formatTime = (dt) => dt ? dayjs(dt).format("HH:mm") : "--:--";
  const formatDateTime = (dt) => dt ? dayjs(dt).format("MMM DD, HH:mm") : "--:--";

  const fetchAttendanceLogs = useCallback(async (userId, fromDate, toDate) => {
    if (!userId || !fromDate || !toDate) return;
    try {
      setLogsLoading(true);
      const token = getToken();
      const response = await axios.get(`${BASE}/api/attendance/attendance-logs-each-day`, {
        params: { user_id: userId, from_date: fromDate, to_date: toDate, include_events: true },
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setAttendanceLogs(response.data.data?.data || []);
      } else {
        setAttendanceLogs([]);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load attendance logs");
      setAttendanceLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, [BASE]);

  const fetchAttendance = useCallback(async (date) => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await axios.get(`${BASE}/api/attendance/report/${dayjs(date).format("YYYY-MM-DD")}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const attendances = response.data?.data?.attendances || [];
      const formatted = attendances.map((item) => ({
        id: item.user_id,
        user_id: item.user_id,
        name: item.user_name,
        email: item.user_email,
        work: ((item.total_work_minutes || 0) / 60).toFixed(1),
        break: ((item.total_break_minutes || 0) / 60).toFixed(1),
        status: item.total_work_minutes > 0 ? "Present" : "Absent",
        workPercent: Math.min(100, ((item.total_work_minutes || 0) / 600) * 100),
        firstCheckIn: item.sessions?.[0]?.check_in,
        lastCheckOut: item.sessions?.[item.sessions.length - 1]?.check_out,
        totalBreakMinutes: item.total_break_minutes || 0,
        sessions: item.sessions || []
      }));
      setData(formatted);
    } catch (err) {
      console.error(err);
      message.error("Failed to load attendance data");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [BASE]);

  useEffect(() => {
    if (selectedDate) fetchAttendance(selectedDate);
  }, [fetchAttendance, selectedDate]);

  const handleEmployeeClick = (record) => {
    setSelectedEmployee(record);
    fetchAttendanceLogs(record.user_id, dateRange[0].format("YYYY-MM-DD"), dateRange[1].format("YYYY-MM-DD"));
    setModalVisible(true);
  };

  const total = data.length;
  const present = data.filter((d) => d.status === "Present").length;
  const chartData = data.map((u) => ({ name: u.name.slice(0, 8), work: parseFloat(u.work), break: parseFloat(u.break) }));

  const getStatusInfo = (status) => {
    const map = { 
      P: { color: "#10b981", icon: <CheckCircleOutlined />, label: "Present" }, 
      MP: { color: "#8b5cf6", icon: <CheckCircleOutlined />, label: "Manual Present" },
      A: { color: "#ef4444", icon: <CloseCircleOutlined />, label: "Absent" } 
    };
    return map[status] || { color: "#6b7280", icon: <UserOutlined />, label: status || "Unknown" };
  };

  const WorkProgress = ({ work, break: breakTime, workPercent, checkIn, checkOut, breakMinutes }) => (
    <Tooltip title={
      <div>
        <div>Check In: <strong>{formatTime(checkIn)}</strong></div>
        <div>Check Out: <strong>{formatTime(checkOut)}</strong></div>
        <div>Break: {breakMinutes} min ({breakTime}h)</div>
        <div>Work: {work}h / 10h</div>
      </div>
    }>
      <div className="cursor-pointer">
        <div className="flex justify-between text-xs mb-1">
          <span><LoginOutlined /> {formatTime(checkIn)}</span>
          <span><LogoutOutlined /> {formatTime(checkOut)}</span>
          <span>Work: {work}h</span>
        </div>
        <div className="h-5 bg-gray-200 rounded-md overflow-hidden">
          <div className="h-full bg-emerald-500 flex items-center justify-center text-white text-xs" style={{ width: `${Math.min(100, workPercent)}%` }}>
            {workPercent >= 20 && `${Math.round(workPercent)}%`}
          </div>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-emerald-600">Work: {work}h</span>
          <span className="text-amber-600">Break: {breakTime}h ({breakMinutes}m)</span>
        </div>
      </div>
    </Tooltip>
  );

  const columns = [
    { title: "Employee", width: 200, fixed: "left", render: (_, r) => (
      <div className="flex items-center gap-2">
        <Avatar icon={<UserOutlined />} style={{ backgroundColor: r.status === "Present" ? "#10b981" : "#f43f5e" }} />
        <div><div className="font-semibold">{r.name}</div><div className="text-xs text-gray-400">{r.email}</div></div>
      </div>
    )},
    { title: "Work Hours", align: "center", width: 100, sorter: (a, b) => parseFloat(a.work) - parseFloat(b.work), render: (_, r) => (
      <div><span className="font-bold text-emerald-600 text-base">{r.work}</span><span className="text-gray-500 text-xs"> / 10h</span></div>
    )},
    { title: "Break", align: "center", width: 100, render: (_, r) => <div><span className="text-amber-600 font-bold">{r.break}h</span><div className="text-xs">({r.totalBreakMinutes}m)</div></div> },
    { title: "Progress", width: 300, render: (_, r) => <WorkProgress work={r.work} break={r.break} workPercent={r.workPercent} checkIn={r.firstCheckIn} checkOut={r.lastCheckOut} breakMinutes={r.totalBreakMinutes} /> },
    { title: "Action", align: "center", width: 80, fixed: "right", render: (_, r) => <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleEmployeeClick(r)}>More Report</Button> }
  ];

  return (
    <MainLayout>
      <div className="p-4" style={{ background: "#f0f2f5", minHeight: "100vh" }}>
        <div className="flex justify-between items-center mb-4">
          <div><Title level={4} className="m-0">Attendance Overview</Title><Text type="secondary">Target: 10h/day</Text></div>
          <DatePicker value={selectedDate} onChange={setSelectedDate} format="YYYY-MM-DD" />
        </div>

        <Row gutter={12} className="mb-4">
          <Col xs={24} sm={12} lg={3}><Card size="small" className="h-full"><Statistic title="Total Employees" value={total} prefix={<UserOutlined />} /></Card></Col>
          <Col xs={24} sm={12} lg={3}><Card size="small" className="h-full"><Statistic title="Present Today" value={present} suffix={`/${total}`} valueStyle={{ color: "#10b981" }} /></Card></Col>
          <Col xs={24} lg={18}>
            <Card size="small" title="Work Hours Breakdown" bodyStyle={{ padding: 8 }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={45} tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                  <ReTooltip /><Legend />
                  <Bar dataKey="work" fill="#10b981" name="Work" radius={[4, 4, 0, 0]} barSize={10} />
                  <Bar dataKey="break" fill="#f59e0b" name="Break" radius={[4, 4, 0, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        <Card size="small" title="Employee Details">
          <Table loading={loading} dataSource={data} columns={columns} rowKey="id" size="small" pagination={{ pageSize: 10 }} scroll={{ x: 900 }} />
        </Card>

        <Modal title={`Attendance Details: ${selectedEmployee?.name}`} open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={750} centered>
          <div className="mb-3">
            <Text strong>Date Range: </Text>
            <RangePicker value={dateRange} onChange={(dates) => {
              if (dates && selectedEmployee) {
                setDateRange(dates);
                fetchAttendanceLogs(selectedEmployee.user_id, dates[0].format("YYYY-MM-DD"), dates[1].format("YYYY-MM-DD"));
              }
            }} size="small" />
          </div>
          {logsLoading ? <Spin className="flex justify-center py-8" /> : attendanceLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No records found</div>
          ) : (
            <div className="space-y-3 max-h-[550px] overflow-y-auto">
              {attendanceLogs.map((log, idx) => {
                const statusInfo = getStatusInfo(log.summary?.status);
                const sessions = log.sessions || [];
                const hasMultipleSessions = sessions.length > 1;
                
                return (
                  <Card key={idx} size="small" className="border-l-4" style={{ borderLeftColor: statusInfo.color }}>
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <Tag color="blue"><CalendarOutlined /> {log.date} ({log.day_name})</Tag>
                        <Tag color={statusInfo.color} icon={statusInfo.icon}>{statusInfo.label}</Tag>
                        {hasMultipleSessions && (
                          <Tag color="purple">{sessions.length} Sessions</Tag>
                        )}
                        {log.summary?.overtime_hours > 0 && (
                          <Tag color="orange">Overtime: +{log.summary.overtime_hours}h</Tag>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-600 text-lg">{(log.summary?.total_worked_hours || 0).toFixed(2)}h</div>
                        <div className="text-xs text-gray-400">Worked</div>
                      </div>
                    </div>

                    {/* Multiple Sessions Display */}
                    <div className="space-y-3">
                      {sessions.map((session, sIdx) => {
                        const sessionDate = dayjs(session.check_in).format("MMM DD");
                        const isNextDay = dayjs(session.check_in).format("YYYY-MM-DD") !== log.date;
                        
                        return (
                          <div key={sIdx} className={`border rounded-md p-3 ${hasMultipleSessions ? 'bg-gray-50' : ''}`}>
                            {/* Session Header */}
                            <div className="flex justify-between items-center mb-2 pb-2 border-b">
                              <Space>
                                <ClockCircleOutlined className="text-blue-500" />
                                <Text strong>Session {session.session_number || sIdx + 1}</Text>
                                {isNextDay && (
                                  <Tag color="cyan" icon={<CalendarOutlined />}>
                                    {sessionDate}
                                  </Tag>
                                )}
                              </Space>
                              <Tag color="blue">
                                Duration: {Math.floor(session.duration?.total_minutes / 60)}h {session.duration?.total_minutes % 60}m
                              </Tag>
                            </div>

                            {/* Check In/Out Times */}
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div className="bg-green-50 p-2 rounded text-center">
                                <LoginOutlined className="text-emerald-500 text-lg" />
                                <div className="font-bold text-lg">{formatTime(session.check_in)}</div>
                                <div className="text-xs text-gray-500">Check In</div>
                                {isNextDay && <div className="text-xs text-blue-500">{sessionDate}</div>}
                              </div>
                              <div className="bg-red-50 p-2 rounded text-center">
                                <LogoutOutlined className="text-rose-500 text-lg" />
                                <div className="font-bold text-lg">{formatTime(session.check_out)}</div>
                                <div className="text-xs text-gray-500">Check Out</div>
                              </div>
                            </div>

                            {/* Break Periods */}
                            {session.break_periods?.length > 0 && (
                              <div className="mt-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <CoffeeOutlined className="text-amber-500" />
                                  <Text strong className="text-xs">Breaks ({session.break_periods.length})</Text>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {session.break_periods.map((bp, i) => (
                                    <Tag key={i} color="orange" className="text-xs">
                                      {formatTime(bp.start_time)} → {formatTime(bp.end_time)} ({bp.duration_minutes}m)
                                    </Tag>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Worked Hours Detail */}
                            <div className="mt-2 text-xs text-gray-500">
                              Worked: {session.duration?.worked_hours}h | Break: {session.duration?.break_hours}h
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Summary Footer */}
                    <div className="mt-3 pt-2 border-t flex flex-wrap gap-1">
                      {log.summary?.is_holiday && <Tag color="gold">🏖️ Holiday</Tag>}
                      {log.summary?.has_paid_leave && <Tag color="green">✅ Paid Leave</Tag>}
                      {log.summary?.has_unpaid_leave && <Tag color="orange">⚠️ Unpaid Leave</Tag>}
                      {log.summary?.total_sessions > 1 && (
                        <Tag color="purple">Total Sessions: {log.summary.total_sessions}</Tag>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Modal>
      </div>
    </MainLayout>
  );
}