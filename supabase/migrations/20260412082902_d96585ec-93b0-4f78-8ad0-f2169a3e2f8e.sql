
ALTER TABLE public.profiles
ADD COLUMN latitude double precision,
ADD COLUMN longitude double precision,
ADD COLUMN delivery_radius_km double precision DEFAULT 10;
