import React, { useState } from 'react';
import { X, Star, ShoppingCart, CheckCircle, Plus, Minus } from 'lucide-react';
import { MenuItem, CartItem, CartExtra } from '../types.js';

interface MealCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItem: MenuItem | null;
  onConfirm: (cartItem: CartItem) => void;
  lang: 'ar' | 'en';
}

const EXTRA_OPTIONS: { nameAr: string; nameEn: string; price: number }[] = [
  { nameAr: 'باكت بطاطس مقرمشة', nameEn: 'Crispy French Fries Pack', price: 15 },
  { nameAr: 'صوص طحينة إضافي', nameEn: 'Extra Tahini Sauce', price: 10 },
  { nameAr: 'صوص ثومية إضافي', nameEn: 'Extra Tomeya Sauce', price: 10 },
  { nameAr: 'صوص دقوس مندي', nameEn: 'Extra Mandi Daqqoos Sauce', price: 10 },
  { nameAr: 'مخلل مشكل بلدي', nameEn: 'Traditional Pickled Vegetables', price: 10 },
  { nameAr: 'عيش بلدي ساخن', nameEn: 'Fresh Hot Baladi Bread', price: 5 },
];

export default function MealCustomizationModal({
  isOpen,
  onClose,
  menuItem,
  onConfirm,
  lang,
}: MealCustomizationModalProps) {
  if (!isOpen || !menuItem) return null;

  const isAr = lang === 'ar';
  const [selectedExtras, setSelectedExtras] = useState<{ nameAr: string; nameEn: string; price: number }[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const toggleExtra = (extra: typeof EXTRA_OPTIONS[0]) => {
    setSelectedExtras((prev) => {
      const exists = prev.some((e) => e.nameAr === extra.nameAr);
      if (exists) {
        return prev.filter((e) => e.nameAr !== extra.nameAr);
      } else {
        return [...prev, extra];
      }
    });
  };

  const incrementQty = () => setQuantity((q) => q + 1);
  const decrementQty = () => setQuantity((q) => (q > 1 ? q - 1 : 1));

  const basePrice = menuItem.price;
  const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.price, 0);
  const singleItemTotal = basePrice + extrasTotal;
  const grandTotal = singleItemTotal * quantity;

  const handleConfirm = () => {
    onConfirm({
      menuItem,
      quantity,
      extras: selectedExtras.length > 0 ? selectedExtras : undefined,
      rating,
    });
    // Reset state
    setSelectedExtras([]);
    setQuantity(1);
    setRating(5);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-300">
      <div 
        className="relative bg-[#FAF9F6] w-full max-w-lg rounded-3xl overflow-hidden border border-[#E5E2D9] shadow-2xl flex flex-col animate-in slide-in-from-bottom-12 duration-400"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header Image & Title overlay */}
        <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-brand-primary/10">
          <img 
            src={menuItem.image} 
            alt={isAr ? menuItem.nameAr : menuItem.nameEn} 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAF9F6] via-transparent to-black/40"></div>
          
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white text-[#2D241E] hover:text-[#3D4021] border border-[#E5E2D9] transition-all duration-200 cursor-pointer shadow-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Scrollable Content */}
        <div className="flex-1 p-6 overflow-y-auto max-h-[60vh] space-y-6">
          {/* Title and Description */}
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-[#3D4021] font-serif">
              {isAr ? menuItem.nameAr : menuItem.nameEn}
            </h2>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed">
              {isAr ? menuItem.descriptionAr : menuItem.descriptionEn}
            </p>
          </div>

          <div className="h-[1px] bg-[#E5E2D9]"></div>

          {/* Extras list */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#3D4021] flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xs font-black">1</span>
              <span>{isAr ? 'الإضافات الرائعة المتاحة (حسب اختيارك):' : 'Select optional extras & add-ons:'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {EXTRA_OPTIONS.map((extra) => {
                const isSelected = selectedExtras.some((e) => e.nameAr === extra.nameAr);
                return (
                  <button
                    key={extra.nameAr}
                    onClick={() => toggleExtra(extra)}
                    className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-brand-primary/5 border-brand-primary text-brand-primary shadow-xs'
                        : 'bg-white border-[#E5E2D9] text-[#2D241E] hover:bg-[#F1EFE7]/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'border-brand-primary bg-brand-primary text-white' 
                          : 'border-gray-300 bg-white'
                      }`}>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-brand-gold"></span>}
                      </span>
                      <span className="text-xs font-bold">
                        {isAr ? extra.nameAr : extra.nameEn}
                      </span>
                    </div>
                    <span className="text-xs font-black text-brand-clay font-sans">
                      +{extra.price} {isAr ? 'ج.م' : 'EGP'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-[1px] bg-[#E5E2D9]"></div>

          {/* Quantity selector */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-[#3D4021] flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xs font-black">2</span>
                <span>{isAr ? 'الكمية المطلوبة للطلب:' : 'Required Quantity:'}</span>
              </h3>
              <p className="text-[10px] text-gray-400 font-bold">
                {isAr ? 'حدد عدد الوجبات التي تود طلبها من هذا الصنف' : 'Select the quantity for this culinary masterpiece'}
              </p>
            </div>

            {/* Premium Pill Quantity Control */}
            <div className="flex items-center gap-3 bg-white border border-[#E5E2D9] rounded-2xl p-1 shadow-xs max-w-[140px]">
              <button 
                onClick={decrementQty}
                className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-[#3D4021] transition-all cursor-pointer font-bold"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-sans font-black text-base text-[#3D4021] w-8 text-center">
                {quantity}
              </span>
              <button 
                onClick={incrementQty}
                className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-[#3D4021] transition-all cursor-pointer font-bold"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="h-[1px] bg-[#E5E2D9]"></div>

          {/* Rating Assessment */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-gray-400">
              {isAr ? 'ما هو تقييمك لطعم وجودة هذا الصنف؟' : 'What is your rating for this meal?'}
            </h3>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 cursor-pointer transition-all duration-150 hover:scale-115 text-brand-gold"
                >
                  <Star 
                    className={`w-6 h-6 transition-all ${
                      star <= (hoverRating ?? rating) 
                        ? 'fill-brand-gold text-brand-gold stroke-[2]' 
                        : 'text-gray-300 stroke-[1.5]'
                    }`} 
                  />
                </button>
              ))}
              <span className="text-xs font-extrabold text-brand-gold mr-2">
                {rating === 5 ? (isAr ? 'ممتاز جداً 🌟' : 'Excellent!') : rating === 4 ? (isAr ? 'مميز 👍' : 'Very Good') : (isAr ? 'جيد' : 'Good')}
              </span>
            </div>
          </div>
        </div>

        {/* Footer actions with price breakdowns */}
        <div className="p-6 bg-[#F1EFE7]/50 border-t border-[#E5E2D9] space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-right">
              <span className="text-[10px] text-gray-400 font-bold block">{isAr ? 'سعر الفردي شامل الإضافات' : 'Single price with additions'}</span>
              <span className="font-sans font-extrabold text-[#3D4021] text-sm">
                {singleItemTotal} {isAr ? 'ج.م' : 'EGP'}
              </span>
            </div>
            
            <div className="text-left font-sans flex flex-col items-end">
              <span className="text-[10px] text-gray-400 font-bold block">{isAr ? 'الحساب الإجمالي الكلي' : 'Total Invoice Amount'}</span>
              <div className="flex items-baseline gap-1">
                <span className="font-sans font-black text-[#2D241E] text-2xl">
                  {grandTotal}
                </span>
                <span className="text-xs font-bold text-gray-500">
                  {isAr ? 'ج.م' : 'EGP'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            className="w-full py-4 rounded-2xl bg-[#3D4021] hover:bg-[#4D5129] text-brand-gold hover:text-white transition-all duration-300 font-bold text-sm tap-scale flex items-center justify-center gap-2 shadow-lg shadow-[#3D4021]/15 cursor-pointer border border-[#3D4021]"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{isAr ? 'إضافة الوجبة للسلة' : 'Add Custom Meal to Cart'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
