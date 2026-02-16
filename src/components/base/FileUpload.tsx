'use client';

import React, { useState, useRef } from 'react';
import Button from './Button';

interface AttachmentFile {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  category: string;
  createdAt: string;
}

interface FileUploadProps {
  projectId?: string;
  taskId?: string;
  activityId?: string;
  calendarEventId?: string;
  category?: string;
  attachments?: AttachmentFile[];
  onUpload?: (attachment: AttachmentFile) => void;
  onDelete?: (id: string) => void;
  label?: string;
  accept?: string;
  multiple?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  projectId,
  taskId,
  activityId,
  calendarEventId,
  category = 'general',
  attachments = [],
  onUpload,
  onDelete,
  label = 'Вложения',
  accept,
  multiple = true,
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      if (projectId) formData.append('projectId', projectId);
      if (taskId) formData.append('taskId', taskId);
      if (activityId) formData.append('activityId', activityId);
      if (calendarEventId) formData.append('calendarEventId', calendarEventId);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          onUpload?.(data.attachment);
        }
      } catch (error) {
        console.error('Upload error:', error);
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/upload/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onDelete?.(id);
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('audio/')) return 'ri-music-line';
    if (mimeType.startsWith('image/')) return 'ri-image-line';
    if (mimeType.includes('pdf')) return 'ri-file-pdf-line';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'ri-file-word-line';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'ri-file-excel-line';
    return 'ri-file-line';
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2">
          <i className={`ri-upload-cloud-line text-2xl ${dragOver ? 'text-blue-500' : 'text-gray-400'}`}></i>
          <p className="text-sm text-gray-500">
            {uploading ? 'Загрузка...' : 'Перетащите файлы или'}
          </p>
          {!uploading && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Выбрать файл
            </Button>
          )}
        </div>
      </div>

      {/* File list */}
      {attachments.length > 0 && (
        <div className="mt-3 space-y-2">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <i className={`${getFileIcon(file.mimeType)} text-gray-500`}></i>
                <a
                  href={file.filePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate"
                  title={file.fileName}
                >
                  {file.fileName}
                </a>
                <span className="text-gray-400 whitespace-nowrap">
                  {formatSize(file.fileSize)}
                </span>
              </div>
              <button
                onClick={() => handleDelete(file.id)}
                className="text-red-400 hover:text-red-600 cursor-pointer p-1 flex-shrink-0"
                title="Удалить"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
