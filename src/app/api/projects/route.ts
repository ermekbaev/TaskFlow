import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Пользователь видит только проекты, где он владелец или участник
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: session.userId },
          { members: { some: { userId: session.userId } } },
        ],
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is MANAGER or has CREATE_PROJECT permission
    if (session.role !== 'PM') {
      const perm = await prisma.userPermission.findUnique({
        where: {
          userId_permission: {
            userId: session.userId,
            permission: 'CREATE_PROJECT',
          },
        },
      });
      if (!perm) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const {
      name, key, description,
      contractNumber, contractSignDate, contractEndDate,
      rate, contractAmount, externalLaborCost, internalLaborCost,
    } = await request.json();

    if (!name || !key) {
      return NextResponse.json({ error: 'Название и ключ обязательны' }, { status: 400 });
    }

    const existing = await prisma.project.findUnique({ where: { key } });
    if (existing) {
      return NextResponse.json({ error: 'Проект с таким ключом уже существует' }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        name,
        key: key.toUpperCase(),
        description: description || '',
        ownerId: session.userId,
        contractNumber: contractNumber || null,
        contractSignDate: contractSignDate || null,
        contractEndDate: contractEndDate || null,
        rate: rate ? parseFloat(rate) : null,
        contractAmount: contractAmount ? parseFloat(contractAmount) : null,
        externalLaborCost: externalLaborCost ? parseFloat(externalLaborCost) : null,
        internalLaborCost: internalLaborCost ? parseFloat(internalLaborCost) : null,
        members: {
          create: {
            userId: session.userId,
            roleInProject: 'PM',
          },
        },
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        _count: { select: { tasks: true } },
      },
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
