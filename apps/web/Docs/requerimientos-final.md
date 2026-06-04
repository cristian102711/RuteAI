# ✅ RouteAI — Requerimientos y Proceso de Negocio

> Especificación funcional, no funcional y flujo operacional del sistema RouteAI.

---

## 📋 Tabla de Contenidos

- [Proceso de Negocio](#-proceso-de-negocio)
- [Requerimientos Funcionales](#-requerimientos-funcionales)
- [Requerimientos No Funcionales](#-requerimientos-no-funcionales)

---

## 🔄 Proceso de Negocio

### Actores involucrados

| Actor | Rol | Interfaz |
|---|---|---|
| **Encargado** | Administra pedidos y monitorea operación | Panel web (Next.js) |
| **Repartidor** | Ejecuta entregas en terreno | App móvil (React Native) |
| **Cliente** | Recibe y sigue su pedido | Link web público |
| **Sistema IA** | Evalúa riesgo y genera alertas | API Python (interna) |

### Flujo completo de un despacho

```
┌─────────────────────────────────────────────────────────┐
│                    INICIO DEL DÍA                        │
│  Encargado carga los pedidos del día en el panel web     │
│  (dirección, cliente, producto, horario preferido)       │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│               EVALUACIÓN IA PREDICTIVA                   │
│  Sistema analiza cada pedido automáticamente:            │
│  → Historial de la dirección de entrega                  │
│  → Horario solicitado vs disponibilidad del cliente      │
│  → Condiciones de tráfico en tiempo real                 │
│  → Clima y factores externos                             │
│  → Resultado: Score de riesgo 0% a 100% por pedido       │
└─────────────────────┬───────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
   Riesgo BAJO (<40%)      Riesgo ALTO (>70%)
   Despacho normal         Alerta al encargado
          │                       │
          │                       ▼
          │              Encargado decide:
          │              → Reagendar con horario sugerido
          │              → Despachar de todas formas
          │                       │
          └───────────┬───────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│              ASIGNACIÓN Y SALIDA                         │
│  Sistema genera rutas optimizadas por repartidor         │
│  Repartidor recibe ruta asignada en app móvil            │
│  Cliente recibe link de tracking por WhatsApp/SMS        │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│               MONITOREO EN RUTA                          │
│  GPS del repartidor visible en panel en tiempo real      │
│  Sistema compara posición real vs ruta asignada          │
│                                                          │
│  → Desvío >300m: alerta inmediata al encargado           │
│  → Retraso >15min: alerta + notificación al cliente      │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                  CONFIRMACIÓN DE ENTREGA                 │
│  Repartidor saca foto del producto entregado             │
│  Receptor firma digitalmente desde la app                │
│  Sistema registra hora, ubicación y evidencia            │
│  Cliente recibe notificación de entrega exitosa          │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│               CIERRE DEL DÍA                             │
│  Reporte automático generado:                            │
│  → Pedidos completados y fallidos por repartidor         │
│  → Costo estimado real por entrega                       │
│  → Comparativa de eficiencia semanal                     │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Requerimientos Funcionales

> Los requerimientos marcados con ⚡ *Fase 2* están contemplados en la documentación pero fuera del alcance del MVP semestral.

---

### RF-01 · Gestión de Pedidos
El encargado puede crear, editar y eliminar pedidos del día ingresando dirección, nombre del cliente, producto y horario de entrega preferido. Los pedidos se almacenan en Supabase con estado inicial `pendiente`.

**Criterio de aceptación:** El encargado crea un pedido en menos de 60 segundos y este aparece inmediatamente en el panel.

---

### RF-02 · Optimización de Rutas
El sistema genera automáticamente rutas óptimas para cada repartidor considerando cantidad de pedidos, distancias y horarios, minimizando tiempo total y kilómetros recorridos mediante la API de Google Maps.

**Criterio de aceptación:** Para 10 pedidos, la ruta optimizada se calcula en menos de 3 segundos.

---

### RF-03 · Predicción IA de Fallos de Entrega
Antes de confirmar el despacho, el sistema calcula un score de riesgo (0–100%) para cada pedido basado en historial de la dirección, horario solicitado, clima y tráfico en tiempo real. Pedidos con riesgo superior al 70% generan una alerta visible con sugerencia de reagendamiento.

**Criterio de aceptación:** El score de riesgo aparece en el panel junto a cada pedido antes de confirmar el despacho.

---

### RF-04 · Detección de Desvíos y Retrasos en Ruta
Durante la ruta, el sistema compara la posición GPS del repartidor con la ruta asignada cada 10 segundos. Si se detecta un desvío mayor a 300 metros o un retraso superior a 15 minutos respecto al tiempo estimado, se genera automáticamente una alerta en el panel del encargado.

**Criterio de aceptación:** La alerta aparece en el panel en menos de 30 segundos desde que se detecta el desvío o retraso.

---

### RF-05 · Tracking GPS en Tiempo Real
El panel del encargado muestra en un mapa la ubicación de todos los repartidores activos, actualizada cada 10 segundos mediante Supabase Realtime. Cada pin muestra el nombre del repartidor y el pedido que está entregando.

**Criterio de aceptación:** La posición del repartidor en el mapa no tiene un desfase mayor a 15 segundos respecto a su ubicación real.

---

### RF-06 · Notificaciones Automáticas al Cliente
Al momento de confirmar el despacho, el cliente recibe automáticamente un mensaje de WhatsApp o SMS vía Twilio con un link de tracking personalizado. El mensaje incluye el nombre del repartidor y la hora estimada de llegada.

**Criterio de aceptación:** El cliente recibe el mensaje en menos de 60 segundos desde que el encargado confirma el despacho.

---

### RF-07 · Confirmación de Entrega con Evidencia
El repartidor debe confirmar cada entrega desde la app móvil mediante una fotografía del producto entregado y la firma digital del receptor. El registro queda vinculado al pedido con hora exacta, ubicación GPS y evidencia visual almacenada en Supabase Storage.

**Criterio de aceptación:** La foto y firma quedan accesibles desde el panel del encargado inmediatamente después de confirmar la entrega.

---

### RF-08 · Reagendamiento Inteligente
Cuando la IA detecta alto riesgo (>70%) en un pedido, el encargado puede reagendar con un horario alternativo sugerido por el sistema. La plataforma notifica automáticamente al cliente con el nuevo horario acordado.

**Criterio de aceptación:** El reagendamiento completo (cambio de hora + notificación al cliente) se realiza en menos de 3 clics desde el panel.

---

### RF-09 · Dashboard de Operaciones
El encargado dispone de un panel central con resumen en tiempo real de la jornada: pedidos pendientes, en ruta y completados, mapa con repartidores activos, alertas activas y métricas del día.

**Criterio de aceptación:** El dashboard carga todos los datos del día actual en menos de 2 segundos.

---

### RF-10 · Reportes de Costos y Eficiencia
Al cierre del día el sistema genera automáticamente un reporte con: costo estimado por entrega (kilómetros recorridos + tiempo invertido), pedidos completados y fallidos por repartidor, y comparativa de eficiencia respecto a la semana anterior.

**Criterio de aceptación:** El reporte del día está disponible antes de las 23:59 hrs sin intervención del encargado.

---

### RF-11 · Suscripción y Cobro Automático ⚡ *Fase 2*
Las empresas clientes pueden suscribirse a un plan mensual directamente desde la plataforma. El cobro se realiza automáticamente cada mes mediante Mercado Pago. El sistema gestiona activación, renovación y cancelación sin intervención manual.

---

### RF-12 · Gestión de Planes y Facturación ⚡ *Fase 2*
El encargado puede ver su plan activo, historial de pagos y descargar boletas desde su panel. Ante un pago fallido, el sistema notifica por email y suspende el acceso tras 3 días de gracia.

---

## 🛡️ Requerimientos No Funcionales

---

### RNF-01 · Rendimiento
- El cálculo de rutas optimizadas para hasta 30 pedidos simultáneos debe completarse en **menos de 3 segundos**
- El panel web debe cargar en **menos de 2 segundos** en condiciones normales de red
- Las actualizaciones de posición GPS en el mapa no deben superar **15 segundos de desfase**

---

### RNF-02 · Seguridad
- Autenticación mediante **JWT** gestionada por Supabase Auth
- Todas las comunicaciones cifradas en tránsito mediante **HTTPS**
- Roles diferenciados con permisos específicos:
  - `encargado` → acceso total al panel y datos de la empresa
  - `repartidor` → solo su ruta y pedidos asignados
  - `cliente` → solo el link de tracking de su pedido
- Fotos de entrega almacenadas en Supabase Storage con **acceso restringido por empresa**
- Variables de entorno para todas las claves API (nunca en el código fuente)

---

### RNF-03 · Disponibilidad
- Disponibilidad mínima del **99.5%** en horario operacional (7:00–22:00 hrs)
- La app móvil del repartidor debe funcionar en **modo offline básico** ante pérdida temporal de señal, sincronizando datos automáticamente al recuperar conectividad
- Los datos de ubicación GPS se almacenan localmente en el dispositivo si no hay conexión

---

### RNF-04 · Escalabilidad
- La arquitectura debe soportar el crecimiento de **5 a 500 repartidores** sin rediseño estructural
- Supabase y Vercel proveen escalabilidad automática según demanda sin configuración adicional
- El modelo de datos debe soportar **multi-empresa** desde el diseño inicial (cada empresa ve solo sus datos)

---

### RNF-05 · Compatibilidad
- **Panel web:** Chrome 100+, Safari 15+, Edge 100+
- **App móvil:** iOS 14+ y Android 10+
- **Link de tracking del cliente:** funcional en cualquier navegador móvil moderno sin instalación ni login

---

### RNF-06 · Usabilidad
- La interfaz del repartidor debe ser **operable con una sola mano** mientras conduce
- El onboarding de un nuevo repartidor debe completarse en **menos de 10 minutos**
- Las alertas críticas (desvío, retraso, riesgo alto) deben ser visibles **sin necesidad de navegar** hasta ellas
- Texto e íconos del panel del repartidor deben ser legibles a **distancia de brazo extendido** (mínimo 16px de fuente)

---

> 📅 Full Stack III — Duoc UC  
> 🔄 Versión 1.1
