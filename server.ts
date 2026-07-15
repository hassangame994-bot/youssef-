import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { DatabaseService } from './server-db.js';
import { OrderStatus } from './src/types.js';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

const app = express();
const PORT = 3000;

// Wrap Express app with HTTP server to attach Socket.io
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Socket.io connection and room clustering logic
io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId as string;
  const isAdmin = socket.handshake.query.isAdmin === 'true';

  if (isAdmin) {
    socket.join('admin');
    console.log(`📡 [Socket.io] Admin client connected: ID ${socket.id}`);
  }

  if (userId) {
    socket.join(`user:${userId}`);
    console.log(`📡 [Socket.io] User client connected: ID ${socket.id} (Room: user:${userId})`);
  }

  socket.on('disconnect', () => {
    console.log(`🔌 [Socket.io] Client disconnected: ID ${socket.id}`);
  });
});

app.use(express.json());

// Simple in-memory storage of connected SSE clients for real-time notifications
interface SSEClient {
  id: string;
  res: any;
  userId?: string;
  isAdmin: boolean;
}

const sseClients = new Map<string, SSEClient>();

// Periodic Keep-Alive heartbeat (every 15 seconds) to prevent proxy connection drops
// and automatically clean up stale/broken sockets to prevent memory leaks under load.
setInterval(() => {
  if (sseClients.size === 0) return;
  
  for (const [clientId, client] of sseClients.entries()) {
    try {
      client.res.write(': keep-alive\n\n');
    } catch (err) {
      console.log(`Pruning stale SSE client ${clientId} due to write error`);
      try {
        client.res.end();
      } catch (_) {}
      sseClients.delete(clientId);
    }
  }
}, 15000);

