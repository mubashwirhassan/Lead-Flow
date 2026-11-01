import mongoose from "mongoose";
import { env } from "@/lib/env";

declare global {
  // eslint-disable-next-line no-var
  var _mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
}

/** Cached MongoDB connection so hot reload / concurrent handlers reuse one client. */
export async function connectDB(): Promise<typeof mongoose> {
  if (global._mongoose?.conn) return global._mongoose.conn;
  if (!global._mongoose) global._mongoose = { conn: null, promise: null };
  if (!global._mongoose.promise) {
    global._mongoose.promise = mongoose.connect(env.DATABASE_URL, {
      dbName: undefined, // database is part of DATABASE_URL
      autoIndex: env.NODE_ENV !== "production",
    });
  }
  try {
    global._mongoose.conn = await global._mongoose.promise;
  } catch (e) {
    global._mongoose.promise = null;
    throw e;
  }
  return global._mongoose.conn;
}

export function toObjectId(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return new mongoose.Types.ObjectId(id);
}

export { Types } from "mongoose";
