import React, { useEffect, useState } from 'react';
import { RefreshCw, Timer, CheckCircle, Ban, CookingPot, Truck, HelpCircle, Star, MapPin } from 'lucide-react';
import { Order, OrderStatus } from '../types.js';

interface UserOrdersProps {
  userId: string;
  lang: 'ar' | 'en';
  orders: Order[];
  onRefresh: () => void;
  loading: boolean;
}

export default function UserOrders({ userId, lang, orders, onRefresh, loading }: UserOrdersProps) {
  const isAr = lang === 'ar';

  const getStatusDetails = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return {
          text: isAr ? 'في الانتظار' : 'Pending Review',
          color: 'text-amber-600 bg-amber-50 border-amber-200',
          step: 1,
        };
      case 'preparing':
        return {
          text: isAr ? 'جاري التحضير والطهي' : 'Preparing & Cooking',
          color: 'text-emerald-600 bg-emerald-50 border-emerald-200 animate-pulse',
          step: 2,
        };
      case 'delivered':
        return {
          text: isAr ? 'تم التسليم بالهناء والشفاء' : 'Delivered! Bon Appétit',
          color: 'text-brand-primary bg-green-50 border-green-200',
          step: 3,
        };
      case 'rejected':
        return {
          text: isAr ? 'معذرةً، تم رفض الطلب' : 'Sorry, Order Rejected',
          color: 'text-rose-600 bg-rose-50 border-rose-200',
          step: -1,
        };
      default:
        return {
          text: isAr ? 'غير معروف' : 'Unknown',
          color: 'text-gray-500 bg-gray-50 border-gray-200',
          step: 0,
        };
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-3xl border border-[#E5E2D9]">
        <div>
          <h2 className="text-2xl font-black text-brand-primary">
            {isAr ? 'تتبع طلباتك اللحظية' : 'Live Order Tracking'}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {isAr ? 'شاهد حالة طلباتك مباشرة من مطبخ مطعم أبو قورة' : 'Monitor cooking and delivery progress in real-time'}
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-3 rounded-2xl bg-brand-primary/5 hover:bg-brand-primary/10 text-brand-primary transition-all duration-200 tap-scale flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-brand-primary ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isAr ? 'تحديث الحالة' : 'Refresh Live'}</span>
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-8">
        {orders.length > 0 ? (
          orders.map((order) => {
            const { text, color, step } = getStatusDetails(order.status);
            
            return (
              <div 
                key={order.id} 
                className="bg-white rounded-3xl border border-[#E5E2D9] shadow-xs overflow-hidden"
              >
                {/* Order Meta Header */}
                <div className="px-6 py-5 bg-[#F1EFE7]/50 border-b border-[#E5E2D9] flex flex-wrap gap-4 justify-between items-center">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-400">#</span>
                      <span className="text-sm font-extrabold text-brand-primary tracking-wider">{order.id}</span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 font-sans block">
                      {new Date(order.createdAt).toLocaleString(isAr ? 'ar-EG' : 'en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </span>
                  </div>
                  
                  {/* Status Tag */}
                  <span className={`px-4 py-2 rounded-xl text-xs font-bold border ${color}`}>
                    {text}
                  </span>
                </div>

                {/* Tracking Progress Stepper (Only show if not rejected) */}
                {step !== -1 ? (
                  <div className="px-6 py-8 border-b border-gray-100 bg-white">
                    <div className="relative flex justify-between items-center max-w-lg mx-auto">
                      
                      {/* Connection Line */}
                      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-100 z-0">
                        <div 
                          className="h-full bg-brand-gold transition-all duration-500 ease-out"
                          style={{
                            width: step === 1 ? '0%' : step === 2 ? '50%' : '100%'
                          }}
                        ></div>
                      </div>

                      {/* Step 1: Pending */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all ${
                          step >= 1 
                            ? 'bg-brand-primary border-brand-gold text-brand-gold shadow-md shadow-brand-primary/10' 
                            : 'bg-white border-gray-200 text-gray-400'
                        }`}>
                          <Timer className="w-5 h-5" />
                        </div>
                        <span className={`text-[10px] sm:text-xs font-bold mt-2 ${step >= 1 ? 'text-brand-primary' : 'text-gray-400'}`}>
                          {isAr ? 'قيد المراجعة' : 'Reviewed'}
                        </span>
                      </div>

                      {/* Step 2: Preparing */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all ${
                          step >= 2 
                            ? 'bg-brand-primary border-brand-gold text-brand-gold shadow-md shadow-brand-primary/10 animate-pulse' 
                            : 'bg-white border-gray-200 text-gray-400'
                        }`}>
                          <CookingPot className="w-5 h-5" />
                        </div>
                        <span className={`text-[10px] sm:text-xs font-bold mt-2 ${step >= 2 ? 'text-brand-primary' : 'text-gray-400'}`}>
                          {isAr ? 'في المطبخ' : 'Cooking'}
                        </span>
                      </div>

                      {/* Step 3: Delivered */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all ${
                          step >= 3 
                            ? 'bg-brand-primary border-brand-gold text-brand-gold shadow-md shadow-brand-primary/10' 
                            : 'bg-white border-gray-200 text-gray-400'
                        }`}>
                          <Truck className="w-5 h-5" />
                        </div>
                        <span className={`text-[10px] sm:text-xs font-bold mt-2 ${step >= 3 ? 'text-brand-primary' : 'text-gray-400'}`}>
                          {isAr ? 'تم التسليم' : 'Delivered'}
                        </span>
                      </div>

                    </div>
                  </div>
                ) : (
                  // Rejection warning panel
                  <div className="px-6 py-6 bg-rose-50/50 border-b border-gray-100 flex items-center gap-3">
                    <Ban className="w-6 h-6 text-rose-500 shrink-0" />
                    <div>
                      <h4 className="text-xs font-extrabold text-rose-800">
                        {isAr ? 'نعتذر بشدة عن عدم القدرة على تلبية طلبك' : 'We could not fulfill your order'}
                      </h4>
                      <p className="text-[10px] text-rose-600 mt-0.5">
                        {isAr ? 'قد يكون ذلك بسبب الضغط الشديد في المطبخ أو انتهاء كمية أحد الأصناف. برجاء تجربة الطلب لاحقاً.' : 'This might be due to heavy kitchen load or item stockout. Please try again later.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Items & details */}
                <div className="p-6 space-y-4 bg-white">
                  <div className="space-y-3">
                    {order.items.map((item, idx) => {
                      const itemPrice = item.menuItem.price;
                      const extrasSum = item.extras ? item.extras.reduce((s, ex) => s + ex.price, 0) : 0;
                      const lineTotal = (itemPrice + extrasSum) * item.quantity;
                      
                      return (
                        <div key={item.menuItem.id + '_' + idx} className="py-2.5 border-b border-gray-100 last:border-0 flex justify-between items-start text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-brand-gold font-mono min-w-[20px]">
                                {item.quantity}x
                              </span>
                              <span className="font-bold text-brand-primary">
                                {isAr ? item.menuItem.nameAr : item.menuItem.nameEn}
                              </span>
                            </div>
                            
                            {/* Extras list under item name */}
                            {item.extras && item.extras.length > 0 && (
                              <div className="flex flex-wrap gap-1 mr-6">
                                {item.extras.map((ex) => (
                                  <span key={ex.nameAr} className="text-[9px] bg-brand-primary/5 text-brand-primary border border-brand-primary/10 px-1.5 py-0.5 rounded-lg font-bold">
                                    + {isAr ? ex.nameAr : ex.nameEn}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Stars rating under item name */}
                            {item.rating && (
                              <div className="flex items-center gap-0.5 mr-6 mt-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star key={s} className={`w-3 h-3 ${s <= item.rating! ? 'text-brand-gold fill-brand-gold' : 'text-gray-200'}`} />
                                ))}
                              </div>
                            )}
                          </div>
                          <span className="font-sans text-gray-500 font-medium shrink-0">
                            {lineTotal} {isAr ? 'ج.م' : 'EGP'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {order.notes && (
                    <div className="p-3.5 bg-[#F1EFE7]/40 rounded-2xl border border-[#E5E2D9] text-xs text-[#2D241E]/80 leading-relaxed">
                      <span className="font-bold text-brand-primary text-[10px] block mb-0.5 uppercase tracking-wide">
                        {isAr ? 'ملاحظاتك للمطبخ' : 'Notes to Kitchen'}:
                      </span>
                      {order.notes}
                    </div>
                  )}

                  {/* Customer Contact & Address transparency block */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-3.5 bg-[#FAF9F6] rounded-2xl border border-[#E5E2D9] text-xs text-[#2D241E]/80 leading-relaxed">
                      <span className="font-bold text-brand-primary text-[10px] block mb-1 uppercase tracking-wide">
                        {isAr ? 'تفاصيل الاتصال بالدليفري' : 'Delivery Contact Details'}:
                      </span>
                      <div className="space-y-1">
                        <div>
                          <span className="text-[10px] text-gray-400 font-bold block">{isAr ? 'الهاتف الأساسي' : 'Primary Phone'}</span>
                          <span className="font-extrabold font-mono text-xs">{order.phone || (isAr ? 'غير مسجل' : 'Not Provided')}</span>
                        </div>
                        {order.whatsapp && (
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold block">{isAr ? 'رقم الواتساب' : 'WhatsApp Number'}</span>
                            <span className="font-extrabold font-mono text-xs text-emerald-600">💬 {order.whatsapp}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-3.5 bg-[#FAF9F6] rounded-2xl border border-[#E5E2D9] text-xs text-[#2D241E]/80 leading-relaxed">
                      <span className="font-bold text-brand-primary text-[10px] block mb-1 uppercase tracking-wide">
                        {isAr ? 'عنوان التوصيل و الـ GPS' : 'Delivery Address & GPS'}:
                      </span>
                      <div className="space-y-1">
                        <div>
                          <span className="text-[10px] text-gray-400 font-bold block">{isAr ? 'عنوانك المفصل' : 'Full Address'}</span>
                          <span className="font-extrabold text-xs truncate" title={order.address || ''}>{order.address || (isAr ? 'لم يحدد' : 'Not specified')}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 font-bold block">{isAr ? 'الموقع الجغرافي (GPS)' : 'GPS Coordinates'}</span>
                          <span className="font-extrabold text-xs">
                            {order.latitude && order.longitude ? (
                              <span className="text-emerald-600">📍 {isAr ? 'تم تحديد الإحداثيات بدقة' : 'GPS Coordinates Anchored'}</span>
                            ) : (
                              <span className="text-gray-400 font-medium italic">{isAr ? 'لم يتم التقاط الموقع' : 'No GPS captured'}</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="h-[1px] bg-[#E5E2D9] my-4"></div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs font-bold text-gray-400">
                      {isAr ? 'طريقة الدفع' : 'Payment Mode'}: <span className="text-[#2D241E]">{isAr ? 'نقداً عند الاستلام' : 'Cash on Delivery'}</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-brand-primary">
                        {isAr ? 'المجموع الكلي' : 'Total Amount'}:
                      </span>
                      <span className="font-sans text-brand-clay text-lg font-black">
                        {order.total} {isAr ? 'ج.م' : 'EGP'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            );
          })
        ) : (
          <div className="py-20 bg-white rounded-3xl border border-[#E5E2D9] text-center flex flex-col items-center justify-center p-6">
            <span className="text-5xl">📦</span>
            <h3 className="text-lg font-bold text-brand-primary mt-4">
              {isAr ? 'لا يوجد طلبات مسجلة باسمك بعد' : 'No orders found'}
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-xs">
              {isAr ? 'اذهب للقائمة الرئيسية واختر بعض المأكولات وأرسل طلبك للمطبخ!' : 'Browse our fine food list, add items to your cart, and place your first order!'}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
