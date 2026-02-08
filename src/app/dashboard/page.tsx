'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/feature/Navbar';
import PendingApprovals from '@/components/feature/PendingApprovals';
import { useAuth } from '@/contexts/AuthContext';

interface Task {
  id: string;
  key: string;
  title: string;
  status: string;
  priority: string;
  assigneeId?: string;
  projectId: string;
  dueDate?: string;
  project?: { id: string; key: string; name: string };
  assignee?: { id: string; name: string; email: string } | null;
}

interface Project {
  id: string;
  key: string;
  name: string;
  status: string;
  members?: any[];
  _count?: { tasks: number };
}

interface Stats {
  totalTasks: number;
  myTasks: number;
  myActiveTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  highPriority: number;
  activeProjects: number;
  totalProjects: number;
  byStatus: { backlog: number; todo: number; inProgress: number; done: number };
  byPriority: { p1: number; p2: number; p3: number; p4: number };
}

const Dashboard: React.FC = () => {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pendingReassigns, setPendingReassigns] = useState(0);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    const fetchData = async () => {
      try {
        const [statsRes, tasksRes, projectsRes, invRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/tasks'),
          fetch('/api/projects'),
          fetch('/api/invitations'),
        ]);

        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data.stats);
          setPendingReassigns(data.pendingReassigns || 0);
        }
        if (tasksRes.ok) {
          const data = await tasksRes.json();
          setTasks(data.tasks);
        }
        if (projectsRes.ok) {
          const data = await projectsRes.json();
          setProjects(data.projects);
        }
        if (invRes.ok) {
          const data = await invRes.json();
          setInvitations(data.invitations || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading]);

  if (authLoading || !user || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-surface-50 to-surface-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const myTasks = tasks.filter(t => t.assigneeId === user.id);
  const myActiveTasks = myTasks.filter(t => t.status === 'In Progress');
  const myCompletedTasks = myTasks.filter(t => t.status === 'Done');
  const activeProjects = projects.filter(p => p.status === 'Active');
  const allInProgress = tasks.filter(t => t.status === 'In Progress');
  const allCompleted = tasks.filter(t => t.status === 'Done');
  const highPriorityTasks = tasks.filter(t => t.priority === 'P1' || t.priority === 'P2');

  const recentTasks = [...tasks].slice(0, 5);

  const overdueTasks = tasks.filter(t => {
    if (!t.dueDate || t.status === 'Done') return false;
    return new Date(t.dueDate) < new Date();
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P1': return 'bg-red-100 text-red-700';
      case 'P2': return 'bg-orange-100 text-orange-700';
      case 'P3': return 'bg-yellow-100 text-yellow-700';
      case 'P4': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done': return 'bg-emerald-100 text-emerald-700';
      case 'In Progress': return 'bg-blue-100 text-blue-700';
      case 'To Do': return 'bg-purple-100 text-purple-700';
      case 'Backlog': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const statCards = [
    {
      title: 'Мои задачи',
      value: myTasks.length,
      subtext: `${myActiveTasks.length} в работе`,
      icon: 'ri-task-line',
      color: 'from-primary-500 to-primary-600',
      bgColor: 'bg-primary-50'
    },
    {
      title: 'Активные проекты',
      value: activeProjects.length,
      subtext: `из ${projects.length} всего`,
      icon: 'ri-folder-line',
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Выполнено',
      value: myCompletedTasks.length,
      subtext: `${Math.round((myCompletedTasks.length / (myTasks.length || 1)) * 100)}% от моих`,
      icon: 'ri-check-double-line',
      color: 'from-sky-500 to-sky-600',
      bgColor: 'bg-sky-50'
    },
    {
      title: 'Срочные',
      value: highPriorityTasks.length,
      subtext: 'высокий приоритет',
      icon: 'ri-alarm-warning-line',
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-surface-100">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ink">
            Добро пожаловать, {user.name}!
          </h1>
          <p className="text-ink-muted mt-2">
            Вот обзор ваших проектов и задач на сегодня
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-soft border border-surface-200 p-6 hover:shadow-medium transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-ink-muted text-sm font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold text-ink mt-2">{stat.value}</p>
                  <p className="text-ink-light text-sm mt-1">{stat.subtext}</p>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                  <i className={`${stat.icon} text-xl bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}></i>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div className="mb-8">
            <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <i className="ri-mail-line text-emerald-600 text-xl"></i>
                  <h2 className="text-lg font-semibold text-emerald-700">
                    Приглашения ({invitations.length})
                  </h2>
                </div>
                <button
                  onClick={() => router.push('/invitations')}
                  className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                >
                  Смотреть все
                </button>
              </div>
              <div className="space-y-3">
                {invitations.slice(0, 3).map((inv: any) => (
                  <div
                    key={inv.id}
                    className="bg-white rounded-xl p-4 flex items-center justify-between cursor-pointer hover:shadow-soft transition-shadow"
                    onClick={() => router.push('/invitations')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <span className="text-emerald-700 text-xs font-bold">{inv.project.key}</span>
                      </div>
                      <div>
                        <p className="font-medium text-ink">{inv.project.name}</p>
                        <p className="text-sm text-ink-light">от {inv.invitedBy.name}</p>
                      </div>
                    </div>
                    <i className="ri-arrow-right-s-line text-ink-light"></i>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pending Approvals for MANAGER */}
        {user.role === 'PM' && pendingReassigns > 0 && (
          <div className="mb-8">
            <PendingApprovals />
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl shadow-soft border border-surface-200">
              <div className="p-6 border-b border-surface-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-ink">Мои задачи</h2>
                  <button
                    onClick={() => router.push('/tasks')}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
                  >
                    Все задачи
                    <i className="ri-arrow-right-line ml-1"></i>
                  </button>
                </div>
              </div>
              <div className="divide-y divide-surface-100">
                {myTasks.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="ri-task-line text-2xl text-surface-400"></i>
                    </div>
                    <p className="text-ink-muted">У вас пока нет назначенных задач</p>
                  </div>
                ) : (
                  myTasks.slice(0, 5).map(task => (
                    <div
                      key={task.id}
                      className="p-4 hover:bg-surface-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/project/${task.projectId}/board`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <span className="text-primary-700 text-xs font-bold">{task.key}</span>
                          </div>
                          <div>
                            <p className="font-medium text-ink">{task.title}</p>
                            <p className="text-sm text-ink-light">{task.project?.name || ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft border border-surface-200">
              <div className="p-6 border-b border-surface-100">
                <h2 className="text-xl font-semibold text-ink">Последние задачи</h2>
              </div>
              <div className="divide-y divide-surface-100">
                {recentTasks.map(task => (
                  <div
                    key={task.id}
                    className="p-4 hover:bg-surface-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/project/${task.projectId}/board`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-2 h-2 rounded-full ${
                          task.status === 'Done' ? 'bg-emerald-500' :
                          task.status === 'In Progress' ? 'bg-blue-500' :
                          task.status === 'To Do' ? 'bg-purple-500' : 'bg-gray-400'
                        }`}></div>
                        <div>
                          <p className="font-medium text-ink">{task.title}</p>
                          <p className="text-sm text-ink-light">
                            {task.key} {task.assignee ? `• ${task.assignee.name}` : ''}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-soft border border-surface-200 p-6">
              <h2 className="text-lg font-semibold text-ink mb-4">Быстрые действия</h2>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/projects')}
                  className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-surface-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <i className="ri-folder-add-line text-primary-600"></i>
                  </div>
                  <span className="font-medium text-ink">Создать проект</span>
                </button>
                <button
                  onClick={() => router.push('/tasks')}
                  className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-surface-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <i className="ri-task-line text-emerald-600"></i>
                  </div>
                  <span className="font-medium text-ink">Все задачи</span>
                </button>
                <button
                  onClick={() => router.push('/calendar')}
                  className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-surface-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
                    <i className="ri-calendar-line text-sky-600"></i>
                  </div>
                  <span className="font-medium text-ink">Календарь</span>
                </button>
                {user.role === 'PM' && (
                  <button
                    onClick={() => router.push('/admin')}
                    className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-surface-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <i className="ri-admin-line text-amber-600"></i>
                    </div>
                    <span className="font-medium text-ink">Администрирование</span>
                  </button>
                )}
              </div>
            </div>

            {overdueTasks.length > 0 && (
              <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <i className="ri-alarm-warning-line text-red-600 text-xl"></i>
                  <h2 className="text-lg font-semibold text-red-700">Просроченные</h2>
                </div>
                <div className="space-y-3">
                  {overdueTasks.slice(0, 3).map(task => (
                    <div
                      key={task.id}
                      className="bg-white rounded-lg p-3 cursor-pointer hover:shadow-soft transition-shadow"
                      onClick={() => router.push(`/project/${task.projectId}/board`)}
                    >
                      <p className="font-medium text-ink text-sm">{task.title}</p>
                      <p className="text-xs text-red-600 mt-1">
                        Дедлайн: {new Date(task.dueDate!).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-soft border border-surface-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-ink">Проекты</h2>
                <button
                  onClick={() => router.push('/projects')}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Все
                </button>
              </div>
              <div className="space-y-3">
                {activeProjects.slice(0, 4).map(project => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/project/${project.id}/board`)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                        <span className="text-primary-700 text-xs font-bold">{project.key}</span>
                      </div>
                      <div>
                        <p className="font-medium text-ink text-sm">{project.name}</p>
                        <p className="text-xs text-ink-light">{project.members?.length || 0} участников</p>
                      </div>
                    </div>
                    <i className="ri-arrow-right-s-line text-ink-light"></i>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
              <h2 className="text-lg font-semibold mb-4">Общий прогресс</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-primary-100">Выполнено задач</span>
                    <span className="font-medium">{allCompleted.length} / {tasks.length}</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-500"
                      style={{ width: `${(allCompleted.length / (tasks.length || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-primary-100">В работе</span>
                    <span className="font-medium">{allInProgress.length}</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${(allInProgress.length / (tasks.length || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Per-project progress */}
            <div className="bg-white rounded-2xl shadow-soft border border-surface-200 p-6">
              <h2 className="text-lg font-semibold text-ink mb-4">Прогресс по проектам</h2>
              <div className="space-y-5">
                {projects.map(project => {
                  const projectTasks = tasks.filter(t => t.projectId === project.id);
                  const projectDone = projectTasks.filter(t => t.status === 'Done').length;
                  const projectTotal = projectTasks.length;
                  const projectPercent = projectTotal > 0 ? Math.round((projectDone / projectTotal) * 100) : 0;
                  const projectInProgress = projectTasks.filter(t => t.status === 'In Progress').length;

                  return (
                    <div
                      key={project.id}
                      className="cursor-pointer hover:bg-surface-50 rounded-xl p-3 -mx-3 transition-colors"
                      onClick={() => router.push(`/project/${project.id}/board`)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-primary-700 bg-primary-100 px-2 py-0.5 rounded-lg">
                            {project.key}
                          </span>
                          <span className="text-sm font-medium text-ink">{project.name}</span>
                        </div>
                        <span className="text-xs text-ink-muted">
                          {projectDone}/{projectTotal} задач
                        </span>
                      </div>
                      <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
                          style={{ width: `${projectPercent}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs text-ink-light">
                          {projectInProgress > 0 && `${projectInProgress} в работе`}
                        </span>
                        <span className="text-xs font-medium text-primary-600">{projectPercent}%</span>
                      </div>
                    </div>
                  );
                })}
                {projects.length === 0 && (
                  <p className="text-sm text-ink-muted text-center py-4">Нет проектов</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
