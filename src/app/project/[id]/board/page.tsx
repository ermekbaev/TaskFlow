'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/feature/Navbar';
import Button from '@/components/base/Button';
import Modal from '@/components/base/Modal';
import FileUpload from '@/components/base/FileUpload';
import TaskCard from '@/components/project-board/TaskCard';
import CreateTaskModal from '@/components/project-board/CreateTaskModal';
import ProjectSettings from '@/components/project-board/ProjectSettings';
import GitIntegration from '@/components/project-board/GitIntegration';
import ReassignModal from '@/components/feature/ReassignModal';
import EditTaskModal from '@/components/project-board/EditTaskModal';
import TaskActivityTimeline from '@/components/feature/TaskActivityTimeline';
import TimeLogModal from '@/components/feature/TimeLogModal';
import { useAuth } from '@/contexts/AuthContext';

const BOARD_COLUMNS = [
  { id: '1', name: 'Backlog', order: 1 },
  { id: '2', name: 'To Do', order: 2 },
  { id: '3', name: 'In Progress', order: 3 },
  { id: '4', name: 'Review', order: 4 },
  { id: '5', name: 'Done', order: 5 },
];

const ProjectBoard: React.FC = () => {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();

  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [columns] = useState(BOARD_COLUMNS);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showGitModal, setShowGitModal] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [gitRepo, setGitRepo] = useState('https://github.com/company/project-app');
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignTask, setReassignTask] = useState<any>(null);
  const [taskAttachments, setTaskAttachments] = useState<any[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTimeLogModal, setShowTimeLogModal] = useState(false);
  const [activityRefreshKey, setActivityRefreshKey] = useState(0);

  useEffect(() => {
    if (authLoading || !currentUser) return;

    const fetchData = async () => {
      try {
        const [projectRes, tasksRes] = await Promise.all([
          fetch(`/api/projects/${id}`),
          fetch(`/api/tasks?projectId=${id}`),
        ]);

        if (projectRes.ok) {
          const data = await projectRes.json();
          setProject(data.project);
        } else {
          router.push('/projects');
          return;
        }

        if (tasksRes.ok) {
          const data = await tasksRes.json();
          setTasks(data.tasks);
        }
      } catch (error) {
        console.error('Error fetching board data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, currentUser, authLoading, router]);

  if (authLoading || !currentUser || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-surface-50 to-surface-100">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!project) return null;

  const isManager = currentUser.role === 'PM';

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (status: string) => {
    if (draggedTask) {
      try {
        const res = await fetch(`/api/tasks/${draggedTask}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });

        if (res.ok) {
          const data = await res.json();
          setTasks(tasks.map(t => t.id === draggedTask ? data.task : t));
        }
      } catch (error) {
        console.error('Error updating task status:', error);
      }
      setDraggedTask(null);
    }
  };

  const handleCreateTask = async (newTask: any) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: id,
          ...newTask,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTasks([...tasks, data.task]);
        setShowCreateTask(false);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setTaskAttachments(task.attachments || []);
    setShowTaskDetail(true);
  };

  const handleReassignClick = (task: any) => {
    setReassignTask(task);
    setShowReassignModal(true);
  };

  const handleReassignSubmit = async (newAssigneeId: string, comment: string) => {
    if (!reassignTask) return;
    try {
      const res = await fetch(`/api/tasks/${reassignTask.id}/reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newAssigneeId, comment }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.directReassign && data.task) {
          setTasks(tasks.map(t => t.id === data.task.id ? data.task : t));
        }
        setShowReassignModal(false);
        setReassignTask(null);
      }
    } catch (error) {
      console.error('Error reassigning:', error);
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task: any) => task.status === status);
  };

  const parseLabels = (labels: any) => {
    if (Array.isArray(labels)) return labels;
    try { return JSON.parse(labels); } catch { return []; }
  };

  const parseCustomDates = (customDates: any) => {
    if (Array.isArray(customDates)) return customDates;
    try { return JSON.parse(customDates); } catch { return []; }
  };

  const canManageProject = isManager || project.ownerId === currentUser.id;

  const getTaskTypeName = (taskType?: string) => {
    switch (taskType) {
      case 'parent': return 'Заглавная задача';
      case 'stage': return 'Этап';
      case 'recurring': return 'Регулярная';
      default: return 'Задача';
    }
  };

  // Prepare existingTasks for CreateTaskModal
  const existingTasksForModal = tasks.map(t => ({
    id: t.id, key: t.key, title: t.title, taskType: t.taskType || 'task',
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-surface-100">
      <Navbar />

      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => router.push('/projects')} className="text-ink-muted hover:text-ink cursor-pointer">
                <i className="ri-arrow-left-line text-xl"></i>
              </button>
              <div className="flex items-center space-x-3">
                <div className="min-w-[2.5rem] h-10 px-2 bg-primary-100 rounded-lg flex items-center justify-center">
                  <span className="text-primary-700 font-bold text-sm truncate max-w-[5rem]">{project.key}</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-ink to-primary-600 bg-clip-text text-transparent">{project.name}</h1>
                  <p className="text-sm text-ink-muted">{project.description}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={() => setShowGitModal(true)} className="whitespace-nowrap">
                <i className="ri-git-branch-line mr-2"></i>
                Git
              </Button>

              <Button onClick={() => setShowCreateTask(true)} className="whitespace-nowrap">
                <i className="ri-add-line mr-2"></i>
                Создать задачу
              </Button>

              {canManageProject && (
                <Button variant="outline" onClick={() => setShowSettings(true)} className="whitespace-nowrap">
                  <i className="ri-settings-line mr-2"></i>
                  Настройки
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-5 gap-6">
          {columns.map((column) => (
            <div
              key={column.id}
              className="bg-gray-50 rounded-lg p-4"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.name)}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-ink">{column.name}</h3>
                <span className="bg-mint-100 text-mint-700 text-xs px-2 py-1 rounded-full">
                  {getTasksByStatus(column.name).length}
                </span>
              </div>

              <div className="space-y-3">
                {getTasksByStatus(column.name).map((task: any) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onDragStart={() => handleDragStart(task.id)}
                    canEdit={isManager || task.assigneeId === currentUser.id}
                    onClick={() => handleTaskClick(task)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <CreateTaskModal
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        onSubmit={handleCreateTask}
        projectId={id}
        projectKey={project.key}
        columns={columns}
        existingTasks={existingTasksForModal}
      />

      <ProjectSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        project={project}
        onUpdate={setProject}
      />

      <GitIntegration
        isOpen={showGitModal}
        onClose={() => setShowGitModal(false)}
        projectKey={project.key}
        repoUrl={gitRepo}
        onRepoChange={setGitRepo}
      />

      {/* Task Detail Modal */}
      <Modal isOpen={showTaskDetail} onClose={() => setShowTaskDetail(false)} title={selectedTask?.key || ''} size="xl">
        {selectedTask && (
          <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
            {/* Header */}
            <div>
              <h2 className="text-lg font-semibold text-ink mb-2">{selectedTask.title}</h2>
              <div className="flex items-center flex-wrap gap-2 text-sm text-ink-muted">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  selectedTask.priority === 'P1' ? 'bg-rose-100 text-rose-700' :
                  selectedTask.priority === 'P2' ? 'bg-amber-100 text-amber-700' :
                  selectedTask.priority === 'P3' ? 'bg-sky-100 text-sky-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {selectedTask.priority}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-700">
                  {selectedTask.status}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                  {getTaskTypeName(selectedTask.taskType)}
                </span>
                {selectedTask.isRecurring && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                    <i className="ri-repeat-line mr-1"></i>
                    {selectedTask.recurrencePattern === 'daily' ? 'Ежедневно' :
                     selectedTask.recurrencePattern === 'weekly' ? 'Еженедельно' :
                     selectedTask.recurrencePattern === 'biweekly' ? 'Раз в 2 нед.' :
                     selectedTask.recurrencePattern === 'monthly' ? 'Ежемесячно' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            {selectedTask.description && (
              <div>
                <h3 className="font-medium text-ink mb-2">Описание</h3>
                <div className="prose prose-sm max-w-none text-ink-muted">
                  {selectedTask.description.split('\n').map((line: string, index: number) => (
                    <p key={index} className="mb-2">{line}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Assignees & Dates */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-ink mb-2">Исполнители</h3>
                {selectedTask.assignee ? (
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-mint-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">{selectedTask.assignee.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-ink text-sm">{selectedTask.assignee.name}</p>
                      <p className="text-xs text-ink-muted">{selectedTask.assignee.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-ink-muted text-sm">Не назначен</p>
                )}
                {selectedTask.assignees && selectedTask.assignees.length > 0 && (
                  <div className="space-y-1 mt-1">
                    {selectedTask.assignees.map((a: any) => (
                      <div key={a.user.id} className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">{a.user.name.charAt(0)}</span>
                        </div>
                        <span className="text-sm text-ink-muted">{a.user.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-medium text-ink mb-2">Сроки</h3>
                <div className="space-y-1 text-sm text-ink-muted">
                  {selectedTask.assignmentDate && <p>Назначено: {new Date(selectedTask.assignmentDate).toLocaleDateString('ru-RU')}</p>}
                  {selectedTask.startDate && <p>Начало: {new Date(selectedTask.startDate).toLocaleDateString('ru-RU')}</p>}
                  {selectedTask.dueDate && <p>Срок: {new Date(selectedTask.dueDate).toLocaleDateString('ru-RU')}</p>}
                  <p>Создано: {new Date(selectedTask.createdAt).toLocaleDateString('ru-RU')}</p>
                </div>
              </div>
            </div>

            {/* Labor costs */}
            {(selectedTask.expectedHours > 0 || selectedTask.actualHours > 0) && (
              <div>
                <h3 className="font-medium text-ink mb-2">Трудозатраты</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-blue-600 mb-1">Ожидаемые</p>
                    <p className="text-lg font-semibold text-blue-700">{selectedTask.expectedHours || 0} ч</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-green-600 mb-1">Фактические</p>
                    <p className="text-lg font-semibold text-green-700">{selectedTask.actualHours || 0} ч</p>
                  </div>
                </div>
              </div>
            )}

            {/* Parent task info (initiator, curator) */}
            {selectedTask.taskType === 'parent' && (
              <>
                {(selectedTask.initiatorName || selectedTask.curatorName) && (
                  <div className="grid grid-cols-2 gap-6">
                    {selectedTask.initiatorName && (
                      <div>
                        <h3 className="font-medium text-ink mb-2">
                          <i className="ri-user-star-line mr-1"></i>Инициатор
                        </h3>
                        <div className="text-sm text-ink-muted space-y-0.5">
                          <p className="font-medium text-ink">{selectedTask.initiatorName}</p>
                          {selectedTask.initiatorEmail && <p>{selectedTask.initiatorEmail}</p>}
                          {selectedTask.initiatorPosition && <p>{selectedTask.initiatorPosition}</p>}
                        </div>
                      </div>
                    )}
                    {selectedTask.curatorName && (
                      <div>
                        <h3 className="font-medium text-ink mb-2">
                          <i className="ri-shield-user-line mr-1"></i>Куратор
                        </h3>
                        <div className="text-sm text-ink-muted space-y-0.5">
                          <p className="font-medium text-ink">{selectedTask.curatorName}</p>
                          {selectedTask.curatorEmail && <p>{selectedTask.curatorEmail}</p>}
                          {selectedTask.curatorPosition && <p>{selectedTask.curatorPosition}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedTask.acceptanceStatus && (
                  <div>
                    <h3 className="font-medium text-ink mb-2">Статус приёмки</h3>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedTask.acceptanceStatus === 'accepted' ? 'bg-green-100 text-green-700' :
                      selectedTask.acceptanceStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                      selectedTask.acceptanceStatus === 'in_review' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedTask.acceptanceStatus === 'accepted' ? 'Принято' :
                       selectedTask.acceptanceStatus === 'rejected' ? 'Отклонено' :
                       selectedTask.acceptanceStatus === 'in_review' ? 'На рассмотрении' :
                       selectedTask.acceptanceStatus === 'pending' ? 'Ожидает' :
                       selectedTask.acceptanceStatus}
                    </span>
                  </div>
                )}

                {/* Custom dates */}
                {parseCustomDates(selectedTask.customDates).length > 0 && (
                  <div>
                    <h3 className="font-medium text-ink mb-2">Даты</h3>
                    <div className="space-y-1 text-sm">
                      {parseCustomDates(selectedTask.customDates).map((cd: any, i: number) => (
                        <div key={i} className="flex justify-between text-ink-muted">
                          <span>{cd.name}:</span>
                          <span>{new Date(cd.date).toLocaleDateString('ru-RU')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Children tasks */}
            {selectedTask.children && selectedTask.children.length > 0 && (
              <div>
                <h3 className="font-medium text-ink mb-2">
                  {selectedTask.taskType === 'parent' ? 'Этапы и подзадачи' : 'Подзадачи'}
                </h3>
                <div className="space-y-1">
                  {selectedTask.children.map((child: any) => (
                    <div key={child.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">{child.key}</span>
                        <span className="text-ink">{child.title}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        child.status === 'Done' ? 'bg-green-100 text-green-700' :
                        child.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {child.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Parent reference */}
            {selectedTask.parent && (
              <div>
                <h3 className="font-medium text-ink mb-2">Родительская задача</h3>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-sm">
                  <span className="text-xs font-mono text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">{selectedTask.parent.key}</span>
                  <span className="text-ink">{selectedTask.parent.title}</span>
                </div>
              </div>
            )}

            {/* Labels */}
            {parseLabels(selectedTask.labels).length > 0 && (
              <div>
                <h3 className="font-medium text-ink mb-2">Метки</h3>
                <div className="flex flex-wrap gap-2">
                  {parseLabels(selectedTask.labels).map((label: string, index: number) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-mint-100 text-mint-800">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            {selectedTask.taskType === 'parent' ? (
              <div className="space-y-4">
                <FileUpload
                  taskId={selectedTask.id}
                  category="labor_estimate"
                  attachments={taskAttachments.filter(a => a.category === 'labor_estimate')}
                  onUpload={(att) => setTaskAttachments([att, ...taskAttachments])}
                  onDelete={(delId) => setTaskAttachments(taskAttachments.filter(a => a.id !== delId))}
                  label="Оценка трудозатрат"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                />
                <FileUpload
                  taskId={selectedTask.id}
                  category="acceptance_act"
                  attachments={taskAttachments.filter(a => a.category === 'acceptance_act')}
                  onUpload={(att) => setTaskAttachments([att, ...taskAttachments])}
                  onDelete={(delId) => setTaskAttachments(taskAttachments.filter(a => a.id !== delId))}
                  label="Акт"
                  accept=".pdf,.doc,.docx"
                />
                <FileUpload
                  taskId={selectedTask.id}
                  category="protocol"
                  attachments={taskAttachments.filter(a => a.category === 'protocol')}
                  onUpload={(att) => setTaskAttachments([att, ...taskAttachments])}
                  onDelete={(delId) => setTaskAttachments(taskAttachments.filter(a => a.id !== delId))}
                  label="Протокол"
                  accept=".pdf,.doc,.docx"
                />
                <FileUpload
                  taskId={selectedTask.id}
                  category="general"
                  attachments={taskAttachments.filter(a => !a.category || a.category === 'general')}
                  onUpload={(att) => setTaskAttachments([att, ...taskAttachments])}
                  onDelete={(delId) => setTaskAttachments(taskAttachments.filter(a => a.id !== delId))}
                  label="Прочие вложения"
                  accept="*"
                />
              </div>
            ) : (
              <div>
                <FileUpload
                  taskId={selectedTask.id}
                  category="general"
                  attachments={taskAttachments}
                  onUpload={(att) => setTaskAttachments([att, ...taskAttachments])}
                  onDelete={(delId) => setTaskAttachments(taskAttachments.filter(a => a.id !== delId))}
                  label="Вложения"
                  accept="*"
                />
              </div>
            )}

            {/* Activity Timeline */}
            <div className="border-t pt-4">
              <TaskActivityTimeline taskId={selectedTask.id} refreshKey={activityRefreshKey} />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTaskDetail(false);
                  setShowEditModal(true);
                }}
              >
                <i className="ri-edit-line mr-2"></i>
                Редактировать
              </Button>
              {(selectedTask.assigneeId === currentUser.id || isManager) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTimeLogModal(true);
                  }}
                >
                  <i className="ri-time-line mr-2"></i>
                  Списать время
                </Button>
              )}
              <div className="flex-1"></div>
              {!isManager && selectedTask.assigneeId === currentUser.id && selectedTask.status !== 'Review' && selectedTask.status !== 'Done' && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/tasks/${selectedTask.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'Review' }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        setTasks(tasks.map(t => t.id === data.task.id ? data.task : t));
                        setSelectedTask(data.task);
                      }
                    } catch (error) {
                      console.error('Error submitting task:', error);
                    }
                  }}
                  className="flex-1"
                >
                  <i className="ri-check-line mr-2"></i>
                  Сдать задачу
                </Button>
              )}
              {isManager && selectedTask.status === 'Review' && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/tasks/${selectedTask.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'Done' }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        setTasks(tasks.map(t => t.id === data.task.id ? data.task : t));
                        setSelectedTask(data.task);
                      }
                    } catch (error) {
                      console.error('Error accepting task:', error);
                    }
                  }}
                  className="flex-1"
                >
                  <i className="ri-check-double-line mr-2"></i>
                  Принять задачу
                </Button>
              )}
              {isManager && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTaskDetail(false);
                    handleReassignClick(selectedTask);
                  }}
                  className="flex-1"
                >
                  <i className="ri-user-shared-line mr-2"></i>
                  Переназначить
                </Button>
              )}
              {(isManager || selectedTask.assigneeId === currentUser.id) && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!confirm('Удалить эту задачу? Это действие необратимо.')) return;
                    try {
                      const res = await fetch(`/api/tasks/${selectedTask.id}`, {
                        method: 'DELETE',
                      });
                      if (res.ok) {
                        setTasks(tasks.filter(t => t.id !== selectedTask.id));
                        setShowTaskDetail(false);
                        setSelectedTask(null);
                      }
                    } catch (error) {
                      console.error('Error deleting task:', error);
                    }
                  }}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <i className="ri-delete-bin-line"></i>
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {showReassignModal && reassignTask && (
        <ReassignModal
          taskId={reassignTask.id}
          taskKey={reassignTask.key}
          projectId={id}
          currentAssigneeId={reassignTask.assigneeId}
          onClose={() => { setShowReassignModal(false); setReassignTask(null); }}
          onSubmit={handleReassignSubmit}
        />
      )}

      {showEditModal && selectedTask && (
        <EditTaskModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          task={selectedTask}
          onSave={(updatedTask) => {
            setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
            setSelectedTask(updatedTask);
            setShowEditModal(false);
            setActivityRefreshKey(k => k + 1);
          }}
          projectId={id}
          existingTasks={existingTasksForModal}
          isManager={isManager}
        />
      )}

      {showTimeLogModal && selectedTask && (
        <TimeLogModal
          isOpen={showTimeLogModal}
          onClose={() => setShowTimeLogModal(false)}
          taskId={selectedTask.id}
          taskKey={selectedTask.key}
          onTimeLogged={async () => {
            try {
              const res = await fetch(`/api/tasks/${selectedTask.id}`);
              if (res.ok) {
                const data = await res.json();
                setTasks(tasks.map(t => t.id === data.task.id ? data.task : t));
                setSelectedTask(data.task);
                setActivityRefreshKey(k => k + 1);
              }
            } catch (e) { console.error(e); }
          }}
        />
      )}
    </div>
  );
};

export default ProjectBoard;
