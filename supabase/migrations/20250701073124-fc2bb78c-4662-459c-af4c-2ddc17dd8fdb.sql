
-- Add latitude and longitude columns to the restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN latitude DOUBLE PRECISION,
ADD COLUMN longitude DOUBLE PRECISION;

-- Set default coordinates for Seoul for existing restaurants
UPDATE public.restaurants 
SET latitude = 37.5665, longitude = 126.978 
WHERE latitude IS NULL OR longitude IS NULL;
