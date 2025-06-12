
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Search, MoreVertical, Eye, Ban, Play, DollarSign } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import Sidebar from '@/components/layout/Sidebar';

const Kitchens = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userRole] = useState<'super_admin' | 'kitchen_owner'>('super_admin');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const mockKitchens = [
    {
      id: 1,
      name: 'The Golf Club Restaurant',
      owner: 'John Smith',
      email: 'john@golfclub.com',
      domain: 'golfclub.teetours.com',
      status: 'active',
      subscription: 'Premium',
      revenue: '$2,450',
      orders: 145,
      joinDate: '2024-01-15'
    },
    {
      id: 2,
      name: 'Sunset Bistro',
      owner: 'Sarah Johnson',
      email: 'sarah@sunset.com',
      domain: 'sunset.teetours.com',
      status: 'active',
      subscription: 'Basic',
      revenue: '$1,230',
      orders: 89,
      joinDate: '2024-02-20'
    },
    {
      id: 3,
      name: 'Mountain View Cafe',
      owner: 'Mike Wilson',
      email: 'mike@mountainview.com',
      domain: 'mountainview.teetours.com',
      status: 'blocked',
      subscription: 'Premium',
      revenue: '$890',
      orders: 45,
      joinDate: '2024-01-08'
    },
    {
      id: 4,
      name: 'Lakeside Grill',
      owner: 'Emma Davis',
      email: 'emma@lakeside.com',
      domain: 'lakeside.teetours.com',
      status: 'active',
      subscription: 'Enterprise',
      revenue: '$3,120',
      orders: 203,
      joinDate: '2023-12-10'
    }
  ];

  const filteredKitchens = mockKitchens.filter(kitchen => {
    const matchesSearch = kitchen.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         kitchen.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         kitchen.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || kitchen.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleProxyLogin = (kitchenId: number) => {
    console.log(`Proxy login to kitchen ${kitchenId}`);
    // Implement proxy login logic
  };

  const handleToggleStatus = (kitchenId: number, currentStatus: string) => {
    console.log(`Toggle status for kitchen ${kitchenId} from ${currentStatus}`);
    // Implement status toggle logic
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar userRole={userRole} isCollapsed={sidebarCollapsed} />
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <TopBar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} userRole={userRole} />
        
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Kitchen Management</h1>
              <p className="text-gray-600">Manage all registered kitchens and restaurants</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Building2 className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Kitchens</p>
                    <p className="text-2xl font-bold">{mockKitchens.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Play className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active</p>
                    <p className="text-2xl font-bold">{mockKitchens.filter(k => k.status === 'active').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Ban className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Blocked</p>
                    <p className="text-2xl font-bold">{mockKitchens.filter(k => k.status === 'blocked').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold">$7,690</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search kitchens, owners, or emails..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Kitchens Table */}
          <Card>
            <CardHeader>
              <CardTitle>Registered Kitchens</CardTitle>
              <CardDescription>Complete list of all kitchens in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredKitchens.map((kitchen) => (
                  <div key={kitchen.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-lg">{kitchen.name}</h3>
                          <Badge variant={kitchen.status === 'active' ? 'default' : 'destructive'}>
                            {kitchen.status === 'active' ? 'Active' : 'Blocked'}
                          </Badge>
                          <Badge variant="outline">{kitchen.subscription}</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Owner:</span> {kitchen.owner}
                          </div>
                          <div>
                            <span className="font-medium">Email:</span> {kitchen.email}
                          </div>
                          <div>
                            <span className="font-medium">Domain:</span> {kitchen.domain}
                          </div>
                          <div>
                            <span className="font-medium">Joined:</span> {kitchen.joinDate}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-2 text-sm">
                          <div>
                            <span className="font-medium text-green-600">Revenue:</span> {kitchen.revenue}
                          </div>
                          <div>
                            <span className="font-medium text-blue-600">Orders:</span> {kitchen.orders}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mt-4 lg:mt-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleProxyLogin(kitchen.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Proxy Login
                        </Button>
                        <Button
                          size="sm"
                          variant={kitchen.status === 'active' ? 'destructive' : 'default'}
                          onClick={() => handleToggleStatus(kitchen.id, kitchen.status)}
                        >
                          {kitchen.status === 'active' ? (
                            <>
                              <Ban className="h-4 w-4 mr-1" />
                              Block
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Kitchens;
