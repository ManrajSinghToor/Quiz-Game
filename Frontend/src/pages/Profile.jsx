import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import AnimatedBackground from "@/components/AnimatedBackground";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { getApiBase } from "@/lib/utils";
import {
  User, Mail, Lock, Trophy, Target, Flame, Award, LogOut,
  Check, X, Eye, EyeOff, Calendar, TrendingUp, Zap, Star, RefreshCw, BookOpen, Crown, Shield, Layers
} from "lucide-react";

const AVATARS = [
  { id: 0, emoji: "🧠", bg: "hsl(250, 90%, 65%)" },
  { id: 1, emoji: "🦊", bg: "hsl(20, 90%, 55%)" },
  { id: 2, emoji: "🐉", bg: "hsl(160, 80%, 45%)" },
  { id: 3, emoji: "🦅", bg: "hsl(200, 80%, 50%)" },
  { id: 4, emoji: "🐺", bg: "hsl(230, 50%, 50%)" },
  { id: 5, emoji: "🦁", bg: "hsl(45, 95%, 55%)" },
  { id: 6, emoji: "🐙", bg: "hsl(340, 85%, 60%)" },
  { id: 7, emoji: "🦄", bg: "hsl(280, 85%, 65%)" },
  { id: 8, emoji: "🐲", bg: "hsl(0, 70%, 50%)" },
  { id: 9, emoji: "🎯", bg: "hsl(180, 70%, 50%)" },
  { id: 10, emoji: "⚡", bg: "hsl(50, 90%, 50%)" },
  { id: 11, emoji: "🔥", bg: "hsl(15, 90%, 55%)" },
];

const getRankTier = (score) => {
  if (score >= 1500) return { title: "Grandmaster Legend", badge: "👑", bg: "linear-gradient(135deg, #f59e0b, #ef4444)" };
  if (score >= 800) return { title: "Diamond Master", badge: "💎", bg: "linear-gradient(135deg, #06b6d4, #3b82f6)" };
  if (score >= 400) return { title: "Gold Champion", badge: "🥇", bg: "linear-gradient(135deg, #eab308, #ca8a04)" };
  if (score >= 150) return { title: "Silver Specialist", badge: "🥈", bg: "linear-gradient(135deg, #94a3b8, #64748b)" };
  return { title: "Bronze Contender", badge: "🥉", bg: "linear-gradient(135deg, #b45309, #78350f)" };
};

