-- RF-10: Activar CRON diario para generar reportes a las 00:05 UTC
-- Ejecutar en: Supabase Dashboard → SQL Editor

-- 1. Primero activar la extensión pg_cron (si no está activa)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Crear el job CRON (eliminar si ya existía para evitar duplicados)
SELECT cron.unschedule('daily-report') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'daily-report'
);

SELECT cron.schedule(
  'daily-report',
  '5 0 * * *',
  $$
    SELECT net.http_post(
      url      := 'https://jffypnogkvutxzwncuhd.supabase.co/functions/v1/daily-report',
      headers  := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
      ),
      body     := '{}'::jsonb
    )
  $$
);

-- 3. Verificar que quedó registrado
SELECT jobid, jobname, schedule, active FROM cron.job;
