import React, { useState, useRef, useEffect } from "react";
import Button from "@/components/common/Button";

interface HeroChatProps {
  onStartChat: (messageText: string, files: File[]) => Promise<void>;
  initialFile?: File | null;
  initialMessage?: string;
}

const HeroChat: React.FC<HeroChatProps> = ({
  onStartChat,
  initialFile,
  initialMessage,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialFile) {
      setSelectedFiles([initialFile]);
    }
    if (initialMessage) {
      setInputValue(initialMessage);
    }
  }, [initialFile, initialMessage]);

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  // 👇 Logic cộng dồn file khi chọn nhiều lần
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length > 0) {
      const currentCount = selectedFiles.length;
      const remainingSlots = 5 - currentCount;

      if (remainingSlots <= 0) {
        alert("Bạn đã chọn tối đa 5 file. Hãy xóa bớt trước khi thêm.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      let filesToAdd = files;
      if (files.length > remainingSlots) {
        alert(`Bạn chỉ có thể thêm ${remainingSlots} file nữa.`);
        filesToAdd = files.slice(0, remainingSlots);
      }

      // Lọc trùng (dựa trên tên + size)
      const uniqueFiles = filesToAdd.filter(newF => 
        !selectedFiles.some(existF => existF.name === newF.name && existF.size === newF.size)
      );

      // STACKING: Cộng dồn vào danh sách hiện tại
      setSelectedFiles(prev => [...prev, ...uniqueFiles]);
    }

    // Reset input để lần sau chọn tiếp được (quan trọng để fix lỗi chọn file 2 đè file 1)
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputValue.trim() && selectedFiles.length === 0) || isLoading) return;

    setIsLoading(true);
    try {
      // Gửi toàn bộ mảng file
      await onStartChat(inputValue, selectedFiles);
      setInputValue("");
      setSelectedFiles([]);
    } catch (error) {
      console.error("Lỗi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="relative min-h-screen bg-background overflow-hidden flex items-center">
      {/* 👇 INPUT CÓ MULTIPLE */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
        accept=".pdf,.docx,.txt,.pptx"
        multiple 
      />

      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-accent/50 to-transparent"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center">
          
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/60 backdrop-blur-sm border border-primary/20 rounded-full mb-8 animate-fade-in">
             <span className="text-sm text-white font-medium">✨ Giới thiệu DocMentor AI</span>
          </div>

          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              "DocMentor — <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-primary animate-gradient">Smarter Docs, Smarter You.</span>"
            </h1>
            <p className="text-xl text-text-muted max-w-2xl mx-auto">
              Hỏi đáp, tóm tắt và phân tích bất kỳ tài liệu nào bằng AI.
            </p>
          </div>

          <div className="w-full max-w-4xl mx-auto animate-scale-up">
            <div className="relative px-2">
              <div className="relative bg-accent/60 backdrop-blur-xl border border-primary/30 rounded-3xl shadow-2xl overflow-hidden hover:border-primary/50 transition-all">
                
                <form onSubmit={handleSubmit} className="relative p-6">
                  
                  {/* UI HIỂN THỊ DANH SÁCH FILE */}
                  {selectedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4 animate-fade-in">
                      {selectedFiles.map((file, idx) => (
                        <div 
                          key={`${file.name}-${idx}`} 
                          className="flex items-center gap-2 bg-accent/80 border border-primary/30 rounded-lg pl-3 pr-2 py-1.5 text-sm text-white shadow-sm"
                        >
                          <span className="truncate max-w-[150px]" title={file.name}>
                            📄 {file.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(idx)}
                            className="p-1 hover:bg-white/10 rounded-full text-text-muted hover:text-red-400 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <div className="flex items-center px-2 text-xs text-text-muted font-medium">
                        ({selectedFiles.length}/5)
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      onClick={handleAttachClick}
                      className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                      title="Đính kèm thêm file"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </Button>

                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={selectedFiles.length > 0 ? "Nhập câu hỏi cho các tài liệu này..." : "Hỏi bất cứ điều gì về tài liệu của bạn..."}
                      className="flex-1 bg-transparent text-white placeholder-text-muted/60 text-lg outline-none"
                    />

                    <button
                      type="submit"
                      disabled={(!inputValue.trim() && selectedFiles.length === 0) || isLoading}
                      className="px-6 py-2.5 bg-gradient-to-r from-primary to-secondary rounded-xl font-semibold text-white transition-all hover:scale-105 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isLoading ? (
                        <span>Đang xử lý...</span>
                      ) : (
                        <>
                          <span>Bắt đầu</span>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroChat;