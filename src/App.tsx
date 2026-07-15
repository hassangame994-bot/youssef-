import React, { useState, useEffect } from 'react';
import { Shield, Bell, X, ChefHat, CheckCircle, Flame, MessageSquareCode } from 'lucide-react';
import { User, MenuItem, CartItem, Order, OrderStatus, Category } from './types.js';
import Navbar from './components/Navbar.js';
import AuthModal from './components/AuthModal.js';
import MenuSection from './components/MenuSection.js';
import CartDrawer from './components/CartDrawer.js';
import UserOrders from './components/UserOrders.js';
import AdminDashboard from './components/AdminDashboard.js';
import BottomNavigation from './components/BottomNavigation.js';
import MealCustomizationModal from './components/MealCustomizationModal.js';
import { playNotificationChime, playStatusUpdateChime } from './utils/audio.js';

interface ToastAlert {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}

export default function App() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [user, setUser] = useState<User | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [currentTab, setCurrentTab] = useState<'menu' | 'orders' | 'admin'>('menu');
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [toasts, setToasts] = useState<ToastAlert[]>([]);
  const [customizingMenuItem, setCustomizingMenuItem] = useState<MenuItem | null>(null);

  const isAr = lang === 'ar';

  // Helper to add floating toast notifications
  const addToast = (title: string, message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    
    // Auto dismiss after 6 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  const fetchMenu = async () => {
    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      if (Array.isArray(data)) {
        setMenu(data);
      }
    } catch (err) {
      console.error('Error fetching menu items:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // 1. Initial Load: Auth from LocalStorage & Fetch Menu & Categories
  useEffect(() => {
    const savedUser = localStorage.getItem('abu_qura_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as User;
        setUser(parsed);
        if (parsed.role === 'admin') {
          setCurrentTab('admin');
        } else {
          setCurrentTab('menu');
        }
      } catch (err) {
        localStorage.removeItem('abu_qura_user');
      }
    }

    fetchMenu();
    fetchCategories();
  }, []);

  // 2. Load Orders when user changes or currentTab changes
  const fetchOrders = async () => {
    if (!user) return;
    setLoadingOrders(true);
    try {
      const url = user.role === 'admin' 
        ? '/api/orders?isAdmin=true' 
        : `/api/orders?userId=${user.id}`;
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user, currentTab]);

  // 3. Setup Live Real-time SSE listener
  useEffect(() => {
    if (!user) return;

    const queryParams = new URLSearchParams({
      userId: user.id,
      isAdmin: user.role === 'admin' ? 'true' : 'false'
    });

    const eventSource = new EventSource(`/api/events?${queryParams.toString()}`);

    eventSource.addEventListener('new-order', (event: any) => {
      try {
        const newOrder = JSON.parse(event.data) as Order;
        
        // Append order to local admin list
        setOrders((prev) => [newOrder, ...prev]);
        
        // Play synthetic chime notification!
        playNotificationChime();

        // Trigger gorgeous toaster popup alert
        addToast(
          isAr ? '🔔 طلب كباب ومأكولات جديد!' : '🔔 New Delicious Order!',
          isAr 
            ? `وصل للتو طلب جديد من العميل (${newOrder.username}) بقيمة ${newOrder.total} ج.م` 
            : `New order received from client (${newOrder.username}) totaling ${newOrder.total} EGP`,
          'success'
        );
      } catch (err) {
        console.error('Error parsing SSE new-order event:', err);
      }
    });

    eventSource.addEventListener('order-status-updated', (event: any) => {
      try {
        const updatedOrder = JSON.parse(event.data) as Order;
        
        // Update order status locally in user list
        setOrders((prev) => 
          prev.map((o) => o.id === updatedOrder.id ? updatedOrder : o)
        );

        const statusAr = updatedOrder.status === 'preparing' 
          ? 'جاري تحضيره وطهيه الآن في المطبخ 🍳' 
          : updatedOrder.status === 'delivered' 
          ? 'تم توصيله لك بالهناء والشفاء! 🛵' 
          : 'نعتذر بشدة، تم رفض الطلب ❌';

        const statusEn = updatedOrder.status === 'preparing'
          ? 'is being prepared and cooked now! 🍳'
          : updatedOrder.status === 'delivered'
          ? 'has been delivered! Enjoy your meal! 🛵'
          : 'has been rejected due to busy hours ❌';

        // Play positive or warning tone based on status
        playStatusUpdateChime(updatedOrder.status !== 'rejected');

        addToast(
          isAr ? '👨‍🍳 تحديث حالة طلبك' : '👨‍🍳 Order Status Update',
          isAr 
            ? `طلبك رقم #${updatedOrder.id} ${statusAr}` 
            : `Your order #${updatedOrder.id} ${statusEn}`,
          updatedOrder.status === 'rejected' ? 'warning' : 'info'
        );
      } catch (err) {
        console.error('Error parsing SSE order-status event:', err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [user, lang]);

  // Auth operations
  const handleAuthSuccess = (authUser: User) => {
    setUser(authUser);
    localStorage.setItem('abu_qura_user', JSON.stringify(authUser));
    
    addToast(
      isAr ? '🟢 تم تسجيل الدخول بنجاح' : '🟢 Logged In Successfully',
      isAr 
        ? `أهلاً بك يا ${authUser.username} في مطعم أبو قورة` 
        : `Welcome, ${authUser.username} to Abu Qura Restaurant`,
      'success'
    );

    if (authUser.role === 'admin') {
      setCurrentTab('admin');
    } else {
      setCurrentTab('menu');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('abu_qura_user');
    setCartItems([]);
    setOrders([]);
    setCurrentTab('menu');

    addToast(
      isAr ? '⚪ تم تسجيل الخروج' : '⚪ Logged Out',
      isAr ? 'نتمنى رؤيتك قريباً للاستمتاع بوجباتنا الشهية' : 'We hope to see you again soon for more culinary delights',
      'info'
    );
  };

  // Cart operations
  const handleAddToCart = (item: MenuItem) => {
    setCustomizingMenuItem(item);
  };

  const handleUpdateCartQuantity = (item: MenuItem, change: number) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.menuItem.id === item.id);
      if (!existing) return prev;

      const newQty = existing.quantity + change;
      if (newQty <= 0) {
        return prev.filter((i) => i.menuItem.id !== item.id);
      }
      return prev.map((i) => i.menuItem.id === item.id ? { ...i, quantity: newQty } : i);
    });
  };

  const handleRemoveCartItem = (item: MenuItem) => {
    setCartItems((prev) => prev.filter((i) => i.menuItem.id !== item.id));
  };

  // Admin update status operations
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update order');
      }

      // Update locally
      setOrders((prev) => prev.map((o) => o.id === orderId ? data.order : o));

      addToast(
        isAr ? '✅ تم تحديث حالة الطلب' : '✅ Order Status Updated',
        isAr 
          ? `الطلب #${orderId} الآن في حالة (${status === 'preparing' ? 'التحضير والطهي' : status === 'delivered' ? 'التسليم' : 'الرفض'})`
          : `Order #${orderId} is now (${status})`,
        'success'
      );
    } catch (err: any) {
      addToast(
        isAr ? '❌ فشل تحديث حالة الطلب' : '❌ Failed to Update Order',
        err.message || 'An error occurred',
        'warning'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Dynamic Top Navigation Header */}
      <Navbar
        user={user}
        lang={lang}
        setLang={setLang}
        cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onOpenCart={() => setCartOpen(true)}
        onOpenAuth={() => setAuthOpen(true)}
        onLogout={handleLogout}
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          if (tab === 'orders' && !user) {
            setAuthOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
      />

      {/* Main Container Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {currentTab === 'menu' && (
          <MenuSection
            menu={menu}
            categories={categories}
            lang={lang}
            onAddToCart={handleAddToCart}
          />
        )}

        {currentTab === 'orders' && user && (
          <UserOrders
            userId={user.id}
            lang={lang}
            orders={orders}
            onRefresh={fetchOrders}
            loading={loadingOrders}
          />
        )}

        {currentTab === 'admin' && user?.role === 'admin' && (
          <AdminDashboard
            orders={orders}
            lang={lang}
            menu={menu}
            categories={categories}
            onUpdateStatus={handleUpdateOrderStatus}
            onRefresh={fetchOrders}
            onRefreshMenu={fetchMenu}
            onRefreshCategories={fetchCategories}
            loading={loadingOrders}
          />
        )}

      </main>

      {/* Culinary Footer Block */}
      <footer className="bg-brand-primary text-white pt-12 pb-32 md:py-12 border-t border-brand-gold/10 mt-12" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#E0A93B] bg-white shrink-0 shadow-lg transition-transform duration-300 hover:scale-105 flex items-center justify-center">
              <img 
                src="/src/assets/images/abu_goura_original_logo_1784129485186.jpg" 
                alt="أبو قورة" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="text-base font-black tracking-tight block text-white">مطعم أبو قورة الفلاحي</span>
              <span className="text-[10px] text-brand-gold font-bold uppercase tracking-widest block -mt-0.5">ABU GOURA RESTAURANT</span>
            </div>
          </div>
          <div className="text-center md:text-left">
            <p className="text-xs text-gray-400 font-medium">
              © {new Date().getFullYear()} {isAr ? 'مطعم أبو قورة. جميع الحقوق محفوظة لأسرة قورة.' : 'Abu Qura Restaurant. All rights reserved.'}
            </p>
            <span className="text-[9px] text-brand-gold-dark font-mono block mt-1">
              {isAr ? 'نظام دمج وتنسيق سحابي متكامل' : 'Full-Stack Server Synced Engine'}
            </span>
          </div>
        </div>
      </footer>

      {/* Overlays / Drawers */}
      
      {/* 1. Auth Login / Register Dialog */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={handleAuthSuccess}
        lang={lang}
      />

      {/* Customization modal for meals toppings and rating */}
      <MealCustomizationModal
        isOpen={customizingMenuItem !== null}
        onClose={() => setCustomizingMenuItem(null)}
        menuItem={customizingMenuItem}
        lang={lang}
        onConfirm={(customCartItem) => {
          setCartItems((prev) => {
            const existingIndex = prev.findIndex((i) => {
              if (i.menuItem.id !== customCartItem.menuItem.id) return false;
              const iExtras = i.extras || [];
              const cExtras = customCartItem.extras || [];
              if (iExtras.length !== cExtras.length) return false;
              return iExtras.every((ie) => cExtras.some((ce) => ce.nameAr === ie.nameAr));
            });

            if (existingIndex !== -1) {
              const updated = [...prev];
              updated[existingIndex] = {
                ...updated[existingIndex],
                quantity: updated[existingIndex].quantity + customCartItem.quantity
              };
              return updated;
            }
            return [...prev, customCartItem];
          });

          addToast(
            isAr ? '🛒 تمت إضافة وجبتك المخصصة للسلة' : '🛒 Added customized meal to cart',
            isAr 
              ? `تم إضافة (${customCartItem.menuItem.nameAr}) مع الإضافات لسلتك` 
              : `Added (${customCartItem.menuItem.nameEn}) with extras to your cart`,
            'info'
          );
        }}
      />

      {/* 2. Side Sliding Cart Drawer */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={() => setCartItems([])}
        user={user}
        onOpenAuth={() => {
          setCartOpen(false);
          setAuthOpen(true);
        }}
        lang={lang}
        onOrderSuccess={() => {
          addToast(
            isAr ? '🎉 تم إرسال طلبك للمطبخ!' : '🎉 Order sent to Kitchen!',
            isAr 
              ? 'تلقى الطهاة طلبك وسيبدأ العمل عليه فوراً. تتبع حالة طلبك مباشرة!' 
              : 'Our chefs received your order and will start cooking immediately. Track it live!',
            'success'
          );
          setCurrentTab('orders');
        }}
      />

      {/* Modern Fixed Bottom Navigation Bar for Mobile */}
      <BottomNavigation
        user={user}
        lang={lang}
        setLang={setLang}
        cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onOpenCart={() => setCartOpen(true)}
        onOpenAuth={() => setAuthOpen(true)}
        onLogout={handleLogout}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />

      {/* Floating Stack of Real-time Toaster Alerts */}
      <div 
        className="fixed bottom-6 z-50 flex flex-col gap-3 max-w-sm w-full px-4"
        style={{
          right: isAr ? 'auto' : '1.5rem',
          left: isAr ? '1.5rem' : 'auto',
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="p-4.5 rounded-2xl bg-white border border-brand-primary/10 shadow-2xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300"
          >
            <div className="p-1 rounded-lg bg-brand-primary/5 shrink-0 text-brand-gold">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1 text-right" dir={isAr ? 'rtl' : 'ltr'}>
              <h4 className="text-xs font-black text-brand-primary">
                {t.title}
              </h4>
              <p className="text-[10px] text-gray-500 leading-relaxed font-semibold mt-0.5">
                {t.message}
              </p>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
