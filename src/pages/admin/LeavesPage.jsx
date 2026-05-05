import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Table, Tag, Card, Tabs, Button, Select, Input, message } from "antd";
import axios from "axios";
import MainLayout from "../../components/layout/MainLayout";
import { getToken, getUser } from "../../utils/auth";
import dayjs from "dayjs";

const { Option } = Select;

const CombinedApprovalsPage = () => {
  const BASE = import.meta.env.VITE_API_URL;

  const currentUser = getUser();
  const roleId = currentUser?.roleid;

  const roleStepMap = {
    1: 3,
    2: 2,
    3: 1,
  };

  const allowedStep = roleStepMap[roleId];

  const [pending, setPending] = useState([]);
  const [processing, setProcessing] = useState([]);
  const [approved, setApproved] = useState([]);
  const [rejected, setRejected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updates, setUpdates] = useState({});

  // ✅ NEW: users state
  const [users, setUsers] = useState([]);

  // ================= API =================
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: BASE,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true", // ✅ ADD HERE
      },
    });

    instance.interceptors.request.use((config) => {
      const token = getToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // ✅ ensure it always exists even if overwritten
      config.headers["ngrok-skip-browser-warning"] = "true";

      return config;
    });

    return instance;
  }, [BASE]);
  // ================= FETCH USERS =================
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
  }, [api]);

  // ✅ CREATE USER MAP (id → user)
  const userMap = useMemo(() => {
    const map = {};
    users.forEach((u) => {
      map[u.id] = u;
    });
    return map;
  }, [users]);

  // ================= HELPERS =================
  const getStepName = (step) => {
    if (step === 3) return "Owner";
    if (step === 2) return "Manager";
    if (step === 1) return "Department Manager";
    return "Unknown";
  };

  const statusTag = (s) => {
    if (s === "APPROVED") return <Tag color="green">APPROVED</Tag>;
    if (s === "REJECTED") return <Tag color="red">REJECTED</Tag>;
    if (s === "PROCESSING") return <Tag color="blue">PROCESSING</Tag>;
    return <Tag color="orange">PENDING</Tag>;
  };

  const getEmployeeName = (record) => {
    const emp = record?.employee;
    if (!emp) return "Unknown";
    return `${emp.first_name || ""} ${emp.last_name || ""}`.trim();
  };

  // ================= FETCH LEAVES =================
  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const [p, a, r] = await Promise.all([
        api.get("/api/leaves/status/PENDING"),
        api.get("/api/leaves/status/APPROVED"),
        api.get("/api/leaves/status/REJECTED"),
      ]);

      const pendingData = p.data?.data || [];
      const approvedData = a.data?.data || [];
      const rejectedData = r.data?.data || [];

      const filteredPending = pendingData.filter(
        (item) => Number(item.current_step) === Number(allowedStep),
      );

      setPending(filteredPending);
      setProcessing(pendingData);
      setApproved(approvedData);
      setRejected(rejectedData);
    } catch (err) {
      console.error(err);
      message.error("Approvals load failed");
    } finally {
      setLoading(false);
    }
  }, [api, allowedStep]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ================= COLUMNS =================
  const columns = (isAction) => [
    {
      title: "Employee",
      render: (_, r) => (
        <div style={{ fontWeight: 600 }}>{getEmployeeName(r)}</div>
      ),
    },

    // ✅ NEW COLUMN: JOINING DATE
    {
      title: "Joining Date",
      render: (_, record) => {
        const empId = record?.employee?.id;
        const user = userMap[empId];

        return user?.joining_date
          ? dayjs(user.joining_date).format("DD MMM YYYY")
          : "-";
      },
    },

    {
      title: "Date",
      dataIndex: "leave_date",
    },
    { title: "Category", dataIndex: "leave_category" },
    { title: "Days", dataIndex: "total_days" },
    { title: "Reason", dataIndex: "reason" },

    {
      title: "Step",
      render: (_, r) => (
        <Tag color="blue">
          {r.current_step} - {getStepName(Number(r.current_step))}
        </Tag>
      ),
    },

    {
      title: "Status",
      render: (_, r) => statusTag(r.status),
    },

    ...(isAction
      ? [
          {
            title: "Decision",
            render: (_, record) => (
              <Select
                style={{ width: 120 }}
                placeholder="Action"
                onChange={(val) =>
                  setUpdates((p) => ({
                    ...p,
                    [record.id]: { ...p[record.id], status: val },
                  }))
                }
              >
                <Option value="APPROVED">Approve</Option>
                <Option value="REJECTED">Reject</Option>
              </Select>
            ),
          },
          {
            title: "Payment",
            render: (_, record) => (
              <Select
                style={{ width: 120 }}
                placeholder="Payment"
                onChange={(val) =>
                  setUpdates((p) => ({
                    ...p,
                    [record.id]: {
                      ...p[record.id],
                      leave_payment_type: val,
                    },
                  }))
                }
              >
                <Option value="PAID">Paid</Option>
                <Option value="UNPAID">Unpaid</Option>
              </Select>
            ),
          },
          {
            title: "Remarks",
            render: (_, record) => (
              <Input
                placeholder="Remarks"
                onChange={(e) =>
                  setUpdates((p) => ({
                    ...p,
                    [record.id]: {
                      ...p[record.id],
                      remarks: e.target.value,
                    },
                  }))
                }
              />
            ),
          },
          {
            title: "Action",
            render: (_, record) => (
              <Button
                type="primary"
                onClick={async () => {
                  const u = updates[record.id];

                  if (!u?.status) return message.warning("Select action");

                  if (!u?.leave_payment_type)
                    return message.warning("Select payment");

                  try {
                    await api.post("/api/leaves/approve", {
                      leave_id: record.id,
                      status: u.status,
                      remarks: u.remarks || "",
                      leave_payment_type: u.leave_payment_type,
                    });

                    message.success("Updated");
                    fetchData();
                  } catch (err) {
                    message.error(err?.response?.data?.detail || "Failed");
                  }
                }}
              >
                Submit
              </Button>
            ),
          },
        ]
      : []),
  ];

  // ================= TABS =================
  const items = [
    {
      key: "1",
      label: `Pending (${pending.length})`,
      children: (
        <Table
          rowKey="id"
          columns={columns(true)}
          dataSource={pending}
          loading={loading}
        />
      ),
    },
    {
      key: "2",
      label: `Processing (${processing.length})`,
      children: (
        <Table
          rowKey="id"
          columns={columns(false)}
          dataSource={processing}
          loading={loading}
        />
      ),
    },
    {
      key: "3",
      label: `Approved (${approved.length})`,
      children: (
        <Table
          rowKey="id"
          columns={columns(false)}
          dataSource={approved}
          loading={loading}
        />
      ),
    },
    {
      key: "4",
      label: `Rejected (${rejected.length})`,
      children: (
        <Table
          rowKey="id"
          columns={columns(false)}
          dataSource={rejected}
          loading={loading}
        />
      ),
    },
  ];

  return (
    <MainLayout>
      <Card title="Leave Approvals">
        <Tabs items={items} />
      </Card>
    </MainLayout>
  );
};

export default CombinedApprovalsPage;
