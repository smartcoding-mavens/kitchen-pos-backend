
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, Building2, CreditCard, Download } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { cn } from '@/lib/utils';

const Revenue = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [timeFilter, setTimeFilter] = useState('this_month');

  // Mock revenue data
  const revenueStats = {
    totalRevenue: 45690,
    subscriptionRevenue: 38900,
    commissionRevenue: 6790,
    activeSubscriptions: 28
  };

  const subscriptionPlans = [
    { plan: 'Basic', price: 299, active: 15, revenue: 4485 },
    { plan: 'Pro', price: 599, active: 10, revenue: 5990 },
    { plan: 'Enterprise', price: 999, active: 3, revenue: 2997 }
  ];

  const recentTransactions = [
    { id: 'TXN-001', kitchen: 'The Golf Club Restaurant', plan: 'Pro', amount: 599, status: 'paid', date: '2024-01-15' },
    { id: 'TXN-002', kitchen: 'Sunrise Cafe', plan: 'Basic', amount: 299, status: 'paid', date: '2024-01-14' },
    { id: 'TXN-003', kitchen: 'Ocean View Bistro', plan: 'Enterprise', amount: 999, status: 'paid', date: '2024-01-13' },
    { id: 'TXN-004', kitchen: 'Mountain Peak Grill', plan: 'Pro', amount: 599, status: 'pending', date: '2024-01-12' },
    { id: 'TXN-005', kitchen: 'City Center Kitchen', plan: 'Basic', amount: 299, status: 'failed', date: '2024-01-11' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar userRole="super_admin" isCollapsed={isCollapsed} />
      
      <div className={cn("flex-1 transition-all duration-300", isCollapsed ? "ml-20" : "ml-64")}>
        <TopBar onToggleSidebar={() => setIsCollapsed(!isCollapsed)} userRole="super_admin" />
        
        <main className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Revenue Management</h1>
              <p className="text-gray-600 mt-2">Monitor subscription revenue and platform earnings</p>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="this_week">This Week</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="this_year">This Year</SelectItem>
                </SelectContent>
              </Select>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Revenue Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${revenueStats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subscription Revenue</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${revenueStats.subscriptionRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+8% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Commission Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${revenueStats.commissionRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+18% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{revenueStats.activeSubscriptions}</div>
                <p className="text-xs text-muted-foreground">+3 new this month</p>
              </CardContent>
            </Card>
          </div>

          {/* Subscription Plans */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Subscription Plans Performance</CardTitle>
              <CardDescription>Revenue breakdown by subscription plans</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subscriptionPlans.map((plan) => (
                  <div key={plan.plan} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{plan.plan} Plan</p>
                        <p className="text-sm text-gray-600">${plan.price}/month per kitchen</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Active</p>
                        <p className="font-medium">{plan.active}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Monthly Revenue</p>
                        <p className="font-medium">${plan.revenue.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest subscription payments and renewals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{transaction.id}</p>
                        <p className="text-sm text-gray-600">{transaction.kitchen}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Plan</p>
                        <p className="font-medium">{transaction.plan}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Amount</p>
                        <p className="font-medium">${transaction.amount}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Date</p>
                        <p className="font-medium">{transaction.date}</p>
                      </div>
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Revenue;
