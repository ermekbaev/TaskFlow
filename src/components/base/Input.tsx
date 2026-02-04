'use client';

import React from 'react';

interface InputProps {
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'time' | 'datetime-local';
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  name?: string;
  min?: string;
  max?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  type = 'text',
  placeholder,
  value,
  defaultValue,
  onChange,
  disabled = false,
  required = false,
  error,
  className = '',
  name,
  min,
  max,
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-ink mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        disabled={disabled}
        required={required}
        min={min}
        max={max}
        className={`w-full px-4 py-3 border-2 rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-400 placeholder:text-ink-light ${
          error ? 'border-red-300 focus:ring-red-100 focus:border-red-400' : 'border-surface-200 hover:border-surface-300'
        } ${disabled ? 'bg-surface-100 cursor-not-allowed text-ink-light' : 'bg-white'}`}
      />
      {error && <p className="mt-2 text-sm text-red-500 flex items-center"><i className="ri-error-warning-line mr-1"></i>{error}</p>}
    </div>
  );
};

export default Input;
