import React, { useState, useMemo } from "react";
import SubjectCard from "./SubjectCard";
import { SUBJECTS_DATA, SUBJECT_CATEGORIES } from "@/data/subjectsData";
import { Search, X, Sparkles } from "lucide-react";

const SubjectSelector = ({ selectedSubject, onSelect }) => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSubjects = useMemo(() => {
    return SUBJECTS_DATA.filter((subject) => {
      const matchesCategory =
        activeCategory === "all" || subject.category === activeCategory;
      const matchesSearch =
        subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.topics.some((t) =>
          t.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="subject-selector-wrapper">
      <div className="subject-selector-top">
        <div className="subject-categories-tabs">
          {SUBJECT_CATEGORIES.map((cat) => {
            const CatIcon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                className={`category-tab ${isActive ? "active" : ""}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <CatIcon className="category-tab-icon" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        <div className="subject-search-box">
          <Search className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search subjects or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery("")}
            >
              <X className="clear-icon" />
            </button>
          )}
        </div>
      </div>

      {filteredSubjects.length === 0 ? (
        <div className="subject-empty-state">
          <Sparkles className="empty-icon" />
          <p className="empty-title">No subjects found</p>
          <p className="empty-desc">
            Try adjusting your search query or category filter
          </p>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => {
              setActiveCategory("all");
              setSearchQuery("");
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="subject-card-grid">
          {filteredSubjects.map((subject, index) => (
            <div
              key={subject.id}
              className="animate-card-pop"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <SubjectCard
                subject={subject}
                isSelected={selectedSubject === subject.name}
                onSelect={onSelect}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubjectSelector;
