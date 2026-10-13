import { CharacterConfig, UserProfile, ChatMessage } from '../types';
import { PRESET_CHARACTERS } from '../data/presets';

const STORAGE_KEYS = {
  CHARACTERS: 'myai_characters_v1',
  ACTIVE_CHAR_ID: 'myai_active_char_id_v1',
  USER_PROFILE: 'myai_user_profile_v1',
  CHAT_MESSAGES: 'myai_chat_messages_v1',
};

export const DEFAULT_USER_PROFILE: UserProfile = {
  userName: '',
  userOccupation: '',
  userGoals: '',
  userHobbies: '',
  userValues: '',
  userNotes: '',
};

export function loadCharacters(): CharacterConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHARACTERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load characters from localStorage', e);
  }
  return PRESET_CHARACTERS;
}

export function saveCharacters(characters: CharacterConfig[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(characters));
  } catch (e) {
    console.error('Failed to save characters to localStorage', e);
  }
}

export function loadActiveCharacterId(characters: CharacterConfig[]): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_CHAR_ID);
    if (saved && characters.some((c) => c.id === saved)) {
      return saved;
    }
  } catch (e) {
    console.error(e);
  }
  return characters[0]?.id || 'preset-sera';
}

export function saveActiveCharacterId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CHAR_ID, id);
  } catch (e) {
    console.error(e);
  }
}

export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (raw) {
      return { ...DEFAULT_USER_PROFILE, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to load user profile', e);
  }
  return DEFAULT_USER_PROFILE;
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save user profile', e);
  }
}

export function loadChatHistory(charId: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES);
    if (raw) {
      const allHistories = JSON.parse(raw);
      if (allHistories && allHistories[charId]) {
        return allHistories[charId];
      }
    }
  } catch (e) {
    console.error('Failed to load chat history', e);
  }
  return [];
}

export function saveChatHistory(charId: string, messages: ChatMessage[]): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES);
    const allHistories = raw ? JSON.parse(raw) : {};
    allHistories[charId] = messages;
    localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(allHistories));
  } catch (e) {
    console.error('Failed to save chat history', e);
  }
}

export function exportAllData(): string {
  const data = {
    characters: loadCharacters(),
    userProfile: loadUserProfile(),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}
