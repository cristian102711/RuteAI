import { NextRequest, NextResponse } from "next/server";
import prisma from "@ruteai/database";
import crypto from "crypto";
import { asignarPlan } from "../../../actions/planActions";

const FLOW_API_URL = process.env.FLOW_API_URL || "https://sandbox.flow.cl/api";
const FLOW_API_KEY = process.env.FLOW_API_KEY!;
const FLOW_SECRET_KEY = process.env.FLOW_SECRET_KEY!;

function firmarParams(params: Record<string, string>): string {
  const keys = Object.keys(params).sort();
  const toSign = keys.map((k) => `${k}${params[k]}`).join("");
  return crypto.createHmac("sha256", FLOW_SECRET_KEY).update(toSign).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    // Flow devuelve el usuario a urlReturn con un POST urlencoded
    const body = await req.formData();
    const token = body.get("token") as string;

    if (!token) {
      return NextResponse.redirect(new URL("/?error=token_faltante", req.url));
    }

    console.log("[Flow/retorno] Verificando pago con token:", token);

    // Consultamos el estado real del pago a Flow (sirve de respaldo si el webhook falló por estar en localhost)
    const params: Record<string, string> = { apiKey: FLOW_API_KEY, token };
    params.s = firmarParams(params);

    const qs = new URLSearchParams(params).toString();
    const response = await fetch(`${FLOW_API_URL}/payment/getStatus?${qs}`);
    
    if (!response.ok) {
      return NextResponse.redirect(new URL("/?error=pago_no_encontrado", req.url));
    }

    const pago = await response.json() as any;

    if (pago.status === 2) {
      // Validar si el pago ya fue procesado por el webhook
      const pagoRegistrado = await prisma.pago.findUnique({
        where: { commerceOrder: pago.commerceOrder }
      });

      if (pagoRegistrado && pagoRegistrado.estado !== "pagado") {
        console.log("[Flow/retorno] Webhook no procesó antes. Procesando ahora...");
        
        // Actualizar el estado del pago
        await prisma.pago.update({
          where: { id: pagoRegistrado.id },
          data: {
            estado: "pagado",
            pagadoEn: new Date(),
            flowOrder: String(pago.flowOrder || ""),
          },
        });

        // Determinar planId
        let planId = pagoRegistrado.planId;
        if (pago.subject.includes("Starter")) planId = "starter";
        else if (pago.subject.includes("Pro")) planId = "pro";
        else if (pago.subject.includes("Business")) planId = "business";

        // Manejar cuenta
        let empresaId = pagoRegistrado.empresaId;
        if (!empresaId) {
          const payerEmail = pago.payer || `usuario_${Date.now()}@ruteai.com`;
          let empresa = await prisma.empresa.findUnique({ where: { email: payerEmail } });
          
          if (!empresa) {
            empresa = await prisma.empresa.create({
              data: {
                nombre: `Usuario ${payerEmail.split('@')[0]}`,
                email: payerEmail,
              }
            });
            console.log(`[Flow/retorno] 🆕 Cuenta creada para: ${payerEmail}`);
          }
          empresaId = empresa.id;
          
          await prisma.pago.update({
            where: { id: pagoRegistrado.id },
            data: { empresaId }
          });
        }

        await asignarPlan(empresaId, planId);
      }

      // Redirigir a la vista bonita de éxito
      return NextResponse.redirect(new URL(`/pago-exitoso?plan=${pagoRegistrado?.planId || 'suscripcion'}`, req.url), 303);
    } else {
      // Si el pago no fue exitoso
      return NextResponse.redirect(new URL("/?error=pago_rechazado", req.url), 303);
    }
    
  } catch (error) {
    console.error("[Flow/retorno] Error:", error);
    return NextResponse.redirect(new URL("/?error=error_interno", req.url), 303);
  }
}
