import React, { useState } from "react";
import { Folder } from "@/types/document.types";
import {
  FiFolder,
  FiPlus,
  FiEdit2,
  FiX,
  FiCheck,
  FiTrash2,
} from "react-icons/fi";

interface FolderManagerProps {
  folders: Folder[];
  selectedFolderId?: string | number | null;
  onSelectFolder: (folderId: string | number | null) => void;
  onCreateFolder: (name: string, description?: string) => void;
  onDeleteFolder: (folderId: string | number) => void;
  onRenameFolder: (folderId: string | number, newName: string) => void;
}

export const FolderManager: React.FC<FolderManagerProps> = ({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onDeleteFolder,
  onRenameFolder,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName);
      setNewFolderName("");
      setIsCreating(false);
    }
  };

  const handleRenameFolder = (folderId: string | number) => {
    if (editingName.trim()) {
      onRenameFolder(folderId, editingName);
      setEditingId(null);
      setEditingName("");
    }
  };


  return (
    <div className="w-full">
      {/* Folder Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <FiFolder className="w-5 h-5 text-primary" />
          Thư mục tài liệu
        </h2>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg hover:shadow-primary/30 transition-all text-sm font-medium"
          >
            <FiPlus className="w-4 h-4" />
            Thêm thư mục
          </button>
        )}
      </div>

      {/* Create Folder Input */}
      {isCreating && (
        <div className="mb-4 p-3 bg-accent/60 border border-primary/30 rounded-lg flex gap-2">
          <input
            autoFocus
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateFolder();
              if (e.key === "Escape") {
                setIsCreating(false);
                setNewFolderName("");
              }
            }}
            placeholder="Nhập tên thư mục..."
            className="flex-1 px-3 py-2 rounded-lg bg-background border border-primary/50 text-white focus:outline-none focus:border-primary text-sm"
          />
          <button
            onClick={handleCreateFolder}
            className="p-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg"
            title="Tạo"
          >
            <FiCheck className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setIsCreating(false);
              setNewFolderName("");
            }}
            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
            title="Hủy"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Folders List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {/* All Documents Button */}
        <button
          onClick={() => onSelectFolder(null)}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-left font-medium ${
            selectedFolderId === null
              ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30"
              : "bg-accent/40 border border-primary/20 text-white hover:bg-accent/60 hover:border-primary/30"
          }`}
        ></button>

        {/* Folder Items */}
        {folders.length === 0 ? (
          <p className="text-sm text-text-muted px-4 py-3 text-center">
            Chưa có thư mục nào
          </p>
        ) : (
          folders.map((folder) => (
            <div
              key={folder.id}
              className={`group flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
                selectedFolderId === folder.id
                  ? "bg-gradient-to-r from-primary to-secondary text-white border-primary shadow-lg shadow-primary/30"
                  : "bg-accent/40 border-primary/20 text-white hover:bg-accent/60 hover:border-primary/30"
              }`}
            >
              <button
                onClick={() => onSelectFolder(folder.id)}
                className="flex-1 flex items-center gap-3 min-w-0"
              >
                <FiFolder className="w-5 h-5 flex-shrink-0" />
                <div className="min-w-0">
                  {editingId === folder.id ? (
                    <input
                      autoFocus
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleRenameFolder(folder.id);
                        }
                        if (e.key === "Escape") {
                          setEditingId(null);
                          setEditingName("");
                        }
                      }}
                      className="w-full px-2 py-1 rounded bg-background border border-primary/50 text-white focus:outline-none focus:border-primary text-sm"
                      placeholder="Tên thư mục..."
                    />
                  ) : (
                    <div className="flex flex-col">
                      <span className="font-medium truncate">
                        {folder.name}
                      </span>
                      {folder.documentCount !== undefined && (
                        <span className="text-xs text-text-muted">
                          {folder.documentCount} tài liệu
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </button>

              {/* Actions */}
              {editingId === folder.id ? (
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRenameFolder(folder.id);
                    }}
                    className="p-1.5 rounded-lg bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg"
                    title="Lưu"
                  >
                    <FiCheck className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(null);
                      setEditingName("");
                    }}
                    className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    title="Hủy"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(folder.id);
                      setEditingName(folder.name);
                    }}
                    className="p-1.5 rounded-lg text-primary hover:bg-primary/20"
                    title="Đổi tên"
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        window.confirm(
                          `Bạn có chắc muốn xóa thư mục "${folder.name}"?`
                        )
                      ) {
                        onDeleteFolder(folder.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20"
                    title="Xóa"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
