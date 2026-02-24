import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, hashPassword } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const isManager = session.role === 'PM';

    // If projectId provided, filter by project members only
    let where: any = { isActive: true };
    if (projectId) {
      const members = await prisma.projectMember.findMany({
        where: { projectId },
        select: { userId: true },
      });
      const memberIds = members.map(m => m.userId);
      where.id = { in: memberIds };
    }

    const users = await prisma.user.findMany({
      where,
      include: isManager ? { permissions: true } : undefined,
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      users: users.map(u => {
        const base = {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          isActive: u.isActive,
        };
        if (isManager) {
          return {
            ...base,
            createdAt: u.createdAt,
            permissions: (u as any).permissions?.map((p: any) => p.permission) || [],
          };
        }
        return base;
      }),
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role !== 'PM') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, email, password, role } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Все поля обязательны' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Пользователь с таким email уже существует' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'DEV',
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        permissions: [],
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
