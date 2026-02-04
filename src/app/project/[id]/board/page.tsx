'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/feature/Navbar';
import Button from '@/components/base/Button';
import Modal from '@/components/base/Modal';
import TaskCard from '@/components/project-board/TaskCard';
import CreateTaskModal from '@/components/project-board/CreateTaskModal';
import ProjectSettings from '@/components/project-board/ProjectSettings';
import GitIntegration from '@/components/project-board/GitIntegration';
import ReassignModal from '@/components/feature/ReassignModal';
import { useAuth } from '@/contexts/AuthContext';
import { mockColumns } from '@/mocks/tasks';

const ProjectBoard: React.FC = () => {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();

  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [columns] = useState(mockColumns);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showGitModal, setShowGitModal] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [gitRepo, setGitRepo] = useState('https://github.com/company/project-app');
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignTask, setReassignTask] = useState<any>(null);

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

  const isManager = currentUser.role === 'MANAGER';

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
          title: newTask.title,
          description: newTask.description || '',
          status: newTask.status || 'Backlog',
          priority: newTask.priority || 'P3',
          assigneeId: newTask.assigneeId || null,
          labels: newTask.labels || [],
          storyPoints: newTask.storyPoints || 0,
          dueDate: newTask.dueDate || null,
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

  const canManageProject = isManager || project.ownerId === currentUser.id;

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
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <span className="text-primary-700 font-bold text-sm">{project.key}</span>
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
        <div className="grid grid-cols-4 gap-6">
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

      <Modal isOpen={showTaskDetail} onClose={() => setShowTaskDetail(false)} title={selectedTask?.key || ''} size="lg">
        {selectedTask && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-ink mb-2">{selectedTask.title}</h2>
              <div className="flex items-center space-x-4 text-sm text-ink-muted">
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
                <span>{selectedTask.storyPoints} SP</span>
              </div>
            </div>

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

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-ink mb-2">Исполнитель</h3>
                {selectedTask.assignee ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-mint-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">{selectedTask.assignee.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-ink">{selectedTask.assignee.name}</p>
                      <p className="text-sm text-ink-muted">{selectedTask.assignee.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-ink-muted">Не назначен</p>
                )}
              </div>
              <div>
                <h3 className="font-medium text-ink mb-2">Сроки</h3>
                <div className="space-y-1 text-sm text-ink-muted">
                  {selectedTask.dueDate && <p>Срок: {new Date(selectedTask.dueDate).toLocaleDateString('ru-RU')}</p>}
                  <p>Создано: {new Date(selectedTask.createdAt).toLocaleDateString('ru-RU')}</p>
                </div>
              </div>
            </div>

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

            <div className="flex space-x-4 pt-4 border-t">
              <Button onClick={() => setShowTaskDetail(false)} className="flex-1">
                <i className="ri-kanban-view mr-2"></i>
                Вернуться к доске
              </Button>
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
    </div>
  );
};

export default ProjectBoard;
