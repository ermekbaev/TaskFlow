import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

// GET — получить мои входящие приглашения
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invitations = await prisma.projectInvitation.findMany({
      where: { invitedId: session.userId, status: 'PENDING' },
      include: {
        project: { select: { id: true, key: true, name: true, color: true } },
        invitedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('Get invitations error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — отправить приглашение
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role !== 'PM') {
      return NextResponse.json({ error: 'Только PM может отправлять приглашения' }, { status: 403 });
    }

    const { projectId, userId, role } = await request.json();

    if (!projectId || !userId) {
      return NextResponse.json({ error: 'projectId и userId обязательны' }, { status: 400 });
    }

    // Проверяем что проект существует и отправитель — владелец или PM проекта
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Проверяем что пользователь уже не является участником
    const existingMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });

    if (existingMember) {
      return NextResponse.json({ error: 'Пользователь уже является участником проекта' }, { status: 400 });
    }

    // Проверяем что нет активного приглашения
    const existingInvitation = await prisma.projectInvitation.findFirst({
      where: { projectId, invitedId: userId, status: 'PENDING' },
    });

    if (existingInvitation) {
      return NextResponse.json({ error: 'Приглашение уже отправлено' }, { status: 400 });
    }

    const invitation = await prisma.projectInvitation.create({
      data: {
        projectId,
        invitedById: session.userId,
        invitedId: userId,
        role: role || 'DEV',
      },
      include: {
        project: { select: { id: true, key: true, name: true } },
        invitedBy: { select: { id: true, name: true } },
        invited: { select: { id: true, name: true } },
      },
    });

    // Уведомление приглашённому
    await createNotification(
      userId,
      'Приглашение в проект',
      `${session.userId === project.ownerId ? 'Владелец' : 'Менеджер'} ${invitation.invitedBy.name} приглашает вас в проект "${project.name}"`,
      'info',
      '/invitations'
    );

    return NextResponse.json({ invitation });
  } catch (error) {
    console.error('Create invitation error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
