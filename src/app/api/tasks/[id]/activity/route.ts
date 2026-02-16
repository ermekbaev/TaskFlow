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

    const activities = await prisma.taskActivity.findMany({
      where: { taskId: params.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        attachments: {
          select: { id: true, fileName: true, filePath: true, fileSize: true, mimeType: true, category: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Get activities error:', error);
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

    const task = await prisma.task.findUnique({
      where: { id: params.id },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const { type, comment, hours, workDate } = await request.json();

    if (!type) {
      return NextResponse.json({ error: 'type is required' }, { status: 400 });
    }

    if (type === 'comment' && !comment) {
      return NextResponse.json({ error: 'comment is required' }, { status: 400 });
    }

    if (type === 'time_entry') {
      if (!hours || hours <= 0) {
        return NextResponse.json({ error: 'hours must be > 0' }, { status: 400 });
      }
      if (!workDate) {
        return NextResponse.json({ error: 'workDate is required' }, { status: 400 });
      }
    }

    const activity = await prisma.taskActivity.create({
      data: {
        taskId: params.id,
        userId: session.userId,
        type,
        comment: comment || null,
        hours: type === 'time_entry' ? parseFloat(hours) : null,
        workDate: type === 'time_entry' ? workDate : null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        attachments: {
          select: { id: true, fileName: true, filePath: true, fileSize: true, mimeType: true, category: true, createdAt: true },
        },
      },
    });

    // Пересчитать actualHours если это time_entry
    if (type === 'time_entry') {
      const sum = await prisma.taskActivity.aggregate({
        where: { taskId: params.id, type: 'time_entry' },
        _sum: { hours: true },
      });
      await prisma.task.update({
        where: { id: params.id },
        data: { actualHours: sum._sum.hours || 0 },
      });
    }

    return NextResponse.json({ activity });
  } catch (error) {
    console.error('Create activity error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
