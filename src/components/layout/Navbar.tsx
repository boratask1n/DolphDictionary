import React from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  Sparkles, 
  Plus, 
  Sun, 
  Moon, 
  Compass,
  Bookmark,
  LayoutGrid,
  Bot,
  Cloud,
  User,
  BarChart3
} from 'lucide-react';
import { LanguageCode } from '../../types';

export type ActivePage = 'home' | 'dictionary' | 'reels' | 'analytics';

interface NavbarProps {
  activePage: ActivePage;
  onPageChange: (page: ActivePage) => void;
  activeLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  onOpenAddModal: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  wordCount: number;
  onOpenAIChat?: () => void;
  currentUser?: {
    displayName?: string | null;
    photoURL?: string | null;
    email?: string | null;
  } | null;
  onOpenAuthModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  onPageChange,
  activeLanguage,
  onLanguageChange,
  onOpenAddModal,
  isDarkMode,
  onToggleDarkMode,
  wordCount,
  onOpenAIChat,
  currentUser,
  onOpenAuthModal,
}) => {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#faf8f5]/90 dark:bg-[#0e1217]/90 border-b border-slate-200/60 dark:border-white/[0.07] transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark (Clean, Single text element) */}
        <div 
          onClick={() => onPageChange('home')}
          className="flex items-center gap-2 cursor-pointer select-none group"
        >
          <span className="font-serif font-bold text-xl sm:text-2xl tracking-tight text-slate-900 dark:text-white transition-colors group-hover:text-amber-600 dark:group-hover:text-amber-400">
            LexiLab
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mb-1" />
        </div>

        {/* Zone 2: Navigation Links (Clean Segmented Tabs) */}
        <nav className="flex items-center p-1 rounded-xl bg-slate-200/50 dark:bg-white/[0.05] border border-slate-200/60 dark:border-white/[0.06]">
          {/* Anasayfa */}
          <button
            id="tab-home-btn"
            onClick={() => onPageChange('home')}
            className={`relative flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors duration-150 cursor-pointer ${
              activePage === 'home'
                ? 'text-slate-900 dark:text-white'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {activePage === 'home' && (
              <motion.div
                layoutId="nav-active-pill"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="absolute inset-0 rounded-lg bg-white dark:bg-slate-800 shadow-2xs border border-slate-200/70 dark:border-white/[0.08]"
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Anasayfa</span>
            </span>
          </button>

          {/* Sözlük */}
          <button
            id="tab-dictionary-btn"
            onClick={() => onPageChange('dictionary')}
            className={`relative flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors duration-150 cursor-pointer ${
              activePage === 'dictionary'
                ? 'text-slate-900 dark:text-white'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {activePage === 'dictionary' && (
              <motion.div
                layoutId="nav-active-pill"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="absolute inset-0 rounded-lg bg-white dark:bg-slate-800 shadow-2xs border border-slate-200/70 dark:border-white/[0.08]"
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              <span>Sözlük</span>
              {wordCount > 0 && (
                <span className="text-[11px] font-mono opacity-60 tabular-nums">
                  {wordCount}
                </span>
              )}
            </span>
          </button>

          {/* Sticky Reels */}
          <button
            id="tab-reels-btn"
            onClick={() => onPageChange('reels')}
            className={`relative flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors duration-150 cursor-pointer ${
              activePage === 'reels'
                ? 'text-slate-900 dark:text-white'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {activePage === 'reels' && (
              <motion.div
                layoutId="nav-active-pill"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="absolute inset-0 rounded-lg bg-white dark:bg-slate-800 shadow-2xs border border-slate-200/70 dark:border-white/[0.08]"
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Sticky Reels</span>
            </span>
          </button>

          {/* Grafikler */}
          <button
            id="tab-analytics-btn"
            onClick={() => onPageChange('analytics')}
            className={`relative flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors duration-150 cursor-pointer ${
              activePage === 'analytics'
                ? 'text-slate-900 dark:text-white'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {activePage === 'analytics' && (
              <motion.div
                layoutId="nav-active-pill"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="absolute inset-0 rounded-lg bg-white dark:bg-slate-800 shadow-2xs border border-slate-200/70 dark:border-white/[0.08]"
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-sky-500" />
              <span>Grafikler</span>
            </span>
          </button>
        </nav>

        {/* Zone 3: Language Toggle & Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* EN / DE Segmented Switcher */}
          <div 
            id="lang-switcher"
            className="flex items-center p-0.5 rounded-lg bg-slate-200/50 dark:bg-white/[0.05] border border-slate-200/60 dark:border-white/[0.06] text-xs font-mono font-bold"
            title="Dili Değiştir (İngilizce / Almanca)"
          >
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                activeLanguage === 'en'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => onLanguageChange('de')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                activeLanguage === 'de'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              DE
            </button>
          </div>

          {/* AI Dil Koçu Button */}
          {onOpenAIChat && (
            <button
              id="nav-ai-coach-btn"
              onClick={onOpenAIChat}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-300 text-xs sm:text-sm font-semibold border border-amber-500/20 transition cursor-pointer"
              title="AI Dil Koçunu Aç"
            >
              <Bot className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline font-sans">AI Koç</span>
            </button>
          )}

          {/* Quick Add Word Button */}
          <button
            id="quick-add-btn"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs sm:text-sm font-semibold transition-all duration-150 active:scale-95 cursor-pointer shadow-2xs"
            title="Yeni Kelime Ekle"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline font-sans">Ekle</span>
          </button>

          {/* Account & Persistent Cloud Database Button */}
          {onOpenAuthModal && (
            <button
              id="nav-account-btn"
              onClick={onOpenAuthModal}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                currentUser
                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/20'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-white/[0.08]'
              }`}
              title={currentUser ? `${currentUser.displayName || currentUser.email} (Bulut Veritabanı Aktif)` : 'Giriş Yap & Kalıcı Kaydet'}
            >
              {currentUser ? (
                <>
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="Profil"
                      className="w-4 h-4 rounded-full object-cover"
                    />
                  ) : (
                    <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  )}
                  <span className="hidden sm:inline font-sans truncate max-w-[90px]">
                    {currentUser.displayName?.split(' ')[0] || 'Hesabım'}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span className="font-sans">Giriş Yap</span>
                </>
              )}
            </button>
          )}

          {/* Dark / Light Mode Switch */}
          <button
            id="nav-theme-toggle"
            type="button"
            onClick={onToggleDarkMode}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer ${
              isDarkMode
                ? 'bg-slate-800 text-amber-300 border-amber-400/20 hover:bg-slate-700/80 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-100 shadow-2xs'
            }`}
            title={isDarkMode ? 'Açık Temaya Geç' : 'Karanlık Temaya Geç'}
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-sans font-medium text-slate-200">Karanlık</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-[11px] font-sans font-medium text-slate-600">Açık</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
