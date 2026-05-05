import React, { useEffect, useMemo, useState, useCallback } from "react";
import MainLayout from "../../components/layout/MainLayout";
import dayjs from "dayjs";
import { DatePicker, Spin, Tooltip } from "antd";
import { getToken } from "../../utils/auth";
import {
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
  RocketOutlined,
  GiftOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

// ================= HELPERS =================
const getDaysInMonth = (year, month) =>
  new Date(year, month + 1, 0).getDate();

const getDayName = (year, month, day) =>
  new Date(year, month, day).toLocaleDateString("en-US", {
    weekday: "short",
  });

// ================= STATUS STYLES =================
const getStatusStyle = (status) => {
  switch (status) {
    case "P":
      return "bg-green-100 text-green-700 border-green-300";
    case "A":
      return "bg-red-100 text-red-700 border-red-300";
    case "H":
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    case "V":
      return "bg-blue-100 text-blue-700 border-blue-300";
    case "MP":
      return "bg-purple-100 text-purple-700 border-purple-300";
    default:
      return "bg-gray-50 text-gray-400 border-gray-200";
  }
};


const getStatusLabel = (status) => {
  switch (status) {
    case "P":
      return "Present";
    case "A":
      return "Absent";
    case "H":
      return "Holiday";
    case "V":
      return "Vacation";
    case "MP":
      return "Memo Present";
    default:
      return status;
  }
};

export default function AdminCalendar() {
  const [date, setDate] = useState(dayjs());
  const [users, setUsers] = useState([]);
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);

  const year = date.year();
  const month = date.month();
  const daysInMonth = getDaysInMonth(year, month);

  const days = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth]
  );

  // ================= FETCH USERS =================
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      const data = await res.json();
      setUsers(data || []);
    } catch {
      setUsers([]);
    }
  }, []);

  // ================= FETCH REPORT =================
  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/salary/monthly-report?year=${year}&month=${month + 1}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      const data = await res.json();
      setReport(data?.data || []);
    } catch {
      setReport([]);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchUsers();
    fetchReport();
  }, [fetchUsers, fetchReport]);

  const getUserName = (id) => {
    const user = users.find((u) => u.id === id);
    return user ? `${user.first_name} ${user.last_name}` : `User ${id}`;
  };


  return (
    <MainLayout>
      <div className="p-6 bg-gray-50 min-h-screen">

        {/* HEADER */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            
            Calendar
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {date.format("MMMM YYYY")} - Monthly employee attendance overview
            </p>
          </div>

          <DatePicker
            picker="month"
            value={date}
            onChange={(val) => val && setDate(val)}
            disabledDate={(current) => current && current > dayjs().endOf("month")}
            format="MMMM YYYY"
          />
        </div>

   
        {/* LEGEND */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 mb-6 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircleOutlined className="text-green-600" />
            <span><strong>P</strong> = Present</span>
          </div>
          <div className="flex items-center gap-2">
            <CloseCircleOutlined className="text-red-600" />
            <span><strong>A</strong> = Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <RocketOutlined className="text-blue-600" />
            <span><strong>V</strong> = Vacation</span>
          </div>
          <div className="flex items-center gap-2">
            <GiftOutlined className="text-yellow-600" />
            <span><strong>H</strong> = Holiday </span>
          </div>
          <div className="flex items-center gap-2">
            <FileTextOutlined className="text-purple-600" />
            <span><strong>MP</strong> = Memo Present (Partial day with hours)</span>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-20 text-center">
              <Spin size="large" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                {/* HEADER */}
                <thead className="bg-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="sticky left-0 bg-gray-100 px-6 py-3 text-left font-semibold text-gray-700 border-r border-gray-200 min-w-[220px]">
                      <UserOutlined className="mr-2" /> Employee
                    </th>
                    {days.map((day) => (
                      <th key={day} className="px-2 py-3 text-center min-w-[65px]">
                        <div className="font-semibold text-gray-700">{day}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {getDayName(year, month, day)}
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center font-semibold text-gray-700 min-w-[80px]">
                      <CloseCircleOutlined className="mr-1" /> Absent Days
                    </th>
                  </tr>
                </thead>

                {/* BODY */}
                <tbody>
                  {report.length === 0 ? (
                    <tr>
                      <td colSpan={days.length + 2} className="text-center py-12 text-gray-400">
                        No attendance data available
                      </td>
                    </tr>
                  ) : (
                    report.map((emp, idx) => {
                      let absentCount = 0;

                      return (
                        <tr key={emp.employee_id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          {/* USER CELL */}
                          <td className="sticky left-0 bg-inherit px-6 py-2 font-medium text-gray-800 border-r border-gray-100 min-w-[220px]">
                            {getUserName(emp.employee_id)}
                          </td>

                          {/* ATTENDANCE CELLS */}
                          {days.map((day) => {
                            const d = emp.attendance_daily?.[day];
                            const status = d?.status || "-";
                            const workedHours = d?.worked_hours;

                            if (status === "A") absentCount++;

                            return (
                              <td key={day} className="px-1 py-2 text-center">
                                {status !== "-" ? (
                                  <Tooltip title={`${getStatusLabel(status)}${status === 'MP' ? ` - ${workedHours} hours worked` : ''}`}>
                                    <div className={`inline-flex items-center justify-center min-w-[50px] px-2 py-1 rounded-md text-xs font-semibold border ${getStatusStyle(status)} cursor-help transition-all hover:scale-105`}>
                                      {status === "MP" ? (
                                        <div className="flex flex-col items-center">
                                          <span>{status}</span>
                                          <span className="text-[9px]">{workedHours}h</span>
                                        </div>
                                      ) : (
                                        <span>{status}</span>
                                      )}
                                    </div>
                                  </Tooltip>
                                ) : (
                                  <span className="text-gray-300">—</span>
                                )}
                              </td>
                            );
                          })}

                          {/* ABSENT COUNT */}
                          <td className="text-center font-bold">
                            {absentCount > 0 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600 text-sm">
                                {absentCount}
                              </span>
                            ) : (
                              <span className="text-gray-400">0</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}