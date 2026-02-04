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

    // If MANAGER, directly reassign
    if (session.role === 'MANAGER') {
      const updated = await prisma.task.update({
        where: { id: params.id },
        data: { assigneeId: newAssigneeId },
        include: {
          project: { select: { id: true, key: true, name: true } },
          assignee: { select: { id: true, name: true, email: true } },
          reporter: { select: { id: true, name: true, email: true } },
        },
      });
      return NextResponse.json({ task: updated, directReassign: true });
    }

    // USER creates a reassign request
    const reassignRequest = await prisma.reassignRequest.create({
      data: {
        taskId: params.id,
        requestedById: session.userId,
        newAssigneeId,
        comment: comment || null,
      },
      include: {
        task: { select: { id: true, key: true, title: true } },
        requestedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ reassignRequest });
  } catch (error) {
    console.error('Reassign error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
