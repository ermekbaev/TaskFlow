'use client';

import { useState } from 'react';
import Navbar from '@/components/feature/Navbar';
import { useAuth } from '@/contexts/AuthContext';

export default function Settings() {
  const { user: currentUser, loading: authLoading } = useAuth();

  const [notifications, setNotifications] = useState({
    taskAssigned: true,
    projectUpdates: true,
    mentions: true,
    deadlineReminders: true,
    emailNotifications: false,
  });

  const [appearance, setAppearance] = useState({
    theme: 'light',
    language: 'ru',
    compactMode: false,
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  const handleNotificationChange = (key: string) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    await new Promise(resolve => setTimeout(resolve, 500));
    setSaveStatus('success');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  if (authLoading || !currentUser) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-surface-100">
      <Navbar />

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-ink to-primary-600 bg-clip-text text-transparent">
              Настройки
            </h1>
            <p className="text-ink-muted mt-2">Управление настройками приложения</p>
          </div>

          {saveStatus === 'success' && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center">
                <i className="ri-check-circle-line text-green-600 text-lg mr-2"></i>
                <span className="text-green-800 font-medium">Настройки сохранены!</span>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Notifications */}
            <div className="bg-white rounded-2xl shadow-soft border border-surface-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                  <i className="ri-notification-3-line text-primary-600 text-lg"></i>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-ink">Уведомления</h2>
                  <p className="text-sm text-ink-muted">Настройте, какие уведомления вы хотите получать</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'taskAssigned', label: 'Назначение задач', desc: 'Уведомлять при назначении новой задачи' },
                  { key: 'projectUpdates', label: 'Обновления проектов', desc: 'Уведомлять об изменениях в проектах' },
                  { key: 'mentions', label: 'Упоминания', desc: 'Уведомлять при упоминании в комментариях' },
                  { key: 'deadlineReminders', label: 'Напоминания о сроках', desc: 'Уведомлять о приближении дедлайнов' },
                  { key: 'emailNotifications', label: 'Email уведомления', desc: 'Дублировать уведомления на email' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-3 border-b border-surface-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-ink">{item.label}</p>
                      <p className="text-xs text-ink-muted mt-0.5">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => handleNotificationChange(item.key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        notifications[item.key as keyof typeof notifications]
                          ? 'bg-primary-500'
                          : 'bg-surface-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifications[item.key as keyof typeof notifications]
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Appearance */}
            <div className="bg-white rounded-2xl shadow-soft border border-surface-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                  <i className="ri-palette-line text-sky-600 text-lg"></i>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-ink">Внешний вид</h2>
                  <p className="text-sm text-ink-muted">Настройте отображение интерфейса</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-surface-100">
                  <div>
                    <p className="text-sm font-medium text-ink">Тема</p>
                    <p className="text-xs text-ink-muted mt-0.5">Выберите тему оформления</p>
                  </div>
                  <select
                    value={appearance.theme}
                    onChange={e => setAppearance(prev => ({ ...prev, theme: e.target.value }))}
                    className="px-4 py-2 border-2 border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-400 transition-all"
                  >
                    <option value="light">Светлая</option>
                    <option value="dark">Тёмная</option>
                    <option value="system">Системная</option>
                  </select>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-surface-100">
                  <div>
                    <p className="text-sm font-medium text-ink">Язык</p>
                    <p className="text-xs text-ink-muted mt-0.5">Выберите язык интерфейса</p>
                  </div>
                  <select
                    value={appearance.language}
                    onChange={e => setAppearance(prev => ({ ...prev, language: e.target.value }))}
                    className="px-4 py-2 border-2 border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-400 transition-all"
                  >
                    <option value="ru">Русский</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-ink">Компактный режим</p>
                    <p className="text-xs text-ink-muted mt-0.5">Уменьшает отступы для отображения большего количества данных</p>
                  </div>
                  <button
                    onClick={() => setAppearance(prev => ({ ...prev, compactMode: !prev.compactMode }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      appearance.compactMode ? 'bg-primary-500' : 'bg-surface-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        appearance.compactMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="bg-white rounded-2xl shadow-soft border border-surface-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <i className="ri-information-line text-emerald-600 text-lg"></i>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-ink">О приложении</h2>
                  <p className="text-sm text-ink-muted">Информация о TaskFlow</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-50 rounded-xl p-4 border border-surface-200">
                  <p className="text-xs text-ink-muted mb-1">Версия</p>
                  <p className="text-sm font-semibold text-ink">2.0.0</p>
                </div>
                <div className="bg-surface-50 rounded-xl p-4 border border-surface-200">
                  <p className="text-xs text-ink-muted mb-1">Последнее обновление</p>
                  <p className="text-sm font-semibold text-ink">Февраль 2026</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-xl shadow-soft transition-all disabled:opacity-50 cursor-pointer"
              >
                {saveStatus === 'saving' ? 'Сохранение...' : 'Сохранить настройки'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
