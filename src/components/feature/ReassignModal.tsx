'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/base/Modal';
import Button from '@/components/base/Button';

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
  projectId,
  currentAssigneeId,
  onClose,
  onSubmit,
}) => {
  const [members, setMembers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/members`)
      .then(res => res.json())
      .then(data => {
        setMembers(data.members || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [projectId]);

  const handleSubmit = () => {
    if (!selectedUserId) return;
    onSubmit(selectedUserId, comment);
  };

  const availableMembers = members.filter(m => m.userId !== currentAssigneeId);

  return (
    <Modal isOpen={true} onClose={onClose} title={`Переназначить ${taskKey}`} size="md">
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Новый исполнитель
              </label>
              {availableMembers.length === 0 ? (
                <p className="text-sm text-ink-muted">Нет доступных участников для переназначения</p>
              ) : (
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-400 transition-all"
                >
                  <option value="">Выберите исполнителя</option>
                  {availableMembers.map((m: any) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user.name} ({m.roleInProject})
                    </option>
                  ))}
                </select>
              )}
            </div>

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
          </>
        )}
      </div>
    </Modal>
  );
};

export default ReassignModal;
