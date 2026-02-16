'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/base/Modal';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import UserPicker from '@/components/base/UserPicker';
import MultiUserPicker from '@/components/base/MultiUserPicker';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: any) => void;
  projectId: string;
  projectKey: string;
  columns: Array<{ id: string; name: string; order: number }>;
  existingTasks?: Array<{ id: string; key: string; title: string; taskType: string }>;
}

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

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  projectId,
  projectKey,
  columns,
  existingTasks = [],
}) => {
  const [taskType, setTaskType] = useState('task');
  const [task, setTask] = useState({
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

  // Multiple assignees
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);

  // Recurring fields
  const [recurrencePattern, setRecurrencePattern] = useState('weekly');
  const [recurrenceDays, setRecurrenceDays] = useState<string[]>([]);

  // Parent task fields
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

  // Fetch parent tasks for stage/task type
  const parentTasks = existingTasks.filter(t => t.taskType === 'parent');
  const parentAndStageTasks = existingTasks.filter(t => t.taskType === 'parent' || t.taskType === 'stage');

  const handleSubmit = () => {
    if (!task.title) return;

    const taskData: any = {
      ...task,
      taskType,
      labels: task.labels.split(',').map(l => l.trim()).filter(l => l),
      assigneeIds: assigneeIds.length > 0 ? assigneeIds : undefined,
      expectedHours: task.expectedHours ? parseFloat(task.expectedHours) : 0,
      actualHours: task.actualHours ? parseFloat(task.actualHours) : 0,
    };

    if (taskType === 'recurring') {
      taskData.isRecurring = true;
      taskData.recurrencePattern = recurrencePattern;
      taskData.recurrenceDays = recurrenceDays;
    }

    if (taskType === 'parent') {
      Object.assign(taskData, parentFields);
      taskData.customDates = customDates.filter(d => d.name && d.date);
    }

    onSubmit(taskData);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTaskType('task');
    setTask({
      title: '', description: '', status: 'To Do', priority: 'P3',
      assigneeId: '', labels: '', dueDate: '', startDate: '',
      assignmentDate: '', expectedHours: '', actualHours: '', parentId: '',
    });
    setAssigneeIds([]);
    setRecurrencePattern('weekly');
    setRecurrenceDays([]);
    setParentFields({
      initiatorName: '', initiatorEmail: '', initiatorPosition: '',
      curatorName: '', curatorEmail: '', curatorPosition: '',
      acceptanceStatus: '',
    });
    setCustomDates([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const addCustomDate = () => {
    setCustomDates([...customDates, { name: '', date: '' }]);
  };

  const removeCustomDate = (index: number) => {
    setCustomDates(customDates.filter((_, i) => i !== index));
  };

  const toggleDay = (day: string) => {
    setRecurrenceDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Создать новую задачу"
      size="xl"
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {/* Task Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Тип задачи</label>
          <div className="grid grid-cols-4 gap-2">
            {TASK_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setTaskType(type.value)}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
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
          value={task.title}
          onChange={(e) => setTask({ ...task, title: e.target.value })}
          placeholder="Введите название задачи"
          required
        />

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {taskType === 'parent' ? 'Описание функционала' : 'Описание'}
          </label>
          <textarea
            value={task.description}
            onChange={(e) => setTask({ ...task, description: e.target.value })}
            placeholder={taskType === 'parent' ? 'Опишите функционал...' : 'Описание задачи (поддерживается Markdown)'}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Status & Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
            <select
              value={task.status}
              onChange={(e) => setTask({ ...task, status: e.target.value })}
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {columns.map((column) => (
                <option key={column.id} value={column.name}>{column.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Приоритет</label>
            <select
              value={task.priority}
              onChange={(e) => setTask({ ...task, priority: e.target.value })}
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="P1">P1 - Критический</option>
              <option value="P2">P2 - Высокий</option>
              <option value="P3">P3 - Средний</option>
              <option value="P4">P4 - Низкий</option>
            </select>
          </div>
        </div>

        {/* Parent task selector (for stages and regular tasks) */}
        {(taskType === 'stage' || taskType === 'task') && parentAndStageTasks.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {taskType === 'stage' ? 'Заглавная задача (обязательно)' : 'Родительская задача (опционально)'}
            </label>
            <select
              value={task.parentId}
              onChange={(e) => setTask({ ...task, parentId: e.target.value })}
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required={taskType === 'stage'}
            >
              <option value="">Без привязки</option>
              {(taskType === 'stage' ? parentTasks : parentAndStageTasks).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.key} - {t.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Assignees */}
        <UserPicker
          label="Основной исполнитель"
          value={task.assigneeId}
          onChange={(userId) => setTask({ ...task, assigneeId: userId })}
          placeholder="Поиск пользователя по имени или email..."
        />

        <MultiUserPicker
          label="Дополнительные исполнители"
          value={assigneeIds}
          onChange={setAssigneeIds}
          excludeIds={task.assigneeId ? [task.assigneeId] : []}
          placeholder="Добавить исполнителей..."
        />

        {/* Dates - for non-recurring tasks */}
        {taskType !== 'recurring' && (
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Дата назначения"
              type="date"
              value={task.assignmentDate}
              onChange={(e) => setTask({ ...task, assignmentDate: e.target.value })}
            />
            <Input
              label="Дата начала"
              type="date"
              value={task.startDate}
              onChange={(e) => setTask({ ...task, startDate: e.target.value })}
            />
            <Input
              label="Срок выполнения"
              type="date"
              value={task.dueDate}
              onChange={(e) => setTask({ ...task, dueDate: e.target.value })}
            />
          </div>
        )}

        {/* Labor costs */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Ожидаемые трудозатраты (ч)"
            type="number"
            value={task.expectedHours}
            onChange={(e) => setTask({ ...task, expectedHours: e.target.value })}
            placeholder="0"
          />
          <Input
            label="Фактические трудозатраты (ч)"
            type="number"
            value={task.actualHours}
            onChange={(e) => setTask({ ...task, actualHours: e.target.value })}
            placeholder="0"
          />
        </div>

        {/* Recurring task section */}
        {taskType === 'recurring' && (
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
              <Input
                label="Дата начала"
                type="date"
                value={task.startDate}
                onChange={(e) => setTask({ ...task, startDate: e.target.value })}
              />
              <Input
                label="Срок выполнения"
                type="date"
                value={task.dueDate}
                onChange={(e) => setTask({ ...task, dueDate: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Parent task additional fields */}
        {taskType === 'parent' && (
          <div className="space-y-4">
            {/* Initiator */}
            <div className="border rounded-lg p-4 bg-gray-50/50 space-y-3">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <i className="ri-user-star-line"></i>
                Инициатор
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="ФИО"
                  value={parentFields.initiatorName}
                  onChange={(e) => setParentFields({ ...parentFields, initiatorName: e.target.value })}
                  placeholder="ФИО инициатора"
                />
                <Input
                  label="Почта"
                  type="email"
                  value={parentFields.initiatorEmail}
                  onChange={(e) => setParentFields({ ...parentFields, initiatorEmail: e.target.value })}
                  placeholder="email@example.com"
                />
                <Input
                  label="Должность"
                  value={parentFields.initiatorPosition}
                  onChange={(e) => setParentFields({ ...parentFields, initiatorPosition: e.target.value })}
                  placeholder="Должность"
                />
              </div>
            </div>

            {/* Curator */}
            <div className="border rounded-lg p-4 bg-gray-50/50 space-y-3">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <i className="ri-shield-user-line"></i>
                Куратор
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="ФИО"
                  value={parentFields.curatorName}
                  onChange={(e) => setParentFields({ ...parentFields, curatorName: e.target.value })}
                  placeholder="ФИО куратора"
                />
                <Input
                  label="Почта"
                  type="email"
                  value={parentFields.curatorEmail}
                  onChange={(e) => setParentFields({ ...parentFields, curatorEmail: e.target.value })}
                  placeholder="email@example.com"
                />
                <Input
                  label="Должность"
                  value={parentFields.curatorPosition}
                  onChange={(e) => setParentFields({ ...parentFields, curatorPosition: e.target.value })}
                  placeholder="Должность"
                />
              </div>
            </div>

            {/* Acceptance Status */}
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

            {/* Custom Dates */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Пользовательские даты</label>
                <button
                  type="button"
                  onClick={addCustomDate}
                  className="text-sm text-primary-600 hover:text-primary-700 cursor-pointer flex items-center gap-1"
                >
                  <i className="ri-add-line"></i>
                  Добавить дату
                </button>
              </div>
              {customDates.map((cd, index) => (
                <div key={index} className="flex items-end gap-2 mb-2">
                  <div className="flex-1">
                    <Input
                      label={index === 0 ? 'Название' : undefined}
                      value={cd.name}
                      onChange={(e) => {
                        const updated = [...customDates];
                        updated[index].name = e.target.value;
                        setCustomDates(updated);
                      }}
                      placeholder="Например: Дата согласования"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      label={index === 0 ? 'Дата' : undefined}
                      type="date"
                      value={cd.date}
                      onChange={(e) => {
                        const updated = [...customDates];
                        updated[index].date = e.target.value;
                        setCustomDates(updated);
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCustomDate(index)}
                    className="text-red-400 hover:text-red-600 cursor-pointer p-2 mb-0.5"
                  >
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
          value={task.labels}
          onChange={(e) => setTask({ ...task, labels: e.target.value })}
          placeholder="frontend, api, bug (через запятую)"
        />

        {/* Actions */}
        <div className="flex space-x-4 pt-4">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!task.title || (taskType === 'stage' && !task.parentId)}
            className="flex-1"
          >
            Создать задачу
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateTaskModal;
