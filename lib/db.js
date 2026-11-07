import mongoose from "mongoose";
import User from "@/models/User";
import Deal from "@/models/Deal";
import { hashPassword } from "@/lib/auth";
import fs from "fs";
import path from "path";

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// Local fallback persistence file (when MONGODB_URI is not set yet)
const DATA_DIR = path.join(process.cwd(), ".data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const DEALS_FILE = path.join(DATA_DIR, "deals.json");

function ensureLocalStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readLocalUsers() {
  ensureLocalStore();
  if (fs.existsSync(USERS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
    } catch {
      return [];
    }
  }
  return [];
}

function writeLocalUsers(users) {
  ensureLocalStore();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

function readLocalDeals() {
  ensureLocalStore();
  if (fs.existsSync(DEALS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DEALS_FILE, "utf-8"));
    } catch {
      return [];
    }
  }
  return [];
}

function writeLocalDeals(deals) {
  ensureLocalStore();
  fs.writeFileSync(DEALS_FILE, JSON.stringify(deals, null, 2), "utf-8");
}

// Connection listeners
if (!global.__mongoInitialized) {
  global.__mongoInitialized = true;
  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ [MongoDB] Disconnected from database.");
  });
  mongoose.connection.on("reconnected", () => {
    console.log("🔄 [MongoDB] Reconnected to database.");
  });
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI || MONGODB_URI;
  if (!uri) {
    console.warn("⚠️ [MongoDB] MONGODB_URI is not set in environment variables. Using local store.");
    return null;
  }
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };
    console.log("⏳ [MongoDB] Connecting to MongoDB...");
    cached.promise = mongoose
      .connect(uri, opts)
      .then((m) => {
        const dbName = m.connection.name || "default";
        const host = m.connection.host || "Atlas";
        console.log(`\x1b[32m%s\x1b[0m`, `✅ [MongoDB] Connected successfully to database: "${dbName}" (${host})`);
        return m;
      })
      .catch((err) => {
        console.error(`\x1b[31m%s\x1b[0m`, `❌ [MongoDB] Connection error: ${err.message}`);
        throw err;
      });
  }
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    console.warn("MongoDB Atlas connection failed, using local store:", err.message);
    return null;
  }
}

// Auto-seed default Super Admin and Admin
export async function seedDefaultAdmin() {
  const defaultAdminUsername = (process.env.DEFAULT_ADMIN_USERNAME || "admin").toLowerCase();
  const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "admin@123";

  const db = await connectDB();
  if (db) {
    // 1. Seed superadmin if not present
    const existingSuper = await User.findOne({ username: "superadmin" });
    if (!existingSuper) {
      const superHashed = await hashPassword(defaultAdminPassword);
      await User.create({
        username: "superadmin",
        password: superHashed,
        name: "Master Super Admin",
        role: "superadmin",
        branch: "Sasaram",
        isActive: true,
        credentialsDeleted: false,
      });
      console.log(`[MongoDB Atlas] Seeded default superadmin: superadmin`);
    }

    // 2. Seed regular admin if not present
    const existingAdmin = await User.findOne({ username: defaultAdminUsername });
    if (!existingAdmin) {
      const adminHashed = await hashPassword(defaultAdminPassword);
      await User.create({
        username: defaultAdminUsername,
        password: adminHashed,
        name: "System Administrator",
        role: "admin",
        branch: "Sasaram",
        isActive: true,
        credentialsDeleted: false,
      });
      console.log(`[MongoDB Atlas] Seeded default admin: ${defaultAdminUsername}`);
    }
  } else {
    // Local fallback store
    const users = readLocalUsers();

    if (!users.find((u) => u.username === "superadmin")) {
      const superHashed = await hashPassword(defaultAdminPassword);
      users.push({
        id: "usr_superadmin",
        username: "superadmin",
        password: superHashed,
        name: "Master Super Admin",
        role: "superadmin",
        branch: "Sasaram",
        isActive: true,
        credentialsDeleted: false,
        createdAt: new Date().toISOString(),
      });
      console.log(`[Local Store] Seeded default superadmin: superadmin`);
    }

    if (!users.find((u) => u.username === defaultAdminUsername)) {
      const adminHashed = await hashPassword(defaultAdminPassword);
      users.push({
        id: "usr_admin",
        username: defaultAdminUsername,
        password: adminHashed,
        name: "System Administrator",
        role: "admin",
        branch: "Sasaram",
        isActive: true,
        credentialsDeleted: false,
        createdAt: new Date().toISOString(),
      });
      console.log(`[Local Store] Seeded default admin: ${defaultAdminUsername}`);
    }

    writeLocalUsers(users);
  }
}

