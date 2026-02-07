'use client';

import React, { useState } from 'react';
import { GanttTask } from '@/types/gantt';

interface TaskDetailPanelProps {
  task: GanttTask;
  onClose: () => void;
  onSave: (task: GanttTask) => void;
  onDelete: (taskId: string) => void;
  allTasks: GanttTask[];
  users: { id: string; name: string }[];
}

const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({
  task,
  onClose,
  onSave,
  onDelete,
  allTasks,
  users,
}) => {
  const [editedTask, setEditedTask] = useState<GanttTask>({ ...task });
  const [activeTab, setActiveTab] = useState<'details' | 'dependencies' | 'comments'>('details');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const priorities = [
    { id: 'critical', label: 'Критический', color: 'bg-red-500' },
    { id: 'high', label: 'Высокий', color: 'bg-orange-500' },
    { id: 'medium', label: 'Средний', color: 'bg-amber-500' },
    { id: 'low', label: 'Низкий', color: 'bg-gray-400' },
  ];

  const statuses = [
    { id: 'not_started', label: 'Не начато', color: 'bg-gray-400' },
    { id: 'in_progress', label: 'В работе', color: 'bg-emerald-500' },
    { id: 'completed', label: 'Завершено', color: 'bg-emerald-600' },
    { id: 'on_hold', label: 'На паузе', color: 'bg-amber-500' },
  ];

  const handleSave = () => {
    onSave(editedTask);
    onClose();
  };

  const flattenTasks = (tasks: GanttTask[]): GanttTask[] => {
    return tasks.reduce((acc: GanttTask[], task) => {
      acc.push(task);
      if (task.children) {
        acc.push(...flattenTasks(task.children));
      }
      return acc;
    }, []);
  };

  const availableDependencies = flattenTasks(allTasks).filter(t => t.id !== task.id);

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-white shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: task.projectColor }}
          ></div>
          <span className="text-sm text-gray-500">{task.projectName}</span>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          <i className="ri-close-line text-xl"></i>
        </button>
      </div>

      {/* Task title */}
      <div className="px-6 py-4 border-b border-gray-100">
        <input
          type="text"
          value={editedTask.name}
          onChange={(e) => setEditedTask({ ...editedTask, name: e.target.value })}
          className="w-full text-lg font-semibold text-gray-900 border-none focus:outline-none focus:ring-0"
          placeholder="Название задачи"
        />
        {task.isMilestone && (
          <div className="flex items-center space-x-2 mt-2">
            <i className="ri-flag-fill text-amber-500"></i>
            <span className="text-sm text-amber-600 font-medium">Веха</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'details', label: 'Детали', icon: 'ri-file-list-line' },
          { id: 'dependencies', label: 'Зависимости', icon: 'ri-git-branch-line' },
          { id: 'comments', label: 'Комментарии', icon: 'ri-chat-3-line' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <i className={tab.icon}></i>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Статус</label>
              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <button
                    key={status.id}
                    onClick={() => setEditedTask({ ...editedTask, status: status.id as GanttTask['status'] })}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      editedTask.status === status.id
                        ? `${status.color} text-white`
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span>{status.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Приоритет</label>
              <div className="flex flex-wrap gap-2">
                {priorities.map((priority) => (
                  <button
                    key={priority.id}
                    onClick={() => setEditedTask({ ...editedTask, priority: priority.id as GanttTask['priority'] })}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      editedTask.priority === priority.id
                        ? `${priority.color} text-white`
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span>{priority.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Исполнитель</label>
              <select
                value={editedTask.assigneeId}
                onChange={(e) => {
                  const user = users.find(u => u.id === e.target.value);
                  setEditedTask({
                    ...editedTask,
                    assigneeId: e.target.value,
                    assigneeName: user?.name || '',
                  });
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Дата начала</label>
                <input
                  type="date"
                  value={editedTask.startDate}
                  onChange={(e) => setEditedTask({ ...editedTask, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Дата окончания</label>
                <input
                  type="date"
                  value={editedTask.endDate}
                  onChange={(e) => setEditedTask({ ...editedTask, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Progress */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Прогресс: {editedTask.progress}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={editedTask.progress}
                onChange={(e) => setEditedTask({ ...editedTask, progress: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Hours */}
            {!task.isMilestone && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Оценка (часы)</label>
                  <input
                    type="number"
                    value={editedTask.estimatedHours || 0}
                    onChange={(e) => setEditedTask({ ...editedTask, estimatedHours: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Факт (часы)</label>
                  <input
                    type="number"
                    value={editedTask.actualHours || 0}
                    onChange={(e) => setEditedTask({ ...editedTask, actualHours: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
              <textarea
                value={editedTask.description || ''}
                onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                placeholder="Добавьте описание задачи..."
              />
            </div>
          </div>
        )}

        {activeTab === 'dependencies' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">Зависит от</h4>
              <button className="text-sm text-emerald-600 hover:text-emerald-700 cursor-pointer">
                + Добавить
              </button>
            </div>

            {editedTask.dependencies && editedTask.dependencies.length > 0 ? (
              <div className="space-y-2">
                {editedTask.dependencies.map((depId) => {
                  const depTask = availableDependencies.find(t => t.id === depId);
                  if (!depTask) return null;
                  return (
                    <div
                      key={depId}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: depTask.projectColor }}
                        ></div>
                        <span className="text-sm text-gray-700">{depTask.name}</span>
                      </div>
                      <button
                        onClick={() => {
                          setEditedTask({
                            ...editedTask,
                            dependencies: editedTask.dependencies?.filter(d => d !== depId),
                          });
                        }}
                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 cursor-pointer"
                      >
                        <i className="ri-close-line"></i>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <i className="ri-git-branch-line text-3xl mb-2"></i>
                <p className="text-sm">Нет зависимостей</p>
              </div>
            )}

            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Добавить зависимость</h4>
              <select
                onChange={(e) => {
                  if (e.target.value && !editedTask.dependencies?.includes(e.target.value)) {
                    setEditedTask({
                      ...editedTask,
                      dependencies: [...(editedTask.dependencies || []), e.target.value],
                    });
                  }
                  e.target.value = '';
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">Выберите задачу...</option>
                {availableDependencies
                  .filter(t => !editedTask.dependencies?.includes(t.id))
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="space-y-4">
            <div className="text-center py-8 text-gray-500">
              <i className="ri-chat-3-line text-3xl mb-2"></i>
              <p className="text-sm">Комментариев пока нет</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                АТ
              </div>
              <div className="flex-1">
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder="Напишите комментарий..."
                />
                <button className="mt-2 px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors cursor-pointer whitespace-nowrap">
                  Отправить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="text-sm text-red-600 hover:text-red-700 cursor-pointer"
        >
          Удалить задачу
        </button>
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors cursor-pointer whitespace-nowrap"
          >
            Сохранить
          </button>
        </div>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 m-6 max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Удалить задачу?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Это действие нельзя отменить. Задача будет удалена навсегда.
            </p>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  onDelete(task.id);
                  onClose();
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors cursor-pointer whitespace-nowrap"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetailPanel;
