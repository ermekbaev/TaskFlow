export const BOARD_COLUMNS = [
  { id: '1', name: 'Backlog' },
  { id: '2', name: 'To Do' },
  { id: '3', name: 'In Progress' },
  { id: '4', name: 'Review' },
  { id: '5', name: 'Done' },
];

export const TASK_TYPES = [
  { value: 'task', label: 'Обычная задача', icon: 'ri-task-line' },
  { value: 'recurring', label: 'Регулярная', icon: 'ri-repeat-line' },
  { value: 'parent', label: 'Заглавная задача', icon: 'ri-folder-open-line' },
  { value: 'stage', label: 'Этап', icon: 'ri-git-branch-line' },
];

export const RECURRENCE_OPTIONS = [
  { value: 'daily', label: 'Ежедневно' },
  { value: 'weekly', label: 'Еженедельно' },
  { value: 'biweekly', label: 'Раз в 2 недели' },
  { value: 'monthly', label: 'Ежемесячно' },
];

export const WEEKDAYS = [
  { value: 'mon', label: 'Пн' },
  { value: 'tue', label: 'Вт' },
  { value: 'wed', label: 'Ср' },
  { value: 'thu', label: 'Чт' },
  { value: 'fri', label: 'Пт' },
  { value: 'sat', label: 'Сб' },
  { value: 'sun', label: 'Вс' },
];

export const ACCEPTANCE_STATUSES = [
  { value: '', label: 'Не указан' },
  { value: 'pending', label: 'Ожидает' },
  { value: 'in_review', label: 'На рассмотрении' },
  { value: 'accepted', label: 'Принято' },
  { value: 'rejected', label: 'Отклонено' },
];

export const PRIORITIES = [
  { value: 'P1', label: 'P1 - Критический' },
  { value: 'P2', label: 'P2 - Высокий' },
  { value: 'P3', label: 'P3 - Средний' },
  { value: 'P4', label: 'P4 - Низкий' },
];

export interface TaskFormState {
  title: string;
  description: string;
  status: string;
  priority: string;
  assigneeId: string;
  labels: string;
  dueDate: string;
  startDate: string;
  assignmentDate: string;
  expectedHours: string;
  actualHours: string;
  parentId: string;
}

export interface ParentFieldsState {
  initiatorName: string;
  initiatorEmail: string;
  initiatorPosition: string;
  curatorName: string;
  curatorEmail: string;
  curatorPosition: string;
  acceptanceStatus: string;
}

export interface CustomDate {
  name: string;
  date: string;
}

export const INITIAL_FORM: TaskFormState = {
  title: '',
  description: '',
  status: 'To Do',
  priority: 'P3',
  assigneeId: '',
  labels: '',
  dueDate: '',
  startDate: '',
  assignmentDate: '',
  expectedHours: '',
  actualHours: '',
  parentId: '',
};

export const INITIAL_PARENT_FIELDS: ParentFieldsState = {
  initiatorName: '',
  initiatorEmail: '',
  initiatorPosition: '',
  curatorName: '',
  curatorEmail: '',
  curatorPosition: '',
  acceptanceStatus: '',
};
