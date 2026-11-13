import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const API_URL = "http://localhost:3000";

function getSession() {
  for (const storage of [sessionStorage, localStorage]) {
    const token = storage.getItem("launchpad_token");
    const userText = storage.getItem("launchpad_user");
    if (!token || !userText) {
      continue;
    }
    try {
      const user = JSON.parse(userText);
      if (user?.userId && user?.role) {
        return { token, user } ;
      } 
    } catch {

    }
  }
  return null;
}

export default function Messages() {
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThread] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const session = getSession();
  const token = session?.token;
  const currentUserId = session?.user?.userId;
  const role = session?.user?.role;

  const formatTime = (isoString) => {
    if (!isoString) {
      return "";
    }
    return new Date(isoString).toLocaleString([], {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
    });
  };

  useEffect(() =>  {
    if (!token) {
      setLoading(false);
      return;
    }
    
  fetch (`${API_URL}/api/threads`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  .then(async (res) => {
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error|| "Unable to load the messages...");
    }
    return data;
  })
  .then ((threadsData) => {
    setThreads(threadsData);
    if (threadsData.length > 0) {
      setActiveThread(threadsData[0]._id);
    }
  })
  .catch((err) => setError(err.message))
  .finally (() => setLoading(false));
}, [token]);

const activeThread = threads.find((t) => t._id == activeThreadId);

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth"});
}, [activeThread?.messages?.length, activeThreadId]);

const handleSend = async (e) => {
  e.preventDefault();
  const trimmed = text.trim();
  if (!trimmed || !activeThreadId) {
    return;
  }
  try {
    const res = await fetch (`${API_URL}/api/threads/${activeThreadId}/messages`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`,
    } ,body: JSON.stringify({ text: trimmed }),
    });
  
  const data = await res.json();
  if (!res.ok) {
    alert(data.error || "Failed to send the message.");
    return;
  }

  setThreads((prev) => 
    prev.map((t) =>
      t._id === activeThreadId ? { ...t, messages: [...(t.messages || []), data] } : t
    )
  );
  setText("");
  } catch (err) {
    console.error("Failed to send the message.", err);
    alert ("Couldn't reach the server");
  }
};

if (!session) {
  return <p>Not logged in. <Link to="/login"> Login</Link> </p>;
}
if (loading) {
  return <p> Loading......</p>;
}
if (error) {
  return <p style={{color:"red"}}>Error: {error}</p>;
}

return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <Link to={role === "business" ? "/business-dashboard" : "/dashboard"}>
        &larr; Back to Dashboard
      </Link>
      <h2>Messages Test UI ({role})</h2>

      {/* 1. Thread Selector */}
      <div style={{ marginBottom: "15px" }}>
        <strong>Conversations ({threads.length}): </strong>
        {threads.length === 0 && <span>None yet (accept an application first).</span>}
        {threads.map((t) => (
          <button
            key={t._id}
            onClick={() => setActiveThread(t._id)}
            style={{
              marginRight: "8px",
              fontWeight: t._id === activeThreadId ? "bold" : "normal",
            }}
          >
            {t.otherPerson} ({t.workOrderTitle})
          </button>
        ))}
      </div>

      {/* 2. Message History & Send Box */}
      {activeThread && (
        <div style={{ border: "1px solid #ccc", padding: "15px", maxWidth: "500px" }}>
          <h4>Chat with {activeThread.otherPerson}</h4>

          <div style={{ maxHeight: "250px", overflowY: "auto", marginBottom: "10px" }}>
            {(activeThread.messages || []).map((m, i) => (
              <p key={m._id || i}>
                <strong>{String(m.senderId) === String(currentUserId) ? "Me" : activeThread.otherPerson}:</strong>{" "}
                {m.text} <small>({formatTime(m.sentAt)})</small>
              </p>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a test message..."
              style={{ width: "75%", marginRight: "8px" }}
            />
            <button type="submit">Send</button>
          </form>
        </div>
      )}
    </div>
  );
}