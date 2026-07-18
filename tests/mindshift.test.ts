import { describe, it, expect, beforeEach } from 'vitest';
import * as z from 'zod';
import { localFallbackStorage } from '../src/services/local';
import { aiService } from '../src/services/ai';

// Global LocalStorage Mock for Node.js Vitest environment
class LocalStorageMock {
  private store: Record<string, string> = {};
  clear() { this.store = {}; }
  getItem(key: string) { return this.store[key] || null; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
  removeItem(key: string) { delete this.store[key]; }
}
global.localStorage = new LocalStorageMock() as any;

// 1. Zod Schema Verification
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
  it('accepts fully populated correct assessment entries', () => {
    const validData = {
      habitType: 'Doom scrolling',
      severity: 'moderate' as const,
      frequency: '4 hours daily',
      triggers: ['Boredom', 'Late night'],
      environment: 'Alone in bed',
      motivationLevel: 8,
      stressLevel: 6,
      sleepHours: 7,
    };
    const result = assessmentSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects assessments missing required fields or triggers', () => {
    const invalidData = {
      habitType: 'S', // too short
      severity: 'moderate' as const,
      frequency: '4 hours daily',
      triggers: [], // must have at least 1 trigger
      environment: 'Alone in bed',
      motivationLevel: 12, // out of range (1-10)
      stressLevel: 5,
      sleepHours: -1, // out of range (1-24)
    };
    const result = assessmentSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

// 2. Storage Adapter Synchronization Tests
describe('LocalStorage Storage Adapter CRUD', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('correctly persists and retrieves user profiles', async () => {
    const mockUid = 'user_999';
    const profile = {
      uid: mockUid,
      email: 'tester@example.com',
      name: 'Code Tester',
      createdAt: new Date().toISOString(),
      hasCompletedAssessment: false,
    };

    await localFallbackStorage.saveUserProfile(profile);
    const retrieved = await localFallbackStorage.getUserProfile(mockUid);
    
    expect(retrieved).not.toBeNull();
    expect(retrieved?.email).toBe(profile.email);
    expect(retrieved?.name).toBe(profile.name);
  });

  it('registers assessment completion status in profile', async () => {
    const mockUid = 'user_888';
    const profile = {
      uid: mockUid,
      email: 'tester2@example.com',
      name: 'Code Tester 2',
      createdAt: new Date().toISOString(),
      hasCompletedAssessment: false,
    };

    const assessment = {
      uid: mockUid,
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
        recommendations: []
      },
      startDate: new Date().toISOString(),
      currentStreak: 0,
      longestStreak: 0,
    };

    // Save profile first
    await localFallbackStorage.saveUserProfile(profile);
    
    // Save assessment (should trigger hasCompletedAssessment = true)
    await localFallbackStorage.saveHabitAssessment(assessment);
    
    const updatedProfile = await localFallbackStorage.getUserProfile(mockUid);
    expect(updatedProfile?.hasCompletedAssessment).toBe(true);
  });
});

// 3. AI Behavioral Core Predictions & Grounding Advice
describe('AI Behavioral Core Fallbacks & Calculations', () => {
  it('properly evaluates low relapse risk for low stress & high sleep conditions', async () => {
    const result = await aiService.predictRelapseRisk(
      5,          // streak
      ['Boredom'], // triggers
      3,          // stressLevel
      8,          // sleepHours
      ['Content'] // recent moods
    );

    expect(result.riskLevel).toBe('low');
    expect(result.percentageScore).toBeLessThan(40);
  });

  it('properly evaluates high relapse risk for high stress & low sleep conditions', async () => {
    const result = await aiService.predictRelapseRisk(
      5,
      ['Stress'],
      9,
      4,
      ['Anxious']
    );

    expect(result.riskLevel).toBe('high');
    expect(result.percentageScore).toBeGreaterThan(60);
    expect(result.preventiveActions.length).toBeGreaterThan(0);
  });

  it('produces empathetic grounding guidelines during craving emergencies', async () => {
    const advice = await aiService.getEmergencyAdvice();
    expect(advice).toBeDefined();
    expect(advice.encouragement).toContain('craving');
    expect(advice.immediateAction.length).toBeGreaterThan(10);
    expect(advice.microGoal.length).toBeGreaterThan(5);
  });
});
