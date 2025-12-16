// src/hooks/useDocumentStatus.ts
import { useState, useEffect, useRef } from "react";
import { documentService } from "@/services/document/documentService";

export const useDocumentStatus = (
  selectedDocuments: Array<{ id: string; title: string }>
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  // Lưu trạng thái từng file: { "123": true (đã xong), "124": false (đang xử lý) }
  const [docStatuses, setDocStatuses] = useState<Record<string, boolean>>({});
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    // Nếu không có file nào được chọn -> Reset
    if (!selectedDocuments || selectedDocuments.length === 0) {
      setIsProcessing(false);
      setDocStatuses({});
      return;
    }

    const checkStatus = async () => {
      let anyProcessing = false;
      const newStatuses: Record<string, boolean> = { ...docStatuses };

      // Kiểm tra song song tất cả các file
      await Promise.all(
        selectedDocuments.map(async (doc) => {
          // Nếu file này đã check xong lần trước rồi thì bỏ qua để tiết kiệm request
          if (newStatuses[doc.id] === true) return;

          try {
            // Gọi API lấy thông tin chi tiết document
            const fullDoc = await documentService.getDocument(doc.id);

            // Kiểm tra trường 'processed' từ backend
            const isDone = fullDoc.processed === true;

            newStatuses[doc.id] = isDone;
            if (!isDone) anyProcessing = true;
          } catch (e) {
            console.error(`Check status failed for doc ${doc.id}`, e);
            // Nếu lỗi thì tạm coi là chưa xong để check lại sau
            newStatuses[doc.id] = false;
            anyProcessing = true;
          }
        })
      );

      setDocStatuses(newStatuses);
      setIsProcessing(anyProcessing);

      // Nếu tất cả đã xong, dừng polling
      if (!anyProcessing && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // 1. Check ngay lập tức khi danh sách file thay đổi
    checkStatus();

    // 2. Set interval polling 3s một lần nếu còn đang xử lý
    // Xóa interval cũ trước khi tạo mới
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(checkStatus, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [selectedDocuments]); // Re-run khi danh sách file thay đổi

  return { isProcessing, docStatuses };
};
