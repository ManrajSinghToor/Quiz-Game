import React from "react";
import { Check, Layers } from "lucide-react";

const SubjectCard = ({ subject, isSelected, onSelect }) => {
  const IconComponent = subject.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(subject.name)}
      className={`subject-card ${isSelected ? "selected" : ""}`}
      style={{
        "--subject-color": subject.color,
        "--subject-gradient": subject.gradient
      }}
    >
      <div className="subject-card-header">
        <div className="subject-card-icon-box">
          <IconComponent className="subject-card-icon" />
        </div>
        <div className={`subject-card-check ${isSelected ? "checked" : ""}`}>
          <Check className="subject-card-check-icon" />
        </div>
      </div>

      <div className="subject-card-body">
        <h3 className="subject-card-title">{subject.name}</h3>
        <p className="subject-card-desc">{subject.description}</p>
      </div>

      <div className="subject-card-footer">
        <span className="subject-card-pill">
          <Layers className="pill-icon" />
          {subject.topics.length} Topics
        </span>
        <span className="subject-card-category-badge">
          {subject.category.toUpperCase()}
        </span>
      </div>
    </button>
  );
};

export default SubjectCard;
