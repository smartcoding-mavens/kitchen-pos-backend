
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Eye, CheckCircle, Clock, Truck } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { cn } from '@/lib/utils';

const Orders = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userRole] = useState<'super_admin' | 'kitchen_owner' | null>('kitchen_owner');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock orders data
  const orders = [
    {
      id: 'ORD-001',
      customer: 'John Smith',
      items: ['Burger Deluxe', 'Fries', 'Coke'],
      amount: 45.50,
      status: 'preparing',
      type: 'Dine-in',
      table: 'T-05',
      time: '12:30 PM',
      phone: '+1 234-567-8900'
    },
    {
      id: 'ORD-002',
      customer: 'Sarah Wilson',
      items: ['Caesar Salad', 'Iced Tea'],
      amount: 23.75,
      status: 'ready',
      type: 'Takeaway',
      table: null,
      time: '12:45 PM',
      phone: '+1 234-567-8901'
    },
    {
      id: 'ORD-003',
      customer: 'Mike Johnson',
      items: ['Steak Medium', 'Mashed Potatoes', 'Wine'],
      amount: 67.20,
      status: 'delivered',
      type: 'Golf Course',
      table: 'Hole 7',
      time: '1:15 PM',
      phone: '+1 234-567-8902'
    },
    {
      id: 'ORD-004',
      customer: 'Emma Davis',
      items: ['Fish & Chips', 'Garden Salad', 'Beer'],
      amount: 89.90,
      status: 'pending',
      type: 'Dine-in',
      table: 'T-12',
      time: '1:30 PM',
      phone: '+1 234-567-8903'
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'delivered': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'preparing': return <Clock className="h-3 w-3" />;
      case 'ready': return <CheckCircle className="h-3 w-3" />;
      case 'delivered': return <Truck className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    console.log(`Updating order ${orderId} to ${newStatus}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar userRole={userRole} isCollapsed={isCollapsed} />
      
      <div className={cn("flex-1 transition-all duration-300", isCollapsed ? "ml-20" : "ml-64")}>
        <TopBar onToggleSidebar={() => setIsCollapsed(!isCollapsed)} userRole={userRole} />
        
        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
            <p className="text-gray-600 mt-2">Track and manage all incoming orders</p>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Search and filter orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search orders by customer name or order ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="preparing">Preparing</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Orders Tabs */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All Orders ({filteredOrders.length})</TabsTrigger>
              <TabsTrigger value="dine-in">Dine-in</TabsTrigger>
              <TabsTrigger value="takeaway">Takeaway</TabsTrigger>
              <TabsTrigger value="golf-course">Golf Course</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <div className="grid gap-4">
                {filteredOrders.map((order) => (
                  <Card key={order.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold">{order.id}</h3>
                              <p className="text-gray-600">{order.customer} • {order.phone}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold">${order.amount}</p>
                              <p className="text-sm text-gray-600">{order.time}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {order.items.map((item, index) => (
                              <Badge key={index} variant="outline">
                                {item}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <Badge className={getStatusColor(order.status)}>
                                {getStatusIcon(order.status)}
                                <span className="ml-1 capitalize">{order.status}</span>
                              </Badge>
                              <Badge variant="secondary">
                                {order.type} {order.table && `• ${order.table}`}
                              </Badge>
                            </div>

                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                              
                              {order.status === 'pending' && (
                                <Button 
                                  size="sm" 
                                  onClick={() => updateOrderStatus(order.id, 'preparing')}
                                >
                                  Start Preparing
                                </Button>
                              )}
                              
                              {order.status === 'preparing' && (
                                <Button 
                                  size="sm" 
                                  onClick={() => updateOrderStatus(order.id, 'ready')}
                                >
                                  Mark Ready
                                </Button>
                              )}
                              
                              {order.status === 'ready' && (
                                <Button 
                                  size="sm" 
                                  onClick={() => updateOrderStatus(order.id, 'delivered')}
                                >
                                  Mark Delivered
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Orders;
