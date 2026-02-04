
export const mockUsers = [
  {
    id: '1',
    name: 'Администратор',
    email: 'admin@sys.local',
    role: 'ADMIN' as const,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Ангелина Тестова',
    email: 'angelina.testova@company.com',
    role: 'PM' as const,
    isActive: true,
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '3',
    name: 'Мария Петрова',
    email: 'maria.petrova@company.com',
    role: 'DEV' as const,
    isActive: true,
    createdAt: '2024-01-20T00:00:00Z',
  },
  {
    id: '4',
    name: 'Дмитрий Сидоров',
    email: 'dmitry.sidorov@company.com',
    role: 'DEV' as const,
    isActive: true,
    createdAt: '2024-02-01T00:00:00Z',
  },
  {
    id: '5',
    name: 'Елена Козлова',
    email: 'elena.kozlova@company.com',
    role: 'PM' as const,
    isActive: true,
    createdAt: '2024-02-10T00:00:00Z',
  },
  {
    id: '6',
    name: 'Сергей Волков',
    email: 'sergey.volkov@company.com',
    role: 'DEV' as const,
    isActive: false,
    createdAt: '2024-01-05T00:00:00Z',
  },
];

const createCurrentUser = () => {
  if (typeof window === 'undefined') {
    return {
      id: '2',
      name: 'Ангелина Тестова',
      email: 'angelina.testova@company.com',
      role: 'PM' as const,
      isActive: true,
      createdAt: '2024-01-15T00:00:00Z',
    };
  }
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    try {
      const userData = JSON.parse(savedUser);
      return {
        id: userData.id || '2',
        name: userData.name || 'Ангелина Тестова',
        email: userData.email || 'angelina.testova@company.com',
        role: userData.role || ('PM' as const),
        isActive: true,
        createdAt: '2024-01-15T00:00:00Z',
      };
    } catch {
      return {
        id: '2',
        name: 'Ангелина Тестова',
        email: 'angelina.testova@company.com',
        role: 'PM' as const,
        isActive: true,
        createdAt: '2024-01-15T00:00:00Z',
      };
    }
  }
  return {
    id: '2',
    name: 'Ангелина Тестова',
    email: 'angelina.testova@company.com',
    role: 'PM' as const,
    isActive: true,
    createdAt: '2024-01-15T00:00:00Z',
  };
};

export let mockCurrentUser = createCurrentUser();

export const updateCurrentUser = (updates: Partial<typeof mockCurrentUser>) => {
  mockCurrentUser = { ...mockCurrentUser, ...updates };
  const userData = {
    id: mockCurrentUser.id,
    name: mockCurrentUser.name,
    email: mockCurrentUser.email,
    role: mockCurrentUser.role,
    ...updates,
  };
  localStorage.setItem('currentUser', JSON.stringify(userData));
};

export const switchCurrentUser = (userId: string) => {
  const user = mockUsers.find(u => u.id === userId);
  if (user) {
    mockCurrentUser = { ...user };
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    localStorage.setItem('currentUser', JSON.stringify(userData));
  }
};

export const getCurrentUser = () => {
  return createCurrentUser();
};

export const refreshCurrentUser = () => {
  mockCurrentUser = createCurrentUser();
  return mockCurrentUser;
};
