# RouteAI - Sistema de Gestión Logística Inteligente 🚚✨

RouteAI es una plataforma moderna para el seguimiento y gestión de despachos de equipos tecnológicos, diseñada para optimizar la logística mediante inteligencia de datos y una experiencia de usuario de alto nivel.

## 🚀 Características Principales
- **Seguridad**: Autenticación segura mediante **Supabase Auth**.
- **Dashboard**: Interfaz oscura premium con navegación fluida y reactiva.
- **Gestión de Pedidos (CRUD)**: Creación, lectura, edición y eliminación de pedidos en tiempo real.
- **UX**: Notificaciones animadas persistentes con **Sonner** y ventanas de confirmación asíncronas con **SweetAlert2**.
- **Infraestructura**: Integración con PostgreSQL vía **Prisma ORM**.

## 🛠️ Stack Tecnológico
- **Frontend**: Next.js 15+ (App Router), React 19, Tailwind CSS.
- **Backend**: Next.js Server Actions, Prisma.
- **Base de Datos**: PostgreSQL (Supabase).
- **Iconografía**: Lucide React.
- **Librerías UX**: Sonner, SweetAlert2.

## 📦 Instalación y Uso

1. **Clonar el repositorio**:
   ```bash
   git clone <URL_REPOS_EN_GITHUB>
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**:
   Crea un archivo `.env` en la raíz con:
   ```env
   DATABASE_URL="tu_url_de_prisma"
   NEXT_PUBLIC_SUPABASE_URL="tu_url_de_supabase"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="tu_anon_key"
   ```

4. **Correr en local**:
   ```bash
   npm run dev
   ```

## ☁️ Deployment en Vercel

Este proyecto está preparado para el despliegue automático en Vercel:
1. Conecta tu repositorio de GitHub a Vercel.
2. Agrega las variables de entorno (`DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
3. Vercel detectará el framework Next.js automáticamente y hará el despliegue en cada `git push`.

---
*Desarrollado para la optimización logística de Awna Digital.*
