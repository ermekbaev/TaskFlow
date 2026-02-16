'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  time: string;
  read: boolean;
  details?: string;
  actionUrl?: string;
}

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'только что';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return d.toLocaleDateString('ru-RU');
};

const Navbar: React.FC = () => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [invitationCount, setInvitationCount] = useState(0);

  const menuItems = [
    { icon: 'ri-dashboard-3-line', label: 'Главная', path: '/dashboard' },
    { icon: 'ri-folder-line', label: 'Проекты', path: '/projects' },
    { icon: 'ri-task-line', label: 'Задачи', path: '/tasks' },
    { icon: 'ri-bar-chart-horizontal-line', label: 'Гант', path: '/gantt' },
    { icon: 'ri-calendar-line', label: 'Календарь', path: '/calendar' },
    { icon: 'ri-user-line', label: 'Профиль', path: '/profile' },
    { icon: 'ri-settings-line', label: 'Настройки', path: '/settings' },
  ];

  const [showNotifications, setShowNotifications] = useState(false);
  const [showNotificationDetail, setShowNotificationDetail] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch pending reassign requests count for PM
  useEffect(() => {
    if (user?.role === 'PM') {
      fetch('/api/reassign-requests')
        .then(res => res.ok ? res.json() : { requests: [] })
        .then(data => setPendingCount(data.requests?.length || 0))
        .catch(() => setPendingCount(0));
    }
  }, [user?.role]);

  // Fetch pending invitations count
  useEffect(() => {
    if (!user) return;
    const fetchInvitations = () => {
      fetch('/api/invitations')
        .then(res => res.ok ? res.json() : { invitations: [] })
        .then(data => setInvitationCount(data.invitations?.length || 0))
        .catch(() => setInvitationCount(0));
    };
    fetchInvitations();
    const interval = setInterval(fetchInvitations, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Fetch notifications from DB
  useEffect(() => {
    if (!user) return;
    const fetchNotifications = () => {
      fetch('/api/notifications')
        .then(res => res.ok ? res.json() : { notifications: [] })
        .then(data => {
          const mapped = (data.notifications || []).map((n: any) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type || 'info',
            time: formatTime(n.createdAt),
            read: n.read,
            actionUrl: n.actionUrl,
          }));
          setNotifications(mapped);
        })
        .catch(() => setNotifications([]));
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => (n.id === id ? { ...n, read: true } : n)));
    fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'markRead', id }),
    }).catch(console.error);
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'markAllRead' }),
    }).catch(console.error);
  };

  const handleNotificationIconClick = (e: React.MouseEvent, notification: Notification) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedNotification(notification);
    setShowNotificationDetail(true);
    markAsRead(notification.id);
  };

  const handleNotificationAction = () => {
    if (selectedNotification?.actionUrl) {
      router.push(selectedNotification.actionUrl);
      setShowNotificationDetail(false);
      setShowNotifications(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return 'ri-check-circle-line text-green-500';
      case 'warning': return 'ri-alert-line text-yellow-500';
      case 'error': return 'ri-error-warning-line text-red-500';
      default: return 'ri-information-line text-primary-500';
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'success': return 'Успех';
      case 'warning': return 'Внимание';
      case 'error': return 'Ошибка';
      default: return 'Информация';
    }
  };

  if (!user) return null;

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-surface-200 sticky top-0 z-50 shadow-soft">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-4 xl:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 xl:space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg sm:rounded-xl flex items-center justify-center shadow-soft flex-shrink-0">
                <i className="ri-dashboard-line text-white text-base sm:text-lg"></i>
              </div>
              <span className="hidden sm:inline xl:inline text-base xl:text-xl font-bold bg-gradient-to-r from-ink to-primary-600 bg-clip-text text-transparent whitespace-nowrap">TaskFlow</span>
            </Link>

            {/* Desktop & Tablet Navigation with horizontal scroll */}
            <div className="hidden md:flex items-center overflow-x-auto scrollbar-hide max-w-[40vw] xl:max-w-none">
              <div className="flex items-center space-x-1.5 xl:space-x-4">
                {menuItems.slice(0, 5).map((item) => (
                  <Link
                    key={item.path + item.label}
                    href={item.path}
                    className={`flex items-center justify-center xl:justify-start space-x-0 xl:space-x-2 px-2.5 xl:px-4 py-2 xl:py-2.5 rounded-lg xl:rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
                      pathname === item.path
                        ? 'bg-primary-50 text-primary-700 shadow-soft'
                        : 'text-ink-muted hover:text-ink hover:bg-surface-100'
                    }`}
                    title={item.label}
                  >
                    <i className={`${item.icon} text-base xl:text-lg`}></i>
                    <span className="hidden xl:inline">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2 xl:space-x-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 cursor-pointer"
            >
              <i className={`${isMobileMenuOpen ? 'ri-close-line' : 'ri-menu-line'} text-2xl`}></i>
            </button>

            <div className="relative hidden md:block">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-1.5 xl:space-x-3 p-1.5 xl:p-2 rounded-lg xl:rounded-xl hover:bg-surface-100 transition-all duration-200 cursor-pointer"
              >
                <div className="w-8 h-8 xl:w-9 xl:h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg xl:rounded-xl flex items-center justify-center shadow-soft flex-shrink-0">
                  <span className="text-white text-xs xl:text-sm font-medium">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden xl:block text-left">
                  <div className="text-sm font-semibold text-ink truncate max-w-[120px]">{user.name}</div>
                  <div className="text-xs text-ink-light truncate max-w-[120px]">{user.email}</div>
                </div>
                <i className="ri-arrow-down-s-line text-gray-400 hidden xl:inline"></i>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 sm:w-64 bg-white rounded-2xl shadow-elevated border border-surface-200 py-3 z-50">
                  <div className="px-4 py-3 border-b border-surface-200">
                    <div className="text-sm font-semibold text-ink">{user.name}</div>
                    <div className="text-sm text-ink-light">{user.email}</div>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'PM' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {user.role === 'PM' ? 'PM' : 'Разработчик'}
                      </span>
                    </div>
                  </div>

                  {menuItems.slice(5).map((item) => (
                    <Link
                      key={item.path + item.label}
                      href={item.path}
                      className="flex items-center space-x-3 px-4 py-2.5 text-sm text-ink-muted hover:text-ink hover:bg-surface-50 transition-colors cursor-pointer"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <i className={item.icon}></i>
                      <span>{item.label}</span>
                    </Link>
                  ))}

                  {user.role === 'PM' && (
                    <Link
                      href="/admin"
                      className="flex items-center space-x-3 px-4 py-2.5 text-sm text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <i className="ri-admin-line"></i>
                      <span>Администрирование</span>
                      {pendingCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {pendingCount}
                        </span>
                      )}
                    </Link>
                  )}

                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="flex items-center space-x-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg mx-2 transition-colors cursor-pointer"
                    >
                      <i className="ri-logout-box-line"></i>
                      <span>Выйти</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => router.push('/invitations')}
              className="hidden md:flex w-8 h-8 items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer relative flex-shrink-0"
              title="Приглашения"
            >
              <i className="ri-mail-line text-lg xl:text-xl"></i>
              {invitationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 xl:w-5 xl:h-5 bg-emerald-500 text-white text-[10px] xl:text-xs rounded-full flex items-center justify-center">
                  {invitationCount > 9 ? '9+' : invitationCount}
                </span>
              )}
            </button>

            <div className="relative hidden md:block">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer relative flex-shrink-0"
              >
                <i className="ri-notification-line text-lg xl:text-xl"></i>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 xl:w-5 xl:h-5 bg-red-500 text-white text-[10px] xl:text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-[calc(100vw-2rem)] sm:w-96 max-w-md bg-white rounded-2xl shadow-elevated border border-surface-200 z-50 overflow-hidden">
                  <div className="p-4 border-b border-surface-200 bg-surface-50">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-ink">Уведомления</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium cursor-pointer"
                        >
                          Прочитать все
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        <i className="ri-notification-off-line text-2xl mb-2"></i>
                        <p>Нет уведомлений</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-surface-100 hover:bg-surface-50 cursor-pointer transition-colors ${
                            !notification.read ? 'bg-primary-50/50' : ''
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <div
                              className="flex-shrink-0 mt-1 cursor-pointer hover:scale-110 transition-transform"
                              onClick={(e) => handleNotificationIconClick(e, notification)}
                            >
                              <i className={`${getNotificationIcon(notification.type)} text-lg`}></i>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="p-3 border-t border-surface-200 bg-surface-50">
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium cursor-pointer"
                      >
                        Закрыть
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-surface-200 bg-white">
          <div className="max-w-7xl mx-auto px-3 py-4 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path + item.label}
                href={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  pathname === item.path
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-ink-muted hover:bg-surface-100'
                }`}
              >
                <i className={`${item.icon} text-lg`}></i>
                <span>{item.label}</span>
              </Link>
            ))}

            {/* Invitations link in mobile */}
            <button
              onClick={() => {
                router.push('/invitations');
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium text-ink-muted hover:bg-surface-100 transition-all cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <i className="ri-mail-line text-lg"></i>
                <span>Приглашения</span>
              </div>
              {invitationCount > 0 && (
                <span className="bg-emerald-500 text-white text-xs px-2 py-1 rounded-full">
                  {invitationCount}
                </span>
              )}
            </button>

            {user?.role === 'PM' && (
              <Link
                href="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-amber-600 hover:bg-amber-50 transition-all cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <i className="ri-admin-line text-lg"></i>
                  <span>Администрирование</span>
                </div>
                {pendingCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </Link>
            )}

            <div className="border-t border-surface-200 pt-2 mt-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="flex items-center space-x-3 w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
              >
                <i className="ri-logout-box-line text-lg"></i>
                <span>Выйти</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showNotificationDetail && selectedNotification && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-elevated max-w-md w-full border border-surface-200">
            <div className="p-4 sm:p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-lg sm:rounded-xl bg-surface-100 flex-shrink-0">
                    <i className={`${getNotificationIcon(selectedNotification.type)} text-lg sm:text-xl`}></i>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-ink truncate">{selectedNotification.title}</h3>
                    <span className="text-xs sm:text-sm text-ink-light">
                      {getNotificationTypeLabel(selectedNotification.type)} • {selectedNotification.time}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowNotificationDetail(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <div className="mb-6">
                <p className="text-ink-muted mb-4">{selectedNotification.message}</p>
                {selectedNotification.details && (
                  <div className="bg-surface-50 rounded-xl p-4 border border-surface-200">
                    <h4 className="font-semibold text-ink mb-2">Подробности:</h4>
                    <p className="text-sm text-ink-muted leading-relaxed">{selectedNotification.details}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => setShowNotificationDetail(false)}
                  className="flex-1 px-4 py-2.5 sm:py-3 text-sm font-semibold text-ink bg-surface-100 hover:bg-surface-200 rounded-lg sm:rounded-xl transition-colors cursor-pointer"
                >
                  Закрыть
                </button>
                {selectedNotification.actionUrl && (
                  <button
                    onClick={handleNotificationAction}
                    className="flex-1 px-4 py-2.5 sm:py-3 text-sm font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-lg sm:rounded-xl shadow-soft transition-all cursor-pointer"
                  >
                    <i className="ri-external-link-line mr-2"></i>
                    Перейти
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
