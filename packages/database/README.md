# @ruteai/database — Esquema de Datos Compartido

## ¿Qué es?
Paquete interno del monorepo. Contiene el schema Prisma (fuente única
de verdad del modelo de datos) y el seed de datos demo.

## Tecnología
- Prisma 5 · PostgreSQL (local) / Supabase (producción)

## Equivalencia académica
| Concepto Java/Spring | Equivalente en RuteAI |
|----------------------|-----------------------|
| JPA / Hibernate | Prisma ORM |
| @Entity | model en schema.prisma |
| @Repository | Capa repository en apps/core |
| pom.xml | package.json |
| application.properties | .env por servicio |
| Migration (Flyway) | migrations/*.sql (Supabase SQL Editor) |

## Modelos principales
- Empresa · Usuario · Pedido · EventoPedido · Ruta · Ubicacion
- Alerta · ReporteCache · LogAcceso · Pago · InvitacionPendiente

## Multi-tenancy
Todos los modelos tienen empresaId. El aislamiento se garantiza en
la capa de servicio de apps/core (empresaId del JWT, nunca del body).

## Seed de datos demo
```powershell
cd packages/database
node seed-local.js
```
Crea: empresa "Mercado Libre Demo", admin@demo.com, 4 repartidores,
16 pedidos con todos los estados y escenarios SLA.

## Migraciones
Ubicación: packages/database/migrations/*.sql
Aplicadas vía Supabase SQL Editor (no se usa prisma migrate en producción).
Migración activa: 2026-06-17_sla_pedidos.sql
