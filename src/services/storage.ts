import type { UserProfile, HabitAssessment, JournalEntry, RelapseLog, WeeklyReport, ChatMessage } from '../types/habit';

export interface StorageService {
  getUserProfile(uid: string): Promise<UserProfile | null>;
  saveUserProfile(profile: UserProfile): Promise<void>;
  
  getHabitAssessment(uid: string): Promise<HabitAssessment | null>;
  saveHabitAssessment(assessment: HabitAssessment): Promise<void>;
  
  getJournalEntries(uid: string): Promise<JournalEntry[]>;
  saveJournalEntry(entry: JournalEntry): Promise<void>;
  
  getRelapseLogs(uid: string): Promise<RelapseLog[]>;
  saveRelapseLog(log: RelapseLog): Promise<void>;
  
  getWeeklyReports(uid: string): Promise<WeeklyReport[]>;
  saveWeeklyReport(report: WeeklyReport): Promise<void>;
  
  getChatHistory(uid: string): Promise<ChatMessage[]>;
  saveChatMessage(uid: string, message: ChatMessage): Promise<void>;
  
  clearAllData(uid: string): Promise<void>;
}

// Check if Firebase variables are properly set
export const isFirebaseConfigured = (): boolean => {
  return !!(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID
  );
};

import { localFallbackStorage } from './local';
import { firestoreStorage } from './firestore';

export const storageService: StorageService = isFirebaseConfigured()
  ? firestoreStorage
  : localFallbackStorage;

