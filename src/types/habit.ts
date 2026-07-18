export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  createdAt: string;
  hasCompletedAssessment: boolean;
}

export type SeverityLevel = 'low' | 'moderate' | 'severe';

export interface RecoveryPlan {
  weeklyGoal: string;
  dailyMission: string;
  triggerAnalysis: string;
  recommendations: string[];
}

export interface HabitAssessment {
  uid: string;
  habitType: string;         // e.g., "Doom scrolling", "Smoking", "Alcohol"
  severity: SeverityLevel;
  frequency: string;         // e.g., "10 times a day", "4 hours daily"
  triggers: string[];        // e.g., ["Stress", "Boredom", "Late night"]
  environment: string;       // e.g., "Bedroom alone", "At desk during work"
  motivationLevel: number;   // 1 to 10
  stressLevel: number;       // 1 to 10
  sleepHours: number;        // Average hours of sleep
  recoveryPlan: RecoveryPlan;
  startDate: string;         // ISO string
  currentStreak: number;
  longestStreak: number;
}

export interface JournalAnalysis {
  mood: string;
  stressLevel: number;
  triggersIdentified: string[];
  improvements: string;
  patterns: string;
}

export interface JournalEntry {
  id: string;
  uid: string;
  date: string;              // YYYY-MM-DD
  createdAt: string;         // ISO string
  content: string;
  aiAnalysis?: JournalAnalysis;
}

export interface RelapseAdvice {
  encouragement: string;
  immediateAction: string;
  microGoal: string;
}

export interface RelapseLog {
  id: string;
  uid: string;
  date: string;              // YYYY-MM-DD
  createdAt: string;         // ISO string
  timeOfDay: string;         // e.g., "10:30 PM"
  trigger: string;           // Selected trigger or custom
  emotionalState: string;    // e.g., "Stressed", "Lonely"
  notes: string;
  aiRecoveryAdvice?: RelapseAdvice;
}

export interface WeeklyReport {
  id: string;
  uid: string;
  weekStartDate: string;     // YYYY-MM-DD
  successRate: number;       // Percentage of days without relapse (0 to 100)
  streak: number;
  biggestTrigger: string;
  bestImprovement: string;
  emotionalPattern: string;
  personalizedAdvice: string;
  nextWeekStrategy: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;         // ISO string
}
