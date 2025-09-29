import { Question, PracticeSession, AssessmentResult } from '../types';
import { aptitudeQuestions, AptitudeQuestion } from '../data/aptitudeQuestions';

// Transform aptitude questions to match the Question interface
const transformAptitudeQuestion = (apt: AptitudeQuestion): Question => {
  // Map difficulty
  let difficulty: 'easy' | 'moderate' | 'difficult' = 'easy';
  if (apt.difficulty === 'Easy') difficulty = 'easy';
  else if (apt.difficulty === 'Moderate') difficulty = 'moderate';
  else if (apt.difficulty === 'Difficult') difficulty = 'difficult';
  else if (apt.difficulty === 'Very easy') difficulty = 'easy';

  // Map skillType by difficulty band to cover all 4 skills
  let skillType: 'listening' | 'grasping' | 'retention' | 'practice' = 'grasping';
  if (apt.difficulty === 'Very easy') skillType = 'listening';
  else if (apt.difficulty === 'Easy') skillType = 'grasping';
  else if (apt.difficulty === 'Moderate') skillType = 'practice';
  else if (apt.difficulty === 'Difficult') skillType = 'retention';

  return {
    id: apt.id.toString(),
    text: apt.question_text,
    options: [apt.option_a, apt.option_b, apt.option_c, apt.option_d],
    correctAnswer: ['a', 'b', 'c', 'd'].indexOf(apt.answer),
    explanation: 'Explanation for this question.', // You can enhance this later
    difficulty,
    skillType, // diversified based on difficulty band
    subject: 'Quantitative Aptitude',
    topic: apt.tags,
  };
};

// Use aptitude questions as the main questions database
const questionsDb: Question[] = aptitudeQuestions.map(transformAptitudeQuestion);

// Mock sessions database
const sessionsDb: PracticeSession[] = [];

// Cache for filtered questions
const questionCache = new Map<string, Question[]>();

// Helper to generate cache key from filters
const getCacheKey = (filters: Record<string, unknown>): string => {
  return Object.entries(filters)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join('|');
};

const mockApi = {
  // Get questions based on filters with pagination
  getQuestions(
    filters: {
      skillType?: string;
      difficulty?: string;
      subject?: string;
      topic?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Question[]> {
    return new Promise<Question[]>((resolve) => {
      setTimeout(() => {
        const cacheKey = getCacheKey(filters);
        
        if (questionCache.has(cacheKey)) {
          const cached = questionCache.get(cacheKey)!;
          const { limit = 10, offset = 0 } = filters;
          resolve((limit || offset ? cached.slice(offset, offset + (limit || cached.length)) : [...cached]) as Question[]);
          return;
        }

        const filtered = questionsDb.filter(question => {
          if (filters.skillType && question.skillType !== filters.skillType) return false;
          if (filters.difficulty && question.difficulty !== filters.difficulty) return false;
          if (filters.subject && question.subject !== filters.subject) return false;
          if (filters.topic && question.topic !== filters.topic) return false;
          return true;
        });

        questionCache.set(cacheKey, filtered);

        const { limit = 10, offset = 0 } = filters;
        resolve((limit || offset ? filtered.slice(offset, offset + (limit || filtered.length)) : [...filtered]) as Question[]);
      }, 0);
    });
  },

  // Save a practice session
  saveSession(session: Omit<PracticeSession, 'id'>): Promise<PracticeSession> {
    return new Promise<PracticeSession>((resolve) => {
      setTimeout(() => {
        const newSession = {
          ...session,
          id: `sess_${Date.now()}`,
        };
        sessionsDb.push(newSession);
        resolve(newSession as PracticeSession);
      }, 0);
    });
  },

  // Get user's practice sessions
  getUserSessions(userId: string): Promise<PracticeSession[]> {
    return new Promise<PracticeSession[]>((resolve) => {
      setTimeout(() => {
        resolve(sessionsDb.filter(session => session.userId === userId) as PracticeSession[]);
      }, 0);
    });
  },

  // Save assessment results
  saveAssessmentResult(_result: AssessmentResult): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        // In a real app, this would save to a database
        resolve(true);
      }, 0);
    });
  },

  // Get user progress
  getUserProgress(userId: string) {
    return new Promise(resolve => {
      setTimeout(() => {
        const userSessions = sessionsDb.filter(session => session.userId === userId);
        const totalQuestions = userSessions.reduce((sum, session) => sum + (session.questions?.length || 0), 0);
        const correctAnswers = userSessions.reduce((sum, session) => sum + session.responses.filter(r => r.isCorrect).length, 0);
        const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
        resolve({
          totalSessions: userSessions.length,
          totalQuestions,
          correctAnswers,
          accuracy,
          lastSession: userSessions.length > 0 ? userSessions[userSessions.length - 1].startTime : null,
        });
      }, 0);
    });
  }
};

export default mockApi;