// User repository operations
export async function findUserByUsername(username) {
  await seedDefaultAdmin();
  const normalized = (username || "").toLowerCase().trim();
  const db = await connectDB();

  if (db) {
    return User.findOne({ username: normalized });
  }

  const users = readLocalUsers();
  return users.find((u) => u.username === normalized) || null;
}

export async function createUser({ username, password, name, role, branch }) {
  const normalized = username.toLowerCase().trim();
  const hashedPassword = await hashPassword(password);
  const db = await connectDB();

  if (db) {
    const existing = await User.findOne({ username: normalized });
    if (existing) {
      if (existing.credentialsDeleted) {
        // Re-activating a previously deactivated account profile
        existing.password = hashedPassword;
        existing.name = name;
        existing.role = role;
        existing.branch = branch || "Sasaram";
        existing.isActive = true;
        existing.credentialsDeleted = false;
        existing.deletedAt = undefined;
        await existing.save();
        return existing;
      }
      throw new Error("Username already taken");
    }
    return User.create({
      username: normalized,
      password: hashedPassword,
      name,
      role,
      branch: branch || "Sasaram",
      isActive: true,
      credentialsDeleted: false,
    });
  }

  const users = readLocalUsers();
  const existingIdx = users.findIndex((u) => u.username === normalized);
  if (existingIdx !== -1) {
    if (users[existingIdx].credentialsDeleted) {
      users[existingIdx].password = hashedPassword;
      users[existingIdx].name = name;
      users[existingIdx].role = role;
      users[existingIdx].branch = branch || "Sasaram";
      users[existingIdx].isActive = true;
      users[existingIdx].credentialsDeleted = false;
      delete users[existingIdx].deletedAt;
      writeLocalUsers(users);
      return users[existingIdx];
    }
    throw new Error("Username already taken");
  }

  const newUser = {
    id: "usr_" + Date.now().toString(36),
    username: normalized,
    password: hashedPassword,
    name,
    role,
    branch: branch || "Sasaram",
    isActive: true,
    credentialsDeleted: false,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  writeLocalUsers(users);
  return newUser;
}

export async function getAllUsers() {
  await seedDefaultAdmin();
  const db = await connectDB();

  if (db) {
    return User.find({}, { password: 0 }).sort({ createdAt: -1 });
  }

  const users = readLocalUsers();
  return users.map(({ password, ...u }) => u);
}

// Requirement 2: Admin deletes user -> data is NOT deleted, only login credentials are deleted
export async function deleteUserCredentials(id) {
  const db = await connectDB();
  const timestamp = new Date().toISOString();

  if (db) {
    const updated = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          password: "",
          isActive: false,
          credentialsDeleted: true,
          deletedAt: timestamp,
        },
      },
      { new: true }
    );
    return updated;
  }

  const users = readLocalUsers();
  const target = users.find((u) => u.id === id || u._id === id);
  if (target) {
    target.password = "";
    target.isActive = false;
    target.credentialsDeleted = true;
    target.deletedAt = timestamp;
    writeLocalUsers(users);
    return target;
  }
  return null;
}

// Backwards-compatible alias
export async function deleteUser(id) {
  return deleteUserCredentials(id);
}

// Requirement 2: Admin can reset anyone's password from console
export async function resetUserPassword(id, newPassword) {
  const hashedPassword = await hashPassword(newPassword);
  const timestamp = new Date().toISOString();
  const db = await connectDB();

  if (db) {
    const updated = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          password: hashedPassword,
          isActive: true,
          credentialsDeleted: false,
          passwordResetAt: timestamp,
        },
      },
      { new: true }
    );
    return updated;
  }

  const users = readLocalUsers();
  const target = users.find((u) => u.id === id || u._id === id);
  if (target) {
    target.password = hashedPassword;
    target.isActive = true;
    target.credentialsDeleted = false;
    target.passwordResetAt = timestamp;
    writeLocalUsers(users);
    return target;
  }
  return null;
}

