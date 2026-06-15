import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import prisma from "@ruteai/database";
import crypto from "crypto";

const FLOW_API_URL = process.env.FLOW_API_URL || "https://www.flow.cl/api";
const FLOW_API_KEY = process.env.FLOW_API_KEY!;
const FLOW_SECRET_KEY = process.env.FLOW_SECRET_KEY!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function firmarParams(params: Record<string, string | number>): string {
  const stringParams: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    stringParams[key] = String(value);
  }
  
  const keys = Object.keys(stringParams).sort();
  const toSign = keys.map((k) => `${k}${stringParams[k]}`).join("");
  return crypto.createHmac("sha256", FLOW_SECRET_KEY).update(toSign).digest("hex");
}

const PLAN_MONTOS: Record<string, number> = {
  starter: 29000,
  pro: 99000,
  business: 199000,
};

const PLAN_NOMBRES: Record<string, string> = {
  starter: "RuteAI Plan Starter",
  pro: "RuteAI Plan Pro",
  business: "RuteAI Plan Business",
};

export async function POST(req: NextRequest) {
  try {
    // 1. Obtener datos del body (ahora incluye email)
    const body = await req.json() as { planId: string, email: string };
    const { planId, email } = body;
    
    if (!["starter", "pro", "business"].includes(planId)) {
      return NextResponse.json({ error: "Plan inválido. Usa: starter, pro o business" }, { status: 400 });
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    // 2. Construir commerceOrder
    const timestamp = Date.now();
    // Como ya no tenemos empresaId previo, generamos un identificador aleatorio corto
    const randomId = Math.random().toString(36).substring(2, 8);
    const commerceOrder = `ruteai-${randomId}-${timestamp}`;
    
    // 3. Preparar parámetros para Flow
    const params: Record<string, string> = {
      apiKey: FLOW_API_KEY,
      amount: String(PLAN_MONTOS[planId]),
      commerceOrder: commerceOrder,
      currency: "CLP",
      email: email, // Email proporcionado en la Landing Page
      subject: PLAN_NOMBRES[planId],
      urlConfirmation: `${APP_URL}/api/flow/confirmar`,
      urlReturn: `${APP_URL}/api/flow/retorno`,
    };

    // 6. Agregar firma
    params.s = firmarParams(params);

    console.log("[Flow/crear] Enviando a Flow:", {
      url: `${FLOW_API_URL}/payment/create`,
      commerceOrder,
      amount: params.amount,
      planId,
    });

    // 7. Enviar a Flow
    const formData = new URLSearchParams(params);
    const response = await fetch(`${FLOW_API_URL}/payment/create`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    const responseText = await response.text();
    let flowData;
    try {
      flowData = JSON.parse(responseText);
    } catch {
      console.error("[Flow/crear] Respuesta no es JSON:", responseText);
      return NextResponse.json(
        { error: "Flow respondió con un formato inválido", detalle: responseText },
        { status: 500 }
      );
    }

    // 8. Validar respuesta
    if (!response.ok || !flowData.url || !flowData.token) {
      console.error("[Flow/crear] Error de Flow:", {
        status: response.status,
        data: flowData,
      });
      
      let mensajeError = flowData.message || "Error al crear transacción";
      if (flowData.code === 401) {
        mensajeError = "Error de autenticación con Flow. Verifica tus credenciales.";
      }
      
      return NextResponse.json(
        { error: mensajeError, detalleFlow: flowData },
        { status: 400 }
      );
    }

    // 7. Buscar si la empresa ya existe por email
    let empresaId = null;
    if (email) {
      const empresa = await prisma.empresa.findUnique({ where: { email } });
      if (empresa) {
        empresaId = empresa.id;
        console.log(`[Flow/crear] Empresa existente encontrada para ${email}: ${empresaId}`);
      }
    }

    // 8. Guardar el pago en la base de datos
    try {
      await prisma.pago.create({
        data: {
          commerceOrder: commerceOrder,
          flowOrder: String(flowData.flowOrder || ""),
          planId: planId,
          monto: PLAN_MONTOS[planId],
          estado: "pendiente",
          token: flowData.token,
          empresaId: empresaId, // Asociamos el pago si la empresa ya existe
        },
      });
      console.log("[Flow/crear] ✅ Pago guardado en BD:", commerceOrder);
    } catch (dbError) {
      console.error("[Flow/crear] Error guardando pago en BD:", dbError);
      // No interrumpimos el flujo, solo logueamos
    }

    // 10. Construir URL de redirección
    const urlPago = `${flowData.url}?token=${flowData.token}`;
    
    console.log("[Flow/crear] ✅ Pago creado exitosamente:", { commerceOrder, flowOrder: flowData.flowOrder });
    
    return NextResponse.json({ 
      success: true, 
      urlPago, 
      commerceOrder,
      flowOrder: flowData.flowOrder 
    });

  } catch (error: any) {
    console.error("[Flow/crear] Error inesperado:", error);
    return NextResponse.json(
      { error: error?.message || "Error interno del servidor" }, 
      { status: 500 }
    );
  }
}