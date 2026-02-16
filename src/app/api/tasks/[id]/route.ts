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
        parent: { select: { id: true, key: true, title: true, taskType: true } },
        children: {
          select: { id: true, key: true, title: true, status: true, taskType: true, expectedHours: true, actualHours: true },
        },
        assignees: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        attachments: {
          select: { id: true, fileName: true, filePath: true, fileSize: true, mimeType: true, category: true, createdAt: true },
        },
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
    const {
      title, description, status, priority, assigneeId, labels,
      dueDate, startDate, assignmentDate, expectedHours, actualHours,
      taskType, parentId,
      initiatorName, initiatorEmail, initiatorPosition,
      curatorName, curatorEmail, curatorPosition,
      acceptanceStatus, customDates,
      isRecurring, recurrencePattern, recurrenceDays,
    } = body;

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
        ...(dueDate !== undefined && { dueDate }),
        ...(startDate !== undefined && { startDate }),
        ...(assignmentDate !== undefined && { assignmentDate }),
        ...(expectedHours !== undefined && { expectedHours: parseFloat(expectedHours) }),
        ...(actualHours !== undefined && { actualHours: parseFloat(actualHours) }),
        ...(taskType !== undefined && { taskType }),
        ...(parentId !== undefined && { parentId: parentId || null }),
        ...(initiatorName !== undefined && { initiatorName }),
        ...(initiatorEmail !== undefined && { initiatorEmail }),
        ...(initiatorPosition !== undefined && { initiatorPosition }),
        ...(curatorName !== undefined && { curatorName }),
        ...(curatorEmail !== undefined && { curatorEmail }),
        ...(curatorPosition !== undefined && { curatorPosition }),
        ...(acceptanceStatus !== undefined && { acceptanceStatus }),
        ...(customDates !== undefined && { customDates: JSON.stringify(customDates) }),
        ...(isRecurring !== undefined && { isRecurring }),
        ...(recurrencePattern !== undefined && { recurrencePattern }),
        ...(recurrenceDays !== undefined && { recurrenceDays: JSON.stringify(recurrenceDays) }),
      },
      include: {
        project: { select: { id: true, key: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
        reporter: { select: { id: true, name: true, email: true } },
        parent: { select: { id: true, key: true, title: true, taskType: true } },
        children: {
          select: { id: true, key: true, title: true, status: true, taskType: true },
        },
        assignees: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        attachments: {
          select: { id: true, fileName: true, filePath: true, fileSize: true, mimeType: true, category: true, createdAt: true },
        },
      },
    });

    // Track field changes in activity log
    const trackFields: Array<{ key: string; type: string }> = [
      { key: 'status', type: 'status_change' },
      { key: 'priority', type: 'field_change' },
      { key: 'title', type: 'field_change' },
      { key: 'description', type: 'field_change' },
      { key: 'assigneeId', type: 'field_change' },
      { key: 'dueDate', type: 'field_change' },
      { key: 'startDate', type: 'field_change' },
      { key: 'expectedHours', type: 'field_change' },
      { key: 'taskType', type: 'field_change' },
      { key: 'acceptanceStatus', type: 'field_change' },
    ];

    for (const tf of trackFields) {
      const newVal = body[tf.key];
      if (newVal !== undefined) {
        const oldVal = String((task as Record<string, unknown>)[tf.key] ?? '');
        const newValStr = String(newVal ?? '');
        if (oldVal !== newValStr) {
          await prisma.taskActivity.create({
            data: {
              taskId: params.id,
              userId: session.userId,
              type: tf.type,
              field: tf.key,
              oldValue: oldVal,
              newValue: newValStr,
            },
          });
        }
      }
    }

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
