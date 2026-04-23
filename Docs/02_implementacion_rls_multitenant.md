# Sesión 2: Implementación de Seguridad y Multi-tenancy

**Fecha:** 7 de Abril de 2026

## Objetivos Cumplidos

1. **Seguridad RLS (Row Level Security)** implementada y probada.
2. **Aislamiento de Datos por Empresa (Multi-tenancy)**.
3. **Flujo de Onboarding de Usuarios (Creación de Empresa)**.

## Detalles Técnicos

Para alinear la implementación real con el "Diseño de Arquitectura de Microservicios", se construyó un aislamiento de datos transaccionales, vital en un modelo SaaS (Software as a Service):

### 1. Row Level Security en Supabase

Se habilitó RLS en las tablas `Empresa`, `Usuario` y `Pedido` mediante Políticas de Postgres:

- Supabase permite leer el JWT del usuario de la sesión y compararlo.
- Se configuró la base de datos para que un UUID coincidente sea la única llave que permita consultar, crear o modificar `pedidos` de un determinado `empresaId`.
- Si el backend llegara a tener una vulnerabilidad, el "candado" final de Supabase bloquea los datos ajenos protegiendo la privacidad entre clientes.

### 2. Flujo de Onboarding 

Se insertó un nuevo comportamiento en el primer inicio de sesión:

- El usuario proveniente del Login (`auth.users`) al no tener datos en Prisma, ahora aterriza obligatoriamente en un **Formulario de Registro de Empresa**.
- El Server Action `crearEmpresaYUsuario()` ejecuta una inserción atómica de `Empresa` y `Usuario` vinculados.

### 3. Consultas Prisma Dinámicas

Se modificó `app/dashboard/page.tsx
` para utilizar al usuario logueado en las consultas backend:
- `supabase.auth.getUser()` provee el ID para validar la existencia del usuario en la base de datos pública.
- Las consultas al esquema Prisma ahoran filtran obligatoriamente bajo `where: { empresaId: miEmpresa.id }`.

## Siguientes Pasos

El sistema base ha sido asegurado. El siguiente salto es implementar el núcleo de inteligencia abordado en los requerimientos del informe:
- **Desarrollo del Microservicio Python FastAPI**.

- Sustitución de variables de riesgo estáticas/aleatorias por la evaluación de parámetros lógicos reales.
