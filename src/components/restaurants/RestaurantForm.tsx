
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

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

interface RestaurantFormProps {
  restaurant?: Restaurant | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const RestaurantForm = ({ restaurant, onSuccess, onCancel }: RestaurantFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    location: '',
    category: '',
    description: '',
    rating: 5,
    latitude: 0,
    longitude: 0
  });

  useEffect(() => {
    if (restaurant) {
      setForm({
        name: restaurant.name,
        location: restaurant.location,
        category: restaurant.category,
        description: restaurant.description || '',
        rating: restaurant.rating || 5,
        latitude: restaurant.latitude || 0,
        longitude: restaurant.longitude || 0
      });
    }
  }, [restaurant]);

  const getCoordinates = async (address: string) => {
    try {
      // Using a free geocoding service
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        };
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return { latitude: 37.5665, longitude: 126.978 }; // Default to Seoul
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get coordinates for the location
      const coordinates = await getCoordinates(form.location);
      
      const restaurantData = {
        name: form.name,
        location: form.location,
        category: form.category,
        description: form.description,
        rating: form.rating,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        user_id: user?.id
      };

      let error;
      if (restaurant) {
        ({ error } = await supabase
          .from('restaurants')
          .update(restaurantData)
          .eq('id', restaurant.id));
      } else {
        ({ error } = await supabase
          .from('restaurants')
          .insert([restaurantData]));
      }

      if (error) throw error;

      toast({
        title: "성공",
        description: restaurant ? "맛집이 수정되었습니다." : "맛집이 추가되었습니다.",
      });

      onSuccess();
    } catch (error) {
      console.error('Error saving restaurant:', error);
      toast({
        title: "오류",
        description: "맛집 저장에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{restaurant ? '맛집 수정' : '맛집 추가'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">맛집 이름</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
              placeholder="맛집 이름을 입력하세요"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">주소</Label>
            <Input
              id="location"
              value={form.location}
              onChange={(e) => setForm({...form, location: e.target.value})}
              placeholder="주소를 입력하세요"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">카테고리</Label>
            <Select value={form.category} onValueChange={(value) => setForm({...form, category: value})}>
              <SelectTrigger>
                <SelectValue placeholder="카테고리를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="한식">한식</SelectItem>
                <SelectItem value="중식">중식</SelectItem>
                <SelectItem value="일식">일식</SelectItem>
                <SelectItem value="양식">양식</SelectItem>
                <SelectItem value="이탈리안">이탈리안</SelectItem>
                <SelectItem value="터키음식">터키음식</SelectItem>
                <SelectItem value="분식">분식</SelectItem>
                <SelectItem value="치킨">치킨</SelectItem>
                <SelectItem value="피자">피자</SelectItem>
                <SelectItem value="카페">카페</SelectItem>
                <SelectItem value="기타">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rating">평점</Label>
            <Select value={form.rating.toString()} onValueChange={(value) => setForm({...form, rating: parseInt(value)})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">⭐ 1점</SelectItem>
                <SelectItem value="2">⭐⭐ 2점</SelectItem>
                <SelectItem value="3">⭐⭐⭐ 3점</SelectItem>
                <SelectItem value="4">⭐⭐⭐⭐ 4점</SelectItem>
                <SelectItem value="5">⭐⭐⭐⭐⭐ 5점</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
              placeholder="맛집에 대한 설명을 입력하세요"
              rows={3}
            />
          </div>

          <div className="flex space-x-2">
            <Button type="submit" disabled={loading}>
              {loading ? '저장 중...' : restaurant ? '수정' : '추가'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              취소
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
