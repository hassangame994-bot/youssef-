import 'dotenv/config';
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
let MONGODB_URI = process.env.MONGODB_URI;

// 30-Year Veteran Resilience Fallback: If MONGODB_URI is not in process.env, 
// automatically look for a raw MongoDB connection string inside the .env file.
if (!MONGODB_URI) {
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      // Look for standard or SRV MongoDB URIs even if the user didn't write "MONGODB_URI="
      const match = envContent.match(/(mongodb(?:\+srv)?:\/\/[^\s"'`]+)/);
      if (match) {
        MONGODB_URI = match[1].trim();
        console.log('💡 [30-Yr Veteran Fallback] Found MongoDB connection string in .env without standard variable prefix. Using it automatically!');
      }
    }
  } catch (e) {
    // Ignore read errors
  }
}

// Check all process.env values in case it is named differently
if (!MONGODB_URI) {
  for (const key of Object.keys(process.env)) {
    const val = process.env[key];
    if (val && (val.startsWith('mongodb://') || val.startsWith('mongodb+srv://'))) {
      MONGODB_URI = val;
      console.log(`💡 [30-Yr Veteran Fallback] Found MongoDB connection string under non-standard environment key: "${key}"!`);
      break;
    }
  }
}

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
UserSchema.index({ id: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true });
const UserModel = (mongoose.models.User || mongoose.model('User', UserSchema)) as any;

// 2. Category Schema
const CategorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  nameAr: { type: String, required: true },
  nameEn: { type: String, required: true }
});
CategorySchema.index({ id: 1 }, { unique: true });
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
MenuItemSchema.index({ id: 1 }, { unique: true });
MenuItemSchema.index({ category: 1 });
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
OrderSchema.index({ id: 1 }, { unique: true });
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ createdAt: -1 });
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
  // Production-grade connection pooling and resilience configuration
  const connectionOptions = {
    maxPoolSize: 100,             // Support up to 100 concurrent DB socket connections under heavy load
    minPoolSize: 10,              // Keep 10 connections warm to avoid initial handshake latency spikes
    socketTimeoutMS: 45000,       // Terminate inactive sockets after 45 seconds
    serverSelectionTimeoutMS: 10000, // Timeout after 10s if the cluster is unreachable (prevents infinite hanging)
    heartbeatFrequencyMS: 10000,  // Check MongoDB cluster health every 10 seconds
    retryWrites: true,            // Automatically retry failed write operations
    retryReads: true,             // Automatically retry failed read operations
  };

  // Configure connection lifecycle events for real-time visibility
  mongoose.connection.on('connected', () => {
    console.log('✅ Mongoose connection established to persistent cloud MongoDB Cluster.');
    isMongoConnected = true;
    // Immediate reconciliation upon establishing connection
    reconcileDatabases().catch(err => console.error('Initial database reconciliation failure:', err));
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error under heavy load:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ Mongoose connection lost! Mongoose will automatically attempt reconnecting...');
    isMongoConnected = false;
  });

  mongoose.connect(MONGODB_URI, connectionOptions)
    .then(async () => {
      await seedMongoData();
    })
    .catch((err) => {
      console.error('❌ Failed to establish initial connection to MongoDB. Falling back to local filesystem:', err);
      isMongoConnected = false;
    });

  // Start periodic background bidirectional reconciliation interval (every 30 seconds)
  setInterval(() => {
    reconcileDatabases().catch(err => console.error('Background database sync iteration error:', err));
  }, 30000);
} else {
  console.log('⚠️ MONGODB_URI not found. Running under high-performance local file-system storage (data/db.json).');
}

// ==========================================
// 30-YEAR VETERAN AUTO-FALLBACK & SYNC ENGINES
// ==========================================

