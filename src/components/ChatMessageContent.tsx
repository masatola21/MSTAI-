import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface ChatMessageContentProps {
  content: string;
}

export const ChatMessageContent: React.FC<ChatMessageContentProps> = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCode = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Simple and safe markdown parser for bold, italics, code blocks, lists, quotes, and headings
  const parseMarkdown = (raw: string) => {
    // Split into code blocks and normal text
    const parts = raw.split(/(```[\s\S]*?```)/g);

    return parts.map((part, partIdx) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        let language = 'text';
        let codeBody = '';
        if (lines[0] && !lines[0].includes(' ') && lines[0].length < 20) {
          language = lines[0].trim();
          codeBody = lines.slice(1).join('\n');
        } else {
          codeBody = lines.join('\n');
        }

        return (
          <div key={partIdx} className="my-3 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-900/95 shadow-md">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/80 border-b border-slate-700/60 text-xs text-slate-300">
              <span className="font-mono uppercase tracking-wider text-[11px] text-slate-400">{language || 'CODE'}</span>
              <button
                type="button"
                onClick={() => copyCode(codeBody, partIdx)}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer px-1.5 py-0.5 rounded hover:bg-slate-700/50"
              >
                {copiedIndex === partIdx ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] text-emerald-400">コピー完了</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px]">コードをコピー</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 text-xs md:text-sm font-mono overflow-x-auto text-emerald-300/90 leading-relaxed whitespace-pre">
              <code>{codeBody}</code>
            </pre>
          </div>
        );
      }

      // Normal text: split by lines
      const lines = part.split('\n');
      return (
        <span key={partIdx}>
          {lines.map((line, lineIdx) => {
            // Header 3 or 2
            if (line.startsWith('### ')) {
              return (
                <h4 key={lineIdx} className="text-base font-bold text-indigo-200 mt-3 mb-1">
                  {renderInline(line.replace('### ', ''))}
                </h4>
              );
            }
            if (line.startsWith('## ')) {
              return (
                <h3 key={lineIdx} className="text-lg font-bold text-indigo-300 mt-4 mb-2 border-b border-indigo-500/20 pb-1">
                  {renderInline(line.replace('## ', ''))}
                </h3>
              );
            }
            if (line.startsWith('# ')) {
              return (
                <h2 key={lineIdx} className="text-xl font-extrabold text-white mt-4 mb-2">
                  {renderInline(line.replace('# ', ''))}
                </h2>
              );
            }

            // Bullet list
            if (line.startsWith('- ') || line.startsWith('* ')) {
              return (
                <div key={lineIdx} className="flex items-start gap-2 my-1 pl-1">
                  <span className="text-indigo-400 select-none mt-1 text-xs">•</span>
                  <div className="flex-1 leading-relaxed">{renderInline(line.slice(2))}</div>
                </div>
              );
            }

            // Numbered list
            const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
            if (numMatch) {
              return (
                <div key={lineIdx} className="flex items-start gap-2 my-1 pl-1">
                  <span className="text-indigo-400 font-semibold text-xs select-none mt-0.5">{numMatch[1]}.</span>
                  <div className="flex-1 leading-relaxed">{renderInline(numMatch[2])}</div>
                </div>
              );
            }

            // Quote block
            if (line.startsWith('> ')) {
              return (
                <blockquote key={lineIdx} className="border-l-2 border-indigo-400/60 pl-3 my-2 text-slate-300/90 italic bg-indigo-950/20 py-1 rounded-r">
                  {renderInline(line.replace('> ', ''))}
                </blockquote>
              );
            }

            // Empty line
            if (line.trim() === '') {
              return <div key={lineIdx} className="h-2" />;
            }

            return (
              <p key={lineIdx} className="leading-relaxed mb-1.5 last:mb-0">
                {renderInline(line)}
              </p>
            );
          })}
        </span>
      );
    });
  };

  // Inline formatting: `code`, **bold**, *italic*
  const renderInline = (text: string) => {
    // inline code
    const chunks = text.split(/(`[^`]+`)/g);
    return chunks.map((chunk, i) => {
      if (chunk.startsWith('`') && chunk.endsWith('`') && chunk.length > 2) {
        return (
          <code key={i} className="bg-slate-800 text-indigo-300 text-xs px-1.5 py-0.5 rounded font-mono border border-slate-700/60 mx-0.5">
            {chunk.slice(1, -1)}
          </code>
        );
      }

      // bold **text**
      const boldChunks = chunk.split(/(\*\*[^*]+\*\*)/g);
      return boldChunks.map((bChunk, bi) => {
        if (bChunk.startsWith('**') && bChunk.endsWith('**') && bChunk.length > 4) {
          return (
            <strong key={`${i}-${bi}`} className="font-semibold text-white">
              {bChunk.slice(2, -2)}
            </strong>
          );
        }
        return bChunk;
      });
    });
  };

  return <div className="space-y-1 text-sm md:text-[15px]">{parseMarkdown(content)}</div>;
};
