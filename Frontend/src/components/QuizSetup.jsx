import React from "react";
import SubjectSelector from "./SubjectSelector";
import TopicSelector from "./TopicSelector";
import { getSubjectByName } from "@/data/subjectsData";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Zap,
  Swords,
  Clock,
  Trophy,
  Sliders,
  Play,
  Loader2,
  Sparkles,
  ChevronRight,
  Gauge
} from "lucide-react";

import DailyChallengeSetup from "./DailyChallengeSetup";

const MODE_CONFIGS = {
  normal: {
    title: "Normal Quiz",
    subtitle: "Practice and sharpen your skills with customized questions",
    icon: BookOpen,
    color: "var(--primary)",
    badge: "CLASSIC",
    timePerQ: 30,
    pointsPerQ: 14
  },
  daily: {
    title: "Daily Challenge",
    subtitle: "Compete in today's global daily challenge",
    icon: Calendar,
    color: "var(--game-daily)",
    badge: "DAILY CROWN",
    timePerQ: 20,
    pointsPerQ: 12
  },
  speed: {
    title: "Speed Quiz",
    subtitle: "Fast-paced quiz mode under tight time limits",
    icon: Zap,
    color: "var(--game-speed)",
    badge: "RACE CLOCK",
    timePerQ: 10,
    pointsPerQ: 10
  },
  battle: {
    title: "Battle Mode",
    subtitle: "Real-time 1v1 PvP quiz duels",
    icon: Swords,
    color: "var(--game-battle)",
    badge: "MULTIPLAYER",
    timePerQ: 20,
    pointsPerQ: 20
  }
};

const DIFFICULTY_LEVELS = [
  { id: "10", label: "Beginner", desc: "Foundational & easy concepts", color: "#10b981" },
  { id: "12", label: "Intermediate", desc: "Core syllabus & moderate questions", color: "#f59e0b" },
  { id: "14", label: "Advanced", desc: "Challenging & deep problem solving", color: "#ef4444" },
  { id: "all", label: "Mixed Level", desc: "Balanced blend of all difficulties", color: "#8b5cf6" }
];

const QUESTION_COUNT_PRESETS = [5, 10, 15, 20, 25, 30];

