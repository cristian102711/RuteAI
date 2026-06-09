import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/repartidor/login", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
}
