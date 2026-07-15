import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Plus, Minus, Trash2, Loader2, ArrowLeft, ArrowRight, MessageSquareCode, Phone, MapPin, Compass, Star, Map } from 'lucide-react';
import { CartItem, MenuItem, User, Order } from '../types.js';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (menuItem: MenuItem, change: number) => void;
  onRemoveItem: (menuItem: MenuItem) => void;
  onClearCart: () => void;
  user: User | null;
  onOpenAuth: () => void;
  lang: 'ar' | 'en';
  onOrderSuccess: (updatedUser?: User, newOrder?: Order) => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  user,
  onOpenAuth,
  lang,
  onOrderSuccess,
}: CartDrawerProps) {
  const isAr = lang === 'ar';
  const [deliveryName, setDeliveryName] = useState(user?.username || '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Delivery & Contact States
  const [phone, setPhone] = useState(user?.phone || '');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || '');
  const [sameAsPhone, setSameAsPhone] = useState(!user?.whatsapp || user?.phone === user?.whatsapp);
  const [address, setAddress] = useState(user?.address || '');
  const [latitude, setLatitude] = useState<number | undefined>(user?.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(user?.longitude);
  const [locating, setLocating] = useState(false);
  const [locSuccess, setLocSuccess] = useState(!!user?.latitude);

  // Sync state if user changes
  useEffect(() => {
    if (user) {
      setDeliveryName(user.username || '');
      setPhone(user.phone || '');
      setWhatsapp(user.whatsapp || '');
      setAddress(user.address || '');
      setLatitude(user.latitude);
      setLongitude(user.longitude);
      setLocSuccess(!!user.latitude);
      if (user.phone && user.whatsapp && user.phone === user.whatsapp) {
        setSameAsPhone(true);
      } else if (user.phone && user.whatsapp && user.phone !== user.whatsapp) {
        setSameAsPhone(false);
      }
    }
  }, [user]);

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (sameAsPhone) {
      setWhatsapp(val);
    }
  };

  const handleSameAsPhoneToggle = (checked: boolean) => {
    setSameAsPhone(checked);
    if (checked) {
      setWhatsapp(phone);
    }
  };

  // Drag and Geolocation operations
  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      setError(isAr ? 'متصفحك لا يدعم خاصية تحديد الموقع الجغرافي تلقائياً' : 'Geolocation is not supported by your browser');
      return;
    }

    setLocating(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setLocating(false);
        setLocSuccess(true);

        // Move Leaflet map and marker instantly!
        // @ts-ignore
        if (window.leafletMapInstance && window.leafletMarkerInstance) {
          // @ts-ignore
          window.leafletMapInstance.setView([lat, lng], 16);
          // @ts-ignore
          window.leafletMarkerInstance.setLatLng([lat, lng]);
        }
      },
      (err) => {
        setLocating(false);
        console.error(err);
        setError(isAr 
          ? 'فشل التقاط الموقع. تأكد من تشغيل الـ GPS وإعطاء إذن تحديد الموقع للمتصفح' 
          : 'Could not fetch GPS coordinates. Please enable GPS and allow location permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Setup Leaflet map on Mount and open drawer
  useEffect(() => {
    if (!isOpen) return;

    // We must wait a tiny bit for the DOM container to be fully rendered in the Drawer animation
    const timer = setTimeout(() => {
      const mapContainer = document.getElementById('checkout-map');
      if (!mapContainer) return;

      // Default coordinates centered on Cairo landmarks
      const defaultLat = latitude || 30.0444; 
      const defaultLng = longitude || 31.2357;

      // @ts-ignore
      if (window.L) {
        // @ts-ignore
        const L = window.L;

        // Fix Leaflet marker icon asset paths dynamically (Expert Touch)
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        // Clean up previous map if exists
        // @ts-ignore
        if (window.leafletMapInstance) {
          try {
            // @ts-ignore
            window.leafletMapInstance.remove();
          } catch(e) {
            console.error('Error removing map instance', e);
          }
        }

        const map = L.map('checkout-map', {
          center: [defaultLat, defaultLng],
          zoom: 14,
          zoomControl: true,
          attributionControl: false
        });

        // @ts-ignore
        window.leafletMapInstance = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map);

        // Add a beautiful custom red draggable marker
        const marker = L.marker([defaultLat, defaultLng], {
          draggable: true
        }).addTo(map);

        // Dragend event handler to update latitude/longitude states
        marker.on('dragend', () => {
          const position = marker.getLatLng();
          setLatitude(position.lat);
          setLongitude(position.lng);
          setLocSuccess(true);
        });

        // Save map and marker instances in refs if needed, or window for convenience
        // @ts-ignore
        window.leafletMarkerInstance = marker;
      }
    }, 450);

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate accurate total including any customized extras inside items!
  const total = cartItems.reduce((sum, item) => {
    const itemPrice = item.menuItem.price;
    const extrasPrice = item.extras ? item.extras.reduce((s, ex) => s + ex.price, 0) : 0;
    return sum + ((itemPrice + extrasPrice) * item.quantity);
  }, 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (!user) {
      // Prompt customer login first
      onOpenAuth();
      return;
    }

    if (!deliveryName.trim()) {
      setError(isAr ? 'برجاء إدخال اسمك الكريم للتوصيل' : 'Please enter your name');
      return;
    }

    if (!phone.trim()) {
      setError(isAr ? 'برجاء إدخال رقم الهاتف للتواصل معك' : 'Please enter your phone number');
      return;
    }

    if (!whatsapp.trim()) {
      setError(isAr ? 'برجاء إدخال رقم الواتساب لاستلام الفاتورة' : 'Please enter your WhatsApp number');
      return;
    }

    if (!address.trim()) {
      setError(isAr ? 'برجاء إدخال عنوان التوصيل بالتفصيل الممل' : 'Please enter your delivery address');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // 1. Submit order to backend server
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          username: deliveryName.trim(),
          items: cartItems,
          notes: notes.trim() || undefined,
          phone: phone.trim(),
          whatsapp: whatsapp.trim(),
          address: address.trim(),
          latitude,
          longitude
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || (isAr ? 'فشل إرسال الطلب' : 'Could not submit order'));
      }

      // 2. Fetch Active Admin phone number for WhatsApp redirect
      let activeAdminPhone = '01120751465';
      try {
        const settingsRes = await fetch('/api/settings');
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          if (settingsData && settingsData.adminPhone) {
            activeAdminPhone = settingsData.adminPhone;
          }
        }
      } catch (settingsErr) {
        console.error('Error fetching settings for WhatsApp redirect:', settingsErr);
      }

      // 3. Format the Gorgeous WhatsApp message text (As 30-Year Expert)
      const timeStr = new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
      const dateStr = new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' });
      
      let msg = `🔥 *طلب جديد من مطعم أبو قورة الفلاحي* 🔥\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `👤 *اسم العميل:* ${deliveryName.trim()}\n`;
      msg += `📱 *رقم الهاتف:* ${phone.trim()}\n`;
      msg += `💬 *رقم الواتساب:* ${whatsapp.trim()}\n`;
      msg += `📅 *تاريخ الطلب:* ${dateStr} في ${timeStr}\n\n`;
      
      msg += `🍽️ *الأصناف المطلوبة:* \n`;
      cartItems.forEach((item, index) => {
        const baseItemPrice = item.menuItem.price;
        const extrasSum = item.extras ? item.extras.reduce((s, ex) => s + ex.price, 0) : 0;
        const singleTotal = baseItemPrice + extrasSum;
        const lineTotal = singleTotal * item.quantity;
        
        let itemLine = `• *${item.quantity}x ${item.menuItem.nameAr}* (${baseItemPrice} ج.م)`;
        if (item.rating) {
          itemLine += ` [تقييم: ${item.rating}⭐]`;
        }
        itemLine += `\n`;
        
        if (item.extras && item.extras.length > 0) {
          itemLine += `   _إضافات: ${item.extras.map(e => `${e.nameAr} (+${e.price}ج.م)`).join(' + ')}_\n`;
        }
        
        itemLine += `   _الحساب للوجبة: ${lineTotal} ج.م_\n`;
        msg += itemLine;
      });
      
      if (notes.trim()) {
        msg += `\n📝 *ملاحظات المطبخ:* \n"${notes.trim()}"\n`;
      }
      
      msg += `\n📍 *العنوان بالتفصيل المُمَل:* \n${address.trim()}\n\n`;
      
      if (latitude && longitude) {
        msg += `🛰️ *موقع التوصيل المباشر (GPS Link):* \nhttps://www.google.com/maps/search/?api=1&query=${latitude},${longitude}\n`;
      }
      
      msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `💵 *إجمالي الحساب:* *${total} ج.م*\n`;
      msg += `🛵 *التوصيل:* مجاني لفترة محدودة\n`;
      msg += `💰 *طريقة الدفع:* نقداً عند الاستلام (COD)\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `شكراً لشرائكم من مطعم أبو قورة الفلاحي! نخدمكم بكل حب وسعادة ❤️`;

      // Clean telephone
      const cleanPhone = activeAdminPhone.replace(/[^0-9]/g, '');
      const encodedMsg = encodeURIComponent(msg);
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;

      // Open WhatsApp instantly!
      window.open(whatsappUrl, '_blank');

      // Prepare updated user defaults to return to App context
      const updatedUser: User = {
        ...user,
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        address: address.trim(),
        latitude,
        longitude
      };

      // Clear local state
      setNotes('');
      onClearCart();
      onOrderSuccess(updatedUser, data.order);
      onClose();
    } catch (err: any) {
      setError(err.message || (isAr ? 'عذراً، حدث خطأ أثناء إتمام الطلب' : 'Checkout failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      {/* Backdrop Click Dismiss */}
      <div className="absolute inset-0 animate-fade-in" onClick={onClose}></div>

      {/* Drawer Container */}
      <div 
        className="relative w-full max-w-md h-full bg-[#FAF9F6] flex flex-col shadow-2xl border-l border-[#E5E2D9] animate-in slide-in-from-left duration-300"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E5E2D9] flex items-center justify-between bg-[#FDFBF7] text-[#2D241E]">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-brand-gold" />
            <h3 className="text-base font-black font-serif text-[#3D4021]">
              {isAr ? 'سلة مأكولاتك (السلعة)' : 'My Food Cart'}
            </h3>
            <span className="bg-[#3D4021]/5 border border-[#3D4021]/15 text-[#3D4021] px-3 py-1 rounded-full text-xs font-bold">
              {totalItems} {isAr ? 'صنف' : 'items'}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable list & Checkout Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold text-center">
              {error}
            </div>
          )}

          {cartItems.length > 0 ? (
            <div className="space-y-6">
              {/* Header Pricing Card */}
              <div className="p-5 bg-brand-primary text-brand-gold rounded-3xl border border-[#4D5129]/30 text-center space-y-1 shadow-md">
                <span className="text-[10px] text-gray-300 font-bold uppercase tracking-wider block">
                  {isAr ? 'القيمة الإجمالية المسجلة في السلة' : 'Subtotal Basket Value'}
                </span>
                <h4 className="text-xl sm:text-2xl font-serif font-black">
                  {isAr ? 'إجمالي ثمن المأكولات:' : 'Total Food Price:'} {total} {isAr ? 'ج.م' : 'EGP'}
                </h4>
              </div>

              {/* Items Listing */}
              <div className="space-y-4">
                {cartItems.map((item) => {
                  const itemPrice = item.menuItem.price;
                  const extrasPrice = item.extras ? item.extras.reduce((s, ex) => s + ex.price, 0) : 0;
                  const itemSum = itemPrice + extrasPrice;
                  
                  return (
                    <div 
                      key={item.menuItem.id} 
                      className="flex gap-4 p-4 rounded-2xl border border-[#E5E2D9] shadow-xs hover:border-[#3D4021]/20 transition-all bg-white"
                    >
                      {/* Photo */}
                      <img 
                        src={item.menuItem.image} 
                        alt={isAr ? item.menuItem.nameAr : item.menuItem.nameEn}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-xl object-cover bg-[#F1EFE7] shrink-0 border border-[#E5E2D9]/40"
                      />
                      
                      {/* Info details */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="text-xs sm:text-sm font-bold text-[#3D4021] font-serif leading-tight">
                              {isAr ? item.menuItem.nameAr : item.menuItem.nameEn}
                            </h4>
                          </div>

                          {/* Render custom extras/toppings selection */}
                          {item.extras && item.extras.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {item.extras.map((ex) => (
                                <span 
                                  key={ex.nameAr} 
                                  className="text-[9px] bg-brand-primary/5 text-brand-primary border border-brand-primary/10 px-1.5 py-0.5 rounded-lg font-extrabold"
                                >
                                  + {isAr ? ex.nameAr : ex.nameEn}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Render custom Star Assessment */}
                          {item.rating && (
                            <div className="flex items-center gap-0.5 mt-1.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star 
                                  key={s} 
                                  className={`w-3.5 h-3.5 ${s <= item.rating! ? 'text-brand-gold fill-brand-gold' : 'text-gray-200'}`} 
                                />
                              ))}
                            </div>
                          )}

                          <span className="text-xs font-black text-brand-clay font-sans mt-2 block">
                            {itemSum * item.quantity} {isAr ? 'ج.م' : 'EGP'} 
                            {item.quantity > 1 && (
                              <span className="text-[10px] text-gray-400 font-medium mr-1 font-sans">
                                ({itemSum} {isAr ? 'للواحدة' : 'each'})
                              </span>
                            )}
                          </span>
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E5E2D9]/50">
                          <div className="flex items-center gap-1.5 bg-[#F1EFE7] p-0.5 rounded-xl border border-[#E5E2D9]/40">
                            <button
                              onClick={() => onUpdateQuantity(item.menuItem, -1)}
                              className="p-1.5 rounded-lg bg-white hover:bg-gray-100 text-[#3D4021] shadow-xs active:scale-95 transition-all cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-extrabold px-2.5 text-[#3D4021] font-mono min-w-[16px] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.menuItem, 1)}
                              className="p-1.5 rounded-lg bg-white hover:bg-gray-100 text-[#3D4021] shadow-xs active:scale-95 transition-all cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => onRemoveItem(item.menuItem)}
                            className="p-1.5 rounded-xl text-gray-400 hover:text-brand-clay hover:bg-brand-clay/5 border border-transparent hover:border-brand-clay/15 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Delivery & GPS Details Box */}
              <div className="space-y-4 pt-6 border-t border-[#E5E2D9]">
                <h4 className="text-sm font-black text-[#3D4021] font-serif flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-brand-gold animate-bounce" />
                  <span>{isAr ? '🚚 بيانات التوصيل المباشر والـ GPS' : '🚚 Direct Delivery & GPS Details'}</span>
                </h4>

                {/* Info save reminder banner for non-logged in or guest user */}
                {!user && (
                  <div className="p-4 bg-amber-50/75 border border-amber-200/50 rounded-2xl text-xs text-amber-950 space-y-2.5 leading-relaxed">
                    <p className="font-bold">
                      {isAr 
                        ? '💡 هل تريد حفظ بياناتك لسهولة الطلب مستقبلاً؟ سجل حسابك الآن لحفظ الاسم، العنوان، وإحداثيات الموقع وتعبئتها تلقائياً في ثوانٍ معدودة!' 
                        : '💡 Want to save your contact info for future orders? Register or login to save your address, name, and GPS coordinates!'}
                    </p>
                    <button 
                      onClick={onOpenAuth}
                      className="px-4 py-2 bg-[#3D4021] text-brand-gold font-extrabold text-[10px] rounded-xl hover:bg-[#4D5129] transition-all cursor-pointer border border-[#3D4021]"
                    >
                      {isAr ? '🔑 تسجيل الدخول أو إنشاء حساب' : '🔑 Login / Sign Up'}
                    </button>
                  </div>
                )}

                {/* Form fields */}
                <div className="space-y-3.5">
                  {/* Name field */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#3D4021]/85 flex items-center gap-1">
                      <span>👤</span>
                      <span>{isAr ? 'اسمك الكريم *' : 'Your Good Name *'}</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={deliveryName}
                      onChange={(e) => setDeliveryName(e.target.value)}
                      placeholder={isAr ? 'اكتب اسمك الثلاثي' : 'Enter your full name'}
                      className="w-full px-4 py-3 rounded-xl border border-[#E5E2D9] text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-[#3D4021]/5 focus:border-[#3D4021] bg-white text-[#2D241E] shadow-sm"
                    />
                  </div>

                  {/* Phone field */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#3D4021]/85 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-brand-gold" />
                      <span>{isAr ? 'رقم تليفونك للتنسيق مع الطيار *' : 'Primary Phone Number *'}</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder={isAr ? 'رقم الموبايل (مثال: 01012345678)' : 'e.g. 01012345678'}
                      className="w-full px-4 py-3 rounded-xl border border-[#E5E2D9] text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-[#3D4021]/5 focus:border-[#3D4021] bg-white text-[#2D241E] shadow-sm font-mono"
                    />
                  </div>

                  {/* WhatsApp field */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold text-[#3D4021]/85 flex items-center gap-1">
                        <span className="text-emerald-500">💬</span>
                        <span>{isAr ? 'رقم الواتساب لاستقبال الفواتير وتتبع الموقع' : 'WhatsApp Number for Invoices'}</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={sameAsPhone}
                          onChange={(e) => handleSameAsPhoneToggle(e.target.checked)}
                          className="rounded border-[#E5E2D9] text-[#3D4021] focus:ring-[#3D4021] w-3.5 h-3.5 cursor-pointer accent-[#3D4021]"
                        />
                        <span className="text-[10px] font-extrabold text-[#3D4021]/60">
                          {isAr ? 'نفس الهاتف' : 'Same as phone'}
                        </span>
                      </label>
                    </div>

                    {!sameAsPhone && (
                      <input
                        type="tel"
                        required
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder={isAr ? 'مثال: 01120751464' : 'e.g. 01120751464'}
                        className="w-full px-4 py-3 rounded-xl border border-[#E5E2D9] text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-[#3D4021]/5 focus:border-[#3D4021] bg-white text-[#2D241E] shadow-sm font-mono animate-in slide-in-from-top-2 duration-150"
                      />
                    )}
                  </div>

                  {/* Detailed Address field */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#3D4021]/85 flex items-center gap-1.5">
                      <Map className="w-3.5 h-3.5 text-brand-gold" />
                      <span>{isAr ? 'العنوان بالتفصيل الممل *' : 'Detailed Full Address *'}</span>
                    </label>
                    <textarea
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={isAr 
                        ? 'المنطقة، الشارع، رقم العمارة، رقم الدور وعلامة مميزة' 
                        : 'Area, street, building number, floor number, landmarks...'}
                      className="w-full px-4 py-3 rounded-xl border border-[#E5E2D9] text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-[#3D4021]/5 focus:border-[#3D4021] resize-none h-18 bg-white text-[#2D241E] leading-relaxed shadow-sm"
                    />
                  </div>

                  {/* Interactive Leaflet Map for GPS pinning */}
                  <div className="space-y-2 pt-2">
                    <label className="text-[11px] font-bold text-[#3D4021]/85 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-brand-gold animate-spin-slow" />
                        <span>{isAr ? 'تحديد موقعك الجغرافي بدقة متناهية (مطلوب لتحديد خط السير):' : 'Pinpoint Your Exact Location on Map:'}</span>
                      </span>
                    </label>
                    
                    {/* Live map rendering container */}
                    <div className="relative rounded-2xl border border-[#E5E2D9] overflow-hidden shadow-inner bg-[#F1EFE7]/50">
                      <div id="checkout-map" className="h-48 w-full z-10"></div>
                      <div className="absolute top-2 right-2 z-20 bg-white/95 backdrop-blur-xs px-2 py-1 rounded-md border border-gray-100 text-[9px] font-black shadow-xs flex items-center gap-1 text-[#3D4021]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3D4021] animate-pulse"></span>
                        <span>{isAr ? 'اسحب الدبوس الأحمر فوق بيتك' : 'Drag red pin over your home'}</span>
                      </div>
                    </div>

                    {/* Auto-GPS capturing button */}
                    <button
                      type="button"
                      onClick={handleCaptureGPS}
                      disabled={locating}
                      className={`w-full py-3.5 rounded-2xl border flex items-center justify-center gap-2 transition-all text-xs font-black cursor-pointer shadow-sm ${
                        locSuccess 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                          : 'bg-[#F1EFE7]/50 border-[#E5E2D9] text-[#3D4021] hover:bg-[#F1EFE7]'
                      }`}
                    >
                      {locating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-brand-gold" />
                          <span>{isAr ? 'جاري الاتصال بالأقمار الصناعية...' : 'Locating via Satellites...'}</span>
                        </>
                      ) : locSuccess ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                          <span>
                            {isAr 
                              ? `تحديد موقعي التلقائي بالـ GPS 🛰️` 
                              : `Auto-GPS Location Captured 🛰️`}
                          </span>
                        </>
                      ) : (
                        <>
                          <span>🛰️ {isAr ? 'تحديد موقعي التلقائي بالـ GPS 🛰️' : 'Auto-Capture My GPS Location'}</span>
                        </>
                      )}
                    </button>

                    {/* Coordinate readouts */}
                    <div className="px-3.5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[10px] text-gray-500 font-semibold font-mono flex flex-wrap gap-2 justify-between">
                      <span>{isAr ? 'خط العرض:' : 'Lat:'} {latitude ? latitude.toFixed(5) : '---'}</span>
                      <span>{isAr ? 'خط الطول:' : 'Lng:'} {longitude ? longitude.toFixed(5) : '---'}</span>
                      <span className="text-emerald-600 font-bold">{isAr ? '[مؤمن GPS]' : '[Secure GPS]'}</span>
                    </div>
                  </div>

                  {/* Kitchen Special Notes */}
                  <div className="space-y-1.5 pt-2">
                    <label className="text-[11px] font-bold text-[#3D4021]/85 flex items-center gap-2">
                      <MessageSquareCode className="w-4 h-4 text-brand-gold" />
                      <span>{isAr ? 'ملاحظات إضافية أو طلبات خاصة (اختياري)' : 'Additional Comments / Kitchen Instructions'}</span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={isAr 
                        ? 'مثلاً: يرجى إرسال عيش زيادة، الصلصة حارة، أو غيره...' 
                        : 'e.g. Extra hot sauce, well-done grills, extra baladi bread...'}
                      className="w-full px-4 py-3 rounded-xl border border-[#E5E2D9] text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-[#3D4021]/5 focus:border-[#3D4021] resize-none h-18 leading-relaxed bg-white text-[#2D241E] shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-28 space-y-4">
              <span className="text-5xl animate-bounce">🛒</span>
              <h4 className="text-base font-bold text-[#3D4021] font-serif">
                {isAr ? 'سلة الطلبات فارغة' : 'Your cart is completely empty'}
              </h4>
              <p className="text-xs text-gray-400 max-w-xs leading-relaxed font-semibold">
                {isAr 
                  ? 'لم تقم بإضافة أي وجبة شهية بعد. تصفح قائمتنا الغنية بالمشاوي والطواجن الفاخرة واختر وجبتك المفضلة!' 
                  : 'You have not added any delicious dishes yet. Explore our premium menu and take your pick!'}
              </p>
              <button
                onClick={onClose}
                className="mt-3 px-6 py-3 rounded-2xl border border-[#E5E2D9] bg-white hover:bg-[#F1EFE7] text-[#3D4021] text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                {isAr ? 'تصفح القائمة الآن' : 'Browse Menu Now'}
              </button>
            </div>
          )}
        </div>

        {/* Footer Invoice & Submit Order button */}
        {cartItems.length > 0 && (
          <div className="p-6 border-t border-[#E5E2D9] bg-[#FDFBF7] space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-gray-400">
                <span>{isAr ? 'حساب مأكولاتك' : 'Food Subtotal'}</span>
                <span className="font-sans text-gray-500 font-extrabold">{total} {isAr ? 'ج.م' : 'EGP'}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-gray-400">
                <span>{isAr ? 'توصيل دليفري أبو قورة' : 'Abu Qura Delivery'}</span>
                <span className="font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg text-[10px]">
                  {isAr ? 'مجانًا لفترة محدودة' : 'FREE for a limited time'}
                </span>
              </div>
              <div className="h-[1px] bg-[#E5E2D9]/70 my-2"></div>
              <div className="flex justify-between items-center text-base font-black text-[#3D4021]">
                <span>{isAr ? 'المبلغ الإجمالي الكلي' : 'Grand Total Invoice'}</span>
                <span className="font-sans text-brand-clay text-2xl font-black">
                  {total} {isAr ? 'ج.م' : 'EGP'}
                </span>
              </div>
            </div>

            {/* Checkout CTA */}
            <button
              onClick={handleCheckout}
              disabled={submitting}
              className="w-full py-4.5 rounded-2xl bg-[#3D4021] hover:bg-[#4D5129] text-brand-gold hover:text-white font-extrabold text-sm shadow-xl shadow-[#3D4021]/15 transition-all duration-300 tap-scale flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border border-[#3D4021]"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin text-brand-gold" />
              ) : !user ? (
                <span>{isAr ? 'سجل دخول لإرسال الطلب للمطبخ' : 'Login to Submit Order'}</span>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5 text-brand-gold" />
                  <span>{isAr ? `إرسال الطلب للمطبخ فوراً (${total} ج.م)` : `Place Order with Kitchen (${total} EGP)`}</span>
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
