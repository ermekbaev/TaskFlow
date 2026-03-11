'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/base/Modal';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import UserPicker from '@/components/base/UserPicker';
import MultiUserPicker from '@/components/base/MultiUserPicker';
import TaskTypeSelector from './TaskTypeSelector';
import RecurringFields from './RecurringFields';
import ParentTaskFields from './ParentTaskFields';
import {
  BOARD_COLUMNS,
  PRIORITIES,
  INITIAL_FORM,
  INITIAL_PARENT_FIELDS,
  TaskFormState,
  ParentFieldsState,
  CustomDate,
} from './task-constants';

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

function getChangedFields(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  original: Record<string, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updated: Record<string, any>,
  fields: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const changes: Record<string, any> = {};
  for (const key of fields) {
    const orig = original[key] ?? '';
    const next = updated[key] ?? '';
    if (orig !== next) {
      changes[key] = next || null;
    }
  }
  return changes;
}

function parseJsonField<T>(value: unknown, fallback: T): T {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

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
  const [form, setForm] = useState<TaskFormState>({ ...INITIAL_FORM });
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [recurrencePattern, setRecurrencePattern] = useState('weekly');
  const [recurrenceDays, setRecurrenceDays] = useState<string[]>([]);
  const [parentFields, setParentFields] = useState<ParentFieldsState>({ ...INITIAL_PARENT_FIELDS });
  const [customDates, setCustomDates] = useState<CustomDate[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!task) return;
    setTaskType(task.taskType || 'task');

    const labelsStr = parseJsonField<string[]>(task.labels, []).join(', ');

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extraAssignees = (task.assignees || []).map((a: any) => a.userId || a.user?.id).filter(Boolean);
    setAssigneeIds(extraAssignees);

    setRecurrencePattern(task.recurrencePattern || 'weekly');
    setRecurrenceDays(parseJsonField<string[]>(task.recurrenceDays, []));

    setParentFields({
      initiatorName: task.initiatorName || '',
      initiatorEmail: task.initiatorEmail || '',
      initiatorPosition: task.initiatorPosition || '',
      curatorName: task.curatorName || '',
      curatorEmail: task.curatorEmail || '',
      curatorPosition: task.curatorPosition || '',
      acceptanceStatus: task.acceptanceStatus || '',
    });

    setCustomDates(parseJsonField<CustomDate[]>(task.customDates, []));
  }, [task]);

  const updateForm = (patch: Partial<TaskFormState>) => setForm(prev => ({ ...prev, ...patch }));

  const parentTasks = existingTasks.filter(t => t.taskType === 'parent' && t.id !== task?.id);
  const parentAndStageTasks = existingTasks.filter(t => (t.taskType === 'parent' || t.taskType === 'stage') && t.id !== task?.id);

  const toggleDay = (day: string) => {
    setRecurrenceDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleSave = async () => {
    if (!task) return;
    setSaving(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: Record<string, any> = {};

      // Fields editable by everyone
      const formRecord = form as unknown as Record<string, string>;
      Object.assign(data, getChangedFields(task, formRecord, ['status', 'description']));

      // Manager-only fields
      if (isManager) {
        Object.assign(data, getChangedFields(task, formRecord, [
          'title', 'priority', 'assigneeId', 'dueDate',
          'startDate', 'assignmentDate', 'parentId',
        ]));

        const newExpected = form.expectedHours ? parseFloat(form.expectedHours) : 0;
        if (newExpected !== (task.expectedHours || 0)) data.expectedHours = newExpected;

        data.labels = form.labels.split(',').map(l => l.trim()).filter(l => l);

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

      // actualHours editable by anyone
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

  if (!task) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Редактировать — ${task.key}`} size="xl">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
        <TaskTypeSelector value={taskType} onChange={setTaskType} disabled={!isManager} />

        <Input
          label="Название задачи"
          value={form.title}
          onChange={(e) => updateForm({ title: e.target.value })}
          placeholder="Введите название задачи"
          disabled={!isManager}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
          <textarea
            value={form.description}
            onChange={(e) => updateForm({ description: e.target.value })}
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
              onChange={(e) => updateForm({ status: e.target.value })}
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
              onChange={(e) => updateForm({ priority: e.target.value })}
              disabled={!isManager}
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
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
              {taskType === 'stage' ? 'Заглавная задача' : 'Родительская задача'}
            </label>
            <select
              value={form.parentId}
              onChange={(e) => updateForm({ parentId: e.target.value })}
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
              onChange={(userId) => updateForm({ assigneeId: userId })}
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
            <Input label="Дата назначения" type="date" value={form.assignmentDate} onChange={(e) => updateForm({ assignmentDate: e.target.value })} disabled={!isManager} />
            <Input label="Дата начала" type="date" value={form.startDate} onChange={(e) => updateForm({ startDate: e.target.value })} disabled={!isManager} />
            <Input label="Срок выполнения" type="date" value={form.dueDate} onChange={(e) => updateForm({ dueDate: e.target.value })} disabled={!isManager} />
          </div>
        )}

        {/* Labor costs */}
        <div className="grid grid-cols-2 gap-4">
          <Input label="Ожидаемые трудозатраты (ч)" type="number" value={form.expectedHours} onChange={(e) => updateForm({ expectedHours: e.target.value })} placeholder="0" disabled={!isManager} />
          <Input label="Фактические трудозатраты (ч)" type="number" value={form.actualHours} onChange={(e) => updateForm({ actualHours: e.target.value })} placeholder="0" />
        </div>

        {/* Recurring settings */}
        {taskType === 'recurring' && isManager && (
          <RecurringFields
            recurrencePattern={recurrencePattern}
            onPatternChange={setRecurrencePattern}
            recurrenceDays={recurrenceDays}
            onToggleDay={toggleDay}
            startDate={form.startDate}
            onStartDateChange={(v) => updateForm({ startDate: v })}
            dueDate={form.dueDate}
            onDueDateChange={(v) => updateForm({ dueDate: v })}
          />
        )}

        {/* Parent task fields */}
        {taskType === 'parent' && isManager && (
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
          value={form.labels}
          onChange={(e) => updateForm({ labels: e.target.value })}
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
