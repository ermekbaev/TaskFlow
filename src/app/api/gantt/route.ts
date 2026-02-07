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

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Load projects the user has access to
    const projects = await prisma.project.findMany({
      where:
        session.role === 'PM'
          ? {}
          : {
              OR: [
                { ownerId: session.userId },
                { members: { some: { userId: session.userId } } },
              ],
            },
      include: {
        tasks: {
          include: {
            assignee: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Load all users for the filter dropdowns
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, role: true },
    });

    // Build GanttTask tree: each project is a parent with its tasks as children
    const ganttTasks: GanttTask[] = [];

    for (const project of projects) {
      if (project.tasks.length === 0) continue;

      const children: GanttTask[] = project.tasks.map((task) => {
        const today = new Date().toISOString().split('T')[0];
        const startDate = task.startDate || task.createdAt.toISOString().split('T')[0];
        const endDate = task.dueDate || today;

        return {
          id: task.id,
          name: task.title,
          startDate,
          endDate,
          progress: task.progress,
          assigneeId: task.assigneeId || '',
          assigneeName: task.assignee?.name || 'Не назначен',
          assigneeAvatar: task.assignee ? getInitials(task.assignee.name) : '?',
          priority: mapDbPriorityToGantt(task.priority),
          status: mapDbStatusToGantt(task.status),
          projectId: project.id,
          projectName: project.name,
          projectColor: project.color,
          description: task.description,
          estimatedHours: task.estimatedHours,
          actualHours: task.actualHours,
        };
      });

      // Calculate epic dates & progress from children
      const dates = children.map((c) => ({
        start: new Date(c.startDate),
        end: new Date(c.endDate),
      }));
      const epicStart = new Date(Math.min(...dates.map((d) => d.start.getTime())));
      const epicEnd = new Date(Math.max(...dates.map((d) => d.end.getTime())));
      const avgProgress =
        children.length > 0
          ? Math.round(children.reduce((sum, c) => sum + c.progress, 0) / children.length)
          : 0;

      const totalEstimated = children.reduce((sum, c) => sum + (c.estimatedHours || 0), 0);
      const totalActual = children.reduce((sum, c) => sum + (c.actualHours || 0), 0);

      const epicStatus: GanttTask['status'] =
        avgProgress === 100
          ? 'completed'
          : avgProgress > 0
            ? 'in_progress'
            : 'not_started';

      const epic: GanttTask = {
        id: `project-${project.id}`,
        name: project.name,
        startDate: epicStart.toISOString().split('T')[0],
        endDate: epicEnd.toISOString().split('T')[0],
        progress: avgProgress,
        assigneeId: '',
        assigneeName: '',
        priority: 'medium',
        status: epicStatus,
        projectId: project.id,
        projectName: project.name,
        projectColor: project.color,
        estimatedHours: totalEstimated,
        actualHours: totalActual,
        children,
      };

      ganttTasks.push(epic);
    }

    const projectList = projects.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      key: p.key,
    }));

    const userList = users.map((u) => ({
      id: u.id,
      name: u.name,
      avatar: getInitials(u.name),
      role: u.role,
    }));

    return NextResponse.json({ tasks: ganttTasks, projects: projectList, users: userList });
  } catch (error) {
    console.error('Gantt GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      projectId,
      assigneeId,
      priority,
      status,
      startDate,
      endDate,
      description,
      estimatedHours,
      isMilestone,
    } = body;

    // Get project to generate task key
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { tasks: { select: { id: true } } },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const taskCount = project.tasks.length + 1;
    const key = `${project.key}-${taskCount}`;

    const dbStatus = status ? mapGanttStatusToDb(status) : 'Backlog';
    const dbPriority = priority ? mapGanttPriorityToDb(priority) : 'P3';

    const task = await prisma.task.create({
      data: {
        key,
        title: name,
        projectId,
        assigneeId: assigneeId || null,
        reporterId: session.userId,
        status: dbStatus,
        priority: dbPriority,
        startDate: startDate || null,
        dueDate: isMilestone ? startDate : endDate || null,
        description: description || '',
        estimatedHours: estimatedHours || 0,
        progress: 0,
        actualHours: 0,
      },
      include: {
        assignee: { select: { id: true, name: true } },
        project: { select: { id: true, name: true, color: true, key: true } },
      },
    });

    const ganttTask: GanttTask = {
      id: task.id,
      name: task.title,
      startDate: task.startDate || task.createdAt.toISOString().split('T')[0],
      endDate: task.dueDate || task.startDate || new Date().toISOString().split('T')[0],
      progress: task.progress,
      assigneeId: task.assigneeId || '',
      assigneeName: task.assignee?.name || 'Не назначен',
      assigneeAvatar: task.assignee ? getInitials(task.assignee.name) : '?',
      priority: mapDbPriorityToGantt(task.priority),
      status: mapDbStatusToGantt(task.status),
      projectId: task.projectId,
      projectName: task.project.name,
      projectColor: task.project.color,
      description: task.description,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      isMilestone,
    };

    return NextResponse.json({ task: ganttTask });
  } catch (error) {
    console.error('Gantt POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
