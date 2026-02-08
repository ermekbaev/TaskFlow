import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

// PUT — принять или отклонить приглашение
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json();

    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Действие должно быть accept или decline' }, { status: 400 });
    }

    const invitation = await prisma.projectInvitation.findUnique({
      where: { id: params.id },
      include: {
        project: { select: { id: true, name: true, key: true } },
        invited: { select: { id: true, name: true } },
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Приглашение не найдено' }, { status: 404 });
    }

    if (invitation.invitedId !== session.userId) {
      return NextResponse.json({ error: 'Это не ваше приглашение' }, { status: 403 });
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json({ error: 'Приглашение уже обработано' }, { status: 400 });
    }

    if (action === 'accept') {
      // Принять — добавить в участники проекта
      await prisma.$transaction([
        prisma.projectInvitation.update({
          where: { id: params.id },
          data: { status: 'ACCEPTED', respondedAt: new Date() },
        }),
        prisma.projectMember.create({
          data: {
            projectId: invitation.projectId,
            userId: session.userId,
            roleInProject: invitation.role,
          },
        }),
      ]);

      // Уведомление отправителю
      await createNotification(
        invitation.invitedById,
        'Приглашение принято',
        `${invitation.invited.name} принял(а) приглашение в проект "${invitation.project.name}"`,
        'success',
        `/project/${invitation.projectId}/board`
      );

      return NextResponse.json({ success: true, status: 'ACCEPTED' });
    } else {
      // Отклонить
      await prisma.projectInvitation.update({
        where: { id: params.id },
        data: { status: 'DECLINED', respondedAt: new Date() },
      });

      // Уведомление отправителю
      await createNotification(
        invitation.invitedById,
        'Приглашение отклонено',
        `${invitation.invited.name} отклонил(а) приглашение в проект "${invitation.project.name}"`,
        'warning'
      );

      return NextResponse.json({ success: true, status: 'DECLINED' });
    }
  } catch (error) {
    console.error('Respond to invitation error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
