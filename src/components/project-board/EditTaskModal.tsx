'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/base/Modal';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import UserPicker from '@/components/base/UserPicker';
import MultiUserPicker from '@/components/base/MultiUserPicker';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  task: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (updatedTask: any) => void;
  projectId: string;
  existingTasks?: Array<{ id: string; key: string; title: string; taskType: string }>;
  isManager: boolean;
}

const BOARD_COLUMNS = [
  { id: '1', name: 'Backlog' },
  { id: '2', name: 'To Do' },
  { id: '3', name: 'In Progress' },
  { id: '4', name: 'Review' },
  { id: '5', name: 'Done' },
];

const TASK_TYPES = [
  { value: 'task', label: 'Обычная задача', icon: 'ri-task-line' },
  { value: 'recurring', label: 'Регулярная', icon: 'ri-repeat-line' },
  { value: 'parent', label: 'Заглавная задача', icon: 'ri-folder-open-line' },
  { value: 'stage', label: 'Этап', icon: 'ri-git-branch-line' },
];

const RECURRENCE_OPTIONS = [
  { value: 'daily', label: 'Ежедневно' },
  { value: 'weekly', label: 'Еженедельно' },
  { value: 'biweekly', label: 'Раз в 2 недели' },
  { value: 'monthly', label: 'Ежемесячно' },
];

const WEEKDAYS = [
  { value: 'mon', label: 'Пн' },
  { value: 'tue', label: 'Вт' },
  { value: 'wed', label: 'Ср' },
  { value: 'thu', label: 'Чт' },
  { value: 'fri', label: 'Пт' },
  { value: 'sat', label: 'Сб' },
  { value: 'sun', label: 'Вс' },
];

const ACCEPTANCE_STATUSES = [
  { value: '', label: 'Не указан' },
  { value: 'pending', label: 'Ожидает' },
  { value: 'in_review', label: 'На рассмотрении' },
  { value: 'accepted', label: 'Принято' },
  { value: 'rejected', label: 'Отклонено' },
];

