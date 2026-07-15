import React, { useState } from 'react';
import { Search, Flame, Shield, ArrowRightLeft, Star, Heart, ShoppingBag } from 'lucide-react';
import { MenuItem, Category } from '../types.js';

interface MenuSectionProps {
  menu: MenuItem[];
  categories: Category[];
  lang: 'ar' | 'en';
  onAddToCart: (item: MenuItem) => void;
}

export default function MenuSection({ menu, categories, lang, onAddToCart }: MenuSectionProps) {
  const isAr = lang === 'ar';
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const cats = [
    { id: 'all', nameAr: 'الكل', nameEn: 'All' },
    ...categories,
  ];

  const filteredMenu = menu.filter((item) => {
    const matchesSearch = 
      item.nameAr.toLowerCase().includes(search.toLowerCase()) ||
      item.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      item.descriptionAr.toLowerCase().includes(search.toLowerCase()) ||
      item.descriptionEn.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full">
      
      {/* 1. High-End Corporate Hero Banner (McDonald's / Talabat styled) */}
      <div className="relative overflow-hidden bg-[#0A0907] rounded-[2.5rem] py-14 px-6 sm:px-16 text-white border border-[#2D271E] shadow-2xl mb-12" dir={isAr ? 'rtl' : 'ltr'}>
        {/* Ambient gold background glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-gold/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-[#B45309]/10 rounded-full blur-3xl"></div>
        
        {/* Subtle grid pattern background for modern premium app feel */}
        <div className="absolute inset-0 bg-[radial-gradient(#E0A93B_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.04]"></div>
        
        <div className="relative max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
          
          {/* Right text panel */}
          <div className="flex-grow text-right space-y-6 max-w-xl">
            {/* Pill with gold border/accent */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1F1B12] border border-[#E0A93B]/40 text-[#E0A93B] text-xs font-black">
              <span>✨</span>
              <span>{isAr ? 'أصالة المذاق المصري والبلدي العريق' : 'Authentic Rural Egyptian Legacy'}</span>
            </div>

            {/* Main title */}
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-white font-serif">
              {isAr ? 'أكل بلدي على أصوله' : 'Rural Egyptian on its Origin'}
            </h1>

            {/* Rating Stars and Client count */}
            <div className="flex items-center justify-start gap-2 text-xs font-bold text-gray-300">
              <div className="flex text-amber-400">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
              <span>
                {isAr 
                  ? '4.9 / 5.0 من أكثر من 15,000 عميل سعيد' 
                  : '4.9 / 5.0 from more than 15,000 happy customers'}
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                onClick={() => {
                  const el = document.getElementById('menu-list');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-4.5 rounded-2xl bg-[#E0A93B] hover:bg-[#F59E0B] text-[#111111] font-black text-sm shadow-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
              >
                <span>{isAr ? 'اطلب وجبتك المفضلة الآن 👜' : 'Order Your Favorite Meal Now 👜'}</span>
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('menu-list');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-4.5 rounded-2xl bg-transparent hover:bg-white/5 text-white border border-[#E0A93B]/40 font-black text-sm transition-all duration-300 flex items-center gap-2 cursor-pointer"
              >
                <span>{isAr ? '📍 تتبع طلبك بالـ GPS' : '📍 Track Your Order via GPS'}</span>
              </button>
            </div>
          </div>

          {/* Left Image Spotlight panel with glowing golden border */}
          <div className="relative shrink-0 w-72 h-72 sm:w-85 sm:h-85 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#E0A93B]/30 to-[#B45309]/30 rounded-full blur-2xl animate-pulse"></div>
            <div className="relative w-full h-full rounded-full p-2 bg-gradient-to-tr from-[#E0A93B] to-[#B45309] shadow-2xl">
              <div className="w-full h-full rounded-full overflow-hidden bg-[#1C1917] border-4 border-[#0A0907]">
                <img 
                  src="https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop" 
                  alt="وجبة فاخرة" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Sub-header / Welcome Strip */}
      <div className="bg-[#FFFDF9] border border-[#E9E5D9] rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 mb-10" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-3 border-[#E0A93B] bg-white shrink-0 shadow-md transition-all duration-300 hover:scale-105 flex items-center justify-center">
            <img 
              src="/src/assets/images/abu_goura_original_logo_1784129485186.jpg" 
              alt="أبو قورة" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="text-right bg-transparent">
            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wide block">
              {isAr ? 'مرحباً بك يا غالي في مطبخ' : 'Welcome to the Kitchen of'}
            </span>
            <span className="text-sm font-black text-[#1A1A1A]">
              {isAr ? 'أبو قورة للمشويات والأكلات البلدية' : 'Abu Goura for Grills & Authentic Cuisine'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#FFFDF9] border border-[#E5E2D9] px-4 py-2.5 rounded-2xl text-xs font-black text-[#1A1A1A] shadow-xs cursor-pointer select-none">
          <span>📍</span>
          <span>{isAr ? 'الموقع: حدائق أكتوبر، الجيزة' : 'Location: October Gardens, Giza'}</span>
          <span className="text-[10px] text-gray-400">▼</span>
        </div>
      </div>

      {/* 3. Main Tagline Heading */}
      <div className="text-right mb-10 space-y-2" dir={isAr ? 'rtl' : 'ltr'} id="menu-list">
        <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-[#111111] leading-tight">
          {isAr ? 'أكل بلدي يفتح النفس،' : 'Rural Food That Opens the Appetite,'}
        </h2>
        <h3 className="text-3xl sm:text-4.5xl font-black tracking-tight text-[#B45309] leading-none">
          {isAr ? 'توصيل دليفري سريع وبأعلى جودة' : 'Fast & Premium Quality Delivery'}
        </h3>
        <p className="text-sm sm:text-base text-gray-500 font-extrabold max-w-2xl leading-relaxed pt-2">
          {isAr 
            ? 'اختر من أقسامنا الفاخرة المجهزة بالسمن البلدي الطبيعي والبهارات الأصيلة' 
            : 'Choose from our premium categories prepared with pure ghee and original spices'}
        </p>
      </div>

      {/* 4. Elegant Search Bar Container with Status */}
      <div className="bg-[#FFFDF9] border border-[#E5E2D9] rounded-3xl p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm mb-12" dir={isAr ? 'rtl' : 'ltr'}>
        {/* Left Side: 24h Delivery badge */}
        <div className="bg-[#FFF8EB] border border-[#F59E0B]/15 px-5 py-3 rounded-2xl flex items-center gap-2 text-xs font-black text-[#D97706] shrink-0">
          <span className="text-base">🕒</span>
          <span>{isAr ? "الخدمة 24 ساعة طوال الأسبوع d'livre" : "24/7 Delivery Service d'livre"}</span>
        </div>

        {/* Right Side: Search Box */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? '... ابحث عن كباب، كفتة، طاجن، أو حمام بلدي' : 'Search for kebab, kofta, claypot...'}
            className="w-full px-5 py-3.5 pr-12 rounded-2xl border border-[#E5E2D9] text-xs font-black focus:outline-none focus:ring-4 focus:ring-[#3D4021]/5 focus:border-[#E0A93B] bg-white text-[#1A1A1A] placeholder:text-gray-400/80 transition-all shadow-xs"
          />
          <span className="absolute top-1/2 -translate-y-1/2 right-4 text-gray-400">
            <Search className="w-5 h-5" />
          </span>
        </div>
      </div>

      {/* Categories Scroller - Warm Sand backdropped */}
      <div className="sticky top-20 md:top-24 z-30 -mx-4 px-4 py-4 bg-white/95 backdrop-blur-md border-b border-[#E5E2D9] flex gap-2.5 overflow-x-auto no-scrollbar scroll-smooth shadow-xs">
        {cats.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`whitespace-nowrap px-6 py-3 rounded-2xl text-xs font-black transition-all duration-300 cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-[#111111] text-[#E0A93B] shadow-md scale-[1.02]'
                : 'bg-[#FAFBF8] border border-[#E5E2D9] text-[#1A1A1A] hover:bg-[#FAF9F6]'
            }`}
          >
            {isAr ? cat.nameAr : cat.nameEn}
          </button>
        ))}
      </div>

      {/* Menu Bento Grid - Elegant physical menu listings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" dir={isAr ? 'rtl' : 'ltr'}>
        {filteredMenu.map((item) => (
          <div 
            key={item.id} 
            className="group flex flex-col bg-white rounded-3xl overflow-hidden border border-[#E5E2D9] shadow-xs hover:shadow-md hover:border-[#3D4021]/30 transition-all duration-300"
          >
            {/* Image Block with subtle overlay */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#FAF6F0] border-b border-[#E5E2D9]/60">
              <img 
                src={item.image} 
                alt={isAr ? item.nameAr : item.nameEn}
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover transition-transform duration-700 ${
                  item.available === false ? 'grayscale-[60%] contrast-90' : 'group-hover:scale-103'
                }`}
                loading="lazy"
              />
              {/* Category tag */}
              <span className="absolute top-4 right-4 bg-[#3D4021]/90 text-brand-gold text-[9px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full backdrop-blur-xs border border-[#4D5129]/20">
                {isAr 
                  ? (categories.find(c => c.id === item.category)?.nameAr || '')
                  : (categories.find(c => c.id === item.category)?.nameEn || '')}
              </span>

              {/* Elegant Out of Stock Overlay */}
              {item.available === false && (
                <div className="absolute inset-0 bg-black/45 flex items-center justify-center backdrop-blur-[1px]">
                  <span className="px-4.5 py-2 rounded-2xl bg-rose-600 text-white border border-rose-500 text-xs font-black shadow-md tracking-wider">
                    {isAr ? 'غير متوفر حالياً ⚠️' : 'Sold Out ⚠️'}
                  </span>
                </div>
              )}
            </div>

            {/* Content Details */}
            <div className="flex-1 p-6 flex flex-col justify-between bg-[#FDFBF7]/30">
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-3">
                  <h3 className="text-lg font-bold text-[#3D4021] font-serif group-hover:text-brand-primary-light transition-colors leading-tight">
                    {isAr ? item.nameAr : item.nameEn}
                  </h3>
                  <div className="flex items-baseline shrink-0">
                    <span className="text-xl font-black text-brand-clay font-sans">
                      {item.price}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 mr-1 mt-1">
                      {isAr ? 'ج.م' : 'EGP'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed font-semibold min-h-[48px]">
                  {isAr ? item.descriptionAr : item.descriptionEn}
                </p>
              </div>

              {/* Action Button & Metadata */}
              <div className="mt-6 pt-4 border-t border-[#E5E2D9]/70 flex items-center justify-between">
                <span className="text-[9px] text-[#3D4021] font-extrabold bg-[#3D4021]/5 border border-[#3D4021]/10 px-3 py-1 rounded-xl">
                  {isAr ? '👑 وجبة رئيسية' : '👑 Chef Special'}
                </span>
                
                {item.available !== false ? (
                  <button
                    onClick={() => onAddToCart(item)}
                    className="px-5 py-2.5 rounded-xl bg-[#3D4021] hover:bg-[#4D5129] text-brand-gold hover:text-white font-bold text-xs shadow-sm transition-all duration-300 tap-scale flex items-center gap-1.5 cursor-pointer border border-[#3D4021]"
                  >
                    <span className="text-sm font-light">+</span>
                    <span>{isAr ? 'إضافة للسلة' : 'Add to Cart'}</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="px-5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E2D9] text-gray-400 font-extrabold text-xs flex items-center gap-1 cursor-not-allowed select-none"
                  >
                    <span>{isAr ? 'غير متوفر' : 'Out of Stock'}</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        ))}

        {filteredMenu.length === 0 && (
          <div className="col-span-full py-20 bg-white rounded-3xl border border-[#E5E2D9] text-center flex flex-col items-center justify-center p-8">
            <span className="text-4xl">🥘</span>
            <h3 className="text-lg font-bold text-[#3D4021] font-serif mt-4">
              {isAr ? 'عذراً، لم نجد وجبات مطابقة لبحثك' : 'No delicious dishes matched your search'}
            </h3>
            <p className="text-xs text-gray-400 mt-2.5 max-w-xs leading-relaxed font-semibold">
              {isAr ? 'يرجى مراجعة التهجئة أو التصفح عبر الأقسام العلوية لمشاهدة كافة الوجبات.' : 'Try searching for other culinary keywords or browse our standard categories.'}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
