import React from 'react';
import { 
  BarChart3, 
  Flame, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCw, 
  TrendingUp, 
  Calendar,
  Layers,
  BookOpen
} from 'lucide-react';
import { Word, ReviewLog } from '../../types';

interface StatisticsViewProps {
  words: Word[];
  reviewLogs: ReviewLog[];
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({
  words,
  reviewLogs,
}) => {
  const totalWords = words.length;
  const masteredWords = words.filter((w) => w.learningStatus === 'mastered').length;
  const learningWords = words.filter((w) => w.learningStatus === 'learning').length;
  const reviewWords = words.filter((w) => w.learningStatus === 'review').length;
  const difficultWords = words.filter(
    (w) => w.learningStatus === 'difficult' || w.difficultyRating >= 6.5
  ).length;

  const totalReviews = reviewLogs.length;
  const rememberedLogs = reviewLogs.filter((l) => l.feedback === 'remembered').length;
  const difficultLogs = reviewLogs.filter((l) => l.feedback === 'difficult').length;
  const forgotLogs = reviewLogs.filter((l) => l.feedback === 'forgot').length;

  const accuracy = totalReviews > 0 
    ? Math.round(((rememberedLogs + difficultLogs * 0.5) / totalReviews) * 100) 
    : 0;

  // Context distribution
  const contextCounts: Record<string, number> = {};
  words.forEach((w) => {
    const ctx = w.primaryAcademicContext || 'General Academic';
    contextCounts[ctx] = (contextCounts[ctx] || 0) + 1;
  });

  // Recent 10 Review Logs
  const recentLogs = [...reviewLogs].slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Akademik İstatistikler & Bellek Analitiği
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Spaced Repetition (FSRS) kararlılık eğrileri ve kelime öğrenme performansı.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Toplam Tekrar
          </span>
          <div className="font-serif text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {totalReviews}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Seanslarda test edilen kart</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Geri Çağırma Doğruluğu
          </span>
          <div className="font-serif text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1">
            %{accuracy}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Ağırlıklı hatırlama skoru</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Ustalaşılan Kelime
          </span>
          <div className="font-serif text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {masteredWords}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">&gt;21 gün kararlı aralık</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Kritik / Zor Kelimeler
          </span>
          <div className="font-serif text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {difficultWords}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Zorluk &ge; 6.5 veya sık unutulan</div>
        </div>
      </div>

      {/* Two Column Section: Feedback Breakdown & Contexts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Feedback distribution */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white">
            Bellek Geri Bildirim Dağılımı
          </h3>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">🟢 Hatırlandı</span>
                <span className="font-mono text-slate-600 dark:text-slate-400">{rememberedLogs} ({totalReviews > 0 ? Math.round((rememberedLogs / totalReviews) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full" 
                  style={{ width: `${totalReviews > 0 ? (rememberedLogs / totalReviews) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-amber-600 dark:text-amber-400 font-semibold">🟡 Zorlanıldı</span>
                <span className="font-mono text-slate-600 dark:text-slate-400">{difficultLogs} ({totalReviews > 0 ? Math.round((difficultLogs / totalReviews) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full" 
                  style={{ width: `${totalReviews > 0 ? (difficultLogs / totalReviews) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-rose-600 dark:text-rose-400 font-semibold">🔴 Unutuldu</span>
                <span className="font-mono text-slate-600 dark:text-slate-400">{forgotLogs} ({totalReviews > 0 ? Math.round((forgotLogs / totalReviews) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div 
                  className="bg-rose-500 h-full rounded-full" 
                  style={{ width: `${totalReviews > 0 ? (forgotLogs / totalReviews) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Academic Contexts */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white">
            Akademik Disiplin Dağılımı
          </h3>

          <div className="space-y-2.5">
            {Object.keys(contextCounts).map((ctx) => {
              const count = contextCounts[ctx];
              const pct = totalWords > 0 ? Math.round((count / totalWords) * 100) : 0;
              return (
                <div key={ctx}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{ctx}</span>
                    <span className="font-mono text-slate-500">{count} kelime (%{pct})</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div 
                      className="bg-sky-500 h-full rounded-full" 
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Review Logs Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white">
          Son Tekrar Geçmişi (Review History Log)
        </h3>

        {recentLogs.length === 0 ? (
          <p className="text-xs text-slate-500 italic">Henüz kaydedilmiş tekrar bulunmuyor.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Kelime</th>
                  <th className="py-2.5 px-3">Sonuç</th>
                  <th className="py-2.5 px-3">Yeni Aralık</th>
                  <th className="py-2.5 px-3">Zorluk Faktörü</th>
                  <th className="py-2.5 px-3">Zaman</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {recentLogs.map((log) => {
                  const dateFormatted = new Date(log.timestamp).toLocaleString('tr-TR', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-serif font-bold text-slate-800 dark:text-slate-200">
                        {log.wordText}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          log.feedback === 'remembered'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : log.feedback === 'difficult'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                        }`}>
                          {log.feedback === 'remembered' ? 'Hatırlandı' : log.feedback === 'difficult' ? 'Zorlanıldı' : 'Unutuldu'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        {log.newIntervalDays} gün
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        {log.newDifficulty}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                        {dateFormatted}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
