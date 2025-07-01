
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Home, Users, MapPin, Plus } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const tabs = [
    { id: 'restaurants', label: '내 맛집', icon: Home },
    { id: 'friends', label: '친구', icon: Users },
    { id: 'map', label: '지도', icon: MapPin },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-around items-center">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <Button
                key={tab.id}
                variant="ghost"
                className={`flex flex-col items-center space-y-1 px-3 py-2 ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`}
                onClick={() => onTabChange(tab.id)}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className="text-xs">{tab.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
