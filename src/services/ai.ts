import { GoogleGenerativeAI } from '@google/generative-ai';
import type { RecoveryPlan, JournalAnalysis, RelapseAdvice, WeeklyReport, HabitAssessment, RelapseLog, JournalEntry } from '../types/habit';

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
    relapseLogs: RelapseLog[],
    journalEntries: JournalEntry[]
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
      const lc = newMessage.toLowerCase().trim();
      const habit = habitContext?.habitType || 'your habit';
      const historyLength = history.filter(h => h.role === 'user').length;

      // Greeting
      if (lc.match(/^(hi|hello|hey|good morning|good evening|good afternoon|sup|yo|howdy)/)) {
        const greetings = [
          `Hi! I'm Dr. Shift, your AI Behavioral Coach. I've loaded your recovery blueprint for "${habit}". How are you feeling right now — any urges or cravings pulling at you today?`,
          `Hello! Great to check in. You're working on "${habit}". On a scale of 1-10, how intense are your cravings feeling at this moment?`,
          `Hey there! Let's take a breath and check in. How has today been going with "${habit}"? Any moments you're proud of, or any that were tough?`,
        ];
        return greetings[historyLength % greetings.length];
      }

      // Struggling / hard / difficult
      if (lc.match(/hard|difficult|struggle|can't stop|cannot stop|failing|failed|relapsed/)) {
        return `Struggling is completely normal — in fact, it means your brain is fighting the old neural pathway. When you feel the urge to ${habit.toLowerCase()}, try this: pause for exactly 60 seconds and name 5 things you can physically see around you. This activates your prefrontal cortex and weakens the craving signal. Can you try that right now?`;
      }

      // Craving / urge / want to
      if (lc.match(/crav|urge|want to|need to|tempt|pull|itch/)) {
        const tips = [
          `Cravings peak at about 20 minutes then fade — they're like a wave. Right now, set a 10-minute timer. If the urge is still there after 10 minutes, we'll deal with it together. What do you see around you right now?`,
          `That urge is your brain asking for a dopamine hit. Instead, do 10 jumping jacks or push-ups right now. Physical movement floods your system with dopamine naturally — and breaks the cue loop. Can you do that?`,
          `Acknowledge the craving without judgment: say out loud "I notice I want to ${habit.toLowerCase()}, and that's okay. I'm choosing to wait." That small act of labelling reduces urge intensity by up to 40%. Did you try it?`,
        ];
        return tips[historyLength % tips.length];
      }

      // Boredom
      if (lc.match(/bored|nothing to do|boring|boredom/)) {
        return `Boredom is one of the top cue triggers for ${habit}. When you're bored, your brain seeks stimulation — and a familiar habit is the easiest path. Here's a pattern interrupt: stand up, go to a different room, and spend 2 minutes looking out a window. Changing your physical environment resets the cue-loop. What room are you in right now?`;
      }

      // Stress / anxiety / overwhelm
      if (lc.match(/stress|anxious|anxiety|overwhelm|panic|worried|pressure/)) {
        return `Stress hijacks the rational brain and shortcuts to habit loops — that's neuroscience, not weakness. Let's do a quick 4-7-8 breath right now: breathe IN for 4 counts, HOLD for 7, breathe OUT for 8. This activates the vagus nerve and lowers cortisol within 60 seconds. Try it once and tell me how you feel.`;
      }

      // Progress / did well / proud
      if (lc.match(/did it|succeeded|proud|better|improved|good day|win|progress/)) {
        return `That's fantastic — celebrating small wins is scientifically proven to reinforce the new neural pathway you're building. Your brain literally rewires itself each time you resist. What specific moment today made you feel in control? Let's anchor that feeling as your new identity.`;
      }

      // Very short messages (1-2 words: "next", "ok", "and", etc.)
      if (lc.split(' ').length <= 2) {
        const prompts = [
          `Tell me more — what's going through your mind right now about ${habit}? I'm listening without judgment.`,
          `I want to understand better. Can you describe what triggered you to reach out to me right now?`,
          `What's happening in your body as you think about ${habit}? Any tension, restlessness, or urge?`,
          `Let's go deeper. On a scale of 1 to 10, how strong is your urge to engage in ${habit} right now?`,
          `It sounds like something's on your mind. What happened in the last hour that's relevant to your recovery?`,
        ];
        return prompts[historyLength % prompts.length];
      }

      // General rotating pool
      const general = [
        `That's an important observation. In CBT, we identify "automatic thoughts" — the instant mental narrative that appears right before the habit. What thought crosses your mind just before you engage in ${habit}?`,
        `Every moment of resistance builds new neural pathways. What strategy from your recovery plan feels most practical for you right now?`,
        `Think about your environment right now. Is there anything nearby that's acting as a visual cue or trigger for ${habit}? Sometimes removing just one cue item breaks the chain.`,
        `Let's do a quick check: rate your stress (1-10), energy (1-10), and urge intensity (1-10). These three numbers tell me a lot about your vulnerability window right now.`,
        `The research shows that substitution beats suppression. Instead of fighting the urge to ${habit}, what's one enjoyable activity you could replace it with for just 5 minutes?`,
      ];
      return general[historyLength % general.length];
    }

    try {
      // Gemini requires history to strictly alternate: user → model → user → model...
      // Filter to only completed turn pairs (the current user message arrives via sendMessage)
      const validHistory: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
      for (let i = 0; i < history.length - 1; i += 2) {
        const u = history[i];
        const m = history[i + 1];
        if (u?.role === 'user' && m?.role === 'model') {
          validHistory.push(u, m);
        }
      }

      // Use Gemini multi-turn chat with correct systemInstruction param
      const chat = model.startChat({
        history: validHistory,
        generationConfig: {
          maxOutputTokens: 300,
          temperature: 0.85,
        },
      });

      const result = await chat.sendMessage(
        `[SYSTEM: ${systemInstruction}]\n\n${newMessage}`
      );

      let text = result.response.text().trim();
      // Strip any accidental JSON wrapping from text responses
      if (text.startsWith('{') || text.startsWith('[')) {
        try {
          const parsed = JSON.parse(text);
          text = parsed.response || parsed.message || parsed.text || JSON.stringify(parsed);
        } catch { /* keep original */ }
      }
      return text;
    } catch (e) {
      console.error('Gemini Chat error, falling back:', e);
      const habit = habitContext?.habitType || 'your habit';
      return `I'm here for you. Let's take one thing at a time. When you feel the urge to ${habit.toLowerCase()}, what's the first thought that enters your mind? Understanding that automatic thought is your most powerful tool right now.`;
    }
  }
};
export default aiService;
