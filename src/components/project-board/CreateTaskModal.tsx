'use client';

import React, { useState } from 'react';
import Modal from '@/components/base/Modal';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import UserPicker from '@/components/base/UserPicker';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: any) => void;
  projectId: string;
  projectKey: string;
  columns: Array<{ id: string; name: string; order: number }>;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  projectId,
  projectKey,
  columns,
}) => {
  const [task, setTask] = useState({
    title: '',
    description: '',
    status: 'To Do',
    priority: 'P3',
    assigneeId: '',
    labels: '',
    storyPoints: 1,
    dueDate: '',
  });

  const handleSubmit = () => {
    if (!task.title) return;

    onSubmit({
      ...task,
      labels: task.labels.split(',').map(l => l.trim()).filter(l => l),
    });

    setTask({
      title: '',
      description: '',
      status: 'To Do',
      priority: 'P3',
      assigneeId: '',
      labels: '',
      storyPoints: 1,
      dueDate: '',
    });
    onClose();
  };

  const handleClose = () => {
    setTask({
      title: '',
      description: '',
      status: 'To Do',
      priority: 'P3',
      assigneeId: '',
      labels: '',
      storyPoints: 1,
      dueDate: '',
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Создать новую задачу"
      size="lg"
    >
      <div className="space-y-4">
        <Input
          label="Название задачи"
          value={task.title}
          onChange={(e) => setTask({ ...task, title: e.target.value })}
          placeholder="Введите название задачи"
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Описание
          </label>
          <textarea
            value={task.description}
            onChange={(e) => setTask({ ...task, description: e.target.value })}
            placeholder="Описание задачи (поддерживается Markdown)"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Статус
            </label>
            <select
              value={task.status}
              onChange={(e) => setTask({ ...task, status: e.target.value })}
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {columns.map((column) => (
                <option key={column.id} value={column.name}>
                  {column.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Приоритет
            </label>
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

        <UserPicker
          label="Исполнитель"
          value={task.assigneeId}
          onChange={(userId) => setTask({ ...task, assigneeId: userId })}
          placeholder="Поиск пользователя по имени или email..."
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Story Points"
            type="number"
            min="1"
            max="100"
            value={task.storyPoints.toString()}
            onChange={(e) => setTask({ ...task, storyPoints: parseInt(e.target.value) || 1 })}
          />

          <Input
            label="Срок выполнения"
            type="date"
            value={task.dueDate}
            onChange={(e) => setTask({ ...task, dueDate: e.target.value })}
          />
        </div>

        <Input
          label="Метки"
          value={task.labels}
          onChange={(e) => setTask({ ...task, labels: e.target.value })}
          placeholder="frontend, api, bug (через запятую)"
        />

        <div className="flex space-x-4 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!task.title}
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
