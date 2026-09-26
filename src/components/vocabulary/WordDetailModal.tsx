import React from 'react';
import { 
  X, 
  Volume2, 
  BookOpen, 
  Tag, 
  GitFork, 
  Clock, 
  CheckCircle2, 
  Edit3, 
  Trash2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { Word } from '../../types';
import { speechService } from '../../services/speech';

interface WordDetailModalProps {
  word: Word | null;
  onClose: () => void;
  onEdit: (word: Word) => void;
  onDelete: (wordId: string) => void;
  onSelectRelatedWord?: (wordText: string) => void;
}

export const WordDetailModal: React.FC<WordDetailModalProps> = ({
  word,
  onClose,
  onEdit,
  onDelete,
  onSelectRelatedWord,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  if (!word) return null;

  const handleSpeak = async () => {
    setIsPlayingAudio(true);
    await speechService.speak(word.word, word.language);
    setIsPlayingAudio(false);
  };

  const getStatusBadge = (status: Word['learningStatus']) => {
    switch (status) {
      case 'mastered':
        return { label: 'Öğrenildi / Usta', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'difficult':
        return { label: 'Zor Kelime', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
      case 'learning':
        return { label: 'Öğrenilmekte', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      default:
        return { label: 'Tekrar Havuzunda', bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30' };
    }
  };

  const statusBadge = getStatusBadge(word.learningStatus);
  const accuracy = word.reviewCount > 0 
    ? Math.round((word.correctCount / word.reviewCount) * 100) 
    : 0;

  const nextReviewFormatted = new Date(word.nextReviewDate).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div 
        id="word-detail-card"
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all text-slate-900 dark:text-slate-100"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusBadge.bg}`}>
              {statusBadge.label}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {word.primaryAcademicContext}
            </span>
            <span className="text-xs uppercase font-mono px-2 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400">
              {word.language.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(word)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Düzenle"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
              title="Sil"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto px-6 py-6 space-y-6">
          {/* Main Word Display */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {word.word}
                </h1>
                <button
                  id="pronounce-btn"
                  onClick={handleSpeak}
                  disabled={isPlayingAudio}
                  className="p-2 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900 transition flex items-center justify-center border border-sky-200 dark:border-sky-800/80 shadow-xs"
                  title="Sesli Telaffuz (Web Speech API)"
                >
                  <Volume2 className={`w-5 h-5 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
                </button>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-sm text-slate-500 dark:text-slate-400 font-mono">
                <span className="italic text-slate-600 dark:text-slate-300 font-sans font-medium">
                  {word.partOfSpeech}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                  Zorluk: {word.difficultyRating}/10 ({word.difficultyLabel})
                </span>
              </div>
            </div>
          </div>

          {/* Turkish Meanings (Normalized multi-meaning support) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Türkçe Karşılıkları & Tanımlar
            </h3>
            <div className="space-y-2">
              {word.meanings.map((meaning, index) => (
                <div 
                  key={meaning.id || index} 
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800"
                >
                  <div className="flex items-baseline gap-2">
                    <span className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 text-xs font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      {meaning.trMeaning}
                    </p>
                    {meaning.context && (
                      <span className="text-[11px] text-slate-500 italic">
                        ({meaning.context})
                      </span>
                    )}
                  </div>
                  {meaning.secondaryTrMeanings && meaning.secondaryTrMeanings.length > 0 && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 pl-7">
                      <span className="text-slate-400">İkincil anlamlar: </span>
                      {meaning.secondaryTrMeanings.join(', ')}
                    </p>
                  )}
                  {meaning.definitionEn && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 pl-7 italic border-l-2 border-sky-500/40 pl-2">
                      "{meaning.definitionEn}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Academic Example Sentences */}
          {word.examples && word.examples.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Akademik Örnek Cümleler (Literatür)
              </h3>
              <div className="space-y-2.5">
                {word.examples.map((ex, idx) => (
                  <div 
                    key={ex.id || idx}
                    className="p-3.5 rounded-xl bg-sky-50/40 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40"
                  >
                    <p className="text-sm font-serif text-slate-800 dark:text-slate-200 italic leading-relaxed">
                      "{ex.sentence}"
                    </p>
                    {ex.trTranslation && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-normal">
                        🇹🇷 {ex.trTranslation}
                      </p>
                    )}
                    {ex.sourceContext && (
                      <span className="inline-block text-[10px] text-sky-600 dark:text-sky-400 font-mono mt-1">
                        Kaynak / Bağlam: {ex.sourceContext}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Personal Notes */}
          {word.personalNote && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Kişisel Not
              </h3>
              <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200">
                {word.personalNote}
              </div>
            </div>
          )}

          {/* Word Family */}
          {word.wordFamily && word.wordFamily.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <GitFork className="w-3.5 h-3.5" />
                <span>Kelime Ailesi (Word Family)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {word.wordFamily.map((wf, idx) => (
                  <button
                    key={wf.id || idx}
                    onClick={() => onSelectRelatedWord?.(wf.word)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:text-sky-600 transition border border-slate-200 dark:border-slate-700"
                  >
                    <span className="font-semibold">{wf.word}</span>
                    <span className="text-[10px] text-slate-500">({wf.partOfSpeech})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Synonyms & Antonyms */}
          {((word.synonyms && word.synonyms.length > 0) || (word.antonyms && word.antonyms.length > 0)) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {word.synonyms && word.synonyms.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Eş Anlamlılar: </span>
                  <span className="text-slate-800 dark:text-slate-200">{word.synonyms.join(', ')}</span>
                </div>
              )}
              {word.antonyms && word.antonyms.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Zıt Anlamlılar: </span>
                  <span className="text-slate-800 dark:text-slate-200">{word.antonyms.join(', ')}</span>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {word.tags && word.tags.length > 0 && (
            <div className="flex items-center flex-wrap gap-1.5 pt-1">
              <Tag className="w-3.5 h-3.5 text-slate-400 mr-1" />
              {word.tags.map((tag) => (
                <span 
                  key={tag}
                  className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono"
                >
                  #{tag.replace(/^#/, '')}
                </span>
              ))}
            </div>
          )}

          {/* Spaced Repetition SRS Performance Telemetry */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Aralıklı Tekrar Durumu (FSRS Bellek İstatistiği)</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                <div className="text-slate-500 text-[10px]">Tekrar Sayısı</div>
                <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{word.reviewCount}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                <div className="text-slate-500 text-[10px]">Doğruluk Oranı</div>
                <div className="font-bold text-sm text-slate-800 dark:text-slate-200">%{accuracy}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                <div className="text-slate-500 text-[10px]">Kararlılık (Aralık)</div>
                <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{word.stabilityDays} gün</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                <div className="text-slate-500 text-[10px]">Sonraki Tekrar</div>
                <div className="font-bold text-[11px] text-sky-600 dark:text-sky-400 truncate" title={nextReviewFormatted}>
                  {nextReviewFormatted}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Alert if triggered */}
        {confirmDelete && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/80 border-t border-rose-200 dark:border-rose-900 flex items-center justify-between">
            <p className="text-xs text-rose-800 dark:text-rose-200">
              Bu kelimeyi silmek istediğinize emin misiniz? Tekrar geçmişi de silinir.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1 text-xs rounded-md bg-white dark:bg-slate-800 border border-slate-300 text-slate-700 dark:text-slate-200"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  onDelete(word.id);
                  onClose();
                }}
                className="px-3 py-1 text-xs rounded-md bg-rose-600 text-white font-semibold hover:bg-rose-700"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
