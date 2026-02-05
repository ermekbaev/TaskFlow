import { prisma } from '@/lib/prisma';

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string = 'info',
  actionUrl?: string
) {
  return prisma.notification.create({
    data: { userId, title, message, type, actionUrl },
  });
}
