'use client';

import React from 'react';
import Input from '@/components/base/Input';
import { ACCEPTANCE_STATUSES, ParentFieldsState, CustomDate } from './task-constants';

interface ParentTaskFieldsProps {
  parentFields: ParentFieldsState;
  onFieldChange: (field: keyof ParentFieldsState, value: string) => void;
  customDates: CustomDate[];
  onCustomDatesChange: (dates: CustomDate[]) => void;
}

const ParentTaskFields: React.FC<ParentTaskFieldsProps> = ({
  parentFields,
  onFieldChange,
  customDates,
  onCustomDatesChange,
}) => {
  const addCustomDate = () => onCustomDatesChange([...customDates, { name: '', date: '' }]);
  const removeCustomDate = (i: number) => onCustomDatesChange(customDates.filter((_, idx) => idx !== i));
  const updateCustomDate = (index: number, field: keyof CustomDate, value: string) => {
    const updated = [...customDates];
    updated[index] = { ...updated[index], [field]: value };
    onCustomDatesChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Initiator */}
      <div className="border rounded-lg p-4 bg-gray-50/50 space-y-3">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <i className="ri-user-star-line"></i> Инициатор
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <Input label="ФИО" value={parentFields.initiatorName} onChange={(e) => onFieldChange('initiatorName', e.target.value)} placeholder="ФИО инициатора" />
          <Input label="Почта" type="email" value={parentFields.initiatorEmail} onChange={(e) => onFieldChange('initiatorEmail', e.target.value)} placeholder="email@example.com" />
          <Input label="Должность" value={parentFields.initiatorPosition} onChange={(e) => onFieldChange('initiatorPosition', e.target.value)} placeholder="Должность" />
        </div>
      </div>

      {/* Curator */}
      <div className="border rounded-lg p-4 bg-gray-50/50 space-y-3">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <i className="ri-shield-user-line"></i> Куратор
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <Input label="ФИО" value={parentFields.curatorName} onChange={(e) => onFieldChange('curatorName', e.target.value)} placeholder="ФИО куратора" />
          <Input label="Почта" type="email" value={parentFields.curatorEmail} onChange={(e) => onFieldChange('curatorEmail', e.target.value)} placeholder="email@example.com" />
          <Input label="Должность" value={parentFields.curatorPosition} onChange={(e) => onFieldChange('curatorPosition', e.target.value)} placeholder="Должность" />
        </div>
      </div>

      {/* Acceptance Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Статус приёмки</label>
        <select
          value={parentFields.acceptanceStatus}
          onChange={(e) => onFieldChange('acceptanceStatus', e.target.value)}
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
                onChange={(e) => updateCustomDate(index, 'name', e.target.value)}
                placeholder="Например: Дата согласования"
              />
            </div>
            <div className="flex-1">
              <Input
                label={index === 0 ? 'Дата' : undefined}
                type="date"
                value={cd.date}
                onChange={(e) => updateCustomDate(index, 'date', e.target.value)}
              />
            </div>
            <button type="button" onClick={() => removeCustomDate(index)} className="text-red-400 hover:text-red-600 cursor-pointer p-2 mb-0.5">
              <i className="ri-close-line"></i>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParentTaskFields;
