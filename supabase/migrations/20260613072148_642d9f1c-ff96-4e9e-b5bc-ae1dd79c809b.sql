
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE
  base_url text := 'https://project--37a86164-149b-4ec6-a091-9c93b390c191.lovable.app';
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname='send-weekly-digest') THEN PERFORM cron.unschedule('send-weekly-digest'); END IF;
  PERFORM cron.schedule(
    'send-weekly-digest',
    '0 7 * * 1',
    format($f$SELECT net.http_post(url:=%L, headers:='{"Content-Type":"application/json"}'::jsonb, body:='{}'::jsonb)$f$,
           base_url || '/api/public/hooks/send-weekly-digest')
  );

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname='sync-notices-hourly') THEN PERFORM cron.unschedule('sync-notices-hourly'); END IF;
  PERFORM cron.schedule(
    'sync-notices-hourly',
    '0 6-16 * * 1-5',
    format($f$SELECT net.http_post(url:=%L, headers:='{"Content-Type":"application/json"}'::jsonb, body:='{}'::jsonb)$f$,
           base_url || '/api/public/hooks/sync-notices')
  );

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname='weekly-legal-source-freshness') THEN PERFORM cron.unschedule('weekly-legal-source-freshness'); END IF;
  PERFORM cron.schedule(
    'weekly-legal-source-freshness',
    '0 6 * * 1',
    format($f$SELECT net.http_post(url:=%L, headers:='{"Content-Type":"application/json"}'::jsonb, body:='{}'::jsonb)$f$,
           base_url || '/api/public/cron/source-freshness')
  );

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname='extract-prices-daily') THEN PERFORM cron.unschedule('extract-prices-daily'); END IF;
  PERFORM cron.schedule(
    'extract-prices-daily',
    '0 3 * * *',
    format($f$SELECT net.http_post(url:=%L, headers:='{"Content-Type":"application/json"}'::jsonb, body:='{}'::jsonb)$f$,
           base_url || '/api/public/hooks/extract-prices')
  );
END $$;
