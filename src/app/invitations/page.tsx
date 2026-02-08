'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/feature/Navbar';
import { useAuth } from '@/contexts/AuthContext';

interface Invitation {
  id: string;
  role: string;
  status: string;
  createdAt: string;
  project: {
    id: string;
    key: string;
    name: string;
    color: string;
  };
  invitedBy: {
    id: string;
    name: string;
    email: string;
  };
}

const InvitationsPage: React.FC = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;
    fetchInvitations();
  }, [user, authLoading]);

  const fetchInvitations = async () => {
    try {
      const res = await fetch('/api/invitations');
      if (res.ok) {
        const data = await res.json();
        setInvitations(data.invitations || []);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (id: string, action: 'accept' | 'decline') => {
    setResponding(id);
    try {
      const res = await fetch(`/api/invitations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setInvitations(invitations.filter(inv => inv.id !== id));
        if (action === 'accept') {
          const inv = invitations.find(i => i.id === id);
          if (inv) {
            router.push(`/project/${inv.project.id}/board`);
          }
        }
      }
    } catch (error) {
      console.error('Error responding to invitation:', error);
    } finally {
      setResponding(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return 'только что';
    if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} дн назад`;
    return d.toLocaleDateString('ru-RU');
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-surface-50 to-surface-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-surface-100">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ink">Приглашения</h1>
          <p className="text-ink-muted mt-2">
            Приглашения в проекты от других участников
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : invitations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-soft border border-surface-200 p-12 text-center">
            <div className="w-20 h-20 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-mail-check-line text-3xl text-surface-400"></i>
            </div>
            <h2 className="text-xl font-semibold text-ink mb-2">Нет приглашений</h2>
            <p className="text-ink-muted">
              У вас нет активных приглашений в проекты
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="bg-white rounded-2xl shadow-soft border border-surface-200 p-6 hover:shadow-medium transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: invitation.project.color + '20', color: invitation.project.color }}
                    >
                      <span className="text-sm font-bold">{invitation.project.key}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-ink">
                        {invitation.project.name}
                      </h3>
                      <p className="text-ink-muted text-sm mt-1">
                        <i className="ri-user-line mr-1"></i>
                        Пригласил(а): <span className="font-medium">{invitation.invitedBy.name}</span>
                      </p>
                      <div className="flex items-center space-x-3 mt-2">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          invitation.role === 'PM' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          Роль: {invitation.role === 'PM' ? 'Менеджер' : 'Разработчик'}
                        </span>
                        <span className="text-xs text-ink-light">
                          {formatDate(invitation.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 mt-5 pt-5 border-t border-surface-100">
                  <button
                    onClick={() => handleRespond(invitation.id, 'accept')}
                    disabled={responding === invitation.id}
                    className="flex-1 inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl shadow-soft transition-all cursor-pointer disabled:opacity-50"
                  >
                    <i className="ri-check-line mr-2"></i>
                    Принять
                  </button>
                  <button
                    onClick={() => handleRespond(invitation.id, 'decline')}
                    disabled={responding === invitation.id}
                    className="flex-1 inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-ink border-2 border-surface-200 hover:bg-surface-50 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    <i className="ri-close-line mr-2"></i>
                    Отклонить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitationsPage;
