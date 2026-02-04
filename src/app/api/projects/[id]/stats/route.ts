import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tasks = await prisma.task.findMany({
      where: { projectId: params.id },
    });

    const stats = {
      total: tasks.length,
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

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Get project stats error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
