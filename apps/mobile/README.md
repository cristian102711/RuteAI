# RuteAI Mobile

App React Native para **repartidores** — Placeholder, en desarrollo.

## Estado: 🚧 En desarrollo

### Funcionalidades planificadas
- [ ] Login con Supabase Auth
- [ ] Ver rutas asignadas del día en mapa
- [ ] GPS tracking en tiempo real → Supabase Realtime
- [ ] Foto y firma de entrega (Supabase Storage)
- [ ] Marcar pedido como `entregado` o `fallido`
- [ ] Push notifications de alertas

### Stack previsto
- React Native + Expo SDK 51
- `@ruteai/shared-types` — tipos compartidos con apps/web
- `@supabase/supabase-js` — Auth + Realtime
- React Query — estado del servidor

### Cómo arrancar (cuando esté implementado)
```bash
pnpm --filter @ruteai/mobile dev
```
