import { useState, useEffect } from "react";
import Header from "@/components/Header";
import LeaderboardItem from "@/components/LeaderboardItem";
import AnimatedBackground from "@/components/AnimatedBackground";
import { Trophy, Medal, Award, Crown, Users, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "@/contexts/SocketContext";
import { getApiBase } from "../lib/utils";

type LeaderboardEntry = {
  rank: number;
  name: string;
  score: number;
  quizzes?: number;
  correctAnswers?: number;
  accuracy?: number;
  avatar?: number;
};

type UserRank = {
  rank: number;
  name: string;
  score: number;
  avatar: string;
} | null;

const Leaderboard = () => {
  const navigate = useNavigate();
  const { socket, onlineCount } = useSocket();

  const [activeTab, setActiveTab] = useState("alltime");
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<UserRank>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("leaderboard:updated", () => {
      console.log("Live Socket: Leaderboard update signal received");
      fetchLeaderboard();
    });

    return () => {
      socket.off("leaderboard:updated");
    };
  }, [socket]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/api/auth/leaderboard?limit=50`);
      const data = await response.json();
      setLeaderboardData(data);

      // Get current user's rank
      const token = localStorage.getItem("token");
      if (token) {
        const profileRes = await fetch(`${apiBase}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const profileData = await profileRes.json();

        // Find user's rank in leaderboard
        const rank = data.findIndex((user: LeaderboardEntry) => user.name === profileData.name);
        if (rank !== -1) {
          setUserRank({
            rank: rank + 1,
            name: profileData.name,
            score: profileData.totalScore || 0,
            avatar: profileData.name ? profileData.name.charAt(0).toUpperCase() : "U",
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentData = leaderboardData;

  const TopThree = ({ data }: { data: LeaderboardEntry[] }) => {
    const p1 = data[0] || { name: "Player 1", score: 0 };
    const p2 = data[1] || null;
    const p3 = data[2] || null;

    return (
      <div className="podium">
        {/* Second Place */}
        {p2 ? (
          <div className="podium-player animate-fade-in" style={{ animationDelay: "100ms" }}>
            <div className="podium-avatar">
              <div className="podium-avatar-circle second">{p2.name.charAt(0).toUpperCase()}</div>
              <div className="podium-medal" style={{ background: "hsla(215, 20%, 65%, 0.3)" }}>
                <Medal style={{ color: "var(--muted-foreground)" }} />
              </div>
            </div>
            <p className="podium-name">{p2.name.split(" ")[0]}</p>
            <p className="podium-pts">{(p2.score || 0).toLocaleString()} pts</p>
            <div className="podium-bar second"><span className="podium-bar-num second">2</span></div>
          </div>
        ) : (
          <div className="podium-player opacity-40">
            <div className="podium-avatar">
              <div className="podium-avatar-circle second">?</div>
            </div>
            <p className="podium-name">Awaiting...</p>
            <p className="podium-pts">0 pts</p>
            <div className="podium-bar second"><span className="podium-bar-num second">2</span></div>
          </div>
        )}

        {/* First Place */}
        <div className="podium-player animate-fade-in">
          <div className="podium-avatar">
            <div className="podium-avatar-circle first gradient-accent" style={{ color: "var(--accent-foreground)" }}>
              {p1.name.charAt(0).toUpperCase()}
            </div>
            <div className="podium-crown"><Crown /></div>
          </div>
          <p className="podium-name first">{p1.name.split(" ")[0]}</p>
          <p className="podium-pts">{(p1.score || 0).toLocaleString()} pts</p>
          <div className="podium-bar first gradient-primary"><span className="podium-bar-num first">1</span></div>
        </div>

        {/* Third Place */}
        {p3 ? (
          <div className="podium-player animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="podium-avatar">
              <div className="podium-avatar-circle third">{p3.name.charAt(0).toUpperCase()}</div>
              <div className="podium-medal" style={{ background: "hsla(340, 85%, 60%, 0.2)" }}>
                <Award style={{ color: "var(--accent)" }} />
              </div>
            </div>
            <p className="podium-name">{p3.name.split(" ")[0]}</p>
            <p className="podium-pts">{(p3.score || 0).toLocaleString()} pts</p>
            <div className="podium-bar third"><span className="podium-bar-num third">3</span></div>
          </div>
        ) : (
          <div className="podium-player opacity-40">
            <div className="podium-avatar">
              <div className="podium-avatar-circle third">?</div>
            </div>
            <p className="podium-name">Awaiting...</p>
            <p className="podium-pts">0 pts</p>
            <div className="podium-bar third"><span className="podium-bar-num third">3</span></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page">
      <AnimatedBackground variant="mesh" />
      <Header />

      <main className="container" style={{ paddingTop: "2rem", paddingBottom: "2rem", maxWidth: "42rem" }}>
        <div className="leaderboard-page-title animate-fade-in">
          <div className="leaderboard-trophy gradient-primary">
            <Trophy />
          </div>
          <h1>Leaderboard</h1>
          <p>Compete with other players and climb the ranks!</p>

          <div className="online-indicator" style={{ margin: "0.75rem auto 0", width: "fit-content" }}>
            <div className="pulse-dot" />
            <Users style={{ width: "0.875rem", height: "0.875rem" }} />
            <span style={{ fontWeight: 700 }}>{onlineCount} Player{onlineCount === 1 ? "" : "s"} Online Now</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-list">
          {[
            { key: "alltime", label: "Top Players" },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`tab-trigger ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--muted-foreground)" }}>
            <p>Loading leaderboard...</p>
          </div>
        ) : currentData.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--muted-foreground)" }}>
            <p>No players yet. Be the first to take a quiz!</p>
          </div>
        ) : (
          <>
            <TopThree data={currentData} />

            <div className="card glow-border" style={{ padding: "1rem" }}>
              {currentData.slice(3).map((player, index) => (
                <div key={player.rank} className="animate-fade-in" style={{ animationDelay: `${(index + 3) * 50}ms` }}>
                  <LeaderboardItem {...player} />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Your Rank */}
        <div className="your-rank animate-fade-in">
          <div className="your-rank-inner">
            <div className="your-rank-left">
              <div className="your-rank-avatar">{userRank?.avatar || "?"}</div>
              <div className="your-rank-info">
                <p>{userRank ? userRank.name : "Your Ranking"}</p>
                <small>{userRank ? "See where you stand!" : "Log in to see your rank!"}</small>
              </div>
            </div>
            <div className="your-rank-right">
              <p className="your-rank-num">#{userRank?.rank || "N/A"}</p>
              <p className="your-rank-pts">{userRank ? userRank.score.toLocaleString() : "0"} pts</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;
