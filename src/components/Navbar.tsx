import React from 'react';
import { ShoppingBag, LogOut, Shield, User, Globe, Settings } from 'lucide-react';
import { User as UserType } from '../types.js';

interface NavbarProps {
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

export default function Navbar({
  user,
  lang,
  setLang,
  cartCount,
  onOpenCart,
  onOpenAuth,
  onLogout,
  currentTab,
  setCurrentTab,
}: NavbarProps) {
  const isAr = lang === 'ar';

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E2D9]/80 shadow-xs select-none" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 md:h-24">
          
          {/* Logo & Brand - Exactly matching the image - Styled professionally with correct scale */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentTab('menu')}>
            <div className="relative w-14 h-14 md:w-18 md:h-18 rounded-full overflow-hidden border-2 border-[#E0A93B] shadow-md transition-all duration-300 group-hover:scale-105 bg-white shrink-0 flex items-center justify-center">
              <img 
                src="/src/assets/images/abu_goura_original_logo_1784129485186.jpg" 
                alt="أبو قورة" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col text-right">
              <span className="text-lg md:text-2xl font-black tracking-tight text-[#111111] font-serif leading-tight flex items-center gap-1">
                أبو قورة
                <span className="text-[#E0A93B] text-xs md:text-sm">✨</span>
              </span>
              <span className="text-[9px] md:text-xs font-black tracking-widest text-[#B45309] font-sans mt-0.5 leading-tight">
                {isAr ? 'مطبخ المشويات والبلدي الأصيل • كرم وجود زمان' : 'Authentic Egyptian Grill & Heritage Kitchen'}
              </span>
            </div>
          </div>

          {/* Navigation Links and Portal buttons group */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Language Toggle - Always Visible, Compact */}
            <button
              onClick={() => setLang(isAr ? 'en' : 'ar')}
              className="px-2.5 py-1.5 md:px-3 md:py-2 rounded-xl text-[#1A1A1A] hover:bg-[#FAF9F6] transition-all flex items-center gap-1 text-[10px] md:text-[11px] font-black border border-[#E5E2D9] bg-[#FAFBF8] cursor-pointer shadow-2xs"
              title={isAr ? 'Switch to English' : 'التحويل للعربية'}
            >
              <Globe className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#B45309]" />
              <span className="font-black">{isAr ? 'EN' : 'عربي'}</span>
            </button>
 
            {/* Desktop-only action buttons to avoid overlapping on mobile */}
            <div className="hidden md:flex items-center gap-2 sm:gap-3">
              
              {/* Main Menu tab - قائمة الأكلات */}
              <button
                onClick={() => setCurrentTab('menu')}
                className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all duration-300 flex items-center gap-1.5 cursor-pointer border ${
                  currentTab === 'menu'
                    ? 'bg-[#111111] text-white border-[#111111] shadow-md'
                    : 'bg-[#FAFBF8] text-[#1A1A1A] border-[#E5E2D9] hover:bg-[#FAF9F6]'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-brand-gold shrink-0" />
                <span>{isAr ? 'قائمة الأكلات' : 'Food List'}</span>
              </button>

              {/* Track My Order tab - تتبع طلبي */}
              {(!user || user.role === 'user') && (
                <button
                  onClick={() => {
                    if (!user) {
                      onOpenAuth();
                    } else {
                      setCurrentTab('orders');
                    }
                  }}
                  className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all duration-300 flex items-center gap-1.5 cursor-pointer border ${
                    currentTab === 'orders'
                      ? 'bg-[#111111] text-white border-[#111111] shadow-md'
                      : 'bg-[#FAFBF8] text-[#1A1A1A] border-[#E5E2D9] hover:bg-[#FAF9F6]'
                  }`}
                >
                  <span className="text-sm shrink-0">🛵</span>
                  <span>{isAr ? 'تتبع طلبي' : 'Track Order'}</span>
                </button>
              )}

              {/* Shopping Cart tab - السلة */}
              {(!user || user.role === 'user') && (
                <button
                  onClick={onOpenCart}
                  className="relative px-4 py-2.5 rounded-2xl bg-[#FAFBF8] text-[#1A1A1A] border border-[#E5E2D9] hover:bg-[#FAF9F6] font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{isAr ? 'السلة' : 'Cart'}</span>
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-extrabold text-white shadow-md animate-bounce">
                      {cartCount}
                    </span>
                  )}
                </button>
              )}

              {/* User Account Portal - حسابي */}
              {user ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (user.role === 'admin') {
                        setCurrentTab('admin');
                      } else {
                        setCurrentTab('orders');
                      }
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-[#FAFBF8] text-[#1A1A1A] border border-[#E5E2D9] hover:bg-[#FAF9F6] font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <User className="w-4 h-4 text-sky-500 shrink-0" />
                    <span className="truncate max-w-[100px]">
                      {isAr ? `حسابي` : `My Account`}
                    </span>
                  </button>

                  {/* Settings / Admin Board - لوحة التحكم */}
                  {user.role === 'admin' && (
                    <button
                      onClick={() => setCurrentTab('admin')}
                      className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all duration-300 flex items-center gap-1.5 cursor-pointer border ${
                        currentTab === 'admin'
                          ? 'bg-[#111111] text-white border-[#111111] shadow-md'
                          : 'bg-[#FAFBF8] text-[#1A1A1A] border-[#E5E2D9] hover:bg-[#FAF9F6]'
                      }`}
                    >
                      <Settings className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{isAr ? 'لوحة التحكم' : 'Admin Panel'}</span>
                    </button>
                  )}

                  {/* Logout Button */}
                  <button
                    onClick={onLogout}
                    className="p-2.5 rounded-2xl text-rose-500 hover:text-white hover:bg-rose-500 border border-[#E5E2D9] hover:border-rose-500 bg-white transition-all duration-200 cursor-pointer shadow-xs"
                    title={isAr ? 'تسجيل الخروج' : 'Log Out'}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="px-4 py-2.5 rounded-2xl bg-[#FAFBF8] text-[#1A1A1A] border border-[#E5E2D9] hover:bg-[#FAF9F6] font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <User className="w-4 h-4 text-sky-500 shrink-0" />
                  <span>{isAr ? 'حسابي' : 'My Account'}</span>
                </button>
              )}

            </div>
          </div>

        </div>
      </div>
    </nav>
  );
}
