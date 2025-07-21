export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: UserRole
  permissions: Permission[]
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
  department?: string
  phoneNumber?: string
  address?: string
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
}

export interface UserRole {
  id: string
  name: string
  description: string
  permissions: Permission[]
  isSystem: boolean
  createdAt: Date
}

export interface Permission {
  id: string
  name: string
  description: string
  resource: string
  action: string
  category: string
}

export interface TimeEntry {
  id: string
  userId: string
  clockIn: Date
  clockOut?: Date
  breakStart?: Date
  breakEnd?: Date
  totalHours?: number
  overtimeHours?: number
  notes?: string
  status: "active" | "completed" | "pending_approval"
  approvedBy?: string
  approvedAt?: Date
}

export interface Shift {
  id: string
  name: string
  startTime: string // HH:MM format
  endTime: string
  daysOfWeek: number[] // 0-6, Sunday = 0
  isActive: boolean
  maxEmployees?: number
  description?: string
}

export interface Schedule {
  id: string
  userId: string
  shiftId: string
  date: Date
  status: "scheduled" | "completed" | "absent" | "late"
  notes?: string
  createdBy: string
  createdAt: Date
}

export interface PerformanceMetric {
  id: string
  userId: string
  metricType: "sales" | "customer_satisfaction" | "attendance" | "productivity"
  value: number
  target?: number
  period: "daily" | "weekly" | "monthly" | "quarterly"
  date: Date
  notes?: string
}

export interface TrainingModule {
  id: string
  title: string
  description: string
  content: string
  category: string
  estimatedDuration: number // in minutes
  isRequired: boolean
  prerequisites?: string[]
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface UserTraining {
  id: string
  userId: string
  moduleId: string
  status: "not_started" | "in_progress" | "completed" | "failed"
  startedAt?: Date
  completedAt?: Date
  score?: number
  attempts: number
  notes?: string
}