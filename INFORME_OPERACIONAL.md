# 📋 Informe Operacional — RuteAI
**DSY1106 · Evaluación P3 · Awna Digital SPA**

---

## 1. 🧪 Tests Unitarios (Jest)

### Ejecutar todos los tests

```powershell
# Desde la raíz del monorepo
cd C:\Users\cristian\Desktop\RuteAI

pnpm --filter web exec jest
```

### Con reporte de cobertura (en consola)

```powershell
pnpm --filter web exec jest --coverage --coverageReporters=text
```

### Con reporte HTML (abrir en navegador)

```powershell
pnpm --filter web exec jest --coverage --coverageReporters=html

# Luego abrir el archivo:
start apps\web\coverage\index.html
```

### Resultado esperado

```
 PASS  __tests__/KPICard.test.tsx          (5 tests)
 PASS  __tests__/StatusBadge.test.tsx      (7 tests)
 PASS  __tests__/ScoreBadge.test.tsx       (11 tests)
 PASS  __tests__/NotificationBell.test.tsx (10 tests)
 PASS  __tests__/BotonesTabla.test.tsx     (9 tests)
 PASS  __tests__/businessLogic.test.ts     (27 tests)

Test Suites: 6 passed, 6 total
Tests:       69 passed, 69 total
Coverage:    61.45% ✅  (mínimo requerido: 60%)
```

> [!TIP]
> Si algún test falla por falta de mocks, verificar que existan los archivos en `apps/web/__mocks__/` (sonner.js, sweetalert2.js, next-navigation.js, next-link.js)

---

## 2. 📖 Documentación API (Swagger)

### Acceso en producción (Vercel)

| Recurso | URL |
|---------|-----|
| **Swagger UI interactivo** | https://ruteai.vercel.app/docs |
| **JSON OpenAPI 3.0** | https://ruteai.vercel.app/api/docs |

### Acceso en desarrollo local

```powershell
# Iniciar servidor local
pnpm --filter web dev

# Abrir en navegador:
# http://localhost:3000/docs
# http://localhost:3000/api/docs
```

### Endpoints documentados

| Categoría | Endpoints |
|-----------|-----------|
| **Pedidos** | `GET /api/pedidos` · `POST /api/pedidos` · `PATCH /api/pedidos/{id}/estado` |
| **Alertas** | `GET /api/alertas/count` · `PATCH /api/alertas` |
| **Evidencia** | `POST /api/evidencia` |
| **Ubicación GPS** | `POST /api/ubicacion` · `GET /api/ubicaciones` |
| **IA Scoring** | `POST /api/ai/score` |
| **Auth** | `POST /api/auth/login` · `GET /api/auth/logout` |
| **Pagos** | `POST /api/flow/crear` · `GET /api/flow/retorno` |

---

## 3. 🎬 Demo — Credenciales y Acceso

### 🏢 Cuenta Encargado (Dashboard Principal)

| Campo | Valor |
|-------|-------|
| **URL** | https://ruteai.vercel.app/dashboard |
| **Email** | micado4123@gmail.com |
| **Contraseña** | *(la que usas para Supabase — misma del registro)* |
| **Empresa** | Awna Digital SPA |
| **Plan** | Starter |

> [!IMPORTANT]
> Si el login falla, ir a https://ruteai.vercel.app/login y usar **"Continuar con Google"** con la cuenta de Gmail asociada.

---

### 📊 Datos de Demo en la DB (recién seeded)

```
📦 PEDIDOS (12 total)
  ├── 🟡 Pendientes (3): Robot Roomba, Cafetera Nespresso, Monitor LG 27"
  ├── 🔵 En ruta   (3): iPad Air (45% riesgo), Silla gamer (62%), PS5 (78% 🔴)
  ├── 🟢 Entregados (4): iPhone 15, MacBook Air, Zapatillas Nike, Smart TV
  └── 🔴 Fallidos  (2): Batidora Kitchen Aid, Bicicleta eléctrica

🚨 ALERTAS (7 total)
  ├── 5 ACTIVAS: 2 riesgo_alto · 2 retraso · 1 desvío
  └── 2 RESUELTAS (historial)

📊 GRÁFICO: 7 días de datos históricos
```

---

### 🗺️ Guión de Simulación (15 minutos)

#### Paso 1 — Dashboard (2 min)
```
URL: /dashboard
Mostrar:
  ✓ KPIs reales: "3 en ruta hoy", "4 entregados", "0 fallidos hoy"
  ✓ Gráfico semanal con 7 días de datos
  ✓ Panel "Sugerencia / Alerta IA"
  ✓ Lista "Próximas entregas"
```

#### Paso 2 — Pedidos con dropdown (3 min)
```
URL: /dashboard/pedidos
Mostrar:
  ✓ Tabla con 12 pedidos y sus estados (colorados)
  ✓ Score IA en columna "Riesgo IA" (PS5 en 78% con animación pulse)
  ✓ Filtrar por "En ruta" → muestra 3 pedidos
  ✓ Click ⋯ en PS5 (Valentina Cruz) → dropdown con 4 opciones
  ✓ Click "Marcar entregado" → estado cambia en tiempo real
```

#### Paso 3 — Crear pedido con IA (3 min)
```
URL: /dashboard/pedidos/crear
Mostrar:
  ✓ Llenar nombre: "Felipe Rojas"
  ✓ Dirección: "Av. Apoquindo 4500, Las Condes"
  ✓ Tab fuera del campo → geocodifica automáticamente (Nominatim)
  ✓ Producto: "Laptop Dell XPS"
  ✓ Crear → sistema llama microservicio IA → aparece score
```

