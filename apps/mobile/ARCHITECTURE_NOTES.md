# Notas de Arquitectura — RouteAI Mobile

## El Patrón BFF (Backend-for-Frontend)
La arquitectura de RouteAI se basa en un **BFF centralizado** (implementado en Next.js). Este patrón es innegociable para garantizar la escalabilidad y seguridad del sistema.

### Responsabilidades del BFF
1.  **Orquestación**: Agrega respuestas de múltiples servicios (Supabase, Microservicio IA, Twilio, Mercado Pago).
2.  **Seguridad**: Valida identidades y aplica reglas de negocio antes de tocar la persistencia.
3.  **Adaptación**: Transforma los datos del dominio a formatos óptimos para el consumo móvil (ahorro de ancho de banda).

### Flujo de Datos
`Mobile App` <---> `BFF (Next.js API)` <---> `Microservicios / DB`

## Capa de Mockup (Entregable Actual)
Para este entregable, la aplicación móvil funciona en **modo aislado (mock)**:
- **Services/Stubs**: Las llamadas al BFF están simuladas mediante funciones que retornan datos estáticos (`fixtures.ts`).
- **Estado Local**: Se usa un sistema simple de estado para simular navegaciones y cambios de estado de pedidos.
- **Sin Dependencias Externas**: Los mapas y componentes visuales no requieren API Keys activas en esta fase de diseño.

## Guía de Transición a Producción
Para convertir este mockup en una aplicación funcional:
1.  Sustituir `src/services/stubs` por llamadas reales utilizando `fetch` o `axios` apuntando al endpoint del BFF.
2.  Configurar el proveedor de Auth real en `src/app/(auth)`.
3.  Implementar el tracking GPS real en `src/services/location.ts`.
4.  Activar las API Keys en `app.json` (Google Maps).
