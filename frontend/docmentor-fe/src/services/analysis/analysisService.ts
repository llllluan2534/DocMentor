import apiClient from "@/services/api/apiClient";

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: string;
  explanation: string;
}

export const analysisService = {
  // 1. Tạo tóm tắt
  generateSummary: async (
    documentId: number,
    length: "short" | "medium" | "long" = "medium"
  ) => {
    // Gọi API: POST /analysis/summary
    const response = await apiClient.post("/analysis/summary", {
      document_id: documentId,
      length: length,
    });
    return response.data; // Trả về { summary, word_count, ... }
  },

  // 2. Tạo câu hỏi trắc nghiệm
  generateQuiz: async (
    documentId: number,
    numQuestions: number = 5,
    difficulty: string = "medium"
  ) => {
    // Gọi API: POST /analysis/quiz
    const response = await apiClient.post("/analysis/quiz", {
      document_id: documentId,
      num_questions: numQuestions,
      difficulty: difficulty,
    });
    return response.data.questions; // Trả về mảng QuizQuestion[]
  },
};
