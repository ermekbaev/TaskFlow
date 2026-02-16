import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string | null;
    const taskId = formData.get('taskId') as string | null;
    const category = (formData.get('category') as string) || 'general';
    const activityId = formData.get('activityId') as string | null;
    const calendarEventId = formData.get('calendarEventId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Файл не предоставлен' }, { status: 400 });
    }

    // Determine upload directory
    let subDir = 'general';
    if (projectId) subDir = `projects/${projectId}`;
    else if (taskId) subDir = `tasks/${taskId}`;
    else if (calendarEventId) subDir = `calendar/${calendarEventId}`;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', subDir);
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const ext = path.extname(file.name);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(uploadDir, uniqueName);

    // Write file
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // Save to database
    const relativePath = `/uploads/${subDir}/${uniqueName}`;

    const attachment = await prisma.attachment.create({
      data: {
        fileName: file.name,
        filePath: relativePath,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        category,
        projectId: projectId || null,
        taskId: taskId || null,
        uploadedById: session.userId,
        activityId: activityId || null,
        calendarEventId: calendarEventId || null,
      },
    });

    return NextResponse.json({ attachment });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Ошибка загрузки файла' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const taskId = searchParams.get('taskId');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (taskId) where.taskId = taskId;

    const attachments = await prisma.attachment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ attachments });
  } catch (error) {
    console.error('Get attachments error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
