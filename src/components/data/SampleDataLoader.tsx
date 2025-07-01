
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// 샘플 사용자 데이터
const sampleUsers = [
  { email: 'kim@example.com', username: 'kim_foodie', display_name: '김미식가', password: 'password123' },
  { email: 'lee@example.com', username: 'lee_gourmet', display_name: '이맛집러', password: 'password123' },
  { email: 'park@example.com', username: 'park_taste', display_name: '박맛객', password: 'password123' },
];

// 샘플 맛집 데이터 (서울 주요 지역)
const sampleRestaurants = [
  {
    name: '명동교자',
    location: '서울특별시 중구 명동2가 25-2',
    category: '한식',
    description: '50년 전통의 손만두 맛집. 김치만두와 고기만두가 유명합니다.',
    rating: 4.5,
    latitude: 37.5636,
    longitude: 126.9836
  },
  {
    name: '광장시장 빈대떡',
    location: '서울특별시 종로구 예지동 6-1',
    category: '한식',
    description: '광장시장의 대표 음식인 빈대떡과 마약김밥으로 유명한 곳입니다.',
    rating: 4.3,
    latitude: 37.5702,
    longitude: 126.9999
  },
  {
    name: '이태원 케밥',
    location: '서울특별시 용산구 이태원동 119-25',
    category: '터키음식',
    description: '정통 터키식 케밥을 맛볼 수 있는 이태원의 명소입니다.',
    rating: 4.2,
    latitude: 37.5349,
    longitude: 126.9956
  },
  {
    name: '홍대 떡볶이',
    location: '서울특별시 마포구 서교동 357-1',
    category: '분식',
    description: '홍대 앞 젊은이들이 사랑하는 매콤한 떡볶이 맛집입니다.',
    rating: 4.1,
    latitude: 37.5519,
    longitude: 126.9218
  },
  {
    name: '강남 갈비집',
    location: '서울특별시 강남구 역삼동 834-1',
    category: '한식',
    description: '최고급 한우 갈비를 맛볼 수 있는 강남의 프리미엄 갈비집입니다.',
    rating: 4.7,
    latitude: 37.5006,
    longitude: 127.0366
  },
  {
    name: '건대 치킨',
    location: '서울특별시 광진구 화양동 18-11',
    category: '치킨',
    description: '대학생들이 사랑하는 바삭바삭한 치킨과 맥주의 완벽한 조합입니다.',
    rating: 4.0,
    latitude: 37.5404,
    longitude: 127.0698
  },
  {
    name: '종로 순대국',
    location: '서울특별시 종로구 종로1가 24',
    category: '한식',
    description: '새벽까지 운영하는 24시간 순대국집. 해장하기 좋습니다.',
    rating: 4.4,
    latitude: 37.5704,
    longitude: 126.9826
  },
  {
    name: '용산 파스타',
    location: '서울특별시 용산구 한남동 683-152',
    category: '이탈리안',
    description: '한강뷰를 즐기며 먹는 정통 이탈리안 파스타 레스토랑입니다.',
    rating: 4.6,
    latitude: 37.5317,
    longitude: 126.9882
  }
];

export const SampleDataLoader = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const loadSampleData = async () => {
    if (!user) return;

    try {
      // 기존 데이터 확인
      const { data: existingRestaurants } = await supabase
        .from('restaurants')
        .select('id')
        .limit(1);

      const { data: existingProfiles } = await supabase
        .from('profiles')
        .select('id')
        .neq('id', user.id)
        .limit(1);

      // 이미 샘플 데이터가 있으면 리턴
      if (existingRestaurants && existingRestaurants.length > 0 && 
          existingProfiles && existingProfiles.length > 0) {
        return;
      }

      // 샘플 사용자 프로필 생성 (현재 사용자 제외)
      const sampleProfiles = sampleUsers.map(user => ({
        id: crypto.randomUUID(),
        username: user.username,
        display_name: user.display_name,
        created_at: new Date().toISOString()
      }));

      // 프로필 삽입
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(sampleProfiles, { onConflict: 'username' });

      if (profileError) {
        console.error('Error inserting sample profiles:', profileError);
      }

      // 현재 사용자와 샘플 사용자들의 맛집 데이터 생성
      const allUserIds = [user.id, ...sampleProfiles.map(p => p.id)];
      const restaurantData = [];

      // 각 사용자마다 2-3개의 맛집 할당
      for (let i = 0; i < sampleRestaurants.length; i++) {
        const restaurant = sampleRestaurants[i];
        const userId = allUserIds[i % allUserIds.length];
        
        restaurantData.push({
          ...restaurant,
          user_id: userId,
          created_at: new Date().toISOString()
        });
      }

      // 맛집 데이터 삽입
      const { error: restaurantError } = await supabase
        .from('restaurants')
        .insert(restaurantData);

      if (restaurantError) {
        console.error('Error inserting sample restaurants:', restaurantError);
      } else {
        toast({
          title: "환영합니다!",
          description: "샘플 맛집 데이터와 친구들이 추가되었습니다.",
        });
      }

      // 샘플 친구 관계 생성 (현재 사용자와 샘플 사용자들 간)
      const friendshipData = sampleProfiles.slice(0, 2).map(profile => ({
        requester_id: user.id,
        addressee_id: profile.id,
        status: 'accepted',
        created_at: new Date().toISOString()
      }));

      const { error: friendshipError } = await supabase
        .from('friendships')
        .insert(friendshipData);

      if (friendshipError) {
        console.error('Error inserting sample friendships:', friendshipError);
      }

    } catch (error) {
      console.error('Error loading sample data:', error);
    }
  };

  useEffect(() => {
    if (user) {
      // 사용자가 로그인한 후 약간의 지연을 두고 샘플 데이터 로드
      const timer = setTimeout(() => {
        loadSampleData();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [user]);

  return null; // 이 컴포넌트는 UI를 렌더링하지 않음
};
