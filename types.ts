// FIX: Import React to resolve namespace error for React.ComponentType.
import React from 'react';

export enum TaskStatus {
  Pending = 'ממתין',
  InProgress = 'בתהליך',
  Completed = 'הושלם'
}

export interface Task {
  id: string;
  name: string;
  status: TaskStatus;
}

export interface Phase {
  id: string;
  title: string;
  timeline: string;
  goals: string[];
  tasks: Task[];
  status: TaskStatus;
  icon: React.ComponentType<{ className?: string }>;
}
