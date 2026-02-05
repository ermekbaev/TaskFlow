import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { status } = await request.json();

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Status must be APPROVED or REJECTED' }, { status: 400 });
    }

    const reassignRequest = await prisma.reassignRequest.findUnique({
      where: { id: params.id },
    });

    if (!reassignRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (reassignRequest.status !== 'PENDING') {
      return NextResponse.json({ error: 'Request already processed' }, { status: 400 });
    }

    // Update the request
    const updated = await prisma.reassignRequest.update({
      where: { id: params.id },
      data: {
        status,
        reviewedById: session.userId,
        reviewedAt: new Date(),
      },
    });

    // If approved, update the task assignee and ensure they're a project member
    if (status === 'APPROVED') {
      const task = await prisma.task.update({
        where: { id: reassignRequest.taskId },
        data: { assigneeId: reassignRequest.newAssigneeId },
      });

      const existingMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: task.projectId,
            userId: reassignRequest.newAssigneeId,
          },
        },
      });

      if (!existingMember) {
        await prisma.projectMember.create({
          data: {
            projectId: task.projectId,
            userId: reassignRequest.newAssigneeId,
            roleInProject: 'DEV',
          },
        });
      }
    }

    return NextResponse.json({ request: updated });
  } catch (error) {
    console.error('Review reassign request error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
