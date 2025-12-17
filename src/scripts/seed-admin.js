require("dotenv").config();
const { connectMongo } = require("../db/mongoose");
const { User } = require("../models/user.model");
const { hashPassword } = require("../lib/auth");

async function run() {
  await connectMongo();
  const email = "admin@shoply.local";
  const exists = await User.findOne({ email }).lean();
  if (exists) { console.log("Admin existed"); process.exit(0); }
  const passwordHash = await hashPassword("admin123");
  const user = await User.create({ name: "Admin", email, passwordHash, role: "admin" });
  console.log("Created admin:", user.email);
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });