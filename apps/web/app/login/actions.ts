"use server";

export async function logAuthEvent(data: {
  userId: string;
  email: string;
  provider: string;
  status: string;
  error?: string;
}) {
  const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://ruteai-auth.vercel.app' 
      : 'http://localhost:3002');
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
    console.log(`[Vercel Server Action] Enviando log a auth service en ${AUTH_SERVICE_URL}:`, body);

    // Agregamos AbortSignal.timeout para evitar colgar la ejecución de Next.js en producción
    const response = await fetch(`${AUTH_SERVICE_URL}/api/v1/auth/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(2000), // Evita bloqueos en Vercel si el servicio no está disponible
    });

    if (!response.ok) {
      console.error(`[Vercel Server Action] Auth service respondió con status ${response.status}`);
    }
  } catch (err) {
    console.error('[Vercel Server Action] Error o Timeout al enviar log al microservicio de auth:', err);
  }
}

