'use client';

import React from 'react';
import { GanttTask } from '@/types/gantt';

interface GanttStatsProps {
  tasks: GanttTask[];
  onFullscreen: () => void;
  isMobile: boolean;
}

const GanttStats: React.FC<GanttStatsProps> = ({ tasks, onFullscreen, isMobile }) => {
  // Flatten all tasks including children
  const flattenTasks = (taskList: GanttTask[]): GanttTask[] => {
    return taskList.reduce((acc: GanttTask[], task) => {
      acc.push(task);
      if (task.children) {
        acc.push(...flattenTasks(task.children));
      }
      return acc;
    }, []);
  };

  const allTasks = flattenTasks(tasks);
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length;

  // Calculate overdue tasks
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueTasks = allTasks.filter(t => {
    const endDate = new Date(t.endDate);
    return endDate < today && t.status !== 'completed';
  }).length;

  // Calculate total hours
  const totalEstimated = allTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const totalActual = allTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);

  // Calculate average progress
  const avgProgress = totalTasks > 0 ? Math.round(allTasks.reduce((sum, t) => sum + t.progress, 0) / totalTasks) : 0;

  // Calculate milestones
  const milestones = allTasks.filter(t => t.isMilestone);
  const completedMilestones = milestones.filter(t => t.status === 'completed').length;

  if (isMobile) {
    return (
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 text-xs overflow-x-auto">
            <div className="flex items-center space-x-1 whitespace-nowrap">
              <span className="text-gray-400">Всего</span>
              <span className="font-semibold text-gray-900 tabular-nums">{totalTasks}</span>
            </div>

            <div className="w-px h-3 bg-gray-200"></div>

            <div className="flex items-center space-x-1 whitespace-nowrap">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              <span className="font-semibold text-emerald-600 tabular-nums">{completedTasks}</span>
            </div>

            {overdueTasks > 0 && (
              <>
                <div className="w-px h-3 bg-gray-200"></div>
                <div className="flex items-center space-x-1 whitespace-nowrap">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  <span className="font-semibold text-red-600 tabular-nums">{overdueTasks}</span>
                </div>
              </>
            )}

            <div className="w-px h-3 bg-gray-200"></div>

            <div className="flex items-center space-x-1.5 whitespace-nowrap">
              <div className="w-14 bg-gray-100 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${avgProgress}%` }}
                ></div>
              </div>
              <span className="font-semibold text-gray-700 tabular-nums">{avgProgress}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50/80 border-t border-gray-200 px-6 py-2">
      <div className="flex items-center justify-between">
        {/* Left stats */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-gray-400">Всего</span>
            <span className="text-xs font-semibold text-gray-700 tabular-nums">{totalTasks}</span>
          </div>

          <div className="w-px h-3 bg-gray-200"></div>

          <div className="flex items-center space-x-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            <span className="text-xs text-gray-400">Завершено</span>
            <span className="text-xs font-semibold text-emerald-600 tabular-nums">{completedTasks}</span>
            <span className="text-[10px] text-gray-400">({totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0}%)</span>
          </div>

          <div className="w-px h-3 bg-gray-200"></div>

          <div className="flex items-center space-x-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
            <span className="text-xs text-gray-400">В работе</span>
            <span className="text-xs font-semibold text-blue-600 tabular-nums">{inProgressTasks}</span>
          </div>

          {overdueTasks > 0 && (
            <>
              <div className="w-px h-3 bg-gray-200"></div>
              <div className="flex items-center space-x-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                <span className="text-xs text-red-600 font-semibold tabular-nums">
                  {overdueTasks} просроч.
                </span>
              </div>
            </>
          )}
        </div>

        {/* Center stats */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <i className="ri-flag-line text-amber-500 text-xs"></i>
            <span className="text-xs text-gray-400">Вехи</span>
            <span className="text-xs font-semibold tabular-nums">{completedMilestones}/{milestones.length}</span>
          </div>

          <div className="w-px h-3 bg-gray-200"></div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">Прогресс</span>
            <div className="w-20 bg-gray-200 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${avgProgress}%` }}
              ></div>
            </div>
            <span className="text-xs font-semibold text-gray-700 tabular-nums">{avgProgress}%</span>
          </div>

          <div className="w-px h-3 bg-gray-200"></div>

          <div className="flex items-center space-x-1.5">
            <i className="ri-time-line text-gray-400 text-xs"></i>
            <span className="text-xs text-gray-400">Часы</span>
            <span className="text-xs font-semibold tabular-nums">{totalActual}<span className="text-gray-400 font-normal">/{totalEstimated}ч</span></span>
          </div>
        </div>

        {/* Right actions */}
        <button
          onClick={onFullscreen}
          className="flex items-center space-x-1.5 px-2 py-1 text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
        >
          <i className="ri-fullscreen-line text-sm"></i>
          <span>Полный экран</span>
        </button>
      </div>
    </div>
  );
};

export default GanttStats;
