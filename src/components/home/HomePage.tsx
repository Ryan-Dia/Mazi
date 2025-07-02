
import { PopularRestaurants } from './PopularRestaurants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, MapPin } from 'lucide-react';

interface HomePageProps {
  onAddRestaurant: () => void;
  onViewMap: () => void;
  onViewFriends: () => void;
}

export const HomePage = ({ onAddRestaurant, onViewMap, onViewFriends }: HomePageProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">맛집 공유</h1>
        <p className="text-gray-600">친구들과 함께 맛집을 공유하고 발견해보세요</p>
      </div>

      {/* 빠른 액션 버튼들 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onAddRestaurant}>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Plus className="h-8 w-8 text-blue-600 mb-2" />
            <h3 className="font-semibold mb-1">맛집 추가</h3>
            <p className="text-sm text-gray-600 text-center">새로운 맛집을 추가해보세요</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onViewMap}>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <MapPin className="h-8 w-8 text-green-600 mb-2" />
            <h3 className="font-semibold mb-1">지도 보기</h3>
            <p className="text-sm text-gray-600 text-center">맛집 위치를 지도에서 확인</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onViewFriends}>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Users className="h-8 w-8 text-purple-600 mb-2" />
            <h3 className="font-semibold mb-1">친구 목록</h3>
            <p className="text-sm text-gray-600 text-center">친구들의 맛집 추천 보기</p>
          </CardContent>
        </Card>
      </div>

      {/* 인기 맛집 섹션 */}
      <PopularRestaurants />
    </div>
  );
};
