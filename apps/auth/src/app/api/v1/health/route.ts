import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success:   true,
    service:   "@ruteai/auth",
    version:   "1.0.0",
    status:    "online",
    endpoints: [
      "POST /api/v1/auth/signup",
      "GET  /api/v1/users",
      "GET  /api/v1/health",
    ],
    timestamp: new Date().toISOString(),
  });
}