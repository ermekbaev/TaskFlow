'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import Modal from '@/components/base/Modal';
import Input from '@/components/base/Input';
import Button from '@/components/base/Button';
import FileUpload from '@/components/base/FileUpload';

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
  reminderTime?: string;
  reminderSent?: boolean;
  attachments?: Array<{
    id: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    category: string;
    createdAt: string;
  }>;
}

interface EventViewEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  onUpdate: (eventId: string, updates: Partial<CalendarEvent>) => void;
  onDelete: (eventId: string) => void;
}

const EventViewEditModal: React.FC<EventViewEditModalProps> = ({
  isOpen,
  onClose,
  event,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<CalendarEvent>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [eventAttachments, setEventAttachments] = useState<any[]>([]);

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        startTime: event.startTime,
        endTime: event.endTime,
        color: event.color,
        type: event.type,
        reminderTime: event.reminderTime,
      });
      setEventAttachments(event.attachments || []);
      setIsEditing(false);
    }
  }, [event]);

  if (!event) return null;

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  const handleSubmit = async () => {
    await onUpdate(event.id, formData);
    setIsEditing(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Редактировать событие' : event.title} size="md">
      {!isEditing ? (
        // View Mode
        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${event.color || 'bg-primary-100 text-primary-700'}`}>
            <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
            {event.description && <p className="text-sm opacity-90">{event.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-ink-muted">Дата начала</label>
              <p className="text-ink mt-1">{format(new Date(event.startDate), 'd MMMM yyyy', { locale: ru })}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-muted">Дата окончания</label>
              <p className="text-ink mt-1">{format(new Date(event.endDate), 'd MMMM yyyy', { locale: ru })}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-muted">Время начала</label>
              <p className="text-ink mt-1">{formatTime(event.startTime)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-muted">Время окончания</label>
              <p className="text-ink mt-1">{formatTime(event.endTime)}</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-ink-muted">Тип</label>
            <p className="text-ink mt-1 capitalize">{event.type}</p>
          </div>

          {event.reminderTime && (
            <div>
              <label className="text-sm font-medium text-ink-muted">Напоминание</label>
              <p className="text-ink mt-1">
                За {event.reminderTime === '1440' ? '1 день' : `${event.reminderTime} мин`}
              </p>
            </div>
          )}

          <div className="border-t border-surface-200 pt-4">
            <FileUpload
              calendarEventId={event.id}
              category="event"
              attachments={eventAttachments}
              onUpload={(attachment) => {
                setEventAttachments([...eventAttachments, attachment]);
              }}
              onDelete={(id) => {
                setEventAttachments(eventAttachments.filter(a => a.id !== id));
              }}
              label="Вложения"
            />
          </div>

          <div className="flex space-x-3 pt-4 border-t border-surface-200">
            <Button variant="outline" onClick={() => setIsEditing(true)} className="flex-1">
              <i className="ri-edit-line mr-2"></i>
              Редактировать
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (confirm('Удалить это событие?')) {
                  onDelete(event.id);
                  onClose();
                }
              }}
              className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
            >
              <i className="ri-delete-bin-line mr-2"></i>
              Удалить
            </Button>
          </div>
        </div>
      ) : (
        // Edit Mode
        <div className="space-y-4">
          <Input
            label="Название события"
            value={formData.title || ''}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
            <textarea
              value={formData.description || ''}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Дата начала"
              type="date"
              value={formData.startDate || ''}
              onChange={e => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
            <Input
              label="Дата окончания"
              type="date"
              value={formData.endDate || ''}
              onChange={e => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Время начала"
              type="time"
              value={formData.startTime || ''}
              onChange={e => setFormData({ ...formData, startTime: e.target.value })}
              required
            />
            <Input
              label="Время окончания"
              type="time"
              value={formData.endTime || ''}
              onChange={e => setFormData({ ...formData, endTime: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Тип события</label>
            <select
              value={formData.type || 'personal'}
              onChange={e => setFormData({ ...formData, type: e.target.value as 'task' | 'meeting' | 'reminder' | 'personal' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="meeting">Встреча</option>
              <option value="deadline">Дедлайн</option>
              <option value="reminder">Напоминание</option>
              <option value="personal">Личное</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Напоминание</label>
            <select
              value={formData.reminderTime || ''}
              onChange={e => setFormData({ ...formData, reminderTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Без напоминания</option>
              <option value="5">За 5 минут</option>
              <option value="15">За 15 минут</option>
              <option value="30">За 30 минут</option>
              <option value="60">За 1 час</option>
              <option value="1440">За 1 день</option>
            </select>
          </div>

          <div className="border-t border-surface-200 pt-4">
            <FileUpload
              calendarEventId={event.id}
              category="event"
              attachments={eventAttachments}
              onUpload={(attachment) => {
                setEventAttachments([...eventAttachments, attachment]);
              }}
              onDelete={(id) => {
                setEventAttachments(eventAttachments.filter(a => a.id !== id));
              }}
              label="Вложения"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
              Отмена
            </Button>
            <Button onClick={handleSubmit} className="flex-1">
              Сохранить
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default EventViewEditModal;
