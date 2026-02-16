'use client';

import React, { useState } from 'react';

interface TaskCardProps {
  task: {
    id: string;
    key: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    assigneeId: string;
    assignee?: { id: string; name: string; email: string } | null;
    labels: string[];
    dueDate: string;
    taskType?: string;
    isRecurring?: boolean;
    expectedHours?: number;
    actualHours?: number;
    assignees?: Array<{ user: { id: string; name: string; email: string } }>;
    attachments?: Array<{ id: string }>;
    children?: Array<{ id: string }>;
  };
  onDragStart: () => void;
  canEdit: boolean;
  onClick?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onDragStart, canEdit, onClick }) => {
  const [showActions, setShowActions] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P1': return 'border-l-red-500 bg-white';
      case 'P2': return 'border-l-orange-500 bg-white';
      case 'P3': return 'border-l-primary-500 bg-white';
      default: return 'border-l-surface-300 bg-white';
    }
  };

  const getTaskTypeIcon = (taskType?: string) => {
    switch (taskType) {
      case 'parent': return 'ri-folder-open-line text-amber-500';
      case 'stage': return 'ri-git-branch-line text-purple-500';
      case 'recurring': return 'ri-repeat-line text-blue-500';
      default: return '';
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const assignee = task.assignee;
  const additionalAssignees = task.assignees || [];
  const taskTypeIcon = getTaskTypeIcon(task.taskType);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`p-3 rounded-lg border-l-4 cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 group overflow-hidden ${getPriorityColor(task.priority)}`}
      onClick={onClick}
    >
      {/* Header: key, type icon, and menu */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {taskTypeIcon && <i className={`${taskTypeIcon} text-sm`}></i>}
          <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
            {task.key}
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
            task.priority === 'P1' ? 'bg-rose-100 text-rose-700' :
            task.priority === 'P2' ? 'bg-amber-100 text-amber-700' :
            'bg-sky-100 text-sky-700'
          }`}>
            {task.priority}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {task.attachments && task.attachments.length > 0 && (
            <span className="text-gray-400 text-xs" title="Есть вложения">
              <i className="ri-attachment-line"></i>
            </span>
          )}
          {task.children && task.children.length > 0 && (
            <span className="text-gray-400 text-xs" title={`${task.children.length} подзадач`}>
              <i className="ri-node-tree"></i> {task.children.length}
            </span>
          )}

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1"
            >
              <i className="ri-more-line text-sm"></i>
            </button>

            {showActions && (
              <div className="absolute right-0 top-6 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[160px]">
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 border-b border-gray-100">
                  Изменить статус
                </div>

                {['To Do', 'In Progress', 'Review', 'Done'].filter(status => status !== task.status).map(status => (
                  <button
                    key={status}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(status);
                      setShowActions(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <i className={`mr-2 text-xs ${
                      status === 'To Do' ? 'ri-todo-line' :
                      status === 'In Progress' ? 'ri-play-circle-line' :
                      status === 'Review' ? 'ri-eye-line' :
                      'ri-check-double-line'
                    }`}></i>
                    {status === 'To Do' ? 'К выполнению' :
                     status === 'In Progress' ? 'В процессе' :
                     status === 'Review' ? 'На проверке' :
                     'Выполнено'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Title */}
      <h4 className="font-medium text-gray-900 text-sm mb-1.5 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug break-words">{task.title}</h4>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-500 mb-2 line-clamp-1 break-words">{task.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          {/* Main assignee + additional */}
          {assignee && (
            <div className="w-6 h-6 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center" title={assignee.name}>
              <span className="text-white text-xs font-medium">{assignee.name.charAt(0)}</span>
            </div>
          )}
          {additionalAssignees.slice(0, 2).map((a) => (
            <div key={a.user.id} className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center -ml-1.5 ring-2 ring-white" title={a.user.name}>
              <span className="text-white text-xs font-medium">{a.user.name.charAt(0)}</span>
            </div>
          ))}
          {additionalAssignees.length > 2 && (
            <span className="text-xs text-gray-400 ml-0.5">+{additionalAssignees.length - 2}</span>
          )}

          {task.labels && task.labels.length > 0 && (
            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded truncate max-w-[80px]" title={task.labels[0]}>
              {task.labels[0]}{task.labels.length > 1 && ` +${task.labels.length - 1}`}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          {(task.expectedHours != null && task.expectedHours > 0) && (
            <span className="font-medium" title="Ожидаемые / Фактические трудозатраты">
              {task.actualHours || 0}/{task.expectedHours}ч
            </span>
          )}

          {task.dueDate && (
            <span className={`${
              new Date(task.dueDate) < new Date() ? 'text-red-500' : ''
            }`}>
              {new Date(task.dueDate).toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit'
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
