import React, { useState, useEffect } from "react";
import {
  getTodayDailySubject,
  getFormattedTodayDate,
  getTimeUntilMidnight,
  getDailyChallengeCompletionState
} from "@/data/dailyChallengeData";
import {
  Crown,
  Calendar,
  Flame,
  Clock,
  CheckCircle2,
  Play,
  ArrowLeft,
  Loader2,
  Sparkles,
  Trophy,
  Zap,
  Target,
  RotateCcw
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";

const DailyChallengeSetup = ({
  onStartDailyQuiz,
  isLoading,
  loadError,
  onBackToDashboard
}) => {
  const { user } = useAuth();
  const [countdown, setCountdown] = useState(getTimeUntilMidnight().formatted);
  const [completionState, setCompletionState] = useState(null);

  const todaySubject = getTodayDailySubject();
  const formattedDate = getFormattedTodayDate();
  const IconComponent = todaySubject.icon;

  useEffect(() => {
    // Clean up any old un-scoped generic legacy daily keys from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("daily_challenge_result_20")) {
        // If key is generic (e.g. daily_challenge_result_2026-07-23 with no user id/email segment)
        const parts = key.split("_");
        if (parts.length === 4) { // daily, challenge, result, date
          localStorage.removeItem(key);
        }
      }
    });

    // Check if current authenticated user already played today's challenge
    const record = getDailyChallengeCompletionState(user);
    setCompletionState(record);

    // Update countdown timer every second
    const timer = setInterval(() => {
      setCountdown(getTimeUntilMidnight().formatted);
    }, 1000);

    return () => clearInterval(timer);
  }, [user]);

  return (
    <div className="daily-setup-wrapper animate-fade-in">
      {/* Top Banner Header */}
      <header className="daily-setup-header glass glow-gold">
        <div className="daily-setup-header-left">
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={onBackToDashboard}
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="daily-crown-icon-badge">
            <Crown className="w-7 h-7 text-gold animate-bounce-slow" />
          </div>
          <div>
            <div className="daily-header-title-row">
              <h1 className="daily-header-title">Daily Challenge</h1>
              <span className="daily-badge-gold">
                <Sparkles className="w-3 h-3" /> 2X BONUS XP
              </span>
            </div>
            <p className="daily-header-date">
              <Calendar className="w-3.5 h-3.5 inline mr-1" />
              {formattedDate}
            </p>
          </div>
        </div>

        <div className="daily-setup-header-right">
          <div className="daily-reset-clock-box">
            <Clock className="w-4 h-4 text-gold" />
            <div className="daily-clock-text">
              <span className="clock-label">NEXT RESET IN</span>
              <span className="clock-ticker">{countdown}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="daily-setup-main">
        {completionState ? (
          /* View if User Already Completed Today's Challenge */
          <div className="daily-completed-card glow-border animate-scale-in">
            <div className="completed-icon-wrapper">
              <CheckCircle2 className="completed-check-icon text-success" />
            </div>

            <h2 className="completed-title">Daily Challenge Completed!</h2>
            <p className="completed-subtitle">
              Great job! You have conquered today's <strong>{todaySubject.name}</strong> challenge.
            </p>

            <div className="completed-stats-grid">
              <div className="completed-stat-card">
                <Trophy className="stat-card-icon text-gold" />
                <span className="stat-card-val">{completionState.score}</span>
                <span className="stat-card-lbl">Points Earned</span>
              </div>

              <div className="completed-stat-card">
                <Target className="stat-card-icon text-accent" />
                <span className="stat-card-val">{completionState.accuracy}%</span>
                <span className="stat-card-lbl">Accuracy</span>
              </div>

              <div className="completed-stat-card">
                <Flame className="stat-card-icon text-orange" />
                <span className="stat-card-val">Daily Flame</span>
                <span className="stat-card-lbl">Streak Preserved 🔥</span>
              </div>
            </div>

            <div className="next-challenge-banner">
              <Clock className="w-5 h-5 text-gold" />
              <div>
                <p className="next-banner-title">Tomorrow's Challenge Resets In</p>
                <p className="next-banner-time">{countdown}</p>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-gradient btn-xl mt-4"
              onClick={onBackToDashboard}
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          /* View to Start Today's Challenge */
          <div className="daily-hero-grid">
            {/* Featured Subject Hero Card */}
            <div className="daily-subject-hero-card glow-gold animate-card-pop">
              <div className="hero-card-badge">TODAY'S FEATURED THEME</div>

              <div className="hero-subject-header">
                <div
                  className="hero-subject-icon-box"
                  style={{
                    backgroundColor: `${todaySubject.color}20`,
                    color: todaySubject.color,
                    borderColor: todaySubject.color
                  }}
                >
                  <IconComponent className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="hero-subject-title">{todaySubject.name}</h2>
                  <span className="hero-subject-cat-tag">
                    {todaySubject.category.toUpperCase()} • DAILY EVENT
                  </span>
                </div>
              </div>

              <p className="hero-subject-desc">{todaySubject.description}</p>

              {/* Topics Covered Pill Tags */}
              <div className="hero-topics-section">
                <span className="hero-topics-heading">Topics Featured Today:</span>
                <div className="hero-topics-list">
                  {todaySubject.topics.map((t) => (
                    <span key={t} className="hero-topic-chip">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Daily Rules Row */}
              <div className="daily-rules-row">
                <div className="rule-item">
                  <Zap className="w-4 h-4 text-gold" />
                  <span>10 Questions</span>
                </div>
                <div className="rule-item">
                  <Clock className="w-4 h-4 text-gold" />
                  <span>20s per question</span>
                </div>
                <div className="rule-item">
                  <Trophy className="w-4 h-4 text-gold" />
                  <span>12 Pts per answer</span>
                </div>
              </div>
            </div>

            {/* Streak & Launch Side Drawer */}
            <div className="daily-launch-sidebar">
              {/* Streak Bonus Card */}
              <div className="streak-card glow-border animate-fade-in">
                <div className="streak-card-left">
                  <Flame className="w-7 h-7 text-orange animate-pulse" />
                  <div>
                    <h3 className="streak-title">Daily Streak Flame</h3>
                    <p className="streak-desc">Play 1 challenge daily to keep your flame burning!</p>
                  </div>
                </div>
                <div className="streak-badge-num">1X</div>
              </div>

              {/* Action Launch Container */}
              <div className="daily-launch-container glow-border">
                <h3 className="launch-box-title">Ready for Today's Duel?</h3>
                <p className="launch-box-desc">
                  One attempt available per day. Compete globally on <strong>{todaySubject.name}</strong>!
                </p>

                {loadError && <p className="launch-error-msg">{loadError}</p>}

                <button
                  type="button"
                  className="btn btn-launch-daily gradient-gold animate-shine"
                  onClick={() => onStartDailyQuiz(todaySubject.name)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5" />
                      <span>Loading Challenge...</span>
                    </>
                  ) : (
                    <>
                      <Crown className="w-5 h-5" />
                      <span>Play Today's Challenge</span>
                      <Play className="w-5 h-5 fill-current ml-auto" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DailyChallengeSetup;
