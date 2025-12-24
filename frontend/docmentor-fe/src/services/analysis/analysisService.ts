import apiClient from "@/services/api/apiClient";

// ============================================================
// TYPES
// ============================================================

export interface QuizQuestion {
  id?: number; // Backend có thể không trả về ID, optional
  question: string;
  options: string[]; // ["A. Option 1", "B. Option 2", ...]
  correct: string; // "A", "B", "C" hoặc "D"
  explanation: string;
}

export interface SummaryResponse {
  document_id: number;
  document_title: string;
  summary: string;
  length: string;
  word_count: number;
  created_at?: string;
}

export interface QuizResponse {
  document_id: number;
  document_title: string;
  questions: QuizQuestion[];
  difficulty: string;
  total_questions: number;
}

// ============================================================
// SERVICE
// ============================================================

export const analysisService = {
  /**
   * 📝 1. Tạo tóm tắt tài liệu
   * POST /analysis/summary
   */
  generateSummary: async (
    documentId: number | string,
    length: "short" | "medium" | "long" = "medium"
  ): Promise<SummaryResponse> => {
    const response = await apiClient.post<SummaryResponse>(
      "/analysis/summary",
      {
        document_id: Number(documentId),
        length: length,
      }
    );
    return response.data;
  },

  /**
   * 🧠 2. Tạo câu hỏi trắc nghiệm (Quiz)
   * POST /analysis/quiz
   */
  generateQuiz: async (
    documentId: number | string,
    numQuestions: number = 5,
    difficulty: "easy" | "medium" | "hard" = "medium"
  ): Promise<QuizQuestion[]> => {
    const response = await apiClient.post<QuizResponse>("/analysis/quiz", {
      document_id: Number(documentId),
      num_questions: numQuestions,
      difficulty: difficulty,
    });

    // Backend trả về object { questions: [...], ... }, ta chỉ cần lấy mảng questions cho UI
    return response.data.questions || [];
  },

  /**
   * 📥 3. Xuất Tóm tắt ra PDF (Download)
   * POST /analysis/summary/export/pdf
   */
  exportSummaryPDF: async (
    documentId: number | string,
    length: "short" | "medium" | "long" = "medium"
  ): Promise<void> => {
    const response = await apiClient.post(
      "/analysis/summary/export/pdf",
      {
        document_id: Number(documentId),
        length: length,
      },
      {
        responseType: "blob", // Quan trọng: Để nhận file binary
      }
    );

    // Tạo link ảo để tải file
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    // Lấy tên file từ header hoặc đặt mặc định
    link.setAttribute("download", `Summary_${documentId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  /**
   * 📥 4. Xuất Quiz ra PDF (Download)
   * POST /analysis/quiz/export/pdf
   */
  exportQuizPDF: async (
    documentId: number | string,
    numQuestions: number = 5,
    difficulty: "easy" | "medium" | "hard" = "medium",
    includeAnswers: boolean = true
  ): Promise<void> => {
    // Lưu ý: Backend endpoint query param 'include_answers'
    const response = await apiClient.post(
      `/analysis/quiz/export/pdf?include_answers=${includeAnswers}`,
      {
        document_id: Number(documentId),
        num_questions: numQuestions,
        difficulty: difficulty,
      },
      {
        responseType: "blob",
      }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Quiz_${documentId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};
