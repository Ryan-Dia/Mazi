
import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/navigation/BottomNav';
import { RestaurantList } from '@/components/restaurants/RestaurantList';
import { FriendsList } from '@/components/friends/FriendsList';
import { MapView } from '@/components/map/MapView';
import { HomePage } from '@/components/home/HomePage';
import { AuthPage } from '@/components/auth/AuthPage';

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [showAuth, setShowAuth] = useState(false);

  const handleAuthRequired = () => {
    setShowAuth(true);
  };

  const handleAuthSuccess = () => {
    setShowAuth(false);
  };

  const renderContent = () => {
    if (showAuth) {
      return (
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-full max-w-md">
            <AuthPage onSuccess={handleAuthSuccess} />
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'home':
        return (
          <HomePage 
            onAddRestaurant={() => setActiveTab('restaurants')}
            onViewMap={() => setActiveTab('map')}
            onViewFriends={() => setActiveTab('friends')}
            onAuthRequired={handleAuthRequired}
          />
        );
      case 'restaurants':
        return <RestaurantList onAuthRequired={handleAuthRequired} />;
      case 'friends':
        return <FriendsList />;
      case 'map':
        return <MapView />;
      default:
        return (
          <HomePage 
            onAddRestaurant={() => setActiveTab('restaurants')}
            onViewMap={() => setActiveTab('map')}
            onViewFriends={() => setActiveTab('friends')}
            onAuthRequired={handleAuthRequired}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onAuthRequired={handleAuthRequired} />
      
      <main className="max-w-7xl mx-auto px-4 py-6 pb-20">
        {renderContent()}
      </main>
      
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};
