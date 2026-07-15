import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  Timer, 
  CheckCircle, 
  Search, 
  Bell, 
  Volume2, 
  X, 
  TrendingUp, 
  Clock, 
  Ban, 
  CookingPot, 
  Truck, 
  ChefHat,
  Loader2,
  Plus,
  Trash2,
  Edit3,
  Layers,
  Utensils,
  Globe,
  Star
} from 'lucide-react';
import { Order, OrderStatus, DashboardStats, MenuItem, Category } from '../types.js';
import { playStatusUpdateChime } from '../utils/audio.js';

interface AdminDashboardProps {
  orders: Order[];
  lang: 'ar' | 'en';
  menu: MenuItem[];
  categories: Category[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  onRefresh: () => void;
  onRefreshMenu: () => void;
  onRefreshCategories: () => void;
  loading: boolean;
}

export default function AdminDashboard({
  orders,
  lang,
  menu,
  categories,
  onUpdateStatus,
  onRefresh,
  onRefreshMenu,
  onRefreshCategories,
  loading,
}: AdminDashboardProps) {
  const isAr = lang === 'ar';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Active sub-tab inside the Admin Dashboard
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'categories'>('orders');

  // Dish/Meal CRUD states
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [itemForm, setItemForm] = useState({
    nameAr: '',
    nameEn: '',
    descriptionAr: '',
    descriptionEn: '',
    price: 0,
    image: '',
    category: '',
    available: true
  });

  // Category CRUD states
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    nameAr: '',
    nameEn: ''
  });

  // Food Photo Search States
  const [photoSearchQuery, setPhotoSearchQuery] = useState('');
  const [photoSearchOpen, setPhotoSearchOpen] = useState(false);

  const FOOD_IMAGE_PRESETS = [
    { term: 'kebab', nameAr: 'مشاوي وكباب وكفتة', url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80' },
    { term: 'ribs', nameAr: 'ريش لحم مشوية', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80' },
    { term: 'shish', nameAr: 'شيش طاووق ودجاج مشوي', url: 'https://images.unsplash.com/photo-1598515214211-89d3e73ae83b?w=600&auto=format&fit=crop&q=80' },
    { term: 'lamb', nameAr: 'لحم مطهو طاجن', url: 'https://images.unsplash.com/photo-1547928576-a4a33237bea3?w=600&auto=format&fit=crop&q=80' },
    { term: 'rice', nameAr: 'أرز متبل كبسة', url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&fit=crop&q=80' },
    { term: 'stew', nameAr: 'خضار وطاجن بامية', url: 'https://images.unsplash.com/photo-1547592165-e1d17fed6005?w=600&auto=format&fit=crop&q=80' },
    { term: 'pastry', nameAr: 'فطير مشلتت ومخبوزات', url: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=600&auto=format&fit=crop&q=80' },
    { term: 'soup', nameAr: 'شوربة لسان عصفور مرقة', url: 'https://images.unsplash.com/photo-1547592165-e1d17fed6005?w=600&auto=format&fit=crop&q=80' },
    { term: 'dessert', nameAr: 'أم علي وحلويات شرقية', url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600&auto=format&fit=crop&q=80' },
    { term: 'drink', nameAr: 'عصير ليمون ونعناع فريش', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80' },
    { term: 'grape leaves', nameAr: 'ورق عنب ومحشي فخار', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80' },
    { term: 'pigeon', nameAr: 'حمام مشوي محشي', url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&auto=format&fit=crop&q=80' },
    { term: 'salad', nameAr: 'سلطة خضراء فتوش طازج', url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80' },
    { term: 'meatball', nameAr: 'كفتة داوود باشا صوص طماطم', url: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600&auto=format&fit=crop&q=80' },
    { term: 'tea', nameAr: 'شاي نعناع فخاري مصري', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80' },
    { term: 'baklava', nameAr: 'بقلاوة وبسبوسة فستق', url: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=600&auto=format&fit=crop&q=80' },
  ];

  // Custom states for deletion/warning instead of window.confirm & window.alert
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    type: 'order' | 'menuItem' | 'category';
    targetId: string;
    titleAr: string;
    titleEn: string;
    messageAr: string;
    messageEn: string;
  }>({
    isOpen: false,
    type: 'menuItem',
    targetId: '',
    titleAr: '',
    titleEn: '',
    messageAr: '',
    messageEn: ''
  });

  const [adminNotification, setAdminNotification] = useState<{
    show: boolean;
    type: 'error' | 'success';
    messageAr: string;
    messageEn: string;
  }>({
    show: false,
    type: 'success',
    messageAr: '',
    messageEn: ''
  });

  const handleDeleteOrder = (orderId: string) => {
    setConfirmDelete({
      isOpen: true,
      type: 'order',
      targetId: orderId,
      titleAr: 'حذف طلب العميل',
      titleEn: 'Delete Customer Order',
      messageAr: 'هل أنت متأكد من حذف هذا الطلب نهائياً من السجلات؟ لا يمكن التراجع عن هذه الخطوة.',
      messageEn: 'Are you sure you want to delete this order permanently from the records? This action cannot be undone.'
    });
  };

  const handleDeleteMenuItem = (itemId: string) => {
    setConfirmDelete({
      isOpen: true,
      type: 'menuItem',
      targetId: itemId,
      titleAr: 'حذف طبق من المنيو',
      titleEn: 'Delete Dish from Menu',
      messageAr: 'هل أنت متأكد من حذف هذا الطبق نهائياً من المنيو؟ سيتم إزالته من قائمة طعام الزوار.',
      messageEn: 'Are you sure you want to delete this dish permanently from the menu? It will be removed from the visitors menu.'
    });
  };

  const executeDelete = async () => {
    const { type, targetId } = confirmDelete;
    try {
      if (type === 'order') {
        const res = await fetch(`/api/orders/${targetId}`, { method: 'DELETE' });
        if (res.ok) {
          onRefresh();
          setAdminNotification({
            show: true,
            type: 'success',
            messageAr: '✅ تم حذف الطلب من السجلات بنجاح',
            messageEn: '✅ Order deleted from records successfully'
          });
        }
      } else if (type === 'menuItem') {
        const res = await fetch(`/api/menu/${targetId}`, { method: 'DELETE' });
        if (res.ok) {
          onRefreshMenu();
          setAdminNotification({
            show: true,
            type: 'success',
            messageAr: '✅ تم حذف هذا الطبق من المنيو بنجاح',
            messageEn: '✅ Dish deleted from the menu successfully'
          });
        }
      } else if (type === 'category') {
        const res = await fetch(`/api/categories/${targetId}`, { method: 'DELETE' });
        if (res.ok) {
          onRefreshCategories();
          setAdminNotification({
            show: true,
            type: 'success',
            messageAr: '✅ تم حذف قسم المنيو بنجاح',
            messageEn: '✅ Menu category deleted successfully'
          });
        }
      }
    } catch (err) {
      console.error(err);
      setAdminNotification({
        show: true,
        type: 'error',
        messageAr: '❌ عذراً، حدث خطأ أثناء محاولة الحذف',
        messageEn: '❌ Sorry, an error occurred during deletion'
      });
    } finally {
      setConfirmDelete(prev => ({ ...prev, isOpen: false }));
      // Auto close notification after 5 seconds
      setTimeout(() => {
        setAdminNotification(prev => ({ ...prev, show: false }));
      }, 5000);
    }
  };

  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.nameAr || !itemForm.category || itemForm.price <= 0) {
      setAdminNotification({
        show: true,
        type: 'error',
        messageAr: 'الرجاء إدخال اسم الطبق والتصنيف والسعر',
        messageEn: 'Please input the name, category and price'
      });
      return;
    }

    try {
      const isEdit = !!editingItem;
      const url = isEdit ? `/api/menu/${editingItem.id}` : '/api/menu';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...itemForm,
          price: Number(itemForm.price)
        })
      });

      if (res.ok) {
        onRefreshMenu();
        setIsAddingItem(false);
        setEditingItem(null);
        setItemForm({
          nameAr: '',
          nameEn: '',
          descriptionAr: '',
          descriptionEn: '',
          price: 0,
          image: '',
          category: '',
          available: true
        });
        setAdminNotification({
          show: true,
          type: 'success',
          messageAr: isEdit ? '✅ تم تحديث بيانات الطبق بنجاح' : '✅ تم نشر وإضافة الطبق للمنيو بنجاح',
          messageEn: isEdit ? '✅ Dish updated successfully' : '✅ Dish published to the menu successfully'
        });
        setTimeout(() => setAdminNotification(prev => ({ ...prev, show: false })), 5000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      const newStatus = item.available === false ? true : false;
      const res = await fetch(`/api/menu/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameAr: item.nameAr,
          nameEn: item.nameEn,
          descriptionAr: item.descriptionAr,
          descriptionEn: item.descriptionEn,
          price: item.price,
          image: item.image,
          category: item.category,
          available: newStatus
        })
      });
      if (res.ok) {
        onRefreshMenu();
        setAdminNotification({
          show: true,
          type: 'success',
          messageAr: newStatus ? '✅ تم تمكين وتوفير هذا الطبق للعملاء' : '⚠️ تم حظر الطلب وجعل الطبق غير متوفر حالياً',
          messageEn: newStatus ? '✅ Dish enabled and marked available' : '⚠️ Dish marked unavailable'
        });
        setTimeout(() => setAdminNotification(prev => ({ ...prev, show: false })), 5000);
      }
    } catch (err) {
      console.error(err);
      setAdminNotification({
        show: true,
        type: 'error',
        messageAr: '❌ عذراً، حدث خطأ أثناء تغيير حالة التوفر',
        messageEn: '❌ Sorry, an error occurred while toggling availability'
      });
      setTimeout(() => setAdminNotification(prev => ({ ...prev, show: false })), 5000);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    setConfirmDelete({
      isOpen: true,
      type: 'category',
      targetId: catId,
      titleAr: 'حذف قسم من المنيو',
      titleEn: 'Delete Menu Category',
      messageAr: 'هل أنت متأكد من حذف هذا القسم؟ قد تفقد تصنيفات الأطباق المربوطة به.',
      messageEn: 'Are you sure you want to delete this category? Dishes linked to it might lose their grouping.'
    });
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.nameAr || !categoryForm.nameEn) {
      setAdminNotification({
        show: true,
        type: 'error',
        messageAr: 'الرجاء إدخال اسم القسم بالعربي والإنجليزي',
        messageEn: 'Please fill in both Arabic and English names'
      });
      return;
    }

    try {
      const isEdit = !!editingCategory;
      const url = isEdit ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm)
      });

      if (res.ok) {
        onRefreshCategories();
        setIsAddingCategory(false);
        setEditingCategory(null);
        setCategoryForm({ nameAr: '', nameEn: '' });
        setAdminNotification({
          show: true,
          type: 'success',
          messageAr: isEdit ? '✅ تم تحديث اسم القسم بنجاح' : '✅ تم إنشاء قسم طعام جديد بنجاح',
          messageEn: isEdit ? '✅ Category renamed successfully' : '✅ New food category created successfully'
        });
        setTimeout(() => setAdminNotification(prev => ({ ...prev, show: false })), 5000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Restaurant dynamic settings
  const [adminPhone, setAdminPhone] = useState('01120751465');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data && data.adminPhone) {
          setAdminPhone(data.adminPhone);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPhone.trim()) return;
    setSavingSettings(true);
    setSettingsSuccess(false);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPhone: adminPhone.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  // Calculate stats
  const totalOrders = orders.length;
  const totalRevenue = orders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const preparingOrders = orders.filter((o) => o.status === 'preparing').length;

  const filteredOrders = orders.filter((o) => {
    const matchesSearch = 
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.username.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await onUpdateStatus(orderId, status);
      // Play ascending success sound
      playStatusUpdateChime(status !== 'rejected');
    } catch (err) {
      console.error(err);
      // Play error tone
      playStatusUpdateChime(false);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'preparing':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200 animate-pulse';
      case 'delivered':
        return 'bg-green-50 text-brand-primary border-green-200';
      case 'rejected':
        return 'bg-rose-50 text-rose-600 border-rose-200';
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return isAr ? 'في الانتظار' : 'Pending';
      case 'preparing': return isAr ? 'جاري التحضير' : 'Preparing';
      case 'delivered': return isAr ? 'تم التسليم' : 'Delivered';
      case 'rejected': return isAr ? 'تم الرفض' : 'Rejected';
    }
  };

  return (
    <div className="w-full text-[#2D241E]" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Dashboard Summary Header - Elegant & Minimalist */}
      <div className="flex flex-wrap gap-6 justify-between items-center mb-10 bg-[#FAF6F0] border border-[#E5E2D9] p-8 sm:p-10 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#3D4021]/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="absolute inset-3 rounded-2xl border border-[#E5E2D9]/40 pointer-events-none"></div>

        <div className="relative flex items-center gap-4.5">
          <div className="w-14 h-14 rounded-2xl bg-[#3D4021] text-[#FDFCF0] flex items-center justify-center border border-[#4D5129]/20 shadow-xs">
            <ChefHat className="w-6.5 h-6.5 text-brand-gold" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#3D4021] font-serif leading-tight">
              {isAr ? 'إدارة مطبخ أبو قورة الفلاحي' : 'Abu Qura Administrative Portal'}
            </h2>
            <p className="text-xs text-gray-500 mt-1 font-semibold">
              {isAr ? 'لوحة تحكم احترافية لإدارة الطلبات والمنيو والأقسام والصور والمبيعات' : 'Professional control panel to manage orders, menu items, categories, and photos'}
            </p>
          </div>
        </div>

        <div className="relative flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#3D4021]/5 border border-[#3D4021]/15">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#3D4021]">
            {isAr ? 'مزامنة سحابية نشطة' : 'Active Server Sync'}
          </span>
        </div>
      </div>

      {/* Dynamic Navigation Sub-Tabs */}
      <div className="flex border-b border-[#E5E2D9] mb-8 gap-1 sm:gap-6 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-4 px-2 text-xs sm:text-sm font-extrabold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'orders'
              ? 'border-[#3D4021] text-[#3D4021]'
              : 'border-transparent text-gray-400 hover:text-[#3D4021]'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>{isAr ? '📋 الطلبات والعمليات' : '📋 Orders Queue'}</span>
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`pb-4 px-2 text-xs sm:text-sm font-extrabold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'menu'
              ? 'border-[#3D4021] text-[#3D4021]'
              : 'border-transparent text-gray-400 hover:text-[#3D4021]'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>{isAr ? '🍽️ الأطباق والأصناف' : '🍽️ Menu Items'}</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-4 px-2 text-xs sm:text-sm font-extrabold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'categories'
              ? 'border-[#3D4021] text-[#3D4021]'
              : 'border-transparent text-gray-400 hover:text-[#3D4021]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{isAr ? '🏷️ أقسام المنيو' : '🏷️ Food Categories'}</span>
        </button>
      </div>

      {/* SUBTAB 1: ORDERS & OPERATIONS */}
      {activeTab === 'orders' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Settings Block - Receiver Phone Settings */}
          <div className="bg-white border border-[#E5E2D9] p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-xs">
            <h3 className="text-lg font-black text-[#3D4021] font-serif mb-2 flex items-center gap-2">
              <span className="text-emerald-500 text-xl">💬</span>
              <span>
                {isAr 
                  ? 'رقم الواتساب لاستقبال الفواتير وموقع العميل' 
                  : 'WhatsApp Receiver Settings'}
              </span>
            </h3>
            
            <p className="text-xs text-gray-500 font-semibold leading-relaxed mb-6 max-w-4xl">
              {isAr 
                ? 'عندما يطلب العميل، يقوم النظام بتوجيهه تلقائياً إلى رقم الواتساب المسجل هنا لإتمام الطلب مع إرسال الفاتورة التفصيلية ورابط خرائط جوجل لموقعه الدقيق ونقاط GPS.' 
                : 'Configure the active business WhatsApp number. Customers will be directed to send their receipt, contact number and GPS coordinates here.'}
            </p>

            <form onSubmit={handleSaveSettings} className="flex flex-wrap sm:flex-nowrap gap-4 max-w-xl">
              <div className="flex-grow space-y-1">
                <span className="text-[10px] font-black text-gray-400 block uppercase tracking-wider">
                  {isAr ? 'رقم هاتف الواتساب النشط' : 'Active WhatsApp Phone Number'}
                </span>
                <input
                  type="tel"
                  required
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  placeholder="e.g. 01120751465"
                  className="w-full px-4 py-3.5 rounded-2xl border border-[#E5E2D9] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#3D4021]/5 focus:border-[#3D4021] bg-[#FAF9F6] text-[#2D241E]"
                />
              </div>
              <div className="self-end shrink-0 w-full sm:w-auto">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className={`w-full px-6 py-3.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    settingsSuccess
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 shadow-md'
                      : 'bg-[#F1EFE7]/80 hover:bg-[#F1EFE7] text-[#3D4021] border border-[#E5E2D9] shadow-xs'
                  }`}
                >
                  {savingSettings ? (
                    <Loader2 className="w-4 h-4 animate-spin text-brand-gold" />
                  ) : settingsSuccess ? (
                    <span>{isAr ? '🟢 تم حفظ الرقم!' : '🟢 Saved!'}</span>
                  ) : (
                    <span>💾 {isAr ? 'حفظ الرقم الجديد' : 'Save New Number'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Stats Cards Grid - Clean Sand & Ivory Panels */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {/* Revenue */}
            <div className="bg-white p-5 rounded-3xl border border-[#E5E2D9] shadow-xs flex items-center gap-4.5">
              <div className="w-12 h-12 rounded-2xl bg-brand-clay/5 text-brand-clay flex items-center justify-center shrink-0 border border-brand-clay/10">
                <DollarSign className="w-5.5 h-5.5" />
              </div>
              <div>
                <span className="text-[10px] sm:text-xs font-black text-gray-400 block uppercase tracking-wider">
                  {isAr ? 'أرباح المبيعات' : 'Total Revenue'}
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-lg sm:text-2xl font-black text-[#3D4021] font-sans">{totalRevenue}</span>
                  <span className="text-[10px] font-bold text-gray-400">{isAr ? 'ج.م' : 'EGP'}</span>
                </div>
              </div>
            </div>

            {/* Total orders */}
            <div className="bg-white p-5 rounded-3xl border border-[#E5E2D9] shadow-xs flex items-center gap-4.5">
              <div className="w-12 h-12 rounded-2xl bg-[#3D4021]/5 text-[#3D4021] flex items-center justify-center shrink-0 border border-[#3D4021]/10">
                <ShoppingBag className="w-5.5 h-5.5" />
              </div>
              <div>
                <span className="text-[10px] sm:text-xs font-black text-gray-400 block uppercase tracking-wider">
                  {isAr ? 'إجمالي الطلبات' : 'Total Orders'}
                </span>
                <span className="text-lg sm:text-2xl font-black text-[#3D4021] font-sans mt-0.5 block">{totalOrders}</span>
              </div>
            </div>

            {/* Pending */}
            <div className="bg-white p-5 rounded-3xl border border-[#E5E2D9] shadow-xs flex items-center gap-4.5">
              <div className="w-12 h-12 rounded-2xl bg-brand-gold/5 text-brand-gold flex items-center justify-center shrink-0 border border-brand-gold/15">
                <Timer className="w-5.5 h-5.5" />
              </div>
              <div>
                <span className="text-[10px] sm:text-xs font-black text-gray-400 block uppercase tracking-wider">
                  {isAr ? 'في الانتظار' : 'Pending Review'}
                </span>
                <span className="text-lg sm:text-2xl font-black text-brand-gold font-sans mt-0.5 block">{pendingOrders}</span>
              </div>
            </div>

            {/* Preparing */}
            <div className="bg-white p-5 rounded-3xl border border-[#E5E2D9] shadow-xs flex items-center gap-4.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <CookingPot className="w-5.5 h-5.5" />
              </div>
              <div>
                <span className="text-[10px] sm:text-xs font-black text-gray-400 block uppercase tracking-wider">
                  {isAr ? 'قيد التحضير' : 'Under Cooking'}
                </span>
                <span className="text-lg sm:text-2xl font-black text-emerald-600 font-sans mt-0.5 block">{preparingOrders}</span>
              </div>
            </div>
          </div>

          {/* Control Filters Bar */}
          <div className="bg-white p-5 rounded-3xl border border-[#E5E2D9] shadow-xs flex flex-col sm:flex-row gap-5 justify-between items-center">
            {/* Search */}
            <div className="relative w-full sm:max-w-xs">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isAr ? 'ابحث باسم العميل أو رقم الطلب...' : 'Search customer name or ID...'}
                className="w-full px-4.5 py-3 rounded-2xl border border-[#E5E2D9] text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-[#3D4021]/5 focus:border-[#3D4021]"
              />
              <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${isAr ? 'left-4' : 'right-4'}`} />
            </div>

            {/* Status Tab selections */}
            <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
              {[
                { id: 'all', label: isAr ? 'الكل' : 'All' },
                { id: 'pending', label: isAr ? 'قيد الانتظار' : 'Pending' },
                { id: 'preparing', label: isAr ? 'يتم تحضيرها' : 'Preparing' },
                { id: 'delivered', label: isAr ? 'تم تسليمها' : 'Delivered' },
                { id: 'rejected', label: isAr ? 'تم رفضها' : 'Rejected' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-[#3D4021] text-brand-gold shadow-sm border border-[#3D4021]'
                      : 'bg-[#F1EFE7]/60 border border-transparent text-[#2D241E]/80 hover:bg-[#F1EFE7]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-8">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <div 
                  key={order.id}
                  className="bg-white rounded-3xl border border-[#E5E2D9] shadow-xs overflow-hidden transition-all duration-300 hover:shadow-sm"
                >
                  {/* Header Info Banner */}
                  <div className="px-6 py-5 bg-[#FAF9F6] border-b border-[#E5E2D9] flex flex-wrap gap-4 justify-between items-center">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-[#3D4021] text-brand-gold flex items-center justify-center font-bold font-mono text-base uppercase border border-[#4D5129]/20">
                        {order.username.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#3D4021] font-serif">
                          {order.username}
                        </h4>
                        <span className="text-[10px] text-gray-400 font-bold block mt-0.5">
                          {isAr ? 'طلب رقم' : 'Order ID'}: <span className="font-mono text-gray-500">{order.id}</span> • {new Date(order.createdAt).toLocaleString(isAr ? 'ar-EG' : 'en-US', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Status select dropdown */}
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F1EFE7] text-[#3D4021] border border-[#E5E2D9] focus:outline-none"
                      >
                        <option value="pending">{isAr ? 'في الانتظار' : 'Pending'}</option>
                        <option value="preparing">{isAr ? 'جاري التحضير' : 'Preparing'}</option>
                        <option value="delivered">{isAr ? 'تم التسليم' : 'Delivered'}</option>
                        <option value="rejected">{isAr ? 'تم الرفض' : 'Rejected'}</option>
                      </select>

                      {/* Status pill indicator */}
                      <span className={`px-4 py-2 rounded-xl text-xs font-black border ${getStatusStyle(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>

                      {/* Delete order button */}
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100/50 transition-all cursor-pointer"
                        title={isAr ? 'حذف الطلب نهائياً' : 'Delete Order'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Items & Notes Content */}
                  <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 text-[#2D241E]">
                    
                    {/* 1. Ordered Foods List */}
                    <div className="space-y-4">
                      <h5 className="text-[10px] font-black uppercase tracking-wider text-gray-400 border-b border-[#E5E2D9] pb-2.5">
                        {isAr ? 'الأصناف المطلوبة' : 'Ordered Culinary Dishes'}
                      </h5>
                      <div className="space-y-3.5">
                        {order.items.map((item, idx) => {
                          const itemPrice = item.menuItem.price;
                          const extrasSum = item.extras ? item.extras.reduce((s, ex) => s + ex.price, 0) : 0;
                          const lineTotal = (itemPrice + extrasSum) * item.quantity;
                          
                          return (
                            <div key={item.menuItem.id + '_' + idx} className="py-2.5 border-b border-[#E5E2D9]/40 last:border-0 flex justify-between items-start text-xs font-semibold">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-brand-gold font-mono bg-[#3D4021] px-2.5 py-1 rounded-lg border border-[#3D4021]">
                                    {item.quantity}x
                                  </span>
                                  <span className="font-bold text-[#3D4021] font-serif text-sm">
                                    {isAr ? item.menuItem.nameAr : item.menuItem.nameEn}
                                  </span>
                                </div>
                                
                                {/* Extras list for admin */}
                                {item.extras && item.extras.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mr-10">
                                    {item.extras.map((ex) => (
                                      <span key={ex.nameAr} className="text-[9px] bg-brand-primary/5 text-brand-primary border border-brand-primary/10 px-1.5 py-0.5 rounded-lg font-bold">
                                        + {isAr ? ex.nameAr : ex.nameEn}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Star assessment for admin */}
                                {item.rating && (
                                  <div className="flex items-center gap-0.5 mr-10 mt-1">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <Star key={s} className={`w-3.5 h-3.5 ${s <= item.rating! ? 'text-brand-gold fill-brand-gold' : 'text-gray-200'}`} />
                                    ))}
                                  </div>
                                )}
                              </div>
                              <span className="font-sans text-gray-500 shrink-0">
                                {lineTotal} {isAr ? 'ج.م' : 'EGP'}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {order.notes && (
                        <div className="mt-5 p-4 bg-[#FAF9F6] rounded-2xl border border-[#E5E2D9] text-xs text-[#2D241E]/80 leading-relaxed font-semibold">
                          <span className="font-black text-[#3D4021] text-[10px] block mb-1 uppercase tracking-wide">
                            {isAr ? 'ملاحظات وتوجيهات العميل' : 'Customer Cooking Notes'}:
                          </span>
                          "{order.notes}"
                        </div>
                      )}
                    </div>

                    {/* 2. Customer Delivery & Contact Details */}
                    <div className="space-y-4 border-t lg:border-t-0 lg:border-r lg:border-l border-[#E5E2D9] pt-5 lg:pt-0 lg:px-8">
                      <h5 className="text-[10px] font-black uppercase tracking-wider text-gray-400 border-b border-[#E5E2D9] pb-2.5">
                        {isAr ? 'بيانات العميل والتوصيل' : 'Customer & Delivery Info'}
                      </h5>
                      
                      <div className="space-y-3">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 block">
                            {isAr ? 'الاسم الأساسي للعميل:' : 'Client Name:'}
                          </span>
                          <span className="text-sm font-extrabold text-[#3D4021]">
                            {order.username}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-gray-400 block mb-1">
                            {isAr ? 'رقم الهاتف للتواصل:' : 'Contact Phone Number:'}
                          </span>
                          {order.phone ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold font-mono bg-[#F1EFE7] px-2.5 py-1.5 rounded-xl border border-[#E5E2D9] text-[#2D241E]">
                                {order.phone}
                              </span>
                              <a
                                href={`https://wa.me/${order.whatsapp?.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold transition-all flex items-center gap-1 shadow-xs"
                              >
                                <span>💬</span>
                                <span>{isAr ? 'سند واتساب' : 'WhatsApp'}</span>
                              </a>
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-gray-400 italic">
                              {isAr ? 'غير مسجل' : 'Not Provided'}
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-gray-400 block">
                            {isAr ? 'عنوان التوصيل المحدد:' : 'Specified Delivery Address:'}
                          </span>
                          <p className="text-xs font-bold text-[#2D241E] leading-relaxed mt-1 bg-[#FAF9F6] p-3 rounded-2xl border border-[#E5E2D9]/70">
                            {order.address || (isAr ? 'لم يحدد عنوان توصيل' : 'No address specified')}
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-gray-400 block mb-1">
                            {isAr ? 'الموقع الجغرافي للعميل (GPS):' : 'GPS Coordinates:'}
                          </span>
                          {order.latitude && order.longitude ? (
                            <div className="space-y-2">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-50 border border-emerald-200 text-emerald-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                                {isAr ? 'إحداثيات الـ GPS ملتقطة بدقة' : 'GPS Coordinates Captured'}
                              </span>
                              
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs"
                              >
                                <span>📍</span>
                                <span>{isAr ? 'عرض بخرائط جوجل' : 'View on Google Maps'}</span>
                              </a>
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-gray-50 border border-gray-200 text-gray-400">
                              {isAr ? 'تتبع الـ GPS غير مفعل للطلب' : 'GPS coordinates not captured'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 3. Pricing & Actions */}
                    <div className="border-t lg:border-t-0 lg:border-r border-[#E5E2D9] pt-5 lg:pt-0 lg:pl-8 flex flex-col justify-between space-y-5">
                      <div>
                        <h5 className="text-[10px] font-black uppercase tracking-wider text-gray-400 pb-2">
                          {isAr ? 'الفاتورة الكلية' : 'Total Invoice'}
                        </h5>
                        <div className="flex items-baseline gap-1 mt-1.5">
                          <span className="text-3xl font-black text-brand-clay font-sans">{order.total}</span>
                          <span className="text-xs font-extrabold text-gray-400">{isAr ? 'ج.م' : 'EGP'}</span>
                        </div>
                      </div>

                      <div className="space-y-2.5 pt-5 border-t border-[#E5E2D9]/60">
                        {order.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleStatusChange(order.id, 'preparing')}
                              disabled={updatingId !== null}
                              className="flex-1 py-3 px-3 rounded-xl bg-[#3D4021] hover:bg-[#4D5129] text-brand-gold font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 border border-[#3D4021]"
                            >
                              <CookingPot className="w-4 h-4 text-brand-gold" />
                              <span>{isAr ? 'قبول وبدء الطهي' : 'Accept & Cook'}</span>
                            </button>
                            <button
                              onClick={() => handleStatusChange(order.id, 'rejected')}
                              disabled={updatingId !== null}
                              className="py-3 px-3 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 font-extrabold text-xs transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                              title={isAr ? 'رفض الطلب' : 'Reject'}
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {order.status === 'preparing' && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'delivered')}
                            disabled={updatingId !== null}
                            className="w-full py-3.5 px-3 rounded-xl bg-brand-gold hover:bg-brand-gold-dark text-[#FDFCF0] font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-brand-gold disabled:opacity-50"
                          >
                            <Truck className="w-4 h-4" />
                            <span>{isAr ? 'تم التوصيل للعميل' : 'Deliver Order'}</span>
                          </button>
                        )}

                        {order.status === 'delivered' && (
                          <div className="flex items-center gap-1.5 py-2.5 text-emerald-700 text-xs font-extrabold bg-emerald-50 justify-center rounded-xl border border-emerald-100">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            <span>{isAr ? 'تم تسليم الطلب بنجاح' : 'Order Completed Successfully'}</span>
                          </div>
                        )}

                        {order.status === 'rejected' && (
                          <div className="flex items-center gap-1.5 py-2.5 text-rose-700 text-xs font-extrabold bg-rose-50 justify-center rounded-xl border border-rose-100">
                            <Ban className="w-4 h-4 text-rose-500" />
                            <span>{isAr ? 'الطلب مرفوض' : 'Order Rejected'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-24 bg-white rounded-3xl border border-[#E5E2D9] text-center flex flex-col items-center justify-center p-8">
                <span className="text-5xl">📝</span>
                <h3 className="text-lg font-bold text-[#3D4021] font-serif mt-4">
                  {isAr ? 'لا يوجد طلبات مطابقة للفلتر المحدد' : 'No matching orders'}
                </h3>
                <p className="text-xs text-gray-400 mt-2.5 max-w-xs leading-relaxed font-semibold">
                  {isAr ? 'عندما يطلب العملاء مأكولات ستظهر هنا فوراً وبشكل لحظي.' : 'When customers place orders, they will appear here in real-time.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: MENU ITEMS & DISH MANAGEMENT */}
      {activeTab === 'menu' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Top Bar controls */}
          <div className="flex flex-col sm:flex-row gap-5 justify-between items-center bg-white p-5 rounded-3xl border border-[#E5E2D9] shadow-xs">
            <div className="relative w-full sm:max-w-xs">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isAr ? 'ابحث في أصناف الطعام...' : 'Search meals...'}
                className="w-full px-4.5 py-3 rounded-2xl border border-[#E5E2D9] text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-[#3D4021]/5 focus:border-[#3D4021]"
              />
              <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${isAr ? 'left-4' : 'right-4'}`} />
            </div>

            <button
              onClick={() => {
                setEditingItem(null);
                setItemForm({
                  nameAr: '',
                  nameEn: '',
                  descriptionAr: '',
                  descriptionEn: '',
                  price: 0,
                  image: '',
                  category: categories[0]?.id || '',
                  available: true
                });
                setIsAddingItem(true);
              }}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#3D4021] text-brand-gold font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-[#4D5129] shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-brand-gold" />
              <span>{isAr ? 'إضافة طبق جديد للمنيو' : 'Add New Dish'}</span>
            </button>
          </div>

          {/* Form drawer overlay for Adding/Editing Item */}
          {isAddingItem && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E2D9] shadow-md relative">
              <button
                onClick={() => setIsAddingItem(false)}
                className="absolute top-6 left-6 p-2 rounded-full hover:bg-gray-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>

              <h3 className="text-xl font-bold font-serif text-[#3D4021] mb-6 border-b border-[#E5E2D9] pb-4">
                {editingItem 
                  ? (isAr ? `تعديل طبق: ${editingItem.nameAr}` : `Edit Dish: ${editingItem.nameEn}`)
                  : (isAr ? 'إضافة طبق طعام جديد' : 'Create New Food Entry')}
              </h3>

              <form onSubmit={handleSaveMenuItem} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Arabic name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wider block">
                      {isAr ? 'اسم الطبق بالعربية *' : 'Dish Name (Arabic) *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={itemForm.nameAr}
                      onChange={(e) => setItemForm({ ...itemForm, nameAr: e.target.value })}
                      placeholder="مثال: كباب مشوي على الفحم"
                      className="w-full px-4 py-3.5 rounded-2xl border border-[#E5E2D9] text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-[#3D4021]/5 focus:border-[#3D4021] bg-[#FAF9F6] text-[#2D241E]"
                    />
                  </div>

                  {/* English name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wider block">
                      {isAr ? 'اسم الطبق بالإنجليزية' : 'Dish Name (English)'}
                    </label>
                    <input
                      type="text"
                      value={itemForm.nameEn}
                      onChange={(e) => setItemForm({ ...itemForm, nameEn: e.target.value })}
                      placeholder="e.g. Charcoal Grilled Kebab"
                      className="w-full px-4 py-3.5 rounded-2xl border border-[#E5E2D9] text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-[#3D4021]/5 focus:border-[#3D4021] bg-[#FAF9F6] text-[#2D241E]"
                    />
                  </div>

                  {/* Arabic Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wider block">
                      {isAr ? 'الوصف بالعربية' : 'Description (Arabic)'}
                    </label>
                    <textarea
                      value={itemForm.descriptionAr}
                      onChange={(e) => setItemForm({ ...itemForm, descriptionAr: e.target.value })}
                      placeholder="مثال: لحم غنم طازج متبل بخلطة أبو قورة السرية ومطبوخ على نار هادئة"
                      className="w-full px-4 py-3 rounded-2xl border border-[#E5E2D9] text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-[#3D4021]/5 focus:border-[#3D4021] bg-[#FAF9F6] text-[#2D241E] h-20"
                    />
                  </div>

                  {/* English Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wider block">
                      {isAr ? 'الوصف بالإنجليزية' : 'Description (English)'}
                    </label>
                    <textarea
                      value={itemForm.descriptionEn}
                      onChange={(e) => setItemForm({ ...itemForm, descriptionEn: e.target.value })}
                      placeholder="e.g. Fresh lamb ribs seasoned with our special local spices"
                      className="w-full px-4 py-3 rounded-2xl border border-[#E5E2D9] text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-[#3D4021]/5 focus:border-[#3D4021] bg-[#FAF9F6] text-[#2D241E] h-20"
                    />
                  </div>

                  {/* Price */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wider block">
                      {isAr ? 'سعر الطبق (ج.م) *' : 'Price (EGP) *'}
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={itemForm.price || ''}
                      onChange={(e) => setItemForm({ ...itemForm, price: Number(e.target.value) })}
                      placeholder="e.g. 240"
                      className="w-full px-4 py-3.5 rounded-2xl border border-[#E5E2D9] text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-[#3D4021]/5 focus:border-[#3D4021] bg-[#FAF9F6] text-[#2D241E]"
                    />
                  </div>

                  {/* Category selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wider block">
                      {isAr ? 'القسم / جروب الطعام *' : 'Menu Category *'}
                    </label>
                    <select
                      required
                      value={itemForm.category}
                      onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                      className="w-full px-4 py-3.5 rounded-2xl border border-[#E5E2D9] text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-[#3D4021]/5 focus:border-[#3D4021] bg-[#FAF9F6] text-[#2D241E]"
                    >
                      <option value="">{isAr ? '-- اختر قسم الطعام --' : '-- Choose Category --'}</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {isAr ? c.nameAr : c.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Availability Toggle */}
                  <div className="space-y-1.5 md:col-span-2 bg-[#FAF9F6] p-4.5 rounded-2xl border border-[#E5E2D9]/60 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-xs font-black text-[#3D4021] block">
                        {isAr ? 'حالة التوفر في المنيو' : 'In-Stock Availability'}
                      </span>
                      <p className="text-[10px] text-gray-400 font-semibold leading-relaxed max-w-md">
                        {isAr 
                          ? 'عند إلغاء تفعيل هذا الخيار، سيظهر الصنف للزوار بوضع "غير متوفر" مع تعطيل زر الإضافة والطلب.' 
                          : 'When disabled, the dish will be displayed as "Sold Out" with ordering and cart features disabled.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      dir="ltr"
                      onClick={() => setItemForm(prev => ({ ...prev, available: !prev.available }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        itemForm.available ? 'bg-[#3D4021]' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                          itemForm.available ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Image URL with Preset Selector */}
                  <div className="space-y-2 md:col-span-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-wider block">
                        {isAr ? 'رابط صورة الطبق *' : 'Dish Image URL *'}
                      </label>
                      <button
                        type="button"
                        onClick={() => setPhotoSearchOpen(!photoSearchOpen)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#3D4021]/5 border border-[#3D4021]/15 text-[#3D4021] text-[10px] font-black uppercase tracking-wider hover:bg-[#3D4021] hover:text-white transition-all cursor-pointer flex items-center gap-1"
                      >
                        🔍 {photoSearchOpen ? (isAr ? 'إغلاق المعرض' : 'Close Gallery') : (isAr ? 'مستكشف صور الأكل Unsplash' : 'Explore Food Photos')}
                      </button>
                    </div>

                    <input
                      type="url"
                      required
                      value={itemForm.image}
                      onChange={(e) => setItemForm({ ...itemForm, image: e.target.value })}
                      placeholder="e.g. https://images.unsplash.com/photo-..."
                      className="w-full px-4 py-3.5 rounded-2xl border border-[#E5E2D9] text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-[#3D4021]/5 focus:border-[#3D4021] bg-[#FAF9F6] text-[#2D241E]"
                    />

                    {/* Pre-curated high-res Unsplash food photo finder */}
                    {photoSearchOpen && (
                      <div className="bg-[#FAF9F6] border border-[#E5E2D9] p-5 rounded-3xl space-y-4 animate-fade-in mt-2">
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={photoSearchQuery}
                            onChange={(e) => setPhotoSearchQuery(e.target.value)}
                            placeholder={isAr ? 'ابحث في معرض الأكلات المصري والعالمي...' : 'Search Egyptian or global dishes...'}
                            className="flex-grow px-4 py-2 text-xs rounded-xl border border-[#E5E2D9] bg-white focus:outline-none focus:ring-2 focus:ring-[#3D4021]/20"
                          />
                          {photoSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setPhotoSearchQuery('')}
                              className="text-xs text-rose-600 font-bold"
                            >
                              {isAr ? 'مسح' : 'Clear'}
                            </button>
                          )}
                        </div>

                        {/* Presets Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 max-h-60 overflow-y-auto pr-1">
                          {FOOD_IMAGE_PRESETS.filter(p => 
                            !photoSearchQuery || 
                            p.term.toLowerCase().includes(photoSearchQuery.toLowerCase()) || 
                            p.nameAr.includes(photoSearchQuery)
                          ).map((preset, index) => (
                            <div 
                              key={index}
                              onClick={() => {
                                setItemForm({ ...itemForm, image: preset.url });
                                setPhotoSearchOpen(false);
                              }}
                              className="group relative rounded-xl overflow-hidden aspect-video border border-[#E5E2D9]/60 cursor-pointer hover:border-[#3D4021] hover:shadow-xs transition-all bg-white"
                            >
                              <img 
                                src={preset.url} 
                                alt={preset.term} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" 
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2">
                                <span className="text-[10px] font-bold text-white leading-tight">
                                  {isAr ? preset.nameAr : preset.term}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dynamic Image Preview */}
                    {itemForm.image && (
                      <div className="mt-4 rounded-3xl overflow-hidden aspect-video max-w-sm border border-[#E5E2D9]/70 relative bg-[#FAF9F6]">
                        <img 
                          src={itemForm.image} 
                          alt="Culinary preview" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-3 right-3 bg-[#3D4021] text-brand-gold px-3 py-1 rounded-xl text-[10px] font-black border border-[#4D5129]/30">
                          {isAr ? 'معاينة مباشرة' : 'Live Preview'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex gap-4 border-t border-[#E5E2D9] pt-6 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingItem(false);
                      setEditingItem(null);
                    }}
                    className="px-6 py-3 rounded-2xl border border-[#E5E2D9] hover:bg-[#F1EFE7]/40 text-xs font-black transition-all cursor-pointer"
                  >
                    {isAr ? 'إلغاء وتراجع' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 rounded-2xl bg-[#3D4021] text-brand-gold border border-[#3D4021] hover:bg-[#4D5129] text-xs font-black transition-all cursor-pointer"
                  >
                    {editingItem ? (isAr ? 'حفظ وتحديث التغييرات' : 'Save Updates') : (isAr ? 'إضافة الطبق الآن' : 'Publish Dish')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {menu.filter(item => 
              !search || 
              item.nameAr.toLowerCase().includes(search.toLowerCase()) || 
              item.nameEn.toLowerCase().includes(search.toLowerCase())
            ).map((item) => {
              const itemCat = categories.find(c => c.id === item.category);
              return (
                <div 
                  key={item.id}
                  className={`bg-white rounded-3xl border shadow-xs overflow-hidden flex flex-col justify-between transition-all duration-300 ${
                    item.available === false ? 'border-rose-200 opacity-90' : 'border-[#E5E2D9]'
                  }`}
                >
                  <div className="relative aspect-video bg-[#FAF9F6] border-b border-[#E5E2D9]/40">
                    <img 
                      src={item.image} 
                      alt={item.nameAr} 
                      className={`w-full h-full object-cover transition-all ${item.available === false ? 'grayscale-[30%] contrast-90' : ''}`} 
                      referrerPolicy="no-referrer"
                    />
                    {/* Quick Toggle Availability Pill */}
                    <button
                      onClick={() => handleToggleAvailability(item)}
                      className={`absolute top-4 left-4 px-2.5 py-1.5 rounded-xl text-[10px] font-black border transition-all cursor-pointer shadow-md flex items-center gap-1 select-none ${
                        item.available !== false
                          ? 'bg-[#3D4021] text-brand-gold border-[#3D4021]/30 hover:scale-102'
                          : 'bg-rose-600 text-white border-rose-500 hover:scale-102'
                      }`}
                      title={isAr ? 'انقر لتغيير حالة التوفر سريعاً' : 'Click to toggle availability'}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${item.available !== false ? 'bg-emerald-400 animate-pulse' : 'bg-rose-200'}`}></span>
                      <span>
                        {isAr 
                          ? (item.available !== false ? 'متوفر' : 'غير متوفر') 
                          : (item.available !== false ? 'Available' : 'Unavailable')
                        }
                      </span>
                    </button>

                    <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/95 backdrop-blur-xs rounded-xl text-[10px] font-black text-[#3D4021] border border-[#E5E2D9]/60">
                      {isAr ? (itemCat?.nameAr || item.category) : (itemCat?.nameEn || item.category)}
                    </div>
                  </div>

                  <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                    <div>
                      <h4 className="text-base font-black text-[#3D4021] font-serif flex items-center gap-2">
                        <span>{isAr ? item.nameAr : item.nameEn}</span>
                        {item.available === false && (
                          <span className="px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-100 text-[9px] font-bold">
                            {isAr ? 'غير متوفر' : 'Sold Out'}
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1.5 font-semibold line-clamp-2 leading-relaxed">
                        {isAr ? item.descriptionAr : item.descriptionEn}
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-[#E5E2D9]/40">
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-lg font-black text-brand-clay font-sans">{item.price}</span>
                        <span className="text-[10px] font-bold text-gray-400">{isAr ? 'ج.م' : 'EGP'}</span>
                      </div>

                      <div className="flex gap-2">
                        {/* Edit Button */}
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setItemForm({
                              nameAr: item.nameAr,
                              nameEn: item.nameEn,
                              descriptionAr: item.descriptionAr,
                              descriptionEn: item.descriptionEn,
                              price: item.price,
                              image: item.image,
                              category: item.category,
                              available: item.available !== false
                            });
                            setIsAddingItem(true);
                            window.scrollTo({ top: 400, behavior: 'smooth' });
                          }}
                          className="p-2 rounded-xl bg-[#FAF9F6] text-[#3D4021] border border-[#E5E2D9] hover:bg-[#F1EFE7] transition-all cursor-pointer"
                          title={isAr ? 'تعديل هذا الطبق' : 'Edit Dish'}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteMenuItem(item.id)}
                          className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100/50 transition-all cursor-pointer"
                          title={isAr ? 'حذف هذا الطبق' : 'Delete Dish'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 3: CATEGORY & SECTION MANAGEMENT */}
      {activeTab === 'categories' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Top Bar / Form Section */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E2D9] shadow-xs">
            <h3 className="text-lg font-black font-serif text-[#3D4021] mb-6 flex items-center gap-2">
              <span className="text-brand-gold text-2xl">🏷️</span>
              <span>
                {editingCategory 
                  ? (isAr ? `تعديل قسم: ${editingCategory.nameAr}` : `Edit Section: ${editingCategory.nameEn}`)
                  : (isAr ? 'إضافة قسم وجروب طعام جديد للمنيو' : 'Create New Menu Category')}
              </span>
            </h3>

            <form onSubmit={handleSaveCategory} className="space-y-6 max-w-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase block tracking-wider">
                    {isAr ? 'اسم القسم بالعربية *' : 'Category Name (Arabic) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryForm.nameAr}
                    onChange={(e) => setCategoryForm({ ...categoryForm, nameAr: e.target.value })}
                    placeholder="مثال: طواجن الفرن الفخارية"
                    className="w-full px-4 py-3 rounded-2xl border border-[#E5E2D9] text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-[#3D4021]/5 focus:border-[#3D4021] bg-[#FAF9F6] text-[#2D241E]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase block tracking-wider">
                    {isAr ? 'اسم القسم بالإنجليزية *' : 'Category Name (English) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryForm.nameEn}
                    onChange={(e) => setCategoryForm({ ...categoryForm, nameEn: e.target.value })}
                    placeholder="e.g. Claypots"
                    className="w-full px-4 py-3 rounded-2xl border border-[#E5E2D9] text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-[#3D4021]/5 focus:border-[#3D4021] bg-[#FAF9F6] text-[#2D241E]"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                {editingCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryForm({ nameAr: '', nameEn: '' });
                    }}
                    className="px-5 py-3 rounded-2xl border border-[#E5E2D9] hover:bg-[#F1EFE7]/40 text-xs font-black cursor-pointer"
                  >
                    {isAr ? 'تراجع' : 'Cancel'}
                  </button>
                )}
                <button
                  type="submit"
                  className="px-7 py-3 rounded-2xl bg-[#3D4021] text-brand-gold hover:bg-[#4D5129] text-xs font-black cursor-pointer border border-[#3D4021]"
                >
                  {editingCategory ? (isAr ? 'تحديث الاسم' : 'Update Section') : (isAr ? 'إنشاء قسم الطعام' : 'Add Category')}
                </button>
              </div>
            </form>
          </div>

          {/* Categories Grid Table */}
          <div className="bg-white rounded-3xl border border-[#E5E2D9] shadow-xs overflow-hidden">
            <div className="px-6 py-5 bg-[#FAF9F6] border-b border-[#E5E2D9]">
              <h4 className="text-sm font-bold text-[#3D4021] font-serif">
                {isAr ? 'أقسام المنيو الحالية ومفاتيحها' : 'Active Food Sections & IDs'}
              </h4>
            </div>

            <div className="divide-y divide-[#E5E2D9]/40">
              {categories.map((cat) => (
                <div 
                  key={cat.id}
                  className="px-6 py-4.5 flex flex-wrap justify-between items-center gap-4 hover:bg-[#FAF9F6]/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 rounded-xl bg-[#3D4021]/5 text-[#3D4021] border border-[#3D4021]/10 flex items-center justify-center font-bold text-sm">
                      🏷️
                    </span>
                    <div>
                      <span className="text-sm font-extrabold text-[#3D4021] block font-serif">
                        {cat.nameAr} <span className="text-gray-400 font-sans mx-1.5">•</span> {cat.nameEn}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono block mt-0.5">
                        ID: {cat.id}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    {/* Edit button */}
                    <button
                      onClick={() => {
                        setEditingCategory(cat);
                        setCategoryForm({
                          nameAr: cat.nameAr,
                          nameEn: cat.nameEn
                        });
                        window.scrollTo({ top: 400, behavior: 'smooth' });
                      }}
                      className="p-2 rounded-xl bg-[#FAF9F6] text-[#3D4021] border border-[#E5E2D9] hover:bg-[#F1EFE7] transition-all cursor-pointer"
                      title={isAr ? 'تعديل اسم القسم' : 'Rename Category'}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100/50 transition-all cursor-pointer"
                      title={isAr ? 'حذف هذا القسم' : 'Delete Category'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Custom Deletion Confirmation Modal */}
      {confirmDelete.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div 
            className="relative w-full max-w-md overflow-hidden bg-white rounded-3xl border border-brand-primary/10 shadow-2xl p-6 space-y-6"
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="text-lg font-black text-[#3D4021] font-serif">
                  {isAr ? confirmDelete.titleAr : confirmDelete.titleEn}
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                  {isAr ? confirmDelete.messageAr : confirmDelete.messageEn}
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(prev => ({ ...prev, isOpen: false }))}
                className="px-5 py-2.5 rounded-2xl border border-[#E5E2D9] hover:bg-[#F1EFE7]/40 text-xs font-black cursor-pointer text-[#2D241E]"
              >
                {isAr ? 'تراجع وإلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black cursor-pointer shadow-xs"
              >
                {isAr ? 'حذف نهائي' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Dashboard Action Feedback Notification */}
      {adminNotification.show && (
        <div 
          className="fixed bottom-6 left-6 z-50 max-w-sm w-full p-4.5 rounded-2xl bg-white border shadow-2xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300"
          style={{
            borderColor: adminNotification.type === 'error' ? '#FECDD3' : '#A7F3D0',
          }}
          dir={isAr ? 'rtl' : 'ltr'}
        >
          <div className={`p-1.5 rounded-lg shrink-0 ${
            adminNotification.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
          }`}>
            {adminNotification.type === 'error' ? <Ban className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          </div>
          <div className="flex-grow text-right">
            <h4 className={`text-xs font-black ${
              adminNotification.type === 'error' ? 'text-rose-800' : 'text-emerald-800'
            }`}>
              {isAr ? 'تنبيه الإدارة' : 'Admin Alert'}
            </h4>
            <p className="text-[10px] text-gray-500 leading-relaxed font-semibold mt-0.5">
              {isAr ? adminNotification.messageAr : adminNotification.messageEn}
            </p>
          </div>
          <button
            onClick={() => setAdminNotification(prev => ({ ...prev, show: false }))}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
}
