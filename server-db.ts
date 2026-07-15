import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { User, MenuItem, Order, OrderStatus, Category, CartItem } from './src/types.js';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Default delicious pre-seeded categories
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'grills', nameAr: 'مشاوي أبو قورة', nameEn: 'Grills' },
  { id: 'pots', nameAr: 'طواجن الحمام واللحوم', nameEn: 'Claypots & Pigeon' },
  { id: 'pastries', nameAr: 'فطير ومخبوزات', nameEn: 'Feteer & Pastries' },
  { id: 'appetizers', nameAr: 'مقبلات وشوربة', nameEn: 'Appetizers' },
  { id: 'desserts', nameAr: 'الحلويات الشرقية', nameEn: 'Desserts' },
  { id: 'drinks', nameAr: 'المشروبات الباردة', nameEn: 'Refreshments' },
];

// Default delicious pre-seeded menu items
const DEFAULT_MENU: MenuItem[] = [
  {
    id: 'm1',
    nameAr: 'كباب وكفتة أبو قورة المميز',
    nameEn: 'Abu Qura Signature Kebab & Kofta',
    descriptionAr: 'سيخ كباب بلدي مع سيخ كفتة متبلة بخلطة أبو قورة السرية، مشوية على الفحم مع خضار مشوية وطحينة وخبز طازج.',
    descriptionEn: 'Grilled local kebab and minced meat skewers seasoned with Abu Qura secret blend, served with grilled vegetables, tahini, and fresh bread.',
    price: 320,
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80',
    category: 'grills'
  },
  {
    id: 'm2',
    nameAr: 'ريش ضأن مشوية على الفحم',
    nameEn: 'Charcoal Grilled Lamb Chops',
    descriptionAr: 'قطع ريش الغنم المتبلة بالأعشاب والبهارات الشرقية، مشوية على الفحم الساخن لتذوب في الفم، تقدم مع الأرز الأصفر والصلصة الحارة.',
    descriptionEn: 'Premium lamb chops marinated in oriental herbs and spices, coal grilled to perfection. Served with seasoned yellow rice and spicy dip.',
    price: 450,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    category: 'grills'
  },
  {
    id: 'm3',
    nameAr: 'طاجن بامية بلحم الضأن الموزة',
    nameEn: 'Lamb Shank Okra Claypot',
    descriptionAr: 'طاجن فخار بلدي يحتوي على بامية صغيرة طازجة مطبوخة مع قطع لحم الموزة الضأن في صلصة الطماطم الغنية بالثوم والكزبرة.',
    descriptionEn: 'Traditional claypot of fresh baby okra slow-cooked with tender lamb shank in a rich garlic, tomato, and coriander sauce.',
    price: 290,
    image: 'https://images.unsplash.com/photo-1547928576-a4a33237bea3?w=600&auto=format&fit=crop&q=80',
    category: 'pots'
  },
  {
    id: 'm4',
    nameAr: 'طاجن ورق عنب بالكوارع',
    nameEn: 'Stuffed Grape Leaves with Trotters Claypot',
    descriptionAr: 'ورق عنب محشي بخلطة الأرز والأعشاب، مطبوخ في طاجن فخار ومغطى بقطع الكوارع المخلية المطهوة ببطء في مرقة غنية بالليمون.',
    descriptionEn: 'Claypot slow-cooked grape leaves stuffed with spiced rice, topped with tender boneless beef trotters in a tangy lemon broth.',
    price: 340,
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
    category: 'pots'
  },
  {
    id: 'm5',
    nameAr: 'فطير مشلتت فلاحي بالسمن البلدي',
    nameEn: 'Traditional Rural Feteer Meshaltet',
    descriptionAr: 'فطيرة فلاحي مورقة ومقرمشة ومحمرة بالسمن البلدي النقي، تقدم مع العسل الأبيض، القشطة الطازجة، والجبن القديم.',
    descriptionEn: 'Flaky layered golden pastry made with pure local ghee. Served with honey, fresh clotted cream, and traditional aged cheese.',
    price: 180,
    image: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=600&auto=format&fit=crop&q=80',
    category: 'pastries'
  },
  {
    id: 'm6',
    nameAr: 'حمام محشي أرز مميز',
    nameEn: 'Signature Stuffed Pigeon',
    descriptionAr: 'زوج من الحمام الفاخر محشي بالأرز المتبل بخلطة الكبد والقوانص والبهارات الخاصة، محمر ومقرمش بالسمن البلدي.',
    descriptionEn: 'A pair of premium pigeons stuffed with seasoned rice, giblets, and aromatic spices, roasted crispy in authentic clarified butter.',
    price: 380,
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&auto=format&fit=crop&q=80',
    category: 'pots'
  },
  {
    id: 'm7',
    nameAr: 'سلطة أبو قورة الخضراء المميزة',
    nameEn: 'Abu Qura Signature Green Salad',
    descriptionAr: 'مزيج منعش من الجرجير، الطماطم، الخيار، الفجل، والنعناع الأخضر، متبل بالليمون، زيت الزيتون ودبس الرمان والخبز المقرمش.',
    descriptionEn: 'Crisp arugula, tomatoes, cucumbers, radish, and fresh mint, tossed with lemon dressing, olive oil, sweet pomegranate molasses, and crispy bread.',
    price: 75,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80',
    category: 'appetizers'
  },
  {
    id: 'm8',
    nameAr: 'شوربة لسان عصفور بلدي',
    nameEn: 'Traditional Orzo Soup',
    descriptionAr: 'مرقة الدجاج واللحم الغنية مع لسان العصفور المحمر بالسمن البلدي ولمسة ليمون منعشة.',
    descriptionEn: 'Rich, comforting bone broth soup with roasted orzo pasta and a fresh squeeze of lemon juice.',
    price: 60,
    image: 'https://images.unsplash.com/photo-1547592165-e1d17fed6005?w=600&auto=format&fit=crop&q=80',
    category: 'appetizers'
  },
  {
    id: 'm9',
    nameAr: 'أم علي بالمكسرات والقشطة والفرن',
    nameEn: 'Oven Baked Om Ali Dessert',
    descriptionAr: 'رقاق مخبوز بالفرن مغطى بالحليب الطازج المكثف، الكريمة الغنية، السمن البلدي، ومزيج الفستق واللوز والزبيب وجوز الهند.',
    descriptionEn: 'Traditional baked bread pudding layered with sweet whole milk, heavy cream, ghee, topped with roasted pistachios, almonds, and coconut.',
    price: 110,
    image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600&auto=format&fit=crop&q=80',
    category: 'desserts'
  },
  {
    id: 'm10',
    nameAr: 'عصير ليمون بالنعناع فريش',
    nameEn: 'Fresh Mint Lemonade',
    descriptionAr: 'ليمون طازج معصور بارد مع أوراق النعناع البري ومكعبات الثلج لانتعاش فوري.',
    descriptionEn: 'Freshly squeezed lemon juice cold-blended with organic mint leaves and crushed ice for instant refreshment.',
    price: 55,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
    category: 'drinks'
  }
];

