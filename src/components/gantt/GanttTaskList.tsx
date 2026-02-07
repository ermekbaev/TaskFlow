'use client';

import React from 'react';
import { GanttTask } from '@/types/gantt';

interface GanttTaskListProps {
  tasks: GanttTask[];
  expandedTasks: Set<string>;
  onToggleExpand: (taskId: string) => void;
  selectedTask: string | null;
  onSelectTask: (taskId: string) => void;
  onTaskDoubleClick: (task: GanttTask) => void;
  onStatusChange: (taskId: string, newStatus: GanttTask['status']) => void;
  listWidth: number;
  isMobile: boolean;
}

const GanttTaskList: React.FC<GanttTaskListProps> = ({
  tasks,
  expandedTasks,
  onToggleExpand,
  selectedTask,
  onSelectTask,
  onTaskDoubleClick,
  onStatusChange,
  listWidth,
  isMobile,
}) => {
  const getPriorityBadge = (priority: string) => {
    const styles = {
      critical: 'bg-red-100 text-red-700 border-red-200',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      medium: 'bg-amber-100 text-amber-700 border-amber-200',
      low: 'bg-gray-100 text-gray-600 border-gray-200',
    };
    const labels = {
      critical: 'Крит',
      high: 'Выс',
      medium: 'Сред',
      low: 'Низ',
    };
    return (
      <span className={`px-1.5 lg:px-2 py-0.5 text-xs font-medium rounded border ${styles[priority as keyof typeof styles]}`}>
        {labels[priority as keyof typeof labels]}
      </span>
    );
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      not_started: 'ri-checkbox-blank-circle-line text-gray-400',
      in_progress: 'ri-loader-4-line text-emerald-500',
      completed: 'ri-checkbox-circle-fill text-emerald-600',
      on_hold: 'ri-pause-circle-line text-amber-500',
    };
    return icons[status as keyof typeof icons] || icons.not_started;
  };

  const getNextStatus = (currentStatus: GanttTask['status']): GanttTask['status'] => {
    const statusOrder: GanttTask['status'][] = ['not_started', 'in_progress', 'completed', 'on_hold'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    return statusOrder[nextIndex];
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      not_started: 'Не начато',
      in_progress: 'В работе',
      completed: 'Завершено',
      on_hold: 'На паузе',
    };
    return labels[status as keyof typeof labels] || 'Не начато';
  };

  const handleStatusClick = (e: React.MouseEvent, task: GanttTask) => {
    e.stopPropagation();
    const newStatus = getNextStatus(task.status);
    onStatusChange(task.id, newStatus);
  };

  const renderTask = (task: GanttTask, level: number = 0) => {
    const hasChildren = task.children && task.children.length > 0;
    const isExpanded = expandedTasks.has(task.id);
    const isSelected = selectedTask === task.id;

    return (
      <React.Fragment key={task.id}>
        <div
          className={`flex items-center min-h-[40px] lg:h-10 border-b border-gray-100/80 cursor-pointer transition-all duration-150 py-2 lg:py-0 ${
            isSelected ? 'bg-emerald-50/70 border-l-2 border-l-emerald-500' : 'border-l-2 border-l-transparent hover:bg-gray-50/80'
          } ${task.isMilestone ? 'bg-amber-50/30' : ''}`}
          onClick={() => onSelectTask(task.id)}
          onDoubleClick={() => onTaskDoubleClick(task)}
        >
          {/* Expand/Collapse */}
          <div
            className="w-6 lg:w-8 flex items-center justify-center flex-shrink-0"
            style={{ paddingLeft: isMobile ? level * 12 : level * 16 }}
          >
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand(task.id);
                }}
                className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-700 cursor-pointer transition-colors"
              >
                <i className={`ri-arrow-${isExpanded ? 'down' : 'right'}-s-line text-sm`}></i>
              </button>
            ) : (
              <div className="w-5"></div>
            )}
          </div>

          {/* Status icon - clickable */}
          <div
            className="w-6 flex items-center justify-center flex-shrink-0 group relative"
            onClick={(e) => handleStatusClick(e, task)}
            title={`${getStatusLabel(task.status)} - Нажмите для изменения`}
          >
            <i className={`${getStatusIcon(task.status)} cursor-pointer hover:scale-110 transition-transform text-base lg:text-[15px]`}></i>
            {!isMobile && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800/90 backdrop-blur-sm text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg">
                {getStatusLabel(task.status)}
              </div>
            )}
          </div>

          {/* Task name and details */}
          <div className="flex-1 min-w-0 px-2 flex flex-col lg:flex-row lg:items-center space-y-1 lg:space-y-0 lg:space-x-2">
            <div className="flex items-center space-x-2 min-w-0">
              {task.isMilestone && (
                <i className="ri-flag-fill text-amber-500 flex-shrink-0 text-sm"></i>
              )}
              {hasChildren && !task.isMilestone && (
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: task.projectColor }}></div>
              )}
              <span
                className={`text-xs lg:text-[13px] truncate ${
                  hasChildren ? 'font-semibold text-gray-900' : 'text-gray-700'
                } ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}
              >
                {task.name}
              </span>
            </div>

            {/* Mobile: Show assignee and priority inline */}
            {isMobile && (
              <div className="flex items-center space-x-2">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium text-white flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: task.projectColor }}
                  title={task.assigneeName}
                >
                  {task.assigneeName.split(' ').map(n => n[0]).join('')}
                </div>
                {getPriorityBadge(task.priority)}
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <div className="w-12 bg-gray-200 rounded-full h-1">
                    <div
                      className="h-1 rounded-full transition-all duration-300"
                      style={{
                        width: `${task.progress}%`,
                        backgroundColor: task.progress === 100 ? '#10B981' : task.projectColor,
                      }}
                    ></div>
                  </div>
                  <span className="text-[11px] tabular-nums">{task.progress}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Desktop: Assignee */}
          {!isMobile && listWidth > 400 && (
            <div className="w-24 flex items-center justify-center flex-shrink-0">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium text-white shadow-sm"
                style={{ backgroundColor: task.projectColor }}
                title={task.assigneeName}
              >
                {task.assigneeName.split(' ').map(n => n[0]).join('')}
              </div>
            </div>
          )}

          {/* Desktop: Priority */}
          {!isMobile && listWidth > 500 && (
            <div className="w-16 flex items-center justify-center flex-shrink-0">
              {getPriorityBadge(task.priority)}
            </div>
          )}

          {/* Desktop: Progress */}
          {!isMobile && listWidth > 600 && (
            <div className="w-20 flex items-center px-2 flex-shrink-0">
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${task.progress}%`,
                    backgroundColor: task.progress === 100 ? '#10B981' : task.projectColor,
                  }}
                ></div>
              </div>
              <span className="ml-2 text-[11px] text-gray-400 w-8 tabular-nums">{task.progress}%</span>
            </div>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && task.children?.map((child) => renderTask(child, level + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white w-full" style={!isMobile ? { width: listWidth } : {}}>
      {/* Header */}
      <div className="flex items-center h-[50px] lg:h-14 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="w-6 lg:w-8 flex-shrink-0"></div>
        <div className="w-6 flex-shrink-0"></div>
        <div className="flex-1 px-2 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
          Задача
        </div>
        {!isMobile && listWidth > 400 && (
          <div className="w-24 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-widest flex-shrink-0">
            Исп.
          </div>
        )}
        {!isMobile && listWidth > 500 && (
          <div className="w-16 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-widest flex-shrink-0">
            Приор.
          </div>
        )}
        {!isMobile && listWidth > 600 && (
          <div className="w-20 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-widest flex-shrink-0">
            Прогресс
          </div>
        )}
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto">
        {tasks.map((task) => renderTask(task))}
      </div>
    </div>
  );
};

export default GanttTaskList;
