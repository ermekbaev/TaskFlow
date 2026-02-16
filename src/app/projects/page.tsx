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
  const [showContractSection, setShowContractSection] = useState(false);

  const [newProject, setNewProject] = useState({
    name: '',
    key: '',
    description: '',
    contractNumber: '',
    contractSignDate: '',
    contractEndDate: '',
    rate: '',
    contractAmount: '',
    externalLaborCost: '',
    internalLaborCost: '',
  });

  const [contractFile, setContractFile] = useState<File | null>(null);

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
        body: JSON.stringify({
          name: newProject.name,
          key: newProject.key,
          description: newProject.description,
          contractNumber: newProject.contractNumber || null,
          contractSignDate: newProject.contractSignDate || null,
          contractEndDate: newProject.contractEndDate || null,
          rate: newProject.rate || null,
          contractAmount: newProject.contractAmount || null,
          externalLaborCost: newProject.externalLaborCost || null,
          internalLaborCost: newProject.internalLaborCost || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        // Upload contract file if provided
        if (contractFile && data.project?.id) {
          const formData = new FormData();
          formData.append('file', contractFile);
          formData.append('projectId', data.project.id);
          formData.append('category', 'contract');
          await fetch('/api/upload', { method: 'POST', body: formData });
        }

        setProjects([data.project, ...projects]);
        resetForm();
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setNewProject({
      name: '', key: '', description: '',
      contractNumber: '', contractSignDate: '', contractEndDate: '',
      rate: '', contractAmount: '', externalLaborCost: '', internalLaborCost: '',
    });
    setContractFile(null);
    setShowContractSection(false);
  };

  const handleCloseModal = () => {
    resetForm();
    setShowCreateModal(false);
  };

  if (authLoading || !user) return null;

  const canCreateProject = user.role === 'PM' || hasPermission('CREATE_PROJECT');

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
                      <div className="min-w-[3rem] max-w-[12rem] h-12 px-3 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center group-hover:from-primary-200 group-hover:to-primary-300 transition-all duration-300 shadow-soft">
                        <span className="text-primary-700 font-bold text-sm truncate">{project.key}</span>
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
        size="lg"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
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
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mint-500 focus:border-transparent bg-white"
            />
          </div>

          {/* Contract Section */}
          <div className="border-t pt-4">
            <button
              type="button"
              onClick={() => setShowContractSection(!showContractSection)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer w-full"
            >
              <i className={`ri-arrow-${showContractSection ? 'down' : 'right'}-s-line`}></i>
              <i className="ri-file-text-line"></i>
              Данные договора (опционально)
            </button>

            {showContractSection && (
              <div className="mt-4 space-y-4 pl-1">
                <Input
                  label="Номер договора"
                  value={newProject.contractNumber}
                  onChange={(e) => setNewProject({ ...newProject, contractNumber: e.target.value })}
                  placeholder="Например: ДГ-2025/001"
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Дата подписания"
                    type="date"
                    value={newProject.contractSignDate}
                    onChange={(e) => setNewProject({ ...newProject, contractSignDate: e.target.value })}
                  />
                  <Input
                    label="Дата окончания"
                    type="date"
                    value={newProject.contractEndDate}
                    onChange={(e) => setNewProject({ ...newProject, contractEndDate: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Ставка (руб/час)"
                    type="number"
                    value={newProject.rate}
                    onChange={(e) => setNewProject({ ...newProject, rate: e.target.value })}
                    placeholder="0"
                  />
                  <Input
                    label="Сумма контракта"
                    type="number"
                    value={newProject.contractAmount}
                    onChange={(e) => setNewProject({ ...newProject, contractAmount: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Внешние трудозатраты (ч)"
                    type="number"
                    value={newProject.externalLaborCost}
                    onChange={(e) => setNewProject({ ...newProject, externalLaborCost: e.target.value })}
                    placeholder="0"
                  />
                  <Input
                    label="Внутренние трудозатраты (ч)"
                    type="number"
                    value={newProject.internalLaborCost}
                    onChange={(e) => setNewProject({ ...newProject, internalLaborCost: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Файл договора
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setContractFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 file:cursor-pointer"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                  />
                  {contractFile && (
                    <p className="mt-1 text-xs text-gray-500">
                      Выбран: {contractFile.name}
                    </p>
                  )}
                </div>
              </div>
            )}
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