async function runMongo<T>(task: () => Promise<T>, fallback: () => Promise<T> | T): Promise<T> {
  if (!MONGODB_URI || !isMongoConnected) {
    return Promise.resolve(fallback());
  }
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('MongoDB operation timeout')), 2500)
    );
    return await Promise.race([task(), timeoutPromise]);
  } catch (err) {
    console.error('⚠️ [Resilient Mongo Fallback Triggered] Query failed or timed out:', err);
    return Promise.resolve(fallback());
  }
}

let isReconciling = false;

export async function reconcileDatabases() {
  if (!MONGODB_URI || !isMongoConnected) return;
  if (isReconciling) return;
  isReconciling = true;

  try {
    console.log('🔄 [Reconciliation Engine] Starting periodic bidirectional synchronization...');

    // 1. Sync Settings
    try {
      const mongoSettings = await SettingsModel.findOne({}).lean();
      const localSettings = dbCache.settings || { adminPhone: '01120751465' };
      if (!mongoSettings) {
        await SettingsModel.create(localSettings);
      } else if (mongoSettings.adminPhone !== localSettings.adminPhone) {
        dbCache.settings = { adminPhone: mongoSettings.adminPhone };
        saveToDisk();
      }
    } catch (e) {
      console.error('Error syncing settings:', e);
    }

    // 2. Sync Categories
    try {
      const mongoCategories = await CategoryModel.find({}).lean() as unknown as Category[];
      const localCategories = dbCache.categories || [];

      // Local to Mongo
      for (const localCat of localCategories) {
        try {
          await CategoryModel.updateOne(
            { id: localCat.id },
            { $set: { nameAr: localCat.nameAr, nameEn: localCat.nameEn } },
            { upsert: true }
          );
        } catch (e) {
          console.error(`Error syncing Category ${localCat.id} to Mongo:`, e);
        }
      }

      // Mongo to Local
      let updatedLocalCats = false;
      for (const mongoCat of mongoCategories) {
        const hasLocal = localCategories.some(c => c.id === mongoCat.id);
        if (!hasLocal) {
          localCategories.push({
            id: mongoCat.id,
            nameAr: mongoCat.nameAr,
            nameEn: mongoCat.nameEn
          });
          updatedLocalCats = true;
        }
      }
      if (updatedLocalCats) {
        dbCache.categories = localCategories;
        saveToDisk();
      }
    } catch (e) {
      console.error('Error syncing categories:', e);
    }

    // 3. Sync Menu Items
    try {
      const mongoMenu = await MenuItemModel.find({}).lean() as unknown as MenuItem[];
      const localMenu = dbCache.menu || [];

      // Local to Mongo
      for (const localItem of localMenu) {
        try {
          await MenuItemModel.updateOne(
            { id: localItem.id },
            { 
              $set: {
                nameAr: localItem.nameAr,
                nameEn: localItem.nameEn,
                descriptionAr: localItem.descriptionAr || '',
                descriptionEn: localItem.descriptionEn || '',
                price: localItem.price,
                image: localItem.image,
                category: localItem.category,
                available: localItem.available !== false
              } 
            },
            { upsert: true }
          );
        } catch (e) {
          console.error(`Error syncing MenuItem ${localItem.id} to Mongo:`, e);
        }
      }

      // Mongo to Local
      let updatedLocalMenu = false;
      for (const mongoItem of mongoMenu) {
        const localIdx = localMenu.findIndex(m => m.id === mongoItem.id);
        if (localIdx === -1) {
          localMenu.push({
            id: mongoItem.id,
            nameAr: mongoItem.nameAr,
            nameEn: mongoItem.nameEn,
            descriptionAr: mongoItem.descriptionAr,
            descriptionEn: mongoItem.descriptionEn,
            price: mongoItem.price,
            image: mongoItem.image,
            category: mongoItem.category,
            available: mongoItem.available !== false
          });
          updatedLocalMenu = true;
        } else {
          const localItem = localMenu[localIdx];
          if (localItem.price !== mongoItem.price || localItem.available !== mongoItem.available) {
            localMenu[localIdx] = {
              ...localItem,
              price: mongoItem.price,
              available: mongoItem.available !== false
            };
            updatedLocalMenu = true;
          }
        }
      }
      if (updatedLocalMenu) {
        dbCache.menu = localMenu;
        saveToDisk();
      }
    } catch (e) {
      console.error('Error syncing menu:', e);
    }

    // 4. Sync Users
    try {
      const mongoUsers = await UserModel.find({}).lean() as unknown as User[];
      const localUsers = dbCache.users || [];

      // Local to Mongo
      for (const localUser of localUsers) {
        try {
          await UserModel.updateOne(
            { id: localUser.id },
            { 
              $set: {
                username: localUser.username,
                role: localUser.role,
                createdAt: localUser.createdAt,
                phone: localUser.phone || '',
                whatsapp: localUser.whatsapp || '',
                address: localUser.address || '',
                latitude: localUser.latitude,
                longitude: localUser.longitude
              } 
            },
            { upsert: true }
          );
        } catch (e) {
          console.error(`Error syncing User ${localUser.id} to Mongo:`, e);
        }
      }

      // Mongo to Local
      let updatedLocalUsers = false;
      for (const mongoUser of mongoUsers) {
        const localIdx = localUsers.findIndex(u => u.id === mongoUser.id);
        if (localIdx === -1) {
          localUsers.push({
            id: mongoUser.id,
            username: mongoUser.username,
            role: mongoUser.role,
            createdAt: mongoUser.createdAt,
            phone: mongoUser.phone,
            whatsapp: mongoUser.whatsapp,
            address: mongoUser.address,
            latitude: mongoUser.latitude,
            longitude: mongoUser.longitude
          });
          updatedLocalUsers = true;
        } else {
          const localUser = localUsers[localIdx];
          if (
            (mongoUser.phone && mongoUser.phone !== localUser.phone) ||
            (mongoUser.whatsapp && mongoUser.whatsapp !== localUser.whatsapp) ||
            (mongoUser.address && mongoUser.address !== localUser.address)
          ) {
            localUsers[localIdx] = {
              ...localUser,
              phone: mongoUser.phone || localUser.phone,
              whatsapp: mongoUser.whatsapp || localUser.whatsapp,
              address: mongoUser.address || localUser.address,
              latitude: mongoUser.latitude !== undefined ? mongoUser.latitude : localUser.latitude,
              longitude: mongoUser.longitude !== undefined ? mongoUser.longitude : localUser.longitude,
            };
            updatedLocalUsers = true;
          }
        }
      }
      if (updatedLocalUsers) {
        dbCache.users = localUsers;
        saveToDisk();
      }
    } catch (e) {
      console.error('Error syncing users:', e);
    }

    // 5. Sync Orders
    try {
      const mongoOrders = await OrderModel.find({}).lean() as unknown as Order[];
      const localOrders = dbCache.orders || [];

      // Local to Mongo
      for (const localOrder of localOrders) {
        try {
          const mongoOrder = mongoOrders.find(o => o.id === localOrder.id);
          if (!mongoOrder) {
            await OrderModel.create(localOrder);
            console.log(`Synced Order ${localOrder.id} from local to MongoDB`);
          } else {
            const localUpdate = new Date(localOrder.updatedAt || localOrder.createdAt).getTime();
            const mongoUpdate = new Date(mongoOrder.updatedAt || mongoOrder.createdAt).getTime();
            if (localUpdate > mongoUpdate && localOrder.status !== mongoOrder.status) {
              await OrderModel.updateOne(
                { id: localOrder.id }, 
                { $set: { status: localOrder.status, updatedAt: localOrder.updatedAt } }
              );
              console.log(`Updated Mongo Order ${localOrder.id} status to ${localOrder.status} from local`);
            }
          }
        } catch (e) {
          console.error(`Error syncing Order ${localOrder.id} to Mongo:`, e);
        }
      }

      // Mongo to Local
      let updatedLocalOrders = false;
      for (const mongoOrder of mongoOrders) {
        const localIdx = localOrders.findIndex(o => o.id === mongoOrder.id);
        if (localIdx === -1) {
          localOrders.unshift({
            id: mongoOrder.id,
            userId: mongoOrder.userId,
            username: mongoOrder.username,
            items: mongoOrder.items,
            total: mongoOrder.total,
            status: mongoOrder.status,
            notes: mongoOrder.notes,
            createdAt: mongoOrder.createdAt,
            updatedAt: mongoOrder.updatedAt,
            phone: mongoOrder.phone,
            whatsapp: mongoOrder.whatsapp,
            address: mongoOrder.address,
            latitude: mongoOrder.latitude,
            longitude: mongoOrder.longitude
          });
          updatedLocalOrders = true;
        } else {
          const localOrder = localOrders[localIdx];
          const localUpdate = new Date(localOrder.updatedAt || localOrder.createdAt).getTime();
          const mongoUpdate = new Date(mongoOrder.updatedAt || mongoOrder.createdAt).getTime();
          if (mongoUpdate > localUpdate && mongoOrder.status !== localOrder.status) {
            localOrders[localIdx] = {
              ...localOrder,
              status: mongoOrder.status,
              updatedAt: mongoOrder.updatedAt
            };
            updatedLocalOrders = true;
          }
        }
      }
      if (updatedLocalOrders) {
        localOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        dbCache.orders = localOrders;
        saveToDisk();
      }
    } catch (e) {
      console.error('Error syncing orders:', e);
    }

    console.log('✅ [Reconciliation Engine] Periodic bidirectional synchronization completed successfully.');
  } catch (err) {
    console.error('❌ [Reconciliation Engine] Synchronization error:', err);
  } finally {
    isReconciling = false;
  }
}

