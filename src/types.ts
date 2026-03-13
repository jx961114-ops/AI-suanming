export interface BirthInfo {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  location: string;
  gender: 'male' | 'female';
}

export interface BaziColumn {
  stem: string;
  branch: string;
  element: string;
  tenGod: string;
  hiddenStems: { stem: string; tenGod: string }[];
  shenSha: string[];
}

export interface BaziData {
  year: BaziColumn;
  month: BaziColumn;
  day: BaziColumn;
  hour: BaziColumn;
  fiveElements: { [key: string]: number };
  dayMaster: string;
  daYun?: {
    startAge: number;
    startYear: number;
    items: { age: number; year: number; stem: string; branch: string }[];
  };
  liuNian?: { year: number; stem: string; branch: string }[];
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
