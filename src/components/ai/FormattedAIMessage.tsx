import React from 'react';
import { Volume2, Copy, Check } from 'lucide-react';
import { LanguageCode } from '../../types';

interface FormattedAIMessageProps {
  content: string;
  language: LanguageCode;
  onPlayAudio?: (text: string) => void;
  isSpeaking?: boolean;
}

export const FormattedAIMessage: React.FC<FormattedAIMessageProps> = ({
  content,
  language,
  onPlayAudio,
  isSpeaking,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Extract quotes or English/German sentences for quick audio speak
  const extractFirstForeignPhrase = (text: string): string => {
    const quoteMatch = text.match(/["“]([^"”]+)["”]/);
    if (quoteMatch && quoteMatch[1] && quoteMatch[1].length > 2) {
      return quoteMatch[1];
    }
    // Or take first sentence
    const firstPeriod = text.indexOf('.');
    if (firstPeriod > 3) {
      return text.substring(0, firstPeriod);
    }
    return text.substring(0, 100);
  };

  const handleSpeakSample = () => {
    if (onPlayAudio) {
      const phrase = extractFirstForeignPhrase(content);
      onPlayAudio(phrase);
    }
  };

  // Basic markdown parser for headings, lists, bold, italics
  const renderFormattedText = (rawText: string) => {
    const lines = rawText.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={idx} className="h-2" />;
      }

      // Headers (e.g. ### or 1. or 2.)
      if (trimmed.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-serif font-bold text-sm sm:text-base text-amber-950 dark:text-amber-200 mt-3 mb-1">
            {parseInline(trimmed.replace('### ', ''))}
          </h4>
        );
      }
      if (trimmed.startsWith('## ')) {
        return (
          <h3 key={idx} className="font-serif font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 mt-4 mb-1.5">
            {parseInline(trimmed.replace('## ', ''))}
          </h3>
        );
      }

      // Bullet points
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
        const bulletText = trimmed.replace(/^[-*•]\s+/, '');
        return (
          <div key={idx} className="flex items-start gap-2 my-1 pl-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
            <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed flex-1">
              {parseInline(bulletText)}
            </div>
          </div>
        );
      }

      // Numbered list item
      const numMatch = trimmed.match(/^(\d+[\.\)])\s+(.*)/);
      if (numMatch) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1.5 pl-1">
            <span className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400 mt-0.5 shrink-0 min-w-4">
              {numMatch[1]}
            </span>
            <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed flex-1">
              {parseInline(numMatch[2])}
            </div>
          </div>
        );
      }

      // Normal paragraph
      return (
        <p key={idx} className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed my-1">
          {parseInline(trimmed)}
        </p>
      );
    });
  };

  // Helper for inline bold, italic, code tags
  const parseInline = (text: string) => {
    // Split by bold (**bold**) and inline code (`code`)
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-slate-950 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={i} className="italic text-slate-700 dark:text-slate-300">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-amber-800 dark:text-amber-300">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="group relative">
      <div className="space-y-0.5 select-text font-sans">
        {renderFormattedText(content)}
      </div>

      {/* Floating utility toolbar on hover / touch */}
      <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-white/[0.05] flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          {onPlayAudio && (
            <button
              onClick={handleSpeakSample}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition cursor-pointer text-[11px] ${
                isSpeaking
                  ? 'bg-amber-500 text-white'
                  : 'hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Örneği Seslendir"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Dinle ({language.toUpperCase()})</span>
            </button>
          )}
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer text-[11px]"
          title="Metni Kopyala"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-500 font-medium">Kopyalandı</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Kopyala</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
