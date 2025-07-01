
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, UserPlus, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
}

interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  requester?: Profile;
  addressee?: Profile;
}

export const FriendsList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchFriendships = async () => {
    try {
      // 간단한 조회 후 프로필 정보를 별도로 가져오기
      const { data: simpleFriendships, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`requester_id.eq.${user?.id},addressee_id.eq.${user?.id}`);
      
      if (error) throw error;
      
      // 프로필 정보를 별도로 가져오기
      const userIds = new Set<string>();
      simpleFriendships?.forEach(f => {
        userIds.add(f.requester_id);
        userIds.add(f.addressee_id);
      });
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', Array.from(userIds));
      
      const profileMap = new Map<string, Profile>();
      profileData?.forEach(p => profileMap.set(p.id, p));
      
      const enrichedFriendships = simpleFriendships?.map(f => ({
        ...f,
        requester: profileMap.get(f.requester_id) || { id: f.requester_id, username: 'Unknown', display_name: 'Unknown' },
        addressee: profileMap.get(f.addressee_id) || { id: f.addressee_id, username: 'Unknown', display_name: 'Unknown' }
      })) || [];
      
      setFriendships(enrichedFriendships);
    } catch (error) {
      console.error('Error fetching friendships:', error);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id);

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFriendships();
      fetchProfiles();
    }
  }, [user]);

  const sendFriendRequest = async (addresseeId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .insert([{
          requester_id: user?.id,
          addressee_id: addresseeId,
          status: 'pending'
        }]);

      if (error) throw error;

      toast({
        title: "성공",
        description: "친구 요청을 보냈습니다.",
      });

      fetchFriendships();
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: "오류",
        description: "친구 요청에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const respondToFriendRequest = async (friendshipId: string, status: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status })
        .eq('id', friendshipId);

      if (error) throw error;

      toast({
        title: "성공",
        description: status === 'accepted' ? "친구 요청을 수락했습니다." : "친구 요청을 거절했습니다.",
      });

      fetchFriendships();
    } catch (error) {
      console.error('Error responding to friend request:', error);
      toast({
        title: "오류",
        description: "응답에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (friendship: Friendship) => {
    const isRequester = friendship.requester_id === user?.id;
    
    switch (friendship.status) {
      case 'pending':
        return (
          <Badge variant={isRequester ? "secondary" : "default"}>
            {isRequester ? '대기중' : '승인 필요'}
          </Badge>
        );
      case 'accepted':
        return <Badge variant="default" className="bg-green-100 text-green-800">친구</Badge>;
      case 'rejected':
        return <Badge variant="destructive">거절됨</Badge>;
      default:
        return null;
    }
  };

  const getFriendProfile = (friendship: Friendship) => {
    return friendship.requester_id === user?.id ? friendship.addressee : friendship.requester;
  };

  const existingFriendship = (profileId: string) => {
    return friendships.find(f => 
      (f.requester_id === user?.id && f.addressee_id === profileId) ||
      (f.addressee_id === user?.id && f.requester_id === profileId)
    );
  };

  const filteredProfiles = profiles.filter(profile => 
    profile.username.toLowerCase().includes(searchEmail.toLowerCase()) ||
    (profile.display_name && profile.display_name.toLowerCase().includes(searchEmail.toLowerCase()))
  );

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
        <Users className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">친구 관리</h2>
      </div>

      {/* 친구 찾기 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="h-5 w-5 mr-2" />
            친구 찾기
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              placeholder="이름 또는 사용자명으로 검색"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
            />
            
            <div className="grid gap-3">
              {filteredProfiles.map((profile) => {
                const friendship = existingFriendship(profile.id);
                
                return (
                  <div key={profile.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {profile.display_name?.[0] || profile.username[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{profile.display_name || profile.username}</p>
                        <p className="text-sm text-gray-500">@{profile.username}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {friendship ? (
                        getStatusBadge(friendship)
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => sendFriendRequest(profile.id)}
                        >
                          친구 요청
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 친구 요청 */}
      <Card>
        <CardHeader>
          <CardTitle>받은 친구 요청</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {friendships
              .filter(f => f.addressee_id === user?.id && f.status === 'pending')
              .map((friendship) => {
                const requester = friendship.requester;
                if (!requester) return null;
                
                return (
                  <div key={friendship.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {requester.display_name?.[0] || requester.username[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{requester.display_name || requester.username}</p>
                        <p className="text-sm text-gray-500">@{requester.username}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => respondToFriendRequest(friendship.id, 'accepted')}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => respondToFriendRequest(friendship.id, 'rejected')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            
            {friendships.filter(f => f.addressee_id === user?.id && f.status === 'pending').length === 0 && (
              <p className="text-gray-500 text-center py-4">받은 친구 요청이 없습니다.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 내 친구 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>내 친구</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {friendships
              .filter(f => f.status === 'accepted')
              .map((friendship) => {
                const friend = getFriendProfile(friendship);
                if (!friend) return null;
                
                return (
                  <div key={friendship.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback className="bg-green-100 text-green-600">
                          {friend.display_name?.[0] || friend.username[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{friend.display_name || friend.username}</p>
                        <p className="text-sm text-gray-500">@{friend.username}</p>
                      </div>
                    </div>
                    
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      친구
                    </Badge>
                  </div>
                );
              })}
            
            {friendships.filter(f => f.status === 'accepted').length === 0 && (
              <p className="text-gray-500 text-center py-4">아직 친구가 없습니다.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
