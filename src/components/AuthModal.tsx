import React, { useState, useEffect } from 'react';
import { X, Shield, User, Loader2, KeyRound } from 'lucide-react';
import { User as UserType } from '../types.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserType) => void;
  lang: 'ar' | 'en';
  allowAdmin?: boolean;
}

export default function AuthModal({ isOpen, onClose, onSuccess, lang, allowAdmin = false }: AuthModalProps) {
  const isAr = lang === 'ar';
  const [isAdminMode, setIsAdminMode] = useState(allowAdmin);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsAdminMode(allowAdmin);
    }
  }, [isOpen, allowAdmin]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError(isAr ? 'برجاء إدخال اسم المستخدم' : 'Please enter your username');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password: isAdminMode ? password : '',
          isAdminLogin: isAdminMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || (isAr ? 'فشل تسجيل الدخول' : 'Authentication failed'));
      }

      onSuccess(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || (isAr ? 'عذراً، حدث خطأ ما' : 'An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="relative w-full max-w-md overflow-hidden bg-white rounded-3xl border border-brand-primary/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Background glow lines */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-primary via-brand-gold to-brand-primary"></div>

        {/* Header */}
        <div className="px-6 pt-8 pb-4 flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-extrabold text-brand-primary">
              {isAdminMode 
                ? (isAr ? 'لوحة تحكم الإدارة' : 'Admin Command Room') 
                : (isAr ? 'أهلاً بك في مطعم أبو قورة' : 'Welcome to Abu Qura')}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {isAdminMode 
                ? (isAr ? 'سجل الدخول كمدير للتحكم بالطلبات' : 'Log in to manage restaurant orders') 
                : (isAr ? 'أدخل اسمك فقط لطلب الطعام وتتبع طلبك مباشرة' : 'Enter your name to start ordering instantly')}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-gray-100 text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toggle Mode */}
        {allowAdmin && (
          <div className="px-6 py-2">
            <div className="flex bg-gray-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setIsAdminMode(false);
                  setError('');
                }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                  !isAdminMode 
                    ? 'bg-white text-brand-primary shadow-xs' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <User className="w-4 h-4" />
                <span>{isAr ? 'تسجيل دخول عميل' : 'Customer Access'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdminMode(true);
                  setError('');
                }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                  isAdminMode 
                    ? 'bg-brand-primary text-brand-gold shadow-xs' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Shield className="w-4 h-4 text-brand-gold" />
                <span>{isAr ? 'مدير المطعم (الأدمين)' : 'Admin Portal'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold text-center">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-primary">
              {isAr ? 'اسم المستخدم' : 'Username'}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isAdminMode ? 'Abu-Qura' : (isAr ? 'مثال: أحمد قورة' : 'e.g. John Doe')}
                className="w-full px-4.5 py-3.5 rounded-2xl border border-gray-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/5 text-sm transition-all"
              />
              <span className={`absolute top-1/2 -translate-y-1/2 ${isAr ? 'left-4' : 'right-4'} text-gray-400`}>
                <User className="w-4 h-4" />
              </span>
            </div>
          </div>

          {isAdminMode && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-150">
              <label className="text-xs font-bold text-brand-primary">
                {isAr ? 'كلمة المرور الإدارية' : 'Admin Password'}
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4.5 py-3.5 rounded-2xl border border-gray-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/5 text-sm transition-all"
                />
                <span className={`absolute top-1/2 -translate-y-1/2 ${isAr ? 'left-4' : 'right-4'} text-gray-400`}>
                  <KeyRound className="w-4 h-4" />
                </span>
              </div>
              <p className="text-[10px] text-brand-gold-dark font-medium leading-relaxed mt-1">
                {isAr ? 'حساب تجريبي: Abu-Qura وكلمة المرور: Abu-Qura123' : 'Demo access: Abu-Qura with password: Abu-Qura123'}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-brand-primary hover:bg-brand-primary-light text-brand-gold font-bold text-sm shadow-lg shadow-brand-primary/10 transition-all duration-200 tap-scale flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-brand-gold" />
            ) : (
              <span>{isAdminMode ? (isAr ? 'دخول كمدير' : 'Login as Admin') : (isAr ? 'دخول فوري ومتابعة' : 'Enter Restaurant')}</span>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="px-6 py-4.5 bg-gray-50 border-t border-gray-100 text-center">
          <span className="text-[10px] text-gray-400 font-medium">
            {isAr 
              ? 'تدار الجلسة بالكامل عبر قاعدة بيانات سحابية' 
              : 'Session authenticated fully via server persistence'}
          </span>
        </div>
      </div>
    </div>
  );
}
