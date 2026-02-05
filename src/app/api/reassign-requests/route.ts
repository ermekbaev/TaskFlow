import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role !== 'PM') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const requests = await prisma.reassignRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        task: {
          select: {
            id: true,
            key: true,
            title: true,
            project: { select: { id: true, key: true, name: true } },
            assignee: { select: { id: true, name: true } },
          },
        },
        requestedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch new assignee info
    const enriched = await Promise.all(
      requests.map(async (r) => {
        const newAssignee = await prisma.user.findUnique({
          where: { id: r.newAssigneeId },
          select: { id: true, name: true, email: true },
        });
        return { ...r, newAssignee };
      })
    );

    return NextResponse.json({ requests: enriched });
  } catch (error) {
    console.error('Get reassign requests error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
