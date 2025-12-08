import React from "react";
import { Document } from "@/types/document.types";
import { DocumentCard } from "@/features/documents/components/user/DocumentCard";

interface DocumentListProps {
  documents: Document[];
  onDelete: (id: string) => void;
  // ✅ Added onView prop
  onView: (id: string) => void;
  editingId?: string | null;
  editingTitle?: string;
  onStartEdit?: (doc: Document) => void;
  onSaveEdit?: (id: string) => void;
  onCancelEdit?: () => void;
  onEditingTitleChange?: (title: string) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onDelete,
  onView, // ✅
  editingId,
  editingTitle,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditingTitleChange,
}) => {
  return (
    <div className="space-y-4 animate-fade-in">
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          document={doc}
          view="list"
          onDelete={onDelete}
          onView={onView} // ✅ Pass down to card
          isSelected={false}
          onSelectionChange={() => {}}
          editingId={editingId}
          editingTitle={editingTitle}
          onStartEdit={onStartEdit}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
          onEditingTitleChange={onEditingTitleChange}
        />
      ))}
    </div>
  );
};
