'use client';

import React, { useState } from 'react';
import Modal from '@/components/base/Modal';
import { GanttTask } from '@/types/gantt';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (task: Omit<GanttTask, 'id'>) => void;
  projects: { id: string; name: string; color: string }[];
  users: { id: string; name: string }[];
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  projects,
  users,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    projectId: projects[0]?.id || '',
    assigneeId: users[0]?.id || '',
    priority: 'medium' as GanttTask['priority'],
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isMilestone: false,
    description: '',
    estimatedHours: 8,
  });

  const priorities = [
    { id: 'critical', label: 'Критический', color: 'bg-red-500' },
    { id: 'high', label: 'Высокий', color: 'bg-orange-500' },
    { id: 'medium', label: 'Средний', color: 'bg-amber-500' },
    { id: 'low', label: 'Низкий', color: 'bg-gray-400' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const project = projects.find(p => p.id === formData.projectId);
    const user = users.find(u => u.id === formData.assigneeId);

    if (!project || !user) return;

    onCreate({
      name: formData.name,
      startDate: formData.startDate,
      endDate: formData.isMilestone ? formData.startDate : formData.endDate,
      progress: 0,
      assigneeId: formData.assigneeId,
      assigneeName: user.name,
      priority: formData.priority,
      status: 'not_started',
      projectId: formData.projectId,
      projectName: project.name,
      projectColor: project.color,
      isMilestone: formData.isMilestone,
      description: formData.description,
      estimatedHours: formData.estimatedHours,
      actualHours: 0,
    });

    // Reset form
    setFormData({
      name: '',
      projectId: projects[0]?.id || '',
      assigneeId: users[0]?.id || '',
      priority: 'medium',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isMilestone: false,
      description: '',
      estimatedHours: 8,
    });

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Создать задачу" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Task name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Название задачи <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Введите название задачи"
            required
          />
        </div>

        {/* Milestone toggle */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isMilestone: !formData.isMilestone })}
            className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
              formData.isMilestone ? 'bg-amber-500' : 'bg-gray-200'
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                formData.isMilestone ? 'translate-x-6' : 'translate-x-1'
              }`}
            ></div>
          </button>
          <span className="text-sm text-gray-700">Это веха (milestone)</span>
        </div>

        {/* Project and Assignee */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Проект</label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Исполнитель</label>
            <select
              value={formData.assigneeId}
              onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Приоритет</label>
          <div className="flex flex-wrap gap-2">
            {priorities.map((priority) => (
              <button
                key={priority.id}
                type="button"
                onClick={() => setFormData({ ...formData, priority: priority.id as GanttTask['priority'] })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  formData.priority === priority.id
                    ? `${priority.color} text-white`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {priority.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formData.isMilestone ? 'Дата вехи' : 'Дата начала'}
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            />
          </div>
          {!formData.isMilestone && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дата окончания</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Estimated hours */}
        {!formData.isMilestone && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Оценка времени (часы)</label>
            <input
              type="number"
              value={formData.estimatedHours}
              onChange={(e) => setFormData({ ...formData, estimatedHours: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              min="0"
            />
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            placeholder="Добавьте описание задачи..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={!formData.name.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            Создать задачу
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateTaskModal;
