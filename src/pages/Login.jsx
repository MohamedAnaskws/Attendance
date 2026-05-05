import React, { useState } from "react";
import Logo from "../assets/logo.webp";
import { Button, Input, Form, Card, message } from "antd";
import { useNavigate } from "react-router-dom";
import { setAuth } from "../utils/auth";

function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const BASE = import.meta.env.VITE_API_URL;

  const roleRedirectMap = {
    1: "/dashboard",
    2: "/dashboard",
    3: "/dashboard",
    4: "/user-dashboard",
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", accept: "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (response.ok) {
        setAuth({ access_token: data.access_token, user: data.user });
        message.success(`Welcome, ${data.user.username}!`);
        const redirectPath = roleRedirectMap[data.user?.roleid] || "/";
        navigate(redirectPath);
      } else {
        message.error(data?.detail || data?.message || "Login failed");
      }
    } catch (err) {
      console.error(err);
      message.error("Server error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex items-center justify-center min-h-screen w-full bg-cover bg-center"
      style={{ backgroundImage: "url(https://intercitymoney.co.uk/en/images/banner/2.jpg)" }}
    >
      <div className="absolute inset-0 bg-black/60"></div>
      <div className="absolute top-10 left-10 w-80 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-80 h-72 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>

      <Card className="relative z-10 w-full max-w-lg p-8 rounded-3xl shadow-2xl bg-white/95 backdrop-blur-md">
        <div className="flex flex-col items-center mb-6">
          <img src={Logo} alt="Logo" className="h-10 mb-4 animate-bounce" />
          <h2 className="text-lg font-extrabold text-blue-900 text-center">
            Welcome to Your Control Center!
          </h2>
          <p className="text-center text-sm text-gray-500 mt-1">
            Sign in to access your dashboard
          </p>
        </div>

        <Form layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Username" name="username" rules={[{ required: true, message: "Enter username" }]}>
            <Input size="large" placeholder="Username" autoComplete="off" />
          </Form.Item>
          <Form.Item label="Password" name="password" rules={[{ required: true, message: "Enter password" }]}>
            <Input.Password size="large" placeholder="Password" autoComplete="off" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full"
              style={{
                height: 48,
                background: "linear-gradient(135deg, #2563eb, #4f46e5)",
                border: "none",
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              Login
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default Login;