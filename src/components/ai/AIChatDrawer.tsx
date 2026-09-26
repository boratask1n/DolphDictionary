import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Send, 
  X, 
  Bot, 
  Volume2, 
  RotateCcw, 
  MessageSquare, 
  Lightbulb, 
  GraduationCap, 
  BookOpen,
  ArrowRight,
  HelpCircle,
  CheckCircle2,
  Trash2,
  Database
} from 'lucide-react';
import { Word, LanguageCode, ReviewLog } from '../../types';
import { ChatMessage, explainWordWithAI, sendChatMessageToAI, UserVocabContext } from '../../services/aiTutorService';
import { buildUserVocabContext } from '../../utils/vocabAnalytics';
import { FormattedAIMessage } from './FormattedAIMessage';

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  word?: Word | null;
  activeLanguage: LanguageCode;
  allWords?: Word[];
  reviewLogs?: ReviewLog[];
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({
  isOpen,
  onClose,
  word,
  activeLanguage,
  allWords = [],
  reviewLogs = [],
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [speakingText, setSpeakingText] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Suggested prompt chips based on whether a word is active
  const wordPrompts = [
    'Bana bu kelimeyle mini bir günlük diyalog kur.',
    'İş veya akademik bir e-postada nasıl kullanılır?',
    'Eş anlamlılarıyla arasındaki ince fark nedir?',
    'Sık yapılan hatalar ve edat (preposition) tüyoları neler?',
    'Bu kelimeyi akılda tutmak için bir hafıza tekniği (mnemonik) ver.'
  ];

  const generalPrompts = [
    activeLanguage === 'de'
      ? 'Zorlandığım Almanca kelimeler hangileri ve ne yapmalıyım?'
      : 'Zorlandığım İngilizce kelimeler hangileri ve ne yapmalıyım?',
    'Kayıtlı kelimelerimle bana seviyeme uygun bir diyalog yaz.',
    'Öğrenmekte olduğum kelimelerimden bana 3 soruluk mini quiz yap.',
    'Kelime dağarcığımın ve ilerlememin analizini yapar mısın?',
    activeLanguage === 'de'
      ? 'Almanca günlük konuşmada en doğal 3 kalıp öner.'
      : 'İngilizce günlük konuşmada en doğal 3 kalıp öner.'
  ];

  // Initialize or fetch AI content when drawer opens
  useEffect(() => {
    if (!isOpen) return;

    if (word) {
      // If we opened with a specific word, check if we already have it in current messages
      const hasWordExpl = messages.some(
        (m) => m.contextWord?.toLowerCase() === word.word.toLowerCase() && m.role === 'model'
      );

      if (!hasWordExpl) {
        // Fetch fresh explanation for this word
        handleFetchWordExplanation(word);
      }
    } else if (messages.length === 0) {
      // General greeting
      const langName = activeLanguage === 'de' ? 'Almanca' : 'İngilizce';
      const welcomeMsg: ChatMessage = {
        id: `welcome-${Date.now()}`,
        role: 'model',
        content: `Merhaba! Ben **LexiLab AI Dil Koçun** 🎓\n\n${langName} ve Türkçe dillerinde uzman bir dil mentörüyüm. Kelime anlamları, cümle analizleri, gramer açıklamaları, telaffuz veya serbest konuşma pratiği için dilediğin gibi sorabilirsin.\n\n*Aşağıdaki önerilerden birine tıklayabilir veya aklındaki soruyu yazabilirsin:*`,
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMsg]);
    }
  }, [isOpen, word, activeLanguage]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when ready
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen]);

  const handleFetchWordExplanation = async (targetWord: Word) => {
    setIsLoading(true);
    const meaning = targetWord.meanings[0]?.trMeaning || '';
    
    // Initial placeholder message for the user request
    const userMsg: ChatMessage = {
      id: `req-${Date.now()}`,
      role: 'user',
      content: `"${targetWord.word}" kelimesinin detaylı analizini, anlamlarını ve örnek cümlelerini incelemek istiyorum.`,
      timestamp: new Date().toISOString(),
      contextWord: targetWord.word,
    };

    setMessages((prev) => [...prev, userMsg]);

    const result = await explainWordWithAI(
      targetWord.word,
      targetWord.language || activeLanguage,
      meaning,
      targetWord.primaryAcademicContext
    );

    setIsLoading(false);

    if (result.success && result.explanation) {
      const modelMsg: ChatMessage = {
        id: `resp-${Date.now()}`,
        role: 'model',
        content: result.explanation,
        timestamp: new Date().toISOString(),
        contextWord: targetWord.word,
      };
      setMessages((prev) => [...prev, modelMsg]);
    } else {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `Kelime analizi yüklenirken bir problem oluştu: ${result.error || 'Bilinmeyen hata'}. Lütfen tekrar deneyin.`,
        timestamp: new Date().toISOString(),
        contextWord: targetWord.word,
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    setInputPrompt('');

    const newMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      contextWord: word?.word,
    };

    const nextHistory = [...messages, newMsg];
    setMessages(nextHistory);
    setIsLoading(true);

    const currentLang = word?.language || activeLanguage;
    const userContext = buildUserVocabContext(allWords, reviewLogs, currentLang);

    const res = await sendChatMessageToAI(
      text,
      nextHistory,
      currentLang,
      word?.word,
      userContext
    );

    setIsLoading(false);

    if (res.success && res.reply) {
      const replyMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: res.reply,
        timestamp: new Date().toISOString(),
        contextWord: word?.word,
      };
      setMessages((prev) => [...prev, replyMsg]);
    } else {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `Üzgünüm, yanıt oluşturulurken bir hata meydana geldi: ${res.error || 'Sunucu hatası'}.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handlePlayAudio = (phrase: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = (word?.language || activeLanguage) === 'de' ? 'de-DE' : 'en-US';
    utterance.rate = 0.88;
    setSpeakingText(phrase);
    utterance.onend = () => setSpeakingText(null);
    utterance.onerror = () => setSpeakingText(null);
    window.speechSynthesis.speak(utterance);
  };

  const handleClearHistory = () => {
    setMessages([]);
    if (word) {
      handleFetchWordExplanation(word);
    }
  };

  if (!isOpen) return null;

  const currentLang = word?.language || activeLanguage;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs transition-opacity"
        />

        {/* Slide-over Drawer Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="relative w-full max-w-xl bg-[#faf8f5] dark:bg-[#0f1319] shadow-2xl border-l border-slate-200/80 dark:border-white/[0.08] flex flex-col h-full z-10"
        >
          {/* Top Header */}
          <div className="px-5 py-4 border-b border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-slate-900/70 backdrop-blur-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-2xs shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-serif font-bold text-base text-slate-900 dark:text-slate-100 truncate">
                    {word ? (
                      <span className="flex items-baseline gap-1.5">
                        <span className="text-amber-800 dark:text-amber-300 font-black text-lg">
                          {word.word}
                        </span>
                        <span className="text-xs text-slate-400 font-sans font-normal">
                          · AI İncelemesi
                        </span>
                      </span>
                    ) : (
                      'LexiLab AI Dil Koçu'
                    )}
                  </h2>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/10 text-amber-800 dark:text-amber-300">
                    {currentLang.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans truncate">
                  {word
                    ? `${word.meanings[0]?.trMeaning || 'Kelime'} bağlamında interaktif sohbet`
                    : 'Kişiselleştirilmiş profesyonel dil mentörü'}
                </p>
              </div>
            </div>

            {/* Top action icons */}
            <div className="flex items-center gap-1 shrink-0">
              {word && (
                <button
                  onClick={() => handlePlayAudio(word.word)}
                  className="p-2 rounded-lg text-slate-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Telaffuzu Dinle"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={handleClearHistory}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Sohbeti Temizle"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Context Bar if Word is selected */}
          {word ? (
            <div className="px-5 py-2 bg-amber-500/5 dark:bg-amber-400/[0.04] border-b border-amber-500/10 flex items-center justify-between text-xs text-amber-900/80 dark:text-amber-300/80">
              <div className="flex items-center gap-2 truncate">
                <GraduationCap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="truncate">
                  {word.partOfSpeech && <em className="font-serif mr-1">({word.partOfSpeech})</em>}
                  <strong>{word.meanings[0]?.trMeaning}</strong>
                  {word.primaryAcademicContext && ` · ${word.primaryAcademicContext}`}
                </span>
              </div>
              {word.cefrLevel && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-900 dark:text-amber-200 shrink-0">
                  {word.cefrLevel}
                </span>
              )}
            </div>
          ) : (
            <div className="px-5 py-2 bg-slate-100/60 dark:bg-slate-800/40 border-b border-slate-200/60 dark:border-white/[0.05] flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  <strong>{allWords.filter(w => w.language === activeLanguage).length} {activeLanguage === 'de' ? 'Almanca' : 'İngilizce'}</strong> kelimen ve analizlerin koç ile senkronize.
                </span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold">
                Veritabanı Bağlı
              </span>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[92%] sm:max-w-[85%] ${
                    isUser ? 'ml-auto' : 'mr-auto'
                  }`}
                >
                  <div
                    className={`rounded-2xl p-4 text-xs sm:text-sm shadow-2xs ${
                      isUser
                        ? 'bg-slate-900 text-white dark:bg-amber-600 dark:text-white rounded-br-xs'
                        : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.07] text-slate-800 dark:text-slate-200 rounded-bl-xs w-full'
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center gap-1.5 mb-2 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                        <Bot className="w-3.5 h-3.5" />
                        <span>LexiLab Dil Koçu</span>
                      </div>
                    )}

                    {isUser ? (
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <FormattedAIMessage
                        content={msg.content}
                        language={currentLang}
                        onPlayAudio={handlePlayAudio}
                        isSpeaking={speakingText === msg.content}
                      />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-start gap-2 max-w-[85%] mr-auto">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.07] shadow-2xs rounded-bl-xs flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-serif italic">
                    AI Dil Koçu düşünüyor & cümleleri hazırlıyor...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-4 py-2 border-t border-slate-200/50 dark:border-white/[0.04] bg-white/40 dark:bg-slate-900/40 overflow-x-auto scrollbar-none flex items-center gap-1.5 select-none">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 shrink-0 mr-1">
              <Lightbulb className="w-3 h-3 text-amber-500" />
              <span>Hızlı Sor:</span>
            </span>
            {(word ? wordPrompts : generalPrompts).map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="shrink-0 text-xs px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 hover:text-amber-800 dark:hover:text-amber-300 border border-slate-200/80 dark:border-white/[0.06] transition cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-white/[0.08]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-end gap-2"
            >
              <textarea
                ref={inputRef}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  word
                    ? `"${word.word}" hakkında bir soru sor, cümle kurmasını iste...`
                    : 'Dil öğrenimi, gramer, cümle çevirisi veya kelime hakkında sor...'
                }
                rows={2}
                disabled={isLoading}
                className="w-full resize-none p-3 pr-12 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-white/[0.08] text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500/50"
              />

              <button
                type="submit"
                disabled={!inputPrompt.trim() || isLoading}
                className="absolute right-2.5 bottom-2.5 p-2 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-30 disabled:pointer-events-none text-white transition active:scale-95 cursor-pointer shadow-xs"
                title="Gönder (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-[10px] text-slate-400 text-center mt-1.5 font-sans">
              Enter ile gönder · Shift + Enter ile yeni satır · Gemini 3.8 Flash ile güçlendirildi
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
