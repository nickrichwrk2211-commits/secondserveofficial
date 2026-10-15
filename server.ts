import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  User,
  FoodListing,
  MenuItem,
  FoodRequest,
  AppNotification,
  AuditLog,
  PlatformStats,
} from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'secondserve_db.json');

interface DatabaseSchema {
  users: (User & { passwordHash: string })[];
  listings: FoodListing[];
  menuItems: MenuItem[];
  requests: FoodRequest[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
}

function getInitialData(): DatabaseSchema {
  const now = new Date().toISOString();
  return {
    users: [
      {
        id: 'usr_admin',
        email: 'admin@secondserve.org',
        name: 'Nicholas Richard Lidrapraja',
        role: 'admin',
        status: 'active',
        verificationStatus: 'verified',
        organizationName: 'Second Serve HQ (Bina Bangsa School Bandung)',
        contactPerson: 'Nicholas Richard Lidrapraja',
        phone: '+62 22 201 1888',
        passwordHash: 'AdminPassword2026!',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'usr_rest_dago',
        email: 'dago.bakery@secondserve.org',
        name: 'Hendra Prasetya',
        role: 'restaurant',
        status: 'active',
        verificationStatus: 'verified',
        organizationName: 'Dago Artisan Bakery',
        contactPerson: 'Hendra Prasetya',
        phone: '+62 22 250 1192',
        address: 'Jl. Ir. H. Juanda No. 128, Dago, Bandung',
        passwordHash: 'Password123!',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'usr_rest_braga',
        email: 'braga.bistro@secondserve.org',
        name: 'Clara Wijaya',
        role: 'restaurant',
        status: 'active',
        verificationStatus: 'verified',
        organizationName: 'Braga Heritage Bistro',
        contactPerson: 'Clara Wijaya',
        phone: '+62 22 420 3391',
        address: 'Jl. Braga No. 54, Sumur Bandung, Bandung',
        passwordHash: 'Password123!',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'usr_ngo_foodbank',
        email: 'bandung.foodbank@ngo.id',
        name: 'Siti Nurhaliza',
        role: 'ngo',
        status: 'active',
        verificationStatus: 'verified',
        organizationName: 'Bandung Community Food Bank',
        contactPerson: 'Siti Nurhaliza',
        phone: '+62 812 2190 4421',
        operatingArea: 'Bandung Kota & Dago',
        address: 'Jl. Cisitu Indah No. 14, Coblong, Bandung',
        passwordHash: 'Password123!',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'usr_ngo_kasih',
        email: 'berbagi.kasih@ngo.id',
        name: 'Budi Hartono',
        role: 'ngo',
        status: 'active',
        verificationStatus: 'pending',
        organizationName: 'Yayasan Berbagi Kasih Bandung',
        contactPerson: 'Budi Hartono',
        phone: '+62 813 9022 1134',
        operatingArea: 'Sukajadi & Cidadap',
        address: 'Jl. Sukajadi No. 89, Sukajadi, Bandung',
        passwordHash: 'Password123!',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'usr_user_dewi',
        email: 'user.dewi@gmail.com',
        name: 'Dewi Lestari',
        role: 'user',
        status: 'active',
        verificationStatus: 'verified',
        phone: '+62 878 2210 9945',
        address: 'Jl. Dipati Ukur No. 42, Coblong, Bandung',
        passwordHash: 'Password123!',
        createdAt: now,
        updatedAt: now,
      },
    ],
    listings: [],
    menuItems: [],
    requests: [],
    notifications: [],
    auditLogs: [],
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error('Error loading DB file, reinitializing:', err);
        this.data = getInitialData();
        this.save();
      }
    } else {
      this.data = getInitialData();
      this.save();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  // Users
  getUsers() {
    return this.data.users;
  }

  getUserById(id: string) {
    return this.data.users.find((u) => u.id === id);
  }

  getUserByEmail(email: string) {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  addUser(user: User & { passwordHash: string }) {
    this.data.users.push(user);
    this.save();
    return user;
  }

  updateUser(id: string, updates: Partial<User>) {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = {
      ...this.data.users[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.users[idx];
  }

  // Listings
  getListings() {
    return this.data.listings;
  }

  getListingById(id: string) {
    return this.data.listings.find((l) => l.id === id);
  }

  addListing(listing: FoodListing) {
    this.data.listings.unshift(listing);
    this.save();
    return listing;
  }

  updateListing(id: string, updates: Partial<FoodListing>) {
    const idx = this.data.listings.findIndex((l) => l.id === id);
    if (idx === -1) return null;
    this.data.listings[idx] = {
      ...this.data.listings[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.listings[idx];
  }

  // Menu items
  getMenuItems(restaurantId?: string) {
    if (!restaurantId) return this.data.menuItems;
    return this.data.menuItems.filter((m) => m.restaurantId === restaurantId);
  }

  addMenuItem(item: MenuItem) {
    this.data.menuItems.unshift(item);
    this.save();
    return item;
  }

  deleteMenuItem(id: string, restaurantId: string) {
    const initialLen = this.data.menuItems.length;
    this.data.menuItems = this.data.menuItems.filter(
      (m) => !(m.id === id && m.restaurantId === restaurantId)
    );
    if (this.data.menuItems.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Requests
  getRequests() {
    return this.data.requests;
  }

  getRequestById(id: string) {
    return this.data.requests.find((r) => r.id === id);
  }

  addRequest(request: FoodRequest) {
    this.data.requests.unshift(request);
    this.save();
    return request;
  }

  updateRequest(id: string, updates: Partial<FoodRequest>) {
    const idx = this.data.requests.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this.data.requests[idx] = {
      ...this.data.requests[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.requests[idx];
  }

  // Notifications
  getNotifications(userId: string) {
    return this.data.notifications.filter((n) => n.userId === userId);
  }

  addNotification(notification: AppNotification) {
    this.data.notifications.unshift(notification);
    this.save();
    return notification;
  }

  markNotificationRead(id: string, userId: string) {
    const n = this.data.notifications.find((notif) => notif.id === id && notif.userId === userId);
    if (n) {
      n.isRead = true;
      this.save();
      return true;
    }
    return false;
  }

  markAllNotificationsRead(userId: string) {
    let count = 0;
    this.data.notifications.forEach((n) => {
      if (n.userId === userId && !n.isRead) {
        n.isRead = true;
        count++;
      }
    });
    if (count > 0) this.save();
    return count;
  }

  // Audit Logs
  getAuditLogs() {
    return this.data.auditLogs;
  }

  addAuditLog(log: AuditLog) {
    this.data.auditLogs.unshift(log);
    this.save();
    return log;
  }

  resetToZero() {
    this.data.listings = [];
    this.data.requests = [];
    this.data.notifications = [];
    this.data.auditLogs = [];
    this.save();
  }
}

const db = new Database();

// Authentication Helper
function createToken(user: User): string {
  const payload = `${user.id}:${user.role}:${Buffer.from(user.email).toString('base64')}`;
  return payload;
}

function parseToken(authHeader?: string): User | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  const parts = token.split(':');
  if (parts.length < 3) return null;
  const [userId] = parts;
  const user = db.getUserById(userId);
  if (!user || user.status === 'suspended') return null;
  return user;
}

function requireAuth(req: Request & { user?: User }, res: Response, next: NextFunction) {
  const user = parseToken(req.headers.authorization);
  if (!user) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  req.user = user;
  next();
}

function requireRole(roles: string[]) {
  return (req: Request & { user?: User }, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Access denied. You do not have permission for this portal.' });
      return;
    }
    next();
  };
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // -------------------------------------------------------------
  // AUTH API
  // -------------------------------------------------------------
  app.get('/api/auth/me', (req: Request, res: Response) => {
    const user = parseToken(req.headers.authorization);
    if (!user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...cleanUser } = user as User & { passwordHash?: string };
    res.json({ user: cleanUser });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const userWithPw = db.getUserByEmail(email);
    if (!userWithPw || userWithPw.passwordHash !== password) {
      res.status(401).json({ error: 'Invalid email or password. Please try again.' });
      return;
    }

    if (userWithPw.status === 'suspended') {
      res.status(403).json({ error: 'This account has been suspended by an administrator.' });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...cleanUser } = userWithPw;
    const token = createToken(cleanUser);

    res.json({
      user: cleanUser,
      token,
      message: 'Sign in successful.',
    });
  });

  app.post('/api/auth/register', (req: Request, res: Response) => {
    const {
      name,
      email,
      password,
      role,
      organizationName,
      contactPerson,
      phone,
      address,
      operatingArea,
    } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ error: 'Name, email, password, and role are required.' });
      return;
    }

    if (!['restaurant', 'ngo', 'user'].includes(role)) {
      res.status(400).json({ error: 'Registration for administrator role is restricted.' });
      return;
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const verificationStatus: 'verified' | 'pending' = role === 'user' ? 'verified' : 'pending';
    const now = new Date().toISOString();
    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      role,
      status: 'active' as const,
      verificationStatus,
      organizationName: organizationName?.trim() || undefined,
      contactPerson: contactPerson?.trim() || name.trim(),
      phone: phone?.trim() || undefined,
      address: address?.trim() || undefined,
      operatingArea: operatingArea?.trim() || undefined,
      passwordHash: password,
      createdAt: now,
      updatedAt: now,
    };

    db.addUser(newUser);

    // Notify admins of new pending verification if restaurant or NGO
    if (role === 'restaurant' || role === 'ngo') {
      const adminUsers = db.getUsers().filter((u) => u.role === 'admin');
      adminUsers.forEach((admin) => {
        db.addNotification({
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: admin.id,
          title: `New ${role.toUpperCase()} Registration Pending Verification`,
          message: `${newUser.organizationName || newUser.name} has registered and requires identity verification.`,
          type: 'verification_updated',
          relatedId: newUser.id,
          isRead: false,
          createdAt: now,
        });
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...cleanUser } = newUser;
    const token = createToken(cleanUser);

    res.status(201).json({
      user: cleanUser,
      token,
      message:
        role === 'user'
          ? 'Registration successful. Welcome to Second Serve!'
          : 'Registration successful. Your account has been submitted for verification review.',
    });
  });

  app.post('/api/auth/reset-password', (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Please enter your email address.' });
      return;
    }
    // Security: do not reveal whether arbitrary email addresses belong to registered users
    res.json({
      success: true,
      message:
        'If this email address is registered with Second Serve, a password recovery notification has been processed.',
    });
  });

  // -------------------------------------------------------------
  // STATS API (Derives metrics strictly from database records)
  // -------------------------------------------------------------
  app.get('/api/stats', (_req: Request, res: Response) => {
    const listings = db.getListings();
    const users = db.getUsers();
    const requests = db.getRequests();

    const availableListingsCount = listings.filter(
      (l) => (l.status === 'available' || l.status === 'partially_reserved') && l.availableQuantity > 0
    ).length;

    const participatingRestaurantsCount = users.filter(
      (u) => u.role === 'restaurant' && u.status === 'active' && u.verificationStatus === 'verified'
    ).length;

    const registeredNgosCount = users.filter(
      (u) => u.role === 'ngo' && u.status === 'active' && u.verificationStatus === 'verified'
    ).length;

    const completedPickupsCount = requests.filter((r) => r.status === 'completed').length;

    const totalPortionsRescued = requests
      .filter((r) => r.status === 'completed')
      .reduce((acc, curr) => acc + (curr.requestedQuantity || 0), 0);

    const activeRequestsCount = requests.filter((r) =>
      ['pending', 'approved', 'confirmed', 'ready_for_pickup'].includes(r.status)
    ).length;

    const totalKgRescued = requests
      .filter((r) => r.status === 'completed')
      .reduce((acc, curr) => acc + (curr.requestedQuantity || 0) * 0.8, 0);

    const mealsDistributed = totalPortionsRescued;
    const backupMealsServed = completedPickupsCount;

    const stats: PlatformStats = {
      availableListingsCount,
      participatingRestaurantsCount,
      registeredNgosCount,
      completedPickupsCount,
      totalPortionsRescued,
      activeRequestsCount,
      totalKgRescued: Math.round(totalKgRescued),
      mealsDistributed,
      backupMealsServed,
    };

    res.json({ stats });
  });

  // -------------------------------------------------------------
  // LISTINGS API
  // -------------------------------------------------------------
  app.get('/api/listings', (req: Request, res: Response) => {
    let listings = db.getListings();
    const { category, status, restaurantId, search } = req.query;

    if (category && typeof category === 'string' && category !== 'All') {
      listings = listings.filter((l) => l.category === category);
    }
    if (status && typeof status === 'string' && status !== 'all') {
      listings = listings.filter((l) => l.status === status);
    }
    if (restaurantId && typeof restaurantId === 'string') {
      listings = listings.filter((l) => l.restaurantId === restaurantId);
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      listings = listings.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.restaurantName.toLowerCase().includes(q) ||
          l.pickupAddress.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q)
      );
    }

    res.json({ listings });
  });

  app.get('/api/listings/:id', (req: Request, res: Response) => {
    const listing = db.getListingById(req.params.id);
    if (!listing) {
      res.status(404).json({ error: 'Listing not found.' });
      return;
    }
    res.json({ listing });
  });

  app.post(
    '/api/listings',
    requireAuth,
    requireRole(['restaurant', 'admin']),
    (req: Request & { user?: User }, res: Response) => {
      const {
        title,
        description,
        category,
        photoUrl,
        originalQuantity,
        unit,
        allergens,
        storageNotes,
        pickupAddress,
        pickupStartTime,
        pickupEndTime,
        pickupInstructions,
      } = req.body;

      if (!title || !description || !category || !originalQuantity || !unit || !pickupAddress) {
        res.status(400).json({ error: 'Missing required listing fields.' });
        return;
      }

      const qty = parseInt(originalQuantity, 10);
      if (isNaN(qty) || qty <= 0) {
        res.status(400).json({ error: 'Quantity must be a positive number.' });
        return;
      }

      // Check restaurant verification
      if (req.user!.role === 'restaurant' && req.user!.verificationStatus !== 'verified') {
        res.status(403).json({
          error:
            'Your restaurant account is pending verification. You can publish listings once approved by an administrator.',
        });
        return;
      }

      const now = new Date().toISOString();
      const newListing: FoodListing = {
        id: `list_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        restaurantId: req.user!.id,
        restaurantName: req.user!.organizationName || req.user!.name,
        title: title.trim(),
        description: description.trim(),
        category,
        photoUrl: photoUrl || '/src/assets/images/hero_food_rescue_1792027712579.jpg',
        originalQuantity: qty,
        availableQuantity: qty,
        unit: unit.trim(),
        estimatedWeightKg: req.body.estimatedWeightKg ? Number(req.body.estimatedWeightKg) : undefined,
        allergens: Array.isArray(allergens) ? allergens : [],
        storageNotes: storageNotes?.trim() || '',
        pickupAddress: pickupAddress.trim(),
        pickupStartTime: pickupStartTime || '17:00',
        pickupEndTime: pickupEndTime || '20:00',
        pickupInstructions: pickupInstructions?.trim() || '',
        status: 'available',
        createdAt: now,
        updatedAt: now,
      };

      db.addListing(newListing);
      res.status(201).json({ listing: newListing, message: 'Surplus food listing created successfully.' });
    }
  );

  app.patch(
    '/api/listings/:id',
    requireAuth,
    requireRole(['restaurant', 'admin']),
    (req: Request & { user?: User }, res: Response) => {
      const listing = db.getListingById(req.params.id);
      if (!listing) {
        res.status(404).json({ error: 'Listing not found.' });
        return;
      }

      if (req.user!.role === 'restaurant' && listing.restaurantId !== req.user!.id) {
        res.status(403).json({ error: 'You can only edit your own restaurant listings.' });
        return;
      }

      const updates = req.body;
      const updated = db.updateListing(listing.id, updates);
      res.json({ listing: updated, message: 'Listing updated successfully.' });
    }
  );

  // -------------------------------------------------------------
  // MENU ITEMS API (For restaurants to save standard recipes)
  // -------------------------------------------------------------
  app.get('/api/menu', requireAuth, (req: Request & { user?: User }, res: Response) => {
    const restaurantId =
      req.user!.role === 'restaurant' ? req.user!.id : (req.query.restaurantId as string);
    const menuItems = db.getMenuItems(restaurantId);
    res.json({ menuItems });
  });

  app.post(
    '/api/menu',
    requireAuth,
    requireRole(['restaurant']),
    (req: Request & { user?: User }, res: Response) => {
      const { name, description, category, photoUrl, allergens, standardPortionUnit } = req.body;
      if (!name || !category) {
        res.status(400).json({ error: 'Name and category are required.' });
        return;
      }

      const newItem: MenuItem = {
        id: `menu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        restaurantId: req.user!.id,
        name: name.trim(),
        description: description?.trim() || '',
        category,
        photoUrl: photoUrl || '/src/assets/images/bakery_sourdough_1792027712529.jpg',
        allergens: Array.isArray(allergens) ? allergens : [],
        standardPortionUnit: standardPortionUnit || 'portions',
      };

      db.addMenuItem(newItem);
      res.status(201).json({ menuItem: newItem, message: 'Menu item added to catalogue.' });
    }
  );

  app.delete(
    '/api/menu/:id',
    requireAuth,
    requireRole(['restaurant']),
    (req: Request & { user?: User }, res: Response) => {
      const success = db.deleteMenuItem(req.params.id, req.user!.id);
      if (!success) {
        res.status(404).json({ error: 'Menu item not found or unauthorized.' });
        return;
      }
      res.json({ success: true, message: 'Menu item deleted.' });
    }
  );

  // -------------------------------------------------------------
  // REQUESTS & ATOMIC RESERVATIONS STATE MACHINE
  // -------------------------------------------------------------
  app.get('/api/requests', requireAuth, (req: Request & { user?: User }, res: Response) => {
    let requests = db.getRequests();
    const user = req.user!;

    if (user.role === 'restaurant') {
      requests = requests.filter((r) => r.restaurantId === user.id);
    } else if (user.role === 'ngo' || user.role === 'user') {
      requests = requests.filter((r) => r.requesterId === user.id);
    }
    // Admin sees all

    res.json({ requests });
  });

  app.post(
    '/api/requests',
    requireAuth,
    requireRole(['ngo', 'user']),
    (req: Request & { user?: User }, res: Response) => {
      const { listingId, requestedQuantity } = req.body;
      const user = req.user!;

      if (!listingId || !requestedQuantity) {
        res.status(400).json({ error: 'Listing ID and quantity are required.' });
        return;
      }

      const qty = parseInt(requestedQuantity, 10);
      if (isNaN(qty) || qty <= 0) {
        res.status(400).json({ error: 'Requested quantity must be at least 1.' });
        return;
      }

      // If NGO, verify status
      if (user.role === 'ngo' && user.verificationStatus !== 'verified') {
        res.status(403).json({
          error:
            'Your NGO account is pending verification. Please wait for an administrator to approve your credentials before requesting food.',
        });
        return;
      }

      // Check listing existence & atomic availability check
      const listing = db.getListingById(listingId);
      if (!listing) {
        res.status(404).json({ error: 'Food listing not found.' });
        return;
      }

      if (listing.status !== 'available' && listing.status !== 'partially_reserved') {
        res.status(400).json({
          error: `This food listing is currently ${listing.status.replace('_', ' ')} and cannot accept new reservations.`,
        });
        return;
      }

      if (listing.availableQuantity < qty) {
        res.status(400).json({
          error: `Only ${listing.availableQuantity} ${listing.unit} remain available. Please adjust your requested quantity.`,
        });
        return;
      }

      // Check duplicate active request
      const existingActiveReq = db
        .getRequests()
        .find(
          (r) =>
            r.listingId === listingId &&
            r.requesterId === user.id &&
            ['pending', 'approved', 'confirmed', 'ready_for_pickup'].includes(r.status)
        );

      if (existingActiveReq) {
        res.status(400).json({
          error: 'You already have an active request for this food listing. Please check My Requests.',
        });
        return;
      }

      // Atomic inventory deduction
      const newAvail = listing.availableQuantity - qty;
      const newStatus = newAvail === 0 ? 'fully_reserved' : 'partially_reserved';
      db.updateListing(listing.id, {
        availableQuantity: newAvail,
        status: newStatus,
      });

      // Generate pickup code
      const pickupCode = `SS-${Math.floor(1000 + Math.random() * 9000)}`;
      const now = new Date().toISOString();

      const newRequest: FoodRequest = {
        id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        listingId: listing.id,
        foodTitle: listing.title,
        restaurantId: listing.restaurantId,
        restaurantName: listing.restaurantName,
        requesterId: user.id,
        requesterName: user.name,
        requesterRole: user.role as 'ngo' | 'user',
        requesterOrg: user.organizationName,
        requestedQuantity: qty,
        unit: listing.unit,
        pickupAddress: listing.pickupAddress,
        pickupWindow: `${listing.pickupStartTime} - ${listing.pickupEndTime}`,
        pickupCode,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      };

      db.addRequest(newRequest);

      // Notify Restaurant
      db.addNotification({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: listing.restaurantId,
        title: 'New Food Rescue Request',
        message: `${user.organizationName || user.name} requested ${qty} ${listing.unit} of "${listing.title}".`,
        type: 'request_created',
        relatedId: newRequest.id,
        isRead: false,
        createdAt: now,
      });

      res.status(201).json({
        request: newRequest,
        message: 'Request submitted successfully. Inventory has been temporarily reserved.',
      });
    }
  );

  // Status transitions
  app.patch(
    '/api/requests/:id/status',
    requireAuth,
    (req: Request & { user?: User }, res: Response) => {
      const { status, reason } = req.body;
      const user = req.user!;
      const request = db.getRequestById(req.params.id);

      if (!request) {
        res.status(404).json({ error: 'Request not found.' });
        return;
      }

      const listing = db.getListingById(request.listingId);
      const now = new Date().toISOString();

      // Authorization & state transition validations
      if (status === 'approved' || status === 'ready_for_pickup') {
        if (user.role !== 'restaurant' && user.role !== 'admin') {
          res.status(403).json({ error: 'Only the listing restaurant or admin can approve requests.' });
          return;
        }
        if (request.status !== 'pending' && request.status !== 'approved') {
          res.status(400).json({ error: `Cannot set status to ${status} from ${request.status}.` });
          return;
        }

        const updated = db.updateRequest(request.id, {
          status,
          updatedAt: now,
        });

        // Notify requester
        db.addNotification({
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: request.requesterId,
          title: status === 'ready_for_pickup' ? 'Food Ready for Pickup!' : 'Request Approved!',
          message:
            status === 'ready_for_pickup'
              ? `Your order for "${request.foodTitle}" is packed and ready for collection at ${request.pickupAddress}. Pickup code: ${request.pickupCode}.`
              : `Your request for "${request.foodTitle}" has been approved by ${request.restaurantName}.`,
          type: status === 'ready_for_pickup' ? 'pickup_ready' : 'request_approved',
          relatedId: request.id,
          isRead: false,
          createdAt: now,
        });

        res.json({ request: updated, message: `Request status updated to ${status}.` });
        return;
      }

      if (status === 'rejected') {
        if (user.role !== 'restaurant' && user.role !== 'admin') {
          res.status(403).json({ error: 'Only the restaurant or admin can reject requests.' });
          return;
        }
        if (request.status === 'completed' || request.status === 'rejected' || request.status === 'cancelled') {
          res.status(400).json({ error: `Cannot reject request in '${request.status}' state.` });
          return;
        }

        // Release inventory atomically
        if (listing) {
          const restoredQty = listing.availableQuantity + request.requestedQuantity;
          db.updateListing(listing.id, {
            availableQuantity: restoredQty,
            status: restoredQty >= listing.originalQuantity ? 'available' : 'partially_reserved',
          });
        }

        const updated = db.updateRequest(request.id, {
          status: 'rejected',
          rejectionReason: reason || 'Not specified',
          updatedAt: now,
        });

        db.addNotification({
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: request.requesterId,
          title: 'Request Declined',
          message: `Your request for "${request.foodTitle}" was declined by the restaurant: ${reason || 'Not specified'}.`,
          type: 'request_rejected',
          relatedId: request.id,
          isRead: false,
          createdAt: now,
        });

        res.json({ request: updated, message: 'Request rejected and inventory released.' });
        return;
      }

      if (status === 'cancelled') {
        // Can be cancelled by requester or admin
        if (user.role !== 'admin' && request.requesterId !== user.id) {
          res.status(403).json({ error: 'You can only cancel your own requests.' });
          return;
        }
        if (request.status === 'completed' || request.status === 'cancelled') {
          res.status(400).json({ error: `Request is already ${request.status}.` });
          return;
        }

        // Release inventory atomically
        if (listing) {
          const restoredQty = listing.availableQuantity + request.requestedQuantity;
          db.updateListing(listing.id, {
            availableQuantity: restoredQty,
            status: restoredQty >= listing.originalQuantity ? 'available' : 'partially_reserved',
          });
        }

        const updated = db.updateRequest(request.id, {
          status: 'cancelled',
          cancellationReason: reason || 'Cancelled by requester',
          updatedAt: now,
        });

        db.addNotification({
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: request.restaurantId,
          title: 'Request Cancelled',
          message: `${request.requesterName} cancelled their request for ${request.requestedQuantity} portions of "${request.foodTitle}". Inventory restored.`,
          type: 'system',
          relatedId: request.id,
          isRead: false,
          createdAt: now,
        });

        res.json({ request: updated, message: 'Request cancelled and inventory restored.' });
        return;
      }

      if (status === 'completed') {
        // Verification of pickup code or restaurant/admin direct mark
        if (user.role !== 'restaurant' && user.role !== 'admin') {
          res.status(403).json({ error: 'Only the restaurant or admin can confirm completed collection.' });
          return;
        }
        if (request.status === 'completed') {
          res.status(400).json({ error: 'This collection has already been confirmed as completed.' });
          return;
        }

        const updated = db.updateRequest(request.id, {
          status: 'completed',
          completedAt: now,
          updatedAt: now,
        });

        // Check if listing has zero available and all non-cancelled requests are completed
        if (listing && listing.availableQuantity === 0) {
          const otherActiveReqs = db
            .getRequests()
            .filter(
              (r) =>
                r.listingId === listing.id &&
                r.id !== request.id &&
                ['pending', 'approved', 'ready_for_pickup'].includes(r.status)
            );
          if (otherActiveReqs.length === 0) {
            db.updateListing(listing.id, { status: 'completed' });
          }
        }

        // Notify both parties
        db.addNotification({
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: request.requesterId,
          title: 'Pickup Confirmed Completed!',
          message: `Great job! Your pickup of ${request.requestedQuantity} ${request.unit} of "${request.foodTitle}" has been verified.`,
          type: 'pickup_completed',
          relatedId: request.id,
          isRead: false,
          createdAt: now,
        });

        db.addAuditLog({
          id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          actorId: user.id,
          actorName: user.name,
          actorRole: user.role,
          action: 'CONFIRM_PICKUP_COMPLETED',
          targetType: 'Request',
          targetId: request.id,
          details: `Confirmed collection of ${request.requestedQuantity} ${request.unit} for code ${request.pickupCode}.`,
          timestamp: now,
        });

        res.json({ request: updated, message: 'Pickup successfully confirmed as completed.' });
        return;
      }

      res.status(400).json({ error: `Unsupported status transition to '${status}'.` });
    }
  );

  // -------------------------------------------------------------
  // NOTIFICATIONS API
  // -------------------------------------------------------------
  app.get('/api/notifications', requireAuth, (req: Request & { user?: User }, res: Response) => {
    const notifications = db.getNotifications(req.user!.id);
    res.json({ notifications });
  });

  app.patch(
    '/api/notifications/:id/read',
    requireAuth,
    (req: Request & { user?: User }, res: Response) => {
      const success = db.markNotificationRead(req.params.id, req.user!.id);
      res.json({ success });
    }
  );

  app.post(
    '/api/notifications/read-all',
    requireAuth,
    (req: Request & { user?: User }, res: Response) => {
      const count = db.markAllNotificationsRead(req.user!.id);
      res.json({ count });
    }
  );

  // -------------------------------------------------------------
  // ADMIN API
  // -------------------------------------------------------------
  app.get(
    '/api/admin/users',
    requireAuth,
    requireRole(['admin']),
    (_req: Request, res: Response) => {
      const users = db.getUsers().map((u) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...clean } = u;
        return clean;
      });
      res.json({ users });
    }
  );

  app.patch(
    '/api/admin/users/:id/verification',
    requireAuth,
    requireRole(['admin']),
    (req: Request & { user?: User }, res: Response) => {
      const { status } = req.body;
      if (!['verified', 'rejected', 'pending'].includes(status)) {
        res.status(400).json({ error: 'Invalid verification status.' });
        return;
      }

      const target = db.getUserById(req.params.id);
      if (!target) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      const updated = db.updateUser(target.id, { verificationStatus: status });
      const now = new Date().toISOString();

      db.addNotification({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: target.id,
        title: `Verification Status Updated: ${status.toUpperCase()}`,
        message:
          status === 'verified'
            ? 'Congratulations! Your organization has been verified. You now have full operational access on Second Serve.'
            : 'Your organization verification status has been updated by an administrator.',
        type: 'verification_updated',
        relatedId: target.id,
        isRead: false,
        createdAt: now,
      });

      db.addAuditLog({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        actorId: req.user!.id,
        actorName: req.user!.name,
        actorRole: 'admin',
        action: 'UPDATE_USER_VERIFICATION',
        targetType: 'User',
        targetId: target.id,
        details: `Changed verification status of ${target.organizationName || target.name} to '${status}'.`,
        timestamp: now,
      });

      res.json({ user: updated, message: `Verification status updated to ${status}.` });
    }
  );

  app.patch(
    '/api/admin/users/:id/status',
    requireAuth,
    requireRole(['admin']),
    (req: Request & { user?: User }, res: Response) => {
      const { status } = req.body;
      if (!['active', 'suspended'].includes(status)) {
        res.status(400).json({ error: 'Invalid status.' });
        return;
      }

      const target = db.getUserById(req.params.id);
      if (!target) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      if (target.id === req.user!.id) {
        res.status(400).json({ error: 'You cannot suspend your own active administrator account.' });
        return;
      }

      const updated = db.updateUser(target.id, { status });
      const now = new Date().toISOString();

      db.addAuditLog({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        actorId: req.user!.id,
        actorName: req.user!.name,
        actorRole: 'admin',
        action: status === 'suspended' ? 'SUSPEND_USER' : 'ACTIVATE_USER',
        targetType: 'User',
        targetId: target.id,
        details: `Account ${target.email} set to ${status}.`,
        timestamp: now,
      });

      res.json({ user: updated, message: `User account is now ${status}.` });
    }
  );

  app.patch(
    '/api/admin/listings/:id/moderate',
    requireAuth,
    requireRole(['admin']),
    (req: Request & { user?: User }, res: Response) => {
      const { action, reason } = req.body;
      const listing = db.getListingById(req.params.id);

      if (!listing) {
        res.status(404).json({ error: 'Listing not found.' });
        return;
      }

      const now = new Date().toISOString();

      if (action === 'cancel') {
        const updated = db.updateListing(listing.id, { status: 'cancelled' });

        // Cancel any pending/approved requests and notify requesters
        const activeReqs = db
          .getRequests()
          .filter((r) => r.listingId === listing.id && ['pending', 'approved'].includes(r.status));

        activeReqs.forEach((r) => {
          db.updateRequest(r.id, {
            status: 'cancelled',
            cancellationReason: `Listing moderated by admin: ${reason || 'Safety/policy check'}`,
          });
          db.addNotification({
            id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            userId: r.requesterId,
            title: 'Reservation Cancelled by Moderation',
            message: `The food listing "${listing.title}" was removed by moderation. Your reservation has been cancelled.`,
            type: 'system',
            relatedId: r.id,
            isRead: false,
            createdAt: now,
          });
        });

        db.addAuditLog({
          id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          actorId: req.user!.id,
          actorName: req.user!.name,
          actorRole: 'admin',
          action: 'MODERATE_CANCEL_LISTING',
          targetType: 'FoodListing',
          targetId: listing.id,
          details: `Cancelled food listing "${listing.title}". Reason: ${reason || 'None provided'}.`,
          timestamp: now,
        });

        res.json({ listing: updated, message: 'Listing moderated and cancelled.' });
        return;
      }

      res.status(400).json({ error: 'Unsupported moderation action.' });
    }
  );

  app.get(
    '/api/admin/audit-logs',
    requireAuth,
    requireRole(['admin']),
    (_req: Request, res: Response) => {
      const auditLogs = db.getAuditLogs();
      res.json({ auditLogs });
    }
  );

  app.post('/api/admin/reset', (_req: Request, res: Response) => {
    db.resetToZero();
    res.json({ success: true, message: 'All platform listings and activity records have been reset to 0.' });
  });

  // -------------------------------------------------------------
  // VITE DEV MIDDLEWARE / STATIC ASSETS
  // -------------------------------------------------------------
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Second Serve backend & frontend server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
