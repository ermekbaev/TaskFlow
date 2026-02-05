'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/feature/Navbar';
import Button from '@/components/base/Button';
import Modal from '@/components/base/Modal';
import Input from '@/components/base/Input';
import PendingApprovals from '@/components/feature/PendingApprovals';
import { useAuth } from '@/contexts/AuthContext';

const AVAILABLE_PERMISSIONS = [
  { key: 'CREATE_PROJECT', label: 'Создание проектов' },
  { key: 'VIEW_ALL_STATS', label: 'Просмотр всей статистики' },
  { key: 'MANAGE_USERS', label: 'Управление пользователями' },
];

const AdminPanel: React.FC = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [creating, setCreating] = useState(false);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'DEV',
  });

  useEffect(() => {
    if (authLoading || !user) return;
    if (user.role !== 'PM') return;

    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data.users || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  if (authLoading || !user) return null;

  if (user.role !== 'PM') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-surface-50 to-surface-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-error-warning-line text-red-600 text-3xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-charcoal mb-2">Доступ запрещен</h1>
          <p className="text-charcoal-light mb-6">У вас нет прав для доступа к административной панели</p>
          <Button onClick={() => router.push('/projects')}>Вернуться к проектам</Button>
        </div>
      </div>
    );
  }

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) return;
    setCreating(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      if (res.ok) {
        const data = await res.json();
        setUsers([...users, data.user]);
        setNewUser({ name: '', email: '', password: '', role: 'DEV' });
        setShowCreateUser(false);
      }
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleTogglePermission = async (userId: string, permission: string, hasIt: boolean) => {
    try {
      if (hasIt) {
        await fetch(`/api/users/${userId}/permissions`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permission }),
        });
      } else {
        await fetch(`/api/users/${userId}/permissions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permission }),
        });
      }

      // Refresh users
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        // Update selected user
        if (selectedUser) {
          setSelectedUser(data.users.find((u: any) => u.id === selectedUser.id));
        }
      }
    } catch (error) {
      console.error('Error toggling permission:', error);
    }
  };

  const roleLabels: Record<string, string> = {
    PM: 'PM',
    DEV: 'Разработчик',
  };

  const roleColors: Record<string, string> = {
    PM: 'bg-amber-100 text-amber-700',
    DEV: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-surface-100">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-ink to-primary-600 bg-clip-text text-transparent">Администрирование</h1>
            <p className="text-ink-muted mt-2">Управление пользователями и правами</p>
          </div>

          <Button onClick={() => setShowCreateUser(true)}>
            <i className="ri-user-add-line mr-2"></i>
            Создать пользователя
          </Button>
        </div>

        {/* Pending Approvals */}
        <div className="mb-8">
          <PendingApprovals />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Пользователи системы</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Пользователь</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Роль</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Права</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата создания</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium">{u.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{u.name}</div>
                              <div className="text-sm text-gray-500">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[u.role] || 'bg-gray-100 text-gray-700'}`}>
                            {roleLabels[u.role] || u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {u.isActive ? 'Активен' : 'Неактивен'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {(u.permissions || []).map((p: string) => (
                              <span key={p} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                {p}
                              </span>
                            ))}
                            {(!u.permissions || u.permissions.length === 0) && (
                              <span className="text-xs text-gray-400">Нет</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(u.createdAt).toLocaleDateString('ru-RU')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setShowPermissions(true);
                            }}
                            className="text-purple-600 hover:text-purple-900 cursor-pointer mr-3"
                            title="Управление правами"
                          >
                            <i className="ri-shield-keyhole-line"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i className="ri-user-line text-blue-600"></i>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Всего пользователей</p>
                    <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <i className="ri-check-line text-emerald-600"></i>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Активных</p>
                    <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.isActive).length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <i className="ri-admin-line text-amber-600"></i>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Менеджеров</p>
                    <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.role === 'PM').length}</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create User Modal */}
      <Modal isOpen={showCreateUser} onClose={() => setShowCreateUser(false)} title="Создать нового пользователя" size="md">
        <div className="space-y-4">
          <Input
            label="Имя пользователя"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            placeholder="Введите имя"
            required
          />
          <Input
            label="Email"
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            placeholder="Введите email"
            required
          />
          <Input
            label="Пароль"
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            placeholder="Введите пароль"
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="DEV">Разработчик</option>
              <option value="PM">PM</option>
            </select>
          </div>

          <div className="flex space-x-4 pt-4">
            <Button variant="outline" onClick={() => setShowCreateUser(false)} className="flex-1">Отмена</Button>
            <Button onClick={handleCreateUser} disabled={!newUser.name || !newUser.email || !newUser.password || creating} className="flex-1">
              {creating ? 'Создание...' : 'Создать'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Permissions Modal */}
      <Modal isOpen={showPermissions} onClose={() => { setShowPermissions(false); setSelectedUser(null); }} title={`Права: ${selectedUser?.name}`} size="md">
        {selectedUser && (
          <div className="space-y-4">
            <p className="text-sm text-ink-muted">
              Управление гранулярными правами пользователя <strong>{selectedUser.name}</strong> ({selectedUser.role === 'PM' ? 'PM' : 'Разработчик'})
            </p>

            <div className="space-y-3">
              {AVAILABLE_PERMISSIONS.map(perm => {
                const hasPerm = (selectedUser.permissions || []).includes(perm.key);
                return (
                  <div key={perm.key} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
                    <div>
                      <p className="font-medium text-ink text-sm">{perm.label}</p>
                      <p className="text-xs text-ink-muted">{perm.key}</p>
                    </div>
                    <button
                      onClick={() => handleTogglePermission(selectedUser.id, perm.key, hasPerm)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        hasPerm ? 'bg-primary-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          hasPerm ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => { setShowPermissions(false); setSelectedUser(null); }}>
                Закрыть
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminPanel;
