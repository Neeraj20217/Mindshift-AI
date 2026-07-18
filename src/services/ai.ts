import { GoogleGenerativeAI } from '@google/generative-ai';
import type { RecoveryPlan, JournalAnalysis, RelapseAdvice, WeeklyReport, HabitAssessment } from '../types/habit';

// Initialize the Google Generative AI SDK safely
const getGeminiModel = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey.startsWith('YOUR_') || apiKey === 'AQ.Ab8RN6JOmYDbufTHApOmRZvDl7rDq4YWywgsfSb-oK-JLE2H-w_MOCK') {
    return null;
  }
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });
  } catch (error) {
    console.error('Failed to initialize Gemini Client:', error);
    return null;
  }
};

const getGeminiChatModel = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey.startsWith('YOUR_')) return null;
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  } catch {
    return null;
  }
};

// Fallback Generators for High-Fidelity Simulated Experience
const generateMockRecoveryPlan = (habit: string, _severity: string, triggers: string[]): RecoveryPlan => {
  const triggerList = triggers.length > 0 ? triggers.join(', ') : 'stress and daily routine';
  return {
    weeklyGoal: `Limit ${habit} triggers and establish a 15-minute buffer period.`,
    dailyMission: `When triggered by ${triggers[0] || 'stress'}, perform 10 cycles of box breathing instead of engaging in ${habit}.`,
    triggerAnalysis: `Your habit of ${habit} is highly correlated with triggers like ${triggerList}. This creates a loop: Trigger -> Boredom/Anxiety -> Engagement -> Temporary Relief -> Guilt.`,
    recommendations: [
      `Move physical triggers (phone, cards, products) out of your sight during your high-risk hours.`,
      `Engage in a smart replacement activity such as reading, deep stretching, or learning for 10 minutes.`,
      `Log your emotional state in the journal daily to identify patterns of avoidance.`
    ]
  };
};

const generateMockRelapseRisk = (_streak: number, stress: number, sleep: number): {
  riskLevel: 'low' | 'medium' | 'high';
  percentageScore: number;
  explanation: string;
  preventiveActions: string[];
} => {
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  let percentageScore = 15;

  if (stress > 7 || sleep < 5) {
    riskLevel = 'high';
    percentageScore = 80;
  } else if (stress > 4 || sleep < 7) {
    riskLevel = 'medium';
    percentageScore = 50;
  }

  const actions = [
    'Take a 5-minute offline break immediately.',
    'Drink a tall glass of water and complete a grounding exercise.',
    'Write a journal entry explaining the current tension.'
  ];

  return {
    riskLevel,
    percentageScore,
    explanation: `Your current stress score of ${stress}/10 and sleep duration of ${sleep} hours put you at a ${riskLevel} level of vulnerability. Lack of sleep impairs decision-making circuits, making triggers harder to resist.`,
    preventiveActions: actions
  };
};

const generateMockEmergencyAdvice = (): RelapseAdvice => {
  return {
    encouragement: 'Stop and take a step back. This craving is a neurological chemical spike. It reaches its peak in 90 seconds and will subside if you do not feed it.',
    immediateAction: 'Stand up, walk to another room, open a window, and take 5 deep slow breaths. Breathe in for 4 seconds, hold for 4, exhale for 6.',
    microGoal: 'Commit to waiting exactly 10 minutes. If you still want to relapse after 10 minutes, check back in.'
  };
};

const generateMockJournalAnalysis = (content: string): JournalAnalysis => {
  const lowercase = content.toLowerCase();
  let mood = 'Neutral';
  let stressLevel = 5;
  const triggers: string[] = [];

  if (lowercase.includes('sad') || lowercase.includes('lonely') || lowercase.includes('depressed') || lowercase.includes('down')) {
    mood = 'Melancholy / Lonely';
    stressLevel = 6;
    triggers.push('Isolation');
  } else if (lowercase.includes('stressed') || lowercase.includes('work') || lowercase.includes('busy') || lowercase.includes('anxious') || lowercase.includes('tired')) {
    mood = 'Anxious / Overwhelmed';
    stressLevel = 8;
    triggers.push('Work Pressure');
  } else if (lowercase.includes('happy') || lowercase.includes('good') || lowercase.includes('great') || lowercase.includes('proud')) {
    mood = 'Positive / Content';
    stressLevel = 2;
  }

  if (lowercase.includes('phone') || lowercase.includes('screen') || lowercase.includes('scrolling')) {
    triggers.push('Digital Devices');
  }

  return {
    mood,
    stressLevel,
    triggersIdentified: triggers.length > 0 ? triggers : ['Routine Habit Cycle'],
    improvements: 'Acknowledging feelings is a major cognitive step toward mindfulness.',
    patterns: 'Habit execution is linked directly to state changes and seeking escape.'
  };
};