// ==========================================
// UNIFIED DYNAMIC DATABASE CONTROLLER
// ==========================================
export const DatabaseService = {
  // --- USERS ---
  async getUsers(): Promise<User[]> {
    return runMongo(
      async () => {
        const docs = await UserModel.find({}).lean();
        return docs as unknown as User[];
      },
      async () => dbCache.users
    );
  },

  async findUserByName(username: string): Promise<User | undefined> {
    return runMongo(
      async () => {
        const doc = await UserModel.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } }).lean();
        return doc ? (doc as unknown as User) : undefined;
      },
      async () => dbCache.users.find(u => u.username.toLowerCase() === username.toLowerCase())
    );
  },

  async findUserById(id: string): Promise<User | undefined> {
    return runMongo(
      async () => {
        const doc = await UserModel.findOne({ id }).lean();
        return doc ? (doc as unknown as User) : undefined;
      },
      async () => dbCache.users.find(u => u.id === id)
    );
  },

  async createUser(username: string): Promise<User> {
    const trimmed = typeof username === 'string' ? username.trim() : '';
    if (trimmed.length === 0) {
      throw new Error('اسم المستخدم مطلوب ولا يمكن أن يكون فارغاً');
    }
    if (trimmed.length > 30) {
      throw new Error('اسم المستخدم طويل جداً (الحد الأقصى 30 حرف)');
    }
    
    const sanitizedUsername = trimmed.replace(/<\/?[^>]+(>|$)/g, "");
    if (sanitizedUsername.length === 0) {
      throw new Error('اسم مستخدم غير صالح');
    }

    const existing = await this.findUserByName(sanitizedUsername);
    if (existing) {
      throw new Error('اسم المستخدم موجود بالفعل');
    }
    const isPrimaryAdmin = sanitizedUsername === 'Abu-Qura';
    const newUser: User = {
      id: isPrimaryAdmin ? 'admin-1' : 'usr_' + crypto.randomBytes(5).toString('hex'),
      username: sanitizedUsername,
      role: isPrimaryAdmin ? 'admin' : 'user',
      createdAt: new Date().toISOString()
    };

    dbCache.users.push(newUser);
    saveToDisk();

    await runMongo(
      async () => {
        await UserModel.create(newUser);
      },
      async () => {}
    );

    return newUser;
  },

  // --- MENU ---
  async getMenu(): Promise<MenuItem[]> {
    return runMongo(
      async () => {
        const docs = await MenuItemModel.find({}).lean();
        return docs as unknown as MenuItem[];
      },
      async () => dbCache.menu
    );
  },

  async createMenuItem(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    const newItem: MenuItem = {
      ...item,
      id: 'm_' + crypto.randomBytes(5).toString('hex')
    };

    dbCache.menu.push(newItem);
    saveToDisk();

    await runMongo(
      async () => {
        await MenuItemModel.create(newItem);
      },
      async () => {}
    );

    return newItem;
  },

  async updateMenuItem(id: string, updated: Partial<MenuItem>): Promise<MenuItem> {
    const index = dbCache.menu.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error('الصنف غير موجود');
    }
    dbCache.menu[index] = {
      ...dbCache.menu[index],
      ...updated,
      id
    };
    saveToDisk();

    await runMongo(
      async () => {
        await MenuItemModel.findOneAndUpdate(
          { id },
          { $set: updated },
          { new: true }
        ).lean();
      },
      async () => {}
    );

    return dbCache.menu[index];
  },

  async deleteMenuItem(id: string): Promise<void> {
    dbCache.menu = dbCache.menu.filter(item => item.id !== id);
    saveToDisk();

    await runMongo(
      async () => {
        await MenuItemModel.deleteOne({ id });
      },
      async () => {}
    );
  },

  // --- CATEGORIES ---
  async getCategories(): Promise<Category[]> {
    return runMongo(
      async () => {
        const docs = await CategoryModel.find({}).lean();
        return docs as unknown as Category[];
      },
      async () => {
        if (!dbCache.categories) {
          dbCache.categories = [...DEFAULT_CATEGORIES];
        }
        return dbCache.categories;
      }
    );
  },

  async createCategory(nameAr: string, nameEn: string): Promise<Category> {
    const id = 'cat_' + crypto.randomBytes(5).toString('hex');
    const newCategory: Category = { id, nameAr, nameEn };

    if (!dbCache.categories) {
      dbCache.categories = [...DEFAULT_CATEGORIES];
    }
    dbCache.categories.push(newCategory);
    saveToDisk();

    await runMongo(
      async () => {
        await CategoryModel.create(newCategory);
      },
      async () => {}
    );

    return newCategory;
  },

  async updateCategory(id: string, nameAr: string, nameEn: string): Promise<Category> {
    if (!dbCache.categories) {
      dbCache.categories = [...DEFAULT_CATEGORIES];
    }
    const index = dbCache.categories.findIndex(cat => cat.id === id);
    if (index === -1) {
      throw new Error('القسم غير موجود');
    }
    dbCache.categories[index] = { id, nameAr, nameEn };
    saveToDisk();

    await runMongo(
      async () => {
        await CategoryModel.findOneAndUpdate(
          { id },
          { $set: { nameAr, nameEn } },
          { new: true }
        ).lean();
      },
      async () => {}
    );

    return dbCache.categories[index];
  },

  async deleteCategory(id: string): Promise<void> {
    if (!dbCache.categories) {
      dbCache.categories = [...DEFAULT_CATEGORIES];
    }
    dbCache.categories = dbCache.categories.filter(cat => cat.id !== id);
    saveToDisk();

    await runMongo(
      async () => {
        await CategoryModel.deleteOne({ id });
      },
      async () => {}
    );
  },

  // --- ORDERS ---
  async getOrders(): Promise<Order[]> {
    return runMongo(
      async () => {
        const docs = await OrderModel.find({}).sort({ createdAt: -1 }).lean();
        return docs as unknown as Order[];
      },
      async () => dbCache.orders
    );
  },

  async getUserOrders(userId: string): Promise<Order[]> {
    return runMongo(
      async () => {
        const docs = await OrderModel.find({ userId }).sort({ createdAt: -1 }).lean();
        return docs as unknown as Order[];
      },
      async () => dbCache.orders.filter(o => o.userId === userId)
    );
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
    if (!userId || !username || !items || !Array.isArray(items) || items.length === 0) {
      throw new Error('بيانات الطلب غير كاملة أو غير صالحة');
    }

    const currentMenu = await this.getMenu();
    const verifiedItems: CartItem[] = [];
    let total = 0;

    for (const item of items) {
      if (!item || !item.menuItem || !item.menuItem.id) {
        continue;
      }

      const dbItem = currentMenu.find(m => m.id === item.menuItem.id);
      if (!dbItem) {
        continue;
      }

      const quantity = typeof item.quantity === 'number' && item.quantity > 0 ? Math.floor(item.quantity) : 1;
      const itemPrice = dbItem.price;
      
      const extrasPrice = Array.isArray(item.extras)
        ? item.extras.reduce((sum, extra) => {
            if (extra && typeof extra.price === 'number') {
              return sum + extra.price;
            }
            return sum;
          }, 0)
        : 0;

      total += (itemPrice + extrasPrice) * quantity;

      verifiedItems.push({
        ...item,
        quantity,
        menuItem: {
          ...item.menuItem,
          price: itemPrice
        }
      });
    }

    if (verifiedItems.length === 0) {
      throw new Error('الطلب لا يحتوي على مأكولات صالحة');
    }

    const cleanUsername = typeof username === 'string' ? username.replace(/<\/?[^>]+(>|$)/g, "").trim() : 'عميل';
    const cleanNotes = typeof notes === 'string' ? notes.replace(/<\/?[^>]+(>|$)/g, "").trim() : undefined;
    const cleanPhone = typeof phone === 'string' ? phone.replace(/<\/?[^>]+(>|$)/g, "").trim() : undefined;
    const cleanWhatsapp = typeof whatsapp === 'string' ? whatsapp.replace(/<\/?[^>]+(>|$)/g, "").trim() : undefined;
    const cleanAddress = typeof address === 'string' ? address.replace(/<\/?[^>]+(>|$)/g, "").trim() : undefined;

    const newOrder: Order = {
      id: 'ORD_' + crypto.randomBytes(4).toString('hex').toUpperCase(),
      userId,
      username: cleanUsername,
      items: verifiedItems,
      total,
      status: 'pending',
      notes: cleanNotes || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      phone: cleanPhone || undefined,
      whatsapp: cleanWhatsapp || undefined,
      address: cleanAddress || undefined,
      latitude: typeof latitude === 'number' ? latitude : undefined,
      longitude: typeof longitude === 'number' ? longitude : undefined
    };

    dbCache.orders.unshift(newOrder);
    const user = dbCache.users.find(u => u.id === userId);
    if (user) {
      if (cleanPhone) user.phone = cleanPhone;
      if (cleanWhatsapp) user.whatsapp = cleanWhatsapp;
      if (cleanAddress) user.address = cleanAddress;
      if (latitude !== undefined) user.latitude = latitude;
      if (longitude !== undefined) user.longitude = longitude;
    }
    saveToDisk();

    await runMongo(
      async () => {
        await OrderModel.create(newOrder);
        await UserModel.findOneAndUpdate(
          { id: userId },
          { 
            $set: {
              ...(cleanPhone && { phone: cleanPhone }),
              ...(cleanWhatsapp && { whatsapp: cleanWhatsapp }),
              ...(cleanAddress && { address: cleanAddress }),
              ...(latitude !== undefined && { latitude }),
              ...(longitude !== undefined && { longitude })
            }
          }
        );
      },
      async () => {}
    );

    return newOrder;
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const order = dbCache.orders.find(o => o.id === orderId);
    if (!order) {
      throw new Error('الطلب غير موجود');
    }
    order.status = status;
    order.updatedAt = new Date().toISOString();
    saveToDisk();

    await runMongo(
      async () => {
        await OrderModel.findOneAndUpdate(
          { id: orderId },
          { $set: { status, updatedAt: order.updatedAt } },
          { new: true }
        ).lean();
      },
      async () => {}
    );

    return order;
  },

  async deleteOrder(orderId: string): Promise<void> {
    dbCache.orders = dbCache.orders.filter(o => o.id !== orderId);
    saveToDisk();

    await runMongo(
      async () => {
        await OrderModel.deleteOne({ id: orderId });
      },
      async () => {}
    );
  },

  // --- SETTINGS ---
  async getSettings(): Promise<{ adminPhone: string }> {
    return runMongo(
      async () => {
        let doc = await SettingsModel.findOne({}).lean();
        if (!doc) {
          doc = await SettingsModel.create({ adminPhone: '01120751465' });
        }
        return { adminPhone: doc.adminPhone };
      },
      async () => {
        if (!dbCache.settings) {
          dbCache.settings = { adminPhone: '01120751465' };
        }
        return dbCache.settings;
      }
    );
  },

  async updateSettings(adminPhone: string): Promise<{ adminPhone: string }> {
    dbCache.settings = { adminPhone };
    saveToDisk();

    await runMongo(
      async () => {
        await SettingsModel.findOneAndUpdate(
          {},
          { $set: { adminPhone } },
          { new: true, upsert: true }
        ).lean();
      },
      async () => {}
    );

    return dbCache.settings;
  },

  async updateUserProfile(
    userId: string,
    phone: string,
    whatsapp: string,
    address: string,
    latitude?: number,
    longitude?: number
  ): Promise<User> {
    const cleanPhone = typeof phone === 'string' ? phone.replace(/<\/?[^>]+(>|$)/g, "").trim() : '';
    const cleanWhatsapp = typeof whatsapp === 'string' ? whatsapp.replace(/<\/?[^>]+(>|$)/g, "").trim() : '';
    const cleanAddress = typeof address === 'string' ? address.replace(/<\/?[^>]+(>|$)/g, "").trim() : '';

    const user = dbCache.users.find(u => u.id === userId);
    if (!user) {
      throw new Error('المستخدم غير موجود');
    }
    user.phone = cleanPhone;
    user.whatsapp = cleanWhatsapp;
    user.address = cleanAddress;
    if (latitude !== undefined) user.latitude = latitude;
    if (longitude !== undefined) user.longitude = longitude;
    saveToDisk();

    await runMongo(
      async () => {
        await UserModel.findOneAndUpdate(
          { id: userId },
          {
            $set: {
              phone: cleanPhone,
              whatsapp: cleanWhatsapp,
              address: cleanAddress,
              ...(latitude !== undefined && { latitude }),
              ...(longitude !== undefined && { longitude })
            }
          },
          { new: true }
        ).lean();
      },
      async () => {}
    );

    return user;
  },

  async getStats(): Promise<{ totalOrders: number; totalRevenue: number; pendingOrders: number; completedOrders: number }> {
    return runMongo(
      async () => {
        const totalOrders = await OrderModel.countDocuments();
        const deliveredOrders = await OrderModel.find({ status: 'delivered' }).lean();
        const totalRevenue = (deliveredOrders as any[]).reduce((sum: number, o: any) => sum + (o.total || 0), 0);
        const pendingOrders = await OrderModel.countDocuments({ status: { $in: ['pending', 'preparing'] } });
        const completedOrders = deliveredOrders.length;

        return {
          totalOrders,
          totalRevenue,
          pendingOrders,
          completedOrders
        };
      },
      async () => {
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
    );
  }
};
