import { cn } from "@/lib/utils";
import { Trophy, Medal, Award } from "lucide-react";

const LeaderboardItem = ({ rank, name, score, quizzes, accuracy, isCurrentUser }) => {
  const getRankIcon = () => {
    switch (rank) {
      case 1: return <Trophy style={{ width: "1.25rem", height: "1.25rem", color: "var(--warning)" }} />;
      case 2: return <Medal style={{ width: "1.25rem", height: "1.25rem", color: "var(--muted-foreground)" }} />;
      case 3: return <Award style={{ width: "1.25rem", height: "1.25rem", color: "var(--accent)" }} />;
      default: return <span className="leaderboard-rank-num">{rank}</span>;
    }
  };

  const getInitials = (name) =>
    (name || "P").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const avatarBg = rank === 1 ? "hsla(45, 95%, 55%, 0.2)" :
    rank === 2 ? "var(--muted)" :
    rank === 3 ? "hsla(340, 85%, 60%, 0.2)" : "var(--secondary)";

  const avatarColor = rank === 1 ? "var(--warning)" :
    rank === 2 ? "var(--muted-foreground)" :
    rank === 3 ? "var(--accent)" : "var(--secondary-foreground)";

  return (
    <div className={cn("leaderboard-item", isCurrentUser && "current-user")}>
      <div className="leaderboard-rank">{getRankIcon()}</div>
      <div className="avatar" style={{ background: avatarBg, color: avatarColor }}>
        {getInitials(name)}
      </div>
      <div className="leaderboard-name" style={{ flexGrow: 1 }}>
        <p className={cn(isCurrentUser && "highlight")}>
          {name}
          {isCurrentUser && <span className="ml-1 text-xs text-primary font-bold">(You)</span>}
        </p>
        <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
          {quizzes !== undefined ? `${quizzes} Quizzes` : "Player"} • {accuracy !== undefined ? `${accuracy}% Acc` : ""}
        </p>
      </div>
      <div className="leaderboard-score" style={{ textAlign: "right" }}>
        <p style={{ fontWeight: 800 }}>{(score || 0).toLocaleString()}</p>
        <small style={{ color: "var(--muted-foreground)", fontSize: "0.72rem" }}>pts</small>
      </div>
    </div>
  );
};

export default LeaderboardItem;
