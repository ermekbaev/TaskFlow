import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Local date string without UTC shift
function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Map weekday abbreviations to JS getDay() values (0=Sun)
const WEEKDAY_NUM: Record<string, number> = {
  mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0,
};

// Expand a recurring task into individual occurrence dates
function expandRecurringDates(
  startDateStr: string | null,
  dueDateStr: string | null,
  pattern: string | null,
  recurrenceDaysJson: string | null
): string[] {
  if (!startDateStr) return [];

  const recDays: string[] = recurrenceDaysJson
    ? JSON.parse(recurrenceDaysJson)
    : [];

  const startDate = new Date(startDateStr + "T00:00:00");

  // Limit to 1 year from today
  const maxWindow = new Date();
  maxWindow.setFullYear(maxWindow.getFullYear() + 1);

  // If no dueDate, use maxWindow so recurring events aren't clipped to single day
  const dueDate = dueDateStr
    ? new Date(dueDateStr + "T00:00:00")
    : maxWindow;
  const endDate = dueDate < maxWindow ? dueDate : maxWindow;

  const dates: string[] = [];
  const current = new Date(startDate);

  if (!pattern || pattern === "monthly") {
    while (current <= endDate) {
      dates.push(toLocalDateStr(current));
      current.setMonth(current.getMonth() + 1);
    }
    return dates;
  }

  if (pattern === "daily") {
    while (current <= endDate) {
      dates.push(toLocalDateStr(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  if (pattern === "weekly" || pattern === "biweekly") {
    // For biweekly, find week index from start (aligning to Monday)
    const weekStartMs = startDate.getTime();

    while (current <= endDate) {
      const dow = current.getDay();
      const dayMatches =
        recDays.length === 0 || recDays.some((d) => WEEKDAY_NUM[d] === dow);

      if (dayMatches) {
        if (pattern === "weekly") {
          dates.push(toLocalDateStr(current));
        } else {
          // biweekly: every 2 weeks
          const daysDiff = Math.floor(
            (current.getTime() - weekStartMs) / 86400000
          );
          const weekIndex = Math.floor(daysDiff / 7);
          if (weekIndex % 2 === 0) {
            dates.push(toLocalDateStr(current));
          }
        }
      }
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  return [toLocalDateStr(startDate)];
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get personal calendar events
    const events = await prisma.calendarEvent.findMany({
      where: { userId: session.userId },
      orderBy: { startDate: "asc" },
      include: {
        attachments: {
          select: {
            id: true,
            fileName: true,
            filePath: true,
            fileSize: true,
            mimeType: true,
            category: true,
            createdAt: true,
          },
        },
      },
    });

    // Get task call events where user is assigned (either primary or additional)
    const taskWithCallEvents = await prisma.task.findMany({
      where: {
        isCallEvent: true,
        OR: [
          { assigneeId: session.userId },
          { assignees: { some: { userId: session.userId } } },
        ],
      },
      select: {
        id: true,
        title: true,
        callStartTime: true,
        callEndTime: true,
        startDate: true,
        dueDate: true,
        key: true,
        isRecurring: true,
        recurrencePattern: true,
        recurrenceDays: true,
        project: { select: { name: true } },
      },
    });

    // Convert task call events to calendar format, expanding recurring ones
    const taskCallEventsFormatted = taskWithCallEvents.flatMap((task) => {
      const fallbackDate = toLocalDateStr(new Date());
      const baseDate = task.startDate || task.dueDate || fallbackDate;

      // Determine which dates this event appears on
      const dates =
        task.isRecurring && task.recurrencePattern
          ? expandRecurringDates(
              task.startDate,
              task.dueDate,
              task.recurrencePattern,
              task.recurrenceDays
            )
          : [baseDate];

      return dates.map((dateStr, idx) => ({
        id: `task-${task.id}-${idx}`,
        title: `[Встреча] ${task.title} (${task.key})`,
        description: `Встреча для задачи ${task.key} - ${task.project.name}`,
        startDate: dateStr,
        endDate: dateStr,
        startTime: task.callStartTime || "09:00",
        endTime: task.callEndTime || "10:00",
        color: "bg-purple-100 text-purple-700",
        type: "meeting" as const,
        completed: false,
        userId: session.userId,
        reminderTime: null,
        reminderSent: false,
        attachments: [],
      }));
    });

    // Combine personal events and task call events
    const allEvents = [...events, ...taskCallEventsFormatted];

    return NextResponse.json({ events: allEvents });
  } catch (error) {
    console.error("Get calendar events error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      title,
      description,
      startDate,
      endDate,
      startTime,
      endTime,
      color,
      type,
      reminderTime,
    } = await req.json();

    if (!title || !startDate || !endDate) {
      return NextResponse.json(
        { error: "title, startDate, endDate обязательны" },
        { status: 400 },
      );
    }

    const event = await prisma.calendarEvent.create({
      data: {
        userId: session.userId,
        title,
        description: description || "",
        startDate,
        endDate,
        startTime: startTime || "09:00",
        endTime: endTime || "10:00",
        color: color || "bg-sky-100 text-sky-700",
        type: type || "personal",
        reminderTime: reminderTime || null,
      },
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Create calendar event error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      id,
      title,
      description,
      startDate,
      endDate,
      startTime,
      endTime,
      color,
      type,
      completed,
      reminderTime,
      reminderSent,
    } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "id обязателен" }, { status: 400 });
    }

    const existing = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
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
    console.error("Update calendar event error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "id обязателен" }, { status: 400 });
    }

    const existing = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.calendarEvent.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete calendar event error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
