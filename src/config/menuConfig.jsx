import {
  DashboardOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  ApartmentOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  TeamOutlined,
  ScheduleOutlined,
  FileDoneOutlined,
  PayCircleOutlined,
  ProfileOutlined,
  MessageOutlined,
} from "@ant-design/icons";

// ================= ADMIN MENU =================
export const ADMIN_MENU = [
  {
    key: "/dashboard",
    icon: <DashboardOutlined />,
    label: "Dashboard",
    roles: [1, 2, 3],
  },
  {
    key: "/users",
    icon: <UserOutlined />,
    label: "Users",
    roles: [1, 2],
  },
  {
    key: "/roles",
    icon: <SafetyCertificateOutlined />,
    label: "Roles & Permissions",
    roles: [1],
  },
  {
    key: "/departments",
    icon: <ApartmentOutlined />,
    label: "Departments",
    roles: [1, 2],
  },
  {
    key: "hr",
    icon: <TeamOutlined />,
    label: "HR Management",
    roles: [1, 2, 3],
    children: [
      {
        key: "/attendance",
        icon: <ClockCircleOutlined />,
        label: "Attendance",
        roles: [1, 2, 3],
      },
      {
        key: "/holidays",
        icon: <CalendarOutlined />,
        label: "Holidays",
        roles: [1, 2, 3],
      },
      {
        key: "/salary-process",
        icon: <PayCircleOutlined />,
        label: "Salary Generation",
        roles: [1],
      },
      {
        key: "/calendar",
        icon: <CalendarOutlined />,
        label: "Calendar",
        roles: [1, 2, 3],
      },
      {
        key: "/leavespage",
        icon: <FileDoneOutlined />,
        label: "Leave Requests",
        roles: [1, 2, 3],
      },
       {
        key: "/employee-calendar",
        icon: <CalendarOutlined />,
        label: "Employee Calendar",
        roles: [1, 2],
      },
    ],
  },
  {
    key: "/chat",
    icon: <MessageOutlined />,
    label: "Chat",
    roles: [1, 2, 3],
  },
  {
    key: "/chat-log",
    icon: <ProfileOutlined />,
    label: "Chat Log",
    roles: [1],
  },
];

// ================= USER MENU =================
export const USER_MENU = [
  {
    key: "/user-dashboard",
    icon: <DashboardOutlined />,
    label: "Dashboard",
    roles: [4],
  },
  {
    key: "/user-calendar",
    icon: <CalendarOutlined />,
    label: "My Calendar",
    roles: [4],
  },
  {
    key: "/chat",
    icon: <MessageOutlined />,
    label: "Chat",
    roles: [4],
  },
];
