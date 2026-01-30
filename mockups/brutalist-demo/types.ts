

export enum GameState {
  MENU = 'MENU',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  GALLERY = 'GALLERY',
  KOA_MINI = 'KOA_MINI',
  LIBRARY = 'LIBRARY'
}

export enum KoaMood {
  NEUTRAL = 'NEUTRAL',
  SUSPICIOUS = 'SUSPICIOUS',
  DISAPPOINTED = 'DISAPPOINTED',
  AMUSED = 'AMUSED',
  WATCHING = 'WATCHING',
  PROCESSING = 'PROCESSING',
  GLITCH = 'GLITCH',
  SLEEPY = 'SLEEPY',
  ANGRY = 'ANGRY',
  ACCEPTING = 'ACCEPTING',
  // New Portable Moods
  CURIOUS = 'CURIOUS',
  GRUDGING = 'GRUDGING',
  IMPRESSED = 'IMPRESSED',
  RESIGNED = 'RESIGNED',
  SMUG = 'SMUG'
}

export interface KoaSkin {
  id: string;
  name: string;
  bodyFill: string;
  bodyStroke: string;
  faceplateFill: string;
  faceplateStroke: string;
  texture?: 'none' | 'grid' | 'lines' | 'dots' | 'carbon' | 'spikes' | 'technical'; 
  borderStyle?: 'simple' | 'thick' | 'double' | 'dashed' | 'offset' | 'tech' | 'glow' | 'serrated';
}

export interface Card {
  id: string;
  title: string;
  description: string;
  type: 'ALIBI' | 'DATA' | 'EXCUSE' | 'WITNESS';
  icon: string;
  // Optional metadata for Mini Protocol
  location?: string;
  time?: string;
}

export interface Scenario {
  anomaly: string;      // Replaced 'crime'
  sensorData: string;   // Replaced 'evidenceAgainst'
  turnCount: number;
}

export interface ChatLog {
  speaker: 'KOA' | 'PLAYER';
  text: string;
  mood?: KoaMood;
}

export interface GeminiEvaluation {
  narrativeSections: string[]; // Changed from single string to array
  mood: KoaMood;
  verdict: 'WIN' | 'LOSS' | 'CONTINUE';
}

export interface AvatarExpression {
  lidTop: number;       // 0-100 percentage (Position)
  lidBottom: number;    // 0-100 percentage (Position)
  lidAngle: number;     // degrees
  pupilScale: number;   // multiplier
  lidCurveTop?: number; // Curvature intensity (Positive = Arch n, Negative = Dip u)
  lidCurveBottom?: number; // Curvature intensity (Positive = Dip U, Negative = Hill n)
}