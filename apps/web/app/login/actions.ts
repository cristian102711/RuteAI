"use server";

export async function logAuthEvent(data: {
  userId: string;
  email: string;
  provider: string;
  status: string;
  error?: string;
}) {
  const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3002';
  try {
    const body = {
      evento: 'iniciar_sesion',
      userId: data.userId,
      email: data.email,
      provider: data.provider,
      status: data.status,
      error: data.error,
      timestamp: new Date().toISOString(),
    };
    
    // Log to Vercel console
    console.log(`[Vercel Server Action] Enviando log a auth service:`, body);

    const response = await fetch(`${AUTH_SERVICE_URL}/api/v1/auth/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(`[Vercel Server Action] Auth service respondió con status ${response.status}`);
    }
  } catch (err) {
    console.error('[Vercel Server Action] Error al enviar log al microservicio de auth:', err);
  }
}
