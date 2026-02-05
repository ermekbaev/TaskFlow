import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        project: { select: { id: true, key: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
        reporter: { select: { id: true, name: true, email: true } },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, status, priority, assigneeId, labels, storyPoints, dueDate } = body;

    // MANAGER can update anything; USER can only update status of their own tasks
    if (session.role !== 'PM' && task.assigneeId !== session.userId && task.reporterId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.task.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(assigneeId !== undefined && session.role === 'PM' && { assigneeId }),
        ...(labels !== undefined && { labels: JSON.stringify(labels) }),
        ...(storyPoints !== undefined && { storyPoints }),
        ...(dueDate !== undefined && { dueDate }),
      },
      include: {
        project: { select: { id: true, key: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
        reporter: { select: { id: true, name: true, email: true } },
      },
    });

    // Notify on status changes
    if (status !== undefined && status !== task.status) {
      if (status === 'Review' && task.reporterId && task.reporterId !== session.userId) {
        await createNotification(
          task.reporterId,
          'Задача на проверке',
          `Задача ${updated.key}: ${updated.title} отправлена на проверку`,
          'info',
          `/project/${task.projectId}/board`
        );
      }
      if (status === 'Done' && task.assigneeId && task.assigneeId !== session.userId) {
        await createNotification(
          task.assigneeId,
          'Задача принята',
          `Задача ${updated.key}: ${updated.title} принята`,
          'success',
          `/project/${task.projectId}/board`
        );
      }
    }

    return NextResponse.json({ task: updated });
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (session.role !== 'PM' && task.assigneeId !== session.userId && task.reporterId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.task.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
