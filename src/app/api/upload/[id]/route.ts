import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { unlink } from 'fs/promises';
import path from 'path';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id: params.id },
    });

    if (!attachment) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 404 });
    }

    // Delete file from filesystem
    try {
      const filePath = path.join(process.cwd(), 'public', attachment.filePath);
      await unlink(filePath);
    } catch {
      // File may not exist on disk, continue with DB cleanup
    }

    // Delete from database
    await prisma.attachment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete attachment error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
