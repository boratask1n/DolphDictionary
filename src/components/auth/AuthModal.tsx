import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Cloud, 
  LogIn, 
  LogOut, 
  Trash2,
  ShieldCheck, 
  Database, 
  Sparkles,
  User,
  AlertCircle
} from 'lucide-react';
import { FirebaseUser, loginWithGoogle, logoutUser, loginWithEmail, registerWithEmail } from '../../services/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isRequired?: boolean;
  currentUser: FirebaseUser | null;
  onDeleteAccount?: (password?: string) => Promise<void>;
  totalWordsCount: number;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  isRequired = false,
  currentUser,
  onDeleteAccount,
  totalWordsCount,
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setIsLoggingIn(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(err.message || 'Giriş yapılırken bir sorun oluştu.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    setErrorMsg(null);
    try {
      await logoutUser();
    } catch (err: any) {
      setErrorMsg(err.message || 'Çıkış yapılırken bir sorun oluştu.');
    }
  };

  const handleEmailAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);
    setIsLoggingIn(true);
    try {
      if (authMode === 'login') {
        await loginWithEmail(email.trim(), password);
      } else {
        if (password.length < 6) throw new Error('Şifre en az 6 karakter olmalı.');
        await registerWithEmail(email.trim(), password);
      }
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'İşlem gerçekleştirilemedi.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!onDeleteAccount) return;
    setErrorMsg(null);
    setIsLoggingIn(true);
    try {
      await onDeleteAccount(deletePassword);
    } catch (err: any) {
      setErrorMsg(err.code === 'auth/requires-recent-login'
        ? 'Hesabı silmek için güvenlik nedeniyle yeniden giriş yapmanız gerekiyor.'
        : err.message || 'Hesap silinemedi.');
    } finally {
      setIsLoggingIn(false);
      setShowDeleteConfirm(false);
      setDeletePassword('');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={isRequired ? undefined : onClose}
          className="fixed inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-white/[0.08] shadow-2xl p-6 sm:p-7 z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-2xs">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white">
                  {currentUser ? 'Hesabım & Kayıtlarım' : 'Hesabınıza Giriş Yapın'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {currentUser ? 'Kayıtlarınız güvenle saklanıyor' : 'Kelimelerinizi kaybetmeyin'}
                </p>
              </div>
            </div>
            {!isRequired && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Error notice */}
          {errorMsg && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="truncate">{errorMsg}</span>
            </div>
          )}

          {/* User Status Content */}
          {currentUser ? (
            <div className="py-5 space-y-4">
              <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-white/[0.06]">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Profil'}
                    className="w-12 h-12 rounded-full border-2 border-amber-500 object-cover shadow-2xs"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-lg">
                    {currentUser.displayName?.[0] || 'U'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                      {currentUser.displayName || 'Giriş Yapmış Kullanıcı'}
                    </h4>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-mono font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Aktif
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {currentUser.email}
                  </p>
                </div>
              </div>

              {/* Status details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-400/[0.03] border border-amber-500/15">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Kayıtlı Kelimeler</div>
                  <div className="text-lg font-bold font-mono text-amber-800 dark:text-amber-300 mt-0.5">
                    {totalWordsCount} Kelime
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-400/[0.03] border border-emerald-500/15">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Kayıt Durumu</div>
                  <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1">
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Bulutta Kalıcı</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex flex-col gap-2">
                {onDeleteAccount && (
                  showDeleteConfirm ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 dark:border-rose-900/50 dark:bg-rose-950/30">
                      <p className="text-xs text-rose-700 dark:text-rose-300">Hesabınız ve tüm kayıtlarınız kalıcı olarak silinecek.</p>
                      {currentUser.providerData.some((provider) => provider.providerId === 'password') && (
                        <input
                          type="password"
                          value={deletePassword}
                          onChange={(event) => setDeletePassword(event.target.value)}
                          placeholder="Hesap şifreniz"
                          className="mt-2 w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs outline-none focus:border-rose-400 dark:border-rose-900/60 dark:bg-slate-900"
                          autoComplete="current-password"
                        />
                      )}
                      {currentUser.providerData.some((provider) => provider.providerId === 'google.com') && (
                        <p className="mt-2 text-[11px] text-rose-600 dark:text-rose-300">
                          Silme öncesi Google hesabınızla yeniden doğrulama yapılacaktır.
                        </p>
                      )}
                      <div className="mt-2 flex gap-2">
                        <button onClick={handleDeleteAccount} disabled={isLoggingIn} className="flex-1 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Evet, sil</button>
                        <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">Vazgeç</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowDeleteConfirm(true)} className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hesabımı ve kayıtlarımı sil</span>
                    </button>
                  )
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Çıkış Yap</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-5 space-y-4">
              <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                <button onClick={() => setAuthMode('login')} className={`flex-1 rounded-lg py-2 text-xs font-semibold ${authMode === 'login' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500'}`}>Giriş yap</button>
                <button onClick={() => setAuthMode('register')} className={`flex-1 rounded-lg py-2 text-xs font-semibold ${authMode === 'register' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500'}`}>Kayıt ol</button>
              </div>
              <div className="space-y-2 text-center py-2">
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Google hesabınızla giriş yaparak kelimelerinizi, analizlerinizi ve tekrar geçmişinizi güvenle saklayın.
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-semibold mt-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Cihazlar arası otomatik senkronizasyon</span>
                </div>
              </div>

              {/* Login Button */}
              <button
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-white font-semibold text-xs sm:text-sm border border-slate-300 dark:border-white/[0.12] shadow-xs hover:shadow-md transition-all active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {/* Google SVG Icon */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>{isLoggingIn ? 'Giriş yapılıyor...' : 'Google ile Giriş Yap'}</span>
              </button>

              <div className="relative flex items-center gap-3 text-[11px] text-slate-400">
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                <span>veya e-posta ile</span>
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-2.5">
                <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-posta adresi" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-800" />
                <input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Şifre (en az 6 karakter)" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-800" />
                <button type="submit" disabled={isLoggingIn} className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900">
                  {authMode === 'login' ? 'E-posta ile giriş yap' : 'Hesap oluştur'}
                </button>
              </form>

              <div className="flex items-center gap-2 justify-center text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Google ile güvenli giriş</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
