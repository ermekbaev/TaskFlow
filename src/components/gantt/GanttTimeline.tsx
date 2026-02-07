'use client';

import React, { useRef, useEffect, useState } from 'react';
import { GanttTask } from '@/types/gantt';

interface GanttTimelineProps {
  tasks: GanttTask[];
  expandedTasks: Set<string>;
  viewMode: 'day' | 'week' | 'month' | 'quarter';
  startDate: Date;
  endDate: Date;
  selectedTask: string | null;
  onSelectTask: (taskId: string) => void;
  onTaskDoubleClick: (task: GanttTask) => void;
  showCriticalPath: boolean;
  showBaseline: boolean;
  onTaskDrag: (taskId: string, newStartDate: Date, newEndDate: Date) => void;
  cellWidth: number;
  isMobile: boolean;
}

const GanttTimeline: React.FC<GanttTimelineProps> = ({
  tasks,
  expandedTasks,
  viewMode,
  startDate,
  endDate,
  selectedTask,
  onSelectTask,
  onTaskDoubleClick,
  showCriticalPath,
  showBaseline,
  onTaskDrag,
  cellWidth,
  isMobile,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{
    taskId: string;
    type: 'move' | 'resize-start' | 'resize-end';
    startX: number;
    originalStart: Date;
    originalEnd: Date;
  } | null>(null);

  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  // Adjust cell width for mobile
  const effectiveCellWidth = isMobile ? Math.max(cellWidth * 0.6, 20) : cellWidth;

  // Calculate dates array
  const getDatesArray = () => {
    const dates: Date[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const dates = getDatesArray();
  const totalWidth = dates.length * effectiveCellWidth;

  // Get position and width for a task bar
  const getTaskPosition = (task: GanttTask) => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);

    const startDiff = Math.floor((taskStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.floor((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return {
      left: startDiff * effectiveCellWidth,
      width: Math.max(duration * effectiveCellWidth - 4, task.isMilestone ? (isMobile ? 16 : 20) : (isMobile ? 30 : 40)),
    };
  };

  // Get today's position
  const getTodayPosition = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return diff * effectiveCellWidth;
  };

  // Format header dates based on view mode
  const formatHeaderDate = (date: Date, level: 'top' | 'bottom') => {
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const shortMonths = ['Я', 'Ф', 'М', 'А', 'М', 'И', 'И', 'А', 'С', 'О', 'Н', 'Д'];

    if (level === 'top') {
      if (viewMode === 'day' || viewMode === 'week') {
        return isMobile ? `${shortMonths[date.getMonth()]} ${date.getFullYear()}` : `${months[date.getMonth()]} ${date.getFullYear()}`;
      }
      if (viewMode === 'month') {
        return `${date.getFullYear()}`;
      }
      return `${date.getFullYear()}`;
    }

    if (viewMode === 'day') {
      return date.getDate().toString();
    }
    if (viewMode === 'week') {
      return `${date.getDate()}`;
    }
    return isMobile ? shortMonths[date.getMonth()] : months[date.getMonth()];
  };

  // Group dates for header
  const getHeaderGroups = () => {
    const groups: { label: string; width: number; dates: Date[] }[] = [];
    let currentGroup: { label: string; dates: Date[] } | null = null;

    dates.forEach((date) => {
      const label = formatHeaderDate(date, 'top');
      if (!currentGroup || currentGroup.label !== label) {
        if (currentGroup) {
          groups.push({
            label: currentGroup.label,
            width: currentGroup.dates.length * effectiveCellWidth,
            dates: currentGroup.dates,
          });
        }
        currentGroup = { label, dates: [date] };
      } else {
        currentGroup.dates.push(date);
      }
    });

    if (currentGroup) {
      groups.push({
        label: (currentGroup as { label: string; dates: Date[] }).label,
        width: (currentGroup as { label: string; dates: Date[] }).dates.length * effectiveCellWidth,
        dates: (currentGroup as { label: string; dates: Date[] }).dates,
      });
    }

    return groups;
  };

  const headerGroups = getHeaderGroups();
  const todayPosition = getTodayPosition();

  // Check if date is weekend
  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  // Handle drag start
  const handleMouseDown = (
    e: React.MouseEvent,
    taskId: string,
    type: 'move' | 'resize-start' | 'resize-end',
    task: GanttTask
  ) => {
    if (isMobile) return;
    e.stopPropagation();
    setDragging({
      taskId,
      type,
      startX: e.clientX,
      originalStart: new Date(task.startDate),
      originalEnd: new Date(task.endDate),
    });
  };

  // Handle drag
  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = Math.round((e.clientX - dragging.startX) / effectiveCellWidth);
      if (diff === 0) return;

      const newStart = new Date(dragging.originalStart);
      const newEnd = new Date(dragging.originalEnd);

      if (dragging.type === 'move') {
        newStart.setDate(newStart.getDate() + diff);
        newEnd.setDate(newEnd.getDate() + diff);
      } else if (dragging.type === 'resize-start') {
        newStart.setDate(newStart.getDate() + diff);
        if (newStart >= newEnd) return;
      } else if (dragging.type === 'resize-end') {
        newEnd.setDate(newEnd.getDate() + diff);
        if (newEnd <= newStart) return;
      }

      onTaskDrag(dragging.taskId, newStart, newEnd);
    };

    const handleMouseUp = () => {
      setDragging(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, effectiveCellWidth, onTaskDrag]);

  // Render task bar
  const renderTaskBar = (task: GanttTask, level: number = 0) => {
    const hasChildren = task.children && task.children.length > 0;
    const isExpanded = expandedTasks.has(task.id);
    const isSelected = selectedTask === task.id;
    const isHovered = hoveredTask === task.id;
    const position = getTaskPosition(task);

    const isCritical = showCriticalPath && (task.priority === 'critical' || task.dependencies?.some(d =>
      tasks.some(t => t.id === d && t.priority === 'critical')
    ));

    return (
      <React.Fragment key={task.id}>
        <div className="relative h-10 lg:h-10 border-b border-gray-100/60">
          {/* Task bar */}
          {task.isMilestone ? (
            // Milestone diamond
            <div
              className={`absolute top-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ${
                isSelected ? 'scale-130' : isHovered ? 'scale-115' : ''
              }`}
              style={{ left: position.left + position.width / 2 - (isMobile ? 8 : 10) }}
              onClick={() => onSelectTask(task.id)}
              onDoubleClick={() => onTaskDoubleClick(task)}
              onMouseEnter={() => !isMobile && setHoveredTask(task.id)}
              onMouseLeave={() => !isMobile && setHoveredTask(null)}
            >
              <div
                className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} rotate-45 ${
                  isCritical ? 'bg-red-500 shadow-red-200' : 'bg-amber-500 shadow-amber-200'
                } shadow-md ${isSelected ? 'ring-2 ring-offset-2 ring-amber-400' : ''}`}
              ></div>
              {/* Milestone label */}
              {!isMobile && (isHovered || isSelected) && (
                <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-gray-900/90 backdrop-blur-sm text-white text-xs rounded-md whitespace-nowrap z-20 shadow-lg">
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900/90 rotate-45"></div>
                  {task.name}
                </div>
              )}
            </div>
          ) : (
            // Task bar (regular and parent/epic)
            <div
              className={`absolute top-1/2 -translate-y-1/2 ${isMobile ? 'h-6' : 'h-7'} rounded-lg cursor-pointer transition-all duration-200 group ${
                isSelected ? 'ring-2 ring-offset-1' : ''
              } ${isHovered ? 'shadow-lg brightness-105' : 'shadow-sm'}`}
              style={{
                left: position.left,
                width: position.width,
                backgroundColor: isCritical ? '#EF4444' : task.projectColor,
                '--tw-ring-color': task.projectColor,
              } as React.CSSProperties}
              onClick={() => onSelectTask(task.id)}
              onDoubleClick={() => onTaskDoubleClick(task)}
              onMouseEnter={() => !isMobile && setHoveredTask(task.id)}
              onMouseLeave={() => !isMobile && setHoveredTask(null)}
              onMouseDown={(e) => handleMouseDown(e, task.id, 'move', task)}
            >
              {/* Progress fill */}
              <div
                className="absolute inset-0 rounded-lg transition-all duration-300"
                style={{
                  width: `${task.progress}%`,
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.1) 100%)',
                }}
              ></div>
              {/* Unfilled part overlay */}
              <div
                className="absolute top-0 right-0 bottom-0 rounded-r-lg bg-black/15"
                style={{ width: `${100 - task.progress}%` }}
              ></div>

              {/* Task name */}
              <div className="absolute inset-0 flex items-center px-1.5 lg:px-2.5 overflow-hidden">
                <span className="text-xs font-medium text-white truncate drop-shadow-sm">
                  {position.width > (isMobile ? 60 : 80) ? task.name : ''}
                </span>
              </div>

              {/* Resize handles - desktop only */}
              {!isMobile && isHovered && !task.isMilestone && (
                <>
                  <div
                    className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 rounded-l-lg"
                    onMouseDown={(e) => handleMouseDown(e, task.id, 'resize-start', task)}
                  ></div>
                  <div
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 rounded-r-lg"
                    onMouseDown={(e) => handleMouseDown(e, task.id, 'resize-end', task)}
                  ></div>
                </>
              )}

              {/* Tooltip */}
              {!isMobile && isHovered && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-gray-900/90 backdrop-blur-sm text-white text-xs rounded-md whitespace-nowrap z-20 shadow-lg">
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900/90 rotate-45"></div>
                  {task.name} ({task.progress}%)
                </div>
              )}
            </div>
          )}

          {/* Baseline (original plan) - desktop only */}
          {!isMobile && showBaseline && !task.isMilestone && (
            <div
              className="absolute top-1/2 translate-y-3 h-1 rounded-full bg-gray-300/60"
              style={{
                left: position.left - 5,
                width: position.width + 10,
              }}
            ></div>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && task.children?.map((child) => renderTaskBar(child, level + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="flex-1 overflow-auto bg-white" ref={containerRef}>
      <div style={{ width: totalWidth, minWidth: '100%' }}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200">
          {/* Top level - months/years */}
          <div className="flex h-6 lg:h-7 border-b border-gray-200">
            {headerGroups.map((group, idx) => (
              <div
                key={idx}
                className="flex items-center justify-center text-xs font-semibold text-gray-700 border-r border-gray-200"
                style={{ width: group.width }}
              >
                {group.label}
              </div>
            ))}
          </div>

          {/* Bottom level - days/weeks */}
          <div className="flex h-6 lg:h-7">
            {dates.map((date, idx) => {
              const isToday = (() => {
                const today = new Date();
                return date.getDate() === today.getDate() &&
                       date.getMonth() === today.getMonth() &&
                       date.getFullYear() === today.getFullYear();
              })();
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-center text-xs border-r border-gray-100 transition-colors ${
                    isToday
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : isWeekend(date)
                        ? 'bg-gray-100/70 text-gray-400'
                        : 'text-gray-500'
                  }`}
                  style={{ width: effectiveCellWidth }}
                >
                  {formatHeaderDate(date, 'bottom')}
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline grid */}
        <div className="relative">
          {/* Grid columns */}
          <div className="absolute inset-0 flex pointer-events-none">
            {dates.map((date, idx) => (
              <div
                key={idx}
                className={`border-r border-gray-50 ${isWeekend(date) ? 'bg-gray-50/50' : ''}`}
                style={{ width: effectiveCellWidth }}
              ></div>
            ))}
          </div>

          {/* Today line */}
          {todayPosition >= 0 && todayPosition <= totalWidth && (
            <div
              className="absolute top-0 bottom-0 z-10"
              style={{ left: todayPosition }}
            >
              <div className="absolute inset-y-0 -left-px w-0.5 bg-emerald-500/70"></div>
              <div className={`absolute -top-0.5 left-1/2 -translate-x-1/2 ${isMobile ? 'px-1' : 'px-1.5'} py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded-b-md shadow-sm`}>
                {isMobile ? '' : 'Сегодня'}
              </div>
            </div>
          )}

          {/* Task bars */}
          {tasks.map((task) => renderTaskBar(task))}
        </div>
      </div>
    </div>
  );
};

export default GanttTimeline;
