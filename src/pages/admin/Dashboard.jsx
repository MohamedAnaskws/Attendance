import React, { useEffect, useState, useCallback } from "react";
import { message } from "antd";
import {
  TeamOutlined,
} from "@ant-design/icons";

import MainLayout from "../../components/layout/MainLayout";
import { getToken } from "../../utils/auth";


function DashboardPage() {
  const [totalUsers, setTotalUsers] = useState(0);
  const BASE = import.meta.env.VITE_API_URL;

  // ================= LOAD USERS COUNT =================
  const loadUsersCount = useCallback(async () => {
  try {
    const res = await fetch(`${BASE}/api/users`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error("Failed request");
    }

    const data = await res.json();

    setTotalUsers(Array.isArray(data) ? data.length : 0);
  } catch (err) {
    console.error(err);
    message.error("Failed to load users count ❌");
  }
}, [BASE]); 

useEffect(() => {
  loadUsersCount();
}, [loadUsersCount]);

  // ================= CARDS =================
  const cards = [
    {
      title: "Total Users",
      value: totalUsers, 
      icon: <TeamOutlined />,
      gradient: "from-blue-500 to-blue-700",
    },
   
  ];

  return (
    <MainLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c, i) => (
          <div
            key={i}
            className={`p-6 text-white rounded-2xl shadow-lg bg-gradient-to-r ${c.gradient}`}
          >
            <div className="text-3xl opacity-50 mb-2">{c.icon}</div>
            <h2 className="text-lg">{c.title}</h2>
            <p className="text-3xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>
    </MainLayout>
  );
}

export default DashboardPage;