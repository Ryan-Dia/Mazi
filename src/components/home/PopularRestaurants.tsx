
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Clock, Star, MapPin, Eye } from 'lucide-react';

interface PopularRestaurant {
  id: string;
  name: string;
  location: string;
  category: string;
  rating: number | null;
  view_count: number | null;
  popularity_score: number | null;
  last_viewed_at: string | null;
}

export const PopularRestaurants = () => {
  const [dailyPopular, setDailyPopular] = useState<PopularRestaurant[]>([]);
  const [monthlyPopular, setMonthlyPopular] = useState<PopularRestaurant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPopularRestaurants = async () => {
    try {
      // 일일 인기 맛집 (24시간 이내 조회된 것 중 상위 5개)
      const { data: dailyData, error: dailyError } = await supabase
        .from('restaurants')
        .select('*')
        .gte('last_viewed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('view_count', { ascending: false })
        .limit(5);

      if (dailyError) throw dailyError;

      // 월간 인기 맛집 (인기 점수 기준 상위 5개)
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('restaurants')
        .select('*')
        .order('popularity_score', { ascending: false })
        .limit(5);

      if (monthlyError) throw monthlyError;

      setDailyPopular(dailyData || []);
      setMonthlyPopular(monthlyData || []);
    } catch (error) {
      console.error('Error fetching popular restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPopularRestaurants();
  }, []);

  const RestaurantCard = ({ restaurant, rank }: { restaurant: PopularRestaurant; rank: number }) => (
    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border hover:shadow-md transition-shadow">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
          {rank}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{restaurant.name}</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{restaurant.location}</span>
        </div>
        <div className="flex items-center space-x-2 mt-1">
          <Badge variant="secondary" className="text-xs">{restaurant.category}</Badge>
          {restaurant.rating && (
            <div className="flex items-center">
              <Star className="h-3 w-3 text-yellow-400 fill-current" />
              <span className="text-xs font-medium ml-1">{restaurant.rating}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end text-xs text-gray-500">
        {restaurant.view_count && (
          <div className="flex items-center">
            <Eye className="h-3 w-3 mr-1" />
            {restaurant.view_count}
          </div>
        )}
        {restaurant.popularity_score && (
          <div className="text-blue-600 font-medium">
            {restaurant.popularity_score.toFixed(1)}
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            인기 맛집
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">로딩 중...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          인기 맛집
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="daily" className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              일일 TOP 5
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              월간 TOP 5
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily" className="mt-4">
            <div className="space-y-3">
              {dailyPopular.length > 0 ? (
                dailyPopular.map((restaurant, index) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    rank={index + 1}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  오늘 조회된 맛집이 없습니다.
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="monthly" className="mt-4">
            <div className="space-y-3">
              {monthlyPopular.length > 0 ? (
                monthlyPopular.map((restaurant, index) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    rank={index + 1}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  인기 맛집이 없습니다.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
