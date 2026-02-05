'use client';

import React, { useState, useEffect, useRef } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserPickerProps {
  value: string;
  onChange: (userId: string) => void;
  excludeIds?: string[];
  label?: string;
  placeholder?: string;
}

const UserPicker: React.FC<UserPickerProps> = ({
  value,
  onChange,
  excludeIds = [],
  label,
  placeholder = 'Поиск по имени или email...',
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

  const selectedUser = users.find(u => u.id === value);

  const filtered = users.filter(u => {
    if (excludeIds.includes(u.id)) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const handleSelect = (userId: string) => {
    onChange(userId);
    setSearch('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}

      {selectedUser && !isOpen ? (
        <div
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm flex items-center justify-between cursor-pointer hover:border-primary-400 transition-colors"
          onClick={() => setIsOpen(true)}
        >
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-medium">{selectedUser.name.charAt(0)}</span>
            </div>
            <span className="text-gray-900">{selectedUser.name}</span>
            <span className="text-gray-400">({selectedUser.email})</span>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleClear(); }}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <i className="ri-close-line"></i>
          </button>
        </div>
      ) : (
        <div>
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
        </div>
      )}

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
              Загрузка...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-3 text-center text-sm text-gray-500">
              {search ? 'Пользователи не найдены' : 'Нет доступных пользователей'}
            </div>
          ) : (
            filtered.map(user => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleSelect(user.id)}
                className={`w-full text-left px-3 py-2 flex items-center space-x-2 hover:bg-primary-50 transition-colors cursor-pointer ${
                  user.id === value ? 'bg-primary-50' : ''
                }`}
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

export default UserPicker;
