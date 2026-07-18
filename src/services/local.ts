import type { StorageService } from './storage';
import type { UserProfile, HabitAssessment, JournalEntry, RelapseLog, WeeklyReport, ChatMessage } from '../types/habit';

export class LocalStorageService implements StorageService {
  private getKeys(uid: string) {
    return {
      profile: `mindshift_profile_${uid}`,
      assessment: `mindshift_assessment_${uid}`,
      journals: `mindshift_journals_${uid}`,
      relapses: `mindshift_relapses_${uid}`,
      reports: `mindshift_reports_${uid}`,
      chat: `mindshift_chat_${uid}`,
    };
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const keys = this.getKeys(uid);
    const data = localStorage.getItem(keys.profile);
    return data ? JSON.parse(data) as UserProfile : null;
  }

  async saveUserProfile(profile: UserProfile): Promise<void> {
    const keys = this.getKeys(profile.uid);
    localStorage.setItem(keys.profile, JSON.stringify(profile));
  }

  async getHabitAssessment(uid: string): Promise<HabitAssessment | null> {
    const keys = this.getKeys(uid);
    const data = localStorage.getItem(keys.assessment);
    return data ? JSON.parse(data) as HabitAssessment : null;
  }

  async saveHabitAssessment(assessment: HabitAssessment): Promise<void> {
    const keys = this.getKeys(assessment.uid);
    localStorage.setItem(keys.assessment, JSON.stringify(assessment));

    // Update user profile hasCompletedAssessment state
    const profile = await this.getUserProfile(assessment.uid);
    if (profile) {
      profile.hasCompletedAssessment = true;
      await this.saveUserProfile(profile);
    }
  }

  async getJournalEntries(uid: string): Promise<JournalEntry[]> {
    const keys = this.getKeys(uid);
    const data = localStorage.getItem(keys.journals);
    return data ? (JSON.parse(data) as JournalEntry[]) : [];
  }

  async saveJournalEntry(entry: JournalEntry): Promise<void> {
    const keys = this.getKeys(entry.uid);
    const entries = await this.getJournalEntries(entry.uid);

    const existingIndex = entries.findIndex((e) => e.id === entry.id);
    if (existingIndex > -1) {
      entries[existingIndex] = entry;
    } else {
      entries.unshift(entry); // New entries first
    }

    localStorage.setItem(keys.journals, JSON.stringify(entries));
  }

  async getRelapseLogs(uid: string): Promise<RelapseLog[]> {
    const keys = this.getKeys(uid);
    const data = localStorage.getItem(keys.relapses);
    return data ? (JSON.parse(data) as RelapseLog[]) : [];
  }

  async saveRelapseLog(log: RelapseLog): Promise<void> {
    const keys = this.getKeys(log.uid);
    const logs = await this.getRelapseLogs(log.uid);

    const existingIndex = logs.findIndex((l) => l.id === log.id);
    if (existingIndex > -1) {
      logs[existingIndex] = log;
    } else {
      logs.unshift(log); // New logs first
    }

    localStorage.setItem(keys.relapses, JSON.stringify(logs));
  }

  async getWeeklyReports(uid: string): Promise<WeeklyReport[]> {
    const keys = this.getKeys(uid);
    const data = localStorage.getItem(keys.reports);
    return data ? (JSON.parse(data) as WeeklyReport[]) : [];
  }

  async saveWeeklyReport(report: WeeklyReport): Promise<void> {
    const keys = this.getKeys(report.uid);
    const reports = await this.getWeeklyReports(report.uid);

    const existingIndex = reports.findIndex((r) => r.id === report.id);
    if (existingIndex > -1) {
      reports[existingIndex] = report;
    } else {
      reports.unshift(report);
    }

    localStorage.setItem(keys.reports, JSON.stringify(reports));
  }

  async getChatHistory(uid: string): Promise<ChatMessage[]> {
    const keys = this.getKeys(uid);
    const data = localStorage.getItem(keys.chat);
    return data ? (JSON.parse(data) as ChatMessage[]) : [];
  }

  async saveChatMessage(uid: string, message: ChatMessage): Promise<void> {
    const keys = this.getKeys(uid);
    const history = await this.getChatHistory(uid);
    history.push(message);
    localStorage.setItem(keys.chat, JSON.stringify(history));
  }

  async clearAllData(uid: string): Promise<void> {
    const keys = this.getKeys(uid);
    Object.values(keys).forEach((key) => localStorage.removeItem(key));
  }
}
export const localFallbackStorage = new LocalStorageService();
