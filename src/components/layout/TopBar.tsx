import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Menu, User, Crown } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface TopBarProps {
  onToggleSidebar: () => void;
  userRole: 'super_admin' | 'kitchen_owner' | null;
}

const TopBar = ({ onToggleSidebar, userRole }: TopBarProps) => {
  const [notifications] = useState(3);
  const { user, profile } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onToggleSidebar}>
            <Menu className="h-5 w-5" />
          </Button>
          
          {userRole === 'super_admin' && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              <Crown className="h-3 w-3 mr-1" />
              Super Admin
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            {notifications > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center bg-red-500 text-white">
                {notifications}
              </Badge>
            )}
          </Button>

          {/* User Profile */}
          <Button variant="ghost" size="sm" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-left hidden md:block">
              <p className="text-sm font-medium">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-xs text-gray-600">
                {user?.email}
              </p>
            </div>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;