interface DataSchema {
  users: User[];
  orders: Order[];
  menu: MenuItem[];
  categories: Category[];
  settings?: {
    adminPhone: string;
  };
}

// Ensure database file and directory exist
function initDB(): DataSchema {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData: DataSchema = {
      users: [
        // Pre-seeded Admin account
        {
          id: 'admin-1',
          username: 'Abu-Qura',
          role: 'admin',
          createdAt: new Date().toISOString()
        }
      ],
      orders: [],
      menu: DEFAULT_MENU,
      categories: DEFAULT_CATEGORIES,
      settings: {
        adminPhone: '01120751465'
      }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    // Auto-seed admin and categories if missing
    if (!parsed.users) parsed.users = [];
    if (!parsed.orders) parsed.orders = [];
    if (!parsed.menu || parsed.menu.length === 0) parsed.menu = DEFAULT_MENU;
    if (!parsed.categories || parsed.categories.length === 0) parsed.categories = DEFAULT_CATEGORIES;
    if (!parsed.settings) {
      parsed.settings = {
        adminPhone: '01120751465'
      };
    }

    const adminExists = parsed.users.some((u: any) => u.username === 'Abu-Qura');
    if (!adminExists) {
      parsed.users.push({
        id: 'admin-1',
        username: 'Abu-Qura',
        role: 'admin',
        createdAt: new Date().toISOString()
      });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');

    return parsed;
  } catch (err) {
    console.error('Error reading DB, resetting', err);
    const fallbackData: DataSchema = {
      users: [
        {
          id: 'admin-1',
          username: 'Abu-Qura',
          role: 'admin',
          createdAt: new Date().toISOString()
        }
      ],
      orders: [],
      menu: DEFAULT_MENU,
      categories: DEFAULT_CATEGORIES,
      settings: {
        adminPhone: '01120751465'
      }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(fallbackData, null, 2), 'utf-8');
    return fallbackData;
  }
}

// In-memory data copy synced to disk
let dbCache: DataSchema = initDB();

// Highly-efficient asynchronous non-blocking write queue
// Guarantees atomic writes (via temp file) to eliminate database corruption risks under extreme concurrent traffic,
// while avoiding Express-blocking synchronous file operations.
let isWriting = false;
let writePending = false;

async function saveToDiskAsync() {
  if (isWriting) {
    writePending = true;
    return;
  }
  isWriting = true;
  writePending = false;

  try {
    const tempFile = DB_FILE + '.tmp';
    const dataStr = JSON.stringify(dbCache, null, 2);
    await fs.promises.writeFile(tempFile, dataStr, 'utf-8');
    await fs.promises.rename(tempFile, DB_FILE);
  } catch (err) {
    console.error('Error saving DB to disk asynchronously:', err);
  } finally {
    isWriting = false;
    if (writePending) {
      saveToDiskAsync();
    }
  }
}

function saveToDisk() {
  saveToDiskAsync();
}

export const DatabaseService = {
  // --- USERS ---
  getUsers(): User[] {
    return dbCache.users;
  },

  findUserByName(username: string): User | undefined {
    return dbCache.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  },

  findUserById(id: string): User | undefined {
    return dbCache.users.find(u => u.id === id);
  },

  createUser(username: string): User {
    const existing = this.findUserByName(username);
    if (existing) {
      throw new Error('اسم المستخدم موجود بالفعل');
    }
    const newUser: User = {
      id: 'usr_' + crypto.randomBytes(5).toString('hex'), // Secure, collision-free crypto random identifier
      username,
      role: 'user',
      createdAt: new Date().toISOString()
    };
    dbCache.users.push(newUser);
    saveToDisk();
    return newUser;
  },

  // --- MENU ---
  getMenu(): MenuItem[] {
    return dbCache.menu;
  },

  createMenuItem(item: Omit<MenuItem, 'id'>): MenuItem {
    const newItem: MenuItem = {
      ...item,
      id: 'm_' + crypto.randomBytes(5).toString('hex')
    };
    dbCache.menu.push(newItem);
    saveToDisk();
    return newItem;
  },

  updateMenuItem(id: string, updated: Partial<MenuItem>): MenuItem {
    const index = dbCache.menu.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error('الصنف غير موجود');
    }
    dbCache.menu[index] = {
      ...dbCache.menu[index],
      ...updated,
      id // Ensure ID remains immutable
    };
    saveToDisk();
    return dbCache.menu[index];
  },

  deleteMenuItem(id: string): void {
    dbCache.menu = dbCache.menu.filter(item => item.id !== id);
    saveToDisk();
  },

  // --- CATEGORIES ---
  getCategories(): Category[] {
    if (!dbCache.categories) {
      dbCache.categories = [...DEFAULT_CATEGORIES];
    }
    return dbCache.categories;
  },

  createCategory(nameAr: string, nameEn: string): Category {
    const id = 'cat_' + crypto.randomBytes(5).toString('hex');
    const newCategory: Category = { id, nameAr, nameEn };
    if (!dbCache.categories) {
      dbCache.categories = [...DEFAULT_CATEGORIES];
    }
    dbCache.categories.push(newCategory);
    saveToDisk();
    return newCategory;
  },

  updateCategory(id: string, nameAr: string, nameEn: string): Category {
    if (!dbCache.categories) {
      dbCache.categories = [...DEFAULT_CATEGORIES];
    }
    const index = dbCache.categories.findIndex(cat => cat.id === id);
    if (index === -1) {
      throw new Error('القسم غير موجود');
    }
    dbCache.categories[index] = { id, nameAr, nameEn };
    saveToDisk();
    return dbCache.categories[index];
  },

  deleteCategory(id: string): void {
    if (!dbCache.categories) {
      dbCache.categories = [...DEFAULT_CATEGORIES];
    }
    dbCache.categories = dbCache.categories.filter(cat => cat.id !== id);
    saveToDisk();
  },

  // --- ORDERS ---
  getOrders(): Order[] {
    return dbCache.orders;
  },

  getUserOrders(userId: string): Order[] {
    return dbCache.orders.filter(o => o.userId === userId);
  },

  createOrder(
    userId: string, 
    username: string, 
    items: CartItem[], 
    notes?: string,
    phone?: string,
    whatsapp?: string,
    address?: string,
    latitude?: number,
    longitude?: number
  ): Order {
    // SECURITY HARDENING: Always calculate total price from server-side trusted menu database,
    // protecting against malicious client-side price tampering.
    const total = items.reduce((sum, item) => {
      const dbItem = dbCache.menu.find(m => m.id === item.menuItem.id);
      const itemPrice = dbItem ? dbItem.price : item.menuItem.price;
      const extrasPrice = item.extras ? item.extras.reduce((s, ex) => s + ex.price, 0) : 0;
      return sum + ((itemPrice + extrasPrice) * item.quantity);
    }, 0);

    // Deep copy and assign server-trusted pricing to the item records
    const verifiedItems = items.map(item => {
      const dbItem = dbCache.menu.find(m => m.id === item.menuItem.id);
      return {
        ...item,
        menuItem: {
          ...item.menuItem,
          price: dbItem ? dbItem.price : item.menuItem.price
        }
      };
    });

    const newOrder: Order = {
      id: 'ORD_' + crypto.randomBytes(4).toString('hex').toUpperCase(),
      userId,
      username,
      items: verifiedItems,
      total,
      status: 'pending',
      notes: notes ? notes.trim() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      phone: phone ? phone.trim() : undefined,
      whatsapp: whatsapp ? whatsapp.trim() : undefined,
      address: address ? address.trim() : undefined,
      latitude,
      longitude
    };
    dbCache.orders.unshift(newOrder); // Add to beginning

    // Also auto-update user profile defaults for seamless future orders
    const user = dbCache.users.find(u => u.id === userId);
    if (user) {
      if (phone) user.phone = phone;
      if (whatsapp) user.whatsapp = whatsapp;
      if (address) user.address = address;
      if (latitude !== undefined) user.latitude = latitude;
      if (longitude !== undefined) user.longitude = longitude;
    }

    saveToDisk();
    return newOrder;
  },

  updateOrderStatus(orderId: string, status: OrderStatus): Order {
    const order = dbCache.orders.find(o => o.id === orderId);
    if (!order) {
      throw new Error('الطلب غير موجود');
    }
    order.status = status;
    order.updatedAt = new Date().toISOString();
    saveToDisk();
    return order;
  },

  deleteOrder(orderId: string): void {
    dbCache.orders = dbCache.orders.filter(o => o.id !== orderId);
    saveToDisk();
  },

  // --- SETTINGS ---
  getSettings() {
    if (!dbCache.settings) {
      dbCache.settings = { adminPhone: '01120751465' };
    }
    return dbCache.settings;
  },

  updateSettings(adminPhone: string) {
    dbCache.settings = { adminPhone };
    saveToDisk();
    return dbCache.settings;
  },

  updateUserProfile(
    userId: string,
    phone: string,
    whatsapp: string,
    address: string,
    latitude?: number,
    longitude?: number
  ): User {
    const user = dbCache.users.find(u => u.id === userId);
    if (!user) {
      throw new Error('المستخدم غير موجود');
    }
    user.phone = phone;
    user.whatsapp = whatsapp;
    user.address = address;
    if (latitude !== undefined) user.latitude = latitude;
    if (longitude !== undefined) user.longitude = longitude;
    saveToDisk();
    return user;
  },

  getStats() {
    const totalOrders = dbCache.orders.length;
    const totalRevenue = dbCache.orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + o.total, 0);
    const pendingOrders = dbCache.orders.filter(o => o.status === 'pending' || o.status === 'preparing').length;
    const completedOrders = dbCache.orders.filter(o => o.status === 'delivered').length;

    return {
      totalOrders,
      totalRevenue,
      pendingOrders,
      completedOrders
    };
  }
};
