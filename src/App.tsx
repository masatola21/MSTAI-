/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header, AppTab } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ChatView } from './components/ChatView';
import { ProjectsView } from './components/ProjectsView';
import { TasksView } from './components/TasksView';
import { ApprovalsView } from './components/ApprovalsView';
import { CharacterEditor } from './components/CharacterEditor';
import { UserProfileEditor } from './components/UserProfileEditor';
import { PresetsView } from './components/PresetsView';
import { BackupModal } from './components/BackupModal';
import { PlanRegistrationModal } from './components/PlanRegistrationModal';
import {
  CharacterConfig,
  UserProfile,
  ChatMessage,
  Project,
  TaskItem,
  ApprovalItem,
  ActivityLog,
  ProposedPlan,
  Priority,
  TaskAssignee,
} from './types';
import {
  loadCharacters,
  saveCharacters,
  loadActiveCharacterId,
  saveActiveCharacterId,
  loadUserProfile,
  saveUserProfile,
  loadChatHistory,
  saveChatHistory,
  loadProjects,
  saveProjects,
  loadTasks,
  saveTasks,
  loadApprovals,
  saveApprovals,
  loadActivityLogs,
  saveActivityLogs,
  recordActivityLog,
  loadTopGoal,
  saveTopGoal,
} from './utils/storage';
import { PRESET_CHARACTERS } from './data/presets';

