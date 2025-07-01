
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Star } from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  location: string;
  category: string;
  description: string;
  rating: number;
  latitude: number;
  longitude: number;
  user_id: string;
}

export const MapView = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to Seoul if geolocation fails
          setUserLocation({ lat: 37.5665, lng: 126.978 });
        }
      );
    } else {
      setUserLocation({ lat: 37.5665, lng: 126.978 });
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  useEffect(() => {
    fetchRestaurants();
    getUserLocation();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <MapPin className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">맛집 지도</h2>
      </div>

      {/* 지도 영역 (간단한 리스트 형태로 표시) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Navigation className="h-5 w-5 mr-2" />
            내 주변 맛집
            {userLocation && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                현재 위치: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {restaurants.map((restaurant) => {
              const distance = userLocation 
                ? calculateDistance(
                    userLocation.lat, 
                    userLocation.lng, 
                    restaurant.latitude, 
                    restaurant.longitude
                  )
                : null;

              return (
                <div key={restaurant.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{restaurant.name}</h3>
                    {distance && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {distance.toFixed(1)}km
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-3 w-3 mr-1" />
                      {restaurant.location}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{restaurant.category}</Badge>
                      {restaurant.rating && (
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="ml-1 text-sm font-medium">{restaurant.rating}</span>
                        </div>
                      )}
                    </div>
                    
                    {restaurant.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {restaurant.description}
                      </p>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      좌표: {restaurant.latitude.toFixed(4)}, {restaurant.longitude.toFixed(4)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {restaurants.length === 0 && (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">지도에 표시할 맛집이 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 실제 프로덕션에서는 여기에 Leaflet이나 Google Maps를 통합할 수 있습니다 */}
      <Card>
        <CardHeader>
          <CardTitle>지도 통합 안내</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            실제 지도 기능을 위해서는 Leaflet이나 Google Maps API를 통합하여 
            맛집 위치를 시각적으로 표시할 수 있습니다. 현재는 거리 계산과 좌표 정보를 
            리스트 형태로 제공하고 있습니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
