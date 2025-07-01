
import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/navigation/BottomNav';
import { RestaurantList } from '@/components/restaurants/RestaurantList';
import { FriendsList } from '@/components/friends/FriendsList';
import { MapView } from '@/components/map/MapView';

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('restaurants');

  const renderContent = () => {
    switch (activeTab) {
      case 'restaurants':
        return <RestaurantList />;
      case 'friends':
        return <FriendsList />;
      case 'map':
        return <MapView />;
      default:
        return <RestaurantList />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-6 pb-20">
        {renderContent()}
      </main>
      
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};
