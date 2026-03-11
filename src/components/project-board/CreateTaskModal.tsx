'use client';

import React, { useState } from 'react';
import Modal from '@/components/base/Modal';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import UserPicker from '@/components/base/UserPicker';
import MultiUserPicker from '@/components/base/MultiUserPicker';
import TaskTypeSelector from './TaskTypeSelector';
import RecurringFields from './RecurringFields';
import ParentTaskFields from './ParentTaskFields';
import {
  PRIORITIES,
  INITIAL_FORM,
  INITIAL_PARENT_FIELDS,
  TaskFormState,
  ParentFieldsState,
  CustomDate,
} from './task-constants';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (task: any) => void;
  projectId: string;
  projectKey: string;
  columns: Array<{ id: string; name: string; order: number }>;
  existingTasks?: Array<{ id: string; key: string; title: string; taskType: string }>;
}

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
  const [task, setTask] = useState<TaskFormState>({ ...INITIAL_FORM });
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [recurrencePattern, setRecurrencePattern] = useState('weekly');
  const [recurrenceDays, setRecurrenceDays] = useState<string[]>([]);
  const [isCallEvent, setIsCallEvent] = useState(false);
  const [callStartTime, setCallStartTime] = useState('09:00');
  const [callEndTime, setCallEndTime] = useState('10:00');
  const [parentFields, setParentFields] = useState<ParentFieldsState>({ ...INITIAL_PARENT_FIELDS });
  const [customDates, setCustomDates] = useState<CustomDate[]>([]);

  const parentTasks = existingTasks.filter(t => t.taskType === 'parent');
  const parentAndStageTasks = existingTasks.filter(t => t.taskType === 'parent' || t.taskType === 'stage');

  const updateTask = (patch: Partial<TaskFormState>) => setTask(prev => ({ ...prev, ...patch }));

  const toggleDay = (day: string) => {
    setRecurrenceDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const resetForm = () => {
    setTaskType('task');
    setTask({ ...INITIAL_FORM });
    setAssigneeIds([]);
    setRecurrencePattern('weekly');
    setRecurrenceDays([]);
    setIsCallEvent(false);
    setCallStartTime('09:00');
    setCallEndTime('10:00');
    setParentFields({ ...INITIAL_PARENT_FIELDS });
    setCustomDates([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    if (!task.title) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      taskData.isCallEvent = isCallEvent;
      if (isCallEvent) {
        taskData.callStartTime = callStartTime;
        taskData.callEndTime = callEndTime;
      }
    }

    if (taskType === 'parent') {
      Object.assign(taskData, parentFields);
      taskData.customDates = customDates.filter(d => d.name && d.date);
    }

    onSubmit(taskData);
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Создать новую задачу" size="xl">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
        <TaskTypeSelector value={taskType} onChange={setTaskType} />

        <Input
          label="Название задачи"
          value={task.title}
          onChange={(e) => updateTask({ title: e.target.value })}
          placeholder="Введите название задачи"
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {taskType === 'parent' ? 'Описание функционала' : 'Описание'}
          </label>
          <textarea
            value={task.description}
            onChange={(e) => updateTask({ description: e.target.value })}
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
              onChange={(e) => updateTask({ status: e.target.value })}
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
              onChange={(e) => updateTask({ priority: e.target.value })}
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Parent task selector */}
        {(taskType === 'stage' || taskType === 'task') && parentAndStageTasks.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {taskType === 'stage' ? 'Заглавная задача (опционально)' : 'Родительская задача (опционально)'}
            </label>
            <select
              value={task.parentId}
              onChange={(e) => updateTask({ parentId: e.target.value })}
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Без привязки</option>
              {(taskType === 'stage' ? parentTasks : parentAndStageTasks).map((t) => (
                <option key={t.id} value={t.id}>{t.key} - {t.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* Parent task selector for recurring tasks */}
        {taskType === 'recurring' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Родительская задача (опционально)
            </label>
            <select
              value={task.parentId}
              onChange={(e) => updateTask({ parentId: e.target.value })}
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Без привязки</option>
              {existingTasks.map((t) => (
                <option key={t.id} value={t.id}>{t.key} - {t.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* Assignees */}
        <UserPicker
          label="Основной исполнитель"
          value={task.assigneeId}
          onChange={(userId) => updateTask({ assigneeId: userId })}
          placeholder="Поиск пользователя по имени или email..."
          projectId={projectId}
        />
        <MultiUserPicker
          label="Дополнительные исполнители"
          value={assigneeIds}
          onChange={setAssigneeIds}
          excludeIds={task.assigneeId ? [task.assigneeId] : []}
          placeholder="Добавить исполнителей..."
          projectId={projectId}
        />

        {/* Dates */}
        {taskType !== 'recurring' && (
          <div className="grid grid-cols-3 gap-4">
            <Input label="Дата назначения" type="date" value={task.assignmentDate} onChange={(e) => updateTask({ assignmentDate: e.target.value })} />
            <Input label="Дата начала" type="date" value={task.startDate} onChange={(e) => updateTask({ startDate: e.target.value })} />
            <Input label="Срок выполнения" type="date" value={task.dueDate} onChange={(e) => updateTask({ dueDate: e.target.value })} />
          </div>
        )}

        {/* Labor costs */}
        <div className="grid grid-cols-2 gap-4">
          <Input label="Ожидаемые трудозатраты (ч)" type="number" value={task.expectedHours} onChange={(e) => updateTask({ expectedHours: e.target.value })} placeholder="0" />
          <Input label="Фактические трудозатраты (ч)" type="number" value={task.actualHours} onChange={(e) => updateTask({ actualHours: e.target.value })} placeholder="0" />
        </div>

        {/* Recurring settings */}
        {taskType === 'recurring' && (
          <RecurringFields
            recurrencePattern={recurrencePattern}
            onPatternChange={setRecurrencePattern}
            recurrenceDays={recurrenceDays}
            onToggleDay={toggleDay}
            startDate={task.startDate}
            onStartDateChange={(v) => updateTask({ startDate: v })}
            dueDate={task.dueDate}
            onDueDateChange={(v) => updateTask({ dueDate: v })}
            showCallEvent
            isCallEvent={isCallEvent}
            onCallEventChange={setIsCallEvent}
            callStartTime={callStartTime}
            onCallStartTimeChange={setCallStartTime}
            callEndTime={callEndTime}
            onCallEndTimeChange={setCallEndTime}
          />
        )}

        {/* Parent task fields */}
        {taskType === 'parent' && (
          <ParentTaskFields
            parentFields={parentFields}
            onFieldChange={(field, value) => setParentFields(prev => ({ ...prev, [field]: value }))}
            customDates={customDates}
            onCustomDatesChange={setCustomDates}
          />
        )}

        {/* Labels */}
        <Input
          label="Метки"
          value={task.labels}
          onChange={(e) => updateTask({ labels: e.target.value })}
          placeholder="frontend, api, bug (через запятую)"
        />

        {/* Actions */}
        <div className="flex space-x-4 pt-4">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!task.title} className="flex-1">
            Создать задачу
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateTaskModal;
