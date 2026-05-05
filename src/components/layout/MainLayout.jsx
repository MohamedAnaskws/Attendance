import React, { useState } from "react";
import { Layout } from "antd";

import AdminSidebar from "./sidebar/AdminSidebar";
import UserSidebar from "./sidebar/UserSidebar";
import HeaderBar from "./HeaderBar";
import { getUser } from "../../utils/auth";

const { Sider, Content } = Layout;

function MainLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  const user = getUser()
    ? getUser()
    : null;

  const roleId = user?.roleid;

  const Sidebar = roleId === 4 ? UserSidebar : AdminSidebar;

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <Sidebar collapsed={collapsed} />
      </Sider>

      <Layout>
        <HeaderBar />
        <Content className="m-5 bg-gray-50 rounded-xl">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}

export default MainLayout;