const EditTaskModal: React.FC<EditTaskModalProps> = ({
  isOpen,
  onClose,
  task,
  onSave,
  projectId,
  existingTasks = [],
  isManager,
}) => {
  const [taskType, setTaskType] = useState('task');
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'To Do',
    priority: 'P3',
    assigneeId: '',
    labels: '',
    dueDate: '',
    startDate: '',
    assignmentDate: '',
    expectedHours: '',
    actualHours: '',
    parentId: '',
  });
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [recurrencePattern, setRecurrencePattern] = useState('weekly');
  const [recurrenceDays, setRecurrenceDays] = useState<string[]>([]);
  const [parentFields, setParentFields] = useState({
    initiatorName: '',
    initiatorEmail: '',
    initiatorPosition: '',
    curatorName: '',
    curatorEmail: '',
    curatorPosition: '',
    acceptanceStatus: '',
  });
  const [customDates, setCustomDates] = useState<Array<{ name: string; date: string }>>([]);
  const [saving, setSaving] = useState(false);

  // Pre-fill form when task changes
  useEffect(() => {
    if (!task) return;
    setTaskType(task.taskType || 'task');

    let labelsStr = '';
    try {
      const parsed = typeof task.labels === 'string' ? JSON.parse(task.labels) : task.labels;
      labelsStr = Array.isArray(parsed) ? parsed.join(', ') : '';
    } catch { labelsStr = ''; }

    setForm({
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'To Do',
      priority: task.priority || 'P3',
      assigneeId: task.assigneeId || '',
      labels: labelsStr,
      dueDate: task.dueDate || '',
      startDate: task.startDate || '',
      assignmentDate: task.assignmentDate || '',
      expectedHours: task.expectedHours ? String(task.expectedHours) : '',
      actualHours: task.actualHours ? String(task.actualHours) : '',
      parentId: task.parentId || '',
    });

    // Multiple assignees
    const extraAssignees = (task.assignees || [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((a: any) => a.userId || a.user?.id)
      .filter(Boolean);
    setAssigneeIds(extraAssignees);

    // Recurring
    setRecurrencePattern(task.recurrencePattern || 'weekly');
    try {
      const days = typeof task.recurrenceDays === 'string' ? JSON.parse(task.recurrenceDays) : task.recurrenceDays;
      setRecurrenceDays(Array.isArray(days) ? days : []);
    } catch { setRecurrenceDays([]); }

    // Parent task fields
    setParentFields({
      initiatorName: task.initiatorName || '',
      initiatorEmail: task.initiatorEmail || '',
      initiatorPosition: task.initiatorPosition || '',
      curatorName: task.curatorName || '',
      curatorEmail: task.curatorEmail || '',
      curatorPosition: task.curatorPosition || '',
      acceptanceStatus: task.acceptanceStatus || '',
    });

    try {
      const cd = typeof task.customDates === 'string' ? JSON.parse(task.customDates) : task.customDates;
      setCustomDates(Array.isArray(cd) ? cd : []);
    } catch { setCustomDates([]); }
  }, [task]);

  const parentTasks = existingTasks.filter(t => t.taskType === 'parent' && t.id !== task?.id);
  const parentAndStageTasks = existingTasks.filter(t => (t.taskType === 'parent' || t.taskType === 'stage') && t.id !== task?.id);

  const handleSave = async () => {
    if (!task) return;
    setSaving(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = {};

      // Always send editable fields
      if (form.status !== task.status) data.status = form.status;
      if (form.description !== (task.description || '')) data.description = form.description;

      if (isManager) {
        if (form.title !== task.title) data.title = form.title;
        if (form.priority !== task.priority) data.priority = form.priority;
        if (form.assigneeId !== (task.assigneeId || '')) data.assigneeId = form.assigneeId || null;
        if (form.dueDate !== (task.dueDate || '')) data.dueDate = form.dueDate || null;
        if (form.startDate !== (task.startDate || '')) data.startDate = form.startDate || null;
        if (form.assignmentDate !== (task.assignmentDate || '')) data.assignmentDate = form.assignmentDate || null;
        if (form.parentId !== (task.parentId || '')) data.parentId = form.parentId || null;

        const newExpected = form.expectedHours ? parseFloat(form.expectedHours) : 0;
        if (newExpected !== (task.expectedHours || 0)) data.expectedHours = newExpected;

        const labels = form.labels.split(',').map(l => l.trim()).filter(l => l);
        data.labels = labels;

        if (taskType !== task.taskType) data.taskType = taskType;

        if (taskType === 'recurring') {
          data.isRecurring = true;
          data.recurrencePattern = recurrencePattern;
          data.recurrenceDays = recurrenceDays;
        }

        if (taskType === 'parent') {
          Object.assign(data, parentFields);
          data.customDates = customDates.filter(d => d.name && d.date);
        }
      }

      // actualHours can be edited by anyone on their own tasks
      const newActual = form.actualHours ? parseFloat(form.actualHours) : 0;
      if (newActual !== (task.actualHours || 0)) data.actualHours = newActual;

      if (Object.keys(data).length === 0) {
        onClose();
        return;
      }

      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const result = await res.json();
        onSave(result.task);
      }
    } catch (error) {
      console.error('Save task error:', error);
    } finally {
      setSaving(false);
    }
  };

  const addCustomDate = () => setCustomDates([...customDates, { name: '', date: '' }]);
  const removeCustomDate = (i: number) => setCustomDates(customDates.filter((_, idx) => idx !== i));
  const toggleDay = (day: string) => {
    setRecurrenceDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  if (!task) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Редактировать — ${task.key}`} size="xl">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {/* Task Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Тип задачи</label>
          <div className="grid grid-cols-4 gap-2">
            {TASK_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => isManager && setTaskType(type.value)}
                disabled={!isManager}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  !isManager ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                } ${
                  taskType === type.value
                    ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-300'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <i className={type.icon}></i>
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <Input
          label="Название задачи"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Введите название задачи"
          disabled={!isManager}
          required
        />

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Описание задачи"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Status & Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {BOARD_COLUMNS.map((col) => (
                <option key={col.id} value={col.name}>{col.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Приоритет</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              disabled={!isManager}
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="P1">P1 - Критический</option>
              <option value="P2">P2 - Высокий</option>
              <option value="P3">P3 - Средний</option>
              <option value="P4">P4 - Низкий</option>
            </select>
          </div>
        </div>

        {/* Parent task selector */}
        {(taskType === 'stage' || taskType === 'task') && parentAndStageTasks.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {taskType === 'stage' ? 'Заглавная задача' : 'Родительская задача'}
            </label>
            <select
              value={form.parentId}
              onChange={(e) => setForm({ ...form, parentId: e.target.value })}
              disabled={!isManager}
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">Без привязки</option>
              {(taskType === 'stage' ? parentTasks : parentAndStageTasks).map((t) => (
                <option key={t.id} value={t.id}>{t.key} - {t.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* Assignees */}
        {isManager && (
          <>
            <UserPicker
              label="Основной исполнитель"
              value={form.assigneeId}
              onChange={(userId) => setForm({ ...form, assigneeId: userId })}
              placeholder="Поиск пользователя..."
            />
            <MultiUserPicker
              label="Дополнительные исполнители"
              value={assigneeIds}
              onChange={setAssigneeIds}
              excludeIds={form.assigneeId ? [form.assigneeId] : []}
              placeholder="Добавить исполнителей..."
            />
          </>
        )}

        {/* Dates */}
        {taskType !== 'recurring' && (
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Дата назначения"
              type="date"
              value={form.assignmentDate}
              onChange={(e) => setForm({ ...form, assignmentDate: e.target.value })}
              disabled={!isManager}
            />
            <Input
              label="Дата начала"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              disabled={!isManager}
            />
            <Input
              label="Срок выполнения"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              disabled={!isManager}
            />
          </div>
        )}

        {/* Labor costs */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Ожидаемые трудозатраты (ч)"
            type="number"
            value={form.expectedHours}
            onChange={(e) => setForm({ ...form, expectedHours: e.target.value })}
            placeholder="0"
            disabled={!isManager}
          />
          <Input
            label="Фактические трудозатраты (ч)"
            type="number"
            value={form.actualHours}
            onChange={(e) => setForm({ ...form, actualHours: e.target.value })}
            placeholder="0"
          />
        </div>

        {/* Recurring settings */}
        {taskType === 'recurring' && isManager && (
          <div className="border rounded-lg p-4 bg-blue-50/50 space-y-4">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <i className="ri-repeat-line"></i>
              Настройки повторения
            </h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Частота</label>
              <select
                value={recurrencePattern}
                onChange={(e) => setRecurrencePattern(e.target.value)}
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {RECURRENCE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {(recurrencePattern === 'weekly' || recurrencePattern === 'biweekly') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Дни недели</label>
                <div className="flex gap-2">
                  {WEEKDAYS.map(day => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                        recurrenceDays.includes(day.value)
                          ? 'bg-primary-500 text-white'
                          : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Input label="Дата начала" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              <Input label="Срок выполнения" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
        )}

        {/* Parent task fields */}
        {taskType === 'parent' && isManager && (
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-gray-50/50 space-y-3">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <i className="ri-user-star-line"></i> Инициатор
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <Input label="ФИО" value={parentFields.initiatorName} onChange={(e) => setParentFields({ ...parentFields, initiatorName: e.target.value })} />
                <Input label="Почта" type="email" value={parentFields.initiatorEmail} onChange={(e) => setParentFields({ ...parentFields, initiatorEmail: e.target.value })} />
                <Input label="Должность" value={parentFields.initiatorPosition} onChange={(e) => setParentFields({ ...parentFields, initiatorPosition: e.target.value })} />
              </div>
            </div>
            <div className="border rounded-lg p-4 bg-gray-50/50 space-y-3">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <i className="ri-shield-user-line"></i> Куратор
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <Input label="ФИО" value={parentFields.curatorName} onChange={(e) => setParentFields({ ...parentFields, curatorName: e.target.value })} />
                <Input label="Почта" type="email" value={parentFields.curatorEmail} onChange={(e) => setParentFields({ ...parentFields, curatorEmail: e.target.value })} />
                <Input label="Должность" value={parentFields.curatorPosition} onChange={(e) => setParentFields({ ...parentFields, curatorPosition: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Статус приёмки</label>
              <select
                value={parentFields.acceptanceStatus}
                onChange={(e) => setParentFields({ ...parentFields, acceptanceStatus: e.target.value })}
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {ACCEPTANCE_STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Пользовательские даты</label>
                <button type="button" onClick={addCustomDate} className="text-sm text-primary-600 hover:text-primary-700 cursor-pointer flex items-center gap-1">
                  <i className="ri-add-line"></i> Добавить дату
                </button>
              </div>
              {customDates.map((cd, index) => (
                <div key={index} className="flex items-end gap-2 mb-2">
                  <div className="flex-1">
                    <Input
                      label={index === 0 ? 'Название' : undefined}
                      value={cd.name}
                      onChange={(e) => { const u = [...customDates]; u[index].name = e.target.value; setCustomDates(u); }}
                      placeholder="Дата согласования"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      label={index === 0 ? 'Дата' : undefined}
                      type="date"
                      value={cd.date}
                      onChange={(e) => { const u = [...customDates]; u[index].date = e.target.value; setCustomDates(u); }}
                    />
                  </div>
                  <button type="button" onClick={() => removeCustomDate(index)} className="text-red-400 hover:text-red-600 cursor-pointer p-2 mb-0.5">
                    <i className="ri-close-line"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Labels */}
        <Input
          label="Метки"
          value={form.labels}
          onChange={(e) => setForm({ ...form, labels: e.target.value })}
          placeholder="frontend, api, bug (через запятую)"
          disabled={!isManager}
        />

        {/* Actions */}
        <div className="flex space-x-4 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={!form.title || saving} className="flex-1">
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditTaskModal;
