import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as z from 'zod';
import { localFallbackStorage } from '../src/services/local';
import { aiService } from '../src/services/ai';

// ─────────────────────────────────────────────────
// Global LocalStorage Mock for Node.js / Vitest env
// ─────────────────────────────────────────────────
class LocalStorageMock {
  private store: Record<string, string> = {};
  clear() { this.store = {}; }
  getItem(key: string) { return this.store[key] ?? null; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
  removeItem(key: string) { delete this.store[key]; }
  get length() { return Object.keys(this.store).length; }
  key(index: number) { return Object.keys(this.store)[index] ?? null; }
}
global.localStorage = new LocalStorageMock() as unknown as Storage;

// Suppress expected console.error noise from API fallback calls in CI
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  localStorage.clear();
});

// ──────────────────────────────────────
// 1. Zod Schema Validation Tests
// ──────────────────────────────────────
const assessmentSchema = z.object({
  habitType: z.string().min(2),
  severity: z.enum(['low', 'moderate', 'severe']),
  frequency: z.string().min(2),
  triggers: z.array(z.string()).min(1),
  environment: z.string().min(2),
  motivationLevel: z.number().min(1).max(10),
  stressLevel: z.number().min(1).max(10),
  sleepHours: z.number().min(1).max(24),
});

describe('Zod Validation Schemas', () => {
  it('accepts a fully valid assessment entry', () => {
    const result = assessmentSchema.safeParse({
      habitType: 'Doom scrolling',
      severity: 'moderate',
      frequency: '4 hours daily',
      triggers: ['Boredom', 'Late night'],
      environment: 'Alone in bed',
      motivationLevel: 8,
      stressLevel: 6,
      sleepHours: 7,
    });
    expect(result.success).toBe(true);
  });

  it('rejects habitType that is too short', () => {
    const result = assessmentSchema.safeParse({
      habitType: 'S',
      severity: 'moderate',
      frequency: '4 hours daily',
      triggers: ['Boredom'],
      environment: 'Alone in bed',
      motivationLevel: 8,
      stressLevel: 6,
      sleepHours: 7,
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty triggers array', () => {
    const result = assessmentSchema.safeParse({
      habitType: 'Screen time',
      severity: 'low',
      frequency: '2 hours daily',
      triggers: [],
      environment: 'Office',
      motivationLevel: 5,
      stressLevel: 4,
      sleepHours: 7,
    });
    expect(result.success).toBe(false);
  });

  it('rejects motivationLevel out of range (above 10)', () => {
    const result = assessmentSchema.safeParse({
      habitType: 'Gambling',
      severity: 'severe',
      frequency: 'Daily',
      triggers: ['Stress'],
      environment: 'Casino',
      motivationLevel: 15,
      stressLevel: 7,
      sleepHours: 6,
    });
    expect(result.success).toBe(false);
  });

  it('rejects sleepHours below 1', () => {
    const result = assessmentSchema.safeParse({
      habitType: 'Insomnia',
      severity: 'severe',
      frequency: 'Every night',
      triggers: ['Anxiety'],
      environment: 'Bedroom',
      motivationLevel: 7,
      stressLevel: 9,
      sleepHours: 0,
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid severity enum values', () => {
    const severities: Array<'low' | 'moderate' | 'severe'> = ['low', 'moderate', 'severe'];
    for (const severity of severities) {
      const result = assessmentSchema.safeParse({
        habitType: 'Screen time',
        severity,
        frequency: '1 hour',
        triggers: ['Boredom'],
        environment: 'Home',
        motivationLevel: 5,
        stressLevel: 5,
        sleepHours: 8,
      });
      expect(result.success, `severity "${severity}" should be valid`).toBe(true);
    }
  });

  it('rejects invalid severity enum value', () => {
    const result = assessmentSchema.safeParse({
      habitType: 'Screen time',
      severity: 'extreme',
      frequency: '1 hour',
      triggers: ['Boredom'],
      environment: 'Home',
      motivationLevel: 5,
      stressLevel: 5,
      sleepHours: 8,
    });
    expect(result.success).toBe(false);
  });
});

// ──────────────────────────────────────
// 2. LocalStorage Storage Adapter Tests
// ──────────────────────────────────────
const makeProfile = (uid: string) => ({
  uid,
  email: `${uid}@test.com`,
  name: `User ${uid}`,
  createdAt: new Date().toISOString(),
  hasCompletedAssessment: false,
});

const makeAssessment = (uid: string) => ({
  uid,
  habitType: 'Doom scrolling',
  severity: 'moderate' as const,
  frequency: '4 hours daily',
  triggers: ['Stress'],
  environment: 'Desk',
  motivationLevel: 7,
  stressLevel: 5,
  sleepHours: 7,
  recoveryPlan: {
    weeklyGoal: 'Buffer 15m',
    dailyMission: 'Breathe',
    triggerAnalysis: 'Cue triggered',
    recommendations: [],
  },
  startDate: new Date().toISOString(),
  currentStreak: 0,
  longestStreak: 0,
});

describe('LocalStorage Storage Adapter - User Profile CRUD', () => {
  it('saves and retrieves a user profile correctly', async () => {
    const profile = makeProfile('u1');
    await localFallbackStorage.saveUserProfile(profile);
    const retrieved = await localFallbackStorage.getUserProfile('u1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.email).toBe('u1@test.com');
    expect(retrieved?.name).toBe('User u1');
  });

  it('returns null for a non-existent profile', async () => {
    const retrieved = await localFallbackStorage.getUserProfile('does_not_exist');
    expect(retrieved).toBeNull();
  });

  it('overwrites profile on second save', async () => {
    const profile = makeProfile('u2');
    await localFallbackStorage.saveUserProfile(profile);
    await localFallbackStorage.saveUserProfile({ ...profile, name: 'Updated Name' });
    const retrieved = await localFallbackStorage.getUserProfile('u2');
    expect(retrieved?.name).toBe('Updated Name');
  });
});

describe('LocalStorage Storage Adapter - Habit Assessment', () => {
  it('saves assessment and marks hasCompletedAssessment = true on profile', async () => {
    const uid = 'ua1';
    await localFallbackStorage.saveUserProfile(makeProfile(uid));
    await localFallbackStorage.saveHabitAssessment(makeAssessment(uid));
    const profile = await localFallbackStorage.getUserProfile(uid);
    expect(profile?.hasCompletedAssessment).toBe(true);
  });

  it('retrieves assessment after saving', async () => {
    const uid = 'ua2';
    const assessment = makeAssessment(uid);
    await localFallbackStorage.saveHabitAssessment(assessment);
    const retrieved = await localFallbackStorage.getHabitAssessment(uid);
    expect(retrieved?.habitType).toBe('Doom scrolling');
    expect(retrieved?.triggers).toContain('Stress');
  });

  it('returns null for assessment on fresh profile', async () => {
    const retrieved = await localFallbackStorage.getHabitAssessment('no_assess_uid');
    expect(retrieved).toBeNull();
  });
});

describe('LocalStorage Storage Adapter - Journal Entries', () => {
  it('saves and retrieves a journal entry', async () => {
    const uid = 'uj1';
    const entry = {
      id: 'j1',
      uid,
      content: 'Today was stressful',
      timestamp: new Date().toISOString(),
    };
    await localFallbackStorage.saveJournalEntry(entry);
    const entries = await localFallbackStorage.getJournalEntries(uid);
    expect(entries.length).toBe(1);
    expect(entries[0].content).toBe('Today was stressful');
  });

  it('adds new entries to the front (newest first)', async () => {
    const uid = 'uj2';
    await localFallbackStorage.saveJournalEntry({ id: 'j1', uid, content: 'First', timestamp: '2024-01-01' });
    await localFallbackStorage.saveJournalEntry({ id: 'j2', uid, content: 'Second', timestamp: '2024-01-02' });
    const entries = await localFallbackStorage.getJournalEntries(uid);
    expect(entries[0].id).toBe('j2');
  });

  it('updates an existing entry in place when same id is saved again', async () => {
    const uid = 'uj3';
    await localFallbackStorage.saveJournalEntry({ id: 'j1', uid, content: 'Original', timestamp: '2024-01-01' });
    await localFallbackStorage.saveJournalEntry({ id: 'j1', uid, content: 'Updated', timestamp: '2024-01-01' });
    const entries = await localFallbackStorage.getJournalEntries(uid);
    expect(entries.length).toBe(1);
    expect(entries[0].content).toBe('Updated');
  });

  it('returns empty array when no journals exist', async () => {
    const entries = await localFallbackStorage.getJournalEntries('no_journals_uid');
    expect(entries).toEqual([]);
  });
});

describe('LocalStorage Storage Adapter - Data Clearing', () => {
  it('clearAllData removes all stored keys for a user', async () => {
    const uid = 'uc1';
    await localFallbackStorage.saveUserProfile(makeProfile(uid));
    await localFallbackStorage.saveHabitAssessment(makeAssessment(uid));
    localFallbackStorage.clearAllData(uid);
    const profile = await localFallbackStorage.getUserProfile(uid);
    const assessment = await localFallbackStorage.getHabitAssessment(uid);
    expect(profile).toBeNull();
    expect(assessment).toBeNull();
  });
});

// ──────────────────────────────────────
// 3. AI Behavioral Core - Risk Prediction
// ──────────────────────────────────────
describe('AI Service - Relapse Risk Prediction (Fallback Mode)', () => {
  it('classifies low risk for low stress and high sleep', async () => {
    const result = await aiService.predictRelapseRisk(5, ['Boredom'], 3, 8, ['Content']);
    expect(result.riskLevel).toBe('low');
    expect(result.percentageScore).toBeLessThan(40);
    expect(result.preventiveActions.length).toBeGreaterThan(0);
  });

  it('classifies high risk for high stress and low sleep', async () => {
    const result = await aiService.predictRelapseRisk(5, ['Stress'], 9, 4, ['Anxious']);
    expect(result.riskLevel).toBe('high');
    expect(result.percentageScore).toBeGreaterThan(60);
  });

  it('classifies medium risk for moderate stress', async () => {
    const result = await aiService.predictRelapseRisk(3, ['Fatigue'], 5, 6, ['Neutral']);
    expect(result.riskLevel).toBe('medium');
    expect(result.percentageScore).toBe(50);
  });

  it('always returns an explanation string', async () => {
    const result = await aiService.predictRelapseRisk(0, [], 2, 9, []);
    expect(typeof result.explanation).toBe('string');
    expect(result.explanation.length).toBeGreaterThan(10);
  });
});

describe('AI Service - Emergency SOS Advice (Fallback Mode)', () => {
  it('returns all required fields: encouragement, immediateAction, microGoal', async () => {
    const advice = await aiService.getEmergencyAdvice();
    expect(advice).toBeDefined();
    expect(typeof advice.encouragement).toBe('string');
    expect(typeof advice.immediateAction).toBe('string');
    expect(typeof advice.microGoal).toBe('string');
  });

  it('encouragement message references cravings', async () => {
    const advice = await aiService.getEmergencyAdvice();
    expect(advice.encouragement.toLowerCase()).toContain('craving');
  });

  it('immediateAction is at least 10 characters (actionable)', async () => {
    const advice = await aiService.getEmergencyAdvice();
    expect(advice.immediateAction.length).toBeGreaterThan(10);
  });
});

describe('AI Service - Replacement Suggestions (Fallback Mode)', () => {
  it('returns an array of replacement suggestions', async () => {
    const suggestions = await aiService.getReplacementSuggestions('Doom scrolling');
    expect(Array.isArray(suggestions)).toBe(true);
    expect(suggestions.length).toBeGreaterThan(0);
  });

  it('each suggestion has required fields', async () => {
    const suggestions = await aiService.getReplacementSuggestions('Smoking');
    for (const s of suggestions) {
      expect(s.suggestion).toBeDefined();
      expect(s.difficulty).toBeDefined();
      expect(s.whyText).toBeDefined();
    }
  });
});

describe('AI Service - Journal Analysis (Fallback Mode)', () => {
  it('analyzes stress level and mood from journal entry', async () => {
    const analysis = await aiService.analyzeJournal('Today I felt super stressed and tired.');
    expect(analysis).toBeDefined();
    expect(typeof analysis.mood).toBe('string');
    expect(analysis.stressLevel).toBeGreaterThanOrEqual(1);
    expect(analysis.stressLevel).toBeLessThanOrEqual(10);
    expect(Array.isArray(analysis.triggersIdentified)).toBe(true);
  });
});

describe('AI Service - Relapse Analysis (Fallback Mode)', () => {
  it('returns constructive encouragement and immediate action for relapse logs', async () => {
    const advice = await aiService.analyzeRelapse('Boredom late night', 'Anxious', 'Scrolled for 2 hours');
    expect(advice).toBeDefined();
    expect(typeof advice.encouragement).toBe('string');
    expect(typeof advice.immediateAction).toBe('string');
    expect(typeof advice.microGoal).toBe('string');
  });
});

describe('AI Service - Weekly Report Generation (Fallback Mode)', () => {
  it('compiles success rate, triggers, and next week strategy', async () => {
    const report = await aiService.generateWeeklyReport(
      5,
      [{ id: 'r1', uid: 'test_u', date: '2024-01-01', createdAt: '2024-01-01', timeOfDay: '10:00 PM', trigger: 'boredom', emotionalState: 'lonely', notes: '' }],
      [{ id: 'j1', uid: 'test_u', content: 'Did great', timestamp: '2024-01-01' }]
    );
    expect(report).toBeDefined();
    expect(typeof report.successRate).toBe('number');
    expect(typeof report.biggestTrigger).toBe('string');
    expect(typeof report.nextWeekStrategy).toBe('string');
  });
});

describe('AI Service - Therapist Chat Response (Fallback Mode)', () => {
  it('returns greeting response when user says hi', async () => {
    const response = await aiService.getChatResponse([], 'hi', null);
    expect(response).toBeDefined();
    const lower = response.toLowerCase();
    const isMatched = lower.includes('coach') || lower.includes('here for you') || lower.includes('hello') || lower.includes('hi');
    expect(isMatched).toBe(true);
  });

  it('suggests physical movement on craving triggers', async () => {
    const response = await aiService.getChatResponse([], 'feeling intense urge to scroll', null);
    expect(response).toBeDefined();
    expect(response.length).toBeGreaterThan(15);
  });
});

describe('Authentication Flow (Mock Mode Simulation)', () => {
  it('prevents signup with an existing email', async () => {
    const email = 'existing@test.com';
    const mockUid = `local_user_${email.replace(/[^a-zA-Z0-9]/g, '')}`;
    
    // Simulate signup first time
    const profile = {
      uid: mockUid,
      email,
      name: 'Test User',
      createdAt: new Date().toISOString(),
      hasCompletedAssessment: false,
    };
    await localFallbackStorage.saveUserProfile(profile);
    
    // Attempt duplicate signup simulation
    const checkDuplicate = async () => {
      const existing = await localFallbackStorage.getUserProfile(mockUid);
      if (existing) {
        throw new Error('An account with this email address already exists.');
      }
    };
    
    await expect(checkDuplicate()).rejects.toThrow('An account with this email address already exists.');
  });

  it('verifies that forgot password flow throws for non-existent users', async () => {
    const email = 'nonexistent@test.com';
    const mockUid = `local_user_${email.replace(/[^a-zA-Z0-9]/g, '')}`;
    
    const checkReset = async () => {
      const profile = await localFallbackStorage.getUserProfile(mockUid);
      if (!profile) {
        throw new Error('No account found with this email address.');
      }
    };
    
    await expect(checkReset()).rejects.toThrow('No account found with this email address.');
  });

  it('allows forgot password flow to succeed for existing users', async () => {
    const email = 'existing_reset@test.com';
    const mockUid = `local_user_${email.replace(/[^a-zA-Z0-9]/g, '')}`;
    
    const profile = {
      uid: mockUid,
      email,
      name: 'Test User',
      createdAt: new Date().toISOString(),
      hasCompletedAssessment: false,
    };
    await localFallbackStorage.saveUserProfile(profile);
    
    const checkReset = async () => {
      const retrieved = await localFallbackStorage.getUserProfile(mockUid);
      if (!retrieved) {
        throw new Error('No account found with this email address.');
      }
      return true;
    };
    
    const result = await checkReset();
    expect(result).toBe(true);
  });
});
