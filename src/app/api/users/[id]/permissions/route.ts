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

    if (session.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const permissions = await prisma.userPermission.findMany({
      where: { userId: params.id },
      include: { granter: { select: { name: true } } },
    });

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error('Get permissions error:', error);
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

    if (session.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { permission } = await request.json();
    const validPermissions = ['CREATE_PROJECT', 'VIEW_ALL_STATS', 'MANAGE_USERS'];

    if (!validPermissions.includes(permission)) {
      return NextResponse.json({ error: 'Invalid permission' }, { status: 400 });
    }

    const existing = await prisma.userPermission.findUnique({
      where: { userId_permission: { userId: params.id, permission } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Permission already granted' }, { status: 400 });
    }

    const perm = await prisma.userPermission.create({
      data: {
        userId: params.id,
        permission,
        grantedBy: session.userId,
      },
    });

    return NextResponse.json({ permission: perm });
  } catch (error) {
    console.error('Add permission error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    const { permission } = await request.json();

    await prisma.userPermission.deleteMany({
      where: { userId: params.id, permission },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete permission error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
