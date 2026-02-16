'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/base/Button';

export default function Landing() {
  const router = useRouter();

  const features = [
    {
      icon: 'ri-dashboard-3-line',
      title: 'Kanban-доски',
      description: 'Визуализируйте рабочий процесс с помощью интуитивных досок задач с drag & drop'
    },
    {
      icon: 'ri-team-line',
      title: 'Командная работа',
      description: 'Назначайте задачи, отслеживайте прогресс и координируйте работу команды'
    },
    {
      icon: 'ri-bar-chart-box-line',
      title: 'Аналитика',
      description: 'Получайте insights о производительности проектов и эффективности команды'
    },
    {
      icon: 'ri-shield-check-line',
      title: 'Ролевой доступ',
      description: 'Гибкая система прав: администраторы, менеджеры и разработчики'
    },
    {
      icon: 'ri-calendar-check-line',
      title: 'Дедлайны',
      description: 'Контролируйте сроки выполнения задач и никогда не пропускайте дедлайны'
    },
    {
      icon: 'ri-git-branch-line',
      title: 'Git интеграция',
      description: 'Связывайте задачи с коммитами и отслеживайте изменения кода'
    }
  ];

  const stats = [
    { value: '10K+', label: 'Активных пользователей' },
    { value: '50K+', label: 'Созданных проектов' },
    { value: '500K+', label: 'Выполненных задач' },
    { value: '99.9%', label: 'Uptime' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-white">
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b border-surface-200 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => router.push('/dashboard')}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-soft">
                <i className="ri-dashboard-line text-white text-xl"></i>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-ink to-primary-600 bg-clip-text text-transparent">
                TaskFlow
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => router.push('/login')}>
                Войти
              </Button>
              <Button size="sm" onClick={() => router.push('/login')}>
                Начать бесплатно
              </Button>
            </div>
          </div>
        </div>
      </header>

      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary-200/40 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-primary-300/30 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-100/20 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
              <span className="bg-gradient-to-r from-ink via-primary-600 to-primary-500 bg-clip-text text-transparent">
                Управляйте проектами
              </span>
              <br />
              <span className="text-ink">эффективно</span>
            </h1>

            <p className="text-xl text-ink-muted mb-10 max-w-2xl mx-auto leading-relaxed">
              TaskFlow — современная система управления IT-проектами.
              Kanban-доски, отслеживание задач и командная работа в одном месте.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" onClick={() => router.push('/login')} className="px-8">
                <i className="ri-arrow-right-line mr-2"></i>
                Попробовать бесплатно
              </Button>
              <Button variant="outline" size="lg" className="px-8">
                <i className="ri-play-circle-line mr-2"></i>
                Смотреть демо
              </Button>
            </div>
          </div>

          <div className="mt-16 relative">
            <div className="bg-white rounded-2xl shadow-elevated border border-surface-200 p-2 max-w-5xl mx-auto">
              <div className="bg-gradient-to-br from-surface-50 to-surface-100 rounded-xl p-8">
                <div className="grid grid-cols-4 gap-4">
                  {['Backlog', 'To Do', 'In Progress', 'Done'].map((column, idx) => (
                    <div key={column} className="bg-white rounded-xl p-4 shadow-soft">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-semibold text-ink">{column}</span>
                        <span className="text-xs text-ink-light bg-surface-100 px-2 py-1 rounded-full">
                          {[3, 5, 4, 8][idx]}
                        </span>
                      </div>
                      {[...Array([2, 3, 2, 3][idx])].map((_, i) => (
                        <div key={i} className="bg-surface-50 rounded-lg p-3 mb-2 last:mb-0">
                          <div className="h-2 bg-surface-200 rounded w-3/4 mb-2"></div>
                          <div className="h-2 bg-surface-100 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute -left-4 top-1/4 bg-white rounded-xl shadow-medium p-4 hidden lg:block">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <i className="ri-check-line text-emerald-600"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">Задача выполнена</p>
                  <p className="text-xs text-ink-light">2 минуты назад</p>
                </div>
              </div>
            </div>

            <div className="absolute -right-4 top-1/3 bg-white rounded-xl shadow-medium p-4 hidden lg:block">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <i className="ri-user-add-line text-primary-600"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">Новый участник</p>
                  <p className="text-xs text-ink-light">Присоединился к проекту</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <p className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</p>
                <p className="text-primary-200">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-ink mb-4">Всё для эффективной работы</h2>
            <p className="text-xl text-ink-muted max-w-2xl mx-auto">
              Полный набор инструментов для управления проектами любой сложности
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-8 shadow-soft border border-surface-200 hover:shadow-medium hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mb-6">
                  <i className={`${feature.icon} text-primary-600 text-2xl`}></i>
                </div>
                <h3 className="text-xl font-semibold text-ink mb-3">{feature.title}</h3>
                <p className="text-ink-muted leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-surface-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-ink mb-4">Как это работает</h2>
            <p className="text-xl text-ink-muted">Три простых шага к продуктивности</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Создайте проект', desc: 'Добавьте новый проект и пригласите участников команды' },
              { step: '02', title: 'Добавьте задачи', desc: 'Создавайте задачи, назначайте исполнителей и устанавливайте сроки' },
              { step: '03', title: 'Отслеживайте прогресс', desc: 'Используйте Kanban-доску для визуализации и управления работой' }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="bg-white rounded-2xl p-8 shadow-soft border border-surface-200 text-center">
                  <div className="text-6xl font-bold text-primary-100 mb-4">{item.step}</div>
                  <h3 className="text-xl font-semibold text-ink mb-3">{item.title}</h3>
                  <p className="text-ink-muted">{item.desc}</p>
                </div>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <i className="ri-arrow-right-line text-3xl text-primary-300"></i>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
            </div>

            <div className="relative">
              <h2 className="text-4xl font-bold text-white mb-4">Готовы начать?</h2>
              <p className="text-xl text-primary-100 mb-8 max-w-xl mx-auto">
                Присоединяйтесь к тысячам команд, которые уже используют TaskFlow
              </p>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => router.push('/login')}
                className="bg-white text-primary-600 hover:bg-primary-50 px-8"
              >
                Начать бесплатно
                <i className="ri-arrow-right-line ml-2"></i>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-ink py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                <i className="ri-dashboard-line text-white text-xl"></i>
              </div>
              <span className="text-xl font-bold text-white">TaskFlow</span>
            </div>

            <div className="flex items-center space-x-8 text-surface-300">
              <a href="#" className="hover:text-white transition-colors">О нас</a>
              <a href="#" className="hover:text-white transition-colors">Возможности</a>
              <a href="#" className="hover:text-white transition-colors">Цены</a>
              <a href="#" className="hover:text-white transition-colors">Контакты</a>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/10 text-center text-surface-400">
            <p>&copy; 2024 TaskFlow. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
