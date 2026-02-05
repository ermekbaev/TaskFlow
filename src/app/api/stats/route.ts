import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isManager = session.role === 'PM';

    // Get user's projects
    let projectIds: string[];
    if (isManager) {
      const allProjects = await prisma.project.findMany({
        select: { id: true },
      });
      projectIds = allProjects.map(p => p.id);
    } else {
      const userProjects = await prisma.projectMember.findMany({
        where: { userId: session.userId },
        select: { projectId: true },
      });
      projectIds = userProjects.map(p => p.projectId);
    }

    // Get tasks
    const tasksWhere = isManager
      ? {}
      : {
          OR: [
            { projectId: { in: projectIds } },
            { assigneeId: session.userId },
          ],
        };

    const tasks = await prisma.task.findMany({
      where: tasksWhere,
      include: {
        project: { select: { id: true, key: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });

    const myTasks = tasks.filter(t => t.assigneeId === session.userId);

    // Projects
    const projects = await prisma.project.findMany({
      where: isManager ? {} : { id: { in: projectIds } },
      select: { id: true, name: true, key: true, status: true },
    });

    // Stats
    const stats = {
      totalTasks: tasks.length,
      myTasks: myTasks.length,
      myActiveTasks: myTasks.filter(t => t.status !== 'Done').length,
      completedTasks: tasks.filter(t => t.status === 'Done').length,
      inProgressTasks: tasks.filter(t => t.status === 'In Progress').length,
      highPriority: tasks.filter(t => t.priority === 'P1' || t.priority === 'P2').length,
      activeProjects: projects.filter(p => p.status === 'Active').length,
      totalProjects: projects.length,
      byStatus: {
        backlog: tasks.filter(t => t.status === 'Backlog').length,
        todo: tasks.filter(t => t.status === 'To Do').length,
        inProgress: tasks.filter(t => t.status === 'In Progress').length,
        done: tasks.filter(t => t.status === 'Done').length,
      },
      byPriority: {
        p1: tasks.filter(t => t.priority === 'P1').length,
        p2: tasks.filter(t => t.priority === 'P2').length,
        p3: tasks.filter(t => t.priority === 'P3').length,
        p4: tasks.filter(t => t.priority === 'P4').length,
      },
    };

    // Pending reassign requests count (for MANAGER)
    let pendingReassigns = 0;
    if (isManager) {
      pendingReassigns = await prisma.reassignRequest.count({
        where: { status: 'PENDING' },
      });
    }

    return NextResponse.json({
      stats,
      tasks: tasks.slice(0, 10),
      projects,
      pendingReassigns,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
