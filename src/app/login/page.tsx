'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

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

    try {
      await login(formData.email, formData.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при входе');
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
              <i className="ri-dashboard-line text-white text-4xl"></i>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-ink to-primary-600 bg-clip-text text-transparent">TaskFlow</h1>
            <p className="text-ink-muted mt-3 text-lg">Система управления IT-проектами</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
              placeholder="Введите пароль"
              value={formData.password}
              onChange={handleChange}
              required
            />

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
                  Вход...
                </div>
              ) : (
                'Войти в систему'
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-surface-200 text-center">
            <p className="text-sm text-ink-light">
              Нет аккаунта?{' '}
              <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                Зарегистрируйтесь
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
