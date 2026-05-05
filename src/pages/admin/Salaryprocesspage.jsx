import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  DatePicker,
  Table,
  Typography,
  Spin,
  Row,
  Tag,
  Button,
  message,
} from "antd";
import dayjs from "dayjs";
import MainLayout from "../../components/layout/MainLayout";
import { getToken } from "../../utils/auth";

const { Title, Text } = Typography;

function SalaryProcessPage() {
  const [date, setDate] = useState(dayjs().startOf("month"));
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState([]);

  const BASE = import.meta.env.VITE_API_URL;

  // ================= LOAD REPORT =================
  const loadSalaryReport = useCallback(async () => {
    try {
      setLoading(true);

      const month = String(date.month() + 1).padStart(2, "0");
      const year = date.year();

      const res = await fetch(
        `${BASE}/api/salary/salary-report/${year}/${month}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${getToken()}`,
            Accept: "application/json",
          },
        }
      );

      const data = await res.json();

      console.log("SALARY API RESPONSE:", data); // 👈 IMPORTANT DEBUG

      if (!res.ok) {
        throw new Error(
          data?.message ||
          data?.detail ||
          "Failed to load salary report"
        );
      }

      setDataSource(data?.employees || []);
    } catch (err) {
      console.error("LOAD ERROR:", err);

      message.error(err.message || "Failed to load salary report");

      setDataSource([]);
    } finally {
      setLoading(false);
    }
  }, [date, BASE]);

  // ================= PROCESS SALARY =================
  const processSalary = async () => {
    try {
      setLoading(true);

      const month = String(date.month() + 1).padStart(2, "0");
      const year = date.year();

      const res = await fetch(
        `${BASE}/api/salary/process-monthly?year=${year}&month=${month}&force_regenerate=false`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getToken()}`,
            Accept: "application/json",
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.message ||
          data?.detail ||
          "Salary processing failed"
        );
      }

      message.success("Salary processed successfully");

      await loadSalaryReport();
    } catch (err) {
      console.error("PROCESS ERROR:", err);
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= EFFECT =================
  useEffect(() => {
    loadSalaryReport();
  }, [loadSalaryReport]);

  // ================= FLATTEN DATA =================
  const flattenData = (dataSource || []).map((item) => ({
    key: item.employee_id,
    employee_name: item.employee_name,
    monthly_salary: item.monthly_salary,

    present_days: item.summary?.present_days,
    memo_present_days: item.summary?.memo_present_days,
    half_present_days: item.summary?.half_present_days,
    absent_days: item.summary?.absent_days,

    paid_leave_days: item.summary?.paid_leave_days,
    unpaid_leave_days: item.summary?.unpaid_leave_days,

    total_worked_hours: item.summary?.total_worked_hours,
    total_overtime_hours: item.summary?.total_overtime_hours,

    overtime_pay: item.summary?.overtime_pay,
    unpaid_deduction: item.summary?.unpaid_deduction,

    base_salary: item.summary?.base_salary,
    daily_rate: item.summary?.daily_rate,

    holiday_days: item.summary?.holiday_days,
    holiday_worked_days: item.summary?.holiday_worked_days,
    holiday_extra_pay: item.summary?.holiday_extra_pay,

    final_salary: item.summary?.final_salary,
    total_days_in_month: item.total_days_in_month,
  }));

  // ================= TABLE =================
  const columns = [
    { title: "Employee", dataIndex: "employee_name", width: 180 },
    {
      title: "Salary",
      dataIndex: "monthly_salary",
      render: (v) => <Tag color="blue">PKR {v}</Tag>,
    },
    { title: "Present", dataIndex: "present_days" },
    { title: "Memo", dataIndex: "memo_present_days" },
    { title: "Half", dataIndex: "half_present_days" },
    { title: "Absent", dataIndex: "absent_days" },
    { title: "Paid Leave", dataIndex: "paid_leave_days" },
    { title: "Unpaid Leave", dataIndex: "unpaid_leave_days" },
    { title: "Total Hours", dataIndex: "total_worked_hours" },
    { title: "OT Hours", dataIndex: "total_overtime_hours" },
    {
      title: "OT Pay",
      dataIndex: "overtime_pay",
      render: (v) => <Tag color="green">PKR {v}</Tag>,
    },
    {
      title: "Deduction",
      dataIndex: "unpaid_deduction",
      render: (v) => <Tag color="red">PKR {v}</Tag>,
    },
    { title: "Base", dataIndex: "base_salary" },
    { title: "Daily Rate", dataIndex: "daily_rate" },
    { title: "Holiday", dataIndex: "holiday_days" },
    { title: "Worked Holiday", dataIndex: "holiday_worked_days" },
    { title: "Holiday Pay", dataIndex: "holiday_extra_pay" },
    { title: "Days", dataIndex: "total_days_in_month" },
    {
      title: "Final Salary",
      dataIndex: "final_salary",
      render: (v) => (
        <Tag color="purple">PKR {v}</Tag>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="p-6 bg-gray-50 min-h-screen">

        {/* HEADER */}
        <Card style={{ borderRadius: 14, marginBottom: 20 }}>
          <Row justify="space-between" align="middle">
            <div>
              <Title level={3} style={{ margin: 0 }}>
                Salary Report
              </Title>
              <Text type="secondary">
                Monthly employee salary breakdown
              </Text>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <DatePicker
                picker="month"
                value={date}
                onChange={(val) => val && setDate(val)}
              />

              <Button
                type="primary"
                loading={loading}
                onClick={processSalary}
              >
                Process Salary
              </Button>
            </div>
          </Row>
        </Card>

        {/* TABLE */}
        <Card style={{ borderRadius: 14 }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <Spin size="large" />
            </div>
          ) : (
            <Table
              dataSource={flattenData}
              columns={columns}
              scroll={{ x: 2500 }}
              pagination={{ pageSize: 10 }}
            />
          )}
        </Card>

      </div>
    </MainLayout>
  );
}

export default SalaryProcessPage;