'use client';

import React, { useState, useEffect, useRef } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface MultiUserPickerProps {
  value: string[];
  onChange: (userIds: string[]) => void;
  excludeIds?: string[];
  label?: string;
  placeholder?: string;
}

const MultiUserPicker: React.FC<MultiUserPickerProps> = ({
  value,
  onChange,
  excludeIds = [],
  label,
  placeholder = 'Поиск пользователей...',
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data.users || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedUsers = users.filter(u => value.includes(u.id));

  const filtered = users.filter(u => {
    if (excludeIds.includes(u.id)) return false;
    if (value.includes(u.id)) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const handleSelect = (userId: string) => {
    onChange([...value, userId]);
    setSearch('');
  };

  const handleRemove = (userId: string) => {
    onChange(value.filter(id => id !== userId));
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}

      {/* Selected users chips */}
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {selectedUsers.map(user => (
          <span
            key={user.id}
            className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium"
          >
            <span className="w-4 h-4 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[8px] font-medium">{user.name.charAt(0)}</span>
            </span>
            {user.name}
            <button
              type="button"
              onClick={() => handleRemove(user.id)}
              className="text-primary-400 hover:text-primary-700 cursor-pointer ml-0.5"
            >
              <i className="ri-close-line text-xs"></i>
            </button>
          </span>
        ))}
      </div>

      {/* Search input */}
      <div className="relative">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
              Загрузка...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-3 text-center text-sm text-gray-500">
              {search ? 'Пользователи не найдены' : 'Все пользователи выбраны'}
            </div>
          ) : (
            filtered.map(user => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleSelect(user.id)}
                className="w-full text-left px-3 py-2 flex items-center space-x-2 hover:bg-primary-50 transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-medium">{user.name.charAt(0)}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MultiUserPicker;
