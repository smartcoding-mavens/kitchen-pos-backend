
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, TrendingDown, Users, DollarSign, ShoppingBag } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import Sidebar from '@/components/layout/Sidebar';
import { useState } from 'react';

const Analytics = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userRole] = useState<'super_admin' | 'kitchen_owner'>('kitchen_owner');

  const mockAnalytics = {
    revenue: {
      total: '$12,450',
      change: '+12.5%',
      trend: 'up'
    },
    orders: {
      total: '245',
      change: '+8.2%',
      trend: 'up'
    },
    customers: {
      total: '189',
      change: '-2.1%',
      trend: 'down'
    },
    avgOrder: {
      total: '$51.84',
      change: '+5.7%',
      trend: 'up'
    }
  };

  const mockOrderTypes = [
    { type: 'Dine-in', count: 145, percentage: 59 },
    { type: 'Takeaway', count: 65, percentage: 27 },
    { type: 'Golf Course Delivery', count: 35, percentage: 14 }
  ];

  const mockPopularItems = [
    { name: 'Golf Course Burger', orders: 45, revenue: '$675' },
    { name: 'Club Sandwich', orders: 38, revenue: '$456' },
    { name: 'Caesar Salad', orders: 32, revenue: '$384' },
    { name: 'Fish & Chips', orders: 28, revenue: '$420' },
    { name: 'Craft Beer', orders: 52, revenue: '$312' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar userRole={userRole} isCollapsed={sidebarCollapsed} />
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <TopBar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} userRole={userRole} />
        
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600">Track your restaurant performance and insights</p>
            </div>
            <Select defaultValue="7days">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockAnalytics.revenue.total}</div>
                <Badge variant={mockAnalytics.revenue.trend === 'up' ? 'default' : 'destructive'} className="text-xs">
                  {mockAnalytics.revenue.trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {mockAnalytics.revenue.change}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockAnalytics.orders.total}</div>
                <Badge variant={mockAnalytics.orders.trend === 'up' ? 'default' : 'destructive'} className="text-xs">
                  {mockAnalytics.orders.trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {mockAnalytics.orders.change}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockAnalytics.customers.total}</div>
                <Badge variant={mockAnalytics.customers.trend === 'up' ? 'default' : 'destructive'} className="text-xs">
                  {mockAnalytics.customers.trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {mockAnalytics.customers.change}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockAnalytics.avgOrder.total}</div>
                <Badge variant={mockAnalytics.avgOrder.trend === 'up' ? 'default' : 'destructive'} className="text-xs">
                  {mockAnalytics.avgOrder.trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {mockAnalytics.avgOrder.change}
                </Badge>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Types Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Order Types Distribution</CardTitle>
                <CardDescription>Breakdown of orders by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockOrderTypes.map((type) => (
                    <div key={type.type} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{type.type}</div>
                        <div className="text-sm text-gray-500">{type.count} orders</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${type.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{type.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Popular Items */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Items</CardTitle>
                <CardDescription>Top selling menu items</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockPopularItems.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.orders} orders</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{item.revenue}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
