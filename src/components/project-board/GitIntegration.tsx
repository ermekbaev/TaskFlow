'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/base/Modal';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';

interface GitIntegrationProps {
  isOpen: boolean;
  onClose: () => void;
  projectKey: string;
  repoUrl: string;
  onRepoChange: (url: string) => void;
}

interface GitBranch {
  name: string;
  lastCommit: string;
  author: string;
  date: string;
}

interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
  branch: string;
}

const GitIntegration: React.FC<GitIntegrationProps> = ({
  isOpen,
  onClose,
  projectKey,
  repoUrl,
  onRepoChange,
}) => {
  const [activeTab, setActiveTab] = useState<'branches' | 'commits' | 'settings'>('branches');
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [newBranch, setNewBranch] = useState('');

  // Имитация загрузки данных из Git
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setTimeout(() => {
        setBranches([
          {
            name: 'main',
            lastCommit: 'feat: add user authentication',
            author: 'John Doe',
            date: '2024-03-15T10:30:00Z',
          },
          {
            name: 'feature/task-board',
            lastCommit: 'fix: drag and drop issues',
            author: 'Jane Smith',
            date: '2024-03-14T16:20:00Z',
          },
          {
            name: 'bugfix/login-validation',
            lastCommit: 'fix: email validation regex',
            author: 'Mike Johnson',
            date: '2024-03-13T09:15:00Z',
          },
        ]);

        setCommits([
          {
            hash: 'a1b2c3d',
            message: 'feat: add user authentication',
            author: 'John Doe',
            date: '2024-03-15T10:30:00Z',
            branch: 'main',
          },
          {
            hash: 'e4f5g6h',
            message: 'fix: drag and drop issues',
            author: 'Jane Smith',
            date: '2024-03-14T16:20:00Z',
            branch: 'feature/task-board',
          },
          {
            hash: 'i7j8k9l',
            message: 'fix: email validation regex',
            author: 'Mike Johnson',
            date: '2024-03-13T09:15:00Z',
            branch: 'bugfix/login-validation',
          },
          {
            hash: 'm0n1o2p',
            message: 'docs: update README with setup instructions',
            author: 'John Doe',
            date: '2024-03-12T14:45:00Z',
            branch: 'main',
          },
        ]);

        setLoading(false);
      }, 1000);
    }
  }, [isOpen]);

  const handleCreateBranch = () => {
    if (!newBranch) return;

    const branch: GitBranch = {
      name: newBranch,
      lastCommit: 'branch created',
      author: 'Current User',
      date: new Date().toISOString(),
    };

    setBranches([branch, ...branches]);
    setNewBranch('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Git интеграция - ${projectKey}`}
      size="xl"
    >
      <div className="space-y-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('branches')}
              className={`py-2 px-1 border-b-2 font-medium text-sm cursor-pointer whitespace-nowrap ${
                activeTab === 'branches'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className="ri-git-branch-line mr-2"></i>
              Ветки
            </button>
            <button
              onClick={() => setActiveTab('commits')}
              className={`py-2 px-1 border-b-2 font-medium text-sm cursor-pointer whitespace-nowrap ${
                activeTab === 'commits'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className="ri-git-commit-line mr-2"></i>
              Коммиты
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm cursor-pointer whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className="ri-settings-line mr-2"></i>
              Настройки
            </button>
          </nav>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Загрузка данных...</span>
          </div>
        ) : (
          <>
            {activeTab === 'branches' && (
              <div className="space-y-4">
                <div className="flex space-x-3">
                  <Input
                    placeholder="Название новой ветки"
                    value={newBranch}
                    onChange={(e) => setNewBranch(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleCreateBranch} disabled={!newBranch}>
                    <i className="ri-add-line mr-2"></i>
                    Создать ветку
                  </Button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {branches.map((branch) => (
                    <div key={branch.name} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <i className="ri-git-branch-line text-green-600"></i>
                          <div>
                            <div className="font-medium text-gray-900">{branch.name}</div>
                            <div className="text-sm text-gray-600">{branch.lastCommit}</div>
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <div>{branch.author}</div>
                          <div>{formatDate(branch.date)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'commits' && (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {commits.map((commit) => (
                  <div key={commit.hash} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <i className="ri-git-commit-line text-blue-600 mt-1"></i>
                        <div>
                          <div className="font-medium text-gray-900">{commit.message}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                              {commit.hash}
                            </span>
                            <span className="ml-2">на ветке</span>
                            <span className="ml-1 font-medium">{commit.branch}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div>{commit.author}</div>
                        <div>{formatDate(commit.date)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <Input
                    label="URL репозитория"
                    value={repoUrl}
                    onChange={(e) => onRepoChange(e.target.value)}
                    placeholder="https://github.com/username/repository"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Введите URL вашего Git репозитория для интеграции
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">
                    <i className="ri-information-line mr-2"></i>
                    Автоматическое связывание задач
                  </h4>
                  <p className="text-sm text-blue-800 mb-3">
                    Используйте ключи задач в коммитах для автоматического связывания:
                  </p>
                  <div className="bg-blue-100 p-3 rounded font-mono text-sm text-blue-900">
                    git commit -m &quot;{projectKey}-123: fix user authentication bug&quot;
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Webhook настройки</h4>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">
                      Добавьте этот URL в настройки webhook вашего репозитория:
                    </p>
                    <div className="bg-white p-2 rounded border font-mono text-sm">
                      https://api.taskflow.com/webhooks/git/{projectKey}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Закрыть
          </Button>
          {activeTab === 'settings' && (
            <Button>
              <i className="ri-save-line mr-2"></i>
              Сохранить настройки
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default GitIntegration;
