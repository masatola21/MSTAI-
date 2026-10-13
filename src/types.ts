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

// --- AI社長 / 業務管理システム用データ型 ---

export type Priority = 'high' | 'medium' | 'low';

export type ProjectStatus = 'planning' | 'in_progress' | 'completed' | 'on_hold';

export interface Project {
  id: string;
  name: string;
  objective: string; // 目的・目標
  status: ProjectStatus;
  priority: Priority;
  dueDate?: string; // 期限 (YYYY-MM-DD or '')
  createdAt: number;
  updatedAt: number;
  isSample?: boolean; // サンプル表示用フラグ
}

export type TaskStatus = 'waiting' | 'in_progress' | 'pending_approval' | 'completed' | 'blocked';

export type TaskAssigneeType = 'human' | 'ai_ceo' | 'custom_ai' | 'dev_agent';

export interface TaskAssignee {
  type: TaskAssigneeType;
  id?: string; // custom_ai の場合のキャラID
  name: string; // 表示名: "人間 (あなた)", "AI社長", "クロエ (テックコーチ)", "開発エージェント"
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  projectId: string; // 所属プロジェクトID
  priority: Priority;
  assignee: TaskAssignee;
  status: TaskStatus;
  completionCriteria: string; // 完了条件
  resultNotes?: string; // 結果・成果メモ
  createdAt: number;
  updatedAt: number;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalItem {
  id: string;
  taskId?: string;
  taskTitle: string;
  actionTitle: string; // 実行予定の内容
  reason: string; // 理由・目的
  status: ApprovalStatus;
  requestedBy: string; // 申請者 (例: "AI社長", "人間")
  resolvedAt?: number;
  resolutionNote?: string;
  createdAt: number;
}

export type ActivityActionType =
  | 'task_created'
  | 'task_updated'
  | 'task_status_changed'
  | 'project_created'
  | 'project_updated'
  | 'approval_requested'
  | 'approval_resolved'
  | 'plan_imported';

export interface ActivityLog {
  id: string;
  timestamp: number;
  actionType: ActivityActionType;
  summary: string;
  details?: string;
  actor: string; // 操作主体 ("人間", "AI社長")
}

export interface ProposedPlanTask {
  title: string;
  objective: string;
  priority: Priority;
  completionCriteria: string;
  suggestedAssignee: string;
}

export interface ProposedPlan {
  projectName: string;
  projectObjective: string;
  priority: Priority;
  dueDate?: string;
  tasks: ProposedPlanTask[];
}
