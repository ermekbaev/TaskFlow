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
    const parentId = searchParams.get('parentId');
    const taskType = searchParams.get('taskType');

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

    if (parentId) {
      where.parentId = parentId;
    }

    if (taskType) {
      where.taskType = taskType;
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

    const {
      projectId, title, description, status, priority, assigneeId, labels,
      dueDate, startDate, assignmentDate, expectedHours, actualHours,
      taskType, parentId,
      // Parent task fields
      initiatorName, initiatorEmail, initiatorPosition,
      curatorName, curatorEmail, curatorPosition,
      acceptanceStatus, customDates,
      // Recurring fields
      isRecurring, recurrencePattern, recurrenceDays,
      // Multiple assignees
      assigneeIds,
    } = await request.json();

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
        dueDate: dueDate || null,
        startDate: startDate || null,
        assignmentDate: assignmentDate || null,
        expectedHours: expectedHours ? parseFloat(expectedHours) : 0,
        actualHours: actualHours ? parseFloat(actualHours) : 0,
        taskType: taskType || 'task',
        parentId: parentId || null,
        // Parent task fields
        initiatorName: initiatorName || null,
        initiatorEmail: initiatorEmail || null,
        initiatorPosition: initiatorPosition || null,
        curatorName: curatorName || null,
        curatorEmail: curatorEmail || null,
        curatorPosition: curatorPosition || null,
        acceptanceStatus: acceptanceStatus || null,
        customDates: customDates ? JSON.stringify(customDates) : '[]',
        // Recurring fields
        isRecurring: isRecurring || false,
        recurrencePattern: recurrencePattern || null,
        recurrenceDays: recurrenceDays ? JSON.stringify(recurrenceDays) : null,
        // Multiple assignees
        ...(assigneeIds && assigneeIds.length > 0 ? {
          assignees: {
            create: assigneeIds.map((uid: string) => ({ userId: uid })),
          },
        } : {}),
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

    // Auto-add additional assignees as project members
    if (assigneeIds && assigneeIds.length > 0) {
      for (const uid of assigneeIds) {
        const existingMember = await prisma.projectMember.findUnique({
          where: { projectId_userId: { projectId, userId: uid } },
        });
        if (!existingMember) {
          await prisma.projectMember.create({
            data: { projectId, userId: uid, roleInProject: 'DEV' },
          });
        }
      }
    }

    // Record task creation in activity log
    await prisma.taskActivity.create({
      data: {
        taskId: task.id,
        userId: session.userId,
        type: 'created',
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
