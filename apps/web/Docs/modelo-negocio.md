# 💼 RouteAI — Modelo de Negocio

> Estrategia comercial, propuesta de valor y pasarela de pagos del proyecto RouteAI.

---

## 📋 Tabla de Contenidos

- [Propuesta de Valor](#-propuesta-de-valor)
- [Segmento de Clientes](#-segmento-de-clientes)
- [Competencia y Diferenciación](#-competencia-y-diferenciación)
- [Modelo de Ingresos](#-modelo-de-ingresos)
- [Pasarela de Pagos](#-pasarela-de-pagos)
- [Escalabilidad del Negocio](#-escalabilidad-del-negocio)

---

## 💡 Propuesta de Valor

RouteAI ofrece a empresas de reparto pequeñas lo que antes solo tenían las grandes corporaciones: **visibilidad total de su operación logística en tiempo real**, con una capa de inteligencia artificial que previene problemas antes de que ocurran.

| Sin RouteAI | Con RouteAI |
|---|---|
| Rutas planificadas a mano (30–40 min/día) | Rutas optimizadas automáticamente en segundos |
| Sin saber dónde están los repartidores | Mapa en vivo con todos los repartidores |
| Cliente llama para preguntar por su pedido | Cliente sigue su pedido desde un link |
| Entregas fallidas sin aviso previo | IA alerta el riesgo antes de despachar |
| Sin datos de costos reales | Reporte diario de eficiencia y costos |

---

## 🎯 Segmento de Clientes

### Cliente primario
Empresas pequeñas chilenas con **2 a 15 repartidores propios** que reparten productos de mediano y alto valor:

- Distribuidoras de equipos tecnológicos
- Farmacias con delivery propio
- Dark kitchens y restaurantes con flota propia
- Empresas de arriendo de equipos
- Distribuidoras de insumos médicos u oficina

### ¿Por qué este segmento?
- Son demasiado grandes para no tener sistema y demasiado pequeños para pagar soluciones enterprise
- Pagan entre $15.000 y $90.000 CLP/mes sin problema si el ROI es claro
- Alta densidad en Chile: miles de empresas con este perfil en Santiago

### Cliente secundario *(Fase 2)*
Empresas medianas con 15–50 repartidores que buscan reemplazar sistemas legacy costosos como SAP u Oracle.

---

## 🏆 Competencia y Diferenciación

### Competidores existentes

| Competidor | Fortaleza | Debilidad vs RouteAI |
|---|---|---|
| **Routific** | UX muy pulida | Sin IA predictiva, precios en USD, sin localización LATAM |
| **OptimoRoute** | Buenas rutas | Sin tracking en tiempo real potente, caro para PYMEs |
| **Circuit** | Simple de usar | Sin alertas inteligentes, sin confirmación de entrega |
| **Google Maps manual** | Gratuito | Sin gestión de pedidos ni reportes |

### Ventaja competitiva de RouteAI

> **Ningún competidor local tiene prevención de fallos con IA.** Todos reaccionan — RouteAI anticipa.

Los tres pilares diferenciadores:

1. **IA predictiva** — score de riesgo por pedido antes de despachar
2. **Detección activa** — alertas automáticas de desvíos y retrasos sin monitoreo manual
3. **Localización LATAM** — precios en CLP, interfaz en español, integración con Mercado Pago y Twilio para Chile

---

## 💰 Modelo de Ingresos

RouteAI opera bajo un modelo **SaaS de suscripción mensual por empresa**, escalado según cantidad de repartidores activos.

### Planes

| Plan | Repartidores | Precio mensual | Características |
|---|---|---|---|
| 🟢 **Starter** | Hasta 5 | $15.990 CLP | Rutas + Tracking + IA básica + 1 encargado |
| 🔵 **Pro** | Hasta 15 | $39.990 CLP | Todo Starter + Alertas + Reportes + 3 encargados |
| 🟣 **Business** | Hasta 50 | $89.990 CLP | Todo Pro + Soporte prioritario + encargados ilimitados |

### Proyección de ingresos estimada

| Clientes activos | Plan promedio | Ingreso mensual estimado |
|---|---|---|
| 10 empresas | Pro ($39.990) | ~$400.000 CLP |
| 50 empresas | Pro ($39.990) | ~$2.000.000 CLP |
| 200 empresas | Mix planes | ~$6.000.000 CLP |

### ¿Por qué suscripción mensual?
- **Ingreso recurrente y predecible** — el negocio no depende de ventas únicas
- **Alta retención** — una empresa que digitaliza su operación no vuelve al cuaderno
- **Escala sin costo marginal** — 10 o 1.000 clientes usan la misma infraestructura

---

## 💳 Pasarela de Pagos

### ¿Por qué Mercado Pago?

RouteAI integra **Mercado Pago** para gestionar cobros automáticos de suscripciones. La elección se basa en:

- ✅ Líder en pagos digitales en Chile y LATAM
- ✅ SDK oficial para Node.js / Next.js con documentación en español
- ✅ Sandbox gratuito — se puede probar sin dinero real durante el desarrollo
- ✅ Soporta tarjetas de débito, crédito y transferencia bancaria chilena
- ✅ Cobros recurrentes (suscripciones) integrados nativamente
- ✅ No requiere empresa constituida para probar en modo desarrollo

### Flujo de suscripción

```
Empresa se registra en RouteAI
        ↓
Selecciona plan (Starter / Pro / Business)
        ↓
Formulario de pago seguro de Mercado Pago (iframe)
        ↓
Mercado Pago procesa y aprueba el cobro
        ↓
Webhook notifica a RouteAI
        ↓
Supabase activa el plan de la empresa
        ↓
Email de confirmación + boleta automática
        ↓
Cobro automático en la misma fecha cada mes
```

### Código de integración — Next.js

```javascript
// app/api/pagos/crear-suscripcion/route.ts
import { MercadoPagoConfig, PreApproval } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
})

const PRECIOS = {
  starter: 15990,
  pro: 39990,
  business: 89990
}

export async function POST(req) {
  const { empresaId, plan, email } = await req.json()

  const suscripcion = await new PreApproval(client).create({
    body: {
      reason: `RouteAI Plan ${plan}`,
      payer_email: email,
      external_reference: empresaId,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: PRECIOS[plan],
        currency_id: 'CLP'
      },
      back_url: `${process.env.NEXT_PUBLIC_URL}/dashboard`,
      status: 'pending'
    }
  })

  return Response.json({ init_point: suscripcion.init_point })
}
```

### Webhook — activar plan automáticamente

```javascript
// app/api/pagos/webhook/route.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

function proximoMes() {
  const fecha = new Date()
  fecha.setMonth(fecha.getMonth() + 1)
  return fecha.toISOString()
}

export async function POST(req) {
  const { type, data } = await req.json()

  if (type === 'subscription_preapproval') {
    const { status, external_reference } = data

    if (status === 'authorized') {
      await supabase
        .from('empresas')
        .update({
          plan_activo: true,
          plan_fecha_vencimiento: proximoMes()
        })
        .eq('id', external_reference)
    }

    if (status === 'cancelled') {
      await supabase
        .from('empresas')
        .update({ plan_activo: false })
        .eq('id', external_reference)
    }
  }

  return Response.json({ ok: true })
}
```

> ⚡ **Alcance semestral:** La pasarela de pagos está planificada para **Fase 2**. Durante el MVP semestral el acceso es libre para demostración académica. La integración completa con Mercado Pago se desarrollará en la fase de escalamiento comercial.

---

## 📈 Escalabilidad del Negocio

RouteAI está diseñado para escalar sin aumentar costos proporcionalmente:

### Por qué escala bien
- **Infraestructura cloud** — Supabase y Vercel escalan automáticamente según demanda
- **Modelo SaaS** — cada nuevo cliente es casi pura ganancia (sin costo de producción por unidad)
- **Efecto de red** — mientras más empresas usan la plataforma, más datos tiene la IA para mejorar sus predicciones
- **Expansión regional** — el mismo producto funciona en cualquier ciudad o país de LATAM sin rediseño

### Hoja de ruta de crecimiento

| Etapa | Clientes objetivo | Foco |
|---|---|---|
| **MVP Semestral** | 1 empresa piloto (familiar) | Validar el producto con caso real |
| **Fase 2** | 10–30 empresas | Pagos automáticos + onboarding digital |
| **Fase 3** | 100+ empresas | Expansión a otras ciudades de Chile |
| **Fase 4** | 500+ empresas | LATAM — Perú, Colombia, México |

---

> 📅 Full Stack III — Duoc UC  
> 🔄 Versión 1.0
