'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '@/components/feature/Navbar';
import GanttToolbar from '@/components/gantt/GanttToolbar';
import GanttFilters from '@/components/gantt/GanttFilters';
import GanttTaskList from '@/components/gantt/GanttTaskList';
import GanttTimeline from '@/components/gantt/GanttTimeline';
import GanttStats from '@/components/gantt/GanttStats';
import TaskDetailPanel from '@/components/gantt/TaskDetailPanel';
import CreateTaskModal from '@/components/gantt/CreateTaskModal';
import { GanttTask } from '@/types/gantt';
import { useAuth } from '@/contexts/AuthContext';

interface GanttProject {
  id: string;
  name: string;
  color: string;
  key: string;
}

interface GanttUser {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

const GanttPage: React.FC = () => {
  const { user, loading } = useAuth();

  // Data from API
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [projects, setProjects] = useState<GanttProject[]>([]);
  const [users, setUsers] = useState<GanttUser[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View settings
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'quarter'>('week');
  const [cellWidth, setCellWidth] = useState(40);
  const [listWidth, setListWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showMobileTimeline, setShowMobileTimeline] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedAssignee, setSelectedAssignee] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [groupBy, setGroupBy] = useState<'none' | 'project' | 'assignee' | 'priority'>('none');

  // UI state
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [detailTask, setDetailTask] = useState<GanttTask | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCriticalPath, setShowCriticalPath] = useState(false);
  const [showBaseline, setShowBaseline] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Date range
  const [dateRange, setDateRange] = useState(() => {
    const start = new Date();
    start.setDate(start.getDate() - 14);
    const end = new Date();
    end.setDate(end.getDate() + 60);
    return { start, end };
  });

  // Resizer ref
  const resizerRef = useRef<HTMLDivElement>(null);