// SSE Registration Endpoint for live order updates
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  // Disable buffering for instant message delivery under load (crucial for Nginx/Cloud Run proxies)
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const clientId = 'c_' + Math.random().toString(36).substr(2, 9);
  const userId = req.query.userId as string;
  const isAdmin = req.query.isAdmin === 'true';

  const newClient: SSEClient = {
    id: clientId,
    res,
    userId,
    isAdmin
  };

  sseClients.set(clientId, newClient);

  // Send initial keep-alive connected event
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId })}\n\n`);

  const cleanUp = () => {
    sseClients.delete(clientId);
    try {
      res.end();
    } catch (_) {}
  };

  req.on('close', cleanUp);
  req.on('error', cleanUp);
});

// Helper to notify admin clients of a new order
function notifyAdminOfNewOrder(order: any) {
  for (const client of sseClients.values()) {
    if (client.isAdmin) {
      try {
        client.res.write(`event: new-order\ndata: ${JSON.stringify(order)}\n\n`);
      } catch (err) {
        console.error('Error writing to admin SSE client:', err);
      }
    }
  }
}

// Helper to notify a specific user of a status change
function notifyUserOfOrderStatus(userId: string, order: any) {
  for (const client of sseClients.values()) {
    if (client.userId === userId) {
      try {
        client.res.write(`event: order-status-updated\ndata: ${JSON.stringify(order)}\n\n`);
      } catch (err) {
        console.error('Error writing to user SSE client:', err);
      }
    }
  }
}

// Professional real-time Socket.io & SSE broadcast engines
function broadcastNewOrder(order: any) {
  // 1. Fallback SSE
  notifyAdminOfNewOrder(order);
  
  // 2. Performance-grade Socket.io
  io.to('admin').emit('new-order', order);
  io.to(`user:${order.userId}`).emit('order-status-updated', order);
}

function broadcastOrderStatusUpdate(userId: string, order: any) {
  // 1. Fallback SSE
  notifyUserOfOrderStatus(userId, order);
  
  // 2. Performance-grade Socket.io (To user & admin for immediate sync across views)
  io.to(`user:${userId}`).emit('order-status-updated', order);
  io.to('admin').emit('order-status-updated', order);
}

function broadcastMenuUpdate() {
  io.emit('menu-updated');
}

function broadcastCategoriesUpdate() {
  io.emit('categories-updated');
}

function broadcastSettingsUpdate(settings: any) {
  io.emit('settings-updated', settings);
}

function broadcastOrderDeletion(orderId: string) {
  io.to('admin').emit('order-deleted', orderId);
  io.emit('order-deleted', orderId);
}

// --- API ENDPOINTS ---

// 1. Authentication
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password, isAdminLogin } = req.body;

    if (!username || username.trim() === '') {
      return res.status(400).json({ error: 'اسم المستخدم مطلوب' });
    }

    const trimmedUsername = username.trim();

    if (isAdminLogin) {
      if (trimmedUsername === 'Abu-Qura' && password === 'Abu-Qura123') {
        let adminUser = await DatabaseService.findUserByName('Abu-Qura');
        if (!adminUser) {
          console.log('⚠️ Admin user not found. Auto-recreating admin on the fly...');
          adminUser = await DatabaseService.createUser('Abu-Qura');
        }
        return res.json({ success: true, user: adminUser });
      } else {
        return res.status(401).json({ error: 'خطأ في اسم المستخدم أو كلمة مرور المدير' });
      }
    } else {
      // Prevent registering or logging in with the official admin username in user mode
      if (trimmedUsername.toLowerCase() === 'abu-qura' || trimmedUsername.toLowerCase() === 'admin') {
        return res.status(403).json({ error: 'غير مسموح باستخدام هذا الاسم لتسجيل دخول العميل' });
      }

      // Normal user: simple login/signup (checks if user exists, else registers them)
      let user = await DatabaseService.findUserByName(trimmedUsername);
      if (!user) {
        user = await DatabaseService.createUser(trimmedUsername);
      }
      return res.json({ success: true, user });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'حدث خطأ أثناء تسجيل الدخول' });
  }
});

// 2. Fetch Menu Items & Menu management
app.get('/api/menu', async (req, res) => {
  try {
    const menu = await DatabaseService.getMenu();
    res.json(menu);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'حدث خطأ أثناء جلب المنيو' });
  }
});

app.post('/api/menu', async (req, res) => {
  try {
    const { nameAr, nameEn, descriptionAr, descriptionEn, price, image, category, available } = req.body;
    if (!nameAr || !price || !category) {
      return res.status(400).json({ error: 'الاسم بالعربية والسعر والجروب مطلوبين' });
    }
    const newItem = await DatabaseService.createMenuItem({
      nameAr,
      nameEn: nameEn || nameAr,
      descriptionAr: descriptionAr || '',
      descriptionEn: descriptionEn || '',
      price: Number(price),
      image: image || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
      category,
      available: available !== undefined ? Boolean(available) : true
    });
    broadcastMenuUpdate();
    res.json({ success: true, item: newItem });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/menu/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nameAr, nameEn, descriptionAr, descriptionEn, price, image, category, available } = req.body;
    const updated = await DatabaseService.updateMenuItem(id, {
      nameAr,
      nameEn,
      descriptionAr,
      descriptionEn,
      price: price !== undefined ? Number(price) : undefined,
      image,
      category,
      available: available !== undefined ? Boolean(available) : undefined
    });
    broadcastMenuUpdate();
    res.json({ success: true, item: updated });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

app.delete('/api/menu/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await DatabaseService.deleteMenuItem(id);
    broadcastMenuUpdate();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Categories Endpoints
app.get('/api/categories', async (req, res) => {
  try {
    const cats = await DatabaseService.getCategories();
    res.json(cats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { nameAr, nameEn } = req.body;
    if (!nameAr || !nameEn) {
      return res.status(400).json({ error: 'الاسم بالعربية والإنجليزية مطلوبين' });
    }
    const newCat = await DatabaseService.createCategory(nameAr, nameEn);
    broadcastCategoriesUpdate();
    res.json({ success: true, category: newCat });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nameAr, nameEn } = req.body;
    if (!nameAr || !nameEn) {
      return res.status(400).json({ error: 'الاسم بالعربية والإنجليزية مطلوبين' });
    }
    const updatedCat = await DatabaseService.updateCategory(id, nameAr, nameEn);
    broadcastCategoriesUpdate();
    res.json({ success: true, category: updatedCat });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await DatabaseService.deleteCategory(id);
    broadcastCategoriesUpdate();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Fetch Orders (For Admin or specific User)
app.get('/api/orders', async (req, res) => {
  try {
    const { userId, isAdmin } = req.query;

    if (isAdmin === 'true') {
      const orders = await DatabaseService.getOrders();
      return res.json(orders);
    }

    if (userId) {
      const orders = await DatabaseService.getUserOrders(userId as string);
      return res.json(orders);
    }

    res.status(400).json({ error: 'معلمات طلب غير صحيحة' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'حدث خطأ أثناء جلب الطلبات' });
  }
});

// 4. Create New Order
app.post('/api/orders', async (req, res) => {
  const { userId, username, items, notes, phone, whatsapp, address, latitude, longitude } = req.body;

  if (!userId || !username || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'بيانات الطلب غير مكتملة' });
  }

  try {
    const newOrder = await DatabaseService.createOrder(
      userId, 
      username, 
      items, 
      notes,
      phone,
      whatsapp,
      address,
      latitude,
      longitude
    );
    
    // Broadcast to Admin & User clients instantly via Socket.io & SSE
    broadcastNewOrder(newOrder);

    res.json({ success: true, order: newOrder });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'حدث خطأ أثناء تسجيل الطلب' });
  }
});

// 5. Update Order Status (Admin Only)
patchRoute('/api/orders/:id/status', async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'الحالة مطلوبة' });
  }

  try {
    const updatedOrder = await DatabaseService.updateOrderStatus(orderId, status as OrderStatus);

    // Notify the user who placed this order and admins via Socket.io & SSE
    broadcastOrderStatusUpdate(updatedOrder.userId, updatedOrder);

    res.json({ success: true, order: updatedOrder });
  } catch (err: any) {
    res.status(404).json({ error: err.message || 'الطلب غير موجود' });
  }
});

// Delete Order (Admin Only)
app.delete('/api/orders/:id', async (req, res) => {
  const orderId = req.params.id;
  try {
    await DatabaseService.deleteOrder(orderId);
    broadcastOrderDeletion(orderId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'حدث خطأ أثناء حذف الطلب' });
  }
});

// Helper wrapper to handle Express routing compatibility safely
function patchRoute(routePath: string, handler: express.RequestHandler) {
  app.patch(routePath, handler);
}

// 6. Fetch Dashboard Stats (Admin Only)
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await DatabaseService.getStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'حدث خطأ أثناء جلب الإحصائيات' });
  }
});

// 7. Get General Restaurant Settings
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await DatabaseService.getSettings();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'حدث خطأ أثناء جلب الإعدادات' });
  }
});

// 8. Update General Restaurant Settings (Admin Only)
app.post('/api/settings', async (req, res) => {
  const { adminPhone } = req.body;
  if (!adminPhone || adminPhone.trim() === '') {
    return res.status(400).json({ error: 'رقم هاتف المدير مطلوب' });
  }
  try {
    const settings = await DatabaseService.updateSettings(adminPhone.trim());
    broadcastSettingsUpdate(settings);
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'حدث خطأ أثناء تحديث الإعدادات' });
  }
});

// 9. Update User Profile Defaults
app.post('/api/user/profile', async (req, res) => {
  const { userId, phone, whatsapp, address, latitude, longitude } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'معرف المستخدم مطلوب' });
  }
  try {
    const updatedUser = await DatabaseService.updateUserProfile(userId, phone, whatsapp, address, latitude, longitude);
    res.json({ success: true, user: updatedUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'حدث خطأ أثناء تحديث بيانات الحساب' });
  }
});

// Vite middleware integration for Hot Reloads in Development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Abu Qura Server running on http://localhost:${PORT}`);
  });
}

startServer();
