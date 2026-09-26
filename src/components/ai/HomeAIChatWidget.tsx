import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  Maximize2, 
  RotateCcw, 
  MessageSquare, 
  Lightbulb, 
  CheckCircle2, 
  Volume2, 
  Compass,
  ArrowRight
} from 'lucide-react';
import { LanguageCode, Word, ReviewLog } from '../../types';
import { ChatMessage, sendChatMessageToAI, UserVocabContext } from '../../services/aiTutorService';
import { buildUserVocabContext } from '../../utils/vocabAnalytics';
import { FormattedAIMessage } from './FormattedAIMessage';

interface HomeAIChatWidgetProps {
  activeLanguage: LanguageCode;
  onExpand?: () => void;
  words?: Word[];
  reviewLogs?: ReviewLog[];
}

export const HomeAIChatWidget: React.FC<HomeAIChatWidgetProps> = ({
  activeLanguage,
  onExpand,
  words = [],
  reviewLogs = [],
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'initial-coach-greeting',
      role: 'model',
      content: `Merhaba! Ben **LexiLab Dil Koçun** 🎓\nŞu anda **${activeLanguage === 'de' ? 'Almanca' : 'İngilizce'}** modundayız. Kayıtlı kelimelerin ve analizlerin benimle senkronize. İster zorlandığın kelimelerle pratik yapalım, ister bir cümleni kontrol edeyim veya kelime dağarcığını geliştirelim!`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [speakingText, setSpeakingText] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update greeting when activeLanguage changes
  useEffect(() => {
    setMessages([
      {
        id: `greeting-${Date.now()}`,
        role: 'model',
        content: `**${activeLanguage === 'de' ? 'Almanca' : 'İngilizce'}** moduna geçildi! 🎯\nBu dildeki kayıtlı kelimelerin ve analizlerin hazır. Kelimelerinden mini quiz yapabilir, zorlandığın noktaları çalışabilir veya serbest sohbet edebiliriz.`,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, [activeLanguage]);

  const starterChips = [
    activeLanguage === 'de'
      ? 'Zorlandığım Almanca kelimeler hangileri ve tavsiyelerin neler?'
      : 'Zorlandığım İngilizce kelimeler hangileri ve tavsiyelerin neler?',
    'Kayıtlı kelimelerimle bana seviyeme uygun bir diyalog kur.',
    'Öğrenmekte olduğum kelimelerden bana 3 soruluk bir quiz yap.',
    'Kelime dağarcığımın ve ilerlememin analizini yap.',
    activeLanguage === 'de'
      ? 'Almanca günlük hayatta en çok kullanılan 3 doğal kalıp nedir?' 
      : 'İngilizce günlük hayatta en çok kullanılan 3 doğal kalıp nedir?',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    setInputText('');

    const userMsg: ChatMessage = {
      id: `home-user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setIsLoading(true);

    const userContext = buildUserVocabContext(words, reviewLogs, activeLanguage);

    const res = await sendChatMessageToAI(text, nextHistory, activeLanguage, undefined, userContext);
    setIsLoading(false);

    if (res.success && res.reply) {
      const modelMsg: ChatMessage = {
        id: `home-model-${Date.now()}`,
        role: 'model',
        content: res.reply,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, modelMsg]);
    } else {
      const errorMsg: ChatMessage = {
        id: `home-err-${Date.now()}`,
        role: 'model',
        content: `Yanıt alınamadı: ${res.error || 'Bağlantı hatası'}. Lütfen tekrar deneyin.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const handlePlayAudio = (phrase: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = activeLanguage === 'de' ? 'de-DE' : 'en-US';
    utterance.rate = 0.88;
    setSpeakingText(phrase);
    utterance.onend = () => setSpeakingText(null);
    utterance.onerror = () => setSpeakingText(null);
    window.speechSynthesis.speak(utterance);
  };

  const handleReset = () => {
    setMessages([
      {
        id: `greeting-${Date.now()}`,
        role: 'model',
        content: `Sohbet sıfırlandı. ${activeLanguage === 'de' ? 'Almanca' : 'İngilizce'} ile ilgili aklına takılan herhangi bir konuyu veya cümleyi sorabilirsin!`,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  useEffect(() => {
    // Scroll down when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <section className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex flex-col">
      {/* Top Banner Header */}
      <div className="px-5 sm:px-6 py-4 border-b border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-2xs shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                LexiLab AI Dil Koçu
              </h2>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Çevrimiçi</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-800 dark:text-amber-300">
                {activeLanguage.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
              Cümle düzeltme, kelime tüyoları, seviyeli diyaloglar ve sınav hazırlığı
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleReset}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Sohbeti Temizle"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {onExpand && (
            <button
              onClick={onExpand}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer"
              title="Geniş Pencerede Aç"
            >
              <Maximize2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Genişlet</span>
            </button>
          )}
        </div>
      </div>

      {/* Embedded Messages Container */}
      <div className="p-4 sm:p-6 max-h-[380px] overflow-y-auto space-y-4 scrollbar-thin bg-slate-50/20 dark:bg-slate-900/30">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[94%] sm:max-w-[85%] ${
                isUser ? 'ml-auto' : 'mr-auto'
              }`}
            >
              <div
                className={`rounded-2xl p-4 text-xs sm:text-sm shadow-2xs ${
                  isUser
                    ? 'bg-slate-900 text-white dark:bg-amber-600 dark:text-white rounded-br-xs'
                    : 'bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/[0.07] text-slate-800 dark:text-slate-200 rounded-bl-xs w-full'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center gap-1.5 mb-2 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                    <Bot className="w-3.5 h-3.5" />
                    <span>AI Dil Koçu</span>
                  </div>
                )}

                {isUser ? (
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <FormattedAIMessage
                    content={msg.content}
                    language={activeLanguage}
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

        {isLoading && (
          <div className="flex items-start gap-2 max-w-[85%] mr-auto">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/[0.07] shadow-2xs rounded-bl-xs flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-serif italic">
                AI Dil Koçu yazıyor...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Starter Chips */}
      <div className="px-4 sm:px-6 py-2.5 border-t border-slate-200/50 dark:border-white/[0.04] bg-slate-50/50 dark:bg-slate-800/30 overflow-x-auto scrollbar-none flex items-center gap-2 select-none">
        <span className="text-[11px] font-semibold text-slate-400 shrink-0 flex items-center gap-1">
          <Lightbulb className="w-3 h-3 text-amber-500" />
          <span>Öneri:</span>
        </span>
        {starterChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(chip)}
            disabled={isLoading}
            className="shrink-0 text-xs px-3 py-1 rounded-full bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 hover:text-amber-800 dark:hover:text-amber-300 border border-slate-200/80 dark:border-white/[0.06] transition cursor-pointer"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Bottom Input Area */}
      <div className="p-3 sm:p-4 border-t border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-slate-900">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder={
              activeLanguage === 'de'
                ? 'Almanca bir cümle yaz, kelime veya gramer sor...'
                : 'İngilizce bir cümle yaz, gramer kuralı veya kelime analizi iste...'
            }
            className="w-full py-3 pl-4 pr-12 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-white/[0.08] text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500/50"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="absolute right-2 p-2 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-30 disabled:pointer-events-none text-white transition active:scale-95 cursor-pointer shadow-xs"
            title="Gönder"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </section>
  );
};
