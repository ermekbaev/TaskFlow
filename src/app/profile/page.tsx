'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/feature/Navbar';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import { useAuth } from '@/contexts/AuthContext';

export default function Profile() {
  const { user: currentUser, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.name || '',
        email: currentUser.email || ''
      }));
    }
  }, [currentUser]);

  const [notifications, setNotifications] = useState({
    taskAssigned: true,
    projectUpdates: true,
    mentions: true,
    emailNotifications: false
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleNotificationChange = (key: string) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  const validateProfileForm = () => {
    const newErrors: {[key: string]: string} = {};
    if (!formData.name.trim()) newErrors.name = 'Имя пользователя обязательно';
    if (!formData.email.trim()) newErrors.email = 'Email обязателен';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors: {[key: string]: string} = {};
    if (!formData.currentPassword) newErrors.currentPassword = 'Введите текущий пароль';
    if (!formData.newPassword) newErrors.newPassword = 'Введите новый пароль';
    else if (formData.newPassword.length < 6) newErrors.newPassword = 'Минимум 6 символов';
    if (formData.newPassword !== formData.confirmPassword) newErrors.confirmPassword = 'Пароли не совпадают';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfileForm()) return;
    setSaveStatus('saving');
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;
    setPasswordStatus('saving');
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      setPasswordStatus('success');
      setTimeout(() => setPasswordStatus('idle'), 3000);
    } catch {
      setPasswordStatus('error');
      setTimeout(() => setPasswordStatus('idle'), 3000);
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'MANAGER': return 'Менеджер';
      case 'USER': return 'Пользователь';
      default: return role;
    }
  };

  if (authLoading || !currentUser) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-surface-100">
      <Navbar />

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-soft border border-surface-200">
            <div className="px-8 py-6 border-b border-surface-200">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-ink to-primary-600 bg-clip-text text-transparent">Профиль пользователя</h1>
              <p className="text-ink-muted mt-2">Управление настройками аккаунта - {currentUser.name}</p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-ink mb-4">Основная информация</h2>

                      {saveStatus === 'success' && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center">
                            <i className="ri-check-circle-line text-green-600 text-lg mr-2"></i>
                            <span className="text-green-800 font-medium">Профиль успешно обновлен!</span>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-ink mb-2">Имя</label>
                          <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="Введите имя" />
                          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-ink mb-2">Email</label>
                          <Input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="Email" />
                          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-ink mb-2">Роль</label>
                          <div className="px-4 py-3 bg-surface-100 rounded-xl text-ink">{getRoleText(currentUser.role)}</div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-ink mb-2">ID</label>
                          <div className="px-4 py-3 bg-surface-100 rounded-xl text-ink-muted text-sm font-mono">#{currentUser.id}</div>
                        </div>
                      </div>

                      {/* Permissions */}
                      {currentUser.permissions && currentUser.permissions.length > 0 && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-ink mb-2">Дополнительные права</label>
                          <div className="flex flex-wrap gap-2">
                            {currentUser.permissions.map((p: string) => (
                              <span key={p} className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">{p}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-6">
                        <Button onClick={handleSaveProfile} disabled={saveStatus === 'saving'}>
                          {saveStatus === 'saving' ? 'Сохранение...' : 'Сохранить изменения'}
                        </Button>
                      </div>
                    </div>

                    <div className="border-t border-surface-200 pt-6">
                      <h2 className="text-lg font-semibold text-ink mb-4">Смена пароля</h2>

                      {passwordStatus === 'success' && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center">
                            <i className="ri-check-circle-line text-green-600 text-lg mr-2"></i>
                            <span className="text-green-800 font-medium">Пароль успешно изменен!</span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-ink mb-2">Текущий пароль</label>
                          <Input name="currentPassword" type="password" value={formData.currentPassword} onChange={handleInputChange} placeholder="Текущий пароль" />
                          {errors.currentPassword && <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-ink mb-2">Новый пароль</label>
                            <Input name="newPassword" type="password" value={formData.newPassword} onChange={handleInputChange} placeholder="Минимум 6 символов" />
                            {errors.newPassword && <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-ink mb-2">Подтверждение</label>
                            <Input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} placeholder="Повторите пароль" />
                            {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                          </div>
                        </div>
                        <Button onClick={handleChangePassword} variant="secondary" disabled={passwordStatus === 'saving'}>
                          {passwordStatus === 'saving' ? 'Изменение...' : 'Изменить пароль'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-ink mb-4">Уведомления</h2>
                  <div className="bg-surface-50 rounded-xl p-4 space-y-4 border border-surface-200">
                    {Object.entries(notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <label className="text-sm text-ink">
                          {key === 'taskAssigned' && 'Назначение задач'}
                          {key === 'projectUpdates' && 'Обновления проектов'}
                          {key === 'mentions' && 'Упоминания'}
                          {key === 'emailNotifications' && 'Email уведомления'}
                        </label>
                        <button
                          onClick={() => handleNotificationChange(key)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                            value ? 'bg-primary-500' : 'bg-surface-300'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            value ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
