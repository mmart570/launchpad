/*
╔════════════════════════════════════════════════════════════════════════════╗
║                       BusinessMessages.jsx                                 ║
║                                                                            ║
║  Business messaging interface. Allows businesses to send direct            ║
║  messages to students about work orders. Displays message history          ║
║  for a specific student and work order combination. Used to coordinate     ║
║  work details and requirements.                                            ║
║                                                                            ║
║  Key Features:                                                             ║
║  - Message history display for student/work order pair                     ║
║  - Compose and send new messages                                           ║
║  - Timestamp and sender attribution                                        ║
║  - Real-time message refresh capability                                    ║
╚════════════════════════════════════════════════════════════════════════════╝
*/

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProfileDropdown from "../components/ProfileDropdown";
import "../styles/WorkOrderDetails.css";

const API_URL = "http://localhost:3000";

function getToken() {
  for (const storage of [sessionStorage, localStorage]) {
    try {
      if (
        JSON.parse(storage.getItem("launchpad_user") || "{}").role ===
        "business"
      ) {
        const token = storage.getItem("launchpad_token");
        if (token) return token;
      }
    } catch {
      // Ignore invalid saved session
    }
  }

  return null;
}

export default function BusinessMessages() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const token = getToken();

    if (!token) {
      setError("Please sign in as a business.");
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setError("");

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [ordersResponse, conversationsResponse] = await Promise.all([
          fetch(`${API_URL}/api/business/work-orders`, {
            headers,
            signal: controller.signal,
          }),
          fetch(`${API_URL}/api/work-orders/${id}/conversations`, {
            headers,
            signal: controller.signal,
          }),
        ]);

        const orders = await ordersResponse.json().catch(() => null);

        const people = await conversationsResponse.json().catch(() => null);

        if (!ordersResponse.ok || !Array.isArray(orders)) {
          throw new Error("Unable to load work order.");
        }

        if (!conversationsResponse.ok || !Array.isArray(people)) {
          throw new Error(people?.error || "Unable to load conversations.");
        }

        const found = orders.find((o) => String(o._id) === String(id));

        if (!found) {
          throw new Error("This work order does not belong to your account.");
        }

        if (!controller.signal.aborted) {
          setOrder(found);
          setConversations(people);

          setStudentId((current) =>
            people.some((p) => String(p.studentId) === String(current))
              ? current
              : String(people[0]?.studentId || ""),
          );
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => controller.abort();
  }, [id]);

  async function loadMessages(selectedId) {
    if (!selectedId) {
      setMessages([]);
      return;
    }

    const token = getToken();

    if (!token) {
      setError("Please sign in again.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/work-orders/${id}/messages?studentId=${encodeURIComponent(
          selectedId,
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok || !Array.isArray(result)) {
        throw new Error(result?.error || "Unable to load messages.");
      }

      setMessages(result);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadMessages(studentId);
  }, [id, studentId]);

  async function send(event) {
    event.preventDefault();

    if (!body.trim() || !studentId || busy) return;

    const token = getToken();

    if (!token) {
      setError("Please sign in again.");
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API_URL}/api/work-orders/${id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            studentId,
            body: body.trim(),
          }),
        },
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Unable to send message.");
      }

      setBody("");
      setNotice("Message sent.");

      await loadMessages(studentId);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="work-details-page">
      <header className="work-details-navbar">
        <Link to="/business-dashboard" className="work-details-logo">
          Launch<span>Pad</span>
        </Link>

        <nav>
          <Link to="/business-dashboard" className="work-details-back">
            Business dashboard
          </Link>{" "}
          <ProfileDropdown role="business" initials="BU" />
        </nav>
      </header>

      <main className="work-details-main">
        <Link to="/business-dashboard">← Back to dashboard</Link>

        <h1>Work order messages</h1>
        <p>{order?.title || "Work order"}</p>

        {loading && <p role="status">Loading conversations...</p>}

        {error && (
          <p role="alert" style={{ color: "#b42318" }}>
            {error}
          </p>
        )}

        {notice && <p role="status">{notice}</p>}

        {!loading && order && (
          <section className="work-info-card work-messages-panel">
            <div className="work-info-body">
              {conversations.length === 0 ? (
                <p>No applicants to message yet.</p>
              ) : (
                <>
                  <label htmlFor="business-conversation">
                    Conversation with student
                  </label>

                  <select
                    id="business-conversation"
                    value={studentId}
                    onChange={(e) => {
                      setStudentId(e.target.value);
                      setNotice("");
                    }}
                    style={{
                      display: "block",
                      padding: 10,
                      margin: "12px 0",
                      width: "100%",
                    }}
                  >
                    {conversations.map((person) => (
                      <option key={person.studentId} value={person.studentId}>
                        {person.name} ({person.applicationStatus})
                      </option>
                    ))}
                  </select>

                  <div aria-live="polite" style={{ margin: "20px 0" }}>
                    {messages.length === 0 && <p>No messages yet.</p>}

                    {messages.map((message) => (
                      <article
                        key={message._id}
                        style={{
                          borderBottom: "1px solid #ddd",
                          padding: "12px 0",
                        }}
                      >
                        <strong>
                          {message.senderRole === "business"
                            ? "You"
                            : "Student"}
                        </strong>{" "}
                        ·{" "}
                        <small>
                          {new Date(message.createdAt).toLocaleString()}
                        </small>
                        <p
                          style={{
                            whiteSpace: "pre-wrap",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {message.body}
                        </p>
                      </article>
                    ))}
                  </div>

                  <form onSubmit={send}>
                    <label htmlFor="business-message-text">Reply</label>

                    <textarea
                      id="business-message-text"
                      rows={4}
                      maxLength={5000}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      style={{
                        display: "block",
                        width: "100%",
                        margin: "12px 0",
                      }}
                      required
                    />

                    <button
                      type="submit"
                      className="work-apply-button"
                      disabled={busy || !body.trim()}
                    >
                      {busy ? "Sending..." : "Send message"}
                    </button>

                    <button
                      type="button"
                      className="work-action-outline"
                      style={{ marginLeft: 10 }}
                      onClick={() => loadMessages(studentId)}
                    >
                      Refresh messages
                    </button>
                  </form>
                </>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
