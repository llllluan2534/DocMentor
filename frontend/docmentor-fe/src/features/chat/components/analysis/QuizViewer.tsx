import React, { useState } from "react";
import { FiX, FiArrowRight } from "react-icons/fi";
import { QuizQuestion } from "@/services/analysis/analysisService";

interface QuizViewerProps {
  questions: QuizQuestion[];
  onClose: () => void;
}

export const QuizViewer: React.FC<QuizViewerProps> = ({
  questions,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const currentQ = questions[currentIndex];

  const handleSelect = (opt: string) => {
    if (isSubmitted) return;
    setSelectedOption(opt);
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    // Logic check đáp án: option thường là "A. Nội dung", ta lấy ký tự đầu
    const selectedKey = selectedOption?.charAt(0); // "A"
    if (selectedKey === currentQ.correct) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    } else {
      setShowResult(true);
    }
  };

  if (showResult) {
    return (
      <div className="flex flex-col h-full bg-[#141126] border-t border-white/5 p-6 text-center animate-fade-in">
        <h4 className="mb-4 text-lg font-bold text-white">Kết quả ôn tập</h4>
        <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 border-2 rounded-full bg-primary/20 text-primary border-primary">
          <span className="text-2xl font-bold">
            {Math.round((score / questions.length) * 100)}%
          </span>
        </div>
        <p className="mb-6 text-gray-400">
          Bạn trả lời đúng{" "}
          <span className="font-bold text-white">
            {score}/{questions.length}
          </span>{" "}
          câu hỏi.
        </p>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-bold text-white rounded-lg bg-primary hover:bg-primary/80"
        >
          Hoàn thành
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#141126] border-t border-white/5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/5">
        <h4 className="text-xs font-bold text-purple-400 uppercase">
          Câu hỏi {currentIndex + 1}/{questions.length}
        </h4>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-white"
        >
          <FiX size={14} />
        </button>
      </div>

      {/* Question */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        <p className="mb-4 text-sm font-medium text-white">
          {currentQ.question}
        </p>

        <div className="space-y-2">
          {currentQ.options.map((opt, idx) => {
            const optKey = opt.charAt(0); // "A", "B"...
            let itemClass = "border-white/10 hover:bg-white/5 text-gray-300";

            if (selectedOption === opt)
              itemClass = "border-primary text-primary bg-primary/10";

            if (isSubmitted) {
              if (optKey === currentQ.correct)
                itemClass = "border-green-500 bg-green-500/10 text-green-400";
              else if (selectedOption === opt && optKey !== currentQ.correct)
                itemClass = "border-red-500 bg-red-500/10 text-red-400";
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(opt)}
                disabled={isSubmitted}
                className={`w-full text-left p-3 text-sm rounded-lg border transition-all ${itemClass}`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {isSubmitted && (
          <div className="p-3 mt-4 text-xs text-blue-300 border rounded-lg bg-blue-500/10 border-blue-500/20">
            <span className="font-bold">Giải thích:</span>{" "}
            {currentQ.explanation}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-white/5">
        {!isSubmitted ? (
          <button
            onClick={handleSubmit}
            disabled={!selectedOption}
            className="w-full py-2 text-sm font-bold text-white transition-all rounded-lg bg-primary hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Kiểm tra
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center justify-center w-full gap-2 py-2 text-sm font-bold text-white transition-all rounded-lg bg-white/10 hover:bg-white/20"
          >
            {currentIndex < questions.length - 1
              ? "Câu tiếp theo"
              : "Xem kết quả"}{" "}
            <FiArrowRight />
          </button>
        )}
      </div>
    </div>
  );
};
