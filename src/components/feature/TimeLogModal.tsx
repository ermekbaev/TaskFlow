'use client';

import React, { useState } from 'react';
import Modal from '@/components/base/Modal';
import Input from '@/components/base/Input';
import Button from '@/components/base/Button';

interface TimeLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskKey: string;
  onTimeLogged: () => void;
}

const TimeLogModal: React.FC<TimeLogModalProps> = ({
  isOpen,
  onClose,
  taskId,
  taskKey,
  onTimeLogged,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const [hours, setHours] = useState('');
  const [workDate, setWorkDate] = useState(today);
  const [comment, setComment] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!hours || parseFloat(hours) <= 0 || !workDate) return;
    setSubmitting(true);

    try {
      // 1. Create time_entry activity
      const res = await fetch(`/api/tasks/${taskId}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'time_entry',
          hours: parseFloat(hours),
          workDate,
          comment: comment.trim() || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        // 2. Upload files with activityId
        if (files.length > 0) {
          for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('taskId', taskId);
            formData.append('activityId', data.activity.id);
            formData.append('category', 'general');
            await fetch('/api/upload', { method: 'POST', body: formData });
          }
        }

        onTimeLogged();
        handleClose();
      }
    } catch (error) {
      console.error('Time log error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setHours('');
    setWorkDate(today);
    setComment('');
    setFiles([]);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Списать время — ${taskKey}`} size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Количество часов"
            type="number"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="0"
            min="0.25"
            required
          />
          <Input
            label="Дата выполнения"
            type="date"
            value={workDate}
            onChange={(e) => setWorkDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Что было сделано..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Приложить файлы</label>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 file:cursor-pointer"
          />
          {files.length > 0 && (
            <div className="mt-2 space-y-1">
              {files.map((file, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-gray-50 rounded px-2 py-1">
                  <span className="truncate">{file.name}</span>
                  <button onClick={() => removeFile(i)} className="text-red-400 hover:text-red-600 ml-2 cursor-pointer">
                    <i className="ri-close-line"></i>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex space-x-4 pt-2">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!hours || parseFloat(hours) <= 0 || !workDate || submitting}
            className="flex-1"
          >
            {submitting ? 'Сохранение...' : 'Списать время'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TimeLogModal;
