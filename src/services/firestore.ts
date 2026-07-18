import { db } from '../firebase/config';
import type { StorageService } from './storage';
import type { UserProfile, HabitAssessment, JournalEntry, RelapseLog, WeeklyReport, ChatMessage } from '../types/habit';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  writeBatch
} from 'firebase/firestore';

export class FirestoreStorageService implements StorageService {
  private assertDb() {
    if (!db) {
      throw new Error('Firestore is not initialized. Check your Firebase credentials.');
    }
    return db;
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const firestore = this.assertDb();
    const docRef = doc(firestore, 'users', uid);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() as UserProfile : null;
  }

  async saveUserProfile(profile: UserProfile): Promise<void> {
    const firestore = this.assertDb();
    const docRef = doc(firestore, 'users', profile.uid);
    await setDoc(docRef, profile, { merge: true });
  }

  async getHabitAssessment(uid: string): Promise<HabitAssessment | null> {
    const firestore = this.assertDb();
    const docRef = doc(firestore, 'habit_assessments', uid);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() as HabitAssessment : null;
  }

  async saveHabitAssessment(assessment: HabitAssessment): Promise<void> {
    const firestore = this.assertDb();
    const docRef = doc(firestore, 'habit_assessments', assessment.uid);
    await setDoc(docRef, assessment, { merge: true });
    
    // Update user profile hasCompletedAssessment state
    const profile = await this.getUserProfile(assessment.uid);
    if (profile) {
      profile.hasCompletedAssessment = true;
      await this.saveUserProfile(profile);
    }
  }

  async getJournalEntries(uid: string): Promise<JournalEntry[]> {
    const firestore = this.assertDb();
    const colRef = collection(firestore, 'journals');
    const q = query(colRef, where('uid', '==', uid), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const entries: JournalEntry[] = [];
    snap.forEach((docSnap) => {
      entries.push({ id: docSnap.id, ...docSnap.data() } as JournalEntry);
    });
    return entries;
  }

  async saveJournalEntry(entry: JournalEntry): Promise<void> {
    const firestore = this.assertDb();
    const docRef = doc(firestore, 'journals', entry.id);
    await setDoc(docRef, entry, { merge: true });
  }

  async getRelapseLogs(uid: string): Promise<RelapseLog[]> {
    const firestore = this.assertDb();
    const colRef = collection(firestore, 'relapses');
    const q = query(colRef, where('uid', '==', uid), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const logs: RelapseLog[] = [];
    snap.forEach((docSnap) => {
      logs.push({ id: docSnap.id, ...docSnap.data() } as RelapseLog);
    });
    return logs;
  }

  async saveRelapseLog(log: RelapseLog): Promise<void> {
    const firestore = this.assertDb();
    const docRef = doc(firestore, 'relapses', log.id);
    await setDoc(docRef, log, { merge: true });
  }

  async getWeeklyReports(uid: string): Promise<WeeklyReport[]> {
    const firestore = this.assertDb();
    const colRef = collection(firestore, 'weekly_reports');
    const q = query(colRef, where('uid', '==', uid), orderBy('weekStartDate', 'desc'));
    const snap = await getDocs(q);
    const reports: WeeklyReport[] = [];
    snap.forEach((docSnap) => {
      reports.push({ id: docSnap.id, ...docSnap.data() } as WeeklyReport);
    });
    return reports;
  }

  async saveWeeklyReport(report: WeeklyReport): Promise<void> {
    const firestore = this.assertDb();
    const docRef = doc(firestore, 'weekly_reports', report.id);
    await setDoc(docRef, report, { merge: true });
  }

  async getChatHistory(uid: string): Promise<ChatMessage[]> {
    const firestore = this.assertDb();
    const colRef = collection(firestore, `users/${uid}/chats`);
    const q = query(colRef, orderBy('timestamp', 'asc'), limit(100));
    const snap = await getDocs(q);
    const messages: ChatMessage[] = [];
    snap.forEach((docSnap) => {
      messages.push(docSnap.data() as ChatMessage);
    });
    return messages;
  }

  async saveChatMessage(uid: string, message: ChatMessage): Promise<void> {
    const firestore = this.assertDb();
    const docRef = doc(firestore, `users/${uid}/chats`, message.id);
    await setDoc(docRef, message);
  }

  async clearAllData(uid: string): Promise<void> {
    const firestore = this.assertDb();
    const batch = writeBatch(firestore);
    
    // Clear profile
    batch.delete(doc(firestore, 'users', uid));
    // Clear assessment
    batch.delete(doc(firestore, 'habit_assessments', uid));
    
    // Delete journal entries, relapse logs, reports and chats
    const collectionsToDelete = [
      query(collection(firestore, 'journals'), where('uid', '==', uid)),
      query(collection(firestore, 'relapses'), where('uid', '==', uid)),
      query(collection(firestore, 'weekly_reports'), where('uid', '==', uid)),
      query(collection(firestore, `users/${uid}/chats`))
    ];
    
    for (const q of collectionsToDelete) {
      const snap = await getDocs(q);
      snap.forEach(docSnap => {
        batch.delete(docSnap.ref);
      });
    }
    
    await batch.commit();
  }
}

export const firestoreStorage = new FirestoreStorageService();
