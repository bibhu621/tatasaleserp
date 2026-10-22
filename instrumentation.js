export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { connectDB, seedDefaultAdmin } = await import("@/lib/db");
    const db = await connectDB();
    if (db) {
      await seedDefaultAdmin();
    }
  }
}
