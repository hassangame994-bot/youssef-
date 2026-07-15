import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';
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
    descriptionEn: 'A pair of pigeons stuffed with seasoned rice, giblets, and aromatic spices, roasted crispy in authentic clarified butter.',
    price: 380,
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&auto=format&fit=crop&q=80',
    category: 'pots'
  },
  {
    id: 'm7',
    nameAr: 'سلطة أبو قورة الخضراء المميزه',
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
    descriptionAr: 'ليمون طازج معسور بارد مع أوراق النعناع البري ومكعبات الثلج لانتعاش فوري.',
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

// Ensure database file and directory exist for fallback
function initDB(): DataSchema {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData: DataSchema = {
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
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
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

// ==========================================
// MONGODB SCHEMAS & CONFIG
// ==========================================
const MONGODB_URI = process.env.MONGODB_URI;
let isMongoConnected = false;

// 1. User Schema
const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  role: { type: String, required: true },
  createdAt: { type: String, required: true },
  phone: String,
  whatsapp: String,
  address: String,
  latitude: Number,
  longitude: Number
});
const UserModel = (mongoose.models.User || mongoose.model('User', UserSchema)) as any;

// 2. Category Schema
const CategorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  nameAr: { type: String, required: true },
  nameEn: { type: String, required: true }
});
const CategoryModel = (mongoose.models.Category || mongoose.model('Category', CategorySchema)) as any;

// 3. MenuItem Schema
const MenuItemSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  nameAr: { type: String, required: true },
  nameEn: { type: String, required: true },
  descriptionAr: { type: String, default: '' },
  descriptionEn: { type: String, default: '' },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  available: { type: Boolean, default: true }
});
const MenuItemModel = (mongoose.models.MenuItem || mongoose.model('MenuItem', MenuItemSchema)) as any;

// 4. Order Schema
const OrderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  username: { type: String, required: true },
  items: { type: Array, required: true },
  total: { type: Number, required: true },
  status: { type: String, required: true },
  notes: String,
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true },
  phone: String,
  whatsapp: String,
  address: String,
  latitude: Number,
  longitude: Number
});
const OrderModel = (mongoose.models.Order || mongoose.model('Order', OrderSchema)) as any;

// 5. Settings Schema
const SettingsSchema = new mongoose.Schema({
  adminPhone: { type: String, default: '01120751465' }
});
const SettingsModel = (mongoose.models.Settings || mongoose.model('Settings', SettingsSchema)) as any;

// Seeding helper to guarantee default menu, categories, settings and admin on cloud dbs
async function seedMongoData() {
  try {
    const adminCount = await UserModel.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      await UserModel.create({
        id: 'admin-1',
        username: 'Abu-Qura',
        role: 'admin',
        createdAt: new Date().toISOString()
      });
      console.log('Successfully pre-seeded primary Admin account inside MongoDB Cluster.');
    }

    const catCount = await CategoryModel.countDocuments();
    if (catCount === 0) {
      await CategoryModel.insertMany(DEFAULT_CATEGORIES);
      console.log('Successfully pre-seeded Egyptian culinary categories inside MongoDB.');
    }

    const menuCount = await MenuItemModel.countDocuments();
    if (menuCount === 0) {
      await MenuItemModel.insertMany(DEFAULT_MENU.map(m => ({
        ...m,
        available: m.available !== false
      })));
      console.log('Successfully pre-seeded authentic rural menu items inside MongoDB.');
    }

    const settingsCount = await SettingsModel.countDocuments();
    if (settingsCount === 0) {
      await SettingsModel.create({ adminPhone: '01120751465' });
      console.log('Successfully pre-seeded default general settings inside MongoDB.');
    }
  } catch (err) {
    console.error('Error pre-seeding MongoDB cluster default data:', err);
  }
}

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(async () => {
      console.log('✅ Connected successfully to persistent cloud MongoDB Cluster.');
      isMongoConnected = true;
      await seedMongoData();
    })
    .catch((err) => {
      console.error('❌ Failed to connect to MongoDB, falling back to local file-system JSON database:', err);
      isMongoConnected = false;
    });
} else {
  console.log('⚠️ MONGODB_URI not found. Running under high-performance local file-system storage (data/db.json).');
}