#### Paso 4 — Centro de Incidencias (2 min)
```
URL: /dashboard/alertas
Mostrar:
  ✓ 4 KPIs: "5 abiertas", "2 retrasos", "2 resueltas", "tasa X%"
  ✓ Banner IA con sugerencia contextual
  ✓ Tabla con badges de colores por tipo
  ✓ Hover sobre fila → botones de acción aparecen
  ✓ Click "Marcar resuelta" en una alerta → desaparece del contador
  ✓ Sidebar muestra badge naranja actualizado
```

#### Paso 5 — Equipo (1 min)
```
URL: /dashboard/equipo
Mostrar:
  ✓ Lista de repartidores registrados
  ✓ Click "Invitar repartidor" → formulario de invitación por email
```

#### Paso 6 — Portal Repartidor (2 min)
```
URL: /repartidor  (abrir en móvil o en ventana estrecha del PC)
Mostrar:
  ✓ Lista de pedidos asignados al repartidor logueado
  ✓ Botón "Iniciar entrega" → activa GPS ping cada 30s
  ✓ Botón "Entregar" → abre modal de evidencia
  ✓ Foto (cámara del teléfono)
  ✓ Firma digital (canvas táctil)
  ✓ Confirmar → estado cambia a "entregado"
```

#### Paso 7 — Tracking público del cliente (1 min)
```
URL: /tracking/{id-del-pedido}
(Tomar el ID de cualquier pedido en ruta desde la tabla)
Mostrar:
  ✓ Vista pública sin login
  ✓ Nombre del cliente y estado actual
  ✓ Mapa con última ubicación GPS del repartidor
  ✓ "Este es el link que el cliente recibe por SMS"
```

#### Paso 8 — Swagger UI (1 min)
```
URL: /docs
Mostrar:
  ✓ Interfaz oscura con todos los endpoints organizados
  ✓ Expandir GET /api/pedidos → ver parámetros y respuesta
  ✓ Expandir POST /api/ai/score → "Este es el microservicio de IA"
  ✓ URL del JSON spec: /api/docs
```

---

## 4. 🚚 Portal Repartidor — Cómo acceder

### Opción A: Invitar un repartidor nuevo (recomendado para demo)

1. Ir a `/dashboard/equipo`
2. Click **"Invitar repartidor"**
3. Completar: nombre, email, teléfono, vehículo
4. Click **"Enviar invitación"**
5. El repartidor recibe email → hace click → completa registro en `/registro-repartidor`
6. Queda registrado y puede entrar a `/repartidor`

### Opción B: Crear manualmente en Supabase

```sql
-- En Supabase Studio → SQL Editor
INSERT INTO "Usuario" (id, nombre, email, rol, vehiculo, "empresaId", "createdAt")
VALUES (
  gen_random_uuid()::text,
  'Carlos Repartidor',
  'repartidor@demo.com',
  'repartidor',
  'Moto',
  '0f6e4d89-6b46-4bee-bd7e-79758c6c29a3',  -- ID de Awna Digital SPA
  NOW()
);
```

> [!NOTE]
> Para el portal del repartidor también se necesita una cuenta en Supabase Auth con ese email. Lo más fácil es usar la **Opción A** de invitación.

---

## 5. 🔄 Regenerar datos de demo

Si necesitas limpiar y recrear todos los datos de prueba:

```powershell
# Desde la raíz del proyecto
$env:DATABASE_URL="postgresql://postgres.jffypnogkvutxzwncu..."
$env:DIRECT_URL="postgresql://postgres.jffypnogkvutxzwncu..."

node packages/database/prisma/seed-demo.js
```

> [!TIP]
> El script elimina automáticamente los datos marcados con `[DEMO]` antes de crear nuevos, por lo que es seguro re-ejecutarlo.

---

## 6. 📁 Estructura de entrega para ZIP

```
RuteAI_P3_Entrega/
├── repositorios.txt              ← URLs de todos los repos
├── tests/
│   └── coverage/                 ← Reporte HTML de cobertura
│       └── index.html
├── swagger/
│   └── openapi.json              ← Descargar desde /api/docs
├── arquitectura_microservicios.md ← Diagrama Mermaid
└── README.md                     ← Documentación completa
```

### Descargar el JSON de Swagger para el ZIP

```powershell
# Con curl si lo tienes disponible:
curl https://ruteai.vercel.app/api/docs -o RuteAI_P3_Entrega/swagger/openapi.json

# O en PowerShell:
Invoke-WebRequest https://ruteai.vercel.app/api/docs -OutFile "swagger\openapi.json"
```

---

## 7. ✅ Checklist final de la evaluación P3

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| Arquitectura microservicios | ✅ | BFF + IA Service + Notif. GPS |
| API REST documentada | ✅ | `/docs` + `/api/docs` |
| Persistencia de datos | ✅ | Prisma ORM + Supabase Storage |
| Pruebas unitarias ≥60% | ✅ | 69 tests · 61.45% cobertura |
| Frontend funcional | ✅ | Dashboard + Repartidor + Tracking |
| GitHub actualizado | ✅ | `github.com/cristian102711/RuteAI` |
| Deploy en producción | ✅ | `ruteai.vercel.app` |
