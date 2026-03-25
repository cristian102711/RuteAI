# 📝 Historial de Desarrollo y Cambios
> Registro de monitoreo de modificaciones realizadas en el MVP de RouteAI.

---

## 📅 Sesión de Trabajo (Configuración Inicial y Dashboard MVP)

Durante esta sesión se solucionaron problemas de infraestructura base y se completó la primera versión del "Panel del Encargado" según el documento de contexto y requerimientos.

### 1. Configuración de Base de Datos y Supabase
- **Creación de `.env.local`**: Se agregaron las variables de entorno necesarias (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL` y `DIRECT_URL`) para conectar la aplicación a Supabase.
- **Actualización de `prisma/schema.prisma`**: Se agregó `directUrl = env("DIRECT_URL")` en el bloque de `datasource` para permitir que Prisma envíe los comandos de creación de tablas saltándose el connection pooler (Pgbouncer) de Supabase.
- **Sincronización de Base de Datos**: Se ejecutó `npx prisma db push` para crear físicamente las tablas (`Empresa`, `Usuario`, `Pedido`) en Supabase.
- **Dato Semilla (Dummy)**: Se inyectó una empresa de prueba inicial ("Mi Empresa Demo") vía script para permitir el renderizado exitoso del Dashboard.

### 2. Panel del Encargado (Visión General)
- **`app/dashboard/page.tsx`**: Se rediseñó el layout para verse como un software empresarial.
  - Se agregaron **4 tarjetas superiores de estadísticas** (Total Pedidos, Pendientes, Entregados, Riesgo elevado).
  - Se modificó la cuadrícula (grid) para soportar el formulario, el mapa y la lista de pedidos.

### 3. Gestión de Repartidores (Asignación)
Para cumplir con el CRUD de usuarios y pedidos:
- **`app/dashboard/actions.ts`**: Se crearon las funciones `agregarRepartidor` (para crear el perfil temporalmente en BD) y `asignarRepartidor` (para vincular un pedido a un conductor mediante actualización).
- **`app/dashboard/components/FormCrearRepartidor.tsx`**: Nuevo componente con formulario para ingresar nombre y correo del repartidor.
- **`app/dashboard/page.tsx`**: Se integró el listado del "Equipo de Reparto" para ver a todos los conductores ingresados.
- **`app/dashboard/components/FilaPedido.tsx`**: Se añadió un `<select>` desplegable condicional que permite al Encargado asignar un Pedido a un Repartidor (y la fila se actualiza mostrando una etiqueta azul con el encargado designado).

### 4. Mapa de Tracking y React Leaflet (Alternativa Gratuita a Google)
Para evitar el bloqueo de costos de Google Cloud durante la fase MVP, se integró cartografía Open Source:
- **Instalación**: Se integraron las librerías `leaflet` y `react-leaflet`.
- **`app/dashboard/components/MapaTracking.tsx`**: 
  - Se creó un mapa interactivo con estética *"Dark Mode"* futurista ideal para RouteAI.
  - Se definieron pines personalizados para la "Bodega Central" y el "Repartidor".
  - **Diferenciador Logístico (Rutas Reales)**: Se implementó un algoritmo Fetch a la API abierta de **OSRM (OpenStreetMap Routing Machine)** que calcula una ruta de navegación calle a calle y dibuja una `<Polyline>` punteada verde conectando la bodega con la posición del camión sin necesidad de cobrar claves API de Google.
- **`app/dashboard/components/MapaWrapper.tsx`**: Un intermediario creado para cargar el mapa estrictamente del lado del Cliente y evitar el conflicto `ssr: false` de Next.js App Router en el archivo de servidor `page.tsx`.
