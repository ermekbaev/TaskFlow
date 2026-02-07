'use client';

import React from 'react';

interface GanttToolbarProps {
  viewMode: 'day' | 'week' | 'month' | 'quarter';
  onViewModeChange: (mode: 'day' | 'week' | 'month' | 'quarter') => void;
  onTodayClick: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  showCriticalPath: boolean;
  onToggleCriticalPath: () => void;
  showBaseline: boolean;
  onToggleBaseline: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onExport: () => void;
  onAddTask: () => void;
  isMobile: boolean;
}

const GanttToolbar: React.FC<GanttToolbarProps> = ({
  viewMode,
  onViewModeChange,
  onTodayClick,
  onZoomIn,
  onZoomOut,
  showCriticalPath,
  onToggleCriticalPath,
  showBaseline,
  onToggleBaseline,
  searchQuery,
  onSearchChange,
  onExport,
  onAddTask,
  isMobile,
}) => {
  const viewModes = [
    { key: 'day', label: 'День', shortLabel: 'Д' },
    { key: 'week', label: 'Неделя', shortLabel: 'Н' },
    { key: 'month', label: 'Месяц', shortLabel: 'М' },
    { key: 'quarter', label: 'Квартал', shortLabel: 'К' },
  ] as const;

  return (
    <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-2 lg:py-2.5">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-2 lg:space-y-0">
        {/* Left section */}
        <div className="flex items-center space-x-2 lg:space-x-3">
          <button
            onClick={onAddTask}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors cursor-pointer whitespace-nowrap text-sm font-medium shadow-sm"
          >
            <i className="ri-add-line text-base"></i>
            <span className="hidden sm:inline">Новая задача</span>
            <span className="sm:hidden">Задача</span>
          </button>

          <div className="relative flex-1 lg:flex-none">
            <i className="ri-search-line absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input
              type="text"
              placeholder="Поиск задач..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 pr-3 py-1.5 w-full lg:w-44 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all bg-gray-50/50 hover:bg-white"
            />
          </div>
        </div>

        {/* Center section - View mode */}
        <div className="flex items-center justify-between lg:justify-center space-x-2">
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            {viewModes.map((mode) => (
              <button
                key={mode.key}
                onClick={() => onViewModeChange(mode.key)}
                className={`px-2.5 lg:px-3.5 py-1.5 text-xs lg:text-sm font-medium rounded-md transition-all duration-150 cursor-pointer whitespace-nowrap ${
                  viewMode === mode.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <span className="lg:hidden">{mode.shortLabel}</span>
                <span className="hidden lg:inline">{mode.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={onTodayClick}
            className="px-3 py-1.5 text-xs lg:text-sm font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer whitespace-nowrap"
          >
            Сегодня
          </button>

          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={onZoomOut}
              className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-700 cursor-pointer transition-colors"
            >
              <i className="ri-subtract-line text-sm"></i>
            </button>
            <div className="w-px h-5 bg-gray-200"></div>
            <button
              onClick={onZoomIn}
              className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-700 cursor-pointer transition-colors"
            >
              <i className="ri-add-line text-sm"></i>
            </button>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center justify-end space-x-1.5 lg:space-x-2 overflow-x-auto">
          {!isMobile && (
            <>
              <button
                onClick={onToggleCriticalPath}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap ${
                  showCriticalPath
                    ? 'bg-red-50 text-red-600 border border-red-200 shadow-sm'
                    : 'text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <i className="ri-route-line"></i>
                <span className="hidden xl:inline">Крит. путь</span>
              </button>

              <button
                onClick={onToggleBaseline}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap ${
                  showBaseline
                    ? 'bg-amber-50 text-amber-600 border border-amber-200 shadow-sm'
                    : 'text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <i className="ri-git-branch-line"></i>
                <span className="hidden xl:inline">Базовый план</span>
              </button>
            </>
          )}

          <button
            onClick={onExport}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-download-line"></i>
            <span className="hidden sm:inline">Экспорт</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GanttToolbar;
