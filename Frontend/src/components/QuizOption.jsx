import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

const QuizOption = ({ option, label, isSelected, isCorrect, isRevealed, onClick, disabled }) => {
  const getOptionClass = () => {
    if (!isRevealed) {
      return isSelected ? "selected" : "";
    }
    if (isCorrect === true) return "correct";
    if (isCorrect === false && isSelected) return "incorrect";
    return "faded";
  };

  const getLabelClass = () => {
    if (!isRevealed) return isSelected ? "selected" : "default";
    if (isCorrect === true) return "correct";
    if (isCorrect === false && isSelected) return "incorrect";
    return "default";
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || isRevealed}
      className={cn("quiz-option", getOptionClass())}
    >
      <div className="quiz-option-inner">
        <div className={cn("quiz-option-label", getLabelClass())}>
          {isRevealed && isCorrect === true ? (
            <Check style={{ width: "1.25rem", height: "1.25rem" }} />
          ) : isRevealed && isCorrect === false && isSelected ? (
            <X style={{ width: "1.25rem", height: "1.25rem" }} />
          ) : (
            label
          )}
        </div>
        <span className="quiz-option-text">{option}</span>
      </div>
    </button>
  );
};

export default QuizOption;
