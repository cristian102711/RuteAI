# Estrategia de Branching — RuteAI

## Modelo: Git Flow

RuteAI utiliza **Git Flow** como estrategia de control de versiones,
integrado con **Vercel** para despliegues automáticos por ambiente.

---

## Mapa de Ramas

```
main          ← PRODUCCIÓN (Vercel Production)
  ↑ PR aprobado por el equipo
develop       ← STAGING (Vercel Preview)
  ↑ PR aprobado por al menos 1 colaborador
feature/xxx   ← Trabajo individual (Vercel Preview por PR)
hotfix/xxx    ← Correcciones urgentes de producción
```

---

## Ramas Permanentes

| Rama | Propósito | Deploy automático |
|------|-----------|------------------|
| `main` | Código en producción. Siempre estable. Solo recibe merges desde `develop` o `hotfix/*` | ✅ Vercel Production |
| `develop` | Integración de features. Base para el trabajo del equipo | ✅ Vercel Preview (staging) |

## Ramas Temporales

| Prefijo | Cuándo usarla | Desde dónde se crea | Hacia dónde hace PR |
|---------|--------------|--------------------|--------------------|
| `feature/` | Nueva funcionalidad | `develop` | `develop` |
| `hotfix/` | Bug urgente en producción | `main` | `main` Y `develop` |
| `release/` | Preparar versión para producción | `develop` | `main` Y `develop` |

---

## Flujo Paso a Paso para Colaboradores

### Trabajar una nueva feature

```bash
# 1. Asegúrate de estar actualizado
git checkout develop
git pull origin develop

# 2. Crea tu rama de feature
git checkout -b feature/nombre-descriptivo
# Ejemplos correctos:
# feature/agregar-filtro-pedidos
# feature/mapa-tracking-realtime
# feature/ai-score-riesgo

# 3. Trabaja normalmente, commits frecuentes
git add .
git commit -m "feat: descripción corta del cambio"

# 4. Push y crear PR hacia develop
git push origin feature/nombre-descriptivo
# Abrir PR en GitHub: feature/xxx → develop
```

### Corregir un bug urgente en producción (hotfix)

```bash
# 1. Partir desde main (el código en producción)
git checkout main
git pull origin main
git checkout -b hotfix/descripcion-del-bug

# 2. Corregir el bug
git add .
git commit -m "fix: descripción del bug corregido"

# 3. PR hacia main Y develop (para que ambos queden actualizados)
git push origin hotfix/descripcion-del-bug
```

---

## Convención de Commits

Usamos **Conventional Commits** para mantener el historial legible:

| Prefijo | Cuándo usarlo | Ejemplo |
|---------|--------------|---------|
| `feat:` | Nueva funcionalidad | `feat: agregar modal de evidencia de entrega` |
| `fix:` | Corrección de bug | `fix: corregir cálculo de score de riesgo` |
| `chore:` | Mantenimiento, configs | `chore: actualizar dependencias` |
| `docs:` | Solo documentación | `docs: actualizar README con instrucciones monorepo` |
| `refactor:` | Refactorización sin cambio funcional | `refactor: extraer lógica de Prisma a Repository` |
| `test:` | Agregar o corregir tests | `test: agregar tests unitarios al módulo database` |

---

## Integración con Vercel

Vercel despliega automáticamente según la rama:

| Rama | Ambiente Vercel | URL |
|------|----------------|-----|
| `main` | Production | URL pública del proyecto |
| `develop` | Preview | URL de staging automática |
| `feature/*` | Preview | URL única por cada PR |

**Variables de entorno por ambiente:**
- **Production** (`main`): Supabase de producción, Google Maps real
- **Preview** (`develop`, `feature/*`): Puede usar mismo proyecto Supabase o uno de staging

---

## Protección de Ramas (configurar en GitHub)

Para evitar pushes directos a `main` y `develop`:

1. Ir a GitHub → Settings → Branches → Branch protection rules
2. Para `main`: Requerir PR + al menos 1 aprobación + checks de Vercel ✅
3. Para `develop`: Requerir PR + checks de Vercel ✅

---

## Ejemplo Real de Resolución de Conflicto

Durante la migración al monorepo (`feat/monorepo-migration` → `cristian`), los archivos
se movieron de rutas originales a `apps/web/*`. Git detectó los cambios como renombrados
(no como archivos eliminados + nuevos), preservando el 100% del historial de commits.

```bash
# Ejemplo de conflicto resuelto durante la migración
# app/dashboard/page.tsx → apps/web/app/dashboard/page.tsx
# Git log --follow preserva el historial completo de ambas rutas
git log --follow apps/web/app/dashboard/page.tsx
```

---

## Historial de Ramas del Proyecto

| Rama | Propósito | Estado |
|------|-----------|--------|
| `main` | Producción | ✅ Activa |
| `develop` | Staging | ✅ Activa |
| `cristian` | Rama de trabajo inicial del proyecto | 🔄 Deprecada (reemplazada por Git Flow) |
| `dev` | Rama de desarrollo anterior al monorepo | 🔄 Deprecada |
| `feat/monorepo-migration` | Migración a monorepo (PR #11) | ✅ Mergeada |

---

*RuteAI — Full Stack III, Duoc UC*
*Estrategia implementada: Mayo 2026*
