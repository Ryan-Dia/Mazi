
import { PopularRestaurants } from './PopularRestaurants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, MapPin, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface HomePageProps {
  onAddRestaurant: () => void;
  onViewMap: () => void;
  onViewFriends: () => void;
  onAuthRequired: () => void;
}

export const HomePage = ({ onAddRestaurant, onViewMap, onViewFriends, onAuthRequired }: HomePageProps) => {
  const { user } = useAuth();

  const handleAddRestaurant = () => {
    if (!user) {
      onAuthRequired();
      return;
    }
    onAddRestaurant();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">맛집 공유</h1>
        <p className="text-gray-600">친구들과 함께 맛집을 공유하고 발견해보세요</p>
        {!user && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-700 mb-2">로그인하면 맛집을 추가하고 관리할 수 있어요!</p>
            <Button onClick={onAuthRequired} variant="outline">
              <LogIn className="h-4 w-4 mr-2" />
              로그인하기
            </Button>
          </div>
        )}
      </div>

      {/* 빠른 액션 버튼들 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleAddRestaurant}>
          <CardContent className="flex flex-col items-center justify-center p-6">
            {user ? <Plus className="h-8 w-8 text-blue-600 mb-2" /> : <LogIn className="h-8 w-8 text-gray-500 mb-2" />}
            <h3 className="font-semibold mb-1">{user ? '맛집 추가' : '로그인 후 추가'}</h3>
            <p className="text-sm text-gray-600 text-center">
              {user ? '새로운 맛집을 추가해보세요' : '로그인하여 맛집을 추가하세요'}
            </p>
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
