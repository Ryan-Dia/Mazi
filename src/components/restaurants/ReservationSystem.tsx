
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CalendarDays, Clock, Users, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ReservationSystemProps {
  restaurantId: string;
  restaurantName: string;
}

interface Reservation {
  id: string;
  restaurant_id: string;
  user_id: string;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  status: string;
  created_at: string;
}

const timeSlots = [
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
];

const partySizes = [1, 2, 3, 4, 5, 6, 7, 8];

export const ReservationSystem = ({ restaurantId, restaurantName }: ReservationSystemProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [partySize, setPartySize] = useState<number>(2);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReservations = async () => {
    if (!selectedDate) return;

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // 선택된 날짜의 모든 예약 조회
      const { data: allReservations, error: allError } = await supabase
        .from('reservations')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('reservation_date', dateStr)
        .eq('status', 'confirmed');

      if (allError) throw allError;
      setReservations(allReservations || []);

      // 내 예약 조회
      if (user) {
        const { data: userReservations, error: userError } = await supabase
          .from('reservations')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (userError) throw userError;
        setMyReservations(userReservations || []);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchReservations();
    }
  }, [selectedDate, restaurantId, user]);

  const isTimeSlotAvailable = (time: string) => {
    const reservedSlots = reservations.filter(r => r.reservation_time === time);
    return reservedSlots.length < 3; // 시간대별 최대 3팀 예약 가능
  };

  const makeReservation = async () => {
    if (!user || !selectedDate || !selectedTime) {
      toast({
        title: "오류",
        description: "모든 정보를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const reservationData = {
        restaurant_id: restaurantId,
        user_id: user.id,
        reservation_date: format(selectedDate, 'yyyy-MM-dd'),
        reservation_time: selectedTime,
        party_size: partySize,
        status: 'confirmed'
      };

      const { error } = await supabase
        .from('reservations')
        .insert([reservationData]);

      if (error) throw error;

      toast({
        title: "예약 완료",
        description: `${format(selectedDate, 'M월 d일', { locale: ko })} ${selectedTime}에 ${partySize}명으로 예약이 완료되었습니다.`,
      });

      setSelectedTime('');
      fetchReservations();
    } catch (error) {
      console.error('Error making reservation:', error);
      toast({
        title: "오류",
        description: "예약에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelReservation = async (reservationId: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', reservationId);

      if (error) throw error;

      toast({
        title: "예약 취소",
        description: "예약이 취소되었습니다.",
      });

      fetchReservations();
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      toast({
        title: "오류",
        description: "예약 취소에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarDays className="h-5 w-5 mr-2" />
            {restaurantName} 예약
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 날짜 선택 */}
          <div>
            <h3 className="text-sm font-medium mb-2">날짜 선택</h3>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date() || date < new Date(Date.now() - 86400000)}
              className="rounded-md border"
            />
          </div>

          {selectedDate && (
            <>
              {/* 시간 선택 */}
              <div>
                <h3 className="text-sm font-medium mb-2">시간 선택</h3>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((time) => {
                    const available = isTimeSlotAvailable(time);
                    return (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
                        disabled={!available}
                        onClick={() => setSelectedTime(time)}
                        className="text-xs"
                      >
                        {time}
                        {!available && <span className="ml-1 text-red-500">×</span>}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* 인원 선택 */}
              <div>
                <h3 className="text-sm font-medium mb-2">인원 선택</h3>
                <Select value={partySize.toString()} onValueChange={(value) => setPartySize(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {partySizes.map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}명
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 예약 버튼 */}
              <Button 
                onClick={makeReservation} 
                disabled={!selectedTime || loading}
                className="w-full"
              >
                <Clock className="h-4 w-4 mr-2" />
                {loading ? '예약 중...' : '예약하기'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* 내 예약 목록 */}
      {myReservations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              내 예약 목록
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myReservations.filter(r => r.status === 'confirmed').map((reservation) => (
                <div key={reservation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">
                      {format(new Date(reservation.reservation_date), 'M월 d일', { locale: ko })} {reservation.reservation_time}
                    </div>
                    <div className="text-sm text-gray-500">
                      {reservation.party_size}명
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      <Check className="h-3 w-3 mr-1" />
                      확정
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelReservation(reservation.id)}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
