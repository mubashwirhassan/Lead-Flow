// One-time admin seed: creates the first Admin from env vars. All other users
// come from invitations created inside the website (spec section 3).
// Run: DATABASE_URL=... ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run seed
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../src/models/user";
import { CompanySettings, Agent } from "../src/models/misc";
import { LeadSource } from "../src/models/leadSource";

async function main() {
  const url = process.env.DATABASE_URL;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!url || !email || !password) {
    console.error("DATABASE_URL, ADMIN_EMAIL and ADMIN_PASSWORD are required.");
    process.exit(1);
  }
  await mongoose.connect(url);

  // Default company settings (single record)
  if ((await CompanySettings.countDocuments()) === 0) {
    await CompanySettings.create({
      companyName: process.env.APP_NAME || "My Company",
      timezone: "Asia/Dhaka",
      currency: "BDT",
    });
    console.log("created default company_settings");
  }

  // Default lead sources (WEBSITE / MANUAL / API)
  for (const s of [
    { name: "Website", type: "WEBSITE", isActive: true },
    { name: "Manual", type: "MANUAL", isActive: true },
    { name: "API", type: "API", isActive: true },
  ]) {
    if (!(await LeadSource.findOne({ name: s.name }))) {
      await LeadSource.create(s);
    }
  }
  console.log("lead_sources ensured");

  // First admin: only created by this seed, never via web routes.
  const lower = email.toLowerCase();
  if (await User.findOne({ email: lower })) {
    console.log("Admin " + email + " already exists; nothing to do.");
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await User.create({
      name: process.env.ADMIN_NAME || "Admin",
      email: lower,
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    });
    await Agent.create({ userId: admin._id, department: "Sales", designation: "Administrator" });
    console.log("Admin " + email + " created with role ADMIN and status ACTIVE.");
  }

  await mongoose.connection.close();
  process.exit(0);
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
