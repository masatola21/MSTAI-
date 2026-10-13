import React, { useState } from 'react';
import { Download, Upload, Copy, Check, RotateCcw, X, FileText } from 'lucide-react';
import { CharacterConfig, UserProfile } from '../types';
import { PRESET_CHARACTERS } from '../data/presets';
import { DEFAULT_USER_PROFILE } from '../utils/storage';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: CharacterConfig[];
  userProfile: UserProfile;
  onRestoreData: (chars: CharacterConfig[], profile: UserProfile) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  characters,
  userProfile,
  onRestoreData,
}) => {
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentExportJson = JSON.stringify(
    {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      characters,
      userProfile,
    },
    null,
    2
  );

  const handleCopyJson = () => {
    navigator.clipboard.writeText(currentExportJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([currentExportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `myai-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText);
      if (!parsed.characters || !Array.isArray(parsed.characters)) {
        throw new Error('JSONに有効な characters 配列が含まれていません。');
      }
      onRestoreData(parsed.characters, parsed.userProfile || DEFAULT_USER_PROFILE);
      setImportStatus('✅ データのインポートに成功しました！');
      setTimeout(() => {
        setImportStatus(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      setImportStatus(`❌ エラー: ${err.message || '無効なJSONフォーマットです'}`);
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm('初期プリセットにリセットしますか？現在のカスタマイズ内容は失われます。')) {
      onRestoreData(PRESET_CHARACTERS, DEFAULT_USER_PROFILE);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Download className="w-5 h-5 text-indigo-400" />
            <span>データ管理・バックアップ & インポート</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Section */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider">
            1. 作成したAIと記憶のエクスポート
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDownloadFile}
              className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-indigo-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSONファイル保存</span>
            </button>
            <button
              type="button"
              onClick={handleCopyJson}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'コピー完了' : 'JSON文字列をコピー'}</span>
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider">
            2. JSONから復元・インポート
          </label>
          <textarea
            rows={4}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="ここにエクスポートしたJSONを貼り付けてください..."
            className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
          />
          {importStatus && (
            <div className="text-xs p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200">
              {importStatus}
            </div>
          )}
          <button
            type="button"
            onClick={handleImport}
            disabled={!importText.trim()}
            className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>インポートを実行</span>
          </button>
        </div>

        {/* Reset */}
        <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>初期状態に戻したい場合:</span>
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>初期プリセットにリセット</span>
          </button>
        </div>
      </div>
    </div>
  );
};
