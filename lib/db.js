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
            createdById: d.createdById,
            createdByUsername: d.createdByUsername,
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
  const existing = readLocalDeals();
  const map = new Map(existing.map((d) => [d.id, d]));
  dealsList.forEach((d) => map.set(d.id, d));
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
