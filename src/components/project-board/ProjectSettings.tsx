'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/base/Modal';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';

interface Project {
  id: string;
  key: string;
  name: string;
  description: string;
  ownerId: string;
  status: string;
  members: Array<{
    projectId: string;
    userId: string;
    roleInProject: string;
  }>;
}

interface ProjectSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onUpdate: (project: Project) => void;
}

const ProjectSettings: React.FC<ProjectSettingsProps> = ({
  isOpen,
  onClose,
  project,
  onUpdate,
}) => {
  const router = useRouter();

  const [projectData, setProjectData] = useState({
    name: project.name,
    description: project.description,
    key: project.key,
  });

  const [members, setMembers] = useState<any[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showReworkConfirm, setShowReworkConfirm] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    fetch(`/api/projects/${project.id}/members`)
      .then(res => res.json())
      .then(data => setMembers(data.members || []))
      .catch(console.error);
  }, [isOpen, project.id]);

  useEffect(() => {
    setProjectData({
      name: project.name,
      description: project.description,
      key: project.key,
    });
  }, [project]);

  const handleSaveProject = async () => {
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdate(data.project);
        onClose();
      }
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdate(data.project);
        setShowCompleteConfirm(false);
        setShowReworkConfirm(false);
        onClose();
        if (status === 'Completed') {
          setTimeout(() => router.push('/projects'), 1500);
        }
      }
    } catch (error) {
      console.error('Error updating project status:', error);
    }
  };

  const handleDeleteProject = async () => {
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Archived' }),
      });
      if (res.ok) {
        setShowDeleteConfirm(false);
        router.push('/projects');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Настройки проекта" size="md">
        <div className="space-y-6">
          {/* Основные настройки */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Основные настройки</h3>
            <div className="space-y-4">
              <Input
                label="Название проекта"
                value={projectData.name}
                onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
              />

              <Input
                label="Ключ проекта"
                value={projectData.key}
                onChange={(e) =>
                  setProjectData({ ...projectData, key: e.target.value.toUpperCase() })
                }
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание
                </label>
                <textarea
                  value={projectData.description}
                  onChange={(e) =>
                    setProjectData({ ...projectData, description: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <Button onClick={handleSaveProject}>
                Сохранить изменения
              </Button>
            </div>
          </div>

          {/* Управление проектом */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Управление проектом</h3>
            <div className="space-y-3">
              {project.status === 'Active' && (
                <>
                  <Button
                    onClick={() => setShowReworkConfirm(true)}
                    variant="outline"
                    className="w-full justify-center text-orange-600 border-orange-200 hover:bg-orange-50"
                  >
                    <i className="ri-edit-line mr-2"></i>
                    Вернуть на доработку
                  </Button>

                  <Button
                    onClick={() => setShowCompleteConfirm(true)}
                    variant="outline"
                    className="w-full justify-center text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <i className="ri-check-line mr-2"></i>
                    Завершить проект
                  </Button>
                </>
              )}

              {(project.status === 'Completed' || project.status === 'Rework') && (
                <Button
                  onClick={() => handleUpdateStatus('Active')}
                  variant="outline"
                  className="w-full justify-center text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <i className="ri-play-line mr-2"></i>
                  Возобновить проект
                </Button>
              )}

              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="outline"
                className="w-full justify-center text-red-600 border-red-200 hover:bg-red-50"
              >
                <i className="ri-delete-bin-line mr-2"></i>
                Удалить проект
              </Button>
            </div>
          </div>

          {/* Участники проекта */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Участники проекта</h3>
            <div className="space-y-2">
              {members.map((member: any) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">{member.user?.name?.charAt(0) || '?'}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.user?.name || 'Неизвестно'}</p>
                      <p className="text-sm text-gray-500">{member.roleInProject}</p>
                    </div>
                  </div>
                </div>
              ))}
              {members.length === 0 && (
                <p className="text-sm text-gray-500">Нет участников</p>
              )}
            </div>
          </div>
        </div>

        {/* Подтверждение возврата на доработку */}
        <Modal
          isOpen={showReworkConfirm}
          onClose={() => setShowReworkConfirm(false)}
          title="Вернуть проект на доработку"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Вы уверены, что хотите вернуть проект &quot;{project.name}&quot; на доработку?
              Проект будет помечен как требующий дополнительной работы.
            </p>
            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowReworkConfirm(false)}
                className="flex-1"
              >
                Отмена
              </Button>
              <Button
                onClick={() => handleUpdateStatus('Rework')}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                Вернуть на доработку
              </Button>
            </div>
          </div>
        </Modal>

        {/* Подтверждение завершения проекта */}
        <Modal
          isOpen={showCompleteConfirm}
          onClose={() => setShowCompleteConfirm(false)}
          title="Завершить проект"
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <i className="ri-check-double-line text-emerald-600 text-xl"></i>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Завершить проект &quot;{project.name}&quot;?
                </h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>При завершении проекта произойдет:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Проект будет переведен в статус &quot;Завершенный&quot;</li>
                    <li>Проект останется доступным для просмотра</li>
                    <li>История и данные проекта сохранятся</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCompleteConfirm(false)}
                className="flex-1"
              >
                Отмена
              </Button>
              <Button
                onClick={() => handleUpdateStatus('Completed')}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <i className="ri-check-double-line mr-2"></i>
                Завершить проект
              </Button>
            </div>
          </div>
        </Modal>

        {/* Подтверждение удаления проекта */}
        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Удалить проект"
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                <i className="ri-delete-bin-line text-rose-600 text-xl"></i>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Удалить проект &quot;{project.name}&quot;?
                </h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <p className="font-medium text-red-700">Внимание! Это действие необратимо.</p>
                  <p>При удалении проекта произойдет:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Проект будет архивирован</li>
                    <li>Задачи проекта станут недоступны</li>
                    <li>Участники проекта потеряют доступ</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">
                <strong>Рекомендация:</strong> Вместо удаления рассмотрите возможность завершения проекта.
              </p>
            </div>

            <div className="flex space-x-4 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
              >
                Отмена
              </Button>
              <Button
                onClick={handleDeleteProject}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                <i className="ri-delete-bin-line mr-2"></i>
                Удалить проект
              </Button>
            </div>
          </div>
        </Modal>
      </Modal>
    </>
  );
};

export default ProjectSettings;
