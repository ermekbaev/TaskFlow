'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'USER',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      setIsLoading(false);
      return;
    }

    try {
      await register(formData.name, formData.email, formData.password, formData.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-primary-50/30 to-surface-100 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-200/40 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-300/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-100/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full relative">
        <div className="bg-white/70 backdrop-blur-2xl rounded-3xl shadow-elevated p-10 border border-white/60">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow transform hover:scale-105 transition-transform duration-300">
              <i className="ri-user-add-line text-white text-4xl"></i>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-ink to-primary-600 bg-clip-text text-transparent">Регистрация</h1>
            <p className="text-ink-muted mt-3 text-lg">Создайте аккаунт в TaskFlow</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Имя"
              type="text"
              name="name"
              placeholder="Введите ваше имя"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="Введите ваш email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <Input
              label="Пароль"
              type="password"
              name="password"
              placeholder="Минимум 6 символов"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <Input
              label="Подтверждение пароля"
              type="password"
              name="confirmPassword"
              placeholder="Повторите пароль"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />

            <div>
              <label className="block text-sm font-medium text-ink mb-2">Роль</label>
              <select
                name="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-3 bg-white/80 border border-surface-200 rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              >
                <option value="USER">Пользователь</option>
                <option value="MANAGER">Менеджер</option>
              </select>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50/80 backdrop-blur-sm p-4 rounded-xl border border-red-100">
                <i className="ri-error-warning-line mr-2"></i>
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Регистрация...
                </div>
              ) : (
                'Зарегистрироваться'
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-surface-200 text-center">
            <p className="text-sm text-ink-light">
              Уже есть аккаунт?{' '}
              <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Войдите
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
