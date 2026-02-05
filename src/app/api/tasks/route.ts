import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const assigneeId = searchParams.get('assigneeId');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (projectId) {
      where.projectId = projectId;
    }

    if (status) {
      where.status = status;
    }

    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    // USER can only see tasks from their projects or assigned to them
    if (session.role !== 'PM') {
      const userProjects = await prisma.projectMember.findMany({
        where: { userId: session.userId },
        select: { projectId: true },
      });
      const projectIds = userProjects.map(p => p.projectId);

      where.OR = [
        { projectId: { in: projectIds } },
        { assigneeId: session.userId },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, key: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
        reporter: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, title, description, status, priority, assigneeId, labels, storyPoints, dueDate } = await request.json();

    if (!projectId || !title) {
      return NextResponse.json({ error: 'projectId and title are required' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Auto-add assignee as project member if not already
    if (assigneeId) {
      const existingMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: assigneeId,
          },
        },
      });

      if (!existingMember) {
        await prisma.projectMember.create({
          data: {
            projectId,
            userId: assigneeId,
            roleInProject: 'DEV',
          },
        });
      }
    }

    // Generate task key
    const taskCount = await prisma.task.count({
      where: { projectId },
    });
    const key = `${project.key}-${taskCount + 1}`;

    const task = await prisma.task.create({
      data: {
        projectId,
        key,
        title,
        description: description || '',
        status: status || 'Backlog',
        priority: priority || 'P3',
        assigneeId: assigneeId || null,
        reporterId: session.userId,
        labels: labels ? JSON.stringify(labels) : '[]',
        storyPoints: storyPoints || 0,
        dueDate: dueDate || null,
      },
      include: {
        project: { select: { id: true, key: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
        reporter: { select: { id: true, name: true, email: true } },
      },
    });

    // Notify assignee
    if (assigneeId && assigneeId !== session.userId) {
      await createNotification(
        assigneeId,
        'Новая задача назначена',
        `Вам назначена задача ${key}: ${title}`,
        'info',
        `/project/${projectId}/board`
      );
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
