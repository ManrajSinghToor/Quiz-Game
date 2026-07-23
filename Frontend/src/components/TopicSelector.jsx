import React from 'react';
import { getSubjectByName } from '@/data/subjectsData';
import { Check, Layers, RotateCcw } from 'lucide-react';

const TopicSelector = ({ subject, selectedTopics = [], onToggleTopic, onSelectAllTopics, onClearTopics }) => {
  const subjectObj = getSubjectByName(subject);

  if (!subjectObj || !subjectObj.topics || subjectObj.topics.length === 0) {
    return null;
  }

  const allTopics = subjectObj.topics;
  const isAllSelected = allTopics.every(t => selectedTopics.includes(t));

  return (
    <div className="topic-selector-container animate-fade-in">
      <div className="topic-selector-header">
        <div className="topic-selector-title">
          <Layers className="topic-header-icon" style={{ color: subjectObj.color }} />
          <span>Select Specific Topics</span>
          <span className="topic-badge">
            {selectedTopics.length === 0 ? "All Selected" : `${selectedTopics.length}/${allTopics.length}`}
          </span>
        </div>

        <div className="topic-selector-actions">
          <button
            type="button"
            className="topic-action-btn"
            onClick={isAllSelected ? onClearTopics : () => onSelectAllTopics(allTopics)}
          >
            {isAllSelected ? (
              <>
                <RotateCcw className="action-icon" /> Clear Filter
              </>
            ) : (
              <>
                <Check className="action-icon" /> Select All
              </>
            )}
          </button>
        </div>
      </div>

      <div className="topic-chips-grid">
        {allTopics.map((topic, index) => {
          const isSelected = selectedTopics.includes(topic);
          return (
            <button
              key={topic}
              type="button"
              className={`topic-chip ${isSelected ? "selected" : ""}`}
              onClick={() => onToggleTopic(topic)}
              style={{
                "--chip-color": subjectObj.color,
                animationDelay: `${index * 30}ms`
              }}
            >
              <span className="topic-chip-check">
                <Check className="chip-check-icon" />
              </span>
              <span className="topic-chip-label">{topic}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TopicSelector;
