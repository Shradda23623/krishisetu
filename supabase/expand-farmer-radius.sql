-- =============================================================================
-- Expand delivery radius so demo farmers appear for viewers anywhere in India.
-- Also adds Jalandhar as a farmer location so local testing shows a nearby pin.
-- =============================================================================
-- HOW TO USE:
--   1. Open Supabase Dashboard -> SQL Editor -> New Query
--   2. Paste this entire file, click Run
--   3. Refresh /nearby on your site
-- =============================================================================

-- Bump every farmer's delivery radius to 1500 km (covers most of India from
-- any single point). For a real marketplace you'd keep this small, but for a
-- portfolio demo we want every visitor to see pins.
UPDATE public.profiles p
SET delivery_radius_km = 1500
WHERE EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = p.user_id AND ur.role = 'farmer'
);

-- Place the FIRST farmer in Jalandhar so local visitors (like you) see a
-- nearby pin right at their city. Remove this block if you don't want it.
WITH first_farmer AS (
  SELECT user_id FROM public.user_roles
  WHERE role = 'farmer'
  ORDER BY id
  LIMIT 1
)
UPDATE public.profiles p
SET
  address  = 'Jalandhar, Punjab',
  latitude = 31.3260,
  longitude = 75.5762
FROM first_farmer f
WHERE p.user_id = f.user_id;

-- Verify
SELECT
  p.address,
  p.latitude,
  p.longitude,
  p.delivery_radius_km
FROM public.profiles p
JOIN public.user_roles ur ON ur.user_id = p.user_id
WHERE ur.role = 'farmer';
