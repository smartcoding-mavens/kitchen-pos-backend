import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Home, 
  ShoppingBag, 
  Users, 
  BarChart3, 
  Settings, 
  QrCode, 
  Building2, 
  DollarSign,
  Clock,
  UserCheck,
  Crown,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/supabase';

interface SidebarProps {
  userRole: 'super_admin' | 'kitchen_owner' | null;
  isCollapsed: boolean;
}

const Sidebar = ({ userRole, isCollapsed }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: clear localStorage and navigate
      localStorage.clear();
      navigate('/login');
      window.location.reload();
    }
  };

  const kitchenOwnerNavItems = [
    { icon: Home, label: 'Dashboard', href: '/' },
    { icon: ShoppingBag, label: 'Orders', href: '/orders' },
    { icon: BarChart3, label: 'Menu Management', href: '/menu' },
    { icon: QrCode, label: 'QR Codes', href: '/qr-codes' },
    { icon: Users, label: 'Customers', href: '/customers' },
    { icon: BarChart3, label: 'Analytics', href: '/analytics' },
    { icon: Clock, label: 'Schedule', href: '/schedule' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ];

  const superAdminNavItems = [
    { icon: Home, label: 'Dashboard', href: '/' },
    { icon: Building2, label: 'Kitchens', href: '/kitchens' },
    { icon: DollarSign, label: 'Revenue', href: '/revenue' },
    { icon: Users, label: 'Users', href: '/users' },
    { icon: UserCheck, label: 'Proxy Login', href: '/proxy-login' },
    { icon: BarChart3, label: 'Analytics', href: '/analytics' },
    { icon: Settings, label: 'Global Settings', href: '/global-settings' },
  ];

  const navItems = userRole === 'super_admin' ? superAdminNavItems : kitchenOwnerNavItems;

  return (
    <div className={cn(
      "fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-50",
      isCollapsed ? "w-20" : "w-64"
    )}>
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          {userRole === 'super_admin' && <Crown className="h-8 w-8 text-yellow-600 mr-3" />}
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {userRole === 'super_admin' ? 'Super Admin' : 'Tee Tours POS'}
              </h1>
              <p className="text-sm text-gray-600">
                {userRole === 'super_admin' ? 'Platform Control' : 'Admin Panel'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors",
                isActive && "bg-blue-50 text-blue-700 border border-blue-200",
                isCollapsed && "justify-center"
              )}
            >
              <Icon className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Actions */}
      <div className="absolute bottom-4 left-4 right-4">
        <Button 
          variant="ghost" 
          className={cn(
            "w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50",
            isCollapsed && "justify-center px-0"
          )}
          onClick={handleLogout}
        >
          <LogOut className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
          {!isCollapsed && "Sign Out"}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;