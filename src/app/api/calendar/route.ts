import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const events = await prisma.calendarEvent.findMany({
      where: { userId: session.userId },
      orderBy: { startDate: 'asc' },
      include: {
        attachments: {
          select: { id: true, fileName: true, filePath: true, fileSize: true, mimeType: true, category: true, createdAt: true }
        }
      }
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Get calendar events error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, startDate, endDate, startTime, endTime, color, type, reminderTime } = await req.json();

    if (!title || !startDate || !endDate) {
      return NextResponse.json({ error: 'title, startDate, endDate обязательны' }, { status: 400 });
    }

    const event = await prisma.calendarEvent.create({
      data: {
        userId: session.userId,
        title,
        description: description || '',
        startDate,
        endDate,
        startTime: startTime || '09:00',
        endTime: endTime || '10:00',
        color: color || 'bg-sky-100 text-sky-700',
        type: type || 'personal',
        reminderTime: reminderTime || null,
      },
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Create calendar event error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, title, description, startDate, endDate, startTime, endTime, color, type, completed, reminderTime, reminderSent } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'id обязателен' }, { status: 400 });
    }

    const existing = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const event = await prisma.calendarEvent.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(startDate !== undefined && { startDate }),
        ...(endDate !== undefined && { endDate }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(color !== undefined && { color }),
        ...(type !== undefined && { type }),
        ...(completed !== undefined && { completed }),
        ...(reminderTime !== undefined && { reminderTime }),
        ...(reminderSent !== undefined && { reminderSent }),
      },
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Update calendar event error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'id обязателен' }, { status: 400 });
    }

    const existing = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.calendarEvent.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete calendar event error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
