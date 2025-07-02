
-- Create reservations table
CREATE TABLE public.reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  party_size INTEGER NOT NULL CHECK (party_size > 0 AND party_size <= 20),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for reservations
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reservations"
  ON public.reservations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reservations"
  ON public.reservations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reservations"
  ON public.reservations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reservations"
  ON public.reservations FOR DELETE
  USING (auth.uid() = user_id);

-- Update restaurants table with better dummy data and weekly tracking
UPDATE public.restaurants SET 
  view_count = CASE 
    WHEN name = '강남 맛집 1' THEN 250
    WHEN name = '홍대 파스타 하우스' THEN 180
    WHEN name = '신촌 치킨 맛집' THEN 320
    WHEN name = '명동 불고기집' THEN 200
    WHEN name = '이태원 멕시칸' THEN 150
    WHEN name = '서초 일식당' THEN 190
    WHEN name = '종로 중식당' THEN 160
    WHEN name = '강북 카페' THEN 120
    ELSE view_count
  END,
  last_viewed_at = CASE 
    WHEN name = '강남 맛집 1' THEN NOW() - INTERVAL '30 minutes'
    WHEN name = '홍대 파스타 하우스' THEN NOW() - INTERVAL '1 hour'
    WHEN name = '신촌 치킨 맛집' THEN NOW() - INTERVAL '15 minutes'
    WHEN name = '명동 불고기집' THEN NOW() - INTERVAL '2 hours'
    WHEN name = '이태원 멕시칸' THEN NOW() - INTERVAL '3 hours'
    WHEN name = '서초 일식당' THEN NOW() - INTERVAL '1 day'
    WHEN name = '종로 중식당' THEN NOW() - INTERVAL '4 hours'
    WHEN name = '강북 카페' THEN NOW() - INTERVAL '6 hours'
    ELSE last_viewed_at
  END,
  popularity_score = CASE 
    WHEN name = '강남 맛집 1' THEN 98.5
    WHEN name = '홍대 파스타 하우스' THEN 92.8
    WHEN name = '신촌 치킨 맛집' THEN 96.2
    WHEN name = '명동 불고기집' THEN 94.1
    WHEN name = '이태원 멕시칸' THEN 87.6
    WHEN name = '서초 일식당' THEN 89.3
    WHEN name = '종로 중식당' THEN 85.7
    WHEN name = '강북 카페' THEN 82.4
    ELSE popularity_score
  END;

-- Add more dummy restaurants for better ranking display
INSERT INTO public.restaurants (name, location, category, description, rating, latitude, longitude, user_id, view_count, last_viewed_at, popularity_score) 
SELECT 
  '청담 스테이크하우스', '서울특별시 강남구 청담동', '양식', '프리미엄 스테이크 전문점', 5, 37.5276, 127.0471, 
  (SELECT id FROM auth.users LIMIT 1), 280, NOW() - INTERVAL '20 minutes', 99.2
WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1);

INSERT INTO public.restaurants (name, location, category, description, rating, latitude, longitude, user_id, view_count, last_viewed_at, popularity_score) 
SELECT 
  '잠실 디저트카페', '서울특별시 송파구 잠실동', '카페', '인스타 핫플레이스 디저트카페', 4, 37.5133, 127.1022, 
  (SELECT id FROM auth.users LIMIT 1), 190, NOW() - INTERVAL '45 minutes', 91.8
WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1);
