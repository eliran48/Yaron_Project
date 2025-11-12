export enum TaskStatus {
  Pending = 'ממתין',
  InProgress = 'בתהליך',
  Completed = 'הושלם'
}

export interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  hours: number;
}

export interface Phase {
  id: string;
  title: string;
  timeline: string;
  goals: string[];
  tasks: Task[];
  status: TaskStatus;
  icon: string;
}