const Profile = () => {
  const navigate = useNavigate();
  const { logout, updateUser } = useAuth();
  const { socket } = useSocket();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");
  const [activeTab, setActiveTab] = useState("stats");
  const [selectingAvatar, setSelectingAvatar] = useState(false);
  const [quizHistory, setQuizHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  // 🔐 Fetch Profile from Backend
  const fetchProfile = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setRefreshing(true);
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        navigate("/login");
        return;
      }

      setProfile({
        full_name: data.name,
        email: data.email,
        avatar_index: data.avatar || 0,
        created_at: data.createdAt,
        totalScore: data.totalScore || 0,
        prevTotalScore: data.prevTotalScore || 0,
        totalQuizzes: data.totalQuizzes || 0,
        totalQuestions: data.totalQuestions || 0,
        correctAnswers: data.correctAnswers || 0,
        accuracy: data.accuracy || 0,
        prevAccuracy: data.prevAccuracy || 0,
        currentStreak: data.currentStreak || 0,
      });

      setNewName(data.name);
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchQuizHistory = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setLoadingHistory(true);
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/auth/quiz-history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setQuizHistory(data);
      }
    } catch (err) {
      console.error("Error fetching quiz history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchQuizHistory();
  }, [navigate]);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      console.log("Live Socket: Refreshing Profile & Quiz History");
      fetchProfile();
      fetchQuizHistory();
    };
    socket.on("stats:updated", handleUpdate);
    socket.on("leaderboard:updated", handleUpdate);

    return () => {
      socket.off("stats:updated", handleUpdate);
      socket.off("leaderboard:updated", handleUpdate);
    };
  }, [socket]);

  const updateName = async () => {
    const token = localStorage.getItem("token");
    if (!newName.trim()) return;

    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/auth/update-name`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newName.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setProfile((p) => ({ ...p, full_name: newName.trim() }));
        updateUser({ name: newName.trim() });
        setEditingName(false);
      } else {
        alert(data.message || "Error updating name");
      }
    } catch (err) {
      console.error("Error updating name:", err);
    }
  };

  const handleChangePassword = async () => {
    const token = localStorage.getItem("token");

    if (newPassword.length < 8) {
      setPasswordMsg("❌ Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg("❌ Passwords do not match");
      return;
    }

    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPasswordMsg(`❌ ${data.message}`);
      } else {
        setPasswordMsg("✓ Password updated successfully!");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setPasswordMsg("");
          setChangingPassword(false);
        }, 2000);
      }
    } catch (err) {
      setPasswordMsg("❌ Error updating password");
    }
  };

  const signOut = () => {
    logout();
    navigate("/login");
  };

  const updateAvatar = async (avatarIndex) => {
    const token = localStorage.getItem("token");
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/auth/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatar: avatarIndex }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Error updating avatar");
        return;
      }
      setProfile((prev) => ({ ...prev, avatar_index: avatarIndex }));
      updateUser({ avatar: avatarIndex });
      setSelectingAvatar(false);
    } catch (error) {
      console.error("Error updating avatar:", error);
      alert("Error updating avatar");
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "short", 
      day: "numeric" 
    });
  };

  if (loading) {
    return (
      <div className="page-center">
        <AnimatedBackground variant="particles" />
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <div className="animate-spin" style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚡</div>
          <p style={{ color: "var(--muted-foreground)" }}>Loading player profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const currentAvatar = AVATARS[profile.avatar_index] || AVATARS[0];
  const winRate = profile.accuracy || 0;
  const avgScore = profile.totalQuizzes > 0 ? Math.round(profile.totalScore / profile.totalQuizzes) : 0;
  
  // Level & XP calculations
  const playerLevel = Math.floor(profile.totalScore / 150) + 1;
  const currentLevelXp = profile.totalScore % 150;
  const xpProgressPercent = Math.min(100, Math.round((currentLevelXp / 150) * 100));
  const rankTier = getRankTier(profile.totalScore);

  // Calculate Subject Breakdown from Quiz History
  const subjectMap = {};
  quizHistory.forEach(q => {
    const sub = q.subject || "General";
    if (!subjectMap[sub]) {
      subjectMap[sub] = { count: 0, correct: 0, total: 0, score: 0 };
    }
    subjectMap[sub].count += 1;
    subjectMap[sub].correct += q.correctAnswers || 0;
    subjectMap[sub].total += q.totalQuestions || 0;
    subjectMap[sub].score += q.score || 0;
  });
  const subjectStatsList = Object.keys(subjectMap).map(sub => {
    const data = subjectMap[sub];
    const acc = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
    return { subject: sub, ...data, accuracy: acc };
  });

  return (
    <div className="page">
      <AnimatedBackground variant="mesh" />
      <Header />

      <main className="container" style={{ paddingTop: "2rem", paddingBottom: "3rem", maxWidth: "64rem" }}>
        
        {/* Top Profile Header Card */}
        <div className="card glass glow-border animate-fade-in" style={{ padding: "2rem", marginBottom: "2rem", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
            
            {/* Avatar Selector */}
            <div style={{ position: "relative" }}>
              <button
                className="avatar animate-scale-in"
                style={{
                  background: currentAvatar.bg,
                  fontSize: "3rem",
                  width: "5.5rem",
                  height: "5.5rem",
                  border: "3px solid var(--primary)",
                  boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)",
                  cursor: "pointer"
                }}
                onClick={() => setSelectingAvatar(!selectingAvatar)}
                title="Click to change avatar"
              >
                {currentAvatar.emoji}
              </button>

              {selectingAvatar && (
                <div
                  className="card glass animate-scale-in"
                  style={{
                    position: "absolute",
                    top: "6.5rem",
                    left: 0,
                    zIndex: 100,
                    width: "20rem",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid var(--primary)",
                    padding: "1rem"
                  }}
                >
                  <p style={{ marginBottom: "0.75rem", fontSize: "0.875rem", fontWeight: 600 }}>Choose Your Avatar</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
                    {AVATARS.map((avatar) => (
                      <button
                        key={avatar.id}
                        type="button"
                        className="avatar"
                        style={{
                          background: avatar.bg,
                          width: "2.5rem",
                          height: "2.5rem",
                          border: profile.avatar_index === avatar.id ? "2px solid var(--foreground)" : "2px solid transparent",
                          fontSize: "1.2rem"
                        }}
                        onClick={() => updateAvatar(avatar.id)}
                      >
                        {avatar.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Information & Level Badge */}
            <div className="profile-info" style={{ flex: 1, minWidth: "260px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                {editingName ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <input
                      className="input"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      style={{ height: "2.5rem", fontSize: "1.25rem", fontWeight: 700 }}
                      autoFocus
                    />
                    <button className="btn btn-primary btn-sm" onClick={updateName}><Check size={18} /></button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditingName(false)}><X size={18} /></button>
                  </div>
                ) : (
                  <h1 
                    style={{ fontSize: "2rem", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}
                    onClick={() => setEditingName(true)}
                    title="Click to edit name"
                  >
                    {profile.full_name} <span style={{ fontSize: "1rem", opacity: 0.6 }}>✏️</span>
                  </h1>
                )}

                {/* Division Badge */}
                <div style={{ 
                  background: rankTier.bg, 
                  color: "#fff", 
                  padding: "0.35rem 0.85rem", 
                  borderRadius: "20px", 
                  fontSize: "0.8rem", 
                  fontWeight: 700, 
                  display: "inline-flex", 
                  alignItems: "center", 
                  gap: "0.35rem" 
                }}>
                  <span>{rankTier.badge}</span>
                  <span>{rankTier.title}</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap", color: "var(--muted-foreground)", fontSize: "0.875rem", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Mail size={16} /> {profile.email}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Calendar size={16} /> Member since {formatDate(profile.created_at)}
                </div>
              </div>

              {/* Level & XP Progress Bar */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "12px", padding: "0.75rem 1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                  <span>Level {playerLevel} Scholar</span>
                  <span style={{ color: "var(--primary)" }}>{currentLevelXp} / 150 XP ({xpProgressPercent}%)</span>
                </div>
                <div style={{ height: "8px", background: "var(--input)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ 
                    height: "100%", 
                    width: `${xpProgressPercent}%`, 
                    background: "linear-gradient(90deg, #6366f1, #a855f7)", 
                    transition: "width 0.5s ease" 
                  }} />
                </div>
              </div>
            </div>

            <button
              onClick={() => fetchProfile()}
              disabled={refreshing}
              className="btn btn-ghost"
              style={{ alignSelf: "flex-start" }}
              title="Refresh stats"
            >
              <RefreshCw size={20} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            </button>
          </div>
        </div>

        {/* 5 Performance Stats Grid Cards */}
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <TrendingUp size={20} style={{ color: "var(--primary)" }} /> Performance Overview
          </h2>
          <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
            
            <div className="card glow-border animate-fade-in" style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <span style={{ color: "var(--muted-foreground)", fontSize: "0.85rem", fontWeight: 600 }}>Total Score</span>
                <Trophy size={20} style={{ color: "var(--warning)" }} />
              </div>
              <h3 style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--warning)" }}>{profile.totalScore.toLocaleString()}</h3>
              <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: "0.35rem" }}>Total points earned</p>
            </div>

            <div className="card glow-border animate-fade-in" style={{ padding: "1.25rem", animationDelay: "40ms" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <span style={{ color: "var(--muted-foreground)", fontSize: "0.85rem", fontWeight: 600 }}>Quizzes Played</span>
                <Target size={20} style={{ color: "var(--primary)" }} />
              </div>
              <h3 style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--primary)" }}>{profile.totalQuizzes}</h3>
              <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: "0.35rem" }}>Completed quizzes</p>
            </div>

            <div className="card glow-border animate-fade-in" style={{ padding: "1.25rem", animationDelay: "80ms" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <span style={{ color: "var(--muted-foreground)", fontSize: "0.85rem", fontWeight: 600 }}>Questions Answered</span>
                <BookOpen size={20} style={{ color: "var(--accent)" }} />
              </div>
              <h3 style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--accent)" }}>{profile.totalQuestions}</h3>
              <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: "0.35rem" }}>{profile.correctAnswers} Correct</p>
            </div>

            <div className="card glow-border animate-fade-in" style={{ padding: "1.25rem", animationDelay: "120ms" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <span style={{ color: "var(--muted-foreground)", fontSize: "0.85rem", fontWeight: 600 }}>Current Streak</span>
                <Flame size={20} style={{ color: "hsl(15, 90%, 55%)" }} />
              </div>
              <h3 style={{ fontSize: "2.25rem", fontWeight: 800, color: "hsl(15, 90%, 55%)" }}>{profile.currentStreak} 🔥</h3>
              <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: "0.35rem" }}>Daily streak count</p>
            </div>

            <div className="card glow-border animate-fade-in" style={{ padding: "1.25rem", animationDelay: "160ms" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <span style={{ color: "var(--muted-foreground)", fontSize: "0.85rem", fontWeight: 600 }}>Accuracy Rate</span>
                <Zap size={20} style={{ color: "var(--success)" }} />
              </div>
              <h3 style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--success)" }}>{winRate}%</h3>
              <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: "0.35rem" }}>Precision percentage</p>
            </div>

          </div>
        </div>

        {/* Profile Tabs */}
        <div className="profile-tabs" style={{ marginBottom: "2rem" }}>
          <button
            className={`profile-tab ${activeTab === "stats" ? "active" : ""}`}
            onClick={() => setActiveTab("stats")}
          >
            <TrendingUp size={16} /> Statistics & Mastery
          </button>
          <button
            className={`profile-tab ${activeTab === "achievements" ? "active" : ""}`}
            onClick={() => setActiveTab("achievements")}
          >
            <Award size={16} /> Achievements
          </button>
          <button
            className={`profile-tab ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <Calendar size={16} /> Quiz History
          </button>
          <button
            className={`profile-tab ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            <Lock size={16} /> Security
          </button>
        </div>

        {/* Tab Content */}
        <div className="card glow-border animate-fade-in" style={{ padding: "2rem", marginBottom: "2rem" }}>
          {activeTab === "stats" ? (
            <div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>📊 Detailed Analytics</h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
                <div style={{ padding: "1.25rem", background: "var(--secondary)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <Trophy size={18} style={{ color: "var(--warning)" }} />
                    <p style={{ color: "var(--muted-foreground)", fontSize: "0.85rem", fontWeight: 600 }}>Average Score Per Quiz</p>
                  </div>
                  <h4 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--warning)" }}>{avgScore} pts</h4>
                </div>

                <div style={{ padding: "1.25rem", background: "var(--secondary)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <Star size={18} style={{ color: "var(--primary)" }} />
                    <p style={{ color: "var(--muted-foreground)", fontSize: "0.85rem", fontWeight: 600 }}>Total Correct Answers</p>
                  </div>
                  <h4 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--primary)" }}>{profile.correctAnswers} / {profile.totalQuestions}</h4>
                </div>

                <div style={{ padding: "1.25rem", background: "var(--secondary)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <Flame size={18} style={{ color: "var(--accent)" }} />
                    <p style={{ color: "var(--muted-foreground)", fontSize: "0.85rem", fontWeight: 600 }}>Streak Health</p>
                  </div>
                  <h4 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent)" }}>{profile.currentStreak} Days</h4>
                </div>
              </div>

              {/* Subject Mastery Breakdown */}
              <div>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Layers size={18} style={{ color: "var(--primary)" }} /> Subject Mastery & Accuracy Breakdown
                </h4>

                {subjectStatsList.length === 0 ? (
                  <p style={{ color: "var(--muted-foreground)", fontSize: "0.9rem" }}>Play quizzes in different subjects to unlock subject mastery cards!</p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                    {subjectStatsList.map((item) => (
                      <div key={item.subject} style={{ padding: "1rem", background: "var(--secondary)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                          <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{item.subject}</span>
                          <span style={{ fontWeight: 800, color: "var(--success)", fontSize: "0.9rem" }}>{item.accuracy}% Acc</span>
                        </div>
                        <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginBottom: "0.75rem" }}>
                          {item.count} Quiz{item.count === 1 ? "" : "zes"} • {item.score} Total Pts
                        </p>
                        <div style={{ height: "6px", background: "var(--input)", borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ 
                            height: "100%", 
                            width: `${item.accuracy}%`, 
                            background: item.accuracy >= 70 ? "var(--gradient-success)" : "var(--gradient-primary)",
                            transition: "width 0.4s ease" 
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : activeTab === "achievements" ? (
            <div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>🏆 Player Badges & Achievements</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem" }}>
                
                <div style={{ padding: "1.25rem", background: "var(--secondary)", borderRadius: "var(--radius)", textAlign: "center", border: profile.totalQuizzes >= 1 ? "1px solid var(--primary)" : "1px solid var(--border)", opacity: profile.totalQuizzes >= 1 ? 1 : 0.45 }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📝</div>
                  <p style={{ fontSize: "0.9rem", fontWeight: 700 }}>First Steps</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Complete 1 quiz</p>
                  {profile.totalQuizzes >= 1 && <span className="badge" style={{ marginTop: "0.5rem", fontSize: "0.65rem", background: "var(--success)", color: "#fff" }}>UNLOCKED</span>}
                </div>

                <div style={{ padding: "1.25rem", background: "var(--secondary)", borderRadius: "var(--radius)", textAlign: "center", border: profile.totalQuizzes >= 5 ? "1px solid var(--primary)" : "1px solid var(--border)", opacity: profile.totalQuizzes >= 5 ? 1 : 0.45 }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>⚡</div>
                  <p style={{ fontSize: "0.9rem", fontWeight: 700 }}>Quiz Starter</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Complete 5 quizzes</p>
                  {profile.totalQuizzes >= 5 && <span className="badge" style={{ marginTop: "0.5rem", fontSize: "0.65rem", background: "var(--success)", color: "#fff" }}>UNLOCKED</span>}
                </div>

                <div style={{ padding: "1.25rem", background: "var(--secondary)", borderRadius: "var(--radius)", textAlign: "center", border: profile.totalQuizzes >= 10 ? "1px solid var(--primary)" : "1px solid var(--border)", opacity: profile.totalQuizzes >= 10 ? 1 : 0.45 }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🚀</div>
                  <p style={{ fontSize: "0.9rem", fontWeight: 700 }}>Quiz Master</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Complete 10 quizzes</p>
                  {profile.totalQuizzes >= 10 && <span className="badge" style={{ marginTop: "0.5rem", fontSize: "0.65rem", background: "var(--success)", color: "#fff" }}>UNLOCKED</span>}
                </div>

                <div style={{ padding: "1.25rem", background: "var(--secondary)", borderRadius: "var(--radius)", textAlign: "center", border: profile.accuracy >= 80 ? "1px solid var(--primary)" : "1px solid var(--border)", opacity: profile.accuracy >= 80 ? 1 : 0.45 }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🎯</div>
                  <p style={{ fontSize: "0.9rem", fontWeight: 700 }}>Sharpshooter</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>80%+ accuracy</p>
                  {profile.accuracy >= 80 && <span className="badge" style={{ marginTop: "0.5rem", fontSize: "0.65rem", background: "var(--success)", color: "#fff" }}>UNLOCKED</span>}
                </div>

                <div style={{ padding: "1.25rem", background: "var(--secondary)", borderRadius: "var(--radius)", textAlign: "center", border: profile.currentStreak >= 3 ? "1px solid var(--primary)" : "1px solid var(--border)", opacity: profile.currentStreak >= 3 ? 1 : 0.45 }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🔥</div>
                  <p style={{ fontSize: "0.9rem", fontWeight: 700 }}>On Fire</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>3+ Day streak</p>
                  {profile.currentStreak >= 3 && <span className="badge" style={{ marginTop: "0.5rem", fontSize: "0.65rem", background: "var(--success)", color: "#fff" }}>UNLOCKED</span>}
                </div>

                <div style={{ padding: "1.25rem", background: "var(--secondary)", borderRadius: "var(--radius)", textAlign: "center", border: profile.totalScore >= 100 ? "1px solid var(--primary)" : "1px solid var(--border)", opacity: profile.totalScore >= 100 ? 1 : 0.45 }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>💯</div>
                  <p style={{ fontSize: "0.9rem", fontWeight: 700 }}>Centurion</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>100+ points</p>
                  {profile.totalScore >= 100 && <span className="badge" style={{ marginTop: "0.5rem", fontSize: "0.65rem", background: "var(--success)", color: "#fff" }}>UNLOCKED</span>}
                </div>

                <div style={{ padding: "1.25rem", background: "var(--secondary)", borderRadius: "var(--radius)", textAlign: "center", border: profile.totalScore >= 1000 ? "1px solid var(--primary)" : "1px solid var(--border)", opacity: profile.totalScore >= 1000 ? 1 : 0.45 }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>💎</div>
                  <p style={{ fontSize: "0.9rem", fontWeight: 700 }}>Diamond Mind</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>1000+ points</p>
                  {profile.totalScore >= 1000 && <span className="badge" style={{ marginTop: "0.5rem", fontSize: "0.65rem", background: "var(--success)", color: "#fff" }}>UNLOCKED</span>}
                </div>

              </div>
            </div>
          ) : activeTab === "history" ? (
            <div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>📜 Quiz History & Review</h3>
              
              {loadingHistory ? (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                  <div className="animate-spin" style={{ fontSize: "1.5rem" }}>⚡</div>
                  <p style={{ marginTop: "0.5rem", color: "var(--muted-foreground)" }}>Loading history...</p>
                </div>
              ) : quizHistory.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", background: "var(--secondary)", borderRadius: "var(--radius)" }}>
                  <BookOpen size={48} style={{ margin: "0 auto 1rem", opacity: 0.2 }} />
                  <p style={{ color: "var(--muted-foreground)" }}>No quizzes played yet. Start your first quiz today!</p>
                  <button className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={() => navigate("/dashboard")}>
                    Go to Dashboard
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {quizHistory.map((quiz) => (
                    <div 
                      key={quiz._id} 
                      className="card glass glow-border animate-fade-in" 
                      style={{ padding: "1.25rem", cursor: "pointer", transition: "transform 0.2s" }}
                      onClick={() => setSelectedQuiz(quiz)}
                      onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                      onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                            <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>{quiz.subject}</span>
                            <span className="badge" style={{ fontSize: "0.7rem", background: "var(--primary-foreground)", color: "var(--primary)" }}>
                              {quiz.mode ? quiz.mode.toUpperCase() : "QUIZ"}
                            </span>
                          </div>
                          <p style={{ fontSize: "0.85rem", color: "var(--muted-foreground)" }}>
                            {formatDate(quiz.createdAt)} • {quiz.topics?.length > 0 ? quiz.topics.join(", ") : "General Topics"}
                          </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--warning)" }}>{quiz.score} pts</p>
                          <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                            {quiz.correctAnswers}/{quiz.totalQuestions} Correct ({Math.round((quiz.correctAnswers / (quiz.totalQuestions || 1)) * 100)}%)
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quiz Detail Modal */}
              {selectedQuiz && (
                <div style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  background: "rgba(0,0,0,0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1000,
                  padding: "1rem"
                }}>
                  <div className="card glow-border animate-scale-in" style={{ 
                    width: "min(800px, 100%)", 
                    maxHeight: "90vh", 
                    overflowY: "auto",
                    background: "var(--background)",
                    padding: "2rem",
                    position: "relative"
                  }}>
                    <button 
                      onClick={() => setSelectedQuiz(null)}
                      style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "var(--foreground)", cursor: "pointer" }}
                    >
                      <X size={24} />
                    </button>
                    
                    <h2 style={{ marginBottom: "0.5rem" }}>{selectedQuiz.subject} Quiz Review</h2>
                    <p style={{ color: "var(--muted-foreground)", marginBottom: "1.5rem" }}>
                      {formatDate(selectedQuiz.createdAt)} • Score: {selectedQuiz.score} pts • Accuracy: {Math.round((selectedQuiz.correctAnswers / (selectedQuiz.totalQuestions || 1)) * 100)}%
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      {(selectedQuiz.questions || []).map((q, idx) => (
                        <div key={idx} style={{ padding: "1.25rem", background: "var(--secondary)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                          <p style={{ fontWeight: 600, marginBottom: "1rem" }}>{idx + 1}. {q.question}</p>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
                            {q.options.map((opt, optIdx) => {
                              const isCorrect = optIdx === q.correctAnswer;
                              const isUserAnswer = optIdx === q.userAnswer;
                              
                              let border = "1px solid var(--border)";
                              let bg = "transparent";
                              
                              if (isCorrect) {
                                border = "2px solid var(--success)";
                                bg = "rgba(160, 200, 100, 0.1)";
                              } else if (isUserAnswer && !isCorrect) {
                                border = "2px solid var(--destructive)";
                                bg = "rgba(200, 100, 100, 0.1)";
                              }

                              return (
                                <div key={optIdx} style={{ 
                                  padding: "0.75rem", 
                                  borderRadius: "var(--radius)", 
                                  border, 
                                  background: bg,
                                  fontSize: "0.9rem",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between"
                                }}>
                                  <span>{opt}</span>
                                  {isCorrect && <Check size={16} color="var(--success)" />}
                                  {isUserAnswer && !isCorrect && <X size={16} color="var(--destructive)" />}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>🔐 Change Password</h3>
              {!changingPassword ? (
                <button
                  className="btn btn-outline"
                  onClick={() => setChangingPassword(true)}
                  style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
                >
                  <Lock size={16} /> Update Password
                </button>
              ) : (
                <div style={{ maxWidth: "400px" }}>
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 500 }}>
                      New Password
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPassword ? "text" : "password"}
                        className="input"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters, 1 uppercase, 1 number"
                        style={{ paddingRight: "2.5rem" }}
                      />
                      <button
                        style={{
                          position: "absolute",
                          right: "0.75rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "var(--muted-foreground)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "0.5rem"
                        }}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 500 }}>
                      Confirm Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                    />
                  </div>

                  {passwordMsg && (
                    <div style={{
                      padding: "0.75rem",
                      background: passwordMsg.includes("✓") ? "rgba(160, 200, 100, 0.1)" : "rgba(200, 100, 100, 0.1)",
                      borderRadius: "var(--radius)",
                      marginBottom: "1rem",
                      fontSize: "0.875rem",
                      color: passwordMsg.includes("✓") ? "var(--success)" : "var(--destructive)"
                    }}>
                      {passwordMsg}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button
                      className="btn btn-primary"
                      onClick={handleChangePassword}
                    >
                      <Check size={16} /> Save Changes
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => {
                        setChangingPassword(false);
                        setNewPassword("");
                        setConfirmPassword("");
                        setPasswordMsg("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sign Out Button */}
        <button
          className="btn btn-outline btn-full"
          style={{ color: "var(--accent)", borderColor: "var(--accent)", padding: "0.75rem" }}
          onClick={signOut}
        >
          <LogOut size={18} /> Sign Out
        </button>
      </main>
    </div>
  );
};

export default Profile;
