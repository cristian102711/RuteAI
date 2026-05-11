import { signupController } from "@/modules/auth/controllers/auth.controller";
import type { NextRequest } from "next/server";

// Route → Controller → Service → Repository → Supabase
export async function POST(req: NextRequest) {
  return signupController(req);
}