export default function App() {
  // --- Persistent States ---
  const [characters, setCharacters] = useState<CharacterConfig[]>(() => loadCharacters());
  const [activeCharacterId, setActiveCharacterId] = useState<string>(() =>
    loadActiveCharacterId(characters)
  );
  const [userProfile, setUserProfile] = useState<UserProfile>(() => loadUserProfile());
  const [topGoal, setTopGoal] = useState<string>(() => loadTopGoal());
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [tasks, setTasks] = useState<TaskItem[]>(() => loadTasks());
  const [approvals, setApprovals] = useState<ApprovalItem[]>(() => loadApprovals());
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => loadActivityLogs());

  // --- UI Navigation & Modals ---
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [selectedProjectIdForTasks, setSelectedProjectIdForTasks] = useState<string | null>(null);
  const [activePlanForModal, setActivePlanForModal] = useState<ProposedPlan | null>(null);
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  // --- Chat & Streaming ---
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    loadChatHistory(activeCharacterId)
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const activeAbortController = useRef<AbortController | null>(null);

  // Current active character object
  const activeCharacter =
    characters.find((c) => c.id === activeCharacterId) || characters[0] || PRESET_CHARACTERS[0];

  // --- Character Switching & Saving ---
  const handleSelectCharacter = (id: string) => {
    setActiveCharacterId(id);
    saveActiveCharacterId(id);
    setMessages(loadChatHistory(id));
  };

  const handleUpdateCharacters = (newChars: CharacterConfig[]) => {
    setCharacters(newChars);
    saveCharacters(newChars);
  };

  const handleSaveCharacter = (updated: CharacterConfig) => {
    const exists = characters.some((c) => c.id === updated.id);
    const updatedList = exists
      ? characters.map((c) => (c.id === updated.id ? updated : c))
      : [updated, ...characters];
    handleUpdateCharacters(updatedList);
  };

  const handleCreateNewCharacter = () => {
    const newChar: CharacterConfig = {
      id: `custom-${Date.now()}`,
      name: '新しい専門AI',
      role: '専属スペシャリスト',
      tagline: '特定の業務や相談に特化したカスタムAIパートナー',
      avatarEmoji: '🤖',
      avatarColor: 'indigo',
      personality: '誠実で専門性が高く、担当タスクを着実にアシストします。',
      tone: '丁寧で親しみやすい口調。',
      firstPerson: '私',
      secondPerson: 'あなた',
      speechStyle: '〜ですね、〜でしょうか？',
      behaviorRules: ['常にユーザー目線で考える', '建設的で具体的な提案を行う'],
      responseLength: 'medium',
      customInstructions: '',
      greetingMessage: 'こんにちは！お任せいただくタスクについて何でもご相談ください。',
      suggestedTopics: ['このタスクの進め方について相談したい', '成果物のレビューをお願いしたい'],
      createdAt: Date.now(),
    };
    handleUpdateCharacters([newChar, ...characters]);
    setActiveCharacterId(newChar.id);
    saveActiveCharacterId(newChar.id);
    setMessages([]);
    setActiveTab('editor');
  };

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

  // --- Top Goal ---
  const handleUpdateTopGoal = (newGoal: string) => {
    setTopGoal(newGoal);
    saveTopGoal(newGoal);
    recordActivityLog('task_updated', `最優先目標が更新されました: 「${newGoal}」`, '人間');
    setActivityLogs(loadActivityLogs());
  };

  // --- User Profile ---
  const handleUpdateUserProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    saveUserProfile(newProfile);
  };

  // --- Projects Operations ---
  const handleCreateProject = (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProject: Project = {
      ...projectData,
      id: `proj-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [newProject, ...projects];
    setProjects(updated);
    saveProjects(updated);
    recordActivityLog('project_created', `新規プロジェクト「${newProject.name}」を作成しました`, '人間');
    setActivityLogs(loadActivityLogs());
  };

  const handleUpdateProject = (updatedProj: Project) => {
    const updated = projects.map((p) => (p.id === updatedProj.id ? updatedProj : p));
    setProjects(updated);
    saveProjects(updated);
    recordActivityLog('project_updated', `プロジェクト「${updatedProj.name}」の情報を更新しました`, '人間');
    setActivityLogs(loadActivityLogs());
  };

  const handleDeleteProject = (id: string) => {
    const target = projects.find((p) => p.id === id);
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    saveProjects(updated);
    if (target) {
      recordActivityLog('project_updated', `プロジェクト「${target.name}」を削除しました`, '人間');
      setActivityLogs(loadActivityLogs());
    }
  };

  // --- Tasks Operations ---
  const handleCreateTask = (taskData: Omit<TaskItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: TaskItem = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    saveTasks(updated);
    recordActivityLog(
      'task_created',
      `新規タスク「${newTask.title}」を作成しました (担当: ${newTask.assignee.name})`,
      '人間'
    );
    setActivityLogs(loadActivityLogs());
  };

  const handleUpdateTask = (updatedTask: TaskItem) => {
    const oldTask = tasks.find((t) => t.id === updatedTask.id);
    const updated = tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t));
    setTasks(updated);
    saveTasks(updated);

    if (oldTask && oldTask.status !== updatedTask.status) {
      recordActivityLog(
        'task_status_changed',
        `タスク「${updatedTask.title}」の状態が【${updatedTask.status}】に変更されました`,
        '人間'
      );
    } else {
      recordActivityLog('task_updated', `タスク「${updatedTask.title}」が更新されました`, '人間');
    }
    setActivityLogs(loadActivityLogs());
  };

  const handleDeleteTask = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    saveTasks(updated);
    if (target) {
      recordActivityLog('task_updated', `タスク「${target.title}」を削除しました`, '人間');
      setActivityLogs(loadActivityLogs());
    }
  };

  const handleRequestApproval = (task: TaskItem, reason: string) => {
    // 1. Update task to pending_approval
    const updatedTask: TaskItem = {
      ...task,
      status: 'pending_approval',
      updatedAt: Date.now(),
    };
    const updatedTasks = tasks.map((t) => (t.id === task.id ? updatedTask : t));
    setTasks(updatedTasks);
    saveTasks(updatedTasks);

    // 2. Create approval item
    const newApproval: ApprovalItem = {
      id: `appr-${Date.now()}`,
      taskId: task.id,
      taskTitle: task.title,
      actionTitle: `タスク「${task.title}」の完了承認`,
      reason,
      status: 'pending',
      requestedBy: task.assignee.name || '担当者',
      createdAt: Date.now(),
    };
    const updatedApprovals = [newApproval, ...approvals];
    setApprovals(updatedApprovals);
    saveApprovals(updatedApprovals);

    recordActivityLog(
      'approval_requested',
      `タスク「${task.title}」の承認が申請されました: ${reason}`,
      '人間'
    );
    setActivityLogs(loadActivityLogs());
  };

  const handleResolveApproval = (id: string, status: 'approved' | 'rejected', note?: string) => {
    const targetApproval = approvals.find((a) => a.id === id);
    if (!targetApproval) return;

    const updatedApprovals = approvals.map((a) =>
      a.id === id
        ? {
            ...a,
            status,
            resolutionNote: note,
            resolvedAt: Date.now(),
          }
        : a
    );
    setApprovals(updatedApprovals);
    saveApprovals(updatedApprovals);

    // If approved and has associated task, set task status to completed!
    if (targetApproval.taskId) {
      const updatedTasks = tasks.map((t) => {
        if (t.id === targetApproval.taskId) {
          return {
            ...t,
            status: status === 'approved' ? ('completed' as const) : ('in_progress' as const),
            resultNotes: note ? `${t.resultNotes ? t.resultNotes + '\n' : ''}[承認判断]: ${note}` : t.resultNotes,
            updatedAt: Date.now(),
          };
        }
        return t;
      });
      setTasks(updatedTasks);
      saveTasks(updatedTasks);
    }

    recordActivityLog(
      'approval_resolved',
      `承認項目「${targetApproval.actionTitle}」を【${status === 'approved' ? '承認' : '却下'}】しました`,
      '人間',
      note
    );
    setActivityLogs(loadActivityLogs());
  };

  // --- Confirm and Register Plan from AI President Proposal ---
  const handleConfirmPlanRegistration = (
    projectName: string,
    projectObjective: string,
    priority: Priority,
    dueDate: string,
    proposedTasks: {
      title: string;
      description: string;
      priority: Priority;
      completionCriteria: string;
      assignee: TaskAssignee;
    }[]
  ) => {
    // 1. Create Project
    const newProjectId = `proj-${Date.now()}`;
    const newProject: Project = {
      id: newProjectId,
      name: projectName,
      objective: projectObjective,
      status: 'in_progress',
      priority,
      dueDate,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updatedProjects = [newProject, ...projects];
    setProjects(updatedProjects);
    saveProjects(updatedProjects);

    // 2. Create Tasks
    const newTasks: TaskItem[] = proposedTasks.map((t, idx) => ({
      id: `task-${Date.now()}-${idx}`,
      projectId: newProjectId,
      title: t.title,
      description: t.description,
      priority: t.priority,
      assignee: t.assignee,
      status: 'waiting',
      completionCriteria: t.completionCriteria,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
    const updatedTasksList = [...newTasks, ...tasks];
    setTasks(updatedTasksList);
    saveTasks(updatedTasksList);

    // 3. Activity Log
    recordActivityLog(
      'plan_imported',
      `AI社長の提案計画を承認し、プロジェクト「${projectName}」と${newTasks.length}件のタスクを登録しました`,
      '人間'
    );
    setActivityLogs(loadActivityLogs());

    // Switch to projects or tasks tab
    setSelectedProjectIdForTasks(newProjectId);
    setActiveTab('projects');
  };

  // --- Chat & Streaming ---
  const handleClearMessages = () => {
    setMessages([]);
    saveChatHistory(activeCharacter.id, []);
  };

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
        console.log('Streaming aborted by user');
      } else {
        console.error('Chat error:', err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content:
                    accumulatedContent ||
                    'メッセージの通信中に問題が発生しました。再度お試しください。',
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

  const pendingApprovalsCount = approvals.filter((a) => a.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        characters={characters}
        activeCharacter={activeCharacter}
        activeTab={activeTab}
        pendingApprovalsCount={pendingApprovalsCount}
        onSelectCharacter={handleSelectCharacter}
        onSelectTab={setActiveTab}
        onCreateNewCharacter={handleCreateNewCharacter}
        onOpenBackup={() => setIsBackupOpen(true)}
      />

      <main className="flex-1 overflow-y-auto">
        {/* Tab 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <DashboardView
            topGoal={topGoal}
            onUpdateTopGoal={handleUpdateTopGoal}
            projects={projects}
            tasks={tasks}
            approvals={approvals}
            activityLogs={activityLogs}
            onNavigateTab={setActiveTab}
            onResolveApproval={(id, status) => handleResolveApproval(id, status)}
          />
        )}

        {/* Tab 2: AI President Chat */}
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
            onOpenPlanProposal={(plan) => setActivePlanForModal(plan)}
          />
        )}

        {/* Tab 3: Projects */}
        {activeTab === 'projects' && (
          <ProjectsView
            projects={projects}
            tasks={tasks}
            onCreateProject={handleCreateProject}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
            onNavigateToTasksWithFilter={(projId) => {
              setSelectedProjectIdForTasks(projId);
              setActiveTab('tasks');
            }}
          />
        )}

        {/* Tab 4: Tasks */}
        {activeTab === 'tasks' && (
          <TasksView
            tasks={tasks}
            projects={projects}
            characters={characters}
            selectedProjectId={selectedProjectIdForTasks}
            onClearProjectFilter={() => setSelectedProjectIdForTasks(null)}
            onCreateTask={handleCreateTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onRequestApproval={handleRequestApproval}
          />
        )}

        {/* Tab 5: Approvals & Activity Logs */}
        {activeTab === 'approvals' && (
          <ApprovalsView
            approvals={approvals}
            activityLogs={activityLogs}
            onResolveApproval={handleResolveApproval}
          />
        )}

        {/* Tab 6: Custom AI Editor (Preserved) */}
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

        {/* Tab 7: User Memory / Profile (Preserved) */}
        {activeTab === 'profile' && (
          <UserProfileEditor
            userProfile={userProfile}
            onSaveProfile={handleUpdateUserProfile}
          />
        )}

        {/* Tab 8: Presets Catalog (Preserved) */}
        {activeTab === 'presets' && (
          <PresetsView
            onSelectAndChat={(preset) => {
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

      {/* Plan Registration Confirmation Modal */}
      {activePlanForModal && (
        <PlanRegistrationModal
          plan={activePlanForModal}
          isOpen={!!activePlanForModal}
          onClose={() => setActivePlanForModal(null)}
          characters={characters}
          onConfirmRegistration={handleConfirmPlanRegistration}
        />
      )}

      {/* Full Backup & Restore Modal */}
      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        characters={characters}
        userProfile={userProfile}
        projects={projects}
        tasks={tasks}
        approvals={approvals}
        activityLogs={activityLogs}
        topGoal={topGoal}
        onRestoreData={(data) => {
          handleUpdateCharacters(data.characters);
          handleUpdateUserProfile(data.userProfile);
          setProjects(data.projects);
          saveProjects(data.projects);
          setTasks(data.tasks);
          saveTasks(data.tasks);
          setApprovals(data.approvals);
          saveApprovals(data.approvals);
          setActivityLogs(data.activityLogs);
          saveActivityLogs(data.activityLogs);
          setTopGoal(data.topGoal);
          saveTopGoal(data.topGoal);
          if (data.characters.length > 0) {
            handleSelectCharacter(data.characters[0].id);
          }
        }}
      />
    </div>
  );
}
