import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Удаление тестовых seed данных...');

  // Удаляем только seed данные (по известным ID)
  await prisma.task.deleteMany({
    where: {
      id: { in: ['task-1', 'task-2', 'task-3', 'task-4', 'task-5'] },
    },
  });

  await prisma.projectMember.deleteMany({
    where: {
      projectId: { in: ['proj-1', 'proj-2', 'proj-3'] },
    },
  });

  await prisma.project.deleteMany({
    where: {
      id: { in: ['proj-1', 'proj-2', 'proj-3'] },
    },
  });

  await prisma.userPermission.deleteMany({
    where: {
      userId: { in: ['user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6'] },
    },
  });

  await prisma.user.deleteMany({
    where: {
      id: { in: ['user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6'] },
    },
  });

  console.log('✅ Тестовые данные удалены!');
  console.log('Ваши реальные проекты и пользователи остались нетронутыми.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
