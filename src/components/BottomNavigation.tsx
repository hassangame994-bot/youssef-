import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Utensils, ShoppingBag, ClipboardList, Shield, User, LogOut, Globe, X, Award, Calendar } from 'lucide-react';
import { User as UserType } from '../types.js';

interface BottomNavigationProps {
  user: UserType | null;
  lang: 'ar' | 'en';
  setLang: (l: 'ar' | 'en') => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  currentTab: 'menu' | 'orders' | 'admin';
  setCurrentTab: (t: 'menu' | 'orders' | 'admin') => void;
}

export default function BottomNavigation({
  user,
  lang,
  setLang,
  cartCount,
  onOpenCart,
  onOpenAuth,
  onLogout,
  currentTab,
  setCurrentTab,
}: BottomNavigationProps) {
  const isAr = lang === 'ar';
  const [profileOpen, setProfileOpen] = useState(false);

  const handleTabChange = (tab: 'menu' | 'orders' | 'admin') => {
    if (tab === 'orders' && !user) {
      onOpenAuth();
    } else {
      setCurrentTab(tab);
    }
  };

  return (
    <>
      {/* Floating Bottom Navigation Bar */}
      <div className="fixed bottom-5 left-4 right-4 z-40 md:hidden max-w-md mx-auto">
        <div className="bg-[#FDFBF7]/90 backdrop-blur-xl border border-[#E5E2D9] rounded-3xl shadow-[0_12px_40px_rgba(61,64,33,0.15)] px-4 py-2.5 flex justify-around items-center">
          
          {/* Menu Tab */}
          <button
            onClick={() => handleTabChange('menu')}
            className={`relative flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all duration-300 cursor-pointer active:scale-90 ${
              currentTab === 'menu' ? 'text-[#3D4021]' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {currentTab === 'menu' && (
              <motion.div
                layoutId="activeBottomTab"
                className="absolute inset-0 bg-[#3D4021]/5 rounded-2xl -z-10 border border-[#3D4021]/10"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <Utensils className={`w-5 h-5 ${currentTab === 'menu' ? 'text-brand-gold' : 'text-gray-400'}`} />
            <span className="text-[9px] font-black tracking-wide">
              {isAr ? 'القائمة' : 'Menu'}
            </span>
          </button>

          {/* Cart Tab (Opens Side Drawer) */}
          {(!user || user.role === 'user') && (
            <button
              onClick={onOpenCart}
              className="relative flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all duration-300 cursor-pointer active:scale-90 text-gray-400 hover:text-gray-600"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-gray-400" />
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-brand-clay text-[9px] font-extrabold text-white border border-[#FDFBF7] shadow-xs"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </div>
              <span className="text-[9px] font-black tracking-wide">
                {isAr ? 'السلة' : 'Cart'}
              </span>
            </button>
          )}

          {/* Admin panel Tab (If admin) */}
          {user && user.role === 'admin' && (
            <button
              onClick={() => handleTabChange('admin')}
              className={`relative flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all duration-300 cursor-pointer active:scale-90 ${
                currentTab === 'admin' ? 'text-[#3D4021]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {currentTab === 'admin' && (
                <motion.div
                  layoutId="activeBottomTab"
                  className="absolute inset-0 bg-[#3D4021]/5 rounded-2xl -z-10 border border-[#3D4021]/10"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <Shield className={`w-5 h-5 ${currentTab === 'admin' ? 'text-brand-gold' : 'text-gray-400'}`} />
              <span className="text-[9px] font-black tracking-wide">
                {isAr ? 'لوحة التحكم' : 'Admin'}
              </span>
            </button>
          )}

          {/* Track Orders Tab */}
          {(!user || user.role === 'user') && (
            <button
              onClick={() => handleTabChange('orders')}
              className={`relative flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all duration-300 cursor-pointer active:scale-90 ${
                currentTab === 'orders' ? 'text-[#3D4021]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {currentTab === 'orders' && (
                <motion.div
                  layoutId="activeBottomTab"
                  className="absolute inset-0 bg-[#3D4021]/5 rounded-2xl -z-10 border border-[#3D4021]/10"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <ClipboardList className={`w-5 h-5 ${currentTab === 'orders' ? 'text-brand-gold' : 'text-gray-400'}`} />
              <span className="text-[9px] font-black tracking-wide">
                {isAr ? 'طلباتي' : 'Track'}
              </span>
            </button>
          )}

          {/* Account/Profile Tab */}
          <button
            onClick={() => {
              if (user) {
                setProfileOpen(true);
              } else {
                onOpenAuth();
              }
            }}
            className="relative flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all duration-300 cursor-pointer active:scale-90 text-gray-400 hover:text-gray-600"
          >
            <User className={`w-5 h-5 ${user ? 'text-brand-gold' : 'text-gray-400'}`} />
            <span className="text-[9px] font-black tracking-wide">
              {user ? (isAr ? 'حسابي' : 'Account') : (isAr ? 'دخول' : 'Login')}
            </span>
          </button>

        </div>
      </div>

      {/* Account Info Bottom Sheet Panel */}
      <AnimatePresence>
        {profileOpen && user && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProfileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 md:hidden"
            />

            {/* Bottom Sheet Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 bg-[#FAF9F6] border-t border-[#E5E2D9] rounded-t-[32px] z-50 p-6 pb-10 shadow-2xl md:hidden max-h-[85vh] overflow-y-auto"
              dir={isAr ? 'rtl' : 'ltr'}
            >
              {/* Sheet Drag Indicator */}
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />

              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-[#3D4021]" />
                  <h3 className="text-lg font-black text-[#3D4021]">
                    {isAr ? 'حسابي الشخصي' : 'My Personal Profile'}
                  </h3>
                </div>
                <button
                  onClick={() => setProfileOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User Identity Card */}
              <div className="bg-white rounded-3xl p-5 border border-[#E5E2D9] mb-5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#3D4021] text-brand-gold font-serif text-2xl font-black flex items-center justify-center shrink-0 border border-brand-primary/10">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-black text-brand-primary truncate">
                    {user.username}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    {user.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-gold/10 text-brand-gold text-[10px] font-black border border-brand-gold/20">
                        <Shield className="w-3 h-3" />
                        {isAr ? 'مدير النظام' : 'Administrator'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-black border border-[#3D4021]/15">
                        <Award className="w-3 h-3 text-brand-gold" />
                        {isAr ? 'عميل مميز' : 'Premium Customer'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Interactive Settings and Details */}
              <div className="space-y-3.5 mb-6">
                
                {/* Language Switch Row */}
                <div className="bg-white rounded-2xl p-4 border border-[#E5E2D9] flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#3D4021]/5 text-[#3D4021] flex items-center justify-center border border-[#3D4021]/10">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-brand-primary block">
                        {isAr ? 'لغة التطبيق' : 'App Language'}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400">
                        {isAr ? 'تغيير اللغة المعروضة' : 'Toggle application language'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setLang(isAr ? 'en' : 'ar')}
                    className="px-4 py-2 rounded-xl border border-[#E5E2D9] hover:bg-gray-50 text-xs font-black text-brand-primary transition-all duration-200 tap-scale cursor-pointer bg-[#FAFBF7]"
                  >
                    {isAr ? 'English' : 'العربية'}
                  </button>
                </div>

                {/* Member Since Details */}
                <div className="bg-white rounded-2xl p-4 border border-[#E5E2D9] flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-gold/5 text-brand-gold flex items-center justify-center border border-brand-gold/15">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-brand-primary block">
                        {isAr ? 'تاريخ التسجيل' : 'Registration Date'}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400">
                        {isAr ? 'تاريخ الانضمام لعائلة أبو قورة' : 'Joined Abu Qura community'}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#3D4021] font-mono">
                    {new Date(user.createdAt || Date.now()).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                      year: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>

              </div>

              {/* Logout Button */}
              <button
                onClick={() => {
                  setProfileOpen(false);
                  onLogout();
                }}
                className="w-full py-4.5 rounded-2xl bg-brand-clay hover:bg-brand-clay/90 text-white text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-all duration-200 tap-scale cursor-pointer border border-brand-clay/10"
              >
                <LogOut className="w-4 h-4" />
                <span>{isAr ? 'تسجيل الخروج من الحساب' : 'Log Out From Account'}</span>
              </button>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
