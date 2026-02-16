"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/feature/Navbar";
import Button from "@/components/base/Button";
import Modal from "@/components/base/Modal";
import ReassignModal from "@/components/feature/ReassignModal";
import EditTaskModal from "@/components/project-board/EditTaskModal";
import TimeLogModal from "@/components/feature/TimeLogModal";
import TaskActivityTimeline from "@/components/feature/TaskActivityTimeline";
import { useAuth } from "@/contexts/AuthContext";

const TaskList: React.FC = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignTask, setReassignTask] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTimeLogModal, setShowTimeLogModal] = useState(false);
  const [activityRefreshKey, setActivityRefreshKey] = useState(0);
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    status: "all",
    priority: "all",
    assignee: "all",
    project: "all",
    myTasksOnly: true,
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (authLoading || !user) return;

    const fetchData = async () => {
      try {
        const [tasksRes, projectsRes] = await Promise.all([
          fetch("/api/tasks"),
          fetch("/api/projects"),
        ]);

        if (tasksRes.ok) {
          const data = await tasksRes.json();
          setTasks(data.tasks);
        }
        if (projectsRes.ok) {
          const data = await projectsRes.json();
          setProjects(data.projects);
        }

        // Fetch users for MANAGER
        if (user.role === "PM") {
          const usersRes = await fetch("/api/users");
          if (usersRes.ok) {
            const data = await usersRes.json();
            setAllUsers(data.users);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading]);

  const getFilteredTasks = () => {
    let filtered = tasks;

    // "My tasks only" filter
    if (filter.myTasksOnly && user) {
      filtered = filtered.filter((task: any) => task.assigneeId === user.id);
    }

    if (filter.status !== "all") {
      filtered = filtered.filter((task: any) => task.status === filter.status);
    }

    if (filter.priority !== "all") {
      filtered = filtered.filter(
        (task: any) => task.priority === filter.priority,
      );
    }

    if (filter.assignee !== "all") {
      filtered = filtered.filter(
        (task: any) => task.assigneeId === filter.assignee,
      );
    }

    if (filter.project !== "all") {
      filtered = filtered.filter(
        (task: any) => task.projectId === filter.project,
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (task: any) =>
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (task.description || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          task.key.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    return filtered;
  };

  const fetchFullTask = async (taskId: string) => {
    setLoadingTaskId(taskId);
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        return data.task;
      }
    } catch (e) {
      console.error("Error fetching task:", e);
    } finally {
      setLoadingTaskId(null);
    }
    return null;
  };

  const handleTaskClick = async (task: any) => {
    const full = await fetchFullTask(task.id);
    setSelectedTask(full || task);
    setShowTaskModal(true);
  };

  const handleReassignClick = (e: React.MouseEvent, task: any) => {
    e.stopPropagation();
    setReassignTask(task);
    setShowReassignModal(true);
  };

  const handleReassignSubmit = async (
    newAssigneeId: string,
    comment: string,
  ) => {
    if (!reassignTask) return;

    try {
      const res = await fetch(`/api/tasks/${reassignTask.id}/reassign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newAssigneeId, comment }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.directReassign && data.task) {
          setTasks(tasks.map((t) => (t.id === data.task.id ? data.task : t)));
        }
        setShowReassignModal(false);
        setReassignTask(null);
      }
    } catch (error) {
      console.error("Error reassigning:", error);
    }
  };

  const parseLabels = (labels: any) => {
    if (Array.isArray(labels)) return labels;
    try {
      return JSON.parse(labels);
    } catch {
      return [];
    }
  };

  const priorityColors: Record<string, string> = {
    P1: "bg-rose-100 text-rose-700 border-rose-300",
    P2: "bg-amber-100 text-amber-700 border-amber-300",
    P3: "bg-sky-100 text-sky-700 border-sky-300",
    P4: "bg-emerald-100 text-emerald-700 border-emerald-300",
  };

  const statusColors: Record<string, string> = {
    Backlog: "bg-slate-100 text-slate-700",
    "To Do": "bg-sky-100 text-sky-700",
    "In Progress": "bg-amber-100 text-amber-700",
    Review: "bg-purple-100 text-purple-700",
    Done: "bg-emerald-100 text-emerald-700",
  };

  if (authLoading || !user) return null;

  const filteredTasks = getFilteredTasks();
  const isManager = user.role === "PM";

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-surface-100">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-ink to-primary-600 bg-clip-text text-transparent">
              Задачи
            </h1>
            <p className="text-ink-muted mt-1">
              {filter.myTasksOnly
                ? "Задачи, назначенные на вас"
                : "Все доступные задачи"}
            </p>
          </div>

          <Button onClick={() => router.push("/projects")}>
            <i className="ri-arrow-left-line mr-2"></i>К проектам
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-soft border border-surface-200 p-6 mb-6">
          {/* My tasks toggle */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-surface-100">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setFilter({ ...filter, myTasksOnly: true })}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  filter.myTasksOnly
                    ? "bg-primary-500 text-white shadow-soft"
                    : "bg-surface-100 text-ink-muted hover:bg-surface-200"
                }`}
              >
                <i className="ri-user-line mr-1.5"></i>
                Мои задачи
              </button>
              <button
                onClick={() => setFilter({ ...filter, myTasksOnly: false })}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  !filter.myTasksOnly
                    ? "bg-primary-500 text-white shadow-soft"
                    : "bg-surface-100 text-ink-muted hover:bg-surface-200"
                }`}
              >
                <i className="ri-team-line mr-1.5"></i>
                Все задачи
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <input
                type="text"
                placeholder="Поиск задач..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border-2 border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-400 transition-all"
              />
            </div>

            <div>
              <select
                value={filter.status}
                onChange={(e) =>
                  setFilter({ ...filter, status: e.target.value })
                }
                className="w-full px-4 py-3 pr-8 border-2 border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-400 transition-all"
              >
                <option value="all">Все статусы</option>
                <option value="Backlog">Backlog</option>
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">Review</option>
                <option value="Done">Done</option>
              </select>
            </div>

            <div>
              <select
                value={filter.priority}
                onChange={(e) =>
                  setFilter({ ...filter, priority: e.target.value })
                }
                className="w-full px-4 py-3 pr-8 border-2 border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-400 transition-all"
              >
                <option value="all">Все приоритеты</option>
                <option value="P1">P1 - Критический</option>
                <option value="P2">P2 - Высокий</option>
                <option value="P3">P3 - Средний</option>
                <option value="P4">P4 - Низкий</option>
              </select>
            </div>

            <div>
              <select
                value={filter.project}
                onChange={(e) =>
                  setFilter({ ...filter, project: e.target.value })
                }
                className="w-full px-4 py-3 pr-8 border-2 border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-400 transition-all"
              >
                <option value="all">Все проекты</option>
                {projects.map((project: any) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {isManager && (
              <div>
                <select
                  value={filter.assignee}
                  onChange={(e) =>
                    setFilter({ ...filter, assignee: e.target.value })
                  }
                  className="w-full px-4 py-3 pr-8 border-2 border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-400 transition-all"
                >
                  <option value="all">Все исполнители</option>
                  {allUsers.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-2xl shadow-soft border border-surface-200 hover:shadow-medium transition-all">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center shadow-soft">
                <i className="ri-task-line text-primary-600"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-ink-muted">
                  Всего задач
                </p>
                <p className="text-2xl font-bold text-ink">
                  {filteredTasks.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-soft border border-surface-200 hover:shadow-medium transition-all">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center shadow-soft">
                <i className="ri-progress-3-line text-amber-600"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-ink-muted">В работе</p>
                <p className="text-2xl font-bold text-ink">
                  {
                    filteredTasks.filter((t: any) => t.status === "In Progress")
                      .length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-soft border border-surface-200 hover:shadow-medium transition-all">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl flex items-center justify-center shadow-soft">
                <i className="ri-check-line text-emerald-600"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-ink-muted">Выполнено</p>
                <p className="text-2xl font-bold text-ink">
                  {filteredTasks.filter((t: any) => t.status === "Done").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-soft border border-surface-200 hover:shadow-medium transition-all">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-100 to-rose-200 rounded-xl flex items-center justify-center shadow-soft">
                <i className="ri-alarm-warning-line text-rose-600"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-ink-muted">
                  Высокий приоритет
                </p>
                <p className="text-2xl font-bold text-ink">
                  {
                    filteredTasks.filter(
                      (t: any) => t.priority === "P1" || t.priority === "P2",
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-soft border border-surface-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-surface-200">
                <thead className="bg-surface-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">
                      Задача
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">
                      Проект
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">
                      Приоритет
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">
                      Исполнитель
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">
                      Срок
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-ink-muted uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-surface-100">
                  {filteredTasks.map((task: any) => {
                    const labels = parseLabels(task.labels);
                    return (
                      <tr
                        key={task.id}
                        className="hover:bg-surface-50 cursor-pointer transition-colors"
                        onClick={() => handleTaskClick(task)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-start space-x-3">
                            <span className="text-xs text-ink-muted font-mono bg-surface-100 px-2.5 py-1 rounded-lg">
                              {task.key}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-ink line-clamp-1">
                                {task.title}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {labels.map((label: string) => (
                                  <span
                                    key={label}
                                    className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-lg font-medium"
                                  >
                                    {label}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-muted">
                          {task.project?.name || ""}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors[task.status as string] || ""}`}
                          >
                            {task.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${priorityColors[task.priority as string] || ""}`}
                          >
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ink">
                          {task.assignee?.name || "Не назначен"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-muted">
                          {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString("ru-RU")
                            : "Не указан"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                const full = await fetchFullTask(task.id);
                                if (full) {
                                  setSelectedTask(full);
                                  setShowEditModal(true);
                                }
                              }}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-200 transition-colors text-ink-muted hover:text-primary-600"
                              title="Редактировать"
                            >
                              {loadingTaskId === task.id ? (
                                <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <i className="ri-edit-line text-sm"></i>
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTask(task);
                                setShowTimeLogModal(true);
                              }}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-200 transition-colors text-ink-muted hover:text-amber-600"
                              title="Списать время"
                            >
                              <i className="ri-time-line text-sm"></i>
                            </button>
                            <button
                              onClick={(e) => handleReassignClick(e, task)}
                              className="text-xs text-primary-600 hover:text-primary-700 font-medium px-2 py-1 rounded hover:bg-primary-50 transition-colors"
                              title="Переназначить"
                            >
                              <i className="ri-user-shared-line mr-1"></i>
                              Переназначить
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredTasks.length === 0 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <i className="ri-task-line text-ink-light text-3xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-ink mb-2">
                  Задачи не найдены
                </h3>
                <p className="text-ink-muted">
                  Попробуйте изменить параметры фильтрации
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedTask && (
        <Modal
          isOpen={showTaskModal}
          onClose={() => {
            setShowTaskModal(false);
            setSelectedTask(null);
          }}
          title={`${selectedTask.key}: ${selectedTask.title}`}
          size="lg"
        >
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <span
                    className={`text-sm px-3 py-1 rounded-full ${priorityColors[selectedTask.priority as string] || ""} border`}
                  >
                    {selectedTask.priority}
                  </span>
                  <span
                    className={`text-sm px-3 py-1 rounded-full ${statusColors[selectedTask.status as string] || ""}`}
                  >
                    {selectedTask.status}
                  </span>
                  {selectedTask.expectedHours > 0 && (
                    <span className="text-sm text-gray-500">
                      {selectedTask.expectedHours}ч ожид.
                    </span>
                  )}
                </div>

                <div className="prose max-w-none">
                  <div className="text-gray-700 text-sm whitespace-pre-wrap">
                    {selectedTask.description || "Описание отсутствует"}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-ink mb-2">Проект</h4>
                <div className="text-sm font-medium text-primary-600">
                  {selectedTask.project?.name || ""}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-ink mb-2">Исполнитель</h4>
                {selectedTask.assignee ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center shadow-soft">
                      <span className="text-white text-sm font-medium">
                        {selectedTask.assignee.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-ink">
                        {selectedTask.assignee.name}
                      </div>
                      <div className="text-xs text-ink-muted">
                        {selectedTask.assignee.email}
                      </div>
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-ink-muted">Не назначен</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-ink mb-2">Срок выполнения</h4>
                <span className="text-sm text-ink-muted">
                  {selectedTask.dueDate
                    ? new Date(selectedTask.dueDate).toLocaleDateString(
                        "ru-RU",
                        {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        },
                      )
                    : "Не указан"}
                </span>
              </div>
              <div>
                <h4 className="font-semibold text-ink mb-2">Создана</h4>
                <span className="text-sm text-ink-muted">
                  {new Date(selectedTask.createdAt).toLocaleDateString(
                    "ru-RU",
                    {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    },
                  )}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-ink mb-2">Метки</h4>
              <div className="flex flex-wrap gap-2">
                {parseLabels(selectedTask.labels).length > 0 ? (
                  parseLabels(selectedTask.labels).map((label: string) => (
                    <span
                      key={label}
                      className="text-sm bg-primary-100 text-primary-700 px-3 py-1 rounded-lg font-medium"
                    >
                      {label}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-ink-muted">
                    Метки отсутствуют
                  </span>
                )}
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="border-t border-surface-200 pt-4">
              <TaskActivityTimeline
                taskId={selectedTask.id}
                refreshKey={activityRefreshKey}
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-surface-200">
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/project/${selectedTask.projectId}/board`)
                }
              >
                <i className="ri-kanban-view mr-2"></i>
                Открыть доску
              </Button>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTaskModal(false);
                    setShowEditModal(true);
                  }}
                >
                  <i className="ri-edit-line mr-2"></i>
                  Редактировать
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTaskModal(false);
                    setShowTimeLogModal(true);
                  }}
                >
                  <i className="ri-time-line mr-2"></i>
                  Списать время
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleReassignClick(
                      { stopPropagation: () => {} } as any,
                      selectedTask,
                    );
                    setShowTaskModal(false);
                  }}
                >
                  <i className="ri-user-shared-line mr-2"></i>
                  Переназначить
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTaskModal(false);
                    setSelectedTask(null);
                  }}
                >
                  Закрыть
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {showReassignModal && reassignTask && (
        <ReassignModal
          taskId={reassignTask.id}
          taskKey={reassignTask.key}
          projectId={reassignTask.projectId}
          currentAssigneeId={reassignTask.assigneeId}
          onClose={() => {
            setShowReassignModal(false);
            setReassignTask(null);
          }}
          onSubmit={handleReassignSubmit}
        />
      )}

      {/* Edit Task Modal */}
      {selectedTask && showEditModal && (
        <EditTaskModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
          }}
          task={selectedTask}
          onSave={(updatedTask) => {
            setTasks(
              tasks.map((t) =>
                t.id === updatedTask.id ? { ...t, ...updatedTask } : t,
              ),
            );
            setSelectedTask(updatedTask);
            setShowEditModal(false);
            setActivityRefreshKey((k) => k + 1);
          }}
          projectId={selectedTask.projectId}
          existingTasks={tasks
            .filter((t) => t.projectId === selectedTask.projectId)
            .map((t) => ({
              id: t.id,
              key: t.key,
              title: t.title,
              taskType: "task",
            }))}
          isManager={isManager}
        />
      )}

      {/* Time Log Modal */}
      {selectedTask && showTimeLogModal && (
        <TimeLogModal
          isOpen={showTimeLogModal}
          onClose={() => {
            setShowTimeLogModal(false);
          }}
          taskId={selectedTask.id}
          taskKey={selectedTask.key}
          onTimeLogged={async () => {
            setShowTimeLogModal(false);
            setActivityRefreshKey((k) => k + 1);
            // Refresh task data
            const full = await fetchFullTask(selectedTask.id);
            if (full) setSelectedTask(full);
          }}
        />
      )}
    </div>
  );
};

export default TaskList;
