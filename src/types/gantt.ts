export interface GanttTask {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  progress: number;
  assigneeId: string;
  assigneeName: string;
  assigneeAvatar?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
  projectId: string;
  projectName: string;
  projectColor: string;
  parentId?: string;
  dependencies?: string[];
  isMilestone?: boolean;
  description?: string;
  estimatedHours?: number;
  actualHours?: number;
  children?: GanttTask[];
}

// DB status → Gantt status
export function mapDbStatusToGantt(dbStatus: string): GanttTask['status'] {
  switch (dbStatus) {
    case 'Backlog':
    case 'To Do':
      return 'not_started';
    case 'In Progress':
    case 'Review':
      return 'in_progress';
    case 'Done':
      return 'completed';
    default:
      return 'not_started';
  }
}

// Gantt status → DB status
export function mapGanttStatusToDb(ganttStatus: GanttTask['status']): string {
  switch (ganttStatus) {
    case 'not_started':
      return 'Backlog';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Done';
    case 'on_hold':
      return 'Backlog';
    default:
      return 'Backlog';
  }
}

// DB priority → Gantt priority
export function mapDbPriorityToGantt(dbPriority: string): GanttTask['priority'] {
  switch (dbPriority) {
    case 'P1':
      return 'critical';
    case 'P2':
      return 'high';
    case 'P3':
      return 'medium';
    case 'P4':
      return 'low';
    default:
      return 'medium';
  }
}

// Gantt priority → DB priority
export function mapGanttPriorityToDb(ganttPriority: GanttTask['priority']): string {
  switch (ganttPriority) {
    case 'critical':
      return 'P1';
    case 'high':
      return 'P2';
    case 'medium':
      return 'P3';
    case 'low':
      return 'P4';
    default:
      return 'P3';
  }
}