const QuizSetup = ({
  mode = "normal",
  selectedSubject,
  onSelectSubject,
  selectedTopics,
  onToggleTopic,
  onSelectAllTopics,
  onClearTopics,
  questionCount,
  setQuestionCount,
  classLevel,
  setClassLevel,
  onStartQuiz,
  isLoading,
  loadError,
  onBackToDashboard
}) => {
  if (mode === "daily") {
    return (
      <DailyChallengeSetup
        onStartDailyQuiz={(todaySubj) => {
          onSelectSubject(todaySubj);
          onStartQuiz(todaySubj);
        }}
        isLoading={isLoading}
        loadError={loadError}
        onBackToDashboard={onBackToDashboard}
      />
    );
  }

  const modeInfo = MODE_CONFIGS[mode] || MODE_CONFIGS.normal;
  const ModeIcon = modeInfo.icon;
  const subjectObj = getSubjectByName(selectedSubject);

  const totalEstSeconds = questionCount * modeInfo.timePerQ;
  const estMinutes = Math.ceil(totalEstSeconds / 60);
  const maxPossibleScore = questionCount * modeInfo.pointsPerQ;

  return (
    <div className="quiz-setup-container animate-fade-in">
      {/* Quiz Header Bar */}
      <header className="quiz-setup-header glass">
        <div className="quiz-setup-header-left">
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={onBackToDashboard}
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div
            className="mode-badge-icon"
            style={{ backgroundColor: `${modeInfo.color}18`, color: modeInfo.color }}
          >
            <ModeIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="mode-title-row">
              <h1 className="mode-title">{modeInfo.title}</h1>
              <span
                className="mode-badge-pill"
                style={{ backgroundColor: `${modeInfo.color}22`, color: modeInfo.color }}
              >
                {modeInfo.badge}
              </span>
            </div>
            <p className="mode-subtitle">{modeInfo.subtitle}</p>
          </div>
        </div>
      </header>

      <main className="quiz-setup-content">
        {/* Step 1: Select Subject */}
        <section className="setup-section">
          <div className="setup-section-header">
            <div className="setup-step-number">1</div>
            <div>
              <h2 className="setup-section-title">Choose Subject</h2>
              <p className="setup-section-desc">
                Select a subject area to test your knowledge
              </p>
            </div>
          </div>

          <SubjectSelector
            selectedSubject={selectedSubject}
            onSelect={(subj) => {
              onSelectSubject(subj);
            }}
          />
        </section>

        {/* Step 2: Select Specific Topics */}
        {selectedSubject && (
          <section className="setup-section animate-scale-in">
            <div className="setup-section-header">
              <div className="setup-step-number">2</div>
              <div>
                <h2 className="setup-section-title">Refine Topics (Optional)</h2>
                <p className="setup-section-desc">
                  Filter questions to focus on specific chapters or topics in {selectedSubject}
                </p>
              </div>
            </div>

            <TopicSelector
              subject={selectedSubject}
              selectedTopics={selectedTopics}
              onToggleTopic={onToggleTopic}
              onSelectAllTopics={onSelectAllTopics}
              onClearTopics={onClearTopics}
            />
          </section>
        )}

        {/* Step 3: Quiz Parameters */}
        <section className="setup-section">
          <div className="setup-section-header">
            <div className="setup-step-number">3</div>
            <div>
              <h2 className="setup-section-title">Quiz Settings</h2>
              <p className="setup-section-desc">
                Configure question count and difficulty level
              </p>
            </div>
          </div>

          <div className="quiz-params-grid">
            {/* Question Count Card */}
            <div className="param-card glow-border">
              <div className="param-card-header">
                <Sliders className="param-icon" />
                <span>Number of Questions</span>
              </div>
              <div className="preset-pills-row">
                {QUESTION_COUNT_PRESETS.map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    className={`preset-pill ${questionCount === cnt ? "selected" : ""}`}
                    onClick={() => setQuestionCount(cnt)}
                  >
                    {cnt} Qs
                  </button>
                ))}
              </div>
              <div className="counter-row">
                <span className="counter-label">Custom count:</span>
                <div className="counter-controls">
                  <button
                    type="button"
                    className="counter-btn"
                    onClick={() => setQuestionCount(Math.max(1, questionCount - 1))}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={questionCount}
                    onChange={(e) =>
                      setQuestionCount(
                        Math.min(Math.max(Number(e.target.value) || 1, 1), 50)
                      )
                    }
                    className="counter-input"
                  />
                  <button
                    type="button"
                    className="counter-btn"
                    onClick={() => setQuestionCount(Math.min(50, questionCount + 1))}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Difficulty Level Card */}
            <div className="param-card glow-border">
              <div className="param-card-header">
                <Gauge className="param-icon" />
                <span>Difficulty Level</span>
              </div>
              <div className="difficulty-grid">
                {DIFFICULTY_LEVELS.map((lvl) => {
                  const isSelected = classLevel === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      className={`difficulty-card ${isSelected ? "selected" : ""}`}
                      style={{ "--lvl-color": lvl.color }}
                      onClick={() => setClassLevel(lvl.id)}
                    >
                      <div className="difficulty-name">{lvl.label}</div>
                      <div className="difficulty-desc">{lvl.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Step 4: Summary & Launch Bar */}
        <div className="quiz-launch-card glow-border animate-fade-in">
          <div className="launch-summary-left">
            <div className="summary-subject-pill" style={{ "--subj-color": subjectObj.color }}>
              <Sparkles className="w-4 h-4" />
              <span>{selectedSubject || "Select a subject"}</span>
            </div>

            <div className="summary-stats-list">
              <div className="summary-stat-item">
                <Clock className="w-4 h-4 text-muted" />
                <span>~{estMinutes} Mins</span>
              </div>
              <div className="summary-stat-divider">•</div>
              <div className="summary-stat-item">
                <Trophy className="w-4 h-4 text-muted" />
                <span>Up to {maxPossibleScore} Pts</span>
              </div>
              <div className="summary-stat-divider">•</div>
              <div className="summary-stat-item">
                <span>{selectedTopics.length === 0 ? "All topics" : `${selectedTopics.length} topics selected`}</span>
              </div>
            </div>
          </div>

          <div className="launch-action-right">
            {loadError && (
              <p className="launch-error-msg">{loadError}</p>
            )}

            <button
              type="button"
              className="btn btn-launch-quiz gradient-primary animate-shine"
              onClick={onStartQuiz}
              disabled={isLoading || !selectedSubject}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5" />
                  <span>Generating AI Questions...</span>
                </>
              ) : (
                <>
                  <span>Start {selectedSubject} Quiz</span>
                  <Play className="w-5 h-5 fill-current" />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuizSetup;
