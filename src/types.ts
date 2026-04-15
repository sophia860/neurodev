export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  onboardingCompleted: boolean;
  energyLevel: number; // 0-100
  lastCheckIn: string; // ISO date
  role: 'user' | 'admin';
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: 'todo' | 'doing' | 'done';
  energyRequired: 'low' | 'medium' | 'high';
  createdAt: string;
  completedAt?: string;
  order: number;
}

export interface DumpItem {
  id: string;
  userId: string;
  content: string;
  type: 'text' | 'voice' | 'image';
  createdAt: string;
  processed: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  type: string;
  rate: string;
  status: 'active' | 'pending' | 'paused';
  color: string;
  textColor: string;
  initials: string;
  createdAt: string;
}

export interface Job {
  id: string;
  role: string;
  company: string;
  pay: string;
  signals: { t: string; c: string }[];
  dayToDay: string;
  need: string[];
  nice: string[];
  fit: string;
  status: 'spotted' | 'applied' | 'heard' | 'interview' | 'offer' | 'dismissed';
}

export interface Invoice {
  id: string;
  userId: string;
  clientName: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'overdue';
}

export interface TaskTemplate {
  id: string;
  userId: string;
  title: string;
  description?: string;
  energyRequired: 'low' | 'medium' | 'high';
  createdAt: string;
}
