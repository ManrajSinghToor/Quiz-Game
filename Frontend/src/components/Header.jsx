import { useState, useRef, useEffect } from "react";
import { BrainCircuit, LogOut, Settings, User, Trophy, Users, Gamepad2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";

const AVATARS = [
  { emoji: "🧠", bg: "hsl(250, 90%, 65%)" },
  { emoji: "🦊", bg: "hsl(20, 90%, 55%)" },
  { emoji: "🐉", bg: "hsl(160, 80%, 45%)" },
  { emoji: "🦅", bg: "hsl(200, 80%, 50%)" },
  { emoji: "🐺", bg: "hsl(230, 50%, 50%)" },
  { emoji: "🦁", bg: "hsl(45, 95%, 55%)" },
  { emoji: "🐙", bg: "hsl(340, 85%, 60%)" },
  { emoji: "🦄", bg: "hsl(280, 85%, 65%)" },
  { emoji: "🐲", bg: "hsl(0, 70%, 50%)" },
  { emoji: "🎯", bg: "hsl(180, 70%, 50%)" },
  { emoji: "⚡", bg: "hsl(50, 90%, 50%)" },
  { emoji: "🔥", bg: "hsl(15, 90%, 55%)" },
];

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { onlineCount } = useSocket();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const avatarIndex = Number.isInteger(user?.avatar) ? user.avatar : 0;
  const avatar = AVATARS[avatarIndex] || AVATARS[0];

  const currentPath = location.pathname;

  return (
    <>
      <header className="header glass">
        <div className="container header-inner" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button onClick={() => navigate(user ? "/dashboard" : "/")} className="logo-link">
              <div className="logo-icon gradient-primary">
                <BrainCircuit style={{ width: "1.5rem", height: "1.5rem", color: "var(--primary-foreground)" }} />
              </div>
              <span className="logo-text">QuizArena</span>
            </button>

            <div className="online-indicator">
              <div className="pulse-dot" />
              <Users style={{ width: "0.875rem", height: "0.875rem" }} />
              <span style={{ fontWeight: 700 }}>{onlineCount} Online</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {user ? (
              <>
                <nav className="nav-links">
                  <button 
                    onClick={() => navigate("/dashboard")} 
                    className={`nav-link ${currentPath === "/dashboard" ? "active" : ""}`}
                  >
                    Games
                  </button>
                  <button 
                    onClick={() => navigate("/leaderboard")} 
                    className={`nav-link ${currentPath === "/leaderboard" ? "active" : ""}`}
                  >
                    <Trophy style={{ width: "1rem", height: "1rem" }} /> Leaderboard
                  </button>
                </nav>

                <div className="dropdown-wrapper" ref={dropdownRef}>
                  <button
                    className="avatar"
                    style={{
                      background: avatar.bg,
                      fontSize: "1.25rem",
                      border: "2px solid var(--border)",
                      cursor: "pointer"
                    }}
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    title="User profile menu"
                  >
                    {avatar.emoji}
                  </button>

                  {dropdownOpen && (
                    <div className="dropdown-content">
                      <div className="dropdown-label">
                        <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                          {user.name || "User"}
                        </p>
                        <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", wordBreak: "break-all" }}>
                          {user.email}
                        </p>
                      </div>

                      <div className="dropdown-separator" />

                      <button
                        className="dropdown-item"
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate("/profile");
                        }}
                      >
                        <User style={{ width: "1rem", height: "1rem" }} /> Profile
                      </button>

                      <button
                        className="dropdown-item"
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate("/profile");
                        }}
                      >
                        <Settings style={{ width: "1rem", height: "1rem" }} /> Settings
                      </button>

                      <div className="dropdown-separator" />

                      <button
                        className="dropdown-item destructive"
                        onClick={() => {
                          setDropdownOpen(false);
                          logout();
                          navigate("/login");
                        }}
                      >
                        <LogOut style={{ width: "1rem", height: "1rem" }} /> Log out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button 
                className="btn btn-primary" 
                onClick={() => navigate("/login")}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <User style={{ width: "1rem", height: "1rem" }} /> Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Visible on mobile screens < 768px for logged in users) */}
      {user && (
        <nav className="mobile-bottom-nav glass">
          <button 
            onClick={() => navigate("/dashboard")} 
            className={`mobile-nav-item ${currentPath === "/dashboard" ? "active" : ""}`}
          >
            <Gamepad2 className="mobile-nav-icon" />
            <span>Games</span>
          </button>

          <button 
            onClick={() => navigate("/leaderboard")} 
            className={`mobile-nav-item ${currentPath === "/leaderboard" ? "active" : ""}`}
          >
            <Trophy className="mobile-nav-icon" />
            <span>Leaderboard</span>
          </button>

          <button 
            onClick={() => navigate("/profile")} 
            className={`mobile-nav-item ${currentPath === "/profile" ? "active" : ""}`}
          >
            <User className="mobile-nav-icon" />
            <span>Profile</span>
          </button>
        </nav>
      )}
    </>
  );
};

export default Header;