export async function updateUser(id, updates) {
  const db = await connectDB();
  if (db) {
    return User.findByIdAndUpdate(id, { $set: updates }, { new: true });
  }
  const users = readLocalUsers();
  const target = users.find((u) => u.id === id || u._id === id);
  if (target) {
    Object.assign(target, updates);
    writeLocalUsers(users);
    return target;
  }
  return null;
}

// Deals repository operations
export async function fetchDeals(filter = {}) {
  const db = await connectDB();
  if (db) {
    const docs = await Deal.find(filter).sort({ updatedAt: -1 }).lean();
    return docs.map((d) => {
      const dealId = d.dealId || d.data?.id || d.data?.dealId || String(d._id);
      const data = d.data || {};
      return {
        ...data,
        id: dealId,
        dealId,
        branch: data.branch || d.branch || "Sasaram",
        status: data.status || d.status || "draft",
        createdBy: data.createdBy || d.createdBy,
        createdById: data.createdById || d.createdById,
        createdByUsername: data.createdByUsername || d.createdByUsername,
      };
    });
  }
  return readLocalDeals();
}

export async function saveDeals(dealsList) {
  const db = await connectDB();
  if (db) {
    const validDeals = (dealsList || []).filter(d => d && (d.id || d.dealId));
    const ops = validDeals.map((d) => {
      const dealId = String(d.id || d.dealId);
      const cleanData = JSON.parse(JSON.stringify(d));
      cleanData.id = dealId;
      cleanData.dealId = dealId;
      return {
        updateOne: {
          filter: { dealId },
          update: {
            $set: {
              dealId,
              branch: cleanData.branch || "Sasaram",
              status: cleanData.status || "draft",
              createdBy: cleanData.createdBy || "Sales",
              createdById: cleanData.createdById || "",
              createdByUsername: cleanData.createdByUsername || "",
              data: cleanData,
            },
          },
          upsert: true,
        },
      };
    });
    if (ops.length > 0) {
      await Deal.bulkWrite(ops, { ordered: false });
    }
    return validDeals;
  }
  const existing = readLocalDeals();
  const map = new Map(existing.map((d) => [d.id || d.dealId, d]));
  (dealsList || []).forEach((d) => {
    if (d && (d.id || d.dealId)) {
      const id = d.id || d.dealId;
      map.set(id, { ...d, id, dealId: id });
    }
  });
  const merged = Array.from(map.values());
  writeLocalDeals(merged);
  return dealsList;
}

export async function removeDeal(dealId) {
  const db = await connectDB();
  if (db) {
    await Deal.deleteOne({ dealId });
    return true;
  }
  let deals = readLocalDeals();
  deals = deals.filter((d) => d.id !== dealId);
  writeLocalDeals(deals);
  return true;
}

export async function searchCustomerByPan(panQuery) {
  if (!panQuery || typeof panQuery !== "string") return [];
  const cleanPan = panQuery.trim().toUpperCase();
  if (!cleanPan) return [];

  const db = await connectDB();
  if (db) {
    const escaped = cleanPan.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const docs = await Deal.find({
      "data.customer.pan": { $regex: new RegExp(escaped, "i") },
    })
      .sort({ updatedAt: -1 })
      .limit(10);

    const matches = [];
    const seenPans = new Set();
    for (const d of docs) {
      const cust = d.data?.customer;
      if (cust && cust.pan) {
        const panKey = cust.pan.trim().toUpperCase();
        if (!seenPans.has(panKey)) {
          seenPans.add(panKey);
          matches.push({
            customer: cust,
            dealId: d.dealId || d.data?.id,
            branch: d.branch,
            updatedAt: d.updatedAt,
          });
        }
      }
    }
    return matches;
  }

  const deals = readLocalDeals();
  const matches = [];
  const seenPans = new Set();
  const sorted = deals.slice().reverse();
  for (const d of sorted) {
    const cust = d.customer;
    if (cust && cust.pan && cust.pan.toUpperCase().includes(cleanPan)) {
      const panKey = cust.pan.trim().toUpperCase();
      if (!seenPans.has(panKey)) {
        seenPans.add(panKey);
        matches.push({
          customer: cust,
          dealId: d.id,
          branch: d.branch,
          updatedAt: d.createdAt,
        });
      }
    }
  }
  return matches;
}
