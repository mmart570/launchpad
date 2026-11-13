// ============================================================================
// NOTIFICATION BELL COMPONENT
// ============================================================================
// Displays notification bell icon with dropdown menu of user notifications

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:3000";

// Helper: Retrieve authentication token for a specific role from browser storage
function sessionToken(role) {
  for (const storage of [sessionStorage, localStorage]) {
    try {
      const user = JSON.parse(storage.getItem("launchpad_user") || "{}");
      const token = storage.getItem("launchpad_token");
      if (user.role === role && token) return token;
    } catch {
      /* Ignore invalid session */
    }
  }
  return null;
}

export default function NotificationBell({ role }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const root = useRef(null);
  const navigate = useNavigate();

  // Helper: Make authenticated API request for notifications
  async function request(url, options = {}) {
    const token = sessionToken(role);
    if (!token) throw new Error("Please sign in again.");
    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, ...options.headers },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(data.error || "Notification request failed.");
    return data;
  }

  // Fetch and refresh notifications from server
  async function refresh() {
    try {
      const data = await request("/api/notifications");
      setItems(Array.isArray(data.notifications) ? data.notifications : []);
      setUnread(Number(data.unreadCount) || 0);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  // Initial load and periodic refresh of notifications
  useEffect(() => {
    let active = true;
    const token = sessionToken(role);
    if (!token) return;

    const fetchNotifications = async () => {
      try {
        const response = await fetch(`${API_URL}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok)
          throw new Error(data.error || "Unable to load notifications.");
        if (active) {
          setItems(Array.isArray(data.notifications) ? data.notifications : []);
          setUnread(Number(data.unreadCount) || 0);
          setError("");
        }
      } catch (err) {
        if (active) setError(err.message);
      }
    };

    fetchNotifications();
    // Refresh every 30 seconds
    const interval = window.setInterval(fetchNotifications, 30000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [role]);

  // Close notification menu when clicking outside or pressing Escape
  useEffect(() => {
    function onOutside(event) {
      if (root.current && !root.current.contains(event.target)) setOpen(false);
    }
    function onEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  // Handle notification click - mark as read and navigate to related item
  async function openItem(item) {
    try {
      if (!item.read) {
        await request(`/api/notifications/${item._id}/read`, {
          method: "PATCH",
        });
        setItems((previous) =>
          previous.map((n) => (n._id === item._id ? { ...n, read: true } : n)),
        );
        setUnread((previous) => Math.max(0, previous - 1));
      }
      setOpen(false);
      // Only navigate to internal application routes (start with /)
      if (
        typeof item.link === "string" &&
        item.link.startsWith("/") &&
        !item.link.startsWith("//")
      ) {
        navigate(item.link);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  // Mark all notifications as read
  async function markAllRead() {
    setBusy(true);
    try {
      await request("/api/notifications/read-all", { method: "PATCH" });
      setItems((previous) => previous.map((item) => ({ ...item, read: true })));
      setUnread(0);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      ref={root}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {/* Notification Bell Button */}
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) refresh();
        }}
        aria-label={`Notifications, ${unread} unread`}
        aria-expanded={open}
        style={{
          position: "relative",
          border: "1px solid #d9dce5",
          borderRadius: 12,
          background: "#fff",
          padding: "9px 12px",
          cursor: "pointer",
          color: "#1d2540",
          fontSize: 20,
        }}
      >
        <span aria-hidden="true">🔔</span>
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: -8,
              right: -9,
              background: "#d53b43",
              color: "white",
              borderRadius: 20,
              padding: "2px 6px",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Menu */}
      {open && (
        <div
          role="region"
          aria-label="Notifications"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 10px)",
            zIndex: 1000,
            width: "min(360px, 90vw)",
            maxHeight: 420,
            overflowY: "auto",
            background: "white",
            border: "1px solid #e0e2e8",
            boxShadow: "0 10px 30px rgba(0,0,0,.12)",
            borderRadius: 12,
            padding: 14,
            color: "#1d2540",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              marginBottom: 10,
            }}
          >
            <strong>Notifications</strong>
            <button
              type="button"
              onClick={markAllRead}
              disabled={busy || unread === 0}
              style={{
                border: 0,
                background: "transparent",
                color: "#4051aa",
                cursor: "pointer",
              }}
            >
              Mark all as read
            </button>
          </div>
          {error && (
            <p role="alert" style={{ color: "#b42318" }}>
              {error}
            </p>
          )}
          {items.length === 0 && (
            <p style={{ margin: "12px 0" }}>No notifications yet.</p>
          )}
          {items.map((item) => (
            <button
              key={item._id}
              type="button"
              onClick={() => openItem(item)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "12px 8px",
                border: 0,
                borderBottom: "1px solid #eee",
                background: item.read ? "white" : "#f1f4ff",
                cursor: "pointer",
                color: "inherit",
                borderRadius: 5,
              }}
            >
              <strong>{item.title}</strong>
              <span style={{ display: "block", marginTop: 4, fontSize: 13 }}>
                {item.message}
              </span>
              <small style={{ display: "block", marginTop: 4, opacity: 0.7 }}>
                {new Date(item.createdAt).toLocaleString()}
              </small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
