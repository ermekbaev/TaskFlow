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

    const assignees = await prisma.taskAssignee.findMany({
      where: { taskId: params.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ assignees });
  } catch (error) {
    console.error('Get assignees error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Auto-add user as project member if not already
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: task.projectId,
          userId,
        },
      },
    });

    if (!existingMember) {
      await prisma.projectMember.create({
        data: {
          projectId: task.projectId,
          userId,
          roleInProject: 'DEV',
        },
      });
    }

    const assignee = await prisma.taskAssignee.create({
      data: {
        taskId: params.id,
        userId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ assignee });
  } catch (error) {
    console.error('Add assignee error:', error);
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

    const { userId } = await request.json();

    await prisma.taskAssignee.deleteMany({
      where: {
        taskId: params.id,
        userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove assignee error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
