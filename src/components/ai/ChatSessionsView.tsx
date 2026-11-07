import React from 'react';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { ChatSession } from '../../services/aiTutorService';
import { LanguageCode } from '../../types';

interface ChatSessionsViewProps {
  sessions: ChatSession[];
  activeLanguage: LanguageCode;
  activeSessionId: string;
  canCreate: boolean;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onOpen: () => void;
}

export const ChatSessionsView: React.FC<ChatSessionsViewProps> = ({
  sessions,
  activeLanguage,
  activeSessionId,
  canCreate,
  onSelect,
  onCreate,
  onDelete,
  onOpen,
}) => (
  <div className="w-full min-w-0 max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 overflow-x-hidden">
    <div className="flex min-w-0 flex-col sm:flex-row sm:items-end justify-between gap-4">
    <div className="min-w-0">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase tracking-wide">
          <MessageSquare className="w-4 h-4" />
          <span>{activeLanguage === 'de' ? '🇩🇪 Almanca' : '🇬🇧 İngilizce'}</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">
          AI Sohbetleri
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Bu sözlüğe ait sohbetlerinizi yönetin. {sessions.length}/3 aktif sohbet kullanılıyor.
        </p>
      </div>
      <button
        onClick={onCreate}
        disabled={!canCreate}
        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Plus className="w-4 h-4" />
        Yeni sohbet
      </button>
    </div>

    <div className="grid gap-3">
      {sessions.map((session) => {
        const lastMessage = session.messages[session.messages.length - 1];
        return (
          <div
            key={session.id}
            className={`flex min-w-0 max-w-full items-center gap-3 p-4 rounded-2xl border ${
              session.id === activeSessionId
                ? 'border-amber-400 bg-amber-500/5'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
            }`}
          >
            <button onClick={() => { onSelect(session.id); onOpen(); }} className="flex-1 min-w-0 text-left">
              <p className="font-semibold text-slate-900 dark:text-white truncate">{session.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                {lastMessage?.content || 'Henüz mesaj yok'}
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                {session.messages.length} mesaj · {new Date(session.updatedAt).toLocaleDateString('tr-TR')}
              </p>
            </button>
            <button
              onClick={() => onDelete(session.id)}
              className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              title="Sohbeti sil"
              aria-label="Sohbeti sil"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      })}
      {sessions.length === 0 && (
        <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-sm text-slate-500">
          Bu dil için henüz sohbet yok.
        </div>
      )}
    </div>
  </div>
);
