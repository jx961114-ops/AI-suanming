export interface BirthInfo {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  location: string;
  gender: 'male' | 'female';
}

export interface BaziData {
  year: { stem: string; branch: string; element: string };
  month: { stem: string; branch: string; element: string };
  day: { stem: string; branch: string; element: string };
  hour: { stem: string; branch: string; element: string };
  fiveElements: { [key: string]: number };
  tenGods: string[];
  dayMaster: string;
}

export interface AstrologyData {
  planets: {
    name: string;
    sign: string;
    house: number;
    degree: number;
  }[];
  ascendant: string;
}

export type Page = 'home' | 'bazi' | 'astrology' | 'chat' | 'fortune';

export type AnalysisMode = 'bazi' | 'astrology' | 'mixed';

export interface FortuneData {
  overallScore: number;
  loveScore: number;
  wealthScore: number;
  careerScore: number;
  studyScore: number;
  interpersonalScore: number;
  summary: string;
  suggestion: string;
  avoid: string;
  luckyColor: string;
}

export interface ComprehensiveAnalysis {
  baziAnalysis: string;
  astrologyAnalysis: string;
  fortuneData: FortuneData;
}

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
