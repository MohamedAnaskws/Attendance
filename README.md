# CRM + Chat Unified App

A production-ready frontend that combines a full CRM system with an integrated real-time chat system.

## Features

### CRM System
- Role-based access control (Owner, Manager, Department Manager, Staff)
- Users, Roles & Permissions, Departments management
- HR: Attendance, Work Shifts, Holidays, Calendar, Leave Requests
- Salary Generation & Processing
- Dark sidebar with smooth navigation

### Chat System
- Real-time WebSocket messaging
- Direct messages & Group chats
- File uploads, reactions, message editing & deletion
- Reply to messages, @mentions, typing indicators
- Online presence indicators
- Archived conversations

### Integration
- **Floating Chat Button (FAB)**: A purple gradient chat icon appears fixed at the bottom-right corner on all CRM pages. Click it to open the full chat. Displays unread message badge count.
- Shared authentication (JWT token stored in both cookies and localStorage)
- Single login flow routes users to their role-based dashboard

## Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your backend URLs

# Development
npm run dev

# Production build
npm run build
npm run preview
```

## Environment Variables

```
VITE_API_URL=http://localhost:8000    # Your backend REST API URL
VITE_WS_URL=ws://localhost:8000       # Your backend WebSocket URL
```

## Project Structure

```
src/
├── api/              # Low-level fetch helpers
├── assets/           # Images, icons
├── components/
│   ├── layout/
│   │   ├── ChatFloatingButton.jsx  ← FAB chat launcher
│   │   ├── HeaderBar.jsx
│   │   ├── MainLayout.jsx
│   │   └── sidebar/
│   ├── ChatLayout.tsx
│   ├── ChatList.tsx
│   ├── ChatWindow.tsx
│   └── ...
├── config/           # Menu config, roles
├── pages/
│   ├── admin/        # CRM admin pages
│   ├── users/        # CRM user pages
│   └── Login.jsx
├── services/
│   ├── api.ts        # Chat API + WebSocket
│   └── crm/          # CRM API helpers
├── store/
│   ├── authStore.ts
│   └── chatStore.ts
├── types/            # TypeScript interfaces
└── utils/            # Auth helpers, menu filter
```

## Role Access

| Role | ID | Access |
|------|----|--------|
| Owner | 1 | Everything |
| Manager | 2 | Dashboard, Users, Departments, HR, Chat |
| Department Manager | 3 | Dashboard, HR, Chat |
| Staff | 4 | User Dashboard, Calendar, Chat |

## Tech Stack

- **React 19** + TypeScript
- **Vite 8** (build tool)
- **Ant Design 5** (UI components)
- **Tailwind CSS 3** (utility styles)
- **Zustand 5** (state management)
- **React Router 7** (routing)
- **Axios** (HTTP client)
- **WebSocket** (real-time chat)
