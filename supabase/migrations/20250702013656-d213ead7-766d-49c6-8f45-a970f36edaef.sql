
-- Add view_count and popularity tracking fields to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN view_count INTEGER DEFAULT 0,
ADD COLUMN last_viewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN popularity_score DECIMAL DEFAULT 0;

-- Create index for better performance on popularity queries
CREATE INDEX idx_restaurants_popularity ON public.restaurants(popularity_score DESC, view_count DESC);
CREATE INDEX idx_restaurants_last_viewed ON public.restaurants(last_viewed_at DESC);

-- Insert some dummy data for popular restaurants
INSERT INTO public.restaurants (name, location, category, description, rating, latitude, longitude, user_id, view_count, last_viewed_at, popularity_score) VALUES
('강남 맛집 1', '서울특별시 강남구 역삼동', '한식', '전통 한식의 진수를 맛볼 수 있는 곳', 5, 37.4979, 127.0276, (SELECT id FROM auth.users LIMIT 1), 150, NOW() - INTERVAL '1 hour', 95.5),
('홍대 파스타 하우스', '서울특별시 마포구 홍익로', '이탈리안', '정통 이탈리안 파스타 전문점', 4, 37.5511, 126.9226, (SELECT id FROM auth.users LIMIT 1), 120, NOW() - INTERVAL '2 hours', 88.2),
('신촌 치킨 맛집', '서울특별시 서대문구 신촌동', '치킨', '바삭바삭한 치킨으로 유명한 곳', 5, 37.5595, 126.9378, (SELECT id FROM auth.users LIMIT 1), 200, NOW() - INTERVAL '30 minutes', 92.8),
('명동 불고기집', '서울특별시 중구 명동', '한식', '50년 전통의 불고기 전문점', 4, 37.5636, 126.9834, (SELECT id FROM auth.users LIMIT 1), 180, NOW() - INTERVAL '3 hours', 89.7),
('이태원 멕시칸', '서울특별시 용산구 이태원동', '양식', '정통 멕시칸 요리 전문점', 4, 37.5345, 126.9947, (SELECT id FROM auth.users LIMIT 1), 95, NOW() - INTERVAL '4 hours', 78.3),
('서초 일식당', '서울특별시 서초구 서초동', '일식', '신선한 회와 초밥', 5, 37.4837, 127.0324, (SELECT id FROM auth.users LIMIT 1), 140, NOW() - INTERVAL '1 day', 85.6),
('종로 중식당', '서울특별시 종로구 종로1가', '중식', '깊은 맛의 중국 요리', 4, 37.5701, 126.9830, (SELECT id FROM auth.users LIMIT 1), 110, NOW() - INTERVAL '6 hours', 82.4),
('강북 카페', '서울특별시 강북구 수유동', '카페', '분위기 좋은 로스터리 카페', 4, 37.6389, 127.0254, (SELECT id FROM auth.users LIMIT 1), 75, NOW() - INTERVAL '2 days', 70.1);
