import { NextRequest, NextResponse } from "next/server";
import prisma from "@ruteai/database";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { asignarPlan } from "../../../actions/planActions";

const FLOW_API_URL = process.env.FLOW_API_URL || "https://www.flow.cl/api";
const FLOW_API_KEY = process.env.FLOW_API_KEY!;
const FLOW_SECRET_KEY = process.env.FLOW_SECRET_KEY!;

function firmarParams(params: Record<string, string>): string {
  const keys = Object.keys(params).sort();
  const toSign = keys.map((k) => `${k}${params[k]}`).join("");
  return crypto.createHmac("sha256", FLOW_SECRET_KEY).update(toSign).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    // Flow envía el token como form-urlencoded
    const body = await req.formData();
    const token = body.get("token") as string;

    if (!token) {
      console.error("[Flow/confirmar] Token no recibido");
      return NextResponse.json({ error: "Token requerido" }, { status: 400 });
    }

    console.log("[Flow/confirmar] Token recibido:", token);

    // Consultar estado a Flow
    const params: Record<string, string> = {
      apiKey: FLOW_API_KEY,
      token: token,
    };
    params.s = firmarParams(params);

    const qs = new URLSearchParams(params).toString();
    const url = `${FLOW_API_URL}/payment/getStatus?${qs}`;
    
    console.log("[Flow/confirmar] Consultando URL:", url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Flow/confirmar] Error HTTP:", response.status, errorText);
      return new NextResponse("OK", { status: 200 });
    }
    
    const pago = await response.json() as {
      status: number;        // 1=pendiente, 2=pagado, 3=rechazado, 4=anulado
      commerceOrder: string;
      amount: number;
      subject: string;
      flowOrder?: number;
      payer?: string;
    };
    
    console.log("[Flow/confirmar] Estado recibido:", JSON.stringify(pago, null, 2));

    // Buscar el pago en nuestra BD por commerceOrder
    const pagoRegistrado = await prisma.pago.findUnique({
      where: { commerceOrder: pago.commerceOrder },
      include: { empresa: true },
    });

    if (!pagoRegistrado) {
      console.error("[Flow/confirmar] Pago no encontrado en BD:", pago.commerceOrder);
      return new NextResponse("OK", { status: 200 });
    }

    // status 2 = Pagado exitosamente
    if (pago.status === 2) {
      // Actualizar el registro del pago
      await prisma.pago.update({
        where: { id: pagoRegistrado.id },
        data: {
          estado: "pagado",
          pagadoEn: new Date(),
          flowOrder: String(pago.flowOrder || ""),
        },
      });

      // Determinar el plan desde subject o desde el pago registrado
      let planId = pagoRegistrado.planId;
      if (pago.subject.includes("Starter")) planId = "starter";
      else if (pago.subject.includes("Pro")) planId = "pro";
      else if (pago.subject.includes("Business")) planId = "business";

      // Manejar la creación de cuenta si es una compra anónima (empresaId es null)
      let empresaId = pagoRegistrado.empresaId;
      
      if (!empresaId) {
        const payerEmail = pago.payer || `usuario_${Date.now()}@ruteai.com`;
        
        // Buscar si ya existe la empresa por email
        let empresa = await prisma.empresa.findUnique({
          where: { email: payerEmail }
        });
        
        // Si no existe, crearla automáticamente
        if (!empresa) {
          empresa = await prisma.empresa.create({
            data: {
              nombre: `Usuario ${payerEmail.split('@')[0]}`,
              email: payerEmail,
            }
          });
          console.log(`[Flow/confirmar] 🆕 Cuenta creada automáticamente para: ${payerEmail}`);
        }
        
        empresaId = empresa.id;
        
        // Ligar el pago a la empresa
        await prisma.pago.update({
          where: { id: pagoRegistrado.id },
          data: { empresaId: empresaId }
        });
      }

      // Asignar el plan a la empresa (actualiza fechas y estado)
      await asignarPlan(empresaId, planId);

      revalidatePath("/dashboard"); // Cambiado a /dashboard ya que /dashboard/planes se eliminará
      console.log(`[Flow/confirmar] ✅ Plan actualizado a '${planId}' para empresa ${empresaId}`);
      
    } else if (pago.status === 3) {
      // Pago rechazado
      await prisma.pago.update({
        where: { id: pagoRegistrado.id },
        data: { estado: "rechazado" },
      });
      console.log(`[Flow/confirmar] ❌ Pago rechazado: ${pago.commerceOrder}`);
      
    } else if (pago.status === 4) {
      // Pago anulado
      await prisma.pago.update({
        where: { id: pagoRegistrado.id },
        data: { estado: "anulado" },
      });
      console.log(`[Flow/confirmar] ⚠️ Pago anulado: ${pago.commerceOrder}`);
    } else {
      console.log(`[Flow/confirmar] Pago aún pendiente, status=${pago.status}`);
    }
    
    // Flow requiere respuesta 200
    return new NextResponse("OK", { status: 200 });
    
  } catch (error: any) {
    console.error("[Flow/confirmar] Error:", error);
    // Devolver 200 para que Flow no reintente
    return new NextResponse("OK", { status: 200 });
  }
}