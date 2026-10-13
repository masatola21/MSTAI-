export interface UserProfile {
  userName: string;
  userOccupation: string;
  userGoals: string;
  userHobbies: string;
  userValues: string;
  userNotes: string;
}

export type AvatarColor = 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'cyan' | 'fuchsia' | 'sky';

export interface CharacterConfig {
  id: string;
  name: string;
  role: string;
  tagline: string;
  avatarEmoji: string;
  avatarColor: AvatarColor;
  personality: string;
  tone: string;
  firstPerson: string;
  secondPerson: string;
  speechStyle: string;
  behaviorRules: string[];
  responseLength: 'short' | 'medium' | 'detailed';
  customInstructions: string;
  greetingMessage: string;
  suggestedTopics: string[];
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
