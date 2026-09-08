ALTER TABLE public.producers 
ADD COLUMN IF NOT EXISTS notification_prefs jsonb DEFAULT '{"new_tasting_request": true, "booking_reminders": true, "conversion_alerts": true, "weekly_summary": false}'::jsonb;
