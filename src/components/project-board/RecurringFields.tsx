'use client';

import React from 'react';
import Input from '@/components/base/Input';
import { RECURRENCE_OPTIONS, WEEKDAYS } from './task-constants';

interface RecurringFieldsProps {
  recurrencePattern: string;
  onPatternChange: (value: string) => void;
  recurrenceDays: string[];
  onToggleDay: (day: string) => void;
  startDate: string;
  onStartDateChange: (value: string) => void;
  dueDate: string;
  onDueDateChange: (value: string) => void;
  isCallEvent?: boolean;
  onCallEventChange?: (value: boolean) => void;
  callStartTime?: string;
  onCallStartTimeChange?: (value: string) => void;
  callEndTime?: string;
  onCallEndTimeChange?: (value: string) => void;
  showCallEvent?: boolean;
}

const RecurringFields: React.FC<RecurringFieldsProps> = ({
  recurrencePattern,
  onPatternChange,
  recurrenceDays,
  onToggleDay,
  startDate,
  onStartDateChange,
  dueDate,
  onDueDateChange,
  isCallEvent = false,
  onCallEventChange,
  callStartTime = '09:00',
  onCallStartTimeChange,
  callEndTime = '10:00',
  onCallEndTimeChange,
  showCallEvent = false,
}) => {
  return (
    <div className="border rounded-lg p-4 bg-blue-50/50 space-y-4">
      <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <i className="ri-repeat-line"></i>
        Настройки повторения
      </h4>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Частота</label>
        <select
          value={recurrencePattern}
          onChange={(e) => onPatternChange(e.target.value)}
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
                onClick={() => onToggleDay(day.value)}
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
        <Input label="Дата начала" type="date" value={startDate} onChange={(e) => onStartDateChange(e.target.value)} />
        <Input label="Срок выполнения" type="date" value={dueDate} onChange={(e) => onDueDateChange(e.target.value)} />
      </div>

      {showCallEvent && (
        <div className="border rounded-lg p-3 bg-white space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isCallEvent"
              checked={isCallEvent}
              onChange={(e) => onCallEventChange?.(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded cursor-pointer"
            />
            <label htmlFor="isCallEvent" className="text-sm font-medium text-gray-700 flex items-center gap-2 cursor-pointer">
              <i className="ri-phone-line text-primary-600"></i>
              Созвон / Встреча
            </label>
          </div>
          {isCallEvent && (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Начало" type="time" value={callStartTime} onChange={(e) => onCallStartTimeChange?.(e.target.value)} />
              <Input label="Конец" type="time" value={callEndTime} onChange={(e) => onCallEndTimeChange?.(e.target.value)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecurringFields;
