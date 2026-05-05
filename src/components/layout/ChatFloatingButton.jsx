import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MessageOutlined } from "@ant-design/icons";
import { Badge } from "antd";
import { useChatStore } from "../../store/chatStore";

function ChatFloatingButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const [pulse, setPulse] = useState(false);

  // Get unread count from chat store
  const conversations = useChatStore((s) => s.conversations);
  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  // Effect for pulse animation
  useEffect(() => {
    if (totalUnread > 0) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 2000);
      return () => clearTimeout(t);
    }
  }, [totalUnread]);

  // Don't show on chat page or login page (after all hooks)
  if (location.pathname === "/chat" || location.pathname === "/" || location.pathname === "/login") {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "28px",
        right: "28px",
        zIndex: 9999,
      }}
    >
      {/* Pulse ring */}
      {totalUnread > 0 && (
        <span
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "rgba(99, 102, 241, 0.35)",
            animation: "chatPulse 2s ease-out infinite",
          }}
        />
      )}

      <Badge
        count={totalUnread}
        overflowCount={99}
        offset={[-4, 4]}
        style={{
          backgroundColor: "#ef4444",
          boxShadow: "0 0 0 2px #fff",
        }}
      >
        <button
          onClick={() => navigate("/chat")}
          title="Open Chat"
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px rgba(102, 126, 234, 0.5)",
            transition: "transform 0.2s, box-shadow 0.2s",
            position: "relative",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.12)";
            e.currentTarget.style.boxShadow = "0 6px 28px rgba(102, 126, 234, 0.7)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 4px 20px rgba(102, 126, 234, 0.5)";
          }}
        >
          <MessageOutlined style={{ fontSize: 24, color: "#fff" }} />
        </button>
      </Badge>

      {/* Tooltip label */}
      <div
        style={{
          position: "absolute",
          bottom: "100%",
          right: 0,
          marginBottom: 8,
          background: "rgba(15, 23, 42, 0.85)",
          color: "#fff",
          fontSize: 12,
          fontWeight: 500,
          padding: "4px 10px",
          borderRadius: 6,
          whiteSpace: "nowrap",
          pointerEvents: "none",
          opacity: 0,
          transition: "opacity 0.2s",
        }}
        className="chat-fab-tooltip"
      >
        Open Chat
      </div>

      <style>{`
        @keyframes chatPulse {
          0%   { transform: scale(1);   opacity: 0.7; }
          70%  { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        button:hover + .chat-fab-tooltip,
        button:focus + .chat-fab-tooltip {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}

export default ChatFloatingButton;