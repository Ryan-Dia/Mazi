
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Star } from 'lucide-react';

// 카카오 맵 타입 정의
declare global {
  interface Window {
    kakao: any;
  }
}

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
  view_count: number | null;
  last_viewed_at: string | null;
  popularity_score: number | null;
}

interface ValidRestaurant extends Restaurant {
  latitude: number;
  longitude: number;
}

export const MapView = () => {
  const [restaurants, setRestaurants] = useState<ValidRestaurant[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [loading, setLoading] = useState(true);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);

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

  // 카카오 맵 초기화
  const initializeKakaoMap = () => {
    if (!mapContainer.current || !window.kakao) return;

    const center = userLocation 
      ? new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng)
      : new window.kakao.maps.LatLng(37.5665, 126.978);

    const options = {
      center: center,
      level: 3
    };

    map.current = new window.kakao.maps.Map(mapContainer.current, options);

    // 사용자 위치 마커
    if (userLocation) {
      const userMarkerPosition = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng);
      const userMarker = new window.kakao.maps.Marker({
        position: userMarkerPosition
      });
      userMarker.setMap(map.current);

      const userInfoWindow = new window.kakao.maps.InfoWindow({
        content: '<div style="padding:5px;">내 위치</div>'
      });

      window.kakao.maps.event.addListener(userMarker, 'click', () => {
        userInfoWindow.open(map.current, userMarker);
      });
    }

    // 맛집 마커들
    restaurants.forEach((restaurant) => {
      const markerPosition = new window.kakao.maps.LatLng(restaurant.latitude, restaurant.longitude);
      const marker = new window.kakao.maps.Marker({
        position: markerPosition
      });
      marker.setMap(map.current);

      const distance = userLocation 
        ? calculateDistance(
            userLocation.lat, 
            userLocation.lng, 
            restaurant.latitude, 
            restaurant.longitude
          )
        : null;

      const infoContent = `
        <div style="padding:10px; min-width:200px;">
          <h3 style="margin:0 0 8px 0; font-size:16px; font-weight:bold;">${restaurant.name}</h3>
          <div style="margin-bottom:4px; color:#666; font-size:12px;">
            📍 ${restaurant.location}
          </div>
          <div style="margin-bottom:4px;">
            <span style="background:#f0f0f0; padding:2px 6px; border-radius:4px; font-size:11px;">${restaurant.category}</span>
            ${restaurant.rating ? `<span style="margin-left:8px; color:#f39c12;">⭐ ${restaurant.rating}</span>` : ''}
          </div>
          ${restaurant.description ? `<p style="margin:8px 0 0 0; font-size:12px; color:#666;">${restaurant.description}</p>` : ''}
          ${distance ? `<div style="margin-top:8px; color:#3498db; font-size:11px; font-weight:bold;">거리: ${distance.toFixed(1)}km</div>` : ''}
        </div>
      `;

      const infoWindow = new window.kakao.maps.InfoWindow({
        content: infoContent
      });

      window.kakao.maps.event.addListener(marker, 'click', () => {
        infoWindow.open(map.current, marker);
      });
    });
  };

  // 카카오 맵 스크립트 로드
  useEffect(() => {
    const script = document.createElement('script');
    script.async = true;
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=cde1a70ea261f91eddb64fa7391dfafc&autoload=false`;
    document.head.appendChild(script);

    script.onload = () => {
      window.kakao.maps.load(() => {
        initializeKakaoMap();
      });
    };

    return () => {
      document.head.removeChild(script);
    };
  }, [userLocation, restaurants]);

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

      {/* 카카오 지도 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Navigation className="h-5 w-5 mr-2" />
            맛집 위치 지도
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 w-full rounded-lg overflow-hidden">
            <div ref={mapContainer} style={{ height: '100%', width: '100%' }} />
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
