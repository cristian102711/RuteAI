# Seguridad en RouteAI Mobile

Este documento detalla la arquitectura de seguridad y el flujo de autenticación diseñado para la aplicación móvil en producción.

## 1. Autenticación y Autorización
En producción, la aplicación móvil **debe** seguir el flujo orquestado por el BFF:

- **JWT Auth**: La app móvil se autentica contra Supabase Auth (via BFF) y recibe un token JWT.
- **Bearer Token**: Todas las peticiones al BFF deben incluir el header `Authorization: Bearer <token>`.
- **Validación en BFF**: El BFF valida el token y extrae el `user_id` y `empresa_id`.
- **Cookies vs Tokens**: Mientras la web usa cookies, la app móvil usa tokens persistidos de forma segura en el dispositivo (Keychain/Keystore).

## 2. Multi-tenancy y RLS (Row Level Security)
La seguridad a nivel de datos se garantiza mediante políticas RLS en PostgreSQL:

- Cada tabla (`Pedido`, `Ruta`, `Ubicacion`, `Alerta`) tiene habilitado RLS.
- Las políticas aseguran que un usuario solo pueda leer/escribir datos donde `empresa_id` coincida con el claim del JWT.
- **BFF Enforcement**: El BFF actúa como proxy, inyectando los filtros de `empresaId` necesarios antes de consultar la base de datos o microservicios.

## 3. Almacenamiento Seguro
- Los tokens de sesión y credenciales sensibles se almacenan utilizando **SecureStore** (iOS: Keychain, Android: Keystore).
- Nunca se almacena información sensible en `AsyncStorage` en texto plano.

## 4. Comunicaciones
- Todas las peticiones viajan sobre **HTTPS**.
- Se recomienda implementar **SSL Pinning** en versiones futuras para evitar ataques Man-in-the-Middle (MITM).

## 5. Orquestación del BFF
- La app móvil **NUNCA** llama directamente a microservicios de terceros (IA, Pagos, Notificaciones).
- El BFF es el único punto de entrada, lo que permite centralizar la lógica de seguridad, logging y auditoría.
