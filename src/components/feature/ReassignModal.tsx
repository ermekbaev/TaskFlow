'use client';

import React, { useState } from 'react';
import Modal from '@/components/base/Modal';
import Button from '@/components/base/Button';
import UserPicker from '@/components/base/UserPicker';

interface ReassignModalProps {
  taskId: string;
  taskKey: string;
  projectId: string;
  currentAssigneeId?: string;
  onClose: () => void;
  onSubmit: (newAssigneeId: string, comment: string) => void;
}

const ReassignModal: React.FC<ReassignModalProps> = ({
  taskKey,
  currentAssigneeId,
  onClose,
  onSubmit,
}) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (!selectedUserId) return;
    onSubmit(selectedUserId, comment);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Переназначить ${taskKey}`} size="md">
      <div className="space-y-4">
        <UserPicker
          label="Новый исполнитель"
          value={selectedUserId}
          onChange={setSelectedUserId}
          excludeIds={currentAssigneeId ? [currentAssigneeId] : []}
          placeholder="Поиск пользователя по имени или email..."
        />

        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            Комментарий (необязательно)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Причина переназначения..."
            rows={3}
            className="w-full px-4 py-3 border-2 border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-400 transition-all resize-none"
          />
        </div>

        <div className="flex space-x-4 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedUserId}
            className="flex-1"
          >
            <i className="ri-user-shared-line mr-2"></i>
            Переназначить
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ReassignModal;
