'use client';

import React, { useState } from 'react';

interface GanttFiltersProps {
  selectedProject: string;
  onProjectChange: (projectId: string) => void;
  selectedAssignee: string;
  onAssigneeChange: (assigneeId: string) => void;
  selectedPriority: string;
  onPriorityChange: (priority: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  projects: { id: string; name: string; color: string }[];
  users: { id: string; name: string }[];
  groupBy: 'none' | 'project' | 'assignee' | 'priority';
  onGroupByChange: (groupBy: 'none' | 'project' | 'assignee' | 'priority') => void;
  isMobile: boolean;
}

const GanttFilters: React.FC<GanttFiltersProps> = ({
  selectedProject,
  onProjectChange,
  selectedAssignee,
  onAssigneeChange,
  selectedPriority,
  onPriorityChange,
  selectedStatus,
  onStatusChange,
  projects,
  users,
  groupBy,
  onGroupByChange,
  isMobile,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const priorities = [
    { id: 'all', label: 'Все', fullLabel: 'Все приоритеты' },
    { id: 'critical', label: 'Крит', fullLabel: 'Критический', color: 'bg-red-500' },
    { id: 'high', label: 'Выс', fullLabel: 'Высокий', color: 'bg-orange-500' },
    { id: 'medium', label: 'Сред', fullLabel: 'Средний', color: 'bg-amber-500' },
    { id: 'low', label: 'Низ', fullLabel: 'Низкий', color: 'bg-gray-400' },
  ];

  const statuses = [
    { id: 'all', label: 'Все', fullLabel: 'Все статусы' },
    { id: 'not_started', label: 'Не начато', fullLabel: 'Не начато', color: 'bg-gray-400' },
    { id: 'in_progress', label: 'В работе', fullLabel: 'В работе', color: 'bg-emerald-500' },
    { id: 'completed', label: 'Завершено', fullLabel: 'Завершено', color: 'bg-emerald-600' },
    { id: 'on_hold', label: 'На паузе', fullLabel: 'На паузе', color: 'bg-amber-500' },
  ];

  const groupOptions = [
    { id: 'none', label: 'Без группировки', shortLabel: 'Нет', icon: 'ri-list-unordered' },
    { id: 'project', label: 'По проекту', shortLabel: 'Проект', icon: 'ri-folder-line' },
    { id: 'assignee', label: 'По исполнителю', shortLabel: 'Испол.', icon: 'ri-user-line' },
    { id: 'priority', label: 'По приоритету', shortLabel: 'Приор.', icon: 'ri-flag-line' },
  ] as const;

  const activeFiltersCount = [
    selectedProject !== 'all',
    selectedAssignee !== 'all',
    selectedPriority !== 'all',
    selectedStatus !== 'all',
  ].filter(Boolean).length;

  return (
    <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-1.5 lg:py-2">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-2 lg:space-y-0">
        {/* Quick filters */}
        <div className="flex items-center space-x-2 lg:space-x-2.5 overflow-x-auto pb-1 lg:pb-0">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150 cursor-pointer whitespace-nowrap flex-shrink-0 ${
              showFilters || activeFiltersCount > 0
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            <i className="ri-filter-3-line text-sm"></i>
            <span>Фильтры</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 flex items-center justify-center bg-emerald-500 text-white text-[10px] font-bold rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Status quick filters */}
          {!isMobile && (
            <div className="flex items-center space-x-1">
              {statuses.slice(0, 4).map((status) => (
                <button
                  key={status.id}
                  onClick={() => onStatusChange(status.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150 cursor-pointer whitespace-nowrap ${
                    selectedStatus === status.id
                      ? status.id === 'all'
                        ? 'bg-gray-800 text-white shadow-sm'
                        : `${status.color} text-white shadow-sm`
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Group by */}
        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-gray-400 hidden lg:inline uppercase tracking-wider">Группировка:</span>
          <div className="flex items-center bg-gray-100 rounded-md p-0.5 w-full lg:w-auto">
            {groupOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => onGroupByChange(option.id)}
                className={`flex items-center justify-center space-x-1 lg:space-x-1 px-2 lg:px-2.5 py-1 text-xs font-medium rounded transition-all duration-150 cursor-pointer whitespace-nowrap flex-1 lg:flex-none ${
                  groupBy === option.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <i className={`${option.icon} text-sm`}></i>
                <span className="lg:hidden">{option.shortLabel}</span>
                <span className="hidden lg:inline">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Extended filters */}
      {showFilters && (
        <div className="mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {/* Project filter */}
          <div>
            <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Проект</label>
            <select
              value={selectedProject}
              onChange={(e) => onProjectChange(e.target.value)}
              className="w-full px-3 py-2 text-xs lg:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">Все проекты</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee filter */}
          <div>
            <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Исполнитель</label>
            <select
              value={selectedAssignee}
              onChange={(e) => onAssigneeChange(e.target.value)}
              className="w-full px-3 py-2 text-xs lg:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">Все исполнители</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority filter */}
          <div>
            <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Приоритет</label>
            <select
              value={selectedPriority}
              onChange={(e) => onPriorityChange(e.target.value)}
              className="w-full px-3 py-2 text-xs lg:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {priorities.map((priority) => (
                <option key={priority.id} value={priority.id}>
                  {priority.fullLabel}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Статус</label>
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full px-3 py-2 text-xs lg:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.fullLabel}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default GanttFilters;
