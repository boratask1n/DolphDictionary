import React, { useState, useRef } from 'react';
import { 
  Settings as SettingsIcon, 
  Download, 
  Upload, 
  RotateCcw, 
  Trash2, 
  Cloud, 
  Smartphone, 
  Monitor, 
  ShieldCheck, 
  Check, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { UserSettings, Word, LanguageCode } from '../../types';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  words: Word[];
  onImportWords: (importedWords: Word[]) => void;
  onResetSeeds: () => void;
  onClearAll: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  words,
  onImportWords,
  onResetSeeds,
  onClearAll,
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(words, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `lexilab-academic-export-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export CSV
  const handleExportCSV = () => {
    const header = ['word', 'language', 'partOfSpeech', 'primaryMeaning', 'academicContext', 'tags'].join(',');
    const rows = words.map((w) => [
      `"${w.word.replace(/"/g, '""')}"`,
      `"${w.language}"`,
      `"${w.partOfSpeech}"`,
      `"${(w.meanings[0]?.trMeaning || '').replace(/"/g, '""')}"`,
      `"${(w.primaryAcademicContext || '').replace(/"/g, '""')}"`,
      `"${(w.tags.join(';') || '').replace(/"/g, '""')}"`,
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent([header, ...rows].join('\n'));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', csvContent);
    downloadAnchor.setAttribute('download', `lexilab-vocab-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON / CSV file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            onImportWords(parsed as Word[]);
            setImportStatus(`${parsed.length} kelime başarıyla içe aktarıldı.`);
          } else {
            setImportStatus('Geçersiz JSON formatı: Dizi bekleniyor.');
          }
        } else if (file.name.endsWith('.csv')) {
          // Simple CSV parser
          const lines = content.split('\n').filter((l) => l.trim().length > 0);
          const newWords: Word[] = [];
          
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
            if (cols.length >= 4 && cols[0]) {
              const wordText = cols[0];
              const lang = (cols[1] === 'de' ? 'de' : 'en') as LanguageCode;
              const pos = cols[2] || 'noun';
              const meaning = cols[3];
              const ctx = cols[4] || 'General Academic';

              newWords.push({
                id: `import-${Date.now()}-${i}`,
                word: wordText,
                language: lang,
                partOfSpeech: pos as any,
                meanings: [{ id: `m-${Date.now()}-${i}`, trMeaning: meaning, secondaryTrMeanings: [] }],
                examples: [],
                primaryAcademicContext: ctx,
                synonyms: [],
                antonyms: [],
                relatedWords: [],
                wordFamily: [],
                tags: [ctx.toLowerCase()],
                difficultyRating: 4.0,
                difficultyLabel: 'Medium',
                learningStatus: 'learning',
                dateAdded: new Date().toISOString(),
                nextReviewDate: new Date().toISOString(),
                reviewCount: 0,
                correctCount: 0,
                incorrectCount: 0,
                stabilityDays: 1.0,
                difficultyFactor: 4.0,
                lapses: 0,
                streak: 0,
              });
            }
          }

          if (newWords.length > 0) {
            onImportWords(newWords);
            setImportStatus(`${newWords.length} kelime CSV'den başarıyla içe aktarıldı.`);
          } else {
            setImportStatus('CSV dosyasında geçerli kelime bulunamadı.');
          }
        }
      } catch (err) {
        setImportStatus('Dosya işlenirken hata oluştu: Lütfen formatı kontrol edin.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Uygulama Ayarları & Veri Yönetimi
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Kişisel öğrenme tercihleri, telaffuz ayarları ve veri sahipliği araçları.
        </p>
      </div>

      {/* Language & Learning Preferences */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white">
          Öğrenme Tercihleri
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Aktif Öğrenme Dili
            </label>
            <select
              value={settings.activeLanguage}
              onChange={(e) => onUpdateSettings({ activeLanguage: e.target.value as LanguageCode })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            >
              <option value="en">İngilizce (C1/C2 Akademik)</option>
              <option value="de">Almanca (Deutsch)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Ana Dil (Arayüz Dili)
            </label>
            <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300">
              Türkçe (Varsayılan)
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Günlük Tekrar Hedefi (Kart Sayısı)
            </label>
            <select
              value={settings.dailyGoal}
              onChange={(e) => onUpdateSettings({ dailyGoal: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            >
              <option value={10}>10 Kart / Gün</option>
              <option value={15}>15 Kart / Gün (Önerilen)</option>
              <option value={25}>25 Kart / Gün (Yoğun)</option>
              <option value={50}>50 Kart / Gün (Sınav Dönemi)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              İngilizce Telaffuz Aksanı
            </label>
            <select
              value={settings.pronunciationPreference}
              onChange={(e) => onUpdateSettings({ pronunciationPreference: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            >
              <option value="us">Amerikan İngilizcesi (en-US)</option>
              <option value="uk">İngiliz İngilizcesi (en-GB)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Ownership: Export & Import (Sections 29 & 30) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div>
          <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white">
            Veri Sahipliği & Yedekleme (Data Ownership)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Akademik kelime verileriniz tamamen size aittir. JSON ve CSV formatında tam yedek alabilir veya geri yükleyebilirsiniz.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold transition"
          >
            <Download className="w-4 h-4 text-sky-500" />
            <span>Tüm Verileri İndir (JSON)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold transition"
          >
            <FileText className="w-4 h-4 text-emerald-500" />
            <span>Kelime Listesini İndir (CSV)</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-semibold shadow-xs transition"
          >
            <Upload className="w-4 h-4" />
            <span>Yedek Yükle (JSON/CSV)</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,.csv"
            className="hidden"
          />
        </div>

        {importStatus && (
          <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs text-sky-800 dark:text-sky-200 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{importStatus}</span>
          </div>
        )}
      </div>

      {/* Dangerous Operations */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white">
          Sıfırlama & Varsayılana Dönüş
        </h3>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2.5 rounded-xl border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-semibold hover:bg-amber-50 dark:hover:bg-amber-950/30 transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Astronomi Örnek Kelimelerini Yeniden Yükle</span>
          </button>

          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/30 transition flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Tüm Verileri Temizle</span>
          </button>
        </div>

        {showResetConfirm && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 flex items-center justify-between text-xs">
            <span className="text-amber-800 dark:text-amber-200">
              Mevcut kelimeler temizlenip varsayılan akademik astronomi kelimeleri yüklensin mi?
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 border"
              >
                Vazgeç
              </button>
              <button
                onClick={() => {
                  onResetSeeds();
                  setShowResetConfirm(false);
                }}
                className="px-2.5 py-1 rounded bg-amber-600 text-white font-semibold"
              >
                Onayla
              </button>
            </div>
          </div>
        )}

        {showClearConfirm && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-center justify-between text-xs">
            <span className="text-rose-800 dark:text-rose-200">
              Tüm kelimeler ve tekrar geçmişi kalıcı olarak silinsin mi?
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 border"
              >
                Vazgeç
              </button>
              <button
                onClick={() => {
                  onClearAll();
                  setShowClearConfirm(false);
                }}
                className="px-2.5 py-1 rounded bg-rose-600 text-white font-semibold"
              >
                Evet, Hepsini Sil
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Future Platforms Architecture Roadmap (Section 1, 2, 36, 37) */}
      <div className="p-6 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-sky-500" />
          <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white">
            Gelecek Aşamalar & Çoklu Platform Mimarisi (Roadmap)
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Uygulama iş mantığı, SRS algoritması ve veri modelleri platform bağımsız olarak tasarlanmıştır.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-1">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
              <Cloud className="w-4 h-4 text-sky-500" />
              <span>Aşama 2: Supabase Senkronizasyon</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              PostgreSQL, Row Level Security (RLS) ve Supabase Auth entegrasyonu ile cihazlar arası bulut senkronizasyonu.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-1">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
              <Smartphone className="w-4 h-4 text-emerald-500" />
              <span>Aşama 7: Android (React Native / Expo)</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Mevcut FSRS algoritması ve veri şeması doğrudan React Native çekirdeğine taşınacaktır.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-1">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
              <Monitor className="w-4 h-4 text-indigo-500" />
              <span>Aşama 8: Windows (Tauri)</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Bu React web istemcisi Tauri ile yerel Windows .exe uygulaması olarak paketlenecektir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
