'use client';

import React from 'react';
import { TASK_TYPES } from './task-constants';

interface TaskTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const TaskTypeSelector: React.FC<TaskTypeSelectorProps> = ({ value, onChange, disabled = false }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Тип задачи</label>
      <div className="grid grid-cols-4 gap-2">
        {TASK_TYPES.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => !disabled && onChange(type.value)}
            disabled={disabled}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            } ${
              value === type.value
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
  );
};

export default TaskTypeSelector;
