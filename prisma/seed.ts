import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.reassignRequest.deleteMany();
  await prisma.userPermission.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  // Create users
  const admin = await prisma.user.create({
    data: {
      id: 'user-1',
      name: 'Администратор',
      email: 'admin@sys.local',
      password: hash('Admin123!'),
      role: 'MANAGER',
      isActive: true,
    },
  });

  const angelina = await prisma.user.create({
    data: {
      id: 'user-2',
      name: 'Ангелина Тестова',
      email: 'angelina.testova@company.com',
      password: hash('password'),
      role: 'MANAGER',
      isActive: true,
    },
  });

  const maria = await prisma.user.create({
    data: {
      id: 'user-3',
      name: 'Мария Петрова',
      email: 'maria.petrova@company.com',
      password: hash('password'),
      role: 'USER',
      isActive: true,
    },
  });

  const dmitry = await prisma.user.create({
    data: {
      id: 'user-4',
      name: 'Дмитрий Сидоров',
      email: 'dmitry.sidorov@company.com',
      password: hash('password'),
      role: 'USER',
      isActive: true,
    },
  });

  const elena = await prisma.user.create({
    data: {
      id: 'user-5',
      name: 'Елена Козлова',
      email: 'elena.kozlova@company.com',
      password: hash('password'),
      role: 'MANAGER',
      isActive: true,
    },
  });

  const sergey = await prisma.user.create({
    data: {
      id: 'user-6',
      name: 'Сергей Волков',
      email: 'sergey.volkov@company.com',
      password: hash('password'),
      role: 'USER',
      isActive: false,
    },
  });

  // Give admin all permissions
  await prisma.userPermission.create({
    data: {
      userId: admin.id,
      permission: 'MANAGE_USERS',
      grantedBy: admin.id,
    },
  });
  await prisma.userPermission.create({
    data: {
      userId: admin.id,
      permission: 'CREATE_PROJECT',
      grantedBy: admin.id,
    },
  });
  await prisma.userPermission.create({
    data: {
      userId: admin.id,
      permission: 'VIEW_ALL_STATS',
      grantedBy: admin.id,
    },
  });

  // Create projects
  const projectApp = await prisma.project.create({
    data: {
      id: 'proj-1',
      key: 'APP',
      name: 'Мобильное приложение',
      description: 'Разработка мобильного приложения для управления задачами',
      ownerId: angelina.id,
      status: 'Active',
    },
  });

  const projectWeb = await prisma.project.create({
    data: {
      id: 'proj-2',
      key: 'WEB',
      name: 'Веб-платформа',
      description: 'Создание веб-платформы для корпоративных клиентов',
      ownerId: angelina.id,
      status: 'Active',
    },
  });

  const projectApi = await prisma.project.create({
    data: {
      id: 'proj-3',
      key: 'API',
      name: 'REST API',
      description: 'Разработка REST API для интеграции с внешними системами',
      ownerId: angelina.id,
      status: 'Archived',
    },
  });

  // Add project members
  await prisma.projectMember.createMany({
    data: [
      { projectId: projectApp.id, userId: angelina.id, roleInProject: 'PM' },
      { projectId: projectApp.id, userId: maria.id, roleInProject: 'DEV' },
      { projectId: projectApp.id, userId: dmitry.id, roleInProject: 'DEV' },
      { projectId: projectWeb.id, userId: angelina.id, roleInProject: 'PM' },
      { projectId: projectWeb.id, userId: maria.id, roleInProject: 'DEV' },
      { projectId: projectApi.id, userId: angelina.id, roleInProject: 'PM' },
      { projectId: projectApi.id, userId: dmitry.id, roleInProject: 'DEV' },
    ],
  });

  // Create tasks
  await prisma.task.createMany({
    data: [
      {
        id: 'task-1',
        projectId: projectApp.id,
        key: 'APP-1',
        title: 'Создать дизайн главного экрана',
        description: '## Описание\nНеобходимо создать дизайн главного экрана приложения с учетом UX/UI требований.\n\n### Требования:\n- Responsive дизайн\n- Соответствие brand guidelines\n- Удобная навигация',
        status: 'Done',
        priority: 'P2',
        assigneeId: maria.id,
        reporterId: angelina.id,
        labels: JSON.stringify(['design', 'ui']),
        storyPoints: 5,
        dueDate: '2024-03-15',
      },
      {
        id: 'task-2',
        projectId: projectApp.id,
        key: 'APP-2',
        title: 'Реализовать авторизацию пользователей',
        description: '## Задача\nРеализовать систему авторизации с поддержкой различных ролей пользователей.\n\n### Функционал:\n- Регистрация\n- Вход/выход\n- Восстановление пароля\n- JWT токены',
        status: 'In Progress',
        priority: 'P1',
        assigneeId: dmitry.id,
        reporterId: angelina.id,
        labels: JSON.stringify(['backend', 'auth']),
        storyPoints: 8,
        dueDate: '2024-03-20',
      },
      {
        id: 'task-3',
        projectId: projectApp.id,
        key: 'APP-3',
        title: 'Настроить CI/CD пайплайн',
        description: '## Цель\nНастроить автоматическое развертывание приложения через CI/CD.\n\n### Этапы:\n- Настройка GitHub Actions\n- Docker контейнеризация\n- Деплой на staging/production',
        status: 'To Do',
        priority: 'P3',
        assigneeId: maria.id,
        reporterId: angelina.id,
        labels: JSON.stringify(['devops', 'deployment']),
        storyPoints: 13,
        dueDate: '2024-03-25',
      },
      {
        id: 'task-4',
        projectId: projectWeb.id,
        key: 'WEB-1',
        title: 'Создать структуру базы данных',
        description: '## Описание\nСпроектировать и создать структуру базы данных для веб-платформы.\n\n### Сущности:\n- Users\n- Companies\n- Projects\n- Tasks',
        status: 'Backlog',
        priority: 'P1',
        assigneeId: maria.id,
        reporterId: angelina.id,
        labels: JSON.stringify(['database', 'backend']),
        storyPoints: 8,
        dueDate: '2024-04-01',
      },
      {
        id: 'task-5',
        projectId: projectApp.id,
        key: 'APP-4',
        title: 'Написать unit-тесты для API',
        description: '## Задача\nНаписать comprehensive unit-тесты для всех API endpoints.\n\n### Coverage:\n- Auth endpoints\n- CRUD операции\n- Error handling\n- Edge cases',
        status: 'To Do',
        priority: 'P2',
        assigneeId: dmitry.id,
        reporterId: angelina.id,
        labels: JSON.stringify(['testing', 'quality']),
        storyPoints: 5,
        dueDate: '2024-03-30',
      },
    ],
  });

  console.log('Seed completed successfully!');
  console.log('Users created:', 6);
  console.log('Projects created:', 3);
  console.log('Tasks created:', 5);
  console.log('\nLogin credentials:');
  console.log('  Admin: admin@sys.local / Admin123!');
  console.log('  Angelina: angelina.testova@company.com / password');
  console.log('  Maria: maria.petrova@company.com / password');
  console.log('  Dmitry: dmitry.sidorov@company.com / password');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
