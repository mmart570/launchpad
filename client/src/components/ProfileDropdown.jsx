import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/ProfileDropdown.css";

const API_URL = "http://localhost:3000";

function getStudentToken() {
  for (const storage of [sessionStorage, localStorage]) {
    const token = storage.getItem("launchpad_token");
    const userText = storage.getItem("launchpad_user");

    if (!token || !userText) continue;

    try {
      const user = JSON.parse(userText);

      if (user.role === "student") {
        return token;
      }
    } catch {
      // Ignore invalid saved sessions.
    }
  }

  return null;
}

function ProfileDropdown({
  role = "student",
  initials = "AB",
  avatarClassName,
}) {
  const [open, setOpen] = useState(false);
  const [displayInitials, setDisplayInitials] = useState(initials);
  const menuRef = useRef(null);

  const isBusiness = role === "business";

  useEffect(() => {
    if (isBusiness) {
      setDisplayInitials(initials);
      return;
    }

    const controller = new AbortController();
    const token = getStudentToken();

    if (!token) {
      setDisplayInitials(initials);
      return;
    }

    async function loadInitials() {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) return;

        const user = await response.json();
        const firstName = user.studentProfile?.firstName || "";
        const lastName = user.studentProfile?.lastName || "";

        const realInitials =
          `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

        if (realInitials && !controller.signal.aborted) {
          setDisplayInitials(realInitials);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Unable to load student initials:", error);
        }
      }
    }

    loadInitials();

    return () => controller.abort();
  }, [isBusiness, initials]);

  const profilePath = isBusiness ? "/business-dashboard" : "/profile";

  useEffect(() => {
    function handleOutsideClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleLogout() {
    // Clear saved student and business sessions.
    for (const storage of [sessionStorage, localStorage]) {
      storage.removeItem("launchpad_token");
      storage.removeItem("launchpad_user");
    }

    window.location.replace("/");
  }

  const avatarStyle =
    avatarClassName ||
    (isBusiness ? "business-dashboard-nav-avatar" : "dashboard-avatar");

  return (
    <div className="profile-dropdown" ref={menuRef}>
      <button
        type="button"
        className={`${avatarStyle} profile-dropdown-trigger`}
        onClick={() => setOpen((previous) => !previous)}
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {displayInitials}
      </button>

      {open && (
        <div className="profile-dropdown-menu">
          <Link
            to={profilePath}
            className="profile-dropdown-item"
            onClick={() => setOpen(false)}
          >
            {isBusiness ? "Business Dashboard" : "View profile"}
          </Link>

          <button
            type="button"
            className="profile-dropdown-item profile-dropdown-logout"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileDropdown;
