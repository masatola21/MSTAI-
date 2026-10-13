import React, { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, UserCheck, Library, Plus, ChevronDown, Check, Download, Upload } from 'lucide-react';
import { CharacterConfig } from '../types';
import { getColorScheme } from '../utils/theme';

interface HeaderProps {
  characters: CharacterConfig[];
  activeCharacter: CharacterConfig;
  activeTab: 'chat' | 'editor' | 'profile' | 'presets';
  onSelectCharacter: (id: string) => void;
  onSelectTab: (tab: 'chat' | 'editor' | 'profile' | 'presets') => void;
  onCreateNew: () => void;
  onOpenBackup: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  characters,
  activeCharacter,
  activeTab,
  onSelectCharacter,
  onSelectTab,
  onCreateNew,
  onOpenBackup,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scheme = getColorScheme(activeCharacter.avatarColor);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-3 md:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand & Active Character Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onSelectTab('chat')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-lg">
              <Bot className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-white text-base">MyAI Studio</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  自分専用
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">専属AIアシスタント作成スタジオ</p>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-800 hidden md:block" />

          {/* Character Quick Switcher Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border ${scheme.border} bg-slate-900/90 hover:bg-slate-855 transition-all text-left cursor-pointer group shadow-sm`}
            >
              <span className="text-xl select-none leading-none">{activeCharacter.avatarEmoji || '🤖'}</span>
              <div className="max-w-[130px] sm:max-w-[180px] truncate">
                <div className="text-xs font-bold text-white flex items-center gap-1">
                  <span className="truncate">{activeCharacter.name}</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">{activeCharacter.role}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform duration-200" />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl shadow-black/80 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                  <span>作成済みのAI ({characters.length}体)</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      onCreateNew();
                    }}
                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 font-medium cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> 新規作成
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {characters.map((char) => {
                    const isSelected = char.id === activeCharacter.id;
                    return (
                      <button
                        key={char.id}
                        type="button"
                        onClick={() => {
                          onSelectCharacter(char.id);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-slate-800/70 transition-colors cursor-pointer ${
                          isSelected ? 'bg-indigo-500/10' : ''
                        }`}
                      >
                        <span className="text-xl select-none">{char.avatarEmoji || '🤖'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-white flex items-center justify-between">
                            <span className="truncate">{char.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">{char.role}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="pt-1.5 mt-1 border-t border-slate-800/80 px-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      onSelectTab('presets');
                    }}
                    className="w-full py-1.5 px-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Library className="w-3.5 h-3.5 text-indigo-400" />
                    プリセットカタログを見る
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center / Right: Nav Tabs */}
        <div className="flex items-center gap-1 sm:gap-2">
          <nav className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800/80 shadow-inner">
            <button
              type="button"
              onClick={() => onSelectTab('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>対話</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'editor'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AIカスタマイズ</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('profile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>あなたの記憶</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('presets')}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'presets'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Library className="w-3.5 h-3.5" />
              <span>プリセット</span>
            </button>
          </nav>

          {/* Quick Create & Export */}
          <button
            type="button"
            onClick={onCreateNew}
            title="新しいAIを作成"
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>AI新規作成</span>
          </button>

          <button
            type="button"
            onClick={onOpenBackup}
            title="バックアップ / データ管理"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors border border-slate-800/60 cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