  // Load data from API
  const fetchData = useCallback(async () => {
    try {
      setDataLoading(true);
      setError(null);
      const res = await fetch('/api/gantt');
      if (!res.ok) throw new Error('Ошибка загрузки данных');
      const data = await res.json();
      setTasks(data.tasks || []);
      setProjects(data.projects || []);
      setUsers(data.users || []);
      // Expand all project epics by default
      const epicIds = (data.tasks || []).map((t: GanttTask) => t.id);
      setExpandedTasks(new Set(epicIds));
      // Adjust date range to cover tasks
      if (data.tasks && data.tasks.length > 0) {
        const allDates: number[] = [];
        for (const epic of data.tasks) {
          allDates.push(new Date(epic.startDate).getTime());
          allDates.push(new Date(epic.endDate).getTime());
        }
        const minDate = new Date(Math.min(...allDates));
        const maxDate = new Date(Math.max(...allDates));
        minDate.setDate(minDate.getDate() - 7);
        maxDate.setDate(maxDate.getDate() + 14);
        setDateRange({ start: minDate, end: maxDate });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setListWidth(window.innerWidth);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle resizer drag
  const handleResizerMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMobileView) return;
    e.preventDefault();
    setIsResizing(true);
  }, [isMobileView]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(300, Math.min(600, e.clientX));
      setListWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Filter tasks
  const filterTasks = useCallback((taskList: GanttTask[]): GanttTask[] => {
    return taskList.filter(task => {
      if (searchQuery && !task.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        if (task.children) {
          const filteredChildren = filterTasks(task.children);
          if (filteredChildren.length === 0) return false;
        } else {
          return false;
        }
      }

      if (selectedProject !== 'all' && task.projectId !== selectedProject) {
        if (task.children) {
          const filteredChildren = task.children.filter(c => c.projectId === selectedProject);
          if (filteredChildren.length === 0) return false;
        } else {
          return false;
        }
      }

      if (selectedAssignee !== 'all' && task.assigneeId !== selectedAssignee) {
        if (task.children) {
          const filteredChildren = task.children.filter(c => c.assigneeId === selectedAssignee);
          if (filteredChildren.length === 0) return false;
        } else {
          return false;
        }
      }

      if (selectedPriority !== 'all' && task.priority !== selectedPriority) {
        if (task.children) {
          const filteredChildren = task.children.filter(c => c.priority === selectedPriority);
          if (filteredChildren.length === 0) return false;
        } else {
          return false;
        }
      }

      if (selectedStatus !== 'all' && task.status !== selectedStatus) {
        if (task.children) {
          const filteredChildren = task.children.filter(c => c.status === selectedStatus);
          if (filteredChildren.length === 0) return false;
        } else {
          return false;
        }
      }

      return true;
    }).map(task => ({
      ...task,
      children: task.children ? filterTasks(task.children) : undefined,
    }));
  }, [searchQuery, selectedProject, selectedAssignee, selectedPriority, selectedStatus]);

  const filteredTasks = filterTasks(tasks);

  // Helper: update a task in the local tree
  const updateTaskInTree = (taskList: GanttTask[], taskId: string, updater: (t: GanttTask) => GanttTask): GanttTask[] => {
    return taskList.map(task => {
      if (task.id === taskId) {
        return updater(task);
      }
      if (task.children) {
        const updatedChildren = updateTaskInTree(task.children, taskId, updater);
        if (updatedChildren !== task.children) {
          // Recalculate epic stats
          const avgProgress = updatedChildren.length > 0
            ? Math.round(updatedChildren.reduce((sum, c) => sum + c.progress, 0) / updatedChildren.length)
            : 0;
          const dates = updatedChildren.map(c => ({ start: new Date(c.startDate).getTime(), end: new Date(c.endDate).getTime() }));
          const epicStart = new Date(Math.min(...dates.map(d => d.start)));
          const epicEnd = new Date(Math.max(...dates.map(d => d.end)));
          return {
            ...task,
            children: updatedChildren,
            progress: avgProgress,
            startDate: epicStart.toISOString().split('T')[0],
            endDate: epicEnd.toISOString().split('T')[0],
            status: avgProgress === 100 ? 'completed' as const : avgProgress > 0 ? 'in_progress' as const : 'not_started' as const,
          };
        }
      }
      return task;
    });
  };

  // Toggle task expansion
  const handleToggleExpand = useCallback((taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  // Handle task selection
  const handleSelectTask = useCallback((taskId: string) => {
    setSelectedTask(taskId);
  }, []);

  // Handle task double click
  const handleTaskDoubleClick = useCallback((task: GanttTask) => {
    setDetailTask(task);
  }, []);

  // Handle task drag
  const handleTaskDrag = useCallback(async (taskId: string, newStartDate: Date, newEndDate: Date) => {
    const startStr = newStartDate.toISOString().split('T')[0];
    const endStr = newEndDate.toISOString().split('T')[0];

    // Optimistic update
    setTasks(prev => updateTaskInTree(prev, taskId, (t) => ({
      ...t,
      startDate: startStr,
      endDate: endStr,
    })));

    // Don't send API calls for project epics (synthetic IDs)
    if (taskId.startsWith('project-')) return;

    try {
      const res = await fetch(`/api/gantt/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: startStr, endDate: endStr }),
      });
      if (!res.ok) {
        fetchData(); // revert on error
      }
    } catch {
      fetchData();
    }
  }, [fetchData]);

  // Handle task save
  const handleSaveTask = useCallback(async (updatedTask: GanttTask) => {
    // Optimistic update
    setTasks(prev => updateTaskInTree(prev, updatedTask.id, () => updatedTask));

    if (updatedTask.id.startsWith('project-')) return;

    try {
      const res = await fetch(`/api/gantt/${updatedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updatedTask.name,
          status: updatedTask.status,
          priority: updatedTask.priority,
          assigneeId: updatedTask.assigneeId || null,
          startDate: updatedTask.startDate,
          endDate: updatedTask.endDate,
          progress: updatedTask.progress,
          description: updatedTask.description,
          estimatedHours: updatedTask.estimatedHours,
          actualHours: updatedTask.actualHours,
        }),
      });
      if (!res.ok) {
        fetchData();
      }
    } catch {
      fetchData();
    }
  }, [fetchData]);

  // Handle task delete
  const handleDeleteTask = useCallback(async (taskId: string) => {
    // Optimistic update
    setTasks(prev => {
      return prev.map(task => {
        if (task.id === taskId) return null;
        if (task.children) {
          const filtered = task.children.filter(c => c.id !== taskId);
          if (filtered.length !== task.children.length) {
            if (filtered.length === 0) return null; // Remove empty epic
            // Recalculate epic
            const avgProgress = Math.round(filtered.reduce((sum, c) => sum + c.progress, 0) / filtered.length);
            const dates = filtered.map(c => ({ start: new Date(c.startDate).getTime(), end: new Date(c.endDate).getTime() }));
            const epicStart = new Date(Math.min(...dates.map(d => d.start)));
            const epicEnd = new Date(Math.max(...dates.map(d => d.end)));
            return {
              ...task,
              children: filtered,
              progress: avgProgress,
              startDate: epicStart.toISOString().split('T')[0],
              endDate: epicEnd.toISOString().split('T')[0],
            };
          }
        }
        return task;
      }).filter(Boolean) as GanttTask[];
    });
    setSelectedTask(null);

    if (taskId.startsWith('project-')) return;

    try {
      const res = await fetch(`/api/gantt/${taskId}`, { method: 'DELETE' });
      if (!res.ok) {
        fetchData();
      }
    } catch {
      fetchData();
    }
  }, [fetchData]);

  // Handle status change
  const handleStatusChange = useCallback(async (taskId: string, newStatus: GanttTask['status']) => {
    const newProgress = newStatus === 'completed' ? 100 :
                       newStatus === 'not_started' ? 0 : undefined;

    // Optimistic update
    setTasks(prev => updateTaskInTree(prev, taskId, (t) => ({
      ...t,
      status: newStatus,
      progress: newProgress !== undefined ? newProgress : t.progress,
    })));

    if (taskId.startsWith('project-')) return;

    try {
      const body: Record<string, unknown> = { status: newStatus };
      if (newProgress !== undefined) body.progress = newProgress;
      const res = await fetch(`/api/gantt/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        fetchData();
      }
    } catch {
      fetchData();
    }
  }, [fetchData]);

  // Handle create task
  const handleCreateTask = useCallback(async (newTask: Omit<GanttTask, 'id'>) => {
    try {
      const res = await fetch('/api/gantt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTask.name,
          projectId: newTask.projectId,
          assigneeId: newTask.assigneeId || null,
          priority: newTask.priority,
          status: newTask.status,
          startDate: newTask.startDate,
          endDate: newTask.endDate,
          description: newTask.description,
          estimatedHours: newTask.estimatedHours,
          isMilestone: newTask.isMilestone,
        }),
      });
      if (!res.ok) throw new Error('Ошибка создания задачи');
      // Reload full data to get updated epic
      await fetchData();
    } catch (err) {
      console.error('Create task error:', err);
    }
  }, [fetchData]);

  // Handle today click
  const handleTodayClick = useCallback(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 14);
    const end = new Date(today);
    end.setDate(end.getDate() + 30);
    setDateRange({ start, end });
  }, []);

  // Handle zoom
  const handleZoomIn = useCallback(() => {
    setCellWidth(prev => Math.min(prev + 10, 80));
  }, []);

  const handleZoomOut = useCallback(() => {
    setCellWidth(prev => Math.max(prev - 10, 20));
  }, []);

  // Handle export
  const handleExport = useCallback(() => {
    const data = JSON.stringify(tasks, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gantt-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [tasks]);

  // Handle fullscreen
  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          <span className="text-sm text-gray-500">Загрузка диаграммы Ганта...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <i className="ri-error-warning-line text-4xl text-red-400"></i>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={fetchData}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors cursor-pointer"
            >
              Повторить
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Page header */}
      <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-2.5 lg:py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex w-9 h-9 rounded-lg bg-emerald-50 items-center justify-center">
              <i className="ri-bar-chart-horizontal-line text-emerald-600 text-lg"></i>
            </div>
            <div>
              <div className="hidden lg:flex items-center space-x-1.5 text-xs text-gray-400 mb-0.5">
                <a href="/projects" className="hover:text-gray-600 transition-colors cursor-pointer">Проекты</a>
                <i className="ri-arrow-right-s-line text-[10px]"></i>
                <span className="text-gray-600">Диаграмма Ганта</span>
              </div>
              <h1 className="text-lg lg:text-xl font-bold text-gray-900">Диаграмма Ганта</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2 lg:space-x-3">
            <div className="hidden md:flex items-center -space-x-1.5">
              {users.slice(0, 4).map((u) => (
                <div
                  key={u.id}
                  className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-[10px] font-semibold border-2 border-white shadow-sm"
                  title={u.name}
                >
                  {u.avatar}
                </div>
              ))}
              {users.length > 4 && (
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-[10px] font-semibold border-2 border-white">
                  +{users.length - 4}
                </div>
              )}
            </div>
            <button className="flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors cursor-pointer whitespace-nowrap">
              <i className="ri-share-line text-sm"></i>
              <span className="hidden sm:inline">Поделиться</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <GanttToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onTodayClick={handleTodayClick}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        showCriticalPath={showCriticalPath}
        onToggleCriticalPath={() => setShowCriticalPath(!showCriticalPath)}
        showBaseline={showBaseline}
        onToggleBaseline={() => setShowBaseline(!showBaseline)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onExport={handleExport}
        onAddTask={() => setShowCreateModal(true)}
        isMobile={isMobileView}
      />

      {/* Filters */}
      <GanttFilters
        selectedProject={selectedProject}
        onProjectChange={setSelectedProject}
        selectedAssignee={selectedAssignee}
        onAssigneeChange={setSelectedAssignee}
        selectedPriority={selectedPriority}
        onPriorityChange={setSelectedPriority}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        projects={projects}
        users={users}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        isMobile={isMobileView}
      />

      {/* Mobile view toggle */}
      {isMobileView && (
        <div className="bg-white border-b border-gray-200 px-4 py-1.5">
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setShowMobileTimeline(false)}
              className={`flex-1 flex items-center justify-center space-x-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150 cursor-pointer ${
                !showMobileTimeline ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              <i className="ri-list-check text-sm"></i>
              <span>Список</span>
            </button>
            <button
              onClick={() => setShowMobileTimeline(true)}
              className={`flex-1 flex items-center justify-center space-x-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150 cursor-pointer ${
                showMobileTimeline ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              <i className="ri-calendar-line text-sm"></i>
              <span>Шкала</span>
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {tasks.length === 0 && !dataLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <i className="ri-bar-chart-horizontal-line text-4xl text-gray-300"></i>
            <p className="text-gray-500">Нет задач для отображения</p>
            <p className="text-sm text-gray-400">Создайте задачи в проектах, чтобы увидеть диаграмму Ганта</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors cursor-pointer"
            >
              Создать задачу
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      {tasks.length > 0 && (
        <div className="flex-1 flex overflow-hidden">
          {/* Desktop view */}
          {!isMobileView && (
            <>
              {/* Task list */}
              <GanttTaskList
                tasks={filteredTasks}
                expandedTasks={expandedTasks}
                onToggleExpand={handleToggleExpand}
                selectedTask={selectedTask}
                onSelectTask={handleSelectTask}
                onTaskDoubleClick={handleTaskDoubleClick}
                onStatusChange={handleStatusChange}
                listWidth={listWidth}
                isMobile={false}
              />

              {/* Resizer */}
              <div
                ref={resizerRef}
                className={`w-1 cursor-col-resize transition-all duration-150 group relative ${
                  isResizing ? 'bg-emerald-500 w-1' : 'bg-gray-200 hover:bg-emerald-400'
                }`}
                onMouseDown={handleResizerMouseDown}
              >
                <div className={`absolute inset-y-0 -left-1 -right-1 ${isResizing ? '' : 'group-hover:bg-emerald-400/10'}`}></div>
              </div>

              {/* Timeline */}
              <GanttTimeline
                tasks={filteredTasks}
                expandedTasks={expandedTasks}
                viewMode={viewMode}
                startDate={dateRange.start}
                endDate={dateRange.end}
                selectedTask={selectedTask}
                onSelectTask={handleSelectTask}
                onTaskDoubleClick={handleTaskDoubleClick}
                showCriticalPath={showCriticalPath}
                showBaseline={showBaseline}
                onTaskDrag={handleTaskDrag}
                cellWidth={cellWidth}
                isMobile={false}
              />
            </>
          )}

          {/* Mobile view */}
          {isMobileView && (
            <>
              {!showMobileTimeline ? (
                <GanttTaskList
                  tasks={filteredTasks}
                  expandedTasks={expandedTasks}
                  onToggleExpand={handleToggleExpand}
                  selectedTask={selectedTask}
                  onSelectTask={handleSelectTask}
                  onTaskDoubleClick={handleTaskDoubleClick}
                  onStatusChange={handleStatusChange}
                  listWidth={listWidth}
                  isMobile={true}
                />
              ) : (
                <GanttTimeline
                  tasks={filteredTasks}
                  expandedTasks={expandedTasks}
                  viewMode={viewMode}
                  startDate={dateRange.start}
                  endDate={dateRange.end}
                  selectedTask={selectedTask}
                  onSelectTask={handleSelectTask}
                  onTaskDoubleClick={handleTaskDoubleClick}
                  showCriticalPath={showCriticalPath}
                  showBaseline={showBaseline}
                  onTaskDrag={handleTaskDrag}
                  cellWidth={cellWidth}
                  isMobile={true}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* Stats bar */}
      <GanttStats tasks={filteredTasks} onFullscreen={handleFullscreen} isMobile={isMobileView} />

      {/* Task detail panel */}
      {detailTask && (
        <TaskDetailPanel
          task={detailTask}
          onClose={() => setDetailTask(null)}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          allTasks={tasks}
          users={users}
        />
      )}

      {/* Create task modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateTask}
        projects={projects}
        users={users}
      />
    </div>
  );
};

export default GanttPage;
