/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ChatView } from './components/ChatView';
import { CharacterEditor } from './components/CharacterEditor';
import { UserProfileEditor } from './components/UserProfileEditor';
import { PresetsView } from './components/PresetsView';
import { BackupModal } from './components/BackupModal';
import { CharacterConfig, UserProfile, ChatMessage } from './types';
import {
  loadCharacters,
  saveCharacters,
  loadActiveCharacterId,
  saveActiveCharacterId,
  loadUserProfile,
  saveUserProfile,
  loadChatHistory,
  saveChatHistory,
} from './utils/storage';
import { PRESET_CHARACTERS } from './data/presets';

export default function App() {
  const [characters, setCharacters] = useState<CharacterConfig[]>(() => loadCharacters());
  const [activeCharacterId, setActiveCharacterId] = useState<string>(() =>
    loadActiveCharacterId(characters)
  );
  const [userProfile, setUserProfile] = useState<UserProfile>(() => loadUserProfile());
  const [activeTab, setActiveTab] = useState<'chat' | 'editor' | 'profile' | 'presets'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    loadChatHistory(activeCharacterId)
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  const activeAbortController = useRef<AbortController | null>(null);

  // Active character object
  const activeCharacter =
    characters.find((c) => c.id === activeCharacterId) || characters[0] || PRESET_CHARACTERS[0];

  // Sync active character id
  const handleSelectCharacter = (id: string) => {
    setActiveCharacterId(id);
    saveActiveCharacterId(id);
    const history = loadChatHistory(id);
    setMessages(history);
  };

  // Sync characters to local storage
  const handleUpdateCharacters = (newChars: CharacterConfig[]) => {
    setCharacters(newChars);
    saveCharacters(newChars);
  };

  // Sync user profile to local storage
  const handleUpdateUserProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    saveUserProfile(newProfile);
  };

  // Save specific character
  const handleSaveCharacter = (updated: CharacterConfig) => {
    const exists = characters.some((c) => c.id === updated.id);
    let updatedList: CharacterConfig[];
    if (exists) {
      updatedList = characters.map((c) => (c.id === updated.id ? updated : c));
    } else {
      updatedList = [updated, ...characters];
    }
    handleUpdateCharacters(updatedList);
  };

  // Create new AI Character
  const handleCreateNewCharacter = () => {
    const newChar: CharacterConfig = {
      id: `custom-${Date.now()}`,
      name: '新しいAI相棒',
      role: '専属アシスタント',
      tagline: 'あなたの毎日に寄り添うカスタムAI',
      avatarEmoji: '✨',
      avatarColor: 'indigo',
      personality: '親切で誠実、あなたの気持ちをよく理解する心強い存在。',
      tone: '丁寧で親しみやすい口調。',
      firstPerson: '私',
      secondPerson: 'あなた',
      speechStyle: '〜ですね、〜でしょうか？',
      behaviorRules: ['常にユーザー目線で考える', '親身で建設的なアドバイスをする'],
      responseLength: 'medium',
      customInstructions: '',
      greetingMessage: 'こんにちは！あなたの専属AIアシスタントです。どんなことでも気軽に話してくださいね！',
      suggestedTopics: ['今日のタスクを整理したい', 'アイデアの相談に乗って', '最近の出来事について雑談'],
      createdAt: Date.now(),
    };

    handleUpdateCharacters([newChar, ...characters]);
    setActiveCharacterId(newChar.id);
    saveActiveCharacterId(newChar.id);
    setMessages([]);
    setActiveTab('editor');
  };

  // Duplicate Character
  const handleDuplicateCharacter = (char: CharacterConfig) => {
    const copy: CharacterConfig = {
      ...char,
      id: `custom-copy-${Date.now()}`,
      name: `${char.name} (カスタム)`,
      createdAt: Date.now(),
    };
    handleUpdateCharacters([copy, ...characters]);
    setActiveCharacterId(copy.id);
    saveActiveCharacterId(copy.id);
    setMessages([]);
    setActiveTab('editor');
  };

  // Delete Character
  const handleDeleteCharacter = (id: string) => {
    if (characters.length <= 1) {
      alert('最低1体のAIキャラクターが必要です。');
      return;
    }
    const filtered = characters.filter((c) => c.id !== id);
    handleUpdateCharacters(filtered);
    if (activeCharacterId === id) {
      const nextId = filtered[0].id;
      setActiveCharacterId(nextId);
      saveActiveCharacterId(nextId);
      setMessages(loadChatHistory(nextId));
    }
  };

  // Clear Chat History for active character
  const handleClearMessages = () => {
    setMessages([]);
    saveChatHistory(activeCharacter.id, []);
  };

  // Send message with SSE streaming
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    saveChatHistory(activeCharacter.id, newHistory);
    setIsStreaming(true);

    const abortController = new AbortController();
    activeAbortController.current = abortController;

    const assistantMsgId = `assistant-${Date.now()}`;
    let accumulatedContent = '';

    // Append empty assistant message for streaming
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      },
    ]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortController.signal,
        body: JSON.stringify({
          messages: newHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          character: {
            ...activeCharacter,
            userProfile,
          },
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');

      if (!reader) {
        throw new Error('No stream response body');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulatedContent += parsed.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, content: accumulatedContent } : m
                  )
                );
              } else if (parsed.error) {
                accumulatedContent += `\n⚠️ [エラー]: ${parsed.error}`;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, content: accumulatedContent } : m
                  )
                );
              }
            } catch (jsonErr) {
              // ignore partial json
            }
          }
        }
      }

      // Final save to localStorage
      const finalHistory = [
        ...newHistory,
        {
          id: assistantMsgId,
          role: 'assistant' as const,
          content: accumulatedContent || '（返答がありませんでした）',
          timestamp: Date.now(),
        },
      ];
      saveChatHistory(activeCharacter.id, finalHistory);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Streaming was aborted by user');
      } else {
        console.error('Chat error:', err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content:
                    accumulatedContent ||
                    '申し訳ありません。メッセージの取得中に問題が発生しました。再度お試しください。',
                }
              : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
      activeAbortController.current = null;
    }
  };

  const handleStopStreaming = () => {
    if (activeAbortController.current) {
      activeAbortController.current.abort();
      setIsStreaming(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        characters={characters}
        activeCharacter={activeCharacter}
        activeTab={activeTab}
        onSelectCharacter={handleSelectCharacter}
        onSelectTab={setActiveTab}
        onCreateNew={handleCreateNewCharacter}
        onOpenBackup={() => setIsBackupOpen(true)}
      />

      <main className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (
          <ChatView
            character={activeCharacter}
            userProfile={userProfile}
            messages={messages}
            onSendMessage={handleSendMessage}
            onClearMessages={handleClearMessages}
            onEditCharacter={() => setActiveTab('editor')}
            onUpdateUserProfile={handleUpdateUserProfile}
            isStreaming={isStreaming}
            onStopStreaming={handleStopStreaming}
          />
        )}

        {activeTab === 'editor' && (
          <CharacterEditor
            character={activeCharacter}
            userProfile={userProfile}
            onSaveCharacter={handleSaveCharacter}
            onDeleteCharacter={handleDeleteCharacter}
            onDuplicateCharacter={handleDuplicateCharacter}
            onStartChat={(char) => {
              handleSelectCharacter(char.id);
              setActiveTab('chat');
            }}
          />
        )}

        {activeTab === 'profile' && (
          <UserProfileEditor
            userProfile={userProfile}
            onSaveProfile={handleUpdateUserProfile}
          />
        )}

        {activeTab === 'presets' && (
          <PresetsView
            onSelectAndChat={(preset) => {
              // Check if preset is already in character list
              const existing = characters.find((c) => c.id === preset.id);
              if (!existing) {
                handleUpdateCharacters([preset, ...characters]);
              }
              handleSelectCharacter(preset.id);
              setActiveTab('chat');
            }}
            onDuplicateAndEdit={(preset) => {
              handleDuplicateCharacter(preset);
            }}
            activeCharacterId={activeCharacterId}
          />
        )}
      </main>

      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        characters={characters}
        userProfile={userProfile}
        onRestoreData={(chars, profile) => {
          handleUpdateCharacters(chars);
          handleUpdateUserProfile(profile);
          if (chars.length > 0) {
            handleSelectCharacter(chars[0].id);
          }
        }}
      />
    </div>
  );
}
