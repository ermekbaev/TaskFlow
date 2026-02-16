'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/base/Button';

interface ActivityAttachment {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
}

interface Activity {
  id: string;
  taskId: string;
  userId: string;
  type: string;
  comment: string | null;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  hours: number | null;
  workDate: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
  attachments: ActivityAttachment[];
}

interface TaskActivityTimelineProps {
  taskId: string;
  refreshKey?: number;
}

const FIELD_LABELS: Record<string, string> = {
  status: 'Статус',
  priority: 'Приоритет',
  title: 'Название',
  description: 'Описание',
  assigneeId: 'Исполнитель',
  dueDate: 'Срок выполнения',
  startDate: 'Дата начала',
  expectedHours: 'Ожидаемые трудозатраты',
  taskType: 'Тип задачи',
  acceptanceStatus: 'Статус приёмки',
};

const TaskActivityTimeline: React.FC<TaskActivityTimelineProps> = ({ taskId, refreshKey }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchActivities = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/activity`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, refreshKey]);

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'comment', comment: commentText.trim() }),
      });
      if (res.ok) {
        setCommentText('');
        fetchActivities();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMs / 3600000);
    const diffD = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Только что';
    if (diffMin < 60) return `${diffMin} мин. назад`;
    if (diffH < 24) return `${diffH} ч. назад`;
    if (diffD < 7) return `${diffD} дн. назад`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatWorkDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return dateStr;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'comment': return 'ri-chat-3-line';
      case 'status_change': return 'ri-arrow-left-right-line';
      case 'field_change': return 'ri-edit-line';
      case 'reassign': return 'ri-user-shared-line';
      case 'time_entry': return 'ri-time-line';
      case 'created': return 'ri-add-circle-line';
      default: return 'ri-information-line';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'comment': return 'bg-blue-100 text-blue-600';
      case 'status_change': return 'bg-amber-100 text-amber-600';
      case 'field_change': return 'bg-slate-100 text-slate-600';
      case 'reassign': return 'bg-purple-100 text-purple-600';
      case 'time_entry': return 'bg-emerald-100 text-emerald-600';
      case 'created': return 'bg-green-100 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const renderActivityContent = (activity: Activity) => {
    switch (activity.type) {
      case 'comment':
        return (
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{activity.comment}</p>
        );
      case 'status_change':
        return (
          <p className="text-sm text-gray-600">
            Изменил статус: <span className="font-medium">{activity.oldValue}</span> &rarr; <span className="font-medium">{activity.newValue}</span>
          </p>
        );
      case 'field_change':
        return (
          <p className="text-sm text-gray-600">
            Изменил {FIELD_LABELS[activity.field || ''] || activity.field}:{' '}
            <span className="font-medium">{activity.oldValue || '—'}</span> &rarr;{' '}
            <span className="font-medium">{activity.newValue || '—'}</span>
          </p>
        );
      case 'reassign':
        return (
          <div>
            <p className="text-sm text-gray-600">Переназначил задачу</p>
            {activity.comment && (
              <p className="text-sm text-gray-500 italic mt-1">{activity.comment}</p>
            )}
          </div>
        );
      case 'time_entry':
        return (
          <div>
            <p className="text-sm text-gray-600">
              Списал <span className="font-semibold text-emerald-700">{activity.hours} ч</span> за{' '}
              <span className="font-medium">{formatWorkDate(activity.workDate || '')}</span>
            </p>
            {activity.comment && (
              <p className="text-sm text-gray-500 mt-1">{activity.comment}</p>
            )}
            {activity.attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {activity.attachments.map(att => (
                  <a
                    key={att.id}
                    href={att.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                  >
                    <i className="ri-attachment-line"></i>
                    {att.fileName}
                  </a>
                ))}
              </div>
            )}
          </div>
        );
      case 'created':
        return <p className="text-sm text-gray-600">Создал задачу</p>;
      default:
        return <p className="text-sm text-gray-600">{activity.type}</p>;
    }
  };

  return (
    <div>
      <h3 className="font-semibold text-ink mb-4">История</h3>

      {/* Comment input */}
      <div className="mb-6">
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Добавить комментарий..."
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
        />
        <div className="flex justify-end mt-2">
          <Button
            size="sm"
            onClick={handleAddComment}
            disabled={!commentText.trim() || submitting}
          >
            {submitting ? 'Отправка...' : 'Отправить'}
          </Button>
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : activities.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">Нет записей в истории</p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
                <i className={`${getActivityIcon(activity.type)} text-sm`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-gray-900">{activity.user.name}</span>
                  <span className="text-xs text-gray-400">{formatDate(activity.createdAt)}</span>
                </div>
                {renderActivityContent(activity)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskActivityTimeline;