// ==========================================
// UNIFIED DYNAMIC DATABASE CONTROLLER
// ==========================================
export const DatabaseService = {
  // --- USERS ---
  async getUsers(): Promise<User[]> {
    if (isMongoConnected) {
      const docs = await UserModel.find({}).lean();
      return docs as unknown as User[];
    }
    return dbCache.users;
  },

  async findUserByName(username: string): Promise<User | undefined> {
    if (isMongoConnected) {
      const doc = await UserModel.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } }).lean();
      return doc ? (doc as unknown as User) : undefined;
    }
    return dbCache.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  },

  async findUserById(id: string): Promise<User | undefined> {
    if (isMongoConnected) {
      const doc = await UserModel.findOne({ id }).lean();
      return doc ? (doc as unknown as User) : undefined;
    }
    return dbCache.users.find(u => u.id === id);
  },

  async createUser(username: string): Promise<User> {
    const existing = await this.findUserByName(username);
    if (existing) {
      throw new Error('اسم المستخدم موجود بالفعل');
    }
    const newUser: User = {
      id: 'usr_' + crypto.randomBytes(5).toString('hex'),
      username,
      role: 'user',
      createdAt: new Date().toISOString()
    };

    if (isMongoConnected) {
      await UserModel.create(newUser);
    } else {
      dbCache.users.push(newUser);
      saveToDisk();
    }
    return newUser;
  },

  // --- MENU ---
  async getMenu(): Promise<MenuItem[]> {
    if (isMongoConnected) {
      const docs = await MenuItemModel.find({}).lean();
      return docs as unknown as MenuItem[];
    }
    return dbCache.menu;
  },

  async createMenuItem(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    const newItem: MenuItem = {
      ...item,
      id: 'm_' + crypto.randomBytes(5).toString('hex')
    };

    if (isMongoConnected) {
      await MenuItemModel.create(newItem);
    } else {
      dbCache.menu.push(newItem);
      saveToDisk();
    }
    return newItem;
  },

  async updateMenuItem(id: string, updated: Partial<MenuItem>): Promise<MenuItem> {
    if (isMongoConnected) {
      const doc = await MenuItemModel.findOneAndUpdate(
        { id },
        { $set: updated },
        { new: true }
      ).lean();
      if (!doc) {
        throw new Error('الصنف غير موجود');
      }
      return doc as unknown as MenuItem;
    } else {
      const index = dbCache.menu.findIndex(item => item.id === id);
      if (index === -1) {
        throw new Error('الصنف غير موجود');
      }
      dbCache.menu[index] = {
        ...dbCache.menu[index],
        ...updated,
        id // Immutable ID
      };
      saveToDisk();
      return dbCache.menu[index];
    }
  },

  async deleteMenuItem(id: string): Promise<void> {
    if (isMongoConnected) {
      await MenuItemModel.deleteOne({ id });
    } else {
      dbCache.menu = dbCache.menu.filter(item => item.id !== id);
      saveToDisk();
    }
  },

  // --- CATEGORIES ---
  async getCategories(): Promise<Category[]> {
    if (isMongoConnected) {
      const docs = await CategoryModel.find({}).lean();
      return docs as unknown as Category[];
    }
    if (!dbCache.categories) {
      dbCache.categories = [...DEFAULT_CATEGORIES];
    }
    return dbCache.categories;
  },

  async createCategory(nameAr: string, nameEn: string): Promise<Category> {
    const id = 'cat_' + crypto.randomBytes(5).toString('hex');
    const newCategory: Category = { id, nameAr, nameEn };

    if (isMongoConnected) {
      await CategoryModel.create(newCategory);
    } else {
      if (!dbCache.categories) {
        dbCache.categories = [...DEFAULT_CATEGORIES];
      }
      dbCache.categories.push(newCategory);
      saveToDisk();
    }
    return newCategory;
  },

  async updateCategory(id: string, nameAr: string, nameEn: string): Promise<Category> {
    if (isMongoConnected) {
      const doc = await CategoryModel.findOneAndUpdate(
        { id },
        { $set: { nameAr, nameEn } },
        { new: true }
      ).lean();
      if (!doc) {
        throw new Error('القسم غير موجود');
      }
      return doc as unknown as Category;
    } else {
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
    }
  },

  async deleteCategory(id: string): Promise<void> {
    if (isMongoConnected) {
      await CategoryModel.deleteOne({ id });
    } else {
      if (!dbCache.categories) {
        dbCache.categories = [...DEFAULT_CATEGORIES];
      }
      dbCache.categories = dbCache.categories.filter(cat => cat.id !== id);
      saveToDisk();
    }
  },

  // --- ORDERS ---
  async getOrders(): Promise<Order[]> {
    if (isMongoConnected) {
      const docs = await OrderModel.find({}).sort({ createdAt: -1 }).lean();
      return docs as unknown as Order[];
    }
    return dbCache.orders;
  },

  async getUserOrders(userId: string): Promise<Order[]> {
    if (isMongoConnected) {
      const docs = await OrderModel.find({ userId }).sort({ createdAt: -1 }).lean();
      return docs as unknown as Order[];
    }
    return dbCache.orders.filter(o => o.userId === userId);
  },

  async createOrder(
    userId: string, 
    username: string, 
    items: CartItem[], 
    notes?: string,
    phone?: string,
    whatsapp?: string,
    address?: string,
    latitude?: number,
    longitude?: number
  ): Promise<Order> {
    // SECURITY HARDENING: Always calculate total price from server-side trusted menu database
    const currentMenu = await this.getMenu();
    const total = items.reduce((sum, item) => {
      const dbItem = currentMenu.find(m => m.id === item.menuItem.id);
      const itemPrice = dbItem ? dbItem.price : item.menuItem.price;
      const extrasPrice = item.extras ? item.extras.reduce((s, ex) => s + ex.price, 0) : 0;
      return sum + ((itemPrice + extrasPrice) * item.quantity);
    }, 0);

    const verifiedItems = items.map(item => {
      const dbItem = currentMenu.find(m => m.id === item.menuItem.id);
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

    if (isMongoConnected) {
      await OrderModel.create(newOrder);
      await UserModel.findOneAndUpdate(
        { id: userId },
        { 
          $set: {
            ...(phone && { phone }),
            ...(whatsapp && { whatsapp }),
            ...(address && { address }),
            ...(latitude !== undefined && { latitude }),
            ...(longitude !== undefined && { longitude })
          }
        }
      );
    } else {
      dbCache.orders.unshift(newOrder);
      const user = dbCache.users.find(u => u.id === userId);
      if (user) {
        if (phone) user.phone = phone;
        if (whatsapp) user.whatsapp = whatsapp;
        if (address) user.address = address;
        if (latitude !== undefined) user.latitude = latitude;
        if (longitude !== undefined) user.longitude = longitude;
      }
      saveToDisk();
    }

    return newOrder;
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    if (isMongoConnected) {
      const doc = await OrderModel.findOneAndUpdate(
        { id: orderId },
        { $set: { status, updatedAt: new Date().toISOString() } },
        { new: true }
      ).lean();
      if (!doc) {
        throw new Error('الطلب غير موجود');
      }
      return doc as unknown as Order;
    } else {
      const order = dbCache.orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error('الطلب غير موجود');
      }
      order.status = status;
      order.updatedAt = new Date().toISOString();
      saveToDisk();
      return order;
    }
  },

  async deleteOrder(orderId: string): Promise<void> {
    if (isMongoConnected) {
      await OrderModel.deleteOne({ id: orderId });
    } else {
      dbCache.orders = dbCache.orders.filter(o => o.id !== orderId);
      saveToDisk();
    }
  },

  // --- SETTINGS ---
  async getSettings(): Promise<{ adminPhone: string }> {
    if (isMongoConnected) {
      let doc = await SettingsModel.findOne({}).lean();
      if (!doc) {
        doc = await SettingsModel.create({ adminPhone: '01120751465' });
      }
      return { adminPhone: doc.adminPhone };
    }
    if (!dbCache.settings) {
      dbCache.settings = { adminPhone: '01120751465' };
    }
    return dbCache.settings;
  },

  async updateSettings(adminPhone: string): Promise<{ adminPhone: string }> {
    if (isMongoConnected) {
      let doc = await SettingsModel.findOneAndUpdate(
        {},
        { $set: { adminPhone } },
        { new: true, upsert: true }
      ).lean();
      return { adminPhone: doc.adminPhone };
    } else {
      dbCache.settings = { adminPhone };
      saveToDisk();
      return dbCache.settings;
    }
  },

  async updateUserProfile(
    userId: string,
    phone: string,
    whatsapp: string,
    address: string,
    latitude?: number,
    longitude?: number
  ): Promise<User> {
    if (isMongoConnected) {
      const doc = await UserModel.findOneAndUpdate(
        { id: userId },
        {
          $set: {
            phone,
            whatsapp,
            address,
            ...(latitude !== undefined && { latitude }),
            ...(longitude !== undefined && { longitude })
          }
        },
        { new: true }
      ).lean();
      if (!doc) {
        throw new Error('المستخدم غير موجود');
      }
      return doc as unknown as User;
    } else {
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
    }
  },

  async getStats(): Promise<{ totalOrders: number; totalRevenue: number; pendingOrders: number; completedOrders: number }> {
    if (isMongoConnected) {
      const totalOrders = await OrderModel.countDocuments();
      const deliveredOrders = await OrderModel.find({ status: 'delivered' }).lean();
      const totalRevenue = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
      const pendingOrders = await OrderModel.countDocuments({ status: { $in: ['pending', 'preparing'] } });
      const completedOrders = deliveredOrders.length;

      return {
        totalOrders,
        totalRevenue,
        pendingOrders,
        completedOrders
      };
    } else {
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
  }
};
