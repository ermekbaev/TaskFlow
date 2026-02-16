import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { newAssigneeId, comment } = await request.json();

    if (!newAssigneeId) {
      return NextResponse.json({ error: 'newAssigneeId is required' }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Auto-add new assignee as project member if not already
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: task.projectId,
          userId: newAssigneeId,
        },
      },
    });

    if (!existingMember) {
      await prisma.projectMember.create({
        data: {
          projectId: task.projectId,
          userId: newAssigneeId,
          roleInProject: 'DEV',
        },
      });
    }

    // If MANAGER, directly reassign
    if (session.role === 'PM') {
      const updated = await prisma.task.update({
        where: { id: params.id },
        data: { assigneeId: newAssigneeId },
        include: {
          project: { select: { id: true, key: true, name: true } },
          assignee: { select: { id: true, name: true, email: true } },
          reporter: { select: { id: true, name: true, email: true } },
        },
      });
      // Record reassignment in activity log
      await prisma.taskActivity.create({
        data: {
          taskId: params.id,
          userId: session.userId,
          type: 'reassign',
          comment: comment || null,
          oldValue: task.assigneeId || '',
          newValue: newAssigneeId,
        },
      });

      return NextResponse.json({ task: updated, directReassign: true });
    }

    // Only MANAGER can reassign tasks
    return NextResponse.json({ error: 'Only managers can reassign tasks' }, { status: 403 });
  } catch (error) {
    console.error('Reassign error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
