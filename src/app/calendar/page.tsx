'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import Navbar from '@/components/feature/Navbar';
import Button from '@/components/base/Button';
import Modal from '@/components/base/Modal';
import Input from '@/components/base/Input';
import { useAuth } from '@/contexts/AuthContext';

// Helper functions
const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'work':
      return 'ri-briefcase-line';
    case 'personal':
      return 'ri-user-line';
    case 'shopping':
      return 'ri-shopping-cart-line';
    case 'health':
      return 'ri-heart-pulse-line';
    default:
      return 'ri-bookmark-line';
  }
};

const getCategoryName = (category: string) => {
  switch (category) {
    case 'work':
      return 'Работа';
    case 'personal':
      return 'Личное';
    case 'shopping':
      return 'Покупки';
    case 'health':
      return 'Здоровье';
    default:
      return category;
  }
};

// Component for task modal
const PersonalTaskModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: any) => void;
  task?: any;
  taskLists: any[];
  selectedListId: string;
}> = ({ isOpen, onClose, onSubmit, task, taskLists, selectedListId }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    dueDate: '',
    category: 'personal',
    listId: selectedListId,
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        dueDate: task.dueDate || '',
        category: task.category || 'personal',
        listId: task.listId || selectedListId,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        category: 'personal',
        listId: selectedListId,
      });
    }
  }, [task, selectedListId]);

  const handleSubmit = () => {
    if (!formData.title.trim()) return;
    onSubmit(formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task ? 'Редактировать задачу' : 'Создать задачу'}>
      <div className="space-y-4">
        <Input
          label="Название задачи"
          value={formData.title}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
          placeholder="Введите название задачи"
          required
        />

        <div>
          <label className="block text-sm font-medium text-ink mb-2">Описание</label>
          <textarea
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder="Введите описание задачи"
            className="w-full px-4 py-3 border-2 border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-400 resize-none transition-all"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-2">Приоритет</label>
          <select
            value={formData.priority}
            onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
            className="w-full px-4 py-3 border-2 border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-400 pr-8 transition-all"
          >
            <option value="low">Низкий</option>
            <option value="medium">Средний</option>
            <option value="high">Высокий</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-2">Список</label>
          <select
            value={formData.listId}
            onChange={e => setFormData({ ...formData, listId: e.target.value })}
            className="w-full px-4 py-3 border-2 border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-400 pr-8 transition-all"
          >
            {taskLists.map(list => (
              <option key={list.id} value={list.id}>
                {list.name}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Срок выполнения"
          type="date"
          value={formData.dueDate}
          onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
        />

        <div className="flex space-x-3 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.title.trim()} className="flex-1">
            {task ? 'Сохранить' : 'Создать'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  color: string;
  type: 'task' | 'meeting' | 'reminder' | 'personal';
  completed: boolean;
  userId: string;
}

interface PersonalTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
  createdAt: string;
  userId: string;
  category: string;
  listId?: string;
}

const PERSONAL_TASKS_STORAGE_KEY = 'personal_tasks';
const TASK_LISTS_STORAGE_KEY = 'task_lists';

const Calendar: React.FC = () => {
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [mode, setMode] = useState<'calendar' | 'tasks'>('calendar');
  const [showEventModal, setShowEventModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Состояние для списков задач
  const [taskLists, setTaskLists] = useState<any[]>([]);
  const [selectedTaskList, setSelectedTaskList] = useState('1');
  const [showListModal, setShowListModal] = useState(false);
  const [newListName, setNewListName] = useState('');

  // Состояния создания/редактирования события и задачи
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    color: '#3B82F6',
    type: 'personal' as const,
  });

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    dueDate: '',
    category: 'Личное',
  });

  const loadTasks = () => {
    const stored = localStorage.getItem(PERSONAL_TASKS_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    return [];
  };

  const loadTaskLists = () => {
    const stored = localStorage.getItem(TASK_LISTS_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    return [
      { id: '1', name: 'Мои задачи', color: 'blue', isDefault: true },
      { id: '2', name: 'Личные дела', color: 'green', isDefault: false },
      { id: '3', name: 'Покупки', color: 'purple', isDefault: false },
      { id: '4', name: 'Работа', color: 'orange', isDefault: false },
    ];
  };

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [personalTasks, setPersonalTasks] = useState<PersonalTask[]>([]);

  // Загрузка событий из БД
  useEffect(() => {
    if (authLoading || !currentUser) return;
    fetch('/api/calendar')
      .then(res => res.ok ? res.json() : { events: [] })
      .then(data => setEvents(data.events || []))
      .catch(() => setEvents([]));
  }, [currentUser, authLoading]);

  // Загрузка персональных задач и списков из localStorage
  useEffect(() => {
    setPersonalTasks(loadTasks());
    setTaskLists(loadTaskLists());
  }, []);

  // Функция сохранения задач
  const saveTasks = (updatedTasks: PersonalTask[]) => {
    setPersonalTasks(updatedTasks);
    localStorage.setItem(PERSONAL_TASKS_STORAGE_KEY, JSON.stringify(updatedTasks));
  };

  // Функция сохранения списков задач
  const saveTaskLists = (updatedLists: any[]) => {
    setTaskLists(updatedLists);
    localStorage.setItem(TASK_LISTS_STORAGE_KEY, JSON.stringify(updatedLists));
  };

  const handleCreateEvent = async (eventData?: any) => {
    const eventToCreate = eventData || newEvent;
    if (!eventToCreate.title) return;

    const payload = {
      title: eventToCreate.title,
      description: eventToCreate.description || '',
      startDate: eventToCreate.startDate || eventToCreate.date || new Date().toISOString().split('T')[0],
      endDate: eventToCreate.endDate || eventToCreate.date || new Date().toISOString().split('T')[0],
      startTime: eventToCreate.startTime || '09:00',
      endTime: eventToCreate.endTime || '10:00',
      color: eventToCreate.color || 'bg-sky-100 text-sky-700',
      type: eventToCreate.type || 'personal',
    };

    try {
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setEvents([...events, data.event]);
      }
    } catch (error) {
      console.error('Error creating event:', error);
    }

    setNewEvent({
      title: '',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      color: '#3B82F6',
      type: 'personal',
    });
    setShowCreateEvent(false);
  };

  const handleCreateTask = () => {
    if (!newTask.title) return;

    const task: PersonalTask = {
      id: Date.now().toString(),
      ...newTask,
      completed: false,
      createdAt: new Date().toISOString(),
      userId: currentUser?.id || '',
      dueDate: newTask.dueDate || null,
    };

    const updatedTasks = [...personalTasks, task];
    saveTasks(updatedTasks);

    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      category: 'Личное',
    });
    setShowTaskModal(false);
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await fetch('/api/calendar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: eventId }),
      });
      setEvents(events.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
    }
    setShowEventModal(false);
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = personalTasks.filter(task => task.id !== taskId);
    saveTasks(updatedTasks);
    setShowTaskModal(false);
  };

  const handleToggleEventComplete = async (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    try {
      await fetch('/api/calendar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: eventId, completed: !event.completed }),
      });
      setEvents(events.map(e => e.id === eventId ? { ...e, completed: !e.completed } : e));
    } catch (error) {
      console.error('Error toggling event:', error);
    }
  };

  const handleToggleTaskComplete = (taskId: string) => {
    const updatedTasks = personalTasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    saveTasks(updatedTasks);
  };

  // Helper functions
  const getFilteredTasks = () => {
    let filtered = personalTasks;

    if (taskFilter === 'pending') {
      filtered = filtered.filter(task => !task.completed);
    } else if (taskFilter === 'completed') {
      filtered = filtered.filter(task => task.completed);
    }

    return filtered.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (a.priority !== b.priority) {
        return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.startDate === dateStr || (event.startDate <= dateStr && event.endDate >= dateStr));
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + (direction === 'next' ? 1 : -1), 1));
  };

  // Additional task list functions
  const handleCreateTaskList = () => {
    if (!newListName.trim()) return;

    const colors = ['blue', 'green', 'purple', 'orange', 'red', 'yellow', 'pink', 'indigo'];
    const usedColors = taskLists.map(list => list.color);
    const availableColors = colors.filter(color => !usedColors.includes(color));
    const selectedColor = availableColors.length > 0 ? availableColors[0] : 'gray';

    const newList = {
      id: Date.now().toString(),
      name: newListName.trim(),
      color: selectedColor,
      isDefault: false,
    };

    const updatedLists = [...taskLists, newList];
    saveTaskLists(updatedLists);

    setNewListName('');
    setShowListModal(false);
  };

  const handleDeleteTaskList = (listId: string) => {
    const listToDelete = taskLists.find(list => list.id === listId);
    if (listToDelete?.isDefault) return;

    const updatedTasks = personalTasks.map(task =>
      task.listId === listId ? { ...task, listId: '1' } : task,
    );

    const updatedLists = taskLists.filter(list => list.id !== listId);

    saveTaskLists(updatedLists);
    saveTasks(updatedTasks);

    if (selectedTaskList === listId) {
      setSelectedTaskList('1');
    }
  };

  const getListColor = (listId: string) => {
    const list = taskLists.find(l => l.id === listId);
    return list?.color || 'gray';
  };

  const getListName = (listId: string) => {
    const list = taskLists.find(l => l.id === listId);
    return list?.name || 'Неизвестный список';
  };

  const getFilteredPersonalTasks = () => {
    let filtered = personalTasks.filter(task => task.listId === selectedTaskList);

    if (taskFilter === 'pending') {
      filtered = filtered.filter(task => !task.completed);
    } else if (taskFilter === 'completed') {
      filtered = filtered.filter(task => task.completed);
    }

    return filtered.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
      return bPriority - aPriority;
    });
  };

  const handleCreatePersonalTask = (taskData: any) => {
    const newTaskObj = {
      ...taskData,
      id: Date.now().toString(),
      listId: taskData.listId || selectedTaskList,
      completed: false,
      createdAt: new Date().toISOString(),
      userId: currentUser?.id || '',
    };

    const updatedTasks = [...personalTasks, newTaskObj];
    saveTasks(updatedTasks);
    setShowTaskModal(false);
  };

  const handleUpdatePersonalTask = (taskId: string, updates: any) => {
    const updatedTasks = personalTasks.map(task =>
      task.id === taskId ? { ...task, ...updates } : task
    );
    saveTasks(updatedTasks);
  };

  const handleDeletePersonalTask = (taskId: string) => {
    const updatedTasks = personalTasks.filter(task => task.id !== taskId);
    saveTasks(updatedTasks);
  };

  const getTasksCount = (listId: string) => {
    return personalTasks.filter(task => task.listId === listId && !task.completed).length;
  };

  // Rendering functions for calendar views
  const renderMonthView = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    startDate.setDate(startDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const days = [];
    const currentDateObj = new Date(startDate);
    const todayStr = new Date().toISOString().split('T')[0];

    for (let i = 0; i < 42; i++) {
      const dateStr = currentDateObj.toISOString().split('T')[0];
      const dayEvents = events.filter(e => e.startDate === dateStr);
      const isCurrentMonth = currentDateObj.getMonth() === currentDate.getMonth();
      const isTodayDate = dateStr === todayStr;

      days.push({
        date: new Date(currentDateObj),
        dateStr,
        dayEvents,
        isCurrentMonth,
        isToday: isTodayDate,
        dayNumber: currentDateObj.getDate(),
      });

      currentDateObj.setDate(currentDateObj.getDate() + 1);
    }

    const weekDaysLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    return (
      <div className="p-4">
        {/* Заголовки дней недели */}
        <div className="grid grid-cols-7 mb-2">
          {weekDaysLabels.map((day, idx) => (
            <div key={idx} className="py-3 text-center text-sm font-semibold text-ink-muted">
              {day}
            </div>
          ))}
        </div>

        {/* Сетка дней */}
        <div className="grid grid-cols-7 gap-px bg-surface-200 rounded-xl overflow-hidden">
          {days.map((day, idx) => (
            <div
              key={idx}
              onClick={() => {
                setSelectedDate(day.date);
                setShowCreateEvent(true);
              }}
              className={`min-h-[100px] p-2 cursor-pointer transition-all hover:bg-primary-50 ${
                day.isCurrentMonth ? 'bg-white' : 'bg-surface-50'
              }`}
            >
              <div className="flex items-center justify-center mb-1">
                <span
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    day.isToday
                      ? 'bg-primary-600 text-white'
                      : day.isCurrentMonth
                      ? 'text-ink hover:bg-surface-100'
                      : 'text-ink-light'
                  }`}
                >
                  {day.dayNumber}
                </span>
              </div>
              <div className="space-y-1">
                {day.dayEvents.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    className={`text-xs px-2 py-1 rounded-md truncate ${event.color || 'bg-primary-100 text-primary-700'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(event);
                      setShowEventModal(true);
                    }}
                  >
                    {event.title}
                  </div>
                ))}
                {day.dayEvents.length > 2 && (
                  <div className="text-xs text-ink-muted text-center">+{day.dayEvents.length - 2}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(startOfWeek.getDate() + diff);

    const weekDaysArr: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDaysArr.push(day);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

    return (
      <div className="p-4">
        {/* Заголовки дней */}
        <div className="grid grid-cols-8 gap-px mb-2">
          <div className="p-3"></div>
          {weekDaysArr.map((day, index) => {
            const dayStr = day.toISOString().split('T')[0];
            const isTodayDate = dayStr === todayStr;
            return (
              <div key={index} className="p-3 text-center">
                <div className="text-xs font-medium text-ink-muted uppercase">
                  {day.toLocaleDateString('ru-RU', { weekday: 'short' })}
                </div>
                <div
                  className={`mt-1 w-10 h-10 mx-auto flex items-center justify-center rounded-full text-lg font-semibold ${
                    isTodayDate ? 'bg-primary-600 text-white' : 'text-ink'
                  }`}
                >
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Сетка времени */}
        <div className="bg-surface-200 rounded-xl overflow-hidden">
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-8 gap-px">
              <div className="bg-white p-2 text-right pr-3">
                <span className="text-xs font-medium text-ink-muted">
                  {hour.toString().padStart(2, '0')}:00
                </span>
              </div>

              {weekDaysArr.map((day, dayIndex) => {
                const dayStr = day.toISOString().split('T')[0];
                const isTodayDate = dayStr === todayStr;
                const dayEvents = getEventsForDate(day).filter(event => {
                  if (!event.startTime) return false;
                  const eventHour = parseInt(event.startTime.split(':')[0]);
                  return eventHour === hour;
                });

                return (
                  <div
                    key={dayIndex}
                    className={`bg-white p-1 min-h-[50px] border-l border-surface-100 hover:bg-primary-50 cursor-pointer transition-colors ${
                      isTodayDate ? 'bg-primary-50/30' : ''
                    }`}
                    onClick={() => {
                      setSelectedDate(day);
                      setShowCreateEvent(true);
                    }}
                  >
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`text-xs px-2 py-1 rounded-md mb-1 cursor-pointer ${event.color || 'bg-primary-100 text-primary-700'}`}
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedEvent(event);
                          setShowEventModal(true);
                        }}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        <div className="opacity-75">{formatTime(event.startTime)}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const hours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
    const dayEvents = getEventsForDate(currentDate);
    const todayStr = new Date().toISOString().split('T')[0];
    const currentDayStr = currentDate.toISOString().split('T')[0];
    const isTodayDate = currentDayStr === todayStr;

    return (
      <div className="p-4">
        {/* Заголовок дня */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-surface-200">
          <div className="flex items-center space-x-4">
            <div
              className={`w-14 h-14 flex flex-col items-center justify-center rounded-2xl ${
                isTodayDate ? 'bg-primary-600 text-white' : 'bg-surface-100 text-ink'
              }`}
            >
              <span className="text-xs font-medium uppercase">
                {format(currentDate, 'EEE', { locale: ru })}
              </span>
              <span className="text-xl font-bold">{currentDate.getDate()}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-ink">
                {format(currentDate, 'd MMMM yyyy', { locale: ru })}
              </h3>
              <p className="text-sm text-ink-muted">
                {dayEvents.length} {dayEvents.length === 1 ? 'событие' : 'событий'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentDate(addDays(currentDate, -1))}
              className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-100 cursor-pointer transition-colors"
            >
              <i className="ri-arrow-left-s-line text-xl"></i>
            </button>
            <button
              onClick={() => setCurrentDate(addDays(currentDate, 1))}
              className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-100 cursor-pointer transition-colors"
            >
              <i className="ri-arrow-right-s-line text-xl"></i>
            </button>
          </div>
        </div>

        {/* Сетка времени */}
        <div className="bg-surface-200 rounded-xl overflow-hidden">
          {hours.map(hour => {
            const hourEvents = dayEvents.filter(event => {
              if (!event.startTime) return false;
              const eventHour = parseInt(event.startTime.split(':')[0]);
              return eventHour === hour;
            });

            return (
              <div key={hour} className="grid grid-cols-12 gap-px">
                <div className="col-span-1 bg-white p-3 text-right">
                  <span className="text-sm font-medium text-ink-muted">
                    {hour.toString().padStart(2, '0')}:00
                  </span>
                </div>

                <div
                  className="col-span-11 bg-white p-2 min-h-[60px] hover:bg-primary-50 cursor-pointer transition-colors"
                  onClick={() => setShowCreateEvent(true)}
                >
                  <div className="space-y-2">
                    {hourEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`p-3 rounded-lg cursor-pointer hover:shadow-md transition-shadow ${event.color || 'bg-primary-100 text-primary-700'}`}
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedEvent(event);
                          setShowEventModal(true);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-semibold">{event.title}</div>
                          <div className="text-sm opacity-75">
                            {formatTime(event.startTime)} - {formatTime(event.endTime)}
                          </div>
                        </div>
                        {event.description && (
                          <div className="text-sm opacity-75 mt-1">{event.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Rendering functions for tasks view
  const renderTasksView = () => {
    const filteredTasks = getFilteredPersonalTasks();
    const currentList = taskLists.find(list => list.id === selectedTaskList);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full bg-${currentList?.color}-500`}></div>
            <h2 className="text-xl font-semibold text-ink">{currentList?.name}</h2>
            <span className="text-sm text-gray-500">
              ({filteredTasks.filter(t => !t.completed).length} активных)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => setShowTaskModal(true)} size="sm">
              <i className="ri-add-line mr-1"></i>
              Добавить задачу
            </Button>

            <Button variant="outline" onClick={() => setShowListModal(true)} size="sm">
              <i className="ri-add-line mr-1"></i>
              Новый список
            </Button>
          </div>
        </div>

        <div className="flex space-x-6">
          <div className="w-64 bg-white rounded-2xl shadow-soft border border-surface-200 p-4">
            <h3 className="font-semibold text-ink mb-3">Мои списки</h3>
            <div className="space-y-1">
              {taskLists.map(list => (
                <div
                  key={list.id}
                  className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedTaskList === list.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedTaskList(list.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full bg-${list.color}-500`}></div>
                    <span className="text-sm font-medium">{list.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">{getTasksCount(list.id)}</span>
                    {!list.isDefault && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteTaskList(list.id);
                        }}
                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <i className="ri-delete-bin-line text-xs"></i>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-soft border border-surface-200">
              <div className="border-b border-surface-200 p-4">
                <div className="flex space-x-1">
                  {[
                    { key: 'all', label: 'Все', count: personalTasks.filter(t => t.listId === selectedTaskList).length },
                    { key: 'pending', label: 'Ожидающие', count: personalTasks.filter(t => t.listId === selectedTaskList && !t.completed).length },
                    { key: 'completed', label: 'Завершенные', count: personalTasks.filter(t => t.listId === selectedTaskList && t.completed).length },
                  ].map(filterItem => (
                    <button
                      key={filterItem.key}
                      onClick={() => setTaskFilter(filterItem.key as any)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                        taskFilter === filterItem.key
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-ink-muted hover:text-ink hover:bg-surface-100'
                      }`}
                    >
                      {filterItem.label} ({filterItem.count})
                    </button>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-surface-100">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map(task => (
                    <div
                      key={task.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${task.completed ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start space-x-3">
                        <button
                          onClick={() => handleUpdatePersonalTask(task.id, { completed: !task.completed })}
                          className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer ${
                            task.completed
                              ? `bg-${getListColor(task.listId || '')}-500 border-${getListColor(task.listId || '')}-500`
                              : `border-gray-300 hover:border-${getListColor(task.listId || '')}-500`
                          }`}
                        >
                          {task.completed && <i className="ri-check-line text-white text-sm"></i>}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4
                              className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}
                            >
                              {task.title}
                            </h4>

                            <div className="flex items-center space-x-2">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  task.priority === 'high'
                                    ? 'bg-rose-100 text-rose-700'
                                    : task.priority === 'medium'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}
                              >
                                {task.priority === 'high'
                                  ? 'Высокий'
                                  : task.priority === 'medium'
                                  ? 'Средний'
                                  : 'Низкий'}
                              </span>

                              {task.dueDate && (
                                <span
                                  className={`text-xs ${
                                    new Date(task.dueDate) < new Date() && !task.completed
                                      ? 'text-red-600 font-medium'
                                      : 'text-gray-500'
                                  }`}
                                >
                                  {format(new Date(task.dueDate), 'd MMM', { locale: ru })}
                                </span>
                              )}

                              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setSelectedTask(task);
                                    setShowTaskModal(true);
                                  }}
                                  className="text-gray-400 hover:text-blue-500 cursor-pointer"
                                >
                                  <i className="ri-edit-line text-sm"></i>
                                </button>
                                <button
                                  onClick={() => handleDeletePersonalTask(task.id)}
                                  className="text-gray-400 hover:text-red-500 cursor-pointer"
                                >
                                  <i className="ri-delete-bin-line text-sm"></i>
                                </button>
                              </div>
                            </div>
                          </div>

                          {task.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>}

                          <div className="flex items-center space-x-2 mt-2">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs bg-${getListColor(task.listId || '')}-100 text-${getListColor(task.listId || '')}-800`}
                            >
                              <i className={`${getCategoryIcon(task.category)} mr-1`}></i>
                              {getCategoryName(task.category)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <i className="ri-task-line text-ink-light text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-ink mb-2">
                      {taskFilter === 'completed' ? 'Нет завершенных задач' : 'Список пуст'}
                    </h3>
                    <p className="text-ink-muted">
                      {taskFilter === 'completed'
                        ? 'Завершенные задачи появятся здесь'
                        : 'Добавьте первую задачу в этот список'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Main render
  if (authLoading || !currentUser) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-surface-100">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-ink to-primary-600 bg-clip-text text-transparent">Календарь</h1>
            <p className="text-ink-muted mt-1">Управляйте своим временем и задачами</p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex space-x-1 bg-surface-100 rounded-xl p-1">
              <button
                onClick={() => setMode('calendar')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                  mode === 'calendar' ? 'bg-white text-ink shadow-soft' : 'text-ink-muted hover:text-ink'
                }`}
              >
                <i className="ri-calendar-line mr-2"></i>
                Календарь
              </button>
              <button
                onClick={() => setMode('tasks')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                  mode === 'tasks' ? 'bg-white text-ink shadow-soft' : 'text-ink-muted hover:text-ink'
                }`}
              >
                <i className="ri-task-line mr-2"></i>
                Задачи ({personalTasks.filter(t => !t.completed).length})
              </button>
            </div>
          </div>
        </div>

        {mode === 'calendar' ? (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-soft border border-surface-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button variant="outline" onClick={() => setCurrentDate(new Date())} size="sm">
                    Сегодня
                  </Button>

                  <div className="flex items-center space-x-2">
                    <button onClick={() => navigateMonth('prev')} className="p-2 text-gray-400 hover:text-gray-600 cursor-pointer">
                      <i className="ri-arrow-left-s-line"></i>
                    </button>
                    <h2 className="text-xl font-semibold text-ink min-w-[200px] text-center">
                      {format(currentDate, 'LLLL yyyy', { locale: ru })}
                    </h2>
                    <button onClick={() => navigateMonth('next')} className="p-2 text-gray-400 hover:text-gray-600 cursor-pointer">
                      <i className="ri-arrow-right-s-line"></i>
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1 bg-surface-100 rounded-xl p-1">
                    {['month', 'week', 'day'].map(viewType => (
                      <button
                        key={viewType}
                        onClick={() => setView(viewType as any)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                          view === viewType ? 'bg-white text-ink shadow-soft' : 'text-ink-muted hover:text-ink'
                        }`}
                      >
                        {viewType === 'month' ? 'Месяц' : viewType === 'week' ? 'Неделя' : 'День'}
                      </button>
                    ))}
                  </div>

                  <Button onClick={() => setShowEventModal(true)}>
                    <i className="ri-add-line mr-2"></i>
                    Создать событие
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft border border-surface-200 overflow-hidden">
              {view === 'month' && renderMonthView()}
              {view === 'week' && renderWeekView()}
              {view === 'day' && renderDayView()}
            </div>
          </div>
        ) : (
          renderTasksView()
        )}
      </div>

      {/* Модальные окна */}
      {/* Модальное окно создания события */}
      <Modal
        isOpen={showCreateEvent}
        onClose={() => {
          setShowCreateEvent(false);
          setSelectedDate(null);
        }}
        title="Создать событие"
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const newEventData = {
              id: Date.now().toString(),
              title: formData.get('title') as string,
              description: formData.get('description') as string,
              date: formData.get('date') as string,
              startTime: formData.get('startTime') as string,
              endTime: formData.get('endTime') as string,
              type: formData.get('type') as string,
              color: formData.get('color') as string,
            };
            handleCreateEvent(newEventData);
          }}
          className="space-y-4"
        >
          <Input
            name="title"
            label="Название события"
            required
            placeholder="Введите название"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              name="description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Добавьте описание события"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              name="date"
              label="Дата"
              type="date"
              required
              defaultValue={selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Тип события
              </label>
              <select
                name="type"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="meeting">Встреча</option>
                <option value="deadline">Дедлайн</option>
                <option value="reminder">Напоминание</option>
                <option value="other">Другое</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              name="startTime"
              label="Время начала"
              type="time"
              required
            />

            <Input
              name="endTime"
              label="Время окончания"
              type="time"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Цвет события
            </label>
            <div className="flex space-x-2">
              {[
                { value: 'bg-sky-100 text-sky-700', label: 'Синий' },
                { value: 'bg-emerald-100 text-emerald-700', label: 'Зеленый' },
                { value: 'bg-rose-100 text-rose-700', label: 'Красный' },
                { value: 'bg-violet-100 text-violet-700', label: 'Фиолетовый' },
                { value: 'bg-amber-100 text-amber-700', label: 'Оранжевый' },
              ].map((color) => (
                <label key={color.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="color"
                    value={color.value}
                    defaultChecked={color.value === 'bg-sky-100 text-sky-700'}
                    className="sr-only"
                  />
                  <div className={`w-8 h-8 rounded-full ${color.value} flex items-center justify-center hover:ring-2 hover:ring-offset-2 hover:ring-primary-500`}>
                    <i className="ri-check-line text-sm"></i>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreateEvent(false);
                setSelectedDate(null);
              }}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button type="submit" className="flex-1">
              <i className="ri-add-line mr-2"></i>
              Создать событие
            </Button>
          </div>
        </form>
      </Modal>

      <PersonalTaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setSelectedTask(null);
        }}
        onSubmit={selectedTask ? (taskData: any) => {
          handleUpdatePersonalTask(selectedTask.id, taskData);
          setShowTaskModal(false);
          setSelectedTask(null);
        } : handleCreatePersonalTask}
        task={selectedTask}
        taskLists={taskLists}
        selectedListId={selectedTaskList}
      />
    </div>
  );
};

export default Calendar;
