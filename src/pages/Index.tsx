import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, DollarSign, BarChart3, Plus, Settings, QrCode } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { testConnection } from '@/lib/supabase';

const Index = () => {
  const { user, profile, loading } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'failed'>('testing');
  const navigate = useNavigate();

  useEffect(() => {
    // Test Supabase connection
    const checkConnection = async () => {
      const isConnected = await testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'failed');
    };
    
    checkConnection();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated
  if (!user || !profile) {
    return null;
  }

  // Mock data - in real app, this would come from Supabase
  const dashboardStats = {
    totalOrders: profile.role === 'super_admin' ? 1245 : 245,
    totalRevenue: profile.role === 'super_admin' ? 124500 : 12450,
    activeKitchens: profile.role === 'super_admin' ? 28 : 1,
    todaysOrders: profile.role === 'super_admin' ? 156 : 45
  };

  const recentOrders = [
    { id: 'ORD-001', customer: 'John Smith', amount: 45.50, status: 'preparing', type: 'Dine-in', table: 'T-05' },
    { id: 'ORD-002', customer: 'Sarah Wilson', amount: 23.75, status: 'ready', type: 'Takeaway', table: null },
    { id: 'ORD-003', customer: 'Mike Johnson', amount: 67.20, status: 'delivered', type: 'Golf Course', table: 'Hole 7' },
    { id: 'ORD-004', customer: 'Emma Davis', amount: 89.90, status: 'pending', type: 'Dine-in', table: 'T-12' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar userRole={profile.role} isCollapsed={isCollapsed} />
      
      <div className={cn("flex-1 transition-all duration-300", isCollapsed ? "ml-20" : "ml-64")}>
        <TopBar onToggleSidebar={() => setIsCollapsed(!isCollapsed)} userRole={profile.role} />
        
        <main className="p-6">
          {/* Connection Status */}
          {connectionStatus === 'failed' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">
                <strong>Database Connection Failed:</strong> Please check your Supabase configuration in the .env file.
              </p>
            </div>
          )}
          
          {connectionStatus === 'connected' && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">
                <strong>Database Connected:</strong> Supabase is working properly.
              </p>
            </div>
          )}

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {profile.full_name}
            </h1>
            <p className="text-gray-600 mt-2">
              {profile.role === 'super_admin' 
                ? 'Manage all kitchens and monitor platform activity'
                : 'Manage your restaurant operations and track performance'
              }
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Logged in as: {user.email} ({profile.role})
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {profile.role === 'super_admin' ? 'Total Platform Orders' : 'Total Orders'}
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  {profile.role === 'super_admin' ? '+18% from last month' : '+12% from last month'}
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {profile.role === 'super_admin' ? 'Platform Revenue' : 'Revenue'}
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${dashboardStats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {profile.role === 'super_admin' ? '+15% from last month' : '+8% from last month'}
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {profile.role === 'super_admin' ? 'Active Kitchens' : 'Today\'s Orders'}
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {profile.role === 'super_admin' ? dashboardStats.activeKitchens : dashboardStats.todaysOrders}
                </div>
                <p className="text-xs text-muted-foreground">
                  {profile.role === 'super_admin' ? '3 new this month' : '+5 from yesterday'}
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {profile.role === 'super_admin' ? 'Total Users' : 'Customers'}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {profile.role === 'super_admin' ? '5,247' : '1,247'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {profile.role === 'super_admin' ? '+28% from last month' : '+23% from last month'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>
                    {profile.role === 'super_admin' 
                      ? 'Latest orders across all kitchens' 
                      : 'Latest orders from your restaurant'
                    }
                  </CardDescription>
                </div>
                <Button onClick={() => navigate('/orders')}>View All</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{order.id}</p>
                        <p className="text-sm text-gray-600">{order.customer}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium">${order.amount}</p>
                        <p className="text-sm text-gray-600">
                          {order.type} {order.table && `• ${order.table}`}
                        </p>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions - Different for each role */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profile.role === 'kitchen_owner' ? (
              <>
                <Card className="cursor-pointer hover:shadow-lg transition-shadow\" onClick={() => navigate('/menu')}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Plus className="mr-2 h-5 w-5" />
                      Manage Menu
                    </CardTitle>
                    <CardDescription>Add, edit, or remove menu items</CardDescription>
                  </CardHeader>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/qr-codes')}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <QrCode className="mr-2 h-5 w-5" />
                      QR Codes
                    </CardTitle>
                    <CardDescription>Generate and manage QR codes for tables</CardDescription>
                  </CardHeader>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/analytics')}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="mr-2 h-5 w-5" />
                      Analytics
                    </CardTitle>
                    <CardDescription>View detailed performance analytics</CardDescription>
                  </CardHeader>
                </Card>
              </>
            ) : (
              <>
                <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/kitchens')}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Building2 className="mr-2 h-5 w-5" />
                      Manage Kitchens
                    </CardTitle>
                    <CardDescription>View and manage all registered kitchens</CardDescription>
                  </CardHeader>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/analytics')}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="mr-2 h-5 w-5" />
                      Platform Analytics
                    </CardTitle>
                    <CardDescription>Monitor platform-wide performance</CardDescription>
                  </CardHeader>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/revenue')}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <DollarSign className="mr-2 h-5 w-5" />
                      Revenue Reports
                    </CardTitle>
                    <CardDescription>Track subscription and commission revenue</CardDescription>
                  </CardHeader>
                </Card>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;