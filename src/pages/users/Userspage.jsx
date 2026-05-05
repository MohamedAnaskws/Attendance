import React, { useState, useEffect, useCallback } from "react";
import { Card, Typography, Button, Tag, message } from "antd";
import {
  ClockCircleOutlined,
  CoffeeOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

import MainLayout from "../../components/layout/MainLayout";

import {
  checkIn,
  checkOut,
  breakStart,
  breakEnd,
  getAttendance,
} from "../../services/crm/attendanceApi";

const { Title, Text } = Typography;

function UserDashboard() {
  const [status, setStatus] = useState("NOT_LOGGED_IN");
  const [loading, setLoading] = useState(false);

  const [workingTime, setWorkingTime] = useState(0);
  const [breakTime, setBreakTime] = useState(0);

  // ================= LOAD STATUS =================
  const loadStatus = useCallback(async () => {
    try {
      const res = await getAttendance();
      const data = res?.data || res;

      setStatus(data?.status || "NOT_LOGGED_IN");
    } catch {
      setStatus("NOT_LOGGED_IN");
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const i = setInterval(loadStatus, 20000);
    return () => clearInterval(i);
  }, [loadStatus]);

  // ================= TIMER =================
  useEffect(() => {
    let i;

    if (status === "WORKING" || status === "BREAK") {
      i = setInterval(() => {
        if (status === "WORKING") setWorkingTime((p) => p + 1);
        if (status === "BREAK") setBreakTime((p) => p + 1);
      }, 1000);
    }

    return () => clearInterval(i);
  }, [status]);

  // ================= ACTION =================
  const runAction = async (fn, msgText) => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fn();

      if (res?.success === false) {
        message.warning(res?.message || "Action failed");
        await loadStatus();
        return;
      }

      message.success(msgText);
      await loadStatus();
    } catch (err) {
      message.error(err?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  // ================= FORMAT =================
  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#f6f8fb] p-6">
        <Card
          className="shadow-sm"
          style={{
            borderRadius: 14,
            border: "1px solid #eef2f7",
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            {/* TITLE */}
            <div>
              <Title level={5} style={{ margin: 0, color: "#1f2937" }}>
                Dashboard
              </Title>
              <Text type="secondary">
                Track your daily working hours
              </Text>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap gap-3">

              {status === "NOT_LOGGED_IN" && (
                <Button
                  type="primary"
                  loading={loading}
                  onClick={() => runAction(checkIn, "Checked in")}
                  style={{
                    borderRadius: 10,
                    height: 42,
                    background: "#2563eb",
                  }}
                >
                  Check In
                </Button>
              )}

              {status === "WORKING" && (
                <>
                  <Button
                    loading={loading}
                    onClick={() => runAction(breakStart, "Break started")}
                    style={{
                      borderRadius: 10,
                      height: 42,
                      background: "#f59e0b",
                      color: "#fff",
                      border: "none",
                    }}
                  >
                    <CoffeeOutlined /> Break
                  </Button>

                  <Button
                    danger
                    loading={loading}
                    onClick={() => runAction(checkOut, "Checked out")}
                    style={{ borderRadius: 10, height: 42 }}
                  >
                    Check Out
                  </Button>
                </>
              )}

              {status === "BREAK" && (
                <>
                  <Button
                    type="primary"
                    loading={loading}
                    onClick={() => runAction(breakEnd, "Resumed")}
                    style={{ borderRadius: 10, height: 42 }}
                  >
                    Resume
                  </Button>

                  <Button
                    danger
                    loading={loading}
                    onClick={() => runAction(checkOut, "Checked out")}
                    style={{ borderRadius: 10, height: 42 }}
                  >
                    Check Out
                  </Button>
                </>
              )}

            </div>
          </div>
        </Card>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">

          {/* WORKING */}
          <Card
            className="shadow-sm hover:shadow-md transition"
            style={{
              borderRadius: 14,
              borderLeft: "4px solid #2563eb",
            }}
          >
            <div className="flex items-center gap-3">
              <ClockCircleOutlined style={{ fontSize: 22, color: "#2563eb" }} />
              <div>
                <Text type="secondary">Working Time</Text>
                <Title level={5} style={{ margin: 0 }}>
                  {formatTime(workingTime)}
                </Title>
              </div>
            </div>
          </Card>

          {/* BREAK */}
          <Card
            className="shadow-sm hover:shadow-md transition"
            style={{
              borderRadius: 14,
              borderLeft: "4px solid #f59e0b",
            }}
          >
            <div className="flex items-center gap-3">
              <CoffeeOutlined style={{ fontSize: 22, color: "#f59e0b" }} />
              <div>
                <Text type="secondary">Break Time</Text>
                <Title level={5} style={{ margin: 0 }}>
                  {formatTime(breakTime)}
                </Title>
              </div>
            </div>
          </Card>

          {/* STATUS */}
          <Card
            className="shadow-sm hover:shadow-md transition"
            style={{
              borderRadius: 14,
              borderLeft: "4px solid #10b981",
            }}
          >
            <div className="flex items-center gap-3">
              <CheckCircleOutlined style={{ fontSize: 22, color: "#10b981" }} />
              <div>
                <Text type="secondary">Status</Text>
                <div>
                  <Tag
                    color={
                      status === "WORKING"
                        ? "green"
                        : status === "BREAK"
                        ? "orange"
                        : "default"
                    }
                    style={{
                      borderRadius: 20,
                      padding: "2px 10px",
                      fontWeight: 500,
                    }}
                  >
                    {status}
                  </Tag>
                </div>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </MainLayout>
  );
}

export default UserDashboard;