
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Search } from 'lucide-react';

// 카카오 맵 타입 정의
declare global {
  interface Window {
    kakao: any;
  }
}

interface LocationPickerProps {
  onLocationSelect: (location: { address: string; latitude: number; longitude: number }) => void;
  initialLocation?: { address: string; latitude: number; longitude: number };
}

export const LocationPicker = ({ onLocationSelect, initialLocation }: LocationPickerProps) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const marker = useRef<any>(null);

  // 카카오 맵 초기화
  const initializeKakaoMap = () => {
    if (!mapContainer.current || !window.kakao) return;

    const center = selectedLocation 
      ? new window.kakao.maps.LatLng(selectedLocation.latitude, selectedLocation.longitude)
      : new window.kakao.maps.LatLng(37.5665, 126.978);

    const options = {
      center: center,
      level: 3
    };

    map.current = new window.kakao.maps.Map(mapContainer.current, options);

    // 지도 클릭 이벤트
    window.kakao.maps.event.addListener(map.current, 'click', (mouseEvent: any) => {
      const latlng = mouseEvent.latLng;
      
      // 기존 마커 제거
      if (marker.current) {
        marker.current.setMap(null);
      }

      // 새 마커 생성
      marker.current = new window.kakao.maps.Marker({
        position: latlng
      });
      marker.current.setMap(map.current);

      // 좌표로 주소 얻기
      const geocoder = new window.kakao.maps.services.Geocoder();
      geocoder.coord2Address(latlng.getLng(), latlng.getLat(), (result: any, status: any) => {
        if (status === window.kakao.maps.services.Status.OK) {
          const address = result[0].address.address_name;
          const location = {
            address,
            latitude: latlng.getLat(),
            longitude: latlng.getLng()
          };
          setSelectedLocation(location);
          onLocationSelect(location);
        }
      });
    });

    // 초기 마커 설정
    if (selectedLocation) {
      marker.current = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(selectedLocation.latitude, selectedLocation.longitude)
      });
      marker.current.setMap(map.current);
    }

    setIsMapLoaded(true);
  };

  // 주소 검색
  const searchAddress = () => {
    if (!searchKeyword || !window.kakao) return;

    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.addressSearch(searchKeyword, (result: any, status: any) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);

        // 기존 마커 제거
        if (marker.current) {
          marker.current.setMap(null);
        }

        // 새 마커 생성
        marker.current = new window.kakao.maps.Marker({
          position: coords
        });
        marker.current.setMap(map.current);

        // 지도 중심 이동
        map.current.setCenter(coords);

        const location = {
          address: result[0].address_name,
          latitude: parseFloat(result[0].y),
          longitude: parseFloat(result[0].x)
        };
        setSelectedLocation(location);
        onLocationSelect(location);
      } else {
        alert('주소를 찾을 수 없습니다.');
      }
    });
  };

  // 카카오 맵 스크립트 로드
  useEffect(() => {
    const script = document.createElement('script');
    script.async = true;
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=cde1a70ea261f91eddb64fa7391dfafc&autoload=false&libraries=services`;
    document.head.appendChild(script);

    script.onload = () => {
      window.kakao.maps.load(() => {
        initializeKakaoMap();
      });
    };

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="search">주소 검색</Label>
            <div className="flex space-x-2 mt-1">
              <Input
                id="search"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="주소를 입력하세요"
                onKeyPress={(e) => e.key === 'Enter' && searchAddress()}
              />
              <Button onClick={searchAddress} size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label>지도에서 위치 선택</Label>
            <p className="text-sm text-gray-600 mb-2">지도를 클릭하여 위치를 선택하세요</p>
            <div className="h-64 w-full rounded-lg overflow-hidden border">
              <div ref={mapContainer} style={{ height: '100%', width: '100%' }} />
            </div>
          </div>

          {selectedLocation && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 text-blue-600 mr-2" />
                <div>
                  <p className="font-medium">선택된 위치</p>
                  <p className="text-sm text-gray-600">{selectedLocation.address}</p>
                  <p className="text-xs text-gray-500">
                    위도: {selectedLocation.latitude.toFixed(6)}, 경도: {selectedLocation.longitude.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