const generateMockWeeklyReport = (streak: number, logsCount: number): Partial<WeeklyReport> => {
  return {
    successRate: logsCount === 0 ? 100 : Math.max(0, 100 - (logsCount * 14)),
    streak,
    biggestTrigger: 'Late night boredom and stress relief',
    bestImprovement: 'Morning routine consistency and mindfulness logging',
    emotionalPattern: 'Anxiety leading to digital escape',
    personalizedAdvice: 'Continue establishing boundaries. You are doing well in the mornings, but your late night defenses are vulnerable.',
    nextWeekStrategy: 'Configure an automatic app blocker or screen curfew after 10 PM. Implement a book-reading routine.'
  };
};

// Core AIService exporting functions
export const aiService = {
  async generateAssessment(
    habitType: string,
    severity: string,
    frequency: string,
    triggers: string[],
    environment: string,
    motivationLevel: number,
    stressLevel: number,
    sleepHours: number
  ): Promise<RecoveryPlan> {
    const model = getGeminiModel();
    if (!model) {
      // API Key missing, run fallback immediately
      return generateMockRecoveryPlan(habitType, severity, triggers);
    }

    const prompt = `
      You are a behavioral psychologist specializing in habit change.
      Analyze this user profile and output a personalized recovery plan.
      
      User Details:
      - Habit to overcome: ${habitType}
      - Self-reported severity: ${severity}
      - Frequency of habit: ${frequency}
      - Identified triggers: ${triggers.join(', ')}
      - Common environment: ${environment}
      - Motivation level (1-10): ${motivationLevel}
      - Current stress level (1-10): ${stressLevel}
      - Sleep average (hours): ${sleepHours}

      Generate a recovery plan in JSON format with exactly these fields:
      {
        "weeklyGoal": "A concrete weekly target description",
        "dailyMission": "A simple daily micro-mission alternative",
        "triggerAnalysis": "Brief psychological analysis of how their environment/triggers induce this habit",
        "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
      }
    `;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return JSON.parse(text) as RecoveryPlan;
    } catch (e) {
      console.error('Gemini Assessment error, falling back:', e);
      return generateMockRecoveryPlan(habitType, severity, triggers);
    }
  },

  async predictRelapseRisk(
    streak: number,
    triggers: string[],
    stressLevel: number,
    sleepHours: number,
    recentMoods: string[]
  ): Promise<{
    riskLevel: 'low' | 'medium' | 'high';
    percentageScore: number;
    explanation: string;
    preventiveActions: string[];
  }> {
    const model = getGeminiModel();
    if (!model) {
      return generateMockRelapseRisk(streak, stressLevel, sleepHours);
    }

    const prompt = `
      You are a behavioral risk forecaster. Calculate the relapse risk (low, medium, or high) of the user today.
      
      Metrics:
      - Current Streak: ${streak} days
      - Key Triggers: ${triggers.join(', ')}
      - Stress Level (1-10): ${stressLevel}
      - Sleep Duration: ${sleepHours} hours
      - Recent mood logs: ${recentMoods.join(', ') || 'None'}

      Output JSON format:
      {
        "riskLevel": "low" | "medium" | "high",
        "percentageScore": 0-100,
        "explanation": "Psychological/biological reasoning behind the risk calculation.",
        "preventiveActions": ["Action 1", "Action 2", "Action 3"]
      }
    `;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return JSON.parse(text);
    } catch (e) {
      console.error('Gemini Risk prediction error, falling back:', e);
      return generateMockRelapseRisk(streak, stressLevel, sleepHours);
    }
  },

  async getEmergencyAdvice(): Promise<RelapseAdvice> {
    const model = getGeminiModel();
    if (!model) {
      return generateMockEmergencyAdvice();
    }

    const prompt = `
      You are an emergency behavioral support counselor. The user is currently experiencing an overwhelming craving and is about to relapse.
      Provide immediate, highly grounding, empathetic, and tactical recovery advice in JSON format.
      
      Required JSON fields:
      {
        "encouragement": "A compassionate, powerful statement explaining that cravings are temporary neurological spikes.",
        "immediateAction": "A step-by-step physical grounding or breathing exercise to sever the cognitive trigger loop.",
        "microGoal": "A small, low-pressure goal to delay execution (e.g. wait 5 minutes, drink a glass of water)."
      }
    `;

    try {
      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text());
    } catch (e) {
      console.error('Gemini Emergency support error, falling back:', e);
      return generateMockEmergencyAdvice();
    }
  },

  async analyzeRelapse(
    trigger: string,
    emotionalState: string,
    notes: string
  ): Promise<RelapseAdvice> {
    const model = getGeminiModel();
    if (!model) {
      return {
        encouragement: `Remember, a slip is a single data point, not a reset on your overall progress. You identified "${trigger}" as the cue trigger while feeling "${emotionalState}". This self-awareness is your strongest tool.`,
        immediateAction: `Step out of the room where this occurred. Wash your face with cold water or step outside for a breath of fresh air.`,
        microGoal: `Do not worry about a long-term streak right now. Your only target is to stay trigger-free for the next 4 hours.`
      };
    }

    const prompt = `
      You are a behavioral psychologist counselor. A user has logged a habit slip (relapse).
      Provide compassionate, completely non-judgmental, and practical recovery guidance in JSON format.
      
      Relapse Details:
      - Primary trigger: ${trigger}
      - Emotional state before: ${emotionalState}
      - User notes: "${notes}"

      Required JSON fields:
      {
        "encouragement": "A compassionate, psychologically supportive message framing this slip as a learning opportunity.",
        "immediateAction": "A specific, low-effort action to reset their emotional baseline (e.g. change environment).",
        "microGoal": "A very small, easily achievable goal to focus on for the next 12-24 hours."
      }
    `;

    try {
      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text());
    } catch (e) {
      console.error('Gemini Relapse analysis error, falling back:', e);
      return {
        encouragement: `Self-awareness is key. You logged this slip under "${trigger}". Let's treat it as information to strengthen your next week's defenses.`,
        immediateAction: `Take a 5-minute screen-free break. Drink a glass of water.`,
        microGoal: `Focus on staying clean for the next 6 hours.`
      };
    }
  },

  async analyzeJournal(content: string): Promise<JournalAnalysis> {
    const model = getGeminiModel();
    if (!model) {
      return generateMockJournalAnalysis(content);
    }

    const prompt = `
      You are an AI journal analyzer. Read this user's raw daily reflection and extract behavioral insights.
      
      Reflection Content:
      "${content}"

      Output JSON structure:
      {
        "mood": "Summary of mood (e.g., Anxious, Motivated, Bored)",
        "stressLevel": 1-10 (Numeric estimation of stress),
        "triggersIdentified": ["Trigger 1", "Trigger 2"],
        "improvements": "What progress or positive actions did they mention? If none, what encouraging step can they take?",
        "patterns": "Identify recurring thoughts or behaviors that block their progress"
      }
    `;

    try {
      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text()) as JournalAnalysis;
    } catch (e) {
      console.error('Gemini Journal analysis error, falling back:', e);
      return generateMockJournalAnalysis(content);
    }
  },

  async getReplacementSuggestions(habit: string): Promise<{ suggestion: string; difficulty: string; whyText: string }[]> {
    const model = getGeminiModel();
    if (!model) {
      return [
        { suggestion: 'Read 5 pages of a book', difficulty: 'Easy', whyText: 'Provides an immediate, screen-free cognitive redirection.' },
        { suggestion: '10 cycles of Box Breathing', difficulty: 'Easy', whyText: 'Resets the autonomic nervous system, reducing trigger-induced anxiety.' },
        { suggestion: '15-minute brisk walk', difficulty: 'Medium', whyText: 'Releases dopamine physically, replacing the chemical spike of your habit.' }
      ];
    }

    const prompt = `
      Recommend exactly 3 healthy, constructive replacement activities for the habit of: ${habit}.
      
      Output JSON format:
      [
        {
          "suggestion": "Activity description",
          "difficulty": "Easy" | "Medium" | "Hard",
          "whyText": "Scientific/psychological explanation of why this replaces the neurological reward of the bad habit."
        }
      ]
    `;

    try {
      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text());
    } catch (e) {
      console.error('Gemini suggestions error, falling back:', e);
      return [
        { suggestion: 'Read 5 pages of a book', difficulty: 'Easy', whyText: 'Redirects mental focus without screens.' }
      ];
    }
  },

  async generateWeeklyReport(
    streak: number,
    relapseLogs: { trigger: string; emotionalState: string; notes: string; timestamp: string }[],
    journalEntries: { content: string; mood?: string; timestamp: string }[]
  ): Promise<Partial<WeeklyReport>> {
    const model = getGeminiModel();
    if (!model) {
      return generateMockWeeklyReport(streak, relapseLogs.length);
    }

    const prompt = `
      You are a habit analytics coordinator. Analyze the user's logs for the past week and compile a behavioral report.
      
      Past Week Logs:
      - Current Streak: ${streak} days
      - Total Relapses Logged: ${relapseLogs.length}
      - Relapse details: ${JSON.stringify(relapseLogs)}
      - Journal entries analyzed: ${JSON.stringify(journalEntries)}

      Generate a weekly report in JSON format with exactly these fields:
      {
        "successRate": 0-100 (percentage of days without relapse),
        "biggestTrigger": "Description of the dominant relapse trigger identified",
        "bestImprovement": "Description of where they showed strength or positive behavior",
        "emotionalPattern": "Summary of emotional trends (e.g. fatigue makes them vulnerable)",
        "personalizedAdvice": "Direct constructive encouragement",
        "nextWeekStrategy": "A 1-sentence tactical change to implement next week"
      }
    `;

    try {
      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text());
    } catch (e) {
      console.error('Gemini Weekly Report error, falling back:', e);
      return generateMockWeeklyReport(streak, relapseLogs.length);
    }
  },

  async getChatResponse(
    history: { role: 'user' | 'model'; parts: { text: string }[] }[],
    newMessage: string,
    habitContext: HabitAssessment | null
  ): Promise<string> {
    const model = getGeminiChatModel();
    
    const systemInstruction = `
      You are Dr. Shift, an expert behavioral psychologist and Cognitive Behavioral Therapy (CBT) coach.
      Your tone is supportive, analytical, and highly practical. 
      You never judge. You help users understand the triggers and loops behind their habits.
      
      User's habit profile:
      ${habitContext ? JSON.stringify(habitContext) : 'Not assessed yet.'}
      
      Instructions:
      - Always recommend small, actionable experiments (e.g. "delay for 5 minutes").
      - Encourage mindfulness.
      - Keep responses focused, concise, and structured. Avoid lengthy walls of text.
    `;

    if (!model) {
      // Mock chat conversation flow
      const lowercase = newMessage.toLowerCase();
      if (lowercase.includes('hello') || lowercase.includes('hi')) {
        return `Hello! I'm Dr. Shift, your habit change coach. Looking at your profile, how has managing your ${habitContext?.habitType || 'habit'} been going today?`;
      }
      if (lowercase.includes('hard') || lowercase.includes('struggle') || lowercase.includes('crave') || lowercase.includes('want')) {
        return `I understand it feels difficult. Cravings are perfectly normal. When they hit, it helps to identify: what emotion are you feeling right now? Is it boredom, stress, or tiredness? Identifying the trigger is 50% of the battle.`;
      }
      return `That's a key observation. In behavioral science, we talk about the "cue-routine-reward" loop. What is one small step you can take right now to disrupt that routine? For example, moving to another room, or doing a 2-minute stretch?`;
    }

    try {
      // Use Gemini multi-turn chat
      const chat = model.startChat({
        history: history,
        systemInstruction: systemInstruction
      });
      const result = await chat.sendMessage(newMessage);
      return result.response.text();
    } catch (e) {
      console.error('Gemini Chat error, falling back:', e);
      return `I'm here for you. Sometimes our connections can be a bit unstable, but our resolve doesn't have to be. Let's focus on taking one breath and staying in this moment.`;
    }
  }
};
export default aiService;
