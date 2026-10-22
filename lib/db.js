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

// Auto-seed default admin
export async function seedDefaultAdmin() {
  const defaultUsername = (process.env.DEFAULT_ADMIN_USERNAME || "admin").toLowerCase();
  const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || "Admin@123";

  const db = await connectDB();
  if (db) {
    const existing = await User.findOne({ username: defaultUsername });
    if (!existing) {
      const hashedPassword = await hashPassword(defaultPassword);
      await User.create({
        username: defaultUsername,
        password: hashedPassword,
        name: "System Administrator",
        role: "admin",
        branch: "Sasaram",
        isActive: true,
      });
      console.log(`[MongoDB Atlas] Seeded default admin: ${defaultUsername}`);
    }
  } else {
    // Local fallback store
    const users = readLocalUsers();
    const existing = users.find((u) => u.username === defaultUsername);
    if (!existing) {
      const hashedPassword = await hashPassword(defaultPassword);
      users.push({
        id: "usr_admin",
        username: defaultUsername,
        password: hashedPassword,
        name: "System Administrator",
        role: "admin",
        branch: "Sasaram",
        isActive: true,
        createdAt: new Date().toISOString(),
      });
      writeLocalUsers(users);
      console.log(`[Local Store] Seeded default admin: ${defaultUsername}`);
    }
  }
}

// User repository operations
export async function findUserByUsername(username) {
  await seedDefaultAdmin();
  const normalized = username.toLowerCase().trim();
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
    if (existing) throw new Error("Username already taken");
    return User.create({
      username: normalized,
      password: hashedPassword,
      name,
      role,
      branch: branch || "Sasaram",
      isActive: true,
    });
  }

  const users = readLocalUsers();
  if (users.find((u) => u.username === normalized)) {
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

export async function deleteUser(id) {
  const db = await connectDB();
  if (db) {
    return User.findByIdAndDelete(id);
  }
  let users = readLocalUsers();
  users = users.filter((u) => u.id !== id && u._id !== id);
  writeLocalUsers(users);
  return true;
}

// Deals repository operations
export async function fetchDeals(filter = {}) {
  const db = await connectDB();
  if (db) {
    const docs = await Deal.find(filter).sort({ updatedAt: -1 });
    return docs.map((d) => d.data);
  }
  return readLocalDeals();
}

export async function saveDeals(dealsList) {
  const db = await connectDB();
  if (db) {
    const ops = dealsList.map((d) => ({
      updateOne: {
        filter: { dealId: d.id },
        update: {
          $set: {
            dealId: d.id,
            branch: d.branch,
            status: d.status,
            createdBy: d.createdBy,
            data: d,
          },
        },
        upsert: true,
      },
    }));
    if (ops.length > 0) {
      await Deal.bulkWrite(ops);
    }
    return dealsList;
  }
  writeLocalDeals(dealsList);
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
