import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email } = await req.json();

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Имя и email обязательны' }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({
      where: { email, NOT: { id: session.userId } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Этот email уже используется' }, { status: 409 });
    }

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: { name: name.trim(), email: email.trim() },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
