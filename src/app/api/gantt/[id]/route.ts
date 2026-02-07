import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import {
  GanttTask,
  mapDbStatusToGantt,
  mapDbPriorityToGantt,
  mapGanttStatusToDb,
  mapGanttPriorityToDb,
} from '@/types/gantt';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
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
      name,
      status,
      priority,
      assigneeId,
      startDate,
      endDate,
      progress,
      description,
      estimatedHours,
      actualHours,
    } = body;

    const data: Record<string, unknown> = {};

    if (name !== undefined) data.title = name;
    if (status !== undefined) data.status = mapGanttStatusToDb(status);
    if (priority !== undefined) data.priority = mapGanttPriorityToDb(priority);
    if (assigneeId !== undefined) data.assigneeId = assigneeId || null;
    if (startDate !== undefined) data.startDate = startDate;
    if (endDate !== undefined) data.dueDate = endDate;
    if (progress !== undefined) data.progress = progress;
    if (description !== undefined) data.description = description;
    if (estimatedHours !== undefined) data.estimatedHours = estimatedHours;
    if (actualHours !== undefined) data.actualHours = actualHours;

    const updated = await prisma.task.update({
      where: { id: params.id },
      data,
      include: {
        assignee: { select: { id: true, name: true } },
        project: { select: { id: true, name: true, color: true, key: true } },
      },
    });

    const ganttTask: GanttTask = {
      id: updated.id,
      name: updated.title,
      startDate: updated.startDate || updated.createdAt.toISOString().split('T')[0],
      endDate: updated.dueDate || updated.startDate || new Date().toISOString().split('T')[0],
      progress: updated.progress,
      assigneeId: updated.assigneeId || '',
      assigneeName: updated.assignee?.name || 'Не назначен',
      assigneeAvatar: updated.assignee ? getInitials(updated.assignee.name) : '?',
      priority: mapDbPriorityToGantt(updated.priority),
      status: mapDbStatusToGantt(updated.status),
      projectId: updated.projectId,
      projectName: updated.project.name,
      projectColor: updated.project.color,
      description: updated.description,
      estimatedHours: updated.estimatedHours,
      actualHours: updated.actualHours,
    };

    return NextResponse.json({ task: ganttTask });
  } catch (error) {
    console.error('Gantt PUT error:', error);
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

    await prisma.task.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Gantt DELETE error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
