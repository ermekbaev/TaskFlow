'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/feature/Navbar';
import Button from '@/components/base/Button';
import Modal from '@/components/base/Modal';
import Input from '@/components/base/Input';
import { useAuth } from '@/contexts/AuthContext';

const Projects: React.FC = () => {
  const router = useRouter();
  const { user, loading: authLoading, hasPermission } = useAuth();

  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [creating, setCreating] = useState(false);

  const [newProject, setNewProject] = useState({
    name: '',
    key: '',
    description: '',
  });

  useEffect(() => {
    if (authLoading || !user) return;

    fetch('/api/projects')
      .then(res => res.json())
      .then(data => setProjects(data.projects || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  const filteredProjects = projects.filter((project: any) => {
    if (filter === 'all') return true;
    if (filter === 'active') return project.status === 'Active';
    if (filter === 'archived') return project.status === 'Archived' || project.status === 'Completed' || project.status === 'Rework';
    return false;
  });

  const handleCreateProject = async () => {
    if (!newProject.name || !newProject.key) return;
    setCreating(true);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });

      if (res.ok) {
        const data = await res.json();
        setProjects([data.project, ...projects]);
        setNewProject({ name: '', key: '', description: '' });
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleCloseModal = () => {
    setNewProject({ name: '', key: '', description: '' });
    setShowCreateModal(false);
  };

  if (authLoading || !user) return null;

  const canCreateProject = user.role === 'MANAGER' || hasPermission('CREATE_PROJECT');

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-surface-100">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-ink to-primary-600 bg-clip-text text-transparent">Проекты</h1>
            <p className="text-ink-muted mt-2">Управление вашими IT-проектами</p>
          </div>

          {canCreateProject && (
            <Button onClick={() => setShowCreateModal(true)}>
              <i className="ri-add-line mr-2"></i>
              Новый проект
            </Button>
          )}
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft border border-surface-200 mb-8">
          <div className="p-5">
            <div className="flex items-center space-x-4">
              <div className="flex space-x-1 bg-surface-100 rounded-xl p-1.5">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                    filter === 'all' ? 'bg-white text-ink shadow-soft' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  Все ({projects.length})
                </button>
                <button
                  onClick={() => setFilter('active')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                    filter === 'active' ? 'bg-white text-ink shadow-soft' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  Активные ({projects.filter((p: any) => p.status === 'Active').length})
                </button>
                <button
                  onClick={() => setFilter('archived')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                    filter === 'archived' ? 'bg-white text-ink shadow-soft' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  Завершенные ({projects.filter((p: any) => p.status === 'Archived' || p.status === 'Completed' || p.status === 'Rework').length})
                </button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project: any) => (
              <div
                key={project.id}
                className="bg-white rounded-2xl shadow-soft border border-surface-200 hover:shadow-medium hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                onClick={() => router.push(`/project/${project.id}/board`)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center group-hover:from-primary-200 group-hover:to-primary-300 transition-all duration-300 shadow-soft">
                        <span className="text-primary-700 font-bold text-sm">{project.key}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-ink group-hover:text-primary-600 transition-colors">{project.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            project.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                            project.status === 'Completed' ? 'bg-sky-100 text-sky-700' :
                            project.status === 'Rework' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {project.status === 'Active' ? 'Активный' :
                             project.status === 'Completed' ? 'Завершенный' :
                             project.status === 'Rework' ? 'На доработке' : 'Архивный'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-ink-muted text-sm mb-4 line-clamp-2 leading-relaxed">{project.description}</p>

                  <div className="flex items-center justify-between text-sm text-ink-light pt-4 border-t border-surface-100">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <i className="ri-task-line"></i>
                        <span>{project._count?.tasks || 0} задач</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <i className="ri-team-line"></i>
                        <span>{project.members?.length || 0}</span>
                      </div>
                    </div>

                    {project.owner && (
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">{project.owner.name.charAt(0)}</span>
                        </div>
                        <span className="text-xs">{project.owner.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-folder-line text-gray-400 text-3xl"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет проектов</h3>
            <p className="text-gray-600">
              {filter === 'all' ? 'Создайте свой первый проект' :
               filter === 'active' ? 'Нет активных проектов' : 'Нет завершенных проектов'}
            </p>
          </div>
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        title="Создать новый проект"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Название проекта"
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            placeholder="Введите название проекта"
            required
          />

          <Input
            label="Ключ проекта"
            value={newProject.key}
            onChange={(e) => setNewProject({ ...newProject, key: e.target.value.toUpperCase() })}
            placeholder="Например: APP, WEB, API"
            required
          />

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Описание</label>
            <textarea
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              placeholder="Описание проекта"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mint-500 focus:border-transparent bg-white"
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <Button variant="outline" onClick={handleCloseModal} className="flex-1">
              Отмена
            </Button>
            <Button onClick={handleCreateProject} disabled={!newProject.name || !newProject.key || creating} className="flex-1">
              {creating ? 'Создание...' : 'Создать проект'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Projects;
