
export const mockProjects = [
  {
    id: '1',
    key: 'APP',
    name: 'Мобильное приложение',
    description: 'Разработка мобильного приложения для управления задачами',
    ownerId: '2',
    status: 'Active' as const,
    createdAt: '2024-01-15T10:00:00Z',
    members: [
      { projectId: '1', userId: '2', roleInProject: 'PM' as const },
      { projectId: '1', userId: '3', roleInProject: 'DEV' as const },
      { projectId: '1', userId: '4', roleInProject: 'DEV' as const },
    ],
  },
  {
    id: '2',
    key: 'WEB',
    name: 'Веб-платформа',
    description: 'Создание веб-платформы для корпоративных клиентов',
    ownerId: '2',
    status: 'Active' as const,
    createdAt: '2024-02-01T09:30:00Z',
    members: [
      { projectId: '2', userId: '2', roleInProject: 'PM' as const },
      { projectId: '2', userId: '3', roleInProject: 'DEV' as const },
    ],
  },
  {
    id: '3',
    key: 'API',
    name: 'REST API',
    description: 'Разработка REST API для интеграции с внешними системами',
    ownerId: '2',
    status: 'Archived' as const,
    createdAt: '2023-12-01T14:20:00Z',
    members: [
      { projectId: '3', userId: '2', roleInProject: 'PM' as const },
      { projectId: '3', userId: '4', roleInProject: 'DEV' as const },
    ],
  },
];
