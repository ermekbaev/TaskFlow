'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/base/Button';

interface ReassignRequest {
  id: string;
  taskId: string;
  status: string;
  comment?: string;
  createdAt: string;
  task: {
    id: string;
    key: string;
    title: string;
    project: { id: string; key: string; name: string };
    assignee?: { id: string; name: string } | null;
  };
  requestedBy: { id: string; name: string; email: string };
  newAssignee?: { id: string; name: string; email: string } | null;
}

const PendingApprovals: React.FC = () => {
  const [requests, setRequests] = useState<ReassignRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/reassign-requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching reassign requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    setProcessing(requestId);
    try {
      const res = await fetch(`/api/reassign-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setRequests(requests.filter(r => r.id !== requestId));
      }
    } catch (error) {
      console.error('Error processing request:', error);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-soft border border-surface-200 p-6">
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (requests.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-amber-200">
      <div className="p-6 border-b border-surface-100">
        <div className="flex items-center space-x-2">
          <i className="ri-exchange-line text-amber-600 text-xl"></i>
          <h2 className="text-xl font-semibold text-ink">Запросы на переназначение</h2>
          <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full">
            {requests.length}
          </span>
        </div>
      </div>
      <div className="divide-y divide-surface-100">
        {requests.map((req) => (
          <div key={req.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xs font-mono bg-surface-100 px-2 py-1 rounded-lg text-ink-muted">
                    {req.task.key}
                  </span>
                  <span className="text-sm font-semibold text-ink">{req.task.title}</span>
                </div>
                <div className="text-sm text-ink-muted space-y-1">
                  <p>
                    <span className="font-medium">Проект:</span> {req.task.project.name}
                  </p>
                  <p>
                    <span className="font-medium">Запросил:</span> {req.requestedBy.name}
                  </p>
                  <p>
                    <span className="font-medium">Текущий:</span> {req.task.assignee?.name || 'Не назначен'}
                  </p>
                  <p>
                    <span className="font-medium">Новый:</span> {req.newAssignee?.name || 'Неизвестно'}
                  </p>
                  {req.comment && (
                    <p className="mt-2 italic text-ink-light">
                      &ldquo;{req.comment}&rdquo;
                    </p>
                  )}
                </div>
              </div>
              <div className="flex space-x-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction(req.id, 'REJECTED')}
                  disabled={processing === req.id}
                >
                  <i className="ri-close-line mr-1"></i>
                  Отклонить
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAction(req.id, 'APPROVED')}
                  disabled={processing === req.id}
                >
                  <i className="ri-check-line mr-1"></i>
                  Утвердить
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingApprovals;
