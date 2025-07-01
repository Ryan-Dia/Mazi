
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Star } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet 아이콘 설정
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Restaurant {
  id: string;
  name: string;
  location: string;
  category: string;
  description: string | null;
  rating: number | null;
  latitude: number | null;
  longitude: number | null;
  user_id: string;
  created_at: string | null;
  updated_at: string | null;
  image_url: string | null;
}

interface ValidRestaurant extends Restaurant {
  latitude: number;
  longitude: number;
}

export const MapView = () => {
  const [restaurants, setRestaurants] = useState<ValidRestaurant[]>([]);
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
      
      // 타입 안전성을 위해 latitude, longitude가 있는 것만 필터링
      const validRestaurants = (data || []).filter(
        (restaurant): restaurant is ValidRestaurant => 
          restaurant.latitude !== null && 
          restaurant.longitude !== null &&
          typeof restaurant.latitude === 'number' &&
          typeof restaurant.longitude === 'number'
      );
      
      setRestaurants(validRestaurants);
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

  const center: LatLngExpression = userLocation ? [userLocation.lat, userLocation.lng] : [37.5665, 126.978];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <MapPin className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">맛집 지도</h2>
      </div>

      {/* 실제 지도 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Navigation className="h-5 w-5 mr-2" />
            맛집 위치 지도
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 w-full rounded-lg overflow-hidden">
            <MapContainer
              center={center}
              zoom={13}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {/* 사용자 위치 마커 */}
              {userLocation && (
                <Marker position={[userLocation.lat, userLocation.lng]}>
                  <Popup>
                    <div className="text-center">
                      <strong>내 위치</strong>
                    </div>
                  </Popup>
                </Marker>
              )}
              
              {/* 맛집 마커들 */}
              {restaurants.map((restaurant) => (
                <Marker 
                  key={restaurant.id} 
                  position={[restaurant.latitude, restaurant.longitude]}
                >
                  <Popup>
                    <div className="min-w-48">
                      <h3 className="font-semibold text-lg mb-2">{restaurant.name}</h3>
                      <div className="space-y-1">
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
                          <p className="text-sm text-gray-600 mt-2">
                            {restaurant.description}
                          </p>
                        )}
                        {userLocation && (
                          <div className="text-xs text-blue-600 font-medium mt-2">
                            거리: {calculateDistance(
                              userLocation.lat, 
                              userLocation.lng, 
                              restaurant.latitude, 
                              restaurant.longitude
                            ).toFixed(1)}km
                          </div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* 맛집 리스트 */}
      <Card>
        <CardHeader>
          <CardTitle>맛집 목록</CardTitle>
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
    </div>
  